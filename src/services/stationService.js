const { getStationUrls } = require('../scrapers/scraper');
const { scrapeStation, createWorkerInstance } = require('../scrapers/stationScraper');
const { log } = require('../utils/logger');
const { DateTime } = require('luxon');

class StationService {
    constructor() {
        this.stationData = [];
        this.isLoading = false;
    }

    validateStation(station) {
        if (!station.fakta?.namn) {
            throw new Error('Invalid station: missing name');
        }
        if (!station.vatteninformation?.senasteUppdatering) {
            throw new Error('Invalid station: missing timestamp');
        }
    }

    async scrapeStations() {
        if (this.isLoading) {
            log('Scraping already in progress');
            return;
        }

        this.isLoading = true;
        let worker = null;

        try {
            worker = await createWorkerInstance();
            const stationUrls = await getStationUrls();
            log(`Scraping ${stationUrls.length} stations...`);

            const results = await Promise.all(
                stationUrls.map(station => scrapeStation(station.url, worker))
            );

            this.stationData = results.filter(Boolean);
            log(`Successfully scraped ${this.stationData.length} stations`);

        } catch (error) {
            log(`Scraping failed: ${error.message}`);
            throw error;
        } finally {
            this.isLoading = false;
            if (worker) await worker.terminate();
        }
    }

    getStations() {
        return this.stationData;
    }
}

module.exports = StationService;