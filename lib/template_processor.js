const Mustache = require('mustache')

/**
 * Process MJML template with variables
 * @param {string} mjmlTemplate - The MJML template string
 * @param {object} variables - Variables to replace in template
 * @returns {string} Processed MJML with variables replaced
 */
function processTemplate(mjmlTemplate, variables = {}) {
  if (!variables || Object.keys(variables).length === 0) {
    return mjmlTemplate
  }

  try {
    return Mustache.render(mjmlTemplate, variables)
  } catch (err) {
    throw new Error(`Template processing failed: ${err.message}`)
  }
}

module.exports = { processTemplate }
