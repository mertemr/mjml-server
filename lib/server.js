const express = require('express')
const bodyParser = require('body-parser')
const mjml = require('mjml')

const { logger, middleware: loggingMiddleware } = require('./logging.js')
const { dependencies } = require('../package.json')

const RENDER_ENDPOINT = '/v1/render'

function handleRequest(req, res) {
  let mjmlText

  try {
    mjmlText =
      typeof req.body === 'string'
        ? JSON.parse(req.body).mjml || req.body
        : req.body.mjml || req.body
  } catch (err) {
    mjmlText = req.body
  }

  if (!mjmlText || typeof mjmlText !== 'string') {
    return res.status(400).json({ message: 'Invalid MJML input' })
  }

  try {
    const result = mjml(mjmlText, req.app.get('mjmlConfig'))
    const { html, errors } = result

    res.json({
      html,
      mjml: mjmlText,
      mjml_version: dependencies.mjml,
      errors
    })
  } catch (err) {
    logger.error('MJML rendering failed:', err)
    res.status(400).json({
      message: 'Failed to compile MJML',
      error: err.message || err.toString()
    })
  }
}

function createApp(argv) {
  const config = {
    keepComments: argv.keepComments,
    beautify: argv.beautify,
    minify: argv.minify,
    validationLevel: argv.validationLevel
  }

  logger.info('MJML Config:', config)

  const app = express()

  app.set('mjmlConfig', config)
  app.use(loggingMiddleware)

  app.use(bodyParser.text({ type: () => true, limit: argv.maxBody }))

  app.post(RENDER_ENDPOINT, handleRequest)

  app.use((req, res) => {
    res.status(404).json({
      message: `Endpoint not found. Try POST ${RENDER_ENDPOINT}`
    })
  })

  return app
}

module.exports = { create: createApp }
