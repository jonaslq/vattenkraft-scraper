process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.SCRAPING_INTERVAL = '2';
process.env.MAX_STORED_STATIONS = '1000';

jest.setTimeout(10000);