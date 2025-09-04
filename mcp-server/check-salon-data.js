#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSalonData(subdomain) {
  console.log(`\n🔍 Checking data for salon with subdomain: ${subdomain}\n`);

  try {
    // 1. Find organization by subdomain
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('settings->>subdomain', subdomain)
      .single();

    if (orgError || !org) {
      console.error('❌ Organization not found:', orgError?.message);
      return;
    }

    console.log(`✅ Found organization: ${org.organization_name} (${org.id})`);

    // 2. Count entities by type
    const entityTypes = ['customer', 'employee', 'service', 'product', 'appointment'];
    
    for (const type of entityTypes) {
      const { count } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('entity_type', type);
      
      console.log(`   - ${type}s: ${count || 0}`);
    }

    // 3. Check transactions
    const { count: txnCount } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);

    console.log(`   - transactions: ${txnCount || 0}`);

    // 4. Show sample appointment details
    console.log('\n📅 Sample Appointments:');
    const { data: appointments } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', org.id)
      .eq('entity_type', 'appointment')
      .limit(3);

    if (appointments && appointments.length > 0) {
      appointments.forEach(apt => {
        console.log(`\n   Appointment: ${apt.entity_name}`);
        console.log(`   Date: ${apt.metadata?.appointment_date}`);
        console.log(`   Time: ${apt.metadata?.appointment_time}`);
        console.log(`   Status: ${apt.metadata?.status}`);
      });
    } else {
      console.log('   No appointments found');
    }

    // 5. Show today's appointments specifically
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📆 Today's Appointments (${today}):`);
    
    const { data: todayApts } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', org.id)
      .eq('entity_type', 'appointment')
      .eq('metadata->>appointment_date', today);

    console.log(`   Found ${todayApts?.length || 0} appointments for today`);

  } catch (error) {
    console.error('Error checking salon data:', error);
  }
}

// Get subdomain from command line
const subdomain = process.argv[2] || 'greentrends';
checkSalonData(subdomain);