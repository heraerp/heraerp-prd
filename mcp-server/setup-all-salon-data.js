#!/usr/bin/env node
/**
 * Setup All Salon Test Data
 * Runs all test data scripts for salon
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const scripts = [
  'setup-salon-appointments-data.js',
  'setup-salon-inventory-data.js',
  'setup-salon-reports-data.js',
  'setup-salon-settings-data.js'
]

console.log('🎯 Setting up all salon test data...\n')

scripts.forEach(script => {
  const scriptPath = path.join(__dirname, script)
  if (fs.existsSync(scriptPath)) {
    console.log(`\n📝 Running ${script}...\n`)
    try {
      execSync(`node ${script}`, { stdio: 'inherit', cwd: __dirname })
    } catch (error) {
      console.error(`❌ Failed to run ${script}: ${error.message}`)
    }
  } else {
    console.log(`⚠️  Script not found: ${script}`)
  }
})

console.log('\n✅ All salon test data setup complete!')
