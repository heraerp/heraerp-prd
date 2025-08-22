#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// HERA Universal Tables
const UNIVERSAL_TABLES = [
  'core_organizations',
  'core_entities', 
  'core_dynamic_data',
  'core_relationships',
  'universal_transactions',
  'universal_transaction_lines'
]

// Map database types to TypeScript types
const typeMapping = {
  'uuid': 'string',
  'text': 'string',
  'character varying': 'string',
  'integer': 'number',
  'bigint': 'number',
  'numeric': 'number',
  'boolean': 'boolean',
  'timestamp with time zone': 'string',
  'timestamp without time zone': 'string',
  'date': 'string',
  'jsonb': 'any',
  'json': 'any'
}

async function getTableSchema(tableName) {
  try {
    // Query to get column information
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0)

    if (error) {
      console.error(`❌ Error fetching schema for ${tableName}:`, error.message)
      return null
    }

    // Get actual column info from database
    const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
      table_name: tableName
    }).catch(() => ({ data: null, error: 'RPC not available' }))

    // Fallback: Use a dummy query to get column names
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    if (sampleData && sampleData.length > 0) {
      const sampleRow = sampleData[0]
      return Object.keys(sampleRow).map(columnName => ({
        column_name: columnName,
        data_type: typeof sampleRow[columnName] === 'number' ? 'numeric' : 
                   typeof sampleRow[columnName] === 'boolean' ? 'boolean' :
                   columnName.includes('_at') ? 'timestamp with time zone' :
                   columnName.includes('_id') ? 'uuid' : 'text',
        is_nullable: sampleRow[columnName] === null ? 'YES' : 'NO'
      }))
    }

    return []
  } catch (error) {
    console.error(`❌ Error processing ${tableName}:`, error.message)
    return null
  }
}

async function generateTypes() {
  console.log('🔍 Analyzing HERA database schema...\n')

  let typeDefinitions = `// Auto-generated TypeScript types from HERA database schema
// Generated on: ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Use 'npm run generate-types' to update

`

  for (const tableName of UNIVERSAL_TABLES) {
    console.log(`📊 Processing ${tableName}...`)
    
    const columns = await getTableSchema(tableName)
    
    if (!columns || columns.length === 0) {
      console.warn(`⚠️  No schema found for ${tableName}`)
      continue
    }

    // Generate interface name
    const interfaceName = tableName
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')

    typeDefinitions += `export interface ${interfaceName} {\n`

    for (const column of columns) {
      const tsType = typeMapping[column.data_type] || 'any'
      const optional = column.is_nullable === 'YES' ? '?' : ''
      const comment = column.data_type !== tsType ? ` // ${column.data_type}` : ''
      
      typeDefinitions += `  ${column.column_name}${optional}: ${tsType}${comment}\n`
    }

    typeDefinitions += `}\n\n`
    console.log(`✅ Generated types for ${tableName}`)
  }

  // Add utility types
  typeDefinitions += `// Utility types for HERA operations
export type EntityStatus = 'active' | 'inactive' | 'deleted' | 'draft'
export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'failed'
export type SmartCodeStatus = 'active' | 'deprecated' | 'testing'

// Type guards
export function isDeleted(entity: { status?: string }): boolean {
  return entity.status === 'deleted'
}

export function isActive(entity: { status?: string }): boolean {
  return entity.status !== 'deleted' && entity.status !== 'inactive'
}
`

  // Write to file
  const outputPath = path.join(__dirname, '..', 'src', 'types', 'database.types.ts')
  const outputDir = path.dirname(outputPath)
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, typeDefinitions)
  console.log(`\n✅ Types generated successfully at: ${outputPath}`)
}

// Add validation function
async function validateSchema() {
  console.log('\n🔍 Validating HERA schema assumptions...\n')
  
  const issues = []

  // Check for commonly assumed but non-existent columns
  const commonAssumptions = {
    'core_entities': ['is_deleted'],
    'core_relationships': ['parent_entity_id', 'child_entity_id'],
    'universal_transactions': ['transaction_number']
  }

  for (const [table, assumedColumns] of Object.entries(commonAssumptions)) {
    const schema = await getTableSchema(table)
    if (!schema) continue

    const actualColumns = schema.map(col => col.column_name)
    
    for (const assumedColumn of assumedColumns) {
      if (!actualColumns.includes(assumedColumn)) {
        issues.push({
          table,
          issue: `Column '${assumedColumn}' does not exist`,
          suggestion: `Use appropriate column instead (check schema)`
        })
      }
    }
  }

  if (issues.length > 0) {
    console.log('⚠️  Schema validation issues found:\n')
    issues.forEach(issue => {
      console.log(`   Table: ${issue.table}`)
      console.log(`   Issue: ${issue.issue}`)
      console.log(`   Suggestion: ${issue.suggestion}\n`)
    })
  } else {
    console.log('✅ No schema assumption issues found')
  }

  return issues
}

// Main execution
async function main() {
  console.log('🚀 HERA Database Type Generator\n')
  
  await generateTypes()
  await validateSchema()
  
  console.log('\n✨ Done!')
  process.exit(0)
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})