const { DateTime } = require('luxon');

class Station {
    static faktaMapping = {
        'Land': 'land',
        'Country': 'land',
        'Elektrisk effekt': 'elektriskEffekt',
        'Electric capacity': 'elektriskEffekt',
        'Vattendrag': 'vattendrag',
        'Watercourse': 'vattendrag',
        'Fallhöjd': 'fallhojd',
        'Head': 'fallhojd',
        'Vattenföring': 'vattenforing',
        'Flow rate': 'vattenforing',
        'Turbintyp': 'turbintyp',
        'Turbine type': 'turbintyp',
        'Vattenfalls ägarandel': 'agarandel'
    };

    static waterInfoMapping = {
        'Ovan damm': 'ovanDamm',
        'Above pond': 'ovanDamm',
        'Under damm': 'underDamm',
        'Below pond': 'underDamm',
        'Totalt': 'totalt',
        'Total': 'totalt',
        'Genom turbin': 'genomTurbin',
        'Through turbine': 'genomTurbin',
        'Genom dammluckan': 'genomDammLucka',
        'Through pond hatch': 'genomDammLucka',
        'Senaste uppdatering': 'senasteUppdatering',
        'Last update': 'senasteUppdatering'  // Add this line
    };

    constructor(data = {}) {
        this.fakta = data.fakta || {};
        this.vatteninformation = data.vatteninformation || {};

        // Add fallback timestamp if missing
        if (!this.vatteninformation.senasteUppdatering) {
            this.vatteninformation.senasteUppdatering = DateTime.now()
                .setZone('Europe/Stockholm')
                .toISO();
            log(`Using current timestamp for ${this.fakta.namn}`);
        }
    }

    static async fromScrapedData($, vatteninformation = {}, worker) {
        const station = new Station();

        // Basic info
        station.fakta.namn = $('h1').text().trim();

        // Water info
        const vattenInfoDivs = $('.water-info div');
        for (let div of vattenInfoDivs) {
            const $div = $(div);
            const label = $div.find('.fact-label, .label').text().trim();
            const property = Station.waterInfoMapping[label];

            if (property) {
                log(`Processing ${label} (${property})`);
                try {
                    const imgSrc = $div.find('img').attr('src');
                    if (imgSrc) {
                        const ocrText = await ocrImage(imgSrc, worker);
                        const cleanedText = cleanOCRText(ocrText);

                        if (cleanedText) {
                            if (property === 'senasteUppdatering') {
                                const timestamp = parseDate(cleanedText);
                                if (timestamp) {
                                    vatteninformation[property] = timestamp;
                                    log(`Parsed timestamp: ${timestamp}`);
                                } else {
                                    log(`Failed to parse timestamp from: ${cleanedText}`);
                                }
                            } else {
                                const value = parseNumber(cleanedText);
                                if (value !== null) {
                                    vatteninformation[property] = value;
                                    log(`Parsed number: ${value} for ${property}`);
                                }
                            }
                        }
                    }
                } catch (error) {
                    log(`Error processing ${label}: ${error.message}`);
                }
            } else {
                log(`Unmapped label found: ${label}`);
            }
        }

        station.vatteninformation = vatteninformation;

        return station;
    }

    validate() {
        if (!this.fakta?.namn) {
            throw new Error('Invalid station: missing name');
        }

        // Ensure we have at least one water measurement
        const numberFields = ['ovanDamm', 'underDamm', 'totalt', 'genomTurbin', 'genomDammLucka'];
        const hasAnyMeasurement = numberFields.some(field =>
            typeof this.vatteninformation[field] === 'number'
        );

        if (!hasAnyMeasurement) {
            throw new Error('Invalid station: no water measurements');
        }

        return true;
    }
}

function validateWaterInfo(vatteninformation) {
    const requiredFields = ['senasteUppdatering'];
    const numberFields = ['ovanDamm', 'underDamm', 'totalt', 'genomTurbin', 'genomDammLucka'];

    // Debug log the current state
    log(`Validating water info: ${JSON.stringify(vatteninformation)}`);

    const hasRequiredFields = requiredFields.every(field => {
        const hasField = vatteninformation.hasOwnProperty(field) &&
            vatteninformation[field] !== null;
        if (!hasField) {
            log(`Missing required field: ${field}`);
        }
        return hasField;
    });

    const hasValidNumbers = numberFields.some(field => {
        const isValid = vatteninformation.hasOwnProperty(field) &&
            typeof vatteninformation[field] === 'number';
        if (!isValid && vatteninformation.hasOwnProperty(field)) {
            log(`Invalid number for field: ${field}`);
        }
        return isValid;
    });

    return hasRequiredFields && hasValidNumbers;
}

module.exports = Station;