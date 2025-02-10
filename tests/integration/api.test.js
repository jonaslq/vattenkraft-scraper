const request = require('supertest');
const app = require('../../src/app');

describe('API Integration', () => {
    test('GET /api/stations returns 503 when no data', async () => {
        const response = await request(app).get('/api/stations');
        expect(response.status).toBe(503);
        expect(response.body).toHaveProperty('message');
    });
});