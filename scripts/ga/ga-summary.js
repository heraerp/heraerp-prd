#!/usr/bin/env node

/**
 * HERA GA Summary Report Generator
 * Consolidates all GA validation results into a comprehensive report
 */

const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// GA validation categories
const GA_CATEGORIES = [
  { name: 'Environment', script: 'env-validate.js', weight: 15 },
  { name: 'Guardrails', script: 'guardrails-check.js', weight: 25 },
  { name: 'Performance', script: 'perf-budgets.js', weight: 15 },
  { name: 'Accessibility', script: 'a11y-lighthouse.js', weight: 20 },
  { name: 'Bundle Size', script: 'bundle-budget.js', weight: 10 },
  { name: 'Security', script: 'security-headers.js', weight: 10 },
  { name: 'Smoke Tests', script: 'smoke-suite.js', weight: 5 }
]

// Production readiness criteria
const READINESS_CRITERIA = {
  mustPass: ['Environment', 'Guardrails', 'Security', 'Smoke Tests'],
  minScore: 85, // Minimum weighted score for GA
  maxViolations: 5 // Maximum total violations allowed
}

function runGACheck(category) {
  console.log(chalk.blue(`\n📋 Running ${category.name} check...`))
  
  const scriptPath = path.join(__dirname, category.script)
  if (!fs.existsSync(scriptPath)) {
    console.log(chalk.yellow(`⚠️  Script not found: ${category.script}`))
    return { status: 'skipped', score: 0, violations: 0, warnings: 0 }
  }

  try {
    execSync(`node ${scriptPath}`, { stdio: 'inherit' })
    return { status: 'passed', score: 100, violations: 0, warnings: 0 }
  } catch (error) {
    // Parse exit code to determine severity
    const exitCode = error.status || 1
    if (exitCode === 1) {
      return { status: 'failed', score: 0, violations: 1, warnings: 0 }
    } else {
      return { status: 'warnings', score: 70, violations: 0, warnings: 1 }
    }
  }
}

function calculateReadinessScore(results) {
  let totalScore = 0
  let totalWeight = 0
  
  results.forEach((result, index) => {
    const category = GA_CATEGORIES[index]
    if (result.status !== 'skipped') {
      totalScore += result.score * (category.weight / 100)
      totalWeight += category.weight
    }
  })
  
  // Normalize score if not all tests ran
  return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0
}

function generateDetailedReport(results, score) {
  console.log(chalk.blue.bold('\n' + '='.repeat(60)))
  console.log(chalk.blue.bold.underline('\n🎯 HERA GA PRODUCTION READINESS REPORT\n'))
  console.log(chalk.blue.bold('='.repeat(60) + '\n'))
  
  // Overall Status
  const allMustPassPassed = READINESS_CRITERIA.mustPass.every(name => {
    const index = GA_CATEGORIES.findIndex(cat => cat.name === name)
    return results[index] && results[index].status === 'passed'
  })
  
  const totalViolations = results.reduce((sum, r) => sum + r.violations, 0)
  const isReady = allMustPassPassed && score >= READINESS_CRITERIA.minScore && totalViolations <= READINESS_CRITERIA.maxViolations
  
  if (isReady) {
    console.log(chalk.green.bold('🚀 STATUS: READY FOR PRODUCTION'))
  } else {
    console.log(chalk.red.bold('❌ STATUS: NOT READY FOR PRODUCTION'))
  }
  
  console.log(chalk.white.bold(`\n📊 Overall Score: ${score.toFixed(1)}% (Required: ${READINESS_CRITERIA.minScore}%)`))
  
  // Progress bar
  const progressLength = 50
  const filledLength = Math.round((score / 100) * progressLength)
  const progressBar = '█'.repeat(filledLength) + '░'.repeat(progressLength - filledLength)
  console.log(chalk.white(`[${progressBar}]`))
  
  // Category Results
  console.log(chalk.white.bold('\n📋 Category Results:\n'))
  
  results.forEach((result, index) => {
    const category = GA_CATEGORIES[index]
    const icon = result.status === 'passed' ? '✅' : 
                result.status === 'failed' ? '❌' : 
                result.status === 'warnings' ? '⚠️' : '⏭️'
    
    const statusColor = result.status === 'passed' ? chalk.green : 
                       result.status === 'failed' ? chalk.red : 
                       result.status === 'warnings' ? chalk.yellow : chalk.gray
    
    console.log(`${icon} ${chalk.white.bold(category.name.padEnd(15))} ${statusColor(result.status.toUpperCase().padEnd(10))} Weight: ${category.weight}%`)
    
    if (result.violations > 0) {
      console.log(chalk.red(`   Violations: ${result.violations}`))
    }
    if (result.warnings > 0) {
      console.log(chalk.yellow(`   Warnings: ${result.warnings}`))
    }
  })
  
  // Critical Issues
  const criticalIssues = results.filter((r, i) => 
    READINESS_CRITERIA.mustPass.includes(GA_CATEGORIES[i].name) && r.status === 'failed'
  )
  
  if (criticalIssues.length > 0) {
    console.log(chalk.red.bold('\n🚨 Critical Issues (Must Fix):\n'))
    criticalIssues.forEach((_, index) => {
      const catIndex = results.indexOf(_)
      const category = GA_CATEGORIES[catIndex]
      console.log(chalk.red(`- ${category.name}: Failed validation`))
    })
  }
  
  // Summary Statistics
  console.log(chalk.white.bold('\n📈 Summary Statistics:\n'))
  const stats = {
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length,
    warnings: results.filter(r => r.status === 'warnings').length,
    skipped: results.filter(r => r.status === 'skipped').length
  }
  
  console.log(chalk.white(`Total Checks: ${GA_CATEGORIES.length}`))
  console.log(chalk.green(`Passed: ${stats.passed}`))
  console.log(chalk.red(`Failed: ${stats.failed}`))
  console.log(chalk.yellow(`Warnings: ${stats.warnings}`))
  console.log(chalk.gray(`Skipped: ${stats.skipped}`))
  console.log(chalk.white(`Total Violations: ${totalViolations}`))
  
  return { isReady, score, stats, totalViolations }
}

