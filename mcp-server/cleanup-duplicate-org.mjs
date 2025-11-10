#!/usr/bin/env node
/**
 * Cleanup: Archive duplicate parent organization
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const duplicate_org_id = "89425547-2fbb-4f9e-ac59-009832dc058c";
const actor_user_id = "09b0b92a-d797-489e-bc03-5ca0a6272674";

async function cleanupDuplicate() {
  console.log('🧹 Cleaning up duplicate organization...');
  console.log('🗑️ Duplicate Org ID:', duplicate_org_id);

  try {
    // Archive the duplicate by setting status to 'archived'
    const { data, error } = await supabase
      .from('core_organizations')
      .update({
        status: 'archived',
        updated_by: actor_user_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', duplicate_org_id)
      .select();

    if (error) {
      console.log('❌ Archive failed:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Duplicate organization archived successfully!');
    console.log('📝 Archived org:', data[0]?.organization_name);

    // Verify active orgs
    const { data: activeOrgs } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_code, status')
      .eq('status', 'active')
      .ilike('organization_name', '%HERA ERP Demo%');

    console.log('\n📊 Active "HERA ERP Demo" organizations:');
    activeOrgs.forEach(org => {
      console.log(`   - ${org.organization_name} (${org.organization_code})`);
      console.log(`     ID: ${org.id}`);
      console.log(`     Status: ${org.status}`);
    });

    console.log('\n✅ Cleanup complete! Only the original HERA ERP Demo remains active.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

cleanupDuplicate();
