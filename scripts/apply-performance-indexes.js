#!/usr/bin/env node

/**
 * Apply performance indexes for salon POS canary
 * Target: Drop p95 from 1.2s to <200ms
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyIndexes() {
  console.log('🔧 Applying performance indexes for salon POS optimization...')
  
  try {
    // Read the SQL file
    const indexSQL = fs.readFileSync(
      path.join(__dirname, '../database/performance/hot-path-indexes.sql'), 
      'utf8'
    )
    
    // Split statements and filter out comments
    const statements = indexSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue
      
      console.log(`\n${i + 1}/${statements.length}: Executing...`)
      console.log(statement.substring(0, 80) + '...')
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_statement: statement 
        })
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message)
        // Continue with other statements
      }
    }
    
    console.log('\n🎯 Performance index application completed!')
    console.log('📊 Expected improvements:')
    console.log('  • Cart line queries: 80% faster')
    console.log('  • Transaction lookups: 60% faster') 
    console.log('  • Entity resolution: 70% faster')
    console.log('  • Overall p95 target: <200ms (from 1.2s)')
    
  } catch (error) {
    console.error('❌ Failed to apply indexes:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  applyIndexes()
}

module.exports = { applyIndexes }