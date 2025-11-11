#!/usr/bin/env node

/**
 * HERA Standardization Checker
 * Automated validation of HERA coding standards and patterns
 * 
 * Usage: node scripts/hera-standardization-checker.js [--fix]
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class HeraStandardizationChecker {
  constructor() {
    this.violations = []
    this.fixMode = process.argv.includes('--fix')
  }

  // 1. Smart Code Pattern Validation
  validateSmartCodes() {
    console.log('🧬 Validating Smart Code patterns...')
    // Look for UPPERCASE version patterns that should be lowercase
    const smartCodePattern = /['"]HERA\.[A-Z0-9]+\.[^'"]*\.V[0-9]+['"]/g
    
    const files = this.getFilesToCheck(['.sql', '.ts', '.js'])
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        const matches = line.match(smartCodePattern)
        if (matches) {
          matches.forEach(match => {
            this.violations.push({
              type: 'SMART_CODE_UPPERCASE',
              file,
              line: index + 1,
              content: match,
              fix: match.replace(/\.V([0-9]+)/, '.v$1'),
              severity: 'ERROR'
            })
          })
        }
      })
    })
  }

  // 2. API Response Format Validation
  validateApiResponseFormats() {
    console.log('🔌 Validating API response formats...')
    const apiFiles = this.getFilesToCheck(['.ts'], ['src/app/api'])
    
    apiFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      
      // Check for inconsistent response patterns
      if (content.includes('NextResponse.json({') && !content.includes('success:')) {
        this.violations.push({
          type: 'API_RESPONSE_FORMAT',
          file,
          line: 'Multiple',
          content: 'Missing standard response wrapper',
          fix: 'Use { success: boolean, data?: T, error?: string } format',
          severity: 'WARNING'
        })
      }
    })
  }

  // 3. Database Column Naming Validation
  validateDatabaseNaming() {
    console.log('🗄️ Validating database naming conventions...')
    const sqlFiles = this.getFilesToCheck(['.sql'])
    
    sqlFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        // Check for camelCase in SQL (should be snake_case)
        if (line.match(/\b[a-z]+[A-Z][a-zA-Z]*\s*(varchar|text|integer|uuid|timestamp)/)) {
          this.violations.push({
            type: 'SQL_NAMING_CAMELCASE',
            file,
            line: index + 1,
            content: line.trim(),
            fix: 'Use snake_case for SQL column names',
            severity: 'ERROR'
          })
        }
        
        // Check for status columns (HERA violation)
        if (line.includes('status') && line.includes('varchar') && !line.includes('--')) {
          this.violations.push({
            type: 'STATUS_COLUMN_VIOLATION',
            file,
            line: index + 1,
            content: line.trim(),
            fix: 'Use core_relationships for status tracking',
            severity: 'ERROR'
          })
        }
      })
    })
  }

  // 4. TypeScript Export Pattern Validation
  validateExportPatterns() {
    console.log('📦 Validating TypeScript export patterns...')
    const tsFiles = this.getFilesToCheck(['.ts', '.tsx'], ['src'])
    
    tsFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      
      // Check for mixed exports (both default and named in same file)
      const hasDefaultExport = content.includes('export default')
      const hasNamedExports = content.match(/export\s+(function|const|class|interface|type)/g)
      
      if (hasDefaultExport && hasNamedExports && hasNamedExports.length > 1) {
        this.violations.push({
          type: 'MIXED_EXPORT_PATTERN',
          file,
          line: 'Multiple',
          content: 'File has both default and multiple named exports',
          fix: 'Use either default OR named exports, not both',
          severity: 'WARNING'
        })
      }
    })
  }

  // 5. Missing Organization ID Validation
  validateOrganizationId() {
    console.log('🏢 Validating organization_id requirements...')
    const apiFiles = this.getFilesToCheck(['.ts'], ['src/app/api'])
    
    apiFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      
      // Check for database operations without organization_id
      if (content.includes('FROM core_entities') && !content.includes('organization_id')) {
        this.violations.push({
          type: 'MISSING_ORG_ID_FILTER',
          file,
          line: 'Multiple',
          content: 'Database query missing organization_id filter',
          fix: 'Add WHERE organization_id = ? for multi-tenant isolation',
          severity: 'ERROR'
        })
      }
    })
  }

  // 6. Error Handling Pattern Validation
  validateErrorHandling() {
    console.log('⚠️ Validating error handling patterns...')
    const apiFiles = this.getFilesToCheck(['.ts'], ['src/app/api'])
    
    apiFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      
      // Check for missing try-catch in API routes
      if (content.includes('export async function') && !content.includes('try {')) {
        this.violations.push({
          type: 'MISSING_ERROR_HANDLING',
          file,
          line: 'Function',
          content: 'API function missing try-catch block',
          fix: 'Wrap async function body in try-catch',
          severity: 'ERROR'
        })
      }
    })
  }

  // Utility Methods
  getFilesToCheck(extensions, directories = ['.']) {
    const files = []
    
    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.walkDirectory(dir, files, extensions)
      }
    })
    
    return files
  }

  walkDirectory(dir, files, extensions) {
    const items = fs.readdirSync(dir)
    
    items.forEach(item => {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        this.walkDirectory(fullPath, files, extensions)
      } else if (stat.isFile()) {
        const ext = path.extname(item)
        if (extensions.includes(ext)) {
          files.push(fullPath)
        }
      }
    })
  }

  // Fix violations automatically
  applyFixes() {
    if (!this.fixMode) return
    
    console.log('🔧 Applying automatic fixes...')
    
    const fixableViolations = this.violations.filter(v => 
      v.type === 'SMART_CODE_UPPERCASE' && v.fix
    )
    
    const fileChanges = {}
    
    fixableViolations.forEach(violation => {
      if (!fileChanges[violation.file]) {
        fileChanges[violation.file] = fs.readFileSync(violation.file, 'utf8')
      }
      
      fileChanges[violation.file] = fileChanges[violation.file].replace(
        violation.content,
        violation.fix
      )
    })
    
    Object.entries(fileChanges).forEach(([file, content]) => {
      fs.writeFileSync(file, content)
      console.log(`✅ Fixed: ${file}`)
    })
  }

  // Generate report
  generateReport() {
    console.log('\n📊 HERA Standardization Report')
    console.log('=' .repeat(50))
    
    if (this.violations.length === 0) {
      console.log('✅ No standardization violations found!')
      return
    }
    
    const grouped = this.violations.reduce((acc, violation) => {
      if (!acc[violation.type]) acc[violation.type] = []
      acc[violation.type].push(violation)
      return acc
    }, {})
    
    Object.entries(grouped).forEach(([type, violations]) => {
      console.log(`\n🚨 ${type} (${violations.length} violations)`)
      
      violations.slice(0, 5).forEach(violation => {
        console.log(`   ${violation.file}:${violation.line}`)
        console.log(`   Content: ${violation.content}`)
        console.log(`   Fix: ${violation.fix}`)
        console.log('')
      })
      
      if (violations.length > 5) {
        console.log(`   ... and ${violations.length - 5} more`)
      }
    })
    
    // Summary
    const errors = this.violations.filter(v => v.severity === 'ERROR').length
    const warnings = this.violations.filter(v => v.severity === 'WARNING').length
    
    console.log('\n📈 Summary:')
    console.log(`   Errors: ${errors}`)
    console.log(`   Warnings: ${warnings}`)
    console.log(`   Total: ${this.violations.length}`)
    
    if (errors > 0) {
      process.exit(1)
    }
  }

  // Main execution
  async run() {
    console.log('🚀 Starting HERA Standardization Check...')
    
    try {
      this.validateSmartCodes()
      this.validateApiResponseFormats()
      this.validateDatabaseNaming()
      this.validateExportPatterns()
      this.validateOrganizationId()
      this.validateErrorHandling()
      
      this.applyFixes()
      this.generateReport()
      
    } catch (error) {
      console.error('❌ Standardization check failed:', error.message)
      process.exit(1)
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const checker = new HeraStandardizationChecker()
  checker.run()
}

module.exports = HeraStandardizationChecker