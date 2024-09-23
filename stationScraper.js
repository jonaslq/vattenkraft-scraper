// stationScraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const { createWorker } = require('tesseract.js');
const { DateTime } = require('luxon');
const { debugLog, debugMode } = require('./logger');

async function createWorkerInstance() {
  const options = {};
  if (debugMode) {
    options.logger = (m) => debugLog(`${m.status} ${m.progress}`);
  }
  const worker = await createWorker('eng', 1, options);

  await worker.setParameters({
    tessedit_char_whitelist: '0123456789.,:- ',
  });

  return worker;
}

async function ocrImage(base64Image, worker) {
  try {
    const {
      data: { text },
    } = await worker.recognize(base64Image);
    return text.trim();
  } catch (error) {
    debugLog(`OCR failed: ${error.message}`);
    return null;
  }
}

function parseNumber(text) {
  const match = text.match(/[\d.,-]+/);
  if (match) {
    let cleanedText = match[0]
      .replace(/\s+/g, '')
      .replace(/,/g, '.')
      .replace(/\.{2,}/g, '.');

    const number = parseFloat(cleanedText);
    return isNaN(number) ? null : number;
  } else {
    return null;
  }
}

async function scrapeStation(url, worker) {
  try {
    const response = await axios.get(url);
    const html = response.data;

    const $ = cheerio.load(html);

    // Hämta fakta
    const fakta = {};
    fakta.namn = $('h1').text().trim();

    const faktaMapping = {
      'Land': 'land',
      'Country': 'land',
      'Elektrisk effekt': 'elektriskEffekt',
      'Electric capacity': 'elektriskEffekt',
      'Vattendrag': 'vattendrag',
      'Watercourse': 'vattendrag',
      'Fallhöjd': 'fallhojd',
      'Head': 'fallhojd',
      'Vattenföring': 'vattenforing',
      'Flow rate': 'vattenforing',
      'Turbintyp': 'turbintyp',
      'Turbine type': 'turbintyp',
      'Vattenfalls ägarandel': 'agarandel',
      "Vattenfall's ownership share": 'agarandel',
      'Status': 'driftStatus',
    };

    const faktaItems = $('.aside-information .fact');

    faktaItems.each((index, element) => {
      const label = $(element).find('.fact-label').text().trim();
      const dataElement = $(element).find('.fact-data').clone();

      dataElement.find('span').remove();
      const value = dataElement.text().trim();

      const property = faktaMapping[label];
      if (property) {
        if (
          ['elektriskEffekt', 'fallhojd', 'vattenforing', 'agarandel'].includes(
            property
          )
        ) {
          const parsedValue = parseNumber(value);
          fakta[property] = parsedValue;
          debugLog(`Parsed value for ${property}: ${parsedValue}`);
        } else if (property === 'driftStatus') {
          fakta[property] =
            value.toLowerCase().includes('i drift') ||
            value.toLowerCase().includes('in operation');
          debugLog(`Parsed value for ${property}: ${fakta[property]}`);
        } else {
          fakta[property] = value;
          debugLog(`Parsed value for ${property}: ${fakta[property]}`);
        }
      } else {
        debugLog(`Unknown fact label: ${label}`);
      }
    });

    // Hämta vatteninformation
    const vatteninformation = {};
    const vattenInfoDivs = $('#water .fact');

    const labelMapping = {
      'Ovan damm': 'ovanDamm',
      'Above pond': 'ovanDamm',
      'Under damm': 'underDamm',
      'Below pond': 'underDamm',
      'Totalt': 'totalt',
      'Total': 'totalt',
      'Genom turbin': 'genomTurbin',
      'Through turbine': 'genomTurbin',
      'Genom dammluckan': 'genomDammLucka',
      'Through pond hatch': 'genomDammLucka',
      'Senaste uppdatering': 'senasteUppdatering',
      'Last update': 'senasteUppdatering',
    };

    for (let i = 0; i < vattenInfoDivs.length; i++) {
      const label = $(vattenInfoDivs[i]).find('.fact-label').text().trim();
      const imgSrc = $(vattenInfoDivs[i]).find('img').attr('src');

      if (imgSrc && imgSrc.startsWith('data:image')) {
        // Utför OCR på bilden
        const ocrText = await ocrImage(imgSrc, worker);

        if (ocrText !== null) {
          const property = labelMapping[label];
          if (property) {
            if (property === 'senasteUppdatering') {
              const dateString = ocrText.trim();
              const date = DateTime.fromFormat(
                dateString,
                'yyyy-MM-dd HH:mm:ss',
                { zone: 'Europe/Stockholm' }
              );
              if (date.isValid) {
                vatteninformation.senasteUppdatering = date.toISO();
              } else {
                vatteninformation.senasteUppdatering = dateString;
              }
              debugLog(
                `Parsed value for ${property}: ${vatteninformation.senasteUppdatering}`
              );
            } else {
              const parsedValue = parseNumber(ocrText);
              vatteninformation[property] = parsedValue;
              debugLog(`Parsed value for ${property}: ${parsedValue}`);
            }
          } else {
            debugLog(`Unknown label: ${label}`);
          }
        }
      }
    }

    return { fakta, vatteninformation };
  } catch (error) {
    debugLog(`Failed to scrape station at ${url}: ${error.message}`);
    return null;
  }
}

module.exports = { scrapeStation, createWorkerInstance };
