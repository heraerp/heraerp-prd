#!/usr/bin/env node

/**
 * HERA GA Accessibility Validation
 * Runs Lighthouse accessibility checks on critical pages
 */

const chalk = require('chalk')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Critical pages to test for accessibility
const CRITICAL_PAGES = [
  { name: 'WhatsApp Hub', url: '/whatsapp/hub' },
  { name: 'WhatsApp Templates', url: '/whatsapp/templates' },
  { name: 'Settings Center', url: '/settings' },
  { name: 'Branch Management', url: '/settings/branches' },
  { name: 'Fiscal Settings', url: '/settings/fiscal' },
  { name: 'Year-End Closing', url: '/finance/closing' },
  { name: 'Finance Rules', url: '/finance/rules' }
]

// WCAG AA compliance thresholds
const A11Y_THRESHOLDS = {
  score: 90, // Minimum accessibility score
  violations: {
    critical: 0,   // No critical violations allowed
    serious: 2,    // Max 2 serious violations
    moderate: 5,   // Max 5 moderate violations
    minor: 10      // Max 10 minor violations
  }
}

// Specific accessibility checks
const A11Y_RULES = {
  // WCAG 2.1 Level AA requirements
  'color-contrast': { level: 'serious', wcag: '1.4.3' },
  'image-alt': { level: 'critical', wcag: '1.1.1' },
  'label': { level: 'critical', wcag: '4.1.2' },
  'button-name': { level: 'critical', wcag: '4.1.2' },
  'link-name': { level: 'serious', wcag: '2.4.4' },
  'aria-*': { level: 'serious', wcag: '4.1.2' },
  'duplicate-id-aria': { level: 'critical', wcag: '4.1.1' },
  'heading-order': { level: 'moderate', wcag: '2.4.6' },
  'html-has-lang': { level: 'serious', wcag: '3.1.1' },
  'valid-lang': { level: 'serious', wcag: '3.1.1' },
  'list': { level: 'serious', wcag: '1.3.1' },
  'listitem': { level: 'serious', wcag: '1.3.1' },
  'meta-viewport': { level: 'critical', wcag: '1.4.4' },
  'tabindex': { level: 'serious', wcag: '2.4.3' }
}

function checkLighthouseInstalled() {
  try {
    execSync('lighthouse --version', { stdio: 'ignore' })
    return true
  } catch (error) {
    console.log(chalk.red('❌ Lighthouse is not installed'))
    console.log(chalk.white('Install with: npm install -g lighthouse'))
    console.log(chalk.white('Or run: npm install --save-dev @lhci/cli'))
    return false
  }
}

