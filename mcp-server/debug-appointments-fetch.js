#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz demo org

async function debugAppointmentsFetch() {
  try {
    console.log('🔍 Debugging appointments fetch...\n');

    // Step 1: Check if appointments exist
    const { data: entities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('id, organization_id, entity_type, entity_name, smart_code, created_at')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'appointment')
      .order('created_at', { ascending: false })
      .limit(10);

    if (entitiesError) {
      console.error('❌ Error fetching entities:', entitiesError);
      return;
    }

    console.log(`📅 Found ${entities?.length || 0} appointment entities\n`);

    if (!entities || entities.length === 0) {
      console.log('❌ No appointments found. Creating test appointments...');
      return;
    }

    // Step 2: Test IN query with entity IDs
    const entityIds = entities.map(e => e.id);
    console.log(`🔍 Testing IN query with ${entityIds.length} entity IDs...`);

    const { data: dynamicDataWithIn, error: inError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_text, field_value_number, field_value_date')
      .eq('organization_id', ORGANIZATION_ID)
      .in('entity_id', entityIds);

    if (inError) {
      console.error('❌ Error with IN query:', inError);
    } else {
      console.log(`✅ IN query returned ${dynamicDataWithIn?.length || 0} dynamic data records`);
    }

    // Step 3: Test chunking approach
    console.log('\n🔍 Testing chunked approach...');
    const CHUNK_SIZE = 200;
    const chunks = [];
    
    for (let i = 0; i < entityIds.length; i += CHUNK_SIZE) {
      chunks.push(entityIds.slice(i, i + CHUNK_SIZE));
    }

    console.log(`📦 Split into ${chunks.length} chunks`);

    let allDynamicData = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const { data, error } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('organization_id', ORGANIZATION_ID)
        .in('entity_id', chunk);

      if (error) {
        console.error(`❌ Error in chunk ${i + 1}:`, error);
      } else {
        console.log(`✅ Chunk ${i + 1} returned ${data?.length || 0} records`);
        allDynamicData = allDynamicData.concat(data || []);
      }
    }

    console.log(`\n📊 Total dynamic data records: ${allDynamicData.length}`);

    // Step 4: Check date filtering
    console.log('\n🗓️ Checking date filtering...');
    
    // Get appointment dates from dynamic data
    const appointmentDates = new Map();
    allDynamicData.forEach(record => {
      if (record.field_name === 'start_time' && record.field_value_text) {
        appointmentDates.set(record.entity_id, new Date(record.field_value_text));
      }
    });

    console.log(`Found ${appointmentDates.size} appointments with start times`);

    // Check date ranges
    const now = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    let inRange = 0;
    let beforeRange = 0;
    let afterRange = 0;

    appointmentDates.forEach((date, entityId) => {
      if (date >= now && date <= twoWeeksFromNow) {
        inRange++;
      } else if (date < now) {
        beforeRange++;
      } else {
        afterRange++;
      }
    });

    console.log(`📅 Date range analysis:`);
    console.log(`  - In range (today to +14 days): ${inRange}`);
    console.log(`  - Before today: ${beforeRange}`);
    console.log(`  - After +14 days: ${afterRange}`);

    // Step 5: Build sample appointment DTO
    if (entities.length > 0) {
      console.log('\n🔧 Building sample appointment DTO...');
      const sampleEntity = entities[0];
      const sampleDynamicData = allDynamicData.filter(d => d.entity_id === sampleEntity.id);
      
      const dynamicFields = {};
      sampleDynamicData.forEach(field => {
        const value = field.field_value_text || 
                     field.field_value_number || 
                     field.field_value_date || 
                     field.field_value_json;
        dynamicFields[field.field_name] = value;
      });

      console.log('\nSample appointment DTO:');
      console.log({
        id: sampleEntity.id,
        organization_id: sampleEntity.organization_id,
        entity_name: sampleEntity.entity_name,
        start_time: dynamicFields.start_time || 'NOT FOUND',
        end_time: dynamicFields.end_time || 'NOT FOUND',
        status: dynamicFields.status || 'NOT FOUND',
        stylist_id: dynamicFields.stylist_id || 'NOT FOUND',
        customer_id: dynamicFields.customer_id || 'NOT FOUND'
      });
    }

    // Step 6: Test empty array handling
    console.log('\n🔍 Testing empty array handling...');
    const { data: emptyTest, error: emptyError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .in('entity_id', []);

    if (emptyError) {
      console.error('❌ Error with empty array:', emptyError);
    } else {
      console.log(`✅ Empty array query returned ${emptyTest?.length || 0} records`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugAppointmentsFetch();