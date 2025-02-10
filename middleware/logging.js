const { log } = require('../logger');

function requestLogger(req, res, next) {
    log(`${req.method} ${req.url}`);
    next();
}

module.exports = requestLogger;