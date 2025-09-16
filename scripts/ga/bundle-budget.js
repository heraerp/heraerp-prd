#!/usr/bin/env node

/**
 * HERA GA Bundle Size Budget Validation
 * Analyzes webpack bundles and enforces size limits
 */

const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// Bundle size budgets (in KB)
const BUNDLE_BUDGETS = {
  // Main bundles
  'main': { limit: 50, warning: 40 },
  'framework': { limit: 150, warning: 120 },
  'webpack': { limit: 5, warning: 3 },
  
  // Feature bundles
  'pages/whatsapp': { limit: 85, warning: 70 },
  'pages/settings': { limit: 120, warning: 100 },
  'pages/finance': { limit: 100, warning: 80 },
  
  // Common chunks
  'commons': { limit: 50, warning: 40 },
  'shared': { limit: 60, warning: 50 },
  
  // Total first load
  firstLoad: { limit: 300, warning: 250 },
  
  // Total size
  total: { limit: 1000, warning: 800 }
}

// Critical routes for first load analysis
const CRITICAL_ROUTES = [
  '/whatsapp/hub',
  '/settings',
  '/finance/closing'
]

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath)
    return stats.size
  } catch (error) {
    return 0
  }
}

function getGzipSize(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath)
    const gzipped = zlib.gzipSync(fileContent)
    return gzipped.length
  } catch (error) {
    return 0
  }
}

function formatSize(bytes) {
  const kb = bytes / 1024
  if (kb < 1) {
    return `${bytes} B`
  } else if (kb < 1024) {
    return `${kb.toFixed(2)} KB`
  } else {
    return `${(kb / 1024).toFixed(2)} MB`
  }
}

function analyzeBuildManifest() {
  const manifestPath = path.join(process.cwd(), '.next/build-manifest.json')
  if (!fs.existsSync(manifestPath)) {
    console.log(chalk.red('❌ Build manifest not found. Run "npm run build" first.'))
    return null
  }
  
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
}

function analyzeAppBuildManifest() {
  const manifestPath = path.join(process.cwd(), '.next/app-build-manifest.json')
  if (!fs.existsSync(manifestPath)) {
    return null
  }
  
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
}

function checkBundleSizes() {
  console.log(chalk.blue.bold('\n📦 Analyzing Bundle Sizes...\n'))
  
  const chunksDir = path.join(process.cwd(), '.next/static/chunks')
  if (!fs.existsSync(chunksDir)) {
    console.log(chalk.red('❌ Build chunks not found. Run "npm run build" first.'))
    return { violations: 0, warnings: 0 }
  }

  let violations = 0
  let warnings = 0
  const bundleSizes = {}
  let totalSize = 0
  let totalGzipSize = 0

  // Analyze chunks directory
  const analyzeDirectory = (dir, prefix = '') => {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        analyzeDirectory(filePath, path.join(prefix, file))
      } else if (file.endsWith('.js')) {
        const size = getFileSize(filePath)
        const gzipSize = getGzipSize(filePath)
        const sizeKB = size / 1024
        const gzipSizeKB = gzipSize / 1024
        
        totalSize += sizeKB
        totalGzipSize += gzipSizeKB
        
        // Match against budgets
        const bundleKey = prefix ? `${prefix}/${file}` : file
        let matched = false
        
        for (const [pattern, budget] of Object.entries(BUNDLE_BUDGETS)) {
          if (pattern === 'firstLoad' || pattern === 'total') continue
          
          if (bundleKey.includes(pattern) || file.includes(pattern)) {
            matched = true
            
            if (gzipSizeKB > budget.limit) {
              console.log(chalk.red(`❌ ${bundleKey}: ${formatSize(gzipSize)} gzipped (limit: ${budget.limit} KB)`))
              violations++
            } else if (gzipSizeKB > budget.warning) {
              console.log(chalk.yellow(`⚠️  ${bundleKey}: ${formatSize(gzipSize)} gzipped (warning: ${budget.warning} KB)`))
              warnings++
            } else {
              console.log(chalk.green(`✅ ${bundleKey}: ${formatSize(gzipSize)} gzipped`))
            }
            
            bundleSizes[pattern] = (bundleSizes[pattern] || 0) + gzipSizeKB
            break
          }
        }
        
        if (!matched && gzipSizeKB > 50) {
          console.log(chalk.yellow(`⚠️  ${bundleKey}: ${formatSize(gzipSize)} gzipped (uncategorized)`))
          warnings++
        }
      }
    })
  }

  analyzeDirectory(chunksDir)

  // Check total size
  console.log(chalk.white.bold('\n📊 Total Bundle Sizes:'))
  console.log(chalk.white(`Raw: ${formatSize(totalSize * 1024)}`))
  console.log(chalk.white(`Gzipped: ${formatSize(totalGzipSize * 1024)}`))
  
  if (totalGzipSize > BUNDLE_BUDGETS.total.limit) {
    console.log(chalk.red(`❌ Total size exceeds limit (${BUNDLE_BUDGETS.total.limit} KB)`))
    violations++
  } else if (totalGzipSize > BUNDLE_BUDGETS.total.warning) {
    console.log(chalk.yellow(`⚠️  Total size approaching limit (warning: ${BUNDLE_BUDGETS.total.warning} KB)`))
    warnings++
  } else {
    console.log(chalk.green('✅ Total size within budget'))
  }

  return { violations, warnings, bundleSizes, totalGzipSize }
}

