// logger.js
const { DateTime } = require('luxon');

const debugMode = process.env.DEBUG_MODE === 'true';

function log(message) {
  const timestamp = DateTime.now()
    .setZone('Europe/Stockholm')
    .toFormat('yyyy-MM-dd HH:mm:ss');
  console.log(`${timestamp} ${message}`);
}

function debugLog(message) {
  if (debugMode) {
    const timestamp = DateTime.now()
      .setZone('Europe/Stockholm')
      .toFormat('yyyy-MM-dd HH:mm:ss');
    console.log(`${timestamp} DEBUG: ${message}`);
  }
}

module.exports = { log, debugLog, debugMode };
