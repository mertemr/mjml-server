const path = require('node:path')
const { FlatCompat } = require('@eslint/eslintrc')
const js = require('@eslint/js')
const noOnlyTests = require('eslint-plugin-no-only-tests')

// Required to resolve relative paths
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

module.exports = [
  {
    files: ['lib/*.js'],
    plugins: {
      node: require('eslint-plugin-node'),
      prettier: require('eslint-plugin-prettier')
    }
  }
]
