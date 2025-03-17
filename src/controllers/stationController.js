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

        // Enhanced validation for complete data structure
        const validatedStations = stations.map(station => this.validateStationStructure(station));

        debugLog(`Returning ${validatedStations.length} stations with complete data structure`);
        return res.status(200).json({
            count: validatedStations.length,
            data: validatedStations
        });
    }

    getStationById(id, req, res) {
        try {
            const station = this.stationService.getStationById(id);

            if (!station) {
                return res.status(404).json({
                    success: false,
                    error: `No station found with ID ${id}`
                });
            }

            // Enhanced validation for complete data structure
            const validatedStation = this.validateStationStructure(station);

            return res.status(200).json({
                success: true,
                data: validatedStation
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Helper method to ensure complete data structure
    validateStationStructure(station) {
        // Create a new object to avoid modifying the original
        const validatedStation = { ...station };

        // Ensure fakta object with all required fields
        validatedStation.fakta = {
            namn: station.fakta?.namn || station.fakta || '',
            land: station.fakta?.land || '',
            elektriskEffekt: station.fakta?.elektriskEffekt || '',
            vattendrag: station.fakta?.vattendrag || '',
            fallhojd: station.fakta?.fallhojd || '',
            maxvattenflode: station.fakta?.maxvattenflode || ''
        };

        // Ensure vatteninformation object with all required fields
        validatedStation.vatteninformation = {
            senasteUppdatering: station.vatteninformation?.senasteUppdatering || '',
            ovanDamm: station.vatteninformation?.ovanDamm || 0,
            underDamm: station.vatteninformation?.underDamm || 0,
            totalt: station.vatteninformation?.totalt || 0,
            genomTurbin: station.vatteninformation?.genomTurbin || 0,
            genomDammLucka: station.vatteninformation?.genomDammLucka || 0
        };

        return validatedStation;
    }
}

module.exports = StationController;