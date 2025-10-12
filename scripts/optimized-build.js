#!/usr/bin/env node

/**
 * HERA Optimized Build Script
 * Implements advanced build optimizations for faster compilation
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// Build configuration
const BUILD_CONFIG = {
  // Memory settings
  maxOldSpaceSize: process.env.CI ? '4096' : '8192',
  
  // Build modes
  mode: process.env.NODE_ENV || 'production',
  
  // Optimization flags
  enableSourceMaps: process.env.BUILD_SOURCE_MAPS === 'true',
  enableBundleAnalyzer: process.env.ANALYZE === 'true',
  enableTurbo: process.env.BUILD_TURBO !== 'false',
  
  // Parallelization
  maxWorkers: process.env.BUILD_MAX_WORKERS || Math.max(1, require('os').cpus().length - 1)
}

console.log('🚀 HERA Optimized Build Starting...')
console.log('📊 Build Configuration:', BUILD_CONFIG)

async function optimizedBuild() {
  const startTime = Date.now()
  
  try {
    // Step 1: Clean previous build artifacts
    console.log('🧹 Cleaning build artifacts...')
    await cleanBuildArtifacts()
    
    // Step 2: Pre-build optimizations
    console.log('⚡ Running pre-build optimizations...')
    await preBuildOptimizations()
    
    // Step 3: TypeScript compilation with optimizations
    console.log('🔧 Starting optimized TypeScript compilation...')
    await runOptimizedTypeScriptBuild()
    
    // Step 4: Next.js build with enhanced settings
    console.log('📦 Starting Next.js build...')
    await runOptimizedNextBuild()
    
    // Step 5: Post-build optimizations
    console.log('✨ Running post-build optimizations...')
    await postBuildOptimizations()
    
    const duration = (Date.now() - startTime) / 1000
    console.log(`✅ Build completed successfully in ${duration.toFixed(2)}s`)
    
  } catch (error) {
    console.error('❌ Build failed:', error.message)
    process.exit(1)
  }
}

async function cleanBuildArtifacts() {
  // In Docker with cache mounts, avoid cleaning mounted cache directories
  const isDocker = process.env.CI || fs.existsSync('/.dockerenv')
  
  if (isDocker) {
    // Only clean non-cache directories in Docker
    const dirsToClean = ['.next/server', '.next/static', '.next/standalone']
    
    for (const dir of dirsToClean) {
      if (fs.existsSync(dir)) {
        await execCommand(`rm -rf ${dir}`)
      }
    }
    
    // Clean files but preserve cache directories
    const filesToClean = ['.next/BUILD_ID', '.next/export-marker.json', '.next/prerender-manifest.json']
    for (const file of filesToClean) {
      if (fs.existsSync(file)) {
        await execCommand(`rm -f ${file}`)
      }
    }
  } else {
    // Local development - clean everything
    const dirsToClean = ['.next', 'node_modules/.cache']
    
    for (const dir of dirsToClean) {
      if (fs.existsSync(dir)) {
        await execCommand(`rm -rf ${dir}`)
      }
    }
  }
}

async function preBuildOptimizations() {
  // Create optimized TypeScript build info directory
  const tsBuildInfoDir = '.next'
  if (!fs.existsSync(tsBuildInfoDir)) {
    fs.mkdirSync(tsBuildInfoDir, { recursive: true })
  }
  
  // Set environment variables for optimal build
  process.env.NEXT_TELEMETRY_DISABLED = '1'
  process.env.NODE_OPTIONS = `--max-old-space-size=${BUILD_CONFIG.maxOldSpaceSize}`
  
  if (BUILD_CONFIG.enableTurbo) {
    process.env.TURBOPACK = '1'
  }
}

async function runOptimizedTypeScriptBuild() {
  // Skip TypeScript compilation during Next.js build for faster iteration
  // TypeScript checking is done separately
  const tscArgs = [
    '--noEmit',
    '--incremental',
    '--tsBuildInfoFile', '.next/tsbuildinfo'
  ]
  
  if (process.env.CI) {
    // Faster CI builds - skip detailed type checking
    tscArgs.push('--skipLibCheck')
  }
  
  await execCommand(`npx tsc ${tscArgs.join(' ')}`)
}

async function runOptimizedNextBuild() {
  const buildArgs = []
  
  // Add debugging flags for development
  if (BUILD_CONFIG.mode === 'development') {
    buildArgs.push('--debug')
  }
  
  // Build command with optimizations
  const buildCmd = [
    'node',
    `--max-old-space-size=${BUILD_CONFIG.maxOldSpaceSize}`,
    '--max-semi-space-size=512',
    '--max-heap-size=8192',
    '-r', './scripts/patch-read-css.cjs',
    '-r', './scripts/patch-guard-alias.cjs',
    './node_modules/next/dist/bin/next',
    'build',
    ...buildArgs
  ].join(' ')
  
  await execCommand(buildCmd, {
    env: {
      ...process.env,
      // Optimize Node.js garbage collection
      NODE_OPTIONS: `--max-old-space-size=${BUILD_CONFIG.maxOldSpaceSize} --max-semi-space-size=512`,
      // Disable Next.js telemetry for faster builds
      NEXT_TELEMETRY_DISABLED: '1',
      // Enable SWC minification
      NEXT_COMPILER_SWC: '1',
      // Optimize webpack
      WEBPACK_DISABLE_EMIT_PLUGIN: 'true'
    }
  })
}

async function postBuildOptimizations() {
  // Run post-build optimizations
  if (fs.existsSync('./scripts/ensure-default-stylesheet.js')) {
    await execCommand('node ./scripts/ensure-default-stylesheet.js')
  }
  
  // Generate build report
  await generateBuildReport()
}

async function generateBuildReport() {
  const nextDir = '.next'
  if (!fs.existsSync(nextDir)) return
  
  const buildSizes = await getBuildSizes()
  const report = {
    timestamp: new Date().toISOString(),
    duration: 'N/A', // Would need to track from start
    sizes: buildSizes,
    config: BUILD_CONFIG
  }
  
  fs.writeFileSync('.next/build-report.json', JSON.stringify(report, null, 2))
  console.log('📋 Build report generated: .next/build-report.json')
}

async function getBuildSizes() {
  try {
    const { execSync } = require('child_process')
    const output = execSync('du -sh .next', { encoding: 'utf8' })
    return {
      total: output.trim().split('\t')[0]
    }
  } catch (error) {
    return { total: 'unknown' }
  }
}

function execCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command}`)
    
    const child = spawn(command, {
      shell: true,
      stdio: 'inherit',
      ...options
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${command}`))
      }
    })
    
    child.on('error', reject)
  })
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n🛑 Build interrupted by user')
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Build terminated')
  process.exit(1)
})

// Run the optimized build
if (require.main === module) {
  optimizedBuild().catch(error => {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  })
}

module.exports = { optimizedBuild, BUILD_CONFIG }