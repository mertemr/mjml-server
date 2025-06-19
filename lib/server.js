const express = require('express')
const mjml = require('mjml')

const { logger, middleware: loggingMiddleware } = require('./logging.js')
const { dependencies } = require('../package.json')
const { validateOptions } = require('./validate_options.js')
const compression = require('compression')
const RENDER_ENDPOINT = '/v1/render'

function handleRequest(req, res) {
  let mjmlText
  let overrideOptions = {}

  try {
    const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    mjmlText = parsed.mjml || req.body
    overrideOptions = parsed.options || {}
  } catch (err) {
    mjmlText = req.body
  }

  if (!mjmlText || typeof mjmlText !== 'string') {
    return res.status(400).json({ message: 'Invalid MJML input' })
  }

  const globalConfig = req.app.get('mjmlConfig')

  if (overrideOptions) {
    const validationError = validateOptions(overrideOptions)

    if (validationError) {
      return res.status(400).json({
        message: 'Invalid MJML options',
        error: validationError
      })
    }
  }

  const finalConfig = {
    ...globalConfig,
    ...overrideOptions
  }

  try {
    const result = mjml(mjmlText, finalConfig)
    const { html, errors } = result
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Failed to compile MJML',
        level: 'error',
        errors
      })
    }

    res.json({
      html,
      mjml: mjmlText,
      mjml_version: dependencies.mjml,
      errors
    })
  } catch (err) {
    const isParseError =
      typeof err.message === 'string' && err.message.toLowerCase().includes('malformed mjml')

    if (isParseError) {
      return res.status(400).json({
        message: 'Failed to compile MJML',
        level: 'error',
        errors: [
          {
            line: err.line,
            column: err.column,
            message: err.message
          }
        ]
      })
    }

    logger.error('Unexpected MJML error:', err)
    res.status(500).json({
      message: 'Internal Server Error',
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

  logger.info(`MJML Config: ${JSON.stringify(config, null, 2)}`)

  const app = express()

  app.disable('x-powered-by')

  app.set('mjmlConfig', config)
  app.use(loggingMiddleware)

  if (argv.authUser && argv.authPass) {
    logger.info('HTTP Basic Authentication enabled.')
    app.use((req, res, next) => {
      const auth = req.headers.authorization
      if (!auth) {
        return res.status(401).json({ message: 'Unauthorized' })
      }
      const [type, credentials] = auth.split(' ')
      if (type !== 'Basic' || !credentials) {
        return res.status(401).json({ message: 'Unauthorized' })
      }
      const [user, pass] = Buffer.from(credentials, 'base64').toString().split(':')
      if (user !== argv.authUser || pass !== argv.authPass) {
        return res.status(401).json({ message: 'Unauthorized' })
      }
      next()
    })
  }

  if (argv.useCompression) {
    logger.info('Compression middleware enabled.')
    app.use(compression())
  }

  app.use(express.text({ type: () => true, limit: argv.maxBody }))

  app.post(RENDER_ENDPOINT, handleRequest)
  app.get(RENDER_ENDPOINT, (req, res) => {
    res.status(405).json({
      message: 'GET method not allowed. Use POST to render MJML.'
    })
  })

  app.get('/v1/health', (req, res) => {
    const config = req.app.get('mjmlConfig')

    res.status(200).json({
      status: 'ok',
      message: 'MJML Render API is healthy',
      mjml_version: dependencies.mjml,
      options: config
    })
  })

  app.use((req, res) => {
    res.status(404).json({
      message: `Endpoint not found. Try POST ${RENDER_ENDPOINT}`
    })
  })

  return app
}

module.exports = { createApp }
