/**
 * Deploy the fixed user membership RPC function
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import 'dotenv/config'

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

async function deployFunction() {
  console.log('🚀 Deploying fixed user membership RPC...')
  
  try {
    // Read the SQL file
    const sql = readFileSync('fix-user-membership-rpc.sql', 'utf8')
    
    // Execute the SQL to create/replace the function
    const { data, error } = await supabase.rpc('exec_sql', { sql_text: sql })
    
    if (error) {
      console.error('❌ Deploy failed:', error)
      return false
    }
    
    console.log('✅ Function deployed successfully')
    
    // Test the function with Michele
    console.log('\n🧪 Testing with Michele...')
    const { data: testResult, error: testError } = await supabase.rpc('hera_setup_user_membership_v2', {
      p_supabase_user_id: '3ced4979-4c09-4e1e-8667-6707cfe6ec77',
      p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
    })
    
    if (testError) {
      console.error('❌ Test failed:', testError)
      return false
    } else {
      console.log('✅ Test result:', JSON.stringify(testResult, null, 2))
    }
    
    return true
    
  } catch (error) {
    console.error('💥 Deployment failed:', error)
    return false
  }
}

// Run the deployment
deployFunction()
  .then(success => {
    console.log(`\n🎯 Deployment ${success ? 'SUCCESSFUL' : 'FAILED'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })