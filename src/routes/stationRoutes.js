const express = require('express');
const router = express.Router();

module.exports = (controller) => {
    router.get('/stations', (req, res) => controller.getStations(req, res));
    return router;
};