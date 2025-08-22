#!/usr/bin/env node

/**
 * Pre-Build Validation Script
 * Ensures build quality by validating critical aspects before build
 */

const fs = require('fs').promises
const path = require('path')
const { execSync } = require('child_process')

const validations = []

// Validation helper
function validate(name, check, fix) {
  validations.push({ name, check, fix })
}

// Check 1: Environment variables
validate(
  'Environment Variables',
  async () => {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`)
    }
    
    return true
  },
  'Copy .env.example to .env.local and fill in the values'
)

// Check 2: Schema validation
validate(
  'Database Schema',
  async () => {
    try {
      execSync('node mcp-server/schema-introspection.js', { stdio: 'pipe' })
      return true
    } catch (error) {
      throw new Error('Schema validation failed')
    }
  },
  'Run: node mcp-server/schema-introspection.js to see specific issues'
)

// Check 3: TypeScript compilation
validate(
  'TypeScript Compilation',
  async () => {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' })
      return true
    } catch (error) {
      throw new Error('TypeScript compilation failed')
    }
  },
  'Run: npm run type-check to see specific errors'
)

// Check 4: Import validation
validate(
  'Import Paths',
  async () => {
    const files = await getSourceFiles()
    const invalidImports = []
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      const imports = content.match(/from ['"]([^'"]+)['"]/g) || []
      
      for (const imp of imports) {
        const importPath = imp.match(/from ['"]([^'"]+)['"]/)[1]
        
        // Check for relative imports that should use aliases
        if (importPath.startsWith('../../../')) {
          invalidImports.push({ file, import: importPath })
        }
        
        // Check for missing @/ alias
        if (importPath.startsWith('src/')) {
          invalidImports.push({ file, import: importPath })
        }
      }
    }
    
    if (invalidImports.length > 0) {
      console.log('\nInvalid imports found:')
      invalidImports.forEach(({ file, import: imp }) => {
        console.log(`  ${file}: ${imp}`)
      })
      throw new Error(`Found ${invalidImports.length} invalid imports`)
    }
    
    return true
  },
  'Use @/ alias for imports from src/ directory'
)

// Check 5: Build artifacts
validate(
  'Build Artifacts',
  async () => {
    const artifactsExist = await fs.access('.next').then(() => true).catch(() => false)
    
    if (!artifactsExist) {
      console.log('No previous build artifacts found (this is OK for first build)')
    }
    
    return true
  },
  'This is informational only'
)

// Check 6: Currency implementation
validate(
  'Currency Implementation',
  async () => {
    const files = await getSourceFiles()
    const hardcodedCurrency = []
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        // Check for hardcoded dollar signs
        if (line.includes('$') && !line.includes('${') && !line.includes('\\$')) {
          // Skip comments and certain files
          if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            hardcodedCurrency.push({
              file,
              line: index + 1,
              content: line.trim()
            })
          }
        }
      })
    }
    
    if (hardcodedCurrency.length > 0) {
      console.log('\nHardcoded currency symbols found:')
      hardcodedCurrency.slice(0, 5).forEach(({ file, line, content }) => {
        console.log(`  ${file}:${line} - ${content.substring(0, 60)}...`)
      })
      if (hardcodedCurrency.length > 5) {
        console.log(`  ... and ${hardcodedCurrency.length - 5} more`)
      }
      throw new Error('Hardcoded currency symbols detected')
    }
    
    return true
  },
  'Use formatCurrency() or CurrencyDisplay component instead of hardcoded $'
)

// Check 7: Universal architecture
validate(
  'Universal Architecture',
  async () => {
    const apiFiles = await getApiFiles()
    const violations = []
    
    for (const file of apiFiles) {
      const content = await fs.readFile(file, 'utf-8')
      
      // Check for direct table references outside the sacred 6
      const tablePattern = /from\(['"](?!core_organizations|core_entities|core_dynamic_data|core_relationships|universal_transactions|universal_transaction_lines)[\w_]+['"]\)/g
      const matches = content.match(tablePattern)
      
      if (matches) {
        violations.push({ file, tables: matches })
      }
    }
    
    if (violations.length > 0) {
      console.log('\nUniversal architecture violations:')
      violations.forEach(({ file, tables }) => {
        console.log(`  ${file}: ${tables.join(', ')}`)
      })
      throw new Error('Non-universal table access detected')
    }
    
    return true
  },
  'Use only the 6 universal tables in your queries'
)

// Helper functions
async function getSourceFiles() {
  const files = []
  const dirs = ['src/app', 'src/components', 'src/lib']
  
  for (const dir of dirs) {
    await walkDir(dir, (file) => {
      if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('.test.')) {
        files.push(file)
      }
    })
  }
  
  return files
}

async function getApiFiles() {
  const files = []
  
  await walkDir('src/app/api', (file) => {
    if (file.endsWith('route.ts')) {
      files.push(file)
    }
  })
  
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

// Main execution
async function main() {
  console.log('🔍 HERA Pre-Build Validation\n')
  
  let passed = 0
  let failed = 0
  
  for (const { name, check, fix } of validations) {
    process.stdout.write(`Checking ${name}... `)
    
    try {
      await check()
      console.log('✅')
      passed++
    } catch (error) {
      console.log('❌')
      console.log(`  Error: ${error.message}`)
      console.log(`  Fix: ${fix}\n`)
      failed++
    }
  }
  
  console.log('\n📊 Validation Summary')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  
  if (failed > 0) {
    console.log('\n❌ Build validation failed. Please fix the issues above.')
    process.exit(1)
  } else {
    console.log('\n✅ All validations passed! Ready to build.')
    
    // Create a validation timestamp
    await fs.writeFile(
      '.build-validation',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        passed: true,
        checks: passed
      }, null, 2)
    )
  }
}

// Run validation
main().catch(error => {
  console.error('\n❌ Validation error:', error.message)
  process.exit(1)
})