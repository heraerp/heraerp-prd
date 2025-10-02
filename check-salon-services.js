#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSalonServices() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('🔍 Checking for salon services in database...\n');

  // 1. Find all services
  const { data: services, error: servicesError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'service')
    .limit(20);

  if (servicesError) {
    console.error('❌ Error finding services:', servicesError);
  } else {
    console.log(`✅ Found ${services.length} services total:\n`);
    services.forEach((s, i) => {
      console.log(`${i + 1}. ${s.entity_name}`);
      console.log(`   Organization: ${s.organization_id}`);
      console.log(`   Code: ${s.entity_code || 'no code'}`);
      console.log(`   Smart Code: ${s.smart_code || 'no smart code'}\n`);
    });
  }

  // 2. Check Hair Talkz organizations
  const { data: hairOrgs, error: hairError } = await supabase
    .from('core_organizations')
    .select('*')
    .or('organization_name.ilike.%hair%,organization_name.ilike.%salon%');

  if (!hairError && hairOrgs.length > 0) {
    console.log('🏢 Hair/Salon organizations found:');
    hairOrgs.forEach(o => {
      console.log(`\n- ${o.organization_name}`);
      console.log(`  ID: ${o.id}`);
      console.log(`  Code: ${o.organization_code}`);
    });

    // For each org, check for services
    for (const org of hairOrgs) {
      const { data: orgServices, error } = await supabase
        .from('core_entities')
        .select('entity_name, entity_type')
        .eq('organization_id', org.id)
        .eq('entity_type', 'service')
        .limit(5);

      if (!error && orgServices && orgServices.length > 0) {
        console.log(`\n  Services in ${org.organization_name}:`);
        orgServices.forEach(s => console.log(`    - ${s.entity_name}`));
      }
    }
  }

  // 3. Check different entity types that might be services
  const { data: entityTypes, error: typesError } = await supabase
    .from('core_entities')
    .select('entity_type')
    .or('entity_type.ilike.%serv%,entity_type.ilike.%salon%')
    .limit(100);

  if (!typesError && entityTypes.length > 0) {
    const uniqueTypes = [...new Set(entityTypes.map(e => e.entity_type))];
    console.log('\n📋 Entity types related to services:');
    uniqueTypes.forEach(t => console.log(`  - ${t}`));
  }
}

checkSalonServices();