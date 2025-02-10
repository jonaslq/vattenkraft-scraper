const { parseNumber, ocrImage } = require('../../src/scrapers/stationScraper');

describe('StationScraper', () => {
    describe('parseNumber', () => {
        test('should parse valid numbers', () => {
            expect(parseNumber('123.45')).toBe(123.45);
            expect(parseNumber('123,45')).toBe(123.45);
            expect(parseNumber('text 123.45 more')).toBe(123.45);
        });

        // Add missing test cases
        test('should handle null input', () => {
            expect(parseNumber(null)).toBeNull();
            expect(parseNumber(undefined)).toBeNull();
            expect(parseNumber('')).toBeNull();
        });

        test('should handle invalid text', () => {
            expect(parseNumber('no numbers')).toBeNull();
        });

        test('should handle multiple numbers', () => {
            expect(parseNumber('123.45 and 67.89')).toBe(123.45);
        });
    });

    describe('ocrImage', () => {
        // Add OCR tests
        test('should handle OCR errors', async () => {
            const mockWorker = {
                recognize: jest.fn().mockRejectedValue(new Error('OCR failed'))
            };
            const result = await ocrImage('base64Image', mockWorker);
            expect(result).toBeNull();
        });
    });
});