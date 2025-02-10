// index.js
const { getStationUrls } = require('./scraper');
const { scrapeStation, createWorkerInstance } = require('./stationScraper');
const express = require('express');
const cron = require('node-cron');
const { log } = require('./logger'); // Importera log-funktionen
const { DateTime } = require('luxon'); // För tidsberäkningar
const errorHandler = require('./middleware/error');
const requestLogger = require('./middleware/logging');

// Move configuration to top
const CONFIG = {
  port: Number(process.env.PORT) || 3080,
  scrapingInterval: Number(process.env.SCRAPING_INTERVAL) || 2,
  maxStations: Number(process.env.MAX_STORED_STATIONS) || 1000,
  cronExpression: null
};

// Validate numeric configs
Object.entries(CONFIG).forEach(([key, value]) => {
  if (typeof value === 'number' && isNaN(value)) {
    log(`Invalid numeric value for ${key}, using default`);
    CONFIG[key] = {
      port: 3080,
      scrapingInterval: 2,
      maxStations: 1000
    }[key];
  }
});

CONFIG.cronExpression = `0 */${CONFIG.scrapingInterval} * * *`;

const app = express();

const scrapingIntervalHours = CONFIG.scrapingInterval;

let stationData = [];

// Add basic middleware and error handling for API
app.use(express.json());
app.use(requestLogger);

// Add try-catch blocks for error handling
async function startScraping() {
  try {
    const startTime = DateTime.now();
    const stationUrls = await getStationUrls();
    log(`Started scraping, found ${stationUrls.length} power stations.`);

    const worker = await createWorkerInstance();
    let successCount = 0;
    let failCount = 0;

    try {
      const results = await Promise.all(
        stationUrls.map(async station => {
          try {
            const result = await scrapeStation(station.url, worker);
            if (result) {
              successCount++;
              log(`Scraped station ${successCount}/${stationUrls.length}`);
            } else {
              failCount++;
              log(`Failed to scrape station ${station.url}`);
            }
            return result;
          } catch (error) {
            failCount++;
            log(`Error scraping station ${station.url}: ${error.message}`);
            return null;
          }
        })
      );

      stationData = results
        .filter(result => result !== null)
        .slice(0, CONFIG.maxStations);

      const endTime = DateTime.now();
      const duration = endTime.diff(startTime, 'seconds').seconds;

      log(`Scraping completed in ${duration.toFixed(1)}s. Success: ${successCount}, Failed: ${failCount}`);

    } finally {
      await worker.terminate();
    }

  } catch (error) {
    log(`Scraping failed: ${error.message}`);
    throw error;
  }
}

// Routes
app.get('/api/stations', (req, res) => {
  if (!stationData || stationData.length === 0) {
    res.set('Retry-After', '60');
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Station data is not yet available, please retry in 1 minute',
      retryAfter: 60 // seconds
    });
  }

  res.status(200).json({
    count: stationData.length,
    data: stationData
  });
});

// Error handling
app.use(errorHandler);

// Start server first
const server = app.listen(CONFIG.port, () => {
  log(`Server running on port ${CONFIG.port}`);

  // Initialize scraping after server is up
  startScraping()
    .then(() => {
      // Setup cron job for periodic scraping
      cron.schedule(CONFIG.cronExpression, startScraping);
    })
    .catch(error => {
      log(`Initial scraping failed: ${error.message}`);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('Shutting down...');
  server.close(() => {
    process.exit(0);
  });
});
