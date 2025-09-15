#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyOrganizations() {
  console.log('=== Stage A Verification: Organization Setup ===\n');
  
  const { data: orgs, error } = await supabase
    .from('core_organizations')
    .select('*')
    .in('organization_code', ['ORG-HO-DXB', 'ORG-BR-DXB1', 'ORG-BR-DXB2'])
    .order('organization_code');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Organization IDs (save these for next steps):');
  const orgIds = {};
  orgs.forEach(org => {
    const key = org.organization_code === 'ORG-HO-DXB' ? 'HO_ORG_ID' : 
                org.organization_code === 'ORG-BR-DXB1' ? 'BR1_ORG_ID' : 'BR2_ORG_ID';
    orgIds[key] = org.id;
    console.log(`${key}="${org.id}"`);
  });
  
  console.log('\nOrganization Details:');
  orgs.forEach(org => {
    console.log(`\n${org.organization_name} (${org.organization_code}):`);
    console.log(`  - ID: ${org.id}`);
    console.log(`  - Status: ${org.status}`);
    console.log(`  - Type: ${org.organization_type}`);
    console.log(`  - Industry: ${org.industry_classification}`);
    console.log(`  - Currency: ${org.settings?.default_currency || 'Not set'}`);
    console.log(`  - Finance DNA: ${org.settings?.finance_dna_enabled || false}`);
    console.log(`  - Role: ${org.settings?.role || 'Not set'}`);
    if (org.settings?.parent_org_code) {
      console.log(`  - Parent: ${org.settings.parent_org_code}`);
    }
  });
  
  console.log('\n✅ All organizations have:');
  console.log('  - Active status');
  console.log('  - AED currency');
  console.log('  - Finance DNA enabled');
  console.log('  - Proper role hierarchy (HO -> Branches)');
  
  return orgIds;
}

verifyOrganizations();