const express = require('express')
const mjml = require('mjml')

const { logger, middleware: loggingMiddleware } = require('./logging.js')
const { dependencies } = require('../package.json')
const { validateOptions } = require('./validate_options.js')
const { processTemplate } = require('./template_processor.js')
const compression = require('compression')
const { rateLimit } = require('express-rate-limit')

function handleRequest(req, res) {
  let mjmlText
  let overrideOptions = {}
  let variables = {}

  try {
    const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    mjmlText = parsed.mjml || req.body
    overrideOptions = parsed.options || {}
    variables = parsed.variables || parsed.data || {}
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
    // Process template variables before rendering
    const processedMjml = processTemplate(mjmlText, variables)
    const result = mjml(processedMjml, finalConfig)
    const { html, errors } = result
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Failed to compile mjml',
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
    const isValidationError =
      err.constructor.name === 'ValidationError' ||
      (typeof err.message === 'string' && err.message.toLowerCase().includes('validationerror'))
    const isParseError =
      typeof err.message === 'string' && err.message.toLowerCase().includes('malformed mjml')

    if (isValidationError || isParseError) {
      // Extract error details from ValidationError
      const errorMatch = err.message.match(/Line (\d+).*?\(([^)]+)\).*?—\s*(.+)/)
      const errors = errorMatch
        ? [
            {
              line: parseInt(errorMatch[1]),
              tagName: errorMatch[2],
              message: errorMatch[3],
              formattedMessage: err.message.split('\n')[1]?.trim() || err.message
            }
          ]
        : [
            {
              line: err.line,
              column: err.column,
              message: err.message
            }
          ]

      return res.status(400).json({
        message: 'Failed to compile mjml',
        level: 'error',
        errors
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

  if (argv.enableRateLimit) {
    const limiter = rateLimit({
      windowMs: argv.rateLimitWindow * 60 * 1000,
      max: argv.rateLimitMax,
      message: { message: 'Too many requests, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false
    })
    logger.info(
      `Rate limiting enabled: ${argv.rateLimitMax} requests per ${argv.rateLimitWindow} minutes`
    )
    app.use(limiter)
  }

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

  app.post('/v1/render', handleRequest)
  app.get('/v1/render', (req, res) => {
    res.status(405).json({
      message: 'GET method not allowed. Use POST to render MJML.'
    })
  })

  app.post('/v1/render/batch', async (req, res) => {
    let requests = []

    try {
      const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      requests = Array.isArray(parsed) ? parsed : parsed.requests || []
    } catch (err) {
      return res.status(400).json({ message: 'Invalid batch request format' })
    }

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ message: 'Batch request must contain an array of requests' })
    }

    if (requests.length > 50) {
      return res.status(400).json({ message: 'Batch size limit exceeded (max: 50)' })
    }

    const globalConfig = req.app.get('mjmlConfig')

    const results = await Promise.all(
      requests.map(async item => {
        try {
          const mjmlText = item.mjml
          const variables = item.variables || item.data || {}
          const overrideOptions = item.options || {}

          if (!mjmlText || typeof mjmlText !== 'string') {
            return { success: false, error: 'Invalid MJML input' }
          }

          const finalConfig = { ...globalConfig, ...overrideOptions }
          const processedMjml = processTemplate(mjmlText, variables)
          const result = mjml(processedMjml, finalConfig)

          if (result.errors.length > 0) {
            return { success: false, errors: result.errors }
          }

          return {
            success: true,
            html: result.html,
            errors: result.errors
          }
        } catch (err) {
          return {
            success: false,
            error: err.message || 'Rendering failed'
          }
        }
      })
    )

    res.json({ results })
  })

  app.post('/v1/validate', (req, res) => {
    let mjmlText
    let variables = {}

    try {
      const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      mjmlText = parsed.mjml || req.body
      variables = parsed.variables || parsed.data || {}
    } catch (err) {
      mjmlText = req.body
    }

    if (!mjmlText || typeof mjmlText !== 'string') {
      return res.status(400).json({ message: 'Invalid MJML input' })
    }

    try {
      const processedMjml = processTemplate(mjmlText, variables)
      const result = mjml(processedMjml, { validationLevel: 'strict' })

      res.json({
        valid: result.errors.length === 0,
        errors: result.errors
      })
    } catch (err) {
      const isParseError =
        typeof err.message === 'string' && err.message.toLowerCase().includes('malformed mjml')

      if (isParseError) {
        return res.json({
          valid: false,
          errors: [
            {
              line: err.line,
              column: err.column,
              message: err.message
            }
          ]
        })
      }

      res.status(500).json({
        message: 'Validation error',
        error: err.message
      })
    }
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
      message: `Endpoint not found. Try POST ${'/v1/render'}`
    })
  })

  return app
}

module.exports = { createApp }
