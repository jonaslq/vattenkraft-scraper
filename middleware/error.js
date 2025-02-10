const { log } = require('../src/utils/logger');

function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    log(`Error ${status}: ${message}`);

    if (process.env.NODE_ENV !== 'production') {
        res.status(status).json({
            error: message,
            stack: err.stack
        });
    } else {
        res.status(status).json({ error: message });
    }
}

module.exports = errorHandler;