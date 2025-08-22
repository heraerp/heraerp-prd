#!/usr/bin/env node

/**
 * HERA Quality Check Script
 * Runs comprehensive quality checks before builds
 */

const fs = require('fs').promises
const path = require('path')
const { execSync } = require('child_process')

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
}

let hasErrors = false
let hasWarnings = false

function log(message, type = 'info') {
  const prefix = {
    error: `${colors.red}❌ ERROR:${colors.reset}`,
    warning: `${colors.yellow}⚠️  WARNING:${colors.reset}`,
    success: `${colors.green}✅ SUCCESS:${colors.reset}`,
    info: `${colors.blue}ℹ️  INFO:${colors.reset}`,
    check: `${colors.magenta}🔍 CHECKING:${colors.reset}`
  }
  console.log(`${prefix[type]} ${message}`)
  
  if (type === 'error') hasErrors = true
  if (type === 'warning') hasWarnings = true
}

function runCommand(command, description) {
  try {
    log(description, 'check')
    execSync(command, { stdio: 'inherit' })
    return true
  } catch (error) {
    return false
  }
}

async function checkHardcodedValues() {
  log('Checking for hardcoded values...', 'check')
  
  const filesToCheck = await getTypeScriptFiles()
  const hardcodedPatterns = [
    { pattern: /\$\d+/, message: 'Hardcoded dollar amounts found' },
    { pattern: /currency:\s*['"]USD['"]/, message: 'Hardcoded USD currency' },
    { pattern: /localhost:\d+/, message: 'Hardcoded localhost URLs' },
    { pattern: /console\.log/, message: 'Console.log statements found' }
  ]
  
  let issues = 0
  
  for (const file of filesToCheck) {
    const content = await fs.readFile(file, 'utf-8')
    const lines = content.split('\n')
    
    hardcodedPatterns.forEach(({ pattern, message }) => {
      lines.forEach((line, index) => {
        if (pattern.test(line) && !line.includes('//') && !line.includes('test')) {
          log(`${message} in ${file}:${index + 1}`, 'warning')
          issues++
        }
      })
    })
  }
  
  if (issues === 0) {
    log('No hardcoded values found', 'success')
  }
  
  return issues === 0
}

async function checkSecurityPatterns() {
  log('Checking security patterns...', 'check')
  
  const filesToCheck = await getTypeScriptFiles()
  const requiredPatterns = [
    {
      filePattern: /page\.tsx$/,
      contentPattern: /if\s*\(!isAuthenticated\)/,
      message: 'Missing authentication check'
    },
    {
      filePattern: /route\.ts$/,
      contentPattern: /organization_id/,
      message: 'Missing organization_id validation'
    }
  ]
  
  let issues = 0
  
  for (const file of filesToCheck) {
    const content = await fs.readFile(file, 'utf-8')
    
    requiredPatterns.forEach(({ filePattern, contentPattern, message }) => {
      if (filePattern.test(file) && !contentPattern.test(content)) {
        // Skip certain files that don't need auth
        const skipFiles = ['login', 'signup', 'public', 'api/health', 'api/version']
        if (!skipFiles.some(skip => file.includes(skip))) {
          log(`${message} in ${file}`, 'error')
          issues++
        }
      }
    })
  }
  
  if (issues === 0) {
    log('Security patterns check passed', 'success')
  }
  
  return issues === 0
}

async function checkUniversalArchitecture() {
  log('Checking universal architecture compliance...', 'check')
  
  const sqlFiles = await getSQLFiles()
  let issues = 0
  
  for (const file of sqlFiles) {
    const content = await fs.readFile(file, 'utf-8')
    
    // Check for table creation outside of the sacred 6
    const createTablePattern = /CREATE\s+TABLE\s+(?!core_organizations|core_entities|core_dynamic_data|core_relationships|universal_transactions|universal_transaction_lines)/i
    
    if (createTablePattern.test(content)) {
      log(`Non-universal table creation found in ${file}`, 'error')
      issues++
    }
    
    // Check for ALTER TABLE on sacred tables
    const alterTablePattern = /ALTER\s+TABLE\s+(core_organizations|core_entities|core_dynamic_data|core_relationships|universal_transactions|universal_transaction_lines)\s+ADD\s+COLUMN/i
    
    if (alterTablePattern.test(content)) {
      log(`Schema change to sacred table found in ${file}`, 'error')
      issues++
    }
  }
  
  if (issues === 0) {
    log('Universal architecture compliance check passed', 'success')
  }
  
  return issues === 0
}

async function checkDependencies() {
  log('Checking dependency security...', 'check')
  
  try {
    execSync('npm audit --audit-level=high', { stdio: 'pipe' })
    log('No high severity vulnerabilities found', 'success')
    return true
  } catch (error) {
    log('Security vulnerabilities found - run npm audit fix', 'error')
    return false
  }
}

async function checkTypeScript() {
  log('Running TypeScript checks...', 'check')
  return runCommand('npm run type-check', 'TypeScript compilation')
}

async function checkLinting() {
  log('Running ESLint...', 'check')
  return runCommand('npm run lint', 'Code linting')
}

async function checkTests() {
  log('Running tests...', 'check')
  return runCommand('npm test -- --passWithNoTests', 'Unit tests')
}

async function getTypeScriptFiles() {
  const files = []
  const dirs = ['src/app', 'src/components', 'src/lib']
  
  for (const dir of dirs) {
    await walkDir(dir, (file) => {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        files.push(file)
      }
    })
  }
  
  return files
}

async function getSQLFiles() {
  const files = []
  const dirs = ['database', 'scripts']
  
  for (const dir of dirs) {
    await walkDir(dir, (file) => {
      if (file.endsWith('.sql')) {
        files.push(file)
      }
    })
  }
  
  return files
}

async function walkDir(dir, callback) {
  try {
    const files = await fs.readdir(dir)
    
    for (const file of files) {
      const filepath = path.join(dir, file)
      const stat = await fs.stat(filepath)
      
      if (stat.isDirectory()) {
        await walkDir(filepath, callback)
      } else {
        callback(filepath)
      }
    }
  } catch (error) {
    // Directory might not exist
  }
}

async function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    passed: !hasErrors,
    hasWarnings,
    checks: {
      hardcodedValues: await checkHardcodedValues(),
      security: await checkSecurityPatterns(),
      architecture: await checkUniversalArchitecture(),
      dependencies: await checkDependencies(),
      typeScript: await checkTypeScript(),
      linting: await checkLinting(),
      tests: await checkTests()
    }
  }
  
  await fs.writeFile(
    'quality-report.json',
    JSON.stringify(report, null, 2)
  )
  
  return report
}

