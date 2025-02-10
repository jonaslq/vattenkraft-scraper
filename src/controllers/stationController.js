const { log, debugLog } = require('../utils/logger');

class StationController {
    constructor(stationService) {
        this.stationService = stationService;
        debugLog('StationController initialized');
    }

    async getStations(req, res) {
        debugLog('GET /api/stations requested');
        const stations = this.stationService.getStations();
        log(`Found ${stations?.length || 0} stations`);

        if (!stations || stations.length === 0) {
            log('No stations available, returning 503');
            res.set('Retry-After', '60');
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Station data is not yet available',
                retryAfter: 60
            });
        }

        debugLog(`Returning ${stations.length} stations`);
        return res.status(200).json({
            count: stations.length,
            data: stations
        });
    }
}

module.exports = StationController;