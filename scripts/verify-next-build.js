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

// Additional Railway-specific checks
if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_DEPLOYMENT_ID) {
  console.log('\n🚂 Railway deployment checks:')
  
  // Check Node.js version compatibility
  const nodeVersion = process.version
  console.log(`   Node.js version: ${nodeVersion}`)
  
  // Check memory usage
  const memoryUsage = process.memoryUsage()
  const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
  console.log(`   Current memory usage: ${memoryMB}MB`)
  
  // Check standalone server content
  if (hasStandalone) {
    try {
      const serverSize = fs.statSync(standaloneServer).size
      console.log(`   Standalone server size: ${Math.round(serverSize / 1024)}KB`)
      
      const serverContent = fs.readFileSync(standaloneServer, 'utf8')
      if (serverContent.includes('nextServer.prepare') || serverContent.includes('createServer')) {
        console.log('   ✅ Standalone server appears to be valid Next.js server')
      } else {
        console.warn('   ⚠️  Standalone server content may be incomplete')
      }
    } catch (error) {
      console.warn(`   ⚠️  Could not analyze standalone server: ${error.message}`)
    }
  }
  
  // Check for common deployment issues
  const packageJson = path.join(nextDir, 'standalone', 'package.json')
  if (exists(packageJson)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'))
      console.log(`   ✅ Standalone package.json exists (scripts: ${Object.keys(pkg.scripts || {}).length})`)
    } catch (error) {
      console.warn(`   ⚠️  Standalone package.json is malformed: ${error.message}`)
    }
  }
}

