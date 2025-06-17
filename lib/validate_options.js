const ALLOWED_OPTIONS = ['keepComments', 'beautify', 'minify', 'validationLevel']

module.exports = {
  validateOptions(options) {
    for (const key of Object.keys(options)) {
      if (!ALLOWED_OPTIONS.includes(key)) {
        return `Invalid option: "${key}"`
      }

      const val = options[key]
      if (key === 'validationLevel' && !['strict', 'soft', 'skip'].includes(val)) {
        return `Invalid value for validationLevel: "${val}"`
      }

      if (['keepComments', 'beautify', 'minify'].includes(key) && typeof val !== 'boolean') {
        return `Expected boolean for "${key}", got "${typeof val}"`
      }
    }

    return null
  }
}
