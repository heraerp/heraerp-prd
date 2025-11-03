#!/usr/bin/env node
/**
 * Verify linked apps for HERA ERP DEMO organization
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const demoOrgId = '9a9cc652-5c64-4917-a990-3d0fb6398543';

async function verifyLinkedApps() {
  console.log('🔍 Verifying linked apps for HERA ERP DEMO...\n');

  // Query relationships to see linked apps
  const { data: relationships, error: relError } = await supabase
    .from('core_relationships')
    .select(`
      id,
      relationship_type,
      from_entity_id,
      to_entity_id,
      is_active,
      created_at
    `)
    .eq('from_entity_id', demoOrgId)
    .eq('relationship_type', 'ORG_HAS_APP');

  if (relError) {
    console.log('❌ Error fetching relationships:', relError);
    return;
  }

  console.log(`✅ Found ${relationships.length} linked apps\n`);

  // Get app details for each linked app
  for (const rel of relationships) {
    const { data: app, error: appError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, smart_code')
      .eq('id', rel.to_entity_id)
      .single();

    if (!appError && app) {
      console.log(`📱 ${app.entity_code} - ${app.entity_name}`);
      console.log(`   App ID: ${app.id}`);
      console.log(`   Relationship ID: ${rel.id}`);
      console.log(`   Smart Code: ${app.smart_code}`);
      console.log(`   Linked At: ${new Date(rel.created_at).toLocaleString()}`);
      console.log(`   Active: ${rel.is_active ? '✅' : '❌'}`);
      console.log('');
    }
  }

  // Summary
  console.log('📊 Summary:');
  console.log(`   Organization: HERA ERP DEMO (${demoOrgId})`);
  console.log(`   Total Apps Linked: ${relationships.length}`);
  console.log(`   Active Apps: ${relationships.filter(r => r.is_active).length}`);
}

verifyLinkedApps();
