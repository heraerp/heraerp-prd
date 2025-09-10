#!/usr/bin/env node

const { execSync } = require('child_process')

console.log('🚀 Running improved pre-deployment checks...')

try {
  // Run the fix script first
  console.log('1️⃣ Running common issue fixes...')
  execSync('node scripts/fix-common-issues.js', { stdio: 'inherit' })
  
  // Run original predeploy
  console.log('2️⃣ Running original pre-deploy checks...')
  execSync('node scripts/pre-deploy.js', { stdio: 'inherit' })
  
  console.log('✅ Pre-deployment checks completed successfully')
  
} catch (error) {
  console.error('❌ Pre-deployment check failed:', error.message)
  console.log('\n🔧 This indicates there are still issues to fix before deployment.')
  console.log('Please run the build locally and fix any remaining errors.')
  process.exit(1)
}
