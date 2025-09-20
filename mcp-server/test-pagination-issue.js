#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { startOfDay, endOfDay, addDays } = require('date-fns');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function testPaginationIssue() {
  try {
    console.log('🔍 Testing pagination issue...\n');

    // Get ALL appointment entities
    const { data: allEntities } = await supabase
      .from('core_entities')
      .select('id, entity_name, created_at')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'appointment')
      .order('created_at', { ascending: false });

    console.log(`📅 Total appointments: ${allEntities?.length || 0}\n`);

    // Fetch ALL dynamic data
    const entityIds = allEntities?.map(e => e.id) || [];
    
    // Fetch dynamic data in chunks
    const CHUNK_SIZE = 200;
    const allDynamicData = [];
    
    for (let i = 0; i < entityIds.length; i += CHUNK_SIZE) {
      const chunk = entityIds.slice(i, i + CHUNK_SIZE);
      const { data } = await supabase
        .from('core_dynamic_data')
        .select('entity_id, field_name, field_value_text')
        .eq('organization_id', ORGANIZATION_ID)
        .in('entity_id', chunk);
      
      allDynamicData.push(...(data || []));
    }

    // Build a map of entity_id -> start_time
    const startTimes = new Map();
    allDynamicData.forEach(record => {
      if (record.field_name === 'start_time' && record.field_value_text) {
        startTimes.set(record.entity_id, new Date(record.field_value_text));
      }
    });

    // Date range from hook
    const date_from = startOfDay(new Date());
    const date_to = endOfDay(addDays(new Date(), 14));

    console.log(`📅 Date range: ${date_from.toISOString()} to ${date_to.toISOString()}\n`);

    // Check which appointments fall in the date range
    const appointmentsInRange = [];
    allEntities?.forEach((entity, index) => {
      const startTime = startTimes.get(entity.id);
      if (startTime && startTime >= date_from && startTime <= date_to) {
        appointmentsInRange.push({
          index,
          id: entity.id,
          name: entity.entity_name,
          startTime: startTime.toISOString()
        });
      }
    });

    console.log(`✅ Appointments in date range: ${appointmentsInRange.length}\n`);

    // Check pagination
    const PAGE_SIZE = 20;
    console.log(`📄 With page_size=${PAGE_SIZE}:`);
    
    for (let page = 1; page <= 3; page++) {
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageAppointments = appointmentsInRange.filter(a => a.index >= start && a.index < end);
      
      console.log(`\nPage ${page} (indices ${start}-${end-1}):`);
      console.log(`  - Would fetch ${Math.min(PAGE_SIZE, allEntities.length - start)} appointments`);
      console.log(`  - After date filter: ${pageAppointments.length} appointments`);
      
      if (pageAppointments.length > 0) {
        console.log('  - First few:');
        pageAppointments.slice(0, 3).forEach(apt => {
          console.log(`    • ${apt.name.substring(0, 50)}...`);
        });
      }
    }

    // Test with page_size=50
    console.log(`\n📄 With page_size=50:`);
    const start = 0;
    const end = 50;
    const firstPageLarge = appointmentsInRange.filter(a => a.index >= start && a.index < end);
    console.log(`  - Page 1 would have ${firstPageLarge.length} appointments after date filter`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testPaginationIssue();