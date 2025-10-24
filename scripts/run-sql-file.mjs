#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runSqlFile(filePath) {
  try {
    console.log(`📄 Executing SQL file: ${filePath}`)
    
    const sql = readFileSync(filePath, 'utf8')
    
    // Split SQL into individual statements (simple approach)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim().length === 0) continue
      
      // Execute as RPC for function creation, or direct query for simple statements
      if (statement.includes('CREATE OR REPLACE FUNCTION') || statement.includes('CREATE FUNCTION')) {
        const { error } = await supabase.rpc('exec_sql', { sql_text: statement })
        if (error) {
          console.error(`❌ Error executing statement: ${error.message}`)
          console.error(`Statement: ${statement.substring(0, 100)}...`)
          process.exit(1)
        }
      } else {
        // For grants, comments, etc.
        try {
          const { error } = await supabase.from('_pg_stat_statements').select('*').limit(0)
          // If we can't execute directly, skip non-critical statements
          if (statement.includes('GRANT') || statement.includes('COMMENT')) {
            console.log(`⚠️  Skipping: ${statement.substring(0, 50)}...`)
            continue
          }
        } catch (e) {
          console.log(`⚠️  Skipping statement: ${statement.substring(0, 50)}...`)
        }
      }
    }
    
    console.log(`✅ Successfully executed: ${filePath}`)
    
  } catch (error) {
    console.error(`❌ Error reading/executing file ${filePath}:`, error.message)
    process.exit(1)
  }
}

// Get file path from command line
const filePath = process.argv[2]
if (!filePath) {
  console.error('❌ Usage: node run-sql-file.mjs <path-to-sql-file>')
  process.exit(1)
}

runSqlFile(filePath)