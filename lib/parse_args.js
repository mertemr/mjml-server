const yargs = require('yargs/yargs')
const { terminalWidth } = require('yargs')
const { hideBin } = require('yargs/helpers')

const envPrefix = 'MJML_'

const argv = yargs(hideBin(process.argv))
  .env(prefix=envPrefix) 
  .option('host', {
    demandOption: false,
    default: '0.0.0.0',
    describe: 'Server host [env: MJML_HOST]',
    type: 'string'
  })
  .option('port', {
    demandOption: false,
    default: 15500,
    describe: 'Server port [env: MJML_PORT]',
    type: 'number'
  })
  .option('keep-comments', {
    demandOption: false,
    default: true,
    describe: 'Keep comments in the HTML output [env: MJML_KEEP_COMMENTS]',
    type: 'boolean'
  })
  .option('beautify', {
    demandOption: false,
    default: false,
    describe: 'Beautify the HTML output [env: MJML_BEAUTIFY]',
    type: 'boolean'
  })
  .option('minify', {
    demandOption: false,
    default: false,
    describe: 'Minify the HTML output [env: MJML_MINIFY]',
    type: 'boolean'
  })
  .option('validation-level', {
    demandOption: false,
    default: 'soft',
    describe: 'Available values for the validator [env: MJML_VALIDATION_LEVEL]',
    type: 'string',
    choices: ['strict', 'soft', 'skip']
  })
  .option('max-body', {
    demandOption: false,
    default: '1mb',
    describe: 'Max size of the http body [env: MJML_MAX_BODY]',
    type: 'string'
  })
  .group(['host', 'port'], 'Server Options')
  .group(['keep-comments', 'beautify', 'minify', 'validation-level', 'max-body'], 'Output Options')
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'v')
  .strict()
  .wrap(terminalWidth)
  .parse()

module.exports = { argv }
