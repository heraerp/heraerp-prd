#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function testUniversalApiRead() {
  try {
    console.log('🔍 Testing Universal API read behavior...\n');

    // Step 1: Get entity IDs
    const { data: entities } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'appointment')
      .limit(5);

    const entityIds = entities?.map(e => e.id) || [];
    console.log(`Found ${entityIds.length} appointment entities`);

    // Step 2: Test IN query behavior
    console.log('\n📊 Testing IN query with entity IDs array:');
    
    // Test with filled array
    const query1 = supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID);

    // Apply IN filter
    const query1WithIn = query1.in('entity_id', entityIds);
    
    const { data: data1, error: error1 } = await query1WithIn;
    
    if (error1) {
      console.error('❌ Error with IN query:', error1);
    } else {
      console.log(`✅ IN query with ${entityIds.length} IDs returned ${data1?.length || 0} records`);
    }

    // Step 3: Test direct filter approach
    console.log('\n📊 Testing direct filter object:');
    
    const filterObj = {
      organization_id: ORGANIZATION_ID,
      entity_id: entityIds
    };

    console.log('Filter object:', JSON.stringify(filterObj, null, 2));

    // Step 4: Test pagination logic
    const pageIds = entityIds.slice(0, 3); // Simulate pagination
    console.log(`\n📄 Testing with paginated IDs (${pageIds.length} IDs)`);

    const { data: paginatedData, error: paginatedError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .in('entity_id', pageIds);

    if (paginatedError) {
      console.error('❌ Error with paginated query:', paginatedError);
    } else {
      console.log(`✅ Paginated query returned ${paginatedData?.length || 0} records`);
      
      // Group by entity
      const byEntity = new Map();
      paginatedData?.forEach(record => {
        const entityRecords = byEntity.get(record.entity_id) || [];
        entityRecords.push(record);
        byEntity.set(record.entity_id, entityRecords);
      });

      console.log(`\n📊 Records by entity:`);
      byEntity.forEach((records, entityId) => {
        console.log(`  Entity ${entityId}: ${records.length} fields`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testUniversalApiRead();