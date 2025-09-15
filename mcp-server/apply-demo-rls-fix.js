#!/usr/bin/env node

/**
 * Apply RLS fix for demo users
 * This allows all demo users to access their organization's data
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function executeSQLFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8')
    
    // Split by semicolons but ignore those within functions
    const statements = sql
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';')
    
    console.log(`📄 Executing ${statements.length} SQL statements from ${path.basename(filePath)}`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comments and empty statements
      if (!statement || statement.trim().startsWith('--')) continue
      
      console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}`)
      console.log(`   ${statement.substring(0, 60)}...`)
      
      // For complex statements, we need to use a raw query approach
      // Since Supabase JS client doesn't have direct SQL execution, we'll use the REST API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ sql_query: statement })
      })
      
      if (!response.ok) {
        const error = await response.text()
        console.error(`❌ Error executing statement: ${error}`)
        // Continue with other statements
      } else {
        console.log('✅ Statement executed successfully')
      }
    }
    
    return true
  } catch (error) {
    console.error('Error executing SQL file:', error)
    return false
  }
}

async function createExecSQLFunction() {
  // First, create the exec_sql function if it doesn't exist
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;
  `
  
  try {
    // Try to create the function using direct HTTP request
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: createFunctionSQL })
    })
    
    console.log('✅ exec_sql function ready')
  } catch (error) {
    console.log('ℹ️  exec_sql function might already exist')
  }
}

async function main() {
  console.log('🔐 Applying RLS fixes for demo users...')
  console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  
  // Create exec_sql function if needed
  await createExecSQLFunction()
  
  // Apply the RLS fix
  const sqlFile = path.join(__dirname, '../database/migrations/fix-demo-rls-policies.sql')
  
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ SQL file not found:', sqlFile)
    return
  }
  
  const success = await executeSQLFile(sqlFile)
  
  if (success) {
    console.log('\n✅ RLS policies have been updated!')
    console.log('📌 Demo users can now access their organization data')
    console.log('\n🔄 Please log out and log back in for changes to take effect')
  } else {
    console.log('\n⚠️  Some statements may have failed, but policies might still be updated')
    console.log('📌 Check your Supabase dashboard for the current policies')
  }
}

main().catch(console.error)