function analyzeFirstLoadJS() {
  console.log(chalk.blue.bold('\n⚡ Analyzing First Load JS...\n'))
  
  const manifest = analyzeBuildManifest()
  const appManifest = analyzeAppBuildManifest()
  
  if (!manifest && !appManifest) {
    console.log(chalk.yellow('⚠️  Could not analyze first load JS'))
    return { violations: 0, warnings: 0 }
  }

  let violations = 0
  let warnings = 0

  CRITICAL_ROUTES.forEach(route => {
    console.log(chalk.white(`\nAnalyzing ${route}:`))
    
    let firstLoadSize = 0
    const chunks = new Set()
    
    // Collect chunks for this route
    if (manifest && manifest.pages[route]) {
      manifest.pages[route].forEach(chunk => chunks.add(chunk))
    }
    
    // Add framework chunks
    if (manifest && manifest.pages['/_app']) {
      manifest.pages['/_app'].forEach(chunk => chunks.add(chunk))
    }
    
    // Calculate total size
    chunks.forEach(chunk => {
      const chunkPath = path.join(process.cwd(), '.next', chunk)
      firstLoadSize += getGzipSize(chunkPath) / 1024
    })
    
    console.log(chalk.white(`First Load JS: ${firstLoadSize.toFixed(2)} KB`))
    
    if (firstLoadSize > BUNDLE_BUDGETS.firstLoad.limit) {
      console.log(chalk.red(`❌ Exceeds first load limit (${BUNDLE_BUDGETS.firstLoad.limit} KB)`))
      violations++
    } else if (firstLoadSize > BUNDLE_BUDGETS.firstLoad.warning) {
      console.log(chalk.yellow(`⚠️  Approaching first load limit (warning: ${BUNDLE_BUDGETS.firstLoad.warning} KB)`))
      warnings++
    } else {
      console.log(chalk.green('✅ First load within budget'))
    }
  })

  return { violations, warnings }
}

