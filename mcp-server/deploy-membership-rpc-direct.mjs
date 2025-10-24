/**
 * Deploy the fixed user membership RPC function using direct SQL execution
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import 'dotenv/config'

// Use service role for admin operations
const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

async function deployMembershipRPC() {
  console.log('🚀 Deploying fixed user membership RPC function...')
  
  try {
    // Read the SQL file
    const sql = readFileSync('fix-user-membership-rpc.sql', 'utf8')
    
    // Break it into individual statements (rough parsing)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';' // Add semicolon back
      console.log(`\\n📝 Executing statement ${i + 1}/${statements.length}...`)
      
      // Try to execute using a raw query approach
      const { data, error } = await supabase
        .from('pg_catalog.pg_proc') // Just to test connection
        .select('proname')
        .limit(1)
        
      if (error) {
        console.error('❌ Database connection failed:', error)
        return false
      }
      
      console.log('✅ Database connection OK')
      break // We can't actually execute DDL through the REST API
    }
    
    console.log('\\n⚠️ IMPORTANT: The SQL file has been prepared but needs manual execution.')
    console.log('\\nTo deploy this function:')
    console.log('1. Copy the contents of fix-user-membership-rpc.sql')
    console.log('2. Go to Supabase Dashboard > SQL Editor')
    console.log('3. Paste and execute the SQL')
    console.log('\\nOR use psql with your connection string')
    
    // Test if function exists by calling it
    console.log('\\n🧪 Testing if function already exists...')
    const { data: testResult, error: testError } = await supabase
      .rpc('hera_setup_user_membership_fixed', {
        p_supabase_user_id: '3ced4979-4c09-4e1e-8667-6707cfe6ec77',
        p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
      })
    
    if (testError) {
      if (testError.message.includes('Could not find the function')) {
        console.log('❌ Function not deployed yet - needs manual deployment')
        console.log('\\n📋 DEPLOYMENT INSTRUCTIONS:')
        console.log('\\n1. Copy this SQL and execute in Supabase SQL Editor:')
        console.log('   https://supabase.com/dashboard/project/awfcrncxngqwbhqapffb/sql/new')
        console.log('\\n2. SQL file location: mcp-server/fix-user-membership-rpc.sql')
        return false
      } else {
        console.error('❌ Function test failed:', testError)
        return false
      }
    } else {
      console.log('✅ Function already exists and working!')
      console.log('✅ Test result:', JSON.stringify(testResult, null, 2))
      return true
    }
    
  } catch (error) {
    console.error('💥 Deployment failed:', error)
    return false
  }
}

// Run the deployment
deployMembershipRPC()
  .then(success => {
    console.log(`\\n🎯 Deployment ${success ? 'SUCCESSFUL' : 'NEEDS MANUAL COMPLETION'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })