#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const cwd = process.cwd()
const nextDir = path.join(cwd, '.next')
const buildId = path.join(nextDir, 'BUILD_ID')
const prerenderManifest = path.join(nextDir, 'prerender-manifest.json')
const standaloneServer = path.join(nextDir, 'standalone', 'server.js')

function exists(p) {
  try {
    return fs.existsSync(p)
  } catch (_) {
    return false
  }
}

console.log('🔍 Verifying Next.js build artifacts...')

if (!exists(nextDir)) {
  console.error('❌ .next directory is missing. Build did not produce artifacts.')
  process.exit(1)
}

const hasBuildId = exists(buildId)
const hasPrerender = exists(prerenderManifest)
const hasStandalone = exists(standaloneServer)

if (!hasPrerender && !hasStandalone) {
  console.error('❌ Missing required Next.js artifacts:')
  console.error(`   - ${prerenderManifest}`)
  console.error(`   - ${standaloneServer}`)
  console.error('At least one must exist. Ensure `next build` completed successfully.')
  process.exit(1)
}

console.log('✅ Next.js build artifacts verified:')
console.log(`   BUILD_ID: ${hasBuildId ? 'present' : 'missing'}`)
console.log(`   prerender-manifest.json: ${hasPrerender ? 'present' : 'missing'}`)
console.log(`   standalone/server.js: ${hasStandalone ? 'present' : 'missing'}`)

