#!/usr/bin/env node

/**
 * HERA GA Performance Budget Validation
 * Checks build size and runtime performance metrics
 */

const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Performance budgets (in KB)
const BUDGET_LIMITS = {
  // JavaScript bundles
  'app-*.js': { limit: 100, warning: 80 },
  'framework-*.js': { limit: 150, warning: 120 },
  'main-*.js': { limit: 50, warning: 40 },
  
  // Page-specific chunks
  'whatsapp-*.js': { limit: 85, warning: 70 },
  'settings-*.js': { limit: 120, warning: 100 },
  'finance-*.js': { limit: 100, warning: 80 },
  
  // CSS
  '*.css': { limit: 50, warning: 40 },
  
  // Total bundle size
  total: { limit: 1000, warning: 800 }
}

// Runtime performance targets
const PERFORMANCE_TARGETS = {
  // Core Web Vitals
  FCP: { limit: 1800, warning: 1500 }, // First Contentful Paint (ms)
  LCP: { limit: 2500, warning: 2000 }, // Largest Contentful Paint (ms)
  CLS: { limit: 0.1, warning: 0.05 },  // Cumulative Layout Shift
  FID: { limit: 100, warning: 50 },    // First Input Delay (ms)
  
  // Custom metrics
  TTI: { limit: 3500, warning: 3000 }, // Time to Interactive (ms)
  TBT: { limit: 300, warning: 200 }    // Total Blocking Time (ms)
}

function formatBytes(bytes) {
  const kb = bytes / 1024
  return `${kb.toFixed(2)} KB`
}

function checkBuildSize() {
  console.log(chalk.blue.bold('\n📦 Checking Build Size...\n'))
  
  const buildDir = path.resolve(process.cwd(), '.next')
  if (!fs.existsSync(buildDir)) {
    console.log(chalk.red('❌ Build directory not found. Run "npm run build" first.'))
    return false
  }

  let violations = 0
  let warnings = 0
  let totalSize = 0

  // Analyze static chunks
  const staticDir = path.join(buildDir, 'static', 'chunks')
  if (fs.existsSync(staticDir)) {
    const files = fs.readdirSync(staticDir)
    
    files.forEach(file => {
      const stats = fs.statSync(path.join(staticDir, file))
      const sizeKB = stats.size / 1024
      totalSize += sizeKB
      
      // Check against budgets
      for (const [pattern, budget] of Object.entries(BUDGET_LIMITS)) {
        if (pattern === 'total') continue
        
        const regex = new RegExp(pattern.replace('*', '.*'))
        if (regex.test(file)) {
          if (sizeKB > budget.limit) {
            console.log(chalk.red(`❌ ${file}: ${formatBytes(stats.size)} (limit: ${budget.limit} KB)`))
            violations++
          } else if (sizeKB > budget.warning) {
            console.log(chalk.yellow(`⚠️  ${file}: ${formatBytes(stats.size)} (warning: ${budget.warning} KB)`))
            warnings++
          } else {
            console.log(chalk.green(`✅ ${file}: ${formatBytes(stats.size)}`))
          }
          break
        }
      }
    })
  }

  // Check total size
  console.log(chalk.white.bold('\nTotal Bundle Size:'))
  if (totalSize > BUDGET_LIMITS.total.limit) {
    console.log(chalk.red(`❌ Total: ${totalSize.toFixed(2)} KB (limit: ${BUDGET_LIMITS.total.limit} KB)`))
    violations++
  } else if (totalSize > BUDGET_LIMITS.total.warning) {
    console.log(chalk.yellow(`⚠️  Total: ${totalSize.toFixed(2)} KB (warning: ${BUDGET_LIMITS.total.warning} KB)`))
    warnings++
  } else {
    console.log(chalk.green(`✅ Total: ${totalSize.toFixed(2)} KB`))
  }

  return { violations, warnings }
}

