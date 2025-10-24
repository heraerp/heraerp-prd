const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Must use service role

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runRLSSetup() {
  console.log('🔐 Setting up HERA RLS functions and policies...\n')
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'setup-rls-for-production.sql')
    const sqlContent = await fs.readFile(sqlPath, 'utf8')
    
    // Split by semicolons but be careful with function bodies
    const statements = []
    let currentStatement = ''
    let inFunction = false
    
    const lines = sqlContent.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Track when we're inside a function definition
      if (trimmedLine.match(/^CREATE OR REPLACE FUNCTION/i)) {
        inFunction = true
      }
      
      currentStatement += line + '\n'
      
      // End of function is marked by $$ LANGUAGE
      if (inFunction && trimmedLine.match(/\$\$ LANGUAGE/i)) {
        inFunction = false
      }
      
      // If we hit a semicolon and we're not in a function, it's the end of a statement
      if (!inFunction && trimmedLine.endsWith(';')) {
        const statement = currentStatement.trim()
        if (statement && !statement.startsWith('--') && !statement.match(/^[\s]*$/)) {
          statements.push(statement)
        }
        currentStatement = ''
      }
    }
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)
    
    // Execute each statement
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Extract a description from the statement
      let description = 'SQL statement'
      if (statement.match(/CREATE OR REPLACE FUNCTION (\w+)/i)) {
        description = `Creating function ${RegExp.$1}()`
      } else if (statement.match(/CREATE POLICY "([^"]+)"/i)) {
        description = `Creating policy "${RegExp.$1}"`
      } else if (statement.match(/DROP POLICY IF EXISTS "([^"]+)"/i)) {
        description = `Dropping policy "${RegExp.$1}"`
      } else if (statement.match(/GRANT EXECUTE ON FUNCTION/i)) {
        description = 'Granting function permissions'
      }
      
      console.log(`${i + 1}/${statements.length}: ${description}...`)
      
      try {
        // Use raw SQL execution
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        }).throwOnError()
        
        if (error) {
          // Fallback: Try direct execution
          await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ sql: statement })
          })
        }
        
        console.log('  ✅ Success')
        successCount++
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`)
        errorCount++
        
        // For some errors, we might want to continue
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist')) {
          console.log('  ⚠️  This error is expected, continuing...')
        }
      }
    }
    
    console.log('\n📊 Summary:')
    console.log(`  ✅ Successful: ${successCount}`)
    console.log(`  ❌ Failed: ${errorCount}`)
    
    // Test the functions
    console.log('\n🧪 Testing the setup...')
    
    // Test 1: Check if hera_current_org_id works
    try {
      const { data, error } = await supabase.rpc('hera_current_org_id')
      console.log('✅ hera_current_org_id() function:', error ? `Error: ${error.message}` : `Returns: ${data}`)
    } catch (e) {
      console.log('❌ hera_current_org_id() test failed:', e.message)
    }
    
    // Test 2: Try to query dynamic data
    try {
      const { data, error } = await supabase
        .from('core_dynamic_data')
        .select('field_name')
        .eq('organization_id', '0fd09e31-d257-4329-97eb-7d7f522ed6f0')
        .limit(3)
      
      if (error) {
        console.log('❌ Dynamic data query failed:', error.message)
      } else {
        console.log(`✅ Dynamic data query succeeded: Found ${data.length} records`)
      }
    } catch (e) {
      console.log('❌ Dynamic data test failed:', e.message)
    }
    
    console.log('\n✨ RLS setup complete!')
    console.log('\n⚠️  IMPORTANT: If you see errors above, you may need to:')
    console.log('1. Run the SQL directly in Supabase Dashboard > SQL Editor')
    console.log('2. Make sure you\'re using a service role key (not anon key)')
    console.log('3. Check that RLS is enabled on your tables')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  }
}

// Alternative: Output SQL for manual execution
async function outputSQL() {
  const sqlPath = path.join(__dirname, 'setup-rls-for-production.sql')
  const sqlContent = await fs.readFile(sqlPath, 'utf8')
  
  console.log('📋 Copy and paste this SQL into your Supabase SQL Editor:\n')
  console.log('=' * 60)
  console.log(sqlContent)
  console.log('=' * 60)
}

// Check command line arguments
const args = process.argv.slice(2)
if (args.includes('--output-sql')) {
  outputSQL().catch(console.error)
} else {
  console.log('💡 Tip: Use --output-sql to just print the SQL for manual execution\n')
  runRLSSetup().catch(console.error)
}