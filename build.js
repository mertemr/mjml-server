#!/usr/bin/env node

const esbuild = require('esbuild')
const { writeFileSync } = require('fs')

async function build() {
  console.log('🔨 Building bundled application...')
  
  // Build single bundled file
  const result = await esbuild.build({
    // Build configuration
    platform: 'node',
    target: 'node24',
    format: 'cjs',
    bundle: true,
    minify: true,
    treeShaking: true,
    sourcemap: false,
    
    // Keep these as external (problematic dependencies)
    external: [
      'fsevents', // Optional dependency
      'uglify-js', // Has require.resolve issues when bundled
      'yargs' // Uses createRequire internally
    ],
    
    // Metadata
    metafile: true,
    logLevel: 'info',
    
    // Keep original function names for better stack traces
    keepNames: false,

    // Other
    platform: 'node',
    charset: 'utf8',
    legalComments: 'none',
    
    // Entry and output
    entryPoints: ['index.js'],
    outfile: 'dist/index.js'
  })

  // Write bundle analysis
  if (result.metafile) {
    writeFileSync('dist/meta.json', JSON.stringify(result.metafile, null, 2))
    
    // Calculate total size
    const outputs = Object.values(result.metafile.outputs)
    const totalBytes = outputs.reduce((sum, out) => sum + out.bytes, 0)
    const totalKB = (totalBytes / 1024).toFixed(2)
    
    console.log(`✅ Bundle complete! Total size: ${totalKB} KB`)
    console.log('📊 Bundle analysis saved to dist/meta.json')
    console.log('💡 Analyze with: npx esbuild-visualizer --metadata dist/meta.json')
  }

  console.log('✨ Build finished!')
}

build().catch(err => {
  console.error('❌ Build failed:', err)
  process.exit(1)
})
