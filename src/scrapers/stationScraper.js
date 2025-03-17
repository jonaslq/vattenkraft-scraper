// stationScraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const { createWorker } = require('tesseract.js');
const { log, debugLog } = require('../utils/logger');
const Station = require('../models/Station');
const { DateTime } = require('luxon');

async function createWorkerInstance() {
  try {
    const worker = await createWorker('eng', 1, {
      logger: m => debugLog(`OCR: ${m.status} ${m.progress}`)
    });

    await worker.setParameters({
      tessedit_char_whitelist: '0123456789.,:- '
    });

    debugLog('OCR worker initialized');
    return worker;
  } catch (error) {
    log(`Failed to initialize OCR worker: ${error.message}`);
    throw error;
  }
}

async function ocrImage(base64Image, worker) {
  try {
    const {
      data: { text },
    } = await worker.recognize(base64Image);
    return text.trim();
  } catch (error) {
    return null;
  }
}

function cleanOCRText(text) {
  return text
    .replace(/[^\d\s.:-]/g, '') // Keep only numbers, dots, colons, hyphens
    .trim();
}

function parseNumber(text) {
  if (!text) return null;
  const match = text.match(/[\d.,-]+/);
  if (match) {
    let cleanedText = match[0]
      .replace(/\s+/g, '')
      .replace(/,/g, '.')
      .replace(/\.{2,}/g, '.');
    return Number(cleanedText);
  }
  return null;
}

function parseDate(text) {
  if (!text) return null;
  try {
    const date = DateTime.fromFormat(text.trim(), 'yyyy-MM-dd HH:mm:ss', {
      zone: 'Europe/Stockholm'
    });
    return date.isValid ? date.toISO() : null;
  } catch (error) {
    return null;
  }
}

function validateWaterInfo(vatteninformation) {
  // Add more comprehensive validation
  const requiredFields = ['senasteUppdatering'];
  const numberFields = ['ovanDamm', 'underDamm', 'totalt', 'genomTurbin', 'genomDammLucka'];

  const hasRequiredFields = requiredFields.every(field =>
    vatteninformation.hasOwnProperty(field) &&
    vatteninformation[field] !== null
  );

  const hasValidNumbers = numberFields.some(field =>
    vatteninformation.hasOwnProperty(field) &&
    typeof vatteninformation[field] === 'number'
  );

  return hasRequiredFields && hasValidNumbers;
}

/**
 * Extracts all fact data from the station HTML
 * @param {CheerioStatic} $ Loaded Cheerio instance
 * @returns {Object} Extracted fact information
 */
function extractFactData($) {
  const facts = {};

  // Process all fact elements from both article and aside sections
  $('.span100.fact.line').each((i, el) => {
    const label = $(el).find('.fact-label').text().trim();
    const factDataDiv = $(el).find('.fact-data');

    // Skip water information elements
    if (factDataDiv.hasClass('water-image')) {
      return;
    }

    // Get only the immediate text content (skipping unit spans)
    let value = '';
    if (factDataDiv.length > 0) {
      factDataDiv.contents().each((i, node) => {
        if (node.type === 'text') {
          value += $(node).text().trim();
        }
      });

      // Fall back to full text if direct text extraction failed
      if (!value.trim()) {
        value = factDataDiv.text().trim();
      }

      // Map common facts to our data structure
      if (label) {
        const normalizedLabel = normalizeFactLabel(label);
        facts[normalizedLabel] = value.trim();
      }
    }
  });

  return {
    namn: facts.namn || $('h1').text().trim(),
    land: facts.country || facts.land || '',
    elektriskEffekt: facts.electricitycapacity || facts.elektriskEffekt || '',
    vattendrag: facts.stream || facts.vattendrag || '',
    fallhojd: facts.head || facts.fallhojd || '',
    maxvattenflode: facts.waterdischarge || facts.maxvattenflode || ''
  };
}

/**
 * Normalizes fact labels to consistent keys
 * @param {string} label The label text from HTML
 * @returns {string} Normalized key for the fact
 */
function normalizeFactLabel(label) {
  const normalized = label.toLowerCase().replace(/\s+/g, '');

  const mapping = {
    'country': 'land',
    'electricitycapacity': 'elektriskEffekt',
    'stream': 'vattendrag',
    'head': 'fallhojd',
    'waterdischarge': 'maxvattenflode'
  };

  return mapping[normalized] || normalized;
}

async function scrapeStation(url, worker) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Extract all fact data
    const fakta = extractFactData($);
    debugLog(`Extracted facts for ${fakta.namn}: ${JSON.stringify(fakta)}`);

    // Check if water info section exists
    const waterSection = $('#water');
    if (!waterSection.length) {
      debugLog(`Skipping station ${fakta.namn}: no water information`);
      return null;
    }

    // Process water information
    const vatteninformation = {};
    const vattenInfoDivs = waterSection.find('.fact');

    for (let div of vattenInfoDivs) {
      const $div = $(div);
      const label = $div.find('.fact-label, .label').text().trim();
      const property = Station.waterInfoMapping[label];

      if (property) {
        debugLog(`Processing ${label} (${property})`);
        try {
          const imgSrc = $div.find('img').attr('src');
          if (imgSrc) {
            const ocrText = await ocrImage(imgSrc, worker);
            const cleanedText = cleanOCRText(ocrText);

            if (cleanedText) {
              if (property === 'senasteUppdatering') {
                vatteninformation[property] = parseDate(cleanedText);
              } else {
                vatteninformation[property] = parseNumber(cleanedText);
              }
            }
          }
        } catch (error) {
          log(`Error processing ${label}: ${error.message}`);
        }
      } else {
        debugLog(`Unmapped label found: ${label}`);
      }
    }

    if (!validateWaterInfo(vatteninformation)) {
      log(`Invalid water info for ${url}: ${JSON.stringify(vatteninformation)}`);
      throw new Error('Invalid station: missing timestamp');
    }

    return { fakta, vatteninformation };
  } catch (error) {
    log(`Failed to scrape station at ${url}: ${error.message}`);
    if (error.response) {
      log(`HTTP Status: ${error.response.status}`);
    }
    return null;
  }
}

module.exports = {
  createWorkerInstance,
  scrapeStation,
  ocrImage,
  parseNumber,
  extractFactData // Export for testing
};
