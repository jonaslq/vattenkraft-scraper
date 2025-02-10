const express = require('express');
const StationService = require('../../src/services/stationService');
const StationController = require('../../src/controllers/stationController');
const stationRoutes = require('../../src/routes/stationRoutes');

function setupTestServer() {
    const app = express();
    const stationService = new StationService();
    const stationController = new StationController(stationService);
    app.use('/api', stationRoutes(stationController));
    return { app, stationService, stationController };
}

module.exports = { setupTestServer };