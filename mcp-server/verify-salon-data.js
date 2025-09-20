#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function verifyData() {
  console.log('🔍 Verifying Hair Talkz Salon demo data...\n');

  // Check customers
  const { data: customers, error: custError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'customer');

  console.log(`👥 Customers: ${customers?.length || 0}`);
  if (customers?.length > 0) {
    customers.forEach(c => {
      console.log(`   - ${c.entity_name} (${c.entity_code})`);
    });
  }

  // Check stylists
  const { data: stylists, error: empError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'employee');

  console.log(`\n💇‍♀️ Stylists: ${stylists?.length || 0}`);
  if (stylists?.length > 0) {
    stylists.forEach(s => {
      console.log(`   - ${s.entity_name} (${s.metadata?.role || 'Stylist'})`);
    });
  }

  // Check services
  const { data: services, error: svcError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'service');

  console.log(`\n✂️ Services: ${services?.length || 0}`);
  if (services?.length > 0) {
    services.forEach(s => {
      console.log(`   - ${s.entity_name} (AED ${s.metadata?.price_aed || 0})`);
    });
  }

  console.log('\n✅ Verification complete!');
}

verifyData().catch(console.error);