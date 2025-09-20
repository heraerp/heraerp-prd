#!/usr/bin/env node

/**
 * Test script to verify the dynamic data array fix
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function testDynamicDataFix() {
  try {
    console.log('🔍 Testing dynamic data array fix...\n');

    // Get some appointment entities
    const { data: entities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'appointment')
      .limit(5);

    if (entitiesError) {
      console.error('❌ Error fetching entities:', entitiesError);
      return;
    }

    const entityIds = entities?.map(e => e.id) || [];
    console.log(`📅 Found ${entityIds.length} appointments`);
    console.log('Entity IDs:', entityIds);

    // Test 1: Direct Supabase query with IN
    console.log('\n📊 Test 1: Direct Supabase IN query');
    const { data: directData, error: directError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .in('entity_id', entityIds);

    if (directError) {
      console.error('❌ Direct query error:', directError);
    } else {
      console.log(`✅ Direct query returned ${directData?.length || 0} records`);
    }

    // Test 2: Test the universal API approach
    console.log('\n📊 Test 2: Universal API with array filter');
    
    // Import universal API (assuming it's available in the build)
    const universalApiPath = '../dist/lib/universal-api-v2.js';
    try {
      const { universalApi } = require(universalApiPath);
      
      universalApi.setOrganizationId(ORGANIZATION_ID);
      
      const result = await universalApi.read('core_dynamic_data', {
        organization_id: ORGANIZATION_ID,
        entity_id: entityIds
      });
      
      if (result.success) {
        console.log(`✅ Universal API returned ${result.data?.length || 0} records`);
      } else {
        console.error('❌ Universal API error:', result.error);
      }
    } catch (e) {
      console.log('⚠️ Could not test universal API (not built):', e.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testDynamicDataFix();