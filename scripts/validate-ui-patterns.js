#!/usr/bin/env node

/**
 * UI Pattern Validation Script
 * Ensures consistent use of enterprise UI components
 */

const fs = require('fs').promises
const path = require('path')
const chalk = require('chalk')

const violations = []
const warnings = []

// Patterns to check
const UI_PATTERNS = {
  // Components that should always be imported from specific paths
  requiredImports: {
    'Dialog': '@/components/ui/dialog',
    'Button': '@/components/ui/button',
    'Input': '@/components/ui/input',
    'CurrencyInput': '@/components/ui/currency-input',
    'CurrencyDisplay': '@/components/ui/currency-input',
    'UniversalConfigManager': '@/components/universal-config/UniversalConfigManager'
  },
  
  // Patterns that should NOT exist
  forbiddenPatterns: [
    {
      pattern: /\$\d+|\$\{.*\}/,
      message: 'Hardcoded dollar sign found. Use CurrencyDisplay component',
      exclude: ['test', 'mock', '.md']
    },
    {
      pattern: /className\s*=\s*["'].*bg-(white|black|gray-\d+)/,
      message: 'Hardcoded colors found. Use semantic colors (bg-background, bg-muted)',
      exclude: []
    },
    {
      pattern: /style\s*=\s*\{\{.*width:\s*['"]?\d+px/,
      message: 'Hardcoded width found. Use Tailwind classes',
      exclude: []
    },
    {
      pattern: /marginBottom:|margin-bottom:/,
      message: 'Inline margin styles found. Use Tailwind spacing classes',
      exclude: []
    }
  ],
  
  // Required patterns for specific file types
  requiredPatterns: {
    'dialog': {
      filePattern: /Dialog|Modal|dialog|modal/,
      requiredPatterns: [
        {
          pattern: /max-h-\[\d+vh\]/,
          message: 'Dialogs should have max-height constraint'
        },
        {
          pattern: /overflow-hidden|overflow-y-auto/,
          message: 'Dialogs should handle overflow properly'
        }
      ]
    },
    'form': {
      filePattern: /form|Form/,
      requiredPatterns: [
        {
          pattern: /onSubmit/,
          message: 'Forms should have onSubmit handler'
        },
        {
          pattern: /isSubmitting|loading|pending/,
          message: 'Forms should show loading state during submission'
        }
      ]
    },
    'currency': {
      filePattern: /price|Price|cost|Cost|amount|Amount/,
      requiredPatterns: [
        {
          pattern: /CurrencyDisplay|CurrencyInput|formatCurrency/,
          message: 'Files dealing with money should use currency components'
        }
      ]
    }
  }
}

async function checkFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8')
  const relativePath = path.relative(process.cwd(), filePath)
  
  // Skip if file is too small or is a test file
  if (content.length < 100 || filePath.includes('.test.')) {
    return
  }
  
  // Check forbidden patterns
  UI_PATTERNS.forbiddenPatterns.forEach(({ pattern, message, exclude }) => {
    const shouldSkip = exclude.some(exc => filePath.includes(exc))
    if (shouldSkip) return
    
    const lines = content.split('\n')
    lines.forEach((line, index) => {
      if (pattern.test(line) && !line.includes('//') && !line.includes('CurrencyDisplay')) {
        violations.push({
          file: relativePath,
          line: index + 1,
          message,
          code: line.trim().substring(0, 60) + '...'
        })
      }
    })
  })
  
  // Check required imports
  Object.entries(UI_PATTERNS.requiredImports).forEach(([component, correctPath]) => {
    const componentRegex = new RegExp(`import.*${component}.*from`)
    const match = content.match(componentRegex)
    
    if (match && !match[0].includes(correctPath)) {
      warnings.push({
        file: relativePath,
        message: `${component} should be imported from '${correctPath}'`,
        found: match[0]
      })
    }
  })
  
  // Check required patterns
  Object.entries(UI_PATTERNS.requiredPatterns).forEach(([type, config]) => {
    if (config.filePattern.test(filePath)) {
      config.requiredPatterns.forEach(({ pattern, message }) => {
        if (!pattern.test(content)) {
          warnings.push({
            file: relativePath,
            message: `${type} files: ${message}`
          })
        }
      })
    }
  })
  
  // Check for custom dialog implementations
  if (content.includes('position: fixed') && content.includes('inset-0')) {
    violations.push({
      file: relativePath,
      message: 'Custom modal implementation detected. Use Dialog component from @/components/ui/dialog'
    })
  }
  
  // Check for consistent spacing
  const inconsistentSpacing = content.match(/className=["'][^"']*(?:mb-\d+|mt-\d+).*space-y-\d+/g)
  if (inconsistentSpacing) {
    warnings.push({
      file: relativePath,
      message: 'Inconsistent spacing detected. Use either margin utilities OR space utilities, not both'
    })
  }
}

async function validateUIPatterns() {
  console.log(chalk.blue('\n🔍 Validating UI Patterns...\n'))
  
  const directories = ['src/app', 'src/components']
  
  for (const dir of directories) {
    await walkDirectory(dir, async (filePath) => {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
        await checkFile(filePath)
      }
    })
  }
  
  // Report results
  console.log(chalk.blue('\n📊 UI Pattern Validation Results\n'))
  
  if (violations.length === 0 && warnings.length === 0) {
    console.log(chalk.green('✅ All UI patterns are consistent!\n'))
    return true
  }
  
  if (violations.length > 0) {
    console.log(chalk.red(`\n❌ Found ${violations.length} violations:\n`))
    violations.forEach(({ file, line, message, code }) => {
      console.log(chalk.red(`  ${file}${line ? `:${line}` : ''}`))
      console.log(`    ${message}`)
      if (code) console.log(chalk.gray(`    ${code}`))
      console.log()
    })
  }
  
  if (warnings.length > 0) {
    console.log(chalk.yellow(`\n⚠️  Found ${warnings.length} warnings:\n`))
    warnings.forEach(({ file, message, found }) => {
      console.log(chalk.yellow(`  ${file}`))
      console.log(`    ${message}`)
      if (found) console.log(chalk.gray(`    Found: ${found}`))
      console.log()
    })
  }
  
  // Provide fix suggestions
  if (violations.length > 0) {
    console.log(chalk.blue('\n💡 How to fix:\n'))
    console.log('1. Replace hardcoded $ with <CurrencyDisplay value={amount} />')
    console.log('2. Replace hardcoded colors with semantic colors (bg-background, text-foreground)')
    console.log('3. Use Dialog component instead of custom modals')
    console.log('4. Use Tailwind classes instead of inline styles')
    console.log('\nRun this command after fixing: npm run ui:validate\n')
  }
  
  return violations.length === 0
}

async function walkDirectory(dir, callback) {
  try {
    const files = await fs.readdir(dir)
    
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = await fs.stat(filePath)
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        await walkDirectory(filePath, callback)
      } else if (stat.isFile()) {
        await callback(filePath)
      }
    }
  } catch (error) {
    // Directory might not exist
  }
}

// Generate UI consistency report
async function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    violations: violations.length,
    warnings: warnings.length,
    details: {
      violations,
      warnings
    },
    summary: {
      hardcodedCurrency: violations.filter(v => v.message.includes('dollar')).length,
      hardcodedColors: violations.filter(v => v.message.includes('colors')).length,
      customModals: violations.filter(v => v.message.includes('modal')).length,
      inconsistentImports: warnings.filter(w => w.message.includes('imported')).length
    }
  }
  
  await fs.writeFile(
    'ui-consistency-report.json',
    JSON.stringify(report, null, 2)
  )
  
  return report
}

// Main execution
async function main() {
  const isValid = await validateUIPatterns()
  const report = await generateReport()
  
  console.log(chalk.gray(`\nReport saved to: ui-consistency-report.json`))
  
  // Exit with error code if violations found
  process.exit(isValid ? 0 : 1)
}

main().catch(error => {
  console.error(chalk.red('Error:'), error)
  process.exit(1)
})