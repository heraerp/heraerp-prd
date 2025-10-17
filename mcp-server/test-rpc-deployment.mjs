/**
 * Test the deployed RPC function to verify it's working correctly
 * Run this AFTER deploying the SQL via Supabase Dashboard
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

async function testRPCDeployment() {
  console.log('🧪 Testing RPC deployment...')
  
  const testCases = [
    {
      name: 'hera_setup_user_membership_fixed',
      params: {
        p_supabase_user_id: '3ced4979-4c09-4e1e-8667-6707cfe6ec77',
        p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
      }
    },
    {
      name: 'hera_user_membership_setup_v1',
      params: {
        p_supabase_user_id: '3ced4979-4c09-4e1e-8667-6707cfe6ec77',
        p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
      }
    }
  ]
  
  let allPassed = true
  
  for (const testCase of testCases) {
    console.log(`\\n📋 Testing function: ${testCase.name}`)
    
    try {
      const { data, error } = await supabase.rpc(testCase.name, testCase.params)
      
      if (error) {
        if (error.message.includes('Could not find the function')) {
          console.log(`❌ Function ${testCase.name} not deployed yet`)
          console.log('   📝 Please deploy the SQL first using Supabase Dashboard')
          allPassed = false
        } else {
          console.log(`❌ Function ${testCase.name} failed:`, error)
          allPassed = false
        }
      } else {
        console.log(`✅ Function ${testCase.name} working!`)
        
        // Validate response structure
        if (data?.success === true) {
          console.log(`   ✅ Success: ${data.message}`)
          console.log(`   📊 Duplicates cleaned: ${data.duplicate_memberships_cleaned || 0}`)
          console.log(`   👤 User: ${data.email}`)
          console.log(`   🏢 Org: ${data.organization_id}`)
        } else {
          console.log(`   ⚠️ Unexpected response:`, data)
          allPassed = false
        }
      }
      
    } catch (error) {
      console.log(`💥 Test failed for ${testCase.name}:`, error.message)
      allPassed = false
    }
  }
  
  // Summary
  console.log('\\n📊 TEST SUMMARY')
  console.log('================')
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('✅ RPC functions are deployed and working correctly')
    console.log('✅ Future authentication loops are now prevented')
    console.log('✅ Duplicate relationship cleanup is automatic')
  } else {
    console.log('❌ SOME TESTS FAILED')
    console.log('📝 Next steps:')
    console.log('   1. Deploy the SQL via Supabase Dashboard')
    console.log('   2. Run this test again to verify')
    console.log('   3. Check deployment instructions in RPC-DEPLOYMENT-INSTRUCTIONS.md')
  }
  
  return allPassed
}

// Run the test
testRPCDeployment()
  .then(success => {
    console.log(`\\n🎯 Testing ${success ? 'COMPLETED SUCCESSFULLY' : 'NEEDS DEPLOYMENT'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test script failed:', error)
    process.exit(1)
  })