const StationService = require('../../../src/services/stationService');
const { sampleStationData } = require('../../helpers/testData');

describe('StationService', () => {
    let service;

    beforeEach(() => {
        service = new StationService();
    });

    test('should initialize with empty stations', () => {
        expect(service.getStations()).toEqual([]);
    });

    test('should store scraped stations', async () => {
        service.stationData = sampleStationData;
        expect(service.getStations()).toEqual(sampleStationData);
    });
});