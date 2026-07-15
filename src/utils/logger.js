const fs = require('fs');
const path = require('path');
const moment = require('moment');

const logDir = './logs';

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `l3mon-${moment().format('YYYY-MM-DD')}.log`);

class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  log(level, message, meta = {}) {
    if (this.levels[level] > this.levels[this.level]) return;

    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    const fullLog = meta && Object.keys(meta).length > 0 
      ? `${logMessage} ${JSON.stringify(meta)}`
      : logMessage;

    console.log(fullLog);

    // Write to file
    fs.appendFileSync(logFile, fullLog + '\n', (err) => {
      if (err) console.error('Failed to write to log file:', err);
    });
  }

  info(message, meta) {
    this.log('info', message, meta);
  }

  error(message, meta) {
    this.log('error', message, meta);
  }

  warn(message, meta) {
    this.log('warn', message, meta);
  }

  debug(message, meta) {
    this.log('debug', message, meta);
  }
}

module.exports = new Logger('info');
