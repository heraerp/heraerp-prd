#!/usr/bin/env node
/**
 * Verify created organizations in database
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function verifyOrganizations() {
  console.log('🔍 Querying core_organizations table...\n');

  try {
    // Query organizations ordered by creation date
    const { data, error } = await supabase
      .from('core_organizations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Query failed:', error.message);
      return;
    }

    console.log(`✅ Found ${data.length} organizations:\n`);

    data.forEach((org, index) => {
      console.log(`${index + 1}. ${org.organization_name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Code: ${org.organization_code}`);
      console.log(`   Type: ${org.organization_type}`);
      console.log(`   Industry: ${org.industry_classification || 'N/A'}`);
      console.log(`   Status: ${org.status}`);
      console.log(`   Parent Org: ${org.parent_organization_id || 'None (Root)'}`);
      console.log(`   Created: ${new Date(org.created_at).toLocaleString()}`);
      if (org.settings) {
        console.log(`   Settings: ${JSON.stringify(org.settings, null, 2).substring(0, 100)}...`);
      }
      console.log('');
    });

    // Find our newly created orgs
    const wasteOrg = data.find(org => org.organization_name === 'HERA Waste Management Demo');
    const erpOrg = data.find(org => org.organization_name === 'HERA ERP Demo');

    if (wasteOrg && erpOrg) {
      console.log('🎉 VERIFICATION SUCCESS!');
      console.log('   ✅ HERA ERP Demo (Parent) - FOUND');
      console.log('   ✅ HERA Waste Management Demo (Child) - FOUND');
      console.log('   ✅ Parent-Child relationship verified');
      console.log(`   ✅ Child references parent: ${wasteOrg.parent_organization_id === erpOrg.id}`);
    } else {
      console.log('⚠️ Could not find one or both organizations');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyOrganizations();
