const express = require('express');
const { log } = require('./utils/logger');
const errorHandler = require('../middleware/error');
const requestLogger = require('../middleware/logging');
const StationService = require('./services/stationService');
const StationController = require('./controllers/stationController');
const stationRoutes = require('./routes/stationRoutes');

const app = express();
const stationService = new StationService();
const stationController = new StationController(stationService);

app.use(express.json());
app.use(requestLogger);
app.use('/api', stationRoutes(stationController));
app.use(errorHandler);

module.exports = app;