function runAccessibilityTest(page) {
  const url = `http://localhost:3000${page.url}`
  console.log(chalk.white(`\nTesting ${page.name} (${url})...`))

  try {
    // Run Lighthouse with accessibility focus
    const cmd = `lighthouse ${url} \
      --only-categories=accessibility \
      --output=json \
      --output=html \
      --output-path=./lighthouse-${page.name.replace(/\s+/g, '-').toLowerCase()} \
      --chrome-flags="--headless" \
      --quiet`

    const output = execSync(cmd, { encoding: 'utf8' })
    const results = JSON.parse(fs.readFileSync(`./lighthouse-${page.name.replace(/\s+/g, '-').toLowerCase()}.report.json`, 'utf8'))
    
    // Clean up JSON report (keep HTML for review)
    fs.unlinkSync(`./lighthouse-${page.name.replace(/\s+/g, '-').toLowerCase()}.report.json`)
    
    return analyzeResults(page.name, results)
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Could not test ${page.name} (is dev server running on port 3000?)`))
    return null
  }
}

function analyzeResults(pageName, results) {
  const a11yScore = results.categories.accessibility.score * 100
  const audits = results.audits
  
  const violations = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0
  }
  
  const failedAudits = []

  // Analyze each audit
  Object.entries(audits).forEach(([auditId, audit]) => {
    if (audit.score !== null && audit.score < 1) {
      // Determine violation level
      let level = 'minor'
      Object.entries(A11Y_RULES).forEach(([rule, config]) => {
        if (auditId.includes(rule.replace('*', ''))) {
          level = config.level
        }
      })
      
      violations[level]++
      failedAudits.push({
        id: auditId,
        title: audit.title,
        description: audit.description,
        level
      })
    }
  })

  // Display results
  console.log(chalk.white.bold(`\nResults for ${pageName}:`))
  console.log(chalk.white(`Accessibility Score: ${a11yScore.toFixed(1)}%`))
  
  if (a11yScore >= A11Y_THRESHOLDS.score) {
    console.log(chalk.green(`✅ Score meets threshold (>=${A11Y_THRESHOLDS.score}%)`))
  } else {
    console.log(chalk.red(`❌ Score below threshold (<${A11Y_THRESHOLDS.score}%)`))
  }

  // Show violations by level
  console.log(chalk.white('\nViolations by severity:'))
  Object.entries(violations).forEach(([level, count]) => {
    const threshold = A11Y_THRESHOLDS.violations[level]
    if (count > threshold) {
      console.log(chalk.red(`❌ ${level}: ${count} (max: ${threshold})`))
    } else if (count > 0) {
      console.log(chalk.yellow(`⚠️  ${level}: ${count} (max: ${threshold})`))
    } else {
      console.log(chalk.green(`✅ ${level}: ${count}`))
    }
  })

  // Show top violations
  if (failedAudits.length > 0) {
    console.log(chalk.white('\nTop accessibility issues:'))
    failedAudits
      .sort((a, b) => {
        const levels = ['critical', 'serious', 'moderate', 'minor']
        return levels.indexOf(a.level) - levels.indexOf(b.level)
      })
      .slice(0, 5)
      .forEach(audit => {
        const icon = audit.level === 'critical' ? '🚨' : 
                    audit.level === 'serious' ? '⚠️' : '📋'
        console.log(chalk.white(`${icon} [${audit.level}] ${audit.title}`))
      })
  }

  return {
    score: a11yScore,
    violations,
    passed: a11yScore >= A11Y_THRESHOLDS.score && 
            violations.critical <= A11Y_THRESHOLDS.violations.critical &&
            violations.serious <= A11Y_THRESHOLDS.violations.serious
  }
}

function generateSummary(results) {
  console.log(chalk.blue.bold('\n📊 Accessibility Summary\n'))
  
  const totalPages = results.length
  const passedPages = results.filter(r => r && r.passed).length
  const avgScore = results.filter(r => r).reduce((sum, r) => sum + r.score, 0) / results.filter(r => r).length
  
  console.log(chalk.white(`Pages tested: ${totalPages}`))
  console.log(chalk.white(`Pages passed: ${passedPages}`))
  console.log(chalk.white(`Average score: ${avgScore.toFixed(1)}%`))
  
  // Aggregate violations
  const totalViolations = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0
  }
  
  results.filter(r => r).forEach(result => {
    Object.entries(result.violations).forEach(([level, count]) => {
      totalViolations[level] += count
    })
  })
  
  console.log(chalk.white('\nTotal violations across all pages:'))
  Object.entries(totalViolations).forEach(([level, count]) => {
    if (count === 0) {
      console.log(chalk.green(`✅ ${level}: ${count}`))
    } else if (level === 'critical' || (level === 'serious' && count > 5)) {
      console.log(chalk.red(`❌ ${level}: ${count}`))
    } else {
      console.log(chalk.yellow(`⚠️  ${level}: ${count}`))
    }
  })
  
  // Generate report links
  console.log(chalk.white('\n📄 Detailed reports saved:'))
  CRITICAL_PAGES.forEach(page => {
    const reportName = `lighthouse-${page.name.replace(/\s+/g, '-').toLowerCase()}.report.html`
    if (fs.existsSync(reportName)) {
      console.log(chalk.white(`- ${reportName}`))
    }
  })
  
  return passedPages === totalPages && totalViolations.critical === 0
}

async function main() {
  console.log(chalk.blue.bold('♿ HERA GA Accessibility Validation\n'))
  
  // Check prerequisites
  if (!checkLighthouseInstalled()) {
    process.exit(1)
  }
  
  console.log(chalk.white('Running WCAG AA compliance checks on critical pages...'))
  console.log(chalk.white('This may take a few minutes...\n'))
  
  // Run tests on each page
  const results = []
  for (const page of CRITICAL_PAGES) {
    const result = runAccessibilityTest(page)
    results.push(result)
  }
  
  // Generate summary
  const passed = generateSummary(results)
  
  if (passed) {
    console.log(chalk.green.bold('\n✅ Accessibility validation PASSED!'))
    console.log(chalk.green('All critical pages meet WCAG AA standards.'))
    process.exit(0)
  } else {
    console.log(chalk.red.bold('\n❌ Accessibility validation FAILED'))
    console.log(chalk.white('\nRequired fixes:'))
    console.log(chalk.white('1. Fix all critical violations immediately'))
    console.log(chalk.white('2. Address serious violations before launch'))
    console.log(chalk.white('3. Plan to fix moderate violations post-launch'))
    console.log(chalk.white('\nResources:'))
    console.log(chalk.white('- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/'))
    console.log(chalk.white('- HERA Accessibility Guide: docs/ACCESSIBILITY.md'))
    process.exit(1)
  }
}

// Run the validation
main().catch(error => {
  console.error(chalk.red('Error running accessibility validation:'), error)
  process.exit(1)
})