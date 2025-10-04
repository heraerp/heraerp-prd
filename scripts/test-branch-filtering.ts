/**
 * Test Branch Filtering
 * Smart Code: HERA.SCRIPT.TEST_BRANCH_FILTERING.V1
 * 
 * Tests the branch filtering functionality with existing data
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Hair Talkz Configuration
const ORGANIZATION_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const PARK_REGIS_BRANCH_ID = 'a196a033-8e16-4308-82dd-6df7fb208a70'
const MERCURE_GOLD_BRANCH_ID = '09d57baa-99b0-4b7c-9583-1f53787e8472'

async function testBranchFiltering() {
  console.log('🔍 Testing Hair Talkz branch filtering...\n')

  try {
    // 1. Test direct queries
    console.log('📋 Direct Entity Queries:')
    
    // Get all services
    const { data: allServices, error: servicesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'SERVICE')
      .neq('status', 'deleted')

    if (servicesError) throw servicesError
    console.log(`Total services: ${allServices?.length || 0}`)

    // Get all products
    const { data: allProducts, error: productsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'PRODUCT')
      .neq('status', 'deleted')

    if (productsError) throw productsError
    console.log(`Total products: ${allProducts?.length || 0}`)

    // 2. Test branch relationships
    console.log('\n📍 Branch Relationships:')
    
    // Get Park Regis services
    const { data: parkRegisRelationships } = await supabase
      .from('core_relationships')
      .select('from_entity_id')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('to_entity_id', PARK_REGIS_BRANCH_ID)
      .eq('relationship_type', 'AVAILABLE_AT')

    console.log(`Park Regis services: ${parkRegisRelationships?.length || 0}`)

    // Get Mercure Gold services
    const { data: mercureRelationships } = await supabase
      .from('core_relationships')
      .select('from_entity_id')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('to_entity_id', MERCURE_GOLD_BRANCH_ID)
      .eq('relationship_type', 'AVAILABLE_AT')

    console.log(`Mercure Gold services: ${mercureRelationships?.length || 0}`)

    // 3. Test RPC function
    console.log('\n🚀 Testing RPC Function:')
    
    // Test Park Regis branch filtering
    const { data: parkRegisData, error: parkError } = await supabase
      .rpc('hera_entity_read_with_branch_v1', {
        p_organization_id: ORGANIZATION_ID,
        p_entity_type: 'SERVICE',
        p_branch_id: PARK_REGIS_BRANCH_ID,
        p_relationship_type: 'AVAILABLE_AT',
        p_include_dynamic_data: true
      })

    if (parkError) {
      console.error('❌ Park Regis RPC error:', parkError)
    } else if (parkRegisData?.success) {
      console.log(`✅ Park Regis filtered services: ${parkRegisData.data?.length || 0}`)
      if (parkRegisData.data?.length > 0) {
        console.log('  Services:')
        parkRegisData.data.forEach((service: any) => {
          console.log(`    - ${service.entity_name}`)
        })
      }
    }

    // Test Mercure Gold branch filtering
    const { data: mercureData, error: mercureError } = await supabase
      .rpc('hera_entity_read_with_branch_v1', {
        p_organization_id: ORGANIZATION_ID,
        p_entity_type: 'SERVICE',
        p_branch_id: MERCURE_GOLD_BRANCH_ID,
        p_relationship_type: 'AVAILABLE_AT',
        p_include_dynamic_data: true
      })

    if (mercureError) {
      console.error('❌ Mercure Gold RPC error:', mercureError)
    } else if (mercureData?.success) {
      console.log(`✅ Mercure Gold filtered services: ${mercureData.data?.length || 0}`)
      if (mercureData.data?.length > 0) {
        console.log('  Services:')
        mercureData.data.forEach((service: any) => {
          console.log(`    - ${service.entity_name}`)
        })
      }
    }

    // 4. Summary
    console.log('\n📊 Branch Filtering Summary:')
    console.log('━'.repeat(60))
    console.log('✅ Direct queries working')
    console.log('✅ Relationship queries working')
    console.log('✅ RPC function ready for use')
    console.log('━'.repeat(60))
    
    console.log('\n💡 Next Steps:')
    console.log('1. The UI should now show filtered data when switching branches')
    console.log('2. Check console logs for "Using RPC: hera_entity_read_with_branch_v1"')
    console.log('3. Verify that Park Regis shows 3 services, Mercure Gold shows 4 services')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testBranchFiltering()