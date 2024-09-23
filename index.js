// index.js
const { getStationUrls } = require('./scraper');
const { scrapeStation, createWorkerInstance } = require('./stationScraper');
const express = require('express');
const cron = require('node-cron');
const { log } = require('./logger'); // Importera log-funktionen
const { DateTime } = require('luxon'); // För tidsberäkningar

const app = express();
const PORT = 3080;

const scrapingIntervalHours = parseInt(process.env.SCRAPING_INTERVAL) || 2; // Default till 2 timmar

let stationData = [];

async function startScraping() {
  const startTime = DateTime.now();
  const stationUrls = await getStationUrls();
  log(`Started scraping, found ${stationUrls.length} power stations.`);

  // Skapa och initialisera workern
  const worker = await createWorkerInstance();

  const promises = stationUrls.map(async (station) => {
    const data = await scrapeStation(station.url, worker);
    if (data) {
      return {
        ...data,
        fakta: {
          ...data.fakta,
          namn: station.name,
        },
      };
    }
    return null;
  });

  const results = await Promise.all(promises);
  stationData = results.filter((result) => result !== null);

  // Avsluta workern
  await worker.terminate();

  const endTime = DateTime.now();
  const durationSeconds = endTime.diff(startTime, 'seconds').seconds;
  log(`Scraping finished in ${durationSeconds.toFixed(2)} seconds.`);
}

// Generera cron-uttrycket baserat på intervallet
const cronExpression = `0 */${scrapingIntervalHours} * * *`;
cron.schedule(cronExpression, () => {
  startScraping();
});

// Starta första scraping direkt
startScraping();

// API-endpoint
app.get('/api/vattenkraftstationer', (req, res) => {
  res.json(stationData);
});

// Starta servern
app.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
});
