// index.js
const express = require('express');
const cron = require('node-cron');
const { log } = require('./src/utils/logger');
const errorHandler = require('./middleware/error');
const requestLogger = require('./middleware/logging');
const StationService = require('./src/services/stationService');
const StationController = require('./src/controllers/stationController');
const stationRoutes = require('./src/routes/stationRoutes');

const CONFIG = {
  port: Number(process.env.PORT) || 3080,
  scrapingInterval: Number(process.env.SCRAPING_INTERVAL) || 2,
  maxStations: Number(process.env.MAX_STORED_STATIONS) || 1000,
  cronExpression: null
};

CONFIG.cronExpression = `0 */${CONFIG.scrapingInterval} * * *`;

const app = express();
const stationService = new StationService();
const stationController = new StationController(stationService);

app.use(express.json());
app.use(requestLogger);
app.use('/api', stationRoutes(stationController));
app.use(errorHandler);

// Start server and initialize scraping
const server = app.listen(CONFIG.port, async () => {
  log('Server starting...');

  try {
    log('Starting initial scraping...');
    await stationService.scrapeStations();
    log('Initial scraping completed');

    // Setup periodic scraping
    cron.schedule(CONFIG.cronExpression, () => {
      log('Starting scheduled scraping...');
      stationService.scrapeStations();
    });

    log(`Server running on port ${CONFIG.port}`);
  } catch (error) {
    log(`Startup error: ${error.message}`);
  }
});

// Monitor process
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
