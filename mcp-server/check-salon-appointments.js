#!/usr/bin/env node

require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function checkAppointments() {
  console.log('🔍 Checking salon appointments...\n');

  // Check appointment entities
  const { data: appointments, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORGANIZATION_ID)
    .eq('entity_type', 'appointment')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${appointments?.length || 0} appointments:\n`);

  appointments?.forEach(apt => {
    console.log(`📅 ${apt.entity_name}`);
    console.log(`   Code: ${apt.entity_code}`);
    console.log(`   Status: ${apt.metadata?.status || 'unknown'}`);
    console.log(`   Time: ${apt.metadata?.start_time ? new Date(apt.metadata.start_time).toLocaleString() : 'not set'}`);
    console.log('');
  });

  // Check appointment transactions
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', ORGANIZATION_ID)
    .eq('transaction_type', 'appointment');

  console.log(`\nFound ${transactions?.length || 0} appointment transactions`);
}

checkAppointments();