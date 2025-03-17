const express = require('express');
const router = express.Router();

module.exports = (controller) => {
    // Renamed from /stations to maintain the path structure but under /api/v1
    router.get('/stations', (req, res) => controller.getStations(req, res));

    // Add missing route for getting specific station by ID
    router.get('/stations/:id', (req, res) => {
        const { id } = req.params;
        controller.getStationById(id, req, res);
    });

    return router;
};