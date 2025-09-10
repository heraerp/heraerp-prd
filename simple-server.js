#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const HOST = process.env.HOSTNAME || '0.0.0.0'

console.log('Starting HERA ERP...')
console.log(`PORT: ${PORT}`)
console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
console.log('Starting Next.js application...')

// Check for build artifacts
const nextDir = path.join(process.cwd(), '.next')
const prerenderManifest = path.join(nextDir, 'prerender-manifest.json')
const standaloneServer = path.join(nextDir, 'standalone', 'server.js')
const buildIdFile = path.join(nextDir, 'BUILD_ID')

console.log('Checking for build artifacts...')
console.log(`Current directory: ${process.cwd()}`)
console.log(`.next directory exists: ${fs.existsSync(nextDir)}`)

if (fs.existsSync(nextDir)) {
  console.log('Contents of .next directory:')
  try {
    const files = fs.readdirSync(nextDir)
    files.forEach(file => console.log(`  - ${file}`))
  } catch (err) {
    console.error('Error reading .next directory:', err)
  }
}

console.log(`prerender-manifest.json exists: ${fs.existsSync(prerenderManifest)}`)
console.log(`standalone/server.js exists: ${fs.existsSync(standaloneServer)}`)
console.log(`BUILD_ID exists: ${fs.existsSync(buildIdFile)}`)

function startProc(cmd, args, extraEnv = {}) {
  return spawn(cmd, args, {
    env: { ...process.env, PORT: PORT, HOSTNAME: HOST, ...extraEnv },
    stdio: 'inherit'
  })
}

let child

// Prefer running the standalone server if it exists
if (fs.existsSync(standaloneServer)) {
  console.log('Detected .next/standalone build. Launching standalone server...')
  child = startProc('node', [standaloneServer])
} else if (fs.existsSync(prerenderManifest)) {
  console.log('Detected standard Next build. Launching next start...')
  child = startProc('npx', ['next', 'start', '-p', String(PORT), '-H', HOST])
} else {
  console.error('[fatal] Missing build artifacts (.next).')
  console.error('Expected at least .next/prerender-manifest.json or .next/standalone/server.js')
  console.error('This usually means the image was built without a successful `next build`.')
  console.error('Action: Fix build errors and rebuild the image. Avoid swallowing build failures.')
  
  // List root directory contents to help debug
  console.error('\nRoot directory contents:')
  try {
    const rootFiles = fs.readdirSync(process.cwd())
    rootFiles.forEach(file => console.error(`  - ${file}`))
  } catch (err) {
    console.error('Error reading root directory:', err)
  }
  
  process.exit(1)
}

child.on('error', err => {
  console.error('Failed to start Next.js:', err)
  process.exit(1)
})

child.on('exit', code => {
  console.log(`Next.js exited with code ${code}`)
  process.exit(code || 0)
})

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received')
  child && child.kill('SIGTERM')
})

process.on('SIGINT', () => {
  console.log('SIGINT received')
  child && child.kill('SIGINT')
})