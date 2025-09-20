#!/usr/bin/env node

/**
 * Test script to verify the appointment pagination fix
 * Tests that appointments within date range are shown regardless of pagination position
 */

const { createClient } = require('@supabase/supabase-js');
const { startOfDay, endOfDay, addDays } = require('date-fns');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function testAppointmentFix() {
  try {
    console.log('🔍 Testing appointment pagination fix...\n');

    // Get ALL appointment entities
    const { data: allEntities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('id, entity_name, created_at')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'appointment')
      .order('created_at', { ascending: false });

    if (entitiesError) {
      console.error('❌ Error fetching entities:', entitiesError);
      return;
    }

    console.log(`📅 Total appointments in database: ${allEntities?.length || 0}`);

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

    // Date range from hook (today + 14 days)
    const date_from = startOfDay(new Date());
    const date_to = endOfDay(addDays(new Date(), 14));

    console.log(`\n📅 Date range filter:`);
    console.log(`  From: ${date_from.toISOString()} (${date_from.toDateString()})`);
    console.log(`  To:   ${date_to.toISOString()} (${date_to.toDateString()})`);

    // Find all appointments in date range
    const appointmentsInRange = [];
    allEntities?.forEach((entity, index) => {
      const startTime = startTimes.get(entity.id);
      if (startTime && startTime >= date_from && startTime <= date_to) {
        appointmentsInRange.push({
          index,
          id: entity.id,
          name: entity.entity_name,
          startTime: startTime.toISOString(),
          startDate: startTime.toDateString()
        });
      }
    });

    console.log(`\n✅ Appointments that should be visible: ${appointmentsInRange.length}`);
    
    if (appointmentsInRange.length > 0) {
      console.log('\n📋 Distribution across pagination pages (page_size=20):');
      
      const PAGE_SIZE = 20;
      const pageMap = new Map();
      
      appointmentsInRange.forEach(apt => {
        const page = Math.floor(apt.index / PAGE_SIZE) + 1;
        if (!pageMap.has(page)) {
          pageMap.set(page, []);
        }
        pageMap.get(page).push(apt);
      });
      
      pageMap.forEach((apts, page) => {
        console.log(`\n  Page ${page}: ${apts.length} appointments`);
        apts.slice(0, 3).forEach(apt => {
          console.log(`    • ${apt.name.substring(0, 40)}... (${apt.startDate})`);
        });
        if (apts.length > 3) {
          console.log(`    ... and ${apts.length - 3} more`);
        }
      });
      
      console.log('\n🎯 Expected behavior with fix:');
      console.log('  - The hook should fetch ALL appointments when date filters are present');
      console.log('  - Apply date filtering to find all matching appointments');
      console.log('  - Then paginate the filtered results');
      console.log(`  - Page 1 should show up to ${PAGE_SIZE} of the ${appointmentsInRange.length} matching appointments`);
      console.log(`  - Total count should be ${appointmentsInRange.length}, not ${allEntities.length}`);
    } else {
      console.log('\n⚠️ No appointments found in the date range!');
      console.log('This might be because all appointments are in the past or far future.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testAppointmentFix();