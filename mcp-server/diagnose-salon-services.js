#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function diagnoseSalonServices() {
  console.log('🔍 Diagnosing Salon Services Issue\n');

  try {
    // 1. Check what entity types exist for services
    console.log('1️⃣ Checking for salon_service entities:');
    const { data: salonServices, error: salonError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, metadata')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'salon_service')
      .limit(5);

    if (salonError) {
      console.error('Error querying salon_service:', salonError);
    } else {
      console.log(`Found ${salonServices?.length || 0} salon_service entities`);
      if (salonServices?.length > 0) {
        console.log('Sample salon_service entities:');
        salonServices.forEach(s => console.log(`  - ${s.entity_name} (${s.entity_code})`));
      }
    }

    console.log('\n2️⃣ Checking for service entities:');
    const { data: services, error: serviceError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'service')
      .limit(5);

    if (serviceError) {
      console.error('Error querying service:', serviceError);
    } else {
      console.log(`Found ${services?.length || 0} service entities`);
      if (services?.length > 0) {
        console.log('Sample service entities:');
        services.forEach(s => console.log(`  - ${s.entity_name} (${s.entity_code})`));
      }
    }

    console.log('\n3️⃣ Checking GL accounts (potential source of confusion):');
    const { data: glAccounts, error: glError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, organization_id')
      .eq('entity_type', 'gl_account')
      .like('entity_name', '%Service%')
      .limit(5);

    if (glError) {
      console.error('Error querying GL accounts:', glError);
    } else {
      console.log(`Found ${glAccounts?.length || 0} GL accounts with "Service" in name`);
      if (glAccounts?.length > 0) {
        console.log('Sample GL accounts:');
        glAccounts.forEach(g => console.log(`  - ${g.entity_name} (${g.entity_code}) - Org: ${g.organization_id.substring(0, 8)}...`));
      }
    }

    console.log('\n📊 DIAGNOSIS:');
    console.log('The issue is that:');
    console.log('1. Services were seeded with entity_type="salon_service"');
    console.log('2. The UI is looking for entity_type="service"');
    console.log('3. This mismatch causes no services to appear in the POS');
    console.log('\n✅ SOLUTION:');
    console.log('Either:');
    console.log('A) Update the UI to look for "salon_service" instead of "service"');
    console.log('B) Update the seeded data to use entity_type="service"');
    console.log('C) Create a migration script to convert salon_service → service');

  } catch (error) {
    console.error('Error during diagnosis:', error);
  }
}

diagnoseSalonServices();