function analyzeDuplicates() {
  console.log(chalk.blue.bold('\n🔍 Checking for Duplicate Modules...\n'))
  
  const statsPath = path.join(process.cwd(), '.next/webpack-stats.json')
  if (!fs.existsSync(statsPath)) {
    console.log(chalk.yellow('⚠️  Webpack stats not available. Run build with ANALYZE=true'))
    return
  }
  
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'))
  const modules = {}
  
  // Collect module usage
  stats.chunks.forEach(chunk => {
    chunk.modules.forEach(module => {
      const name = module.name
      if (!modules[name]) {
        modules[name] = { size: module.size, chunks: [] }
      }
      modules[name].chunks.push(chunk.names[0] || chunk.id)
    })
  })
  
  // Find duplicates
  const duplicates = Object.entries(modules)
    .filter(([_, info]) => info.chunks.length > 2)
    .sort((a, b) => b[1].size - a[1].size)
  
  if (duplicates.length > 0) {
    console.log(chalk.yellow(`⚠️  Found ${duplicates.length} duplicate modules:`))
    duplicates.slice(0, 5).forEach(([name, info]) => {
      console.log(chalk.yellow(`   ${name}: ${formatSize(info.size)} in ${info.chunks.length} chunks`))
    })
    console.log(chalk.white('\nConsider extracting these to a shared chunk'))
  } else {
    console.log(chalk.green('✅ No significant duplicate modules found'))
  }
}

function provideOptimizationSuggestions(results) {
  console.log(chalk.blue.bold('\n💡 Optimization Suggestions:\n'))
  
  const suggestions = []
  
  // Check specific bundle sizes
  if (results.bundleSizes) {
    if (results.bundleSizes['pages/settings'] > 100) {
      suggestions.push('Settings bundle is large. Consider lazy loading subsections.')
    }
    if (results.bundleSizes['pages/finance'] > 80) {
      suggestions.push('Finance bundle could be optimized. Split chart libraries into separate chunks.')
    }
  }
  
  // General suggestions based on total size
  if (results.totalGzipSize > 800) {
    suggestions.push('Total bundle size is high. Enable route-based code splitting.')
    suggestions.push('Use dynamic imports for heavy components (charts, editors).')
    suggestions.push('Audit and remove unused dependencies.')
  }
  
  if (suggestions.length > 0) {
    suggestions.forEach((suggestion, index) => {
      console.log(chalk.white(`${index + 1}. ${suggestion}`))
    })
  } else {
    console.log(chalk.green('Bundle sizes are well optimized!'))
  }
  
  // Show example optimizations
  console.log(chalk.white.bold('\n📝 Example optimizations:'))
  console.log(chalk.gray('// Before'))
  console.log(chalk.gray("import { Chart } from 'react-charts'"))
  console.log(chalk.gray('\n// After'))
  console.log(chalk.gray("const Chart = dynamic(() => import('react-charts').then(mod => mod.Chart), {"))
  console.log(chalk.gray("  loading: () => <ChartSkeleton />,"))
  console.log(chalk.gray("  ssr: false"))
  console.log(chalk.gray('})'))
}

async function main() {
  console.log(chalk.blue.bold('📊 HERA GA Bundle Budget Validation\n'))
  
  let totalViolations = 0
  let totalWarnings = 0

  // 1. Check bundle sizes
  const bundleResults = checkBundleSizes()
  totalViolations += bundleResults.violations
  totalWarnings += bundleResults.warnings

  // 2. Analyze first load JS
  const firstLoadResults = analyzeFirstLoadJS()
  totalViolations += firstLoadResults.violations
  totalWarnings += firstLoadResults.warnings

  // 3. Check for duplicates
  analyzeDuplicates()

  // 4. Provide optimization suggestions
  provideOptimizationSuggestions(bundleResults)

  // Summary
  console.log(chalk.white.bold('\n📊 Bundle Budget Summary:'))
  
  if (totalViolations === 0 && totalWarnings === 0) {
    console.log(chalk.green.bold('✅ All bundle budgets met!'))
    console.log(chalk.green('Application bundles are optimized for production.'))
    process.exit(0)
  } else {
    if (totalViolations > 0) {
      console.log(chalk.red(`❌ ${totalViolations} budget violation(s)`))
    }
    if (totalWarnings > 0) {
      console.log(chalk.yellow(`⚠️  ${totalWarnings} budget warning(s)`))
    }
    
    process.exit(totalViolations > 0 ? 1 : 0)
  }
}

// Run the validation
main().catch(error => {
  console.error(chalk.red('Error running bundle validation:'), error)
  process.exit(1)
})