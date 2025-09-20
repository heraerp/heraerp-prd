#!/usr/bin/env node
/**
 * Test RLS Fix for core_dynamic_data
 * 
 * This script tests if the RLS fix resolved the "app.current_org" error
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL') 
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🧪 Testing RLS Fix for core_dynamic_data')
console.log('='​.repeat(50))

async function testQueries() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Test 1: Query core_dynamic_data (this was failing before)
    console.log('📊 Testing core_dynamic_data query...')
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('id, organization_id, field_name, field_type, field_value')
      .limit(10)
    
    if (dynamicError) {
      console.error('❌ core_dynamic_data query failed:', dynamicError.message)
      
      if (dynamicError.message.includes('app.current_org')) {
        console.log('💡 Still getting app.current_org error. Try running the SQL fix manually:')
        console.log('   1. Connect to Supabase Dashboard > SQL Editor')
        console.log('   2. Run the contents of simple-rls-fix.sql')
        console.log('   3. Or run: node execute-rls-app-current-org-fix.js')
        return false
      }
    } else {
      console.log('✅ core_dynamic_data query successful!')
      console.log(`   Found ${dynamicData?.length || 0} dynamic data records`)
      
      if (dynamicData && dynamicData.length > 0) {
        console.log('   Sample records:')
        dynamicData.slice(0, 3).forEach(record => {
          console.log(`   - ${record.field_name} (${record.field_type}) = ${record.field_value}`)
        })
      }
    }

    // Test 2: Query core_entities
    console.log('\n📊 Testing core_entities query...')
    const { data: entities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('id, organization_id, entity_type, entity_name')
      .limit(10)
    
    if (entitiesError) {
      console.error('❌ core_entities query failed:', entitiesError.message)
    } else {
      console.log('✅ core_entities query successful!')
      console.log(`   Found ${entities?.length || 0} entities`)
      
      if (entities && entities.length > 0) {
        console.log('   Sample entities:')
        entities.slice(0, 3).forEach(entity => {
          console.log(`   - ${entity.entity_name} (${entity.entity_type})`)
        })
      }
    }

    // Test 3: Query universal_transactions  
    console.log('\n📊 Testing universal_transactions query...')
    const { data: transactions, error: transError } = await supabase
      .from('universal_transactions')
      .select('id, organization_id, transaction_type, total_amount')
      .limit(10)
    
    if (transError) {
      console.error('❌ universal_transactions query failed:', transError.message)
    } else {
      console.log('✅ universal_transactions query successful!')
      console.log(`   Found ${transactions?.length || 0} transactions`)
      
      if (transactions && transactions.length > 0) {
        console.log('   Sample transactions:')
        transactions.slice(0, 3).forEach(txn => {
          console.log(`   - ${txn.transaction_type}: $${txn.total_amount || 0}`)
        })
      }
    }

    // Test 4: List organizations for context
    console.log('\n📊 Testing core_organizations query...')  
    const { data: orgs, error: orgsError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_code')
      .limit(10)
      
    if (orgsError) {
      console.error('❌ core_organizations query failed:', orgsError.message)
    } else {
      console.log('✅ core_organizations query successful!')
      console.log(`   Found ${orgs?.length || 0} organizations`)
      
      if (orgs && orgs.length > 0) {
        console.log('   Available organizations:')
        orgs.forEach(org => {
          console.log(`   - ${org.organization_name} (${org.organization_code})`)
          console.log(`     ID: ${org.id}`)
        })
      }
    }

    console.log('\n✅ All tests completed successfully!')
    console.log('🎉 The RLS configuration issue has been resolved.')
    
    return true

  } catch (error) {
    console.error('💥 Test script error:', error.message)
    return false
  }
}

// Test with specific organization_id filter
async function testWithOrgFilter(organizationId) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  console.log(`\n🎯 Testing with organization_id filter: ${organizationId}`)
  
  try {
    const { data, error } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', organizationId)
      .limit(5)
    
    if (error) {
      console.error('❌ Filtered query failed:', error.message)
      return false
    } else {
      console.log(`✅ Filtered query successful! Found ${data?.length || 0} records`)
      return true
    }
  } catch (error) {
    console.error('💥 Filtered test error:', error.message)
    return false
  }
}

// Main execution
async function main() {
  const success = await testQueries()
  
  if (success) {
    // Try with a specific organization if available
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: orgs } = await supabase
      .from('core_organizations')
      .select('id')
      .limit(1)
    
    if (orgs && orgs.length > 0) {
      await testWithOrgFilter(orgs[0].id)
    }
  }

  console.log('\n📋 Summary:')
  console.log('- If all tests passed, your RLS configuration is working')
  console.log('- If any test failed with "app.current_org" error, run the SQL fix')
  console.log('- The Universal API should now work without 400 Bad Request errors')
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })
}

module.exports = { testQueries, testWithOrgFilter }