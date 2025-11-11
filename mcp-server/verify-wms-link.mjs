#!/usr/bin/env node
/**
 * Verify WMS app link to organization
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const testData = {
  organization_id: "1fbab8d2-583c-44d2-8671-6d187c1ee755",
  app_code: "WMS"
};

async function verifyWMSLink() {
  console.log('🔍 Verifying WMS App Link...');
  console.log('🏢 Organization ID:', testData.organization_id);
  console.log('📱 App Code:', testData.app_code);
  console.log('');

  try {
    // Check if core_org_apps table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'core_org_apps');

    if (tableError || !tables || tables.length === 0) {
      console.log('⚠️ core_org_apps table does not exist');
      console.log('💡 The app link might be stored in a different table');
      console.log('');

      // Try to find org-app relationships in core_relationships
      console.log('🔍 Searching in core_relationships...');
      const { data: rels, error: relError } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('from_entity_id', testData.organization_id)
        .eq('relationship_type', 'HAS_APP');

      if (!relError && rels && rels.length > 0) {
        console.log(`✅ Found ${rels.length} app relationships:`);
        rels.forEach((rel, index) => {
          console.log(`   ${index + 1}. Relationship ID: ${rel.id}`);
          console.log(`      To Entity: ${rel.to_entity_id}`);
          console.log(`      Created: ${new Date(rel.created_at).toLocaleString()}`);
          console.log(`      Data:`, rel.relationship_data);
        });
      } else {
        console.log('⚠️ No HAS_APP relationships found');
      }

      return;
    }

    console.log('✅ core_org_apps table exists');
    console.log('');

    // Query the link
    const { data: links, error: linkError } = await supabase
      .from('core_org_apps')
      .select('*')
      .eq('organization_id', testData.organization_id)
      .eq('app_code', testData.app_code);

    if (linkError) {
      console.log('❌ Query failed:', linkError.message);
      return;
    }

    if (!links || links.length === 0) {
      console.log('⚠️ No link found');
      return;
    }

    console.log('✅ WMS App Link Found!');
    console.log('');
    console.log('📝 Link Details:');
    const link = links[0];
    console.log('   ID:', link.id);
    console.log('   Organization ID:', link.organization_id);
    console.log('   App Code:', link.app_code);
    console.log('   Is Active:', link.is_active);
    console.log('   Installed At:', new Date(link.installed_at).toLocaleString());
    console.log('   Created By:', link.created_by);
    console.log('   Updated At:', new Date(link.updated_at).toLocaleString());
    console.log('');
    console.log('   📋 Subscription:');
    if (link.subscription) {
      console.log('      Plan:', link.subscription.plan);
      console.log('      Status:', link.subscription.status);
      console.log('      Price:', `$${link.subscription.price}/${link.subscription.billing_cycle}`);
      if (link.subscription.limits) {
        console.log('      Limits:');
        Object.entries(link.subscription.limits).forEach(([key, value]) => {
          console.log(`         ${key}: ${value}`);
        });
      }
    }
    console.log('');
    console.log('   ⚙️ Configuration:');
    if (link.config) {
      console.log('      Theme:', link.config.theme);
      console.log('      Features Enabled:', Object.keys(link.config.features || {}).length);
      console.log('      Service Types:', link.config.service_types?.length || 0);
    }

    console.log('');
    console.log('✅ Verification Complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyWMSLink();