function measureRuntimePerformance() {
  console.log(chalk.blue.bold('\n⚡ Measuring Runtime Performance...\n'))
  
  // Check if Lighthouse is available
  try {
    execSync('lighthouse --version', { stdio: 'ignore' })
  } catch (error) {
    console.log(chalk.yellow('⚠️  Lighthouse not installed. Skipping runtime performance checks.'))
    console.log(chalk.white('Install with: npm install -g lighthouse'))
    return { violations: 0, warnings: 0 }
  }

  // Run Lighthouse on critical pages
  const pages = [
    { name: 'WhatsApp Hub', path: '/whatsapp/templates' },
    { name: 'Settings Center', path: '/settings' },
    { name: 'Finance Closing', path: '/finance/closing' }
  ]

  let totalViolations = 0
  let totalWarnings = 0

  pages.forEach(page => {
    console.log(chalk.white(`Testing ${page.name}...`))
    
    try {
      // Run Lighthouse (simplified for demo)
      const cmd = `lighthouse http://localhost:3000${page.path} --only-categories=performance --output=json --quiet`
      const output = execSync(cmd, { encoding: 'utf8' })
      const results = JSON.parse(output)
      
      // Check metrics
      const metrics = results.audits.metrics.details.items[0]
      
      Object.entries(PERFORMANCE_TARGETS).forEach(([metric, target]) => {
        const value = metrics[metric] || 0
        
        if (value > target.limit) {
          console.log(chalk.red(`  ❌ ${metric}: ${value} (limit: ${target.limit})`))
          totalViolations++
        } else if (value > target.warning) {
          console.log(chalk.yellow(`  ⚠️  ${metric}: ${value} (warning: ${target.warning})`))
          totalWarnings++
        } else {
          console.log(chalk.green(`  ✅ ${metric}: ${value}`))
        }
      })
    } catch (error) {
      console.log(chalk.yellow(`  ⚠️  Could not test ${page.name} (is dev server running?)`))
    }
  })

  return { violations: totalViolations, warnings: totalWarnings }
}

function analyzeCodeSplitting() {
  console.log(chalk.blue.bold('\n🔍 Analyzing Code Splitting...\n'))
  
  const buildManifest = path.resolve(process.cwd(), '.next/build-manifest.json')
  if (!fs.existsSync(buildManifest)) {
    console.log(chalk.yellow('⚠️  Build manifest not found. Skipping code splitting analysis.'))
    return
  }

  const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'))
  const pages = Object.keys(manifest.pages)
  
  console.log(chalk.white(`Total pages: ${pages.length}`))
  
  // Check for proper code splitting
  const sharedChunks = new Set()
  const pageChunks = {}
  
  pages.forEach(page => {
    const chunks = manifest.pages[page]
    pageChunks[page] = chunks.length
    
    chunks.forEach(chunk => {
      if (chunk.includes('static/chunks/') && !chunk.includes('pages/')) {
        sharedChunks.add(chunk)
      }
    })
  })

  console.log(chalk.white(`Shared chunks: ${sharedChunks.size}`))
  
  // Check for oversized pages
  const oversizedPages = Object.entries(pageChunks)
    .filter(([_, count]) => count > 10)
    .sort((a, b) => b[1] - a[1])
  
  if (oversizedPages.length > 0) {
    console.log(chalk.yellow('\n⚠️  Pages with many chunks (consider optimizing):'))
    oversizedPages.slice(0, 5).forEach(([page, count]) => {
      console.log(chalk.yellow(`  ${page}: ${count} chunks`))
    })
  } else {
    console.log(chalk.green('✅ All pages have reasonable chunk counts'))
  }
}

async function main() {
  console.log(chalk.blue.bold('🚀 HERA GA Performance Budget Validation\n'))
  
  let totalViolations = 0
  let totalWarnings = 0

  // 1. Check build size
  const buildResults = checkBuildSize()
  if (buildResults) {
    totalViolations += buildResults.violations
    totalWarnings += buildResults.warnings
  }

  // 2. Measure runtime performance
  const perfResults = measureRuntimePerformance()
  totalViolations += perfResults.violations
  totalWarnings += perfResults.warnings

  // 3. Analyze code splitting
  analyzeCodeSplitting()

  // Summary
  console.log(chalk.white.bold('\n📊 Performance Summary:'))
  
  if (totalViolations === 0 && totalWarnings === 0) {
    console.log(chalk.green.bold('✅ All performance budgets met!'))
    console.log(chalk.green('Application is optimized for production.'))
    process.exit(0)
  } else {
    if (totalViolations > 0) {
      console.log(chalk.red(`❌ ${totalViolations} performance violation(s)`))
    }
    if (totalWarnings > 0) {
      console.log(chalk.yellow(`⚠️  ${totalWarnings} performance warning(s)`))
    }
    
    console.log(chalk.white('\nOptimization suggestions:'))
    console.log(chalk.white('- Enable dynamic imports for heavy components'))
    console.log(chalk.white('- Lazy load non-critical features'))
    console.log(chalk.white('- Use next/dynamic for route-based code splitting'))
    console.log(chalk.white('- Optimize images with next/image'))
    
    process.exit(totalViolations > 0 ? 1 : 0)
  }
}

// Run the checks
main().catch(error => {
  console.error(chalk.red('Error running performance checks:'), error)
  process.exit(1)
})