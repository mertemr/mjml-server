#!/usr/bin/env node
const http = require('http')
const { logger } = require('./lib/logging.js')
const graceful = require('node-graceful')

const { createApp } = require('./lib/server.js')
const argv = require('./lib/parse_args.js').argv

const app = createApp(argv)
const server = http.createServer(app)

try {
  server.listen(argv.port, argv.host, () => {
    logger.info('Starting MJML server...')
    logger.info(`Server is listening on http://${argv.host}:${argv.port}`)
  })

  server.on('error', err => {
    logger.error('Failed to start server:', err)
    process.exit(1)
  })

  graceful.on('exit', (done, event, signal) => {
    logger.info(`Received ${signal || event} signal - exiting gracefully...`)
    server.close(() => {
      logger.info('Server closed.')
      done()
    })
  })
} catch (err) {
  logger.error('Unhandled error while starting server:', err)
  process.exit(1)
}
