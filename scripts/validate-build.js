#!/usr/bin/env node

/**
 * HERA Build Validation Script
 * Automatically validates builds after code generation
 * Implements Claude's automatic build checking requirement
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔧 HERA Build Validation Starting...')

const validationSteps = [
  {
    name: 'TypeScript Type Check',
    command: 'npx tsc --noEmit --skipLibCheck --exclude "docs/**/*" --exclude "**/*.template.*"',
    required: true,
    timeout: 30000
  },
  {
    name: 'ESLint Check',
    command: 'npm run lint',
    required: false,
    timeout: 20000
  },
  {
    name: 'Next.js Build',
    command: 'npm run build',
    required: true,
    timeout: 120000
  }
]

let allPassed = true
const results = []

for (const step of validationSteps) {
  console.log(`\n🔍 Running: ${step.name}`)
  
  try {
    const startTime = Date.now()
    
    execSync(step.command, {
      stdio: 'pipe',
      timeout: step.timeout,
      encoding: 'utf8'
    })
    
    const duration = Date.now() - startTime
    console.log(`✅ ${step.name} passed (${duration}ms)`)
    
    results.push({
      step: step.name,
      status: 'PASSED',
      duration,
      required: step.required
    })
    
  } catch (error) {
    const duration = Date.now() - (Date.now() - step.timeout)
    console.log(`❌ ${step.name} failed`)
    
    if (error.stdout) {
      console.log('STDOUT:', error.stdout.slice(0, 1000))
    }
    if (error.stderr) {
      console.log('STDERR:', error.stderr.slice(0, 1000))
    }
    
    results.push({
      step: step.name,
      status: 'FAILED',
      duration,
      required: step.required,
      error: error.message,
      stdout: error.stdout?.slice(0, 500),
      stderr: error.stderr?.slice(0, 500)
    })
    
    if (step.required) {
      allPassed = false
    }
  }
}

// Generate validation report
const report = {
  timestamp: new Date().toISOString(),
  overall_status: allPassed ? 'PASSED' : 'FAILED',
  total_duration: results.reduce((sum, r) => sum + r.duration, 0),
  results,
  summary: {
    total_steps: results.length,
    passed: results.filter(r => r.status === 'PASSED').length,
    failed: results.filter(r => r.status === 'FAILED').length,
    required_failures: results.filter(r => r.status === 'FAILED' && r.required).length
  }
}

// Save report
const reportPath = path.join(process.cwd(), '.hera-build-validation.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

console.log('\n📊 HERA Build Validation Report:')
console.log(`Status: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`)
console.log(`Total Duration: ${report.total_duration}ms`)
console.log(`Steps: ${report.summary.passed}/${report.summary.total_steps} passed`)

if (report.summary.required_failures > 0) {
  console.log(`❌ ${report.summary.required_failures} required steps failed`)
  
  // Show failed steps
  const failedRequired = results.filter(r => r.status === 'FAILED' && r.required)
  failedRequired.forEach(step => {
    console.log(`\n❌ ${step.step}:`)
    if (step.stderr) {
      console.log(`   Error: ${step.stderr}`)
    }
  })
}

console.log(`\n📁 Full report saved to: ${reportPath}`)

// Exit with appropriate code
process.exit(allPassed ? 0 : 1)