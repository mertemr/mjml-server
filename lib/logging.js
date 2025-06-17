const winston = require('winston')
const expressWinston = require('express-winston')

const { combine, timestamp, printf, errors, colorize } = winston.format

const customFormat = printf(({ level, message, stack }) => {
  return `${level}: ${stack || message}`
})

module.exports.middleware = expressWinston.logger({
  transports: [new winston.transports.Console()],
  format: combine(errors({ stack: true }), timestamp(), customFormat),
  meta: true,
  expressFormat: true,
  colorize: false,
  skip: function (req, res) {
    return res.statusCode >= 200 && res.statusCode < 500
  }
})

module.exports.logger = winston.createLogger({
  level: 'info',
  format: combine(colorize(), errors({ stack: true }), timestamp(), customFormat),
  transports: [new winston.transports.Console()]
})
