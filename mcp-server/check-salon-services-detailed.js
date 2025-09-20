#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function checkSalonServicesDetailed() {
  console.log('🔍 Detailed Check of Salon Services\n');

  try {
    // 1. Check services with correct organization_id
    console.log('1️⃣ Services with entity_type="service":');
    const { data: services, error: serviceError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, organization_id, smart_code, metadata')
      .eq('entity_type', 'service')
      .order('entity_name');

    if (serviceError) {
      console.error('Error querying services:', serviceError);
    } else {
      console.log(`Total services found: ${services?.length || 0}\n`);
      
      // Group by organization
      const byOrg = {};
      services?.forEach(s => {
        if (!byOrg[s.organization_id]) byOrg[s.organization_id] = [];
        byOrg[s.organization_id].push(s);
      });

      for (const [orgId, orgServices] of Object.entries(byOrg)) {
        console.log(`\nOrganization: ${orgId}`);
        console.log(`  ${orgId === SALON_ORG_ID ? '✅ This is the salon org!' : '❌ Different org'}`);
        console.log(`  Services (${orgServices.length}):`);
        orgServices.forEach(s => {
          console.log(`    - ${s.entity_name} (${s.entity_code})`);
          if (s.metadata?.price) console.log(`      Price: ${s.metadata.price}`);
        });
      }
    }

    // 2. Check if there might be a UI filter issue
    console.log('\n2️⃣ Simulating UI query (with organization_id filter):');
    const { data: uiServices, error: uiError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'service');

    if (uiError) {
      console.error('Error in UI query:', uiError);
    } else {
      console.log(`UI would see ${uiServices?.length || 0} services for salon org`);
      if (uiServices?.length > 0) {
        console.log('These services should appear in the POS:');
        uiServices.forEach(s => console.log(`  - ${s.entity_name}`));
      }
    }

    // 3. Check GL accounts that might appear instead
    console.log('\n3️⃣ Checking if GL accounts might be showing instead:');
    const { data: glAccounts, error: glError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, organization_id')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'gl_account')
      .limit(10);

    if (glError) {
      console.error('Error querying GL accounts:', glError);
    } else {
      console.log(`Found ${glAccounts?.length || 0} GL accounts in salon org`);
      if (glAccounts?.length > 0) {
        console.log('GL Accounts in salon org (these might be showing by mistake):');
        glAccounts.forEach(g => console.log(`  - ${g.entity_name} (${g.entity_code})`));
      }
    }

  } catch (error) {
    console.error('Error during check:', error);
  }
}

checkSalonServicesDetailed();