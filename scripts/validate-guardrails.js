#!/usr/bin/env node

/**
 * HERA Guardrails Validator
 * Quick validation script for CI/CD and pre-commit hooks
 */

const fs = require('fs')
const path = require('path')

// Load guardrails config
const guardrailsPath = path.join(__dirname, '../guardrails/hera-guardrails.json')
const guardrails = JSON.parse(fs.readFileSync(guardrailsPath, 'utf8'))

// Sacred tables
const SACRED_TABLES = guardrails.hera_guardrails.scope.sacred_tables

// Validation functions
function validatePayload(payload, table) {
  const violations = []
  
  // 1. Check entity_type normalization
  if (payload.entity_type === 'gl_account') {
    violations.push({
      rule: 'ENTITY-TYPE-ALIAS-GL-ACCOUNT',
      severity: 'error',
      message: "entity_type='gl_account' is forbidden. Use 'account' with business_rules.ledger_type='GL'",
      autofix: {
        entity_type: 'account',
        business_rules: { ledger_type: 'GL' }
      }
    })
  }
  
  // 2. Check organization_id requirement
  if (!payload.organization_id && table !== 'core_organizations') {
    violations.push({
      rule: 'ORG-FILTER-REQUIRED',
      severity: 'error',
      message: 'organization_id is required for all operations'
    })
  }
  
  // 3. Check smart_code requirement
  const smartCodeTables = ['core_entities', 'universal_transactions', 'universal_transaction_lines', 'core_relationships']
  if (smartCodeTables.includes(table) && !payload.smart_code) {
    violations.push({
      rule: 'SMARTCODE-PRESENT',
      severity: 'error',
      message: `smart_code is required for ${table}`
    })
  } else if (payload.smart_code) {
    // Validate smart_code format
    const pattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/
    if (!pattern.test(payload.smart_code)) {
      violations.push({
        rule: 'SMARTCODE-FORMAT',
        severity: 'error',
        message: `Invalid smart_code format. Expected: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{VERSION}`
      })
    }
  }
  
  // 4. Check relationships column names
  if (table === 'core_relationships') {
    if (payload.source_entity_id || payload.target_entity_id) {
      violations.push({
        rule: 'REL-NAMES-CANONICAL',
        severity: 'error',
        message: "Use 'from_entity_id' and 'to_entity_id' instead of 'source_entity_id' and 'target_entity_id'",
        autofix: {
          from_entity_id: payload.source_entity_id,
          to_entity_id: payload.target_entity_id
        }
      })
    }
    if (!payload.from_entity_id || !payload.to_entity_id) {
      violations.push({
        rule: 'REL-NAMES-CANONICAL',
        severity: 'error',
        message: 'from_entity_id and to_entity_id are required for relationships'
      })
    }
  }
  
  // 5. Check for forbidden tables
  if (!SACRED_TABLES.includes(table)) {
    violations.push({
      rule: 'TABLE-ONLY-6',
      severity: 'error',
      message: `Table '${table}' is not one of the sacred 6 tables: ${SACRED_TABLES.join(', ')}`
    })
  }
  
  return violations
}

// Check SQL files for violations
function validateSQLFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const violations = []
  
  // Check for CREATE TABLE outside sacred tables
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi
  let match
  while ((match = createTableRegex.exec(content)) !== null) {
    const tableName = match[1]
    if (!tableName.startsWith('core_') && !tableName.startsWith('universal_')) {
      violations.push({
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
        rule: 'TABLE-ONLY-6',
        severity: 'error',
        message: `Creating non-sacred table: ${tableName}`
      })
    }
  }
  
  // Check for ALTER TABLE adding business columns
  const alterTableRegex = /ALTER\s+TABLE\s+(core_|universal_)\w+\s+ADD\s+COLUMN\s+(\w+)/gi
  while ((match = alterTableRegex.exec(content)) !== null) {
    const columnName = match[2]
    // Allow only system columns
    const allowedPrefixes = ['ai_', 'system_', 'audit_', 'deleted_', 'archived_']
    if (!allowedPrefixes.some(prefix => columnName.startsWith(prefix))) {
      violations.push({
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
        rule: 'DDL-FORBID-BUSINESS-ADD-COLUMN',
        severity: 'error',
        message: `Adding business column '${columnName}' to sacred table. Use core_dynamic_data instead.`
      })
    }
  }
  
  return violations
}

// Main validation
function main() {
  const args = process.argv.slice(2)
  let violations = []
  
  if (args[0] === '--payload') {
    // Validate a JSON payload
    const payload = JSON.parse(args[1] || '{}')
    const table = args[2] || 'core_entities'
    violations = validatePayload(payload, table)
    
  } else if (args[0] === '--sql') {
    // Validate SQL files
    const sqlFiles = args.slice(1)
    for (const file of sqlFiles) {
      violations.push(...validateSQLFile(file))
    }
    
  } else if (args[0] === '--all') {
    // Validate all SQL files in the project
    const findSQLFiles = (dir) => {
      const files = []
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...findSQLFiles(fullPath))
        } else if (entry.isFile() && entry.name.endsWith('.sql')) {
          files.push(fullPath)
        }
      }
      return files
    }
    
    const projectRoot = path.join(__dirname, '..')
    const sqlFiles = findSQLFiles(projectRoot)
    
    for (const file of sqlFiles) {
      violations.push(...validateSQLFile(file))
    }
    
  } else {
    console.log(`
HERA Guardrails Validator

Usage:
  node validate-guardrails.js --payload '{"entity_type":"customer"}' [table_name]
  node validate-guardrails.js --sql file1.sql file2.sql
  node validate-guardrails.js --all

Examples:
  # Validate a payload
  node validate-guardrails.js --payload '{"entity_type":"gl_account","entity_name":"Cash"}' core_entities
  
  # Validate SQL files
  node validate-guardrails.js --sql database/migrations/*.sql
  
  # Validate entire project
  node validate-guardrails.js --all
    `)
    process.exit(0)
  }
  
  // Report violations
  if (violations.length > 0) {
    console.error('\n❌ HERA Guardrail Violations Found:\n')
    
    violations.forEach((v, i) => {
      console.error(`${i + 1}. [${v.severity.toUpperCase()}] ${v.rule}`)
      console.error(`   ${v.message}`)
      if (v.file) {
        console.error(`   File: ${v.file}:${v.line}`)
      }
      if (v.autofix) {
        console.error(`   Autofix available:`, v.autofix)
      }
      console.error()
    })
    
    console.error(`Total violations: ${violations.length}`)
    process.exit(1)
  } else {
    console.log('✅ All HERA guardrails passed!')
    process.exit(0)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

// Export for use in other scripts
module.exports = { validatePayload, validateSQLFile }