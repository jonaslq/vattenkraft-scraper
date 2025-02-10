// logger.js
const { DateTime } = require('luxon');

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

const COLORS = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  debug: '\x1b[90m', // Gray
  reset: '\x1b[0m'
};

const currentLogLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const debugMode = process.env.DEBUG_MODE === 'true';

function getTimestamp() {
  const date = new Date();
  // Adjust for Stockholm timezone (UTC+1/+2)
  const stockholmDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));

  const pad = (n) => n.toString().padStart(2, '0');

  return `${stockholmDate.getFullYear()}-${pad(stockholmDate.getMonth() + 1)}-${pad(stockholmDate.getDate())} ` +
    `${pad(stockholmDate.getHours())}:${pad(stockholmDate.getMinutes())}:${pad(stockholmDate.getSeconds())}`;
}

function log(message, level = LOG_LEVELS.INFO) {
  if (!shouldLog(level)) return;

  const timestamp = getTimestamp();
  const color = COLORS[level] || COLORS.info;
  console.log(`${color}${timestamp} ${level.toUpperCase()}: ${message}${COLORS.reset}`);
}

function debugLog(message) {
  if (debugMode) {
    console.log(`${getTimestamp()} DEBUG: ${message}`);
  }
}

function shouldLog(messageLevel) {
  const levels = Object.values(LOG_LEVELS);
  return levels.indexOf(messageLevel) <= levels.indexOf(currentLogLevel);
}

function error(message, error) {
  const errorMessage = error ? `${message}: ${error.message}\n${error.stack}` : message;
  log(errorMessage, LOG_LEVELS.ERROR);
}

function warn(message) {
  log(message, LOG_LEVELS.WARN);
}

function info(message) {
  log(message, LOG_LEVELS.INFO);
}

function debug(message) {
  log(message, LOG_LEVELS.DEBUG);
}

module.exports = {
  error,
  warn,
  info,
  debug,
  LOG_LEVELS,
  log,
  debugLog,
  debugMode
};
