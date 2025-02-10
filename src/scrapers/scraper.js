// scraper.js
const axios = require('axios');
const cheerio = require('cheerio');

async function getStationUrls() {
  const url = 'https://powerplants.vattenfall.com/#/view=map/sort=name';
  const response = await axios.get(url);
  const html = response.data;

  const $ = cheerio.load(html);

  // Hitta script-taggen som innehåller JSON-blobben
  const scriptTags = $('script');
  let docsContent = null;

  scriptTags.each((i, elem) => {
    const scriptHtml = $(elem).html();
    if (scriptHtml.includes('docs: [')) {
      // Hitta innehållet mellan 'docs: [' och '], i18n:'
      const docsMatch = scriptHtml.match(/docs:\s*\[\s*(.*?)\s*\],\s*i18n:/s);
      if (docsMatch) {
        docsContent = docsMatch[1].trim();
      }
    }
  });

  if (docsContent) {
    // Gör om strängarna till giltig JSON:
    docsContent = docsContent
      .replace(/(\w+):/g, '"$1":') // Lägg till dubbla citationstecken runt nycklar
      .replace(/'/g, '"');

    // Lägg till hakparenteser runt objekten
    docsContent = `[${docsContent}]`;

    let docsArray;
    try {
      docsArray = JSON.parse(docsContent);
    } catch (error) {
      console.error("JSON parsing failed", error);
      return [];
    }

    // Filtrera stationerna
    let filteredDocs = docsArray.filter(doc =>
      doc.sm_field_status.includes("inoperation") &&
      doc.sm_vid_Countries.includes("Sweden") &&
      doc.sm_vid_Types.includes("Hydro")
    );

    // Bygg fullständiga URL:er
    const stationUrls = filteredDocs.map(doc => {
      return {
        name: doc.label,
        url: `https://powerplants.vattenfall.com/${doc.ss_field_source_path}`
      };
    });

    return stationUrls;
  } else {
    console.error("Could not find docs array in HTML content");
    return [];
  }
}

module.exports = { getStationUrls };
