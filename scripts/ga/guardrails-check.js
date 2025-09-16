#!/usr/bin/env node

/**
 * HERA GA Guardrails Check Script
 * Enforces Sacred Six architecture compliance
 */

const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

// Sacred Six compliance patterns
const SACRED_SIX_TABLES = [
  'core_organizations',
  'core_entities', 
  'core_dynamic_data',
  'core_relationships',
  'universal_transactions',
  'universal_transaction_lines'
]

// Forbidden patterns that violate Sacred Six
const FORBIDDEN_PATTERNS = [
  // Direct table creation
  /CREATE\s+TABLE\s+(?!core_|universal_)/gi,
  // Status columns
  /ADD\s+COLUMN\s+status/gi,
  /status\s+VARCHAR/gi,
  /status\s+TEXT/gi,
  // Custom schema modifications
  /ALTER\s+TABLE\s+(?!core_|universal_)/gi,
  // Direct SQL without organization_id
  /WHERE\s+(?!.*organization_id)/gi
]

// Required patterns for compliance
const REQUIRED_PATTERNS = {
  apiRoutes: {
    pattern: /organization_id/,
    message: 'API routes must include organization_id'
  },
  smartCodes: {
    pattern: /smart_code.*HERA\./,
    message: 'Operations must include HERA smart codes'
  },
  authentication: {
    pattern: /useMultiOrgAuth|MultiOrgAuthProvider/,
    message: 'Must use multi-org authentication'
  }
}

async function checkSacredSixCompliance() {
  console.log(chalk.blue.bold('\n🛡️  HERA GA Guardrails Check\n'))

  let violations = 0
  let warnings = 0

  // Check for forbidden SQL patterns
  console.log(chalk.white.bold('Checking for Sacred Six violations...'))
  
  const sqlFiles = await glob('**/*.sql', { 
    ignore: ['node_modules/**', '.next/**', 'database/migrations/sacred-six.sql'],
    cwd: process.cwd()
  })

  for (const file of sqlFiles) {
    const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
    FORBIDDEN_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(content)) {
        console.log(chalk.red(`❌ ${file}: Forbidden pattern detected (${index + 1})`))
        violations++
      }
    })
  }

  // Check API routes for organization isolation
  console.log(chalk.white.bold('\nChecking API routes for organization isolation...'))
  
  const apiFiles = await glob('src/app/api/**/*.ts', {
    ignore: ['node_modules/**', '.next/**'],
    cwd: process.cwd()
  })

  for (const file of apiFiles) {
    const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
    
    // Skip auth endpoints
    if (file.includes('/auth/') || file.includes('/health')) continue

    if (!REQUIRED_PATTERNS.apiRoutes.pattern.test(content)) {
      console.log(chalk.yellow(`⚠️  ${file}: Missing organization_id check`))
      warnings++
    }

    if (!REQUIRED_PATTERNS.smartCodes.pattern.test(content)) {
      console.log(chalk.yellow(`⚠️  ${file}: Missing smart code usage`))
      warnings++
    }
  }

  // Check components for proper auth usage
  console.log(chalk.white.bold('\nChecking components for authentication compliance...'))
  
  const componentFiles = await glob('src/components/**/*.tsx', {
    ignore: ['node_modules/**', '.next/**', '**/auth/**'],
    cwd: process.cwd()
  })

  let authViolations = 0
  for (const file of componentFiles) {
    const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
    
    // Check if component uses old auth patterns
    if (content.includes('DualAuthProvider') || content.includes('useAuth') && !content.includes('useMultiOrgAuth')) {
      console.log(chalk.red(`❌ ${file}: Using deprecated auth pattern`))
      authViolations++
      violations++
    }
  }

  // Check for direct database access
  console.log(chalk.white.bold('\nChecking for direct database access...'))
  
  const tsFiles = await glob('src/**/*.{ts,tsx}', {
    ignore: ['node_modules/**', '.next/**', '**/lib/universal-api.ts'],
    cwd: process.cwd()
  })

  for (const file of tsFiles) {
    const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
    
    // Check for direct supabase client usage outside of universal API
    if (content.includes('supabase.from(') && !file.includes('universal-api')) {
      console.log(chalk.yellow(`⚠️  ${file}: Direct database access detected (use Universal API)`))
      warnings++
    }

    // Check for custom table references
    const customTableMatch = content.match(/from\(['"`](?!core_|universal_)(\w+)['"`]\)/)
    if (customTableMatch) {
      console.log(chalk.red(`❌ ${file}: Reference to non-Sacred Six table: ${customTableMatch[1]}`))
      violations++
    }
  }

  // Check for smart code usage
  console.log(chalk.white.bold('\nChecking smart code implementation...'))
  
  let smartCodeCoverage = 0
  let totalOperations = 0

  for (const file of tsFiles) {
    const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
    
    // Count operations that should have smart codes
    const createMatches = content.match(/createEntity|createTransaction|createRelationship/g)
    if (createMatches) {
      totalOperations += createMatches.length
      const smartCodeMatches = content.match(/smart_code.*HERA\./g)
      if (smartCodeMatches) {
        smartCodeCoverage += smartCodeMatches.length
      }
    }
  }

  const smartCodePercentage = totalOperations > 0 ? (smartCodeCoverage / totalOperations * 100).toFixed(1) : 100

  // Summary
  console.log(chalk.white.bold('\n📊 Guardrails Summary:'))
  
  if (violations === 0) {
    console.log(chalk.green('✅ Sacred Six Compliance: PASSED'))
  } else {
    console.log(chalk.red(`❌ Sacred Six Compliance: ${violations} violation(s)`))
  }

  if (authViolations === 0) {
    console.log(chalk.green('✅ Multi-Tenant Auth: PASSED'))
  } else {
    console.log(chalk.red(`❌ Multi-Tenant Auth: ${authViolations} violation(s)`))
  }

  console.log(chalk.white(`📈 Smart Code Coverage: ${smartCodePercentage}%`))
  if (smartCodePercentage < 80) {
    console.log(chalk.yellow('⚠️  Smart code coverage should be at least 80%'))
    warnings++
  }

  console.log(chalk.white(`⚠️  Warnings: ${warnings}`))

  // Exit with appropriate code
  if (violations > 0) {
    console.log(chalk.red.bold('\n❌ Guardrails check FAILED'))
    console.log(chalk.white('Fix the violations above before proceeding to production.'))
    process.exit(1)
  } else if (warnings > 10) {
    console.log(chalk.yellow.bold('\n⚠️  Guardrails check passed with warnings'))
    console.log(chalk.white('Consider addressing warnings for better compliance.'))
    process.exit(0)
  } else {
    console.log(chalk.green.bold('\n✅ Guardrails check PASSED'))
    console.log(chalk.green('Your code adheres to HERA Sacred Six architecture!'))
    process.exit(0)
  }
}

// Run the check
checkSacredSixCompliance().catch(error => {
  console.error(chalk.red('Error running guardrails check:'), error)
  process.exit(1)
})