async function main() {
  console.log(`
${colors.blue}╔══════════════════════════════════════╗
║     HERA Quality Check System        ║
║   Ensuring Enterprise-Grade Quality  ║
╚══════════════════════════════════════╝${colors.reset}
`)

  const startTime = Date.now()
  
  // Run all checks
  const report = await generateReport()
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  
  console.log(`\n${colors.blue}═══════════════ SUMMARY ═══════════════${colors.reset}\n`)
  
  if (!hasErrors && !hasWarnings) {
    console.log(`${colors.green}🎉 All quality checks passed!${colors.reset}`)
    console.log(`${colors.green}✨ Your code is ready for production${colors.reset}`)
  } else if (!hasErrors && hasWarnings) {
    console.log(`${colors.yellow}⚠️  Quality checks passed with warnings${colors.reset}`)
    console.log(`${colors.yellow}📋 Review warnings before deployment${colors.reset}`)
  } else {
    console.log(`${colors.red}❌ Quality checks failed${colors.reset}`)
    console.log(`${colors.red}🔧 Fix errors before proceeding${colors.reset}`)
  }
  
  console.log(`\n${colors.blue}Time elapsed: ${duration}s${colors.reset}`)
  console.log(`${colors.blue}Report saved to: quality-report.json${colors.reset}\n`)
  
  process.exit(hasErrors ? 1 : 0)
}

// Run the quality checks
main().catch(error => {
  console.error('Quality check failed:', error)
  process.exit(1)
})