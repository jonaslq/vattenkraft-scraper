const { log } = require('../logger');

function errorHandler(err, req, res, next) {
    log(`Error: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
}

module.exports = errorHandler;