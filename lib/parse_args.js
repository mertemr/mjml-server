const yargs = require('yargs/yargs')
const { terminalWidth } = require('yargs')
const { hideBin } = require('yargs/helpers')

const envPrefix = 'MJML_'

const argv = yargs(hideBin(process.argv))
  .env((prefix = envPrefix))
  .options({
    host: {
      type: 'string',
      default: '0.0.0.0',
      describe: 'Server host [env: MJML_HOST]'
    },
    port: {
      type: 'number',
      default: 15500,
      describe: 'Server port [env: MJML_PORT]'
    },
    'use-compression': {
      type: 'boolean',
      default: true,
      describe: 'Use compression for responses [env: MJML_USE_COMPRESSION]'
    },
    'keep-comments': {
      type: 'boolean',
      default: true,
      describe: 'Keep comments in the HTML output [env: MJML_KEEP_COMMENTS]'
    },
    beautify: {
      type: 'boolean',
      default: false,
      describe: 'Beautify the HTML output [env: MJML_BEAUTIFY]'
    },
    minify: {
      type: 'boolean',
      default: false,
      describe: 'Minify the HTML output [env: MJML_MINIFY]'
    },
    'validation-level': {
      type: 'string',
      default: 'soft',
      choices: ['strict', 'soft', 'skip'],
      describe: 'Available values for the validator [env: MJML_VALIDATION_LEVEL]'
    },
    'max-body': {
      type: 'string',
      default: '1mb',
      describe: 'Max size of the http body [env: MJML_MAX_BODY]'
    },
    'auth-user': {
      type: 'string',
      describe: 'Username for HTTP Basic Authentication [env: MJML_AUTH_USER]'
    },
    'auth-pass': {
      type: 'string',
      describe: 'Password for HTTP Basic Authentication [env: MJML_AUTH_PASS]'
    },
    'rate-limit-max': {
      type: 'number',
      default: 100,
      describe: 'Max requests per window [env: MJML_RATE_LIMIT_MAX]'
    },
    'rate-limit-window': {
      type: 'number',
      default: 15,
      describe: 'Rate limit window in minutes [env: MJML_RATE_LIMIT_WINDOW]'
    },
    'enable-rate-limit': {
      type: 'boolean',
      default: false,
      describe: 'Enable rate limiting [env: MJML_ENABLE_RATE_LIMIT]'
    }
  })
  .group(['host', 'port', 'use-compression'], 'Server Options')
  .group(['keep-comments', 'beautify', 'minify', 'validation-level', 'max-body'], 'Output Options')
  .group(['auth-user', 'auth-pass'], 'Authentication Options')
  .group(['enable-rate-limit', 'rate-limit-max', 'rate-limit-window'], 'Rate Limiting Options')
  .check(argv => {
    if ((argv.authUser && !argv.authPass) || (!argv.authUser && argv.authPass)) {
      throw new Error('Both --auth-user and --auth-pass must be provided together.')
    }
    return true
  })
  .parserConfiguration({
    'boolean-negation': true,
    'sort-commands': true
  })
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'v')
  .strict()
  .wrap(terminalWidth)
  .example([
    ['$0 --port 3000', 'Start the server on port 3000.'],
    ['$0 --minify --no-keep-comments', 'Minify the output and do not keep comments.'],
    ['$0 --auth-user admin --auth-pass 1234', 'Use HTTP basic auth.']
  ])
  .epilogue('For more information, visit https://github.com/mertemr/mjml-server')
  .usage('Usage: $0 [options]')
  .parse()

module.exports = { argv }
