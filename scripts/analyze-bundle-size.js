#!/usr/bin/env node

/**
 * Bundle Size Analyzer
 * Identifies heavy dependencies and optimization opportunities
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

async function analyzeBundleSize() {
  console.log('📦 Analyzing bundle size and dependencies...')
  
  // Analyze package.json dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
  
  // Find large dependencies
  const largeDependencies = []
  
  for (const [name, version] of Object.entries(dependencies)) {
    try {
      const packagePath = path.join('node_modules', name)
      if (fs.existsSync(packagePath)) {
        const size = getDirectorySize(packagePath)
        if (size > 1024 * 1024) { // > 1MB
          largeDependencies.push({ name, version, size: formatBytes(size) })
        }
      }
    } catch (error) {
      // Skip packages that can't be analyzed
    }
  }
  
  // Sort by size
  largeDependencies.sort((a, b) => parseSize(b.size) - parseSize(a.size))
  
  console.log('\n🔍 Large Dependencies (> 1MB):')
  console.log('=' .repeat(50))
  largeDependencies.slice(0, 10).forEach(dep => {
    console.log(`${dep.name.padEnd(30)} ${dep.size}`)
  })
  
  // Suggest optimizations
  console.log('\n💡 Optimization Suggestions:')
  generateOptimizationSuggestions(largeDependencies)
  
  // Create optimization report
  const report = {
    timestamp: new Date().toISOString(),
    largeDependencies,
    totalDependencies: Object.keys(dependencies).length,
    optimizationSuggestions: generateOptimizationSuggestions(largeDependencies, true)
  }
  
  fs.writeFileSync('.next/bundle-analysis.json', JSON.stringify(report, null, 2))
  console.log('\n📄 Full report saved to: .next/bundle-analysis.json')
}

function getDirectorySize(dirPath) {
  let size = 0
  
  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath)
    
    if (stats.isFile()) {
      size += stats.size
    } else if (stats.isDirectory()) {
      const items = fs.readdirSync(itemPath)
      items.forEach(item => {
        calculateSize(path.join(itemPath, item))
      })
    }
  }
  
  try {
    calculateSize(dirPath)
  } catch (error) {
    // Handle permission errors or missing files
  }
  
  return size
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

function parseSize(sizeStr) {
  const match = sizeStr.match(/^([\d.]+)\s*(\w+)$/)
  if (!match) return 0
  
  const [, value, unit] = match
  const multipliers = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 }
  return parseFloat(value) * (multipliers[unit] || 1)
}

function generateOptimizationSuggestions(largeDependencies, returnArray = false) {
  const suggestions = []
  
  // Check for common optimization opportunities
  const dependencyNames = largeDependencies.map(d => d.name)
  
  if (dependencyNames.includes('moment')) {
    suggestions.push('Replace moment.js with date-fns for smaller bundle size')
  }
  
  if (dependencyNames.includes('lodash')) {
    suggestions.push('Use lodash-es or individual lodash functions to enable tree-shaking')
  }
  
  if (dependencyNames.includes('@tanstack/react-query')) {
    suggestions.push('Consider using React Query DevTools conditionally in development only')
  }
  
  if (dependencyNames.includes('recharts')) {
    suggestions.push('Consider lazy loading chart components to reduce initial bundle size')
  }
  
  if (dependencyNames.some(name => name.includes('polyfill'))) {
    suggestions.push('Review polyfills - modern browsers may not need all of them')
  }
  
  if (largeDependencies.length > 5) {
    suggestions.push('Consider implementing dynamic imports for large dependencies')
    suggestions.push('Enable code splitting in Next.js configuration')
    suggestions.push('Use bundle analyzer to identify duplicate dependencies')
  }
  
  suggestions.push('Enable tree-shaking by using ES modules imports')
  suggestions.push('Consider using lighter alternatives for heavy dependencies')
  
  if (returnArray) {
    return suggestions
  }
  
  suggestions.forEach(suggestion => {
    console.log(`  • ${suggestion}`)
  })
}

// Run analysis if called directly
if (require.main === module) {
  analyzeBundleSize().catch(console.error)
}

module.exports = { analyzeBundleSize }