function generateHTMLReport(results, summary) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>HERA GA Report - ${new Date().toISOString()}</title>
  <style>
    body { font-family: -apple-system, sans-serif; margin: 40px; background: #f5f5f7; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #1d1d1f; margin-bottom: 10px; }
    .status { font-size: 24px; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .ready { background: #d1f5d3; color: #0a7d0a; }
    .not-ready { background: #fdd; color: #d70015; }
    .score { font-size: 48px; font-weight: 600; text-align: center; margin: 30px 0; }
    .progress { height: 20px; background: #e5e5e7; border-radius: 10px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #7B68EE, #9370DB); transition: width 0.3s; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e5e7; }
    th { font-weight: 600; color: #86868b; }
    .passed { color: #0a7d0a; }
    .failed { color: #d70015; }
    .warning { color: #f5a623; }
    .footer { text-align: center; color: #86868b; margin-top: 40px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>HERA GA Production Readiness Report</h1>
    <p style="color: #86868b;">Generated on ${new Date().toLocaleString()}</p>
    
    <div class="status ${summary.isReady ? 'ready' : 'not-ready'}">
      ${summary.isReady ? '✅ READY FOR PRODUCTION' : '❌ NOT READY FOR PRODUCTION'}
    </div>
    
    <div class="score">${summary.score.toFixed(1)}%</div>
    <div class="progress">
      <div class="progress-fill" style="width: ${summary.score}%"></div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Status</th>
          <th>Weight</th>
          <th>Issues</th>
        </tr>
      </thead>
      <tbody>
        ${results.map((result, i) => `
          <tr>
            <td>${GA_CATEGORIES[i].name}</td>
            <td class="${result.status}">${result.status.toUpperCase()}</td>
            <td>${GA_CATEGORIES[i].weight}%</td>
            <td>${result.violations > 0 ? `${result.violations} violations` : ''} 
                ${result.warnings > 0 ? `${result.warnings} warnings` : ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="footer">
      <p>HERA ERP v1.2.0 | Sacred Six Architecture</p>
    </div>
  </div>
</body>
</html>`
  
  fs.writeFileSync('ga-report.html', html)
  console.log(chalk.white('\n📄 HTML report saved to ga-report.html'))
}

function generateActionPlan(results, summary) {
  if (summary.isReady) {
    console.log(chalk.green.bold('\n✅ Recommended Actions:\n'))
    console.log(chalk.green('1. Run final build: npm run build'))
    console.log(chalk.green('2. Deploy to staging environment'))
    console.log(chalk.green('3. Perform final UAT testing'))
    console.log(chalk.green('4. Schedule production deployment'))
  } else {
    console.log(chalk.red.bold('\n❌ Required Actions Before GA:\n'))
    
    const failedCategories = results.map((r, i) => 
      r.status === 'failed' ? GA_CATEGORIES[i].name : null
    ).filter(Boolean)
    
    failedCategories.forEach((category, index) => {
      console.log(chalk.red(`${index + 1}. Fix ${category} issues`))
    })
    
    if (summary.score < READINESS_CRITERIA.minScore) {
      console.log(chalk.yellow(`${failedCategories.length + 1}. Improve overall score to ${READINESS_CRITERIA.minScore}%+`))
    }
    
    console.log(chalk.white('\nRun individual checks for details:'))
    console.log(chalk.gray('  npm run ga:env'))
    console.log(chalk.gray('  npm run ga:guardrails'))
    console.log(chalk.gray('  npm run ga:security'))
  }
}

async function main() {
  console.log(chalk.blue.bold('🚀 HERA GA Validation Suite v1.0\n'))
  console.log(chalk.white('Running comprehensive production readiness checks...'))
  console.log(chalk.white('This may take several minutes.\n'))
  
  // Run all GA checks
  const results = []
  for (const category of GA_CATEGORIES) {
    const result = runGACheck(category)
    results.push(result)
  }
  
  // Calculate overall score
  const score = calculateReadinessScore(results)
  
  // Generate detailed report
  const summary = generateDetailedReport(results, score)
  
  // Generate HTML report
  generateHTMLReport(results, summary)
  
  // Generate action plan
  generateActionPlan(results, summary)
  
  // Save JSON report
  const jsonReport = {
    timestamp: new Date().toISOString(),
    score: summary.score,
    isReady: summary.isReady,
    stats: summary.stats,
    results: results.map((r, i) => ({
      category: GA_CATEGORIES[i].name,
      ...r
    }))
  }
  
  fs.writeFileSync('ga-report.json', JSON.stringify(jsonReport, null, 2))
  console.log(chalk.white('\n📄 JSON report saved to ga-report.json'))
  
  // Exit with appropriate code
  console.log(chalk.blue.bold('\n' + '='.repeat(60) + '\n'))
  
  if (summary.isReady) {
    console.log(chalk.green.bold('🎉 Congratulations! HERA is ready for production!'))
    process.exit(0)
  } else {
    console.log(chalk.red.bold('🔧 Additional work required before production deployment.'))
    process.exit(1)
  }
}

// Run GA summary
main().catch(error => {
  console.error(chalk.red('Error generating GA summary:'), error)
  process.exit(1)
})