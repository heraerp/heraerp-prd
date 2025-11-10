#!/usr/bin/env node
/**
 * Analyze WMS Organization IDs - Check if correct entity IDs are used
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeWMSOrgIds() {
  console.log('🔍 Analyzing WMS Organization IDs...\n');
  console.log('═'.repeat(80));

  const userEntityId = '5febe281-3c9a-4774-9b18-ffded0be2085';
  const wmsOrgId = '1fbab8d2-583c-44d2-8671-6d187c1ee755';

  try {
    // Get both MEMBER_OF relationships (active and inactive)
    console.log('\n📋 Step 1: Get ALL MEMBER_OF relationships (active + inactive)');
    console.log('─'.repeat(80));

    const { data: allRelationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userEntityId)
      .eq('relationship_type', 'MEMBER_OF')
      .order('created_at', { ascending: true });

    if (relError) throw relError;

    console.log(`\nFound ${allRelationships.length} MEMBER_OF relationships:\n`);

    for (const rel of allRelationships) {
      console.log(`Relationship ID: ${rel.id}`);
      console.log(`   Created: ${new Date(rel.created_at).toLocaleString()}`);
      console.log(`   Is Active: ${rel.is_active ? '✅' : '❌'}`);
      console.log(`   Expiration: ${rel.expiration_date || 'N/A'}`);
      console.log(`   From (User Entity): ${rel.from_entity_id}`);
      console.log(`   To (Target Entity): ${rel.to_entity_id}`);
      console.log(`   Organization ID: ${rel.organization_id}`);
      console.log();
    }

    // Get unique target entity IDs
    const targetEntityIds = [...new Set(allRelationships.map(r => r.to_entity_id))];
    const organizationIds = [...new Set(allRelationships.map(r => r.organization_id))];

    console.log('═'.repeat(80));
    console.log('📊 Step 2: Analyze Target Entity IDs');
    console.log('─'.repeat(80));

    console.log(`\nUnique Target Entity IDs: ${targetEntityIds.length}`);
    console.log(`Unique Organization IDs: ${organizationIds.length}\n`);

    // Check each target entity
    for (const targetId of targetEntityIds) {
      console.log(`\n🔍 Checking Target Entity: ${targetId}`);
      console.log('─'.repeat(80));

      // Check in core_entities
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', targetId)
        .single();

      if (entityError) {
        console.log(`   ❌ Not found in core_entities: ${entityError.message}`);
      } else {
        console.log(`   ✅ Found in core_entities:`);
        console.log(`      Entity ID: ${entity.id}`);
        console.log(`      Entity Type: ${entity.entity_type}`);
        console.log(`      Entity Name: ${entity.entity_name}`);
        console.log(`      Entity Code: ${entity.entity_code}`);
        console.log(`      Smart Code: ${entity.smart_code}`);
        console.log(`      Organization ID: ${entity.organization_id}`);
      }

      // Check in core_organizations
      const { data: org, error: orgError } = await supabase
        .from('core_organizations')
        .select('*')
        .eq('id', targetId)
        .single();

      if (orgError) {
        console.log(`   ❌ Not found in core_organizations: ${orgError.message}`);
      } else {
        console.log(`   ✅ Found in core_organizations:`);
        console.log(`      Organization ID: ${org.id}`);
        console.log(`      Organization Name: ${org.organization_name}`);
        console.log(`      Organization Code: ${org.organization_code}`);
        console.log(`      Organization Type: ${org.organization_type}`);
        console.log(`      Status: ${org.status}`);
      }
    }

    console.log('\n═'.repeat(80));
    console.log('📊 Step 3: Check Organization ID Field Values');
    console.log('─'.repeat(80));

    for (const orgId of organizationIds) {
      console.log(`\n🔍 Checking Organization ID: ${orgId}`);
      console.log('─'.repeat(80));

      // Check in core_organizations
      const { data: org, error: orgError } = await supabase
        .from('core_organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (orgError) {
        console.log(`   ❌ Not found in core_organizations: ${orgError.message}`);
      } else {
        console.log(`   ✅ Found in core_organizations:`);
        console.log(`      Organization ID: ${org.id}`);
        console.log(`      Organization Name: ${org.organization_name}`);
        console.log(`      Organization Code: ${org.organization_code}`);
        console.log(`      Organization Type: ${org.organization_type}`);
        console.log(`      Status: ${org.status}`);
      }
    }

    console.log('\n═'.repeat(80));
    console.log('🎯 Step 4: VALIDATION & DIAGNOSIS');
    console.log('═'.repeat(80));

    console.log('\n📋 HERA Architecture Rules:');
    console.log('   1. Organizations can exist in TWO tables:');
    console.log('      - core_organizations: Main organization records (tenant boundary)');
    console.log('      - core_entities: Organization entities (for relationships)');
    console.log('');
    console.log('   2. MEMBER_OF relationship pattern:');
    console.log('      - from_entity_id: USER entity (always in PLATFORM org)');
    console.log('      - to_entity_id: ORGANIZATION entity ID');
    console.log('      - organization_id: The tenant boundary (core_organizations.id)');
    console.log('');
    console.log('   3. Correct Pattern:');
    console.log('      - to_entity_id should match organization_id');
    console.log('      - Both should point to core_organizations.id');
    console.log('');

    console.log('🔍 Analysis of WMS User Relationships:\n');

    for (const rel of allRelationships) {
      console.log(`Relationship ${rel.id} (${rel.is_active ? 'Active' : 'Inactive'}):`);
      console.log(`   Created: ${new Date(rel.created_at).toLocaleString()}`);
      console.log(`   to_entity_id:    ${rel.to_entity_id}`);
      console.log(`   organization_id: ${rel.organization_id}`);

      if (rel.to_entity_id === rel.organization_id) {
        console.log(`   ✅ CORRECT: to_entity_id matches organization_id`);
      } else {
        console.log(`   ❌ MISMATCH: to_entity_id does NOT match organization_id`);
        console.log(`   ⚠️ This is the issue! to_entity_id should equal organization_id`);
      }

      // Check if target entity exists
      const targetExists = targetEntityIds.includes(rel.to_entity_id);
      const orgExists = organizationIds.includes(rel.organization_id);

      console.log(`   Target Entity (${rel.to_entity_id}): ${targetExists ? '✅ Exists' : '❌ Not Found'}`);
      console.log(`   Organization (${rel.organization_id}): ${orgExists ? '✅ Exists' : '❌ Not Found'}`);
      console.log();
    }

    console.log('═'.repeat(80));
    console.log('💡 CONCLUSION');
    console.log('═'.repeat(80));

    const activeRel = allRelationships.find(r => r.is_active);
    const inactiveRel = allRelationships.find(r => !r.is_active);

    if (activeRel) {
      console.log('\n✅ Active Relationship:');
      console.log(`   ID: ${activeRel.id}`);
      console.log(`   to_entity_id:    ${activeRel.to_entity_id}`);
      console.log(`   organization_id: ${activeRel.organization_id}`);

      if (activeRel.to_entity_id === activeRel.organization_id) {
        console.log('   ✅ Status: CORRECT - IDs match');
      } else {
        console.log('   ❌ Status: INCORRECT - IDs do NOT match');
        console.log('   🔧 Action needed: Update to_entity_id to match organization_id');
      }
    }

    if (inactiveRel) {
      console.log('\n❌ Deactivated Relationship:');
      console.log(`   ID: ${inactiveRel.id}`);
      console.log(`   to_entity_id:    ${inactiveRel.to_entity_id}`);
      console.log(`   organization_id: ${inactiveRel.organization_id}`);

      if (inactiveRel.to_entity_id === inactiveRel.organization_id) {
        console.log('   ✅ This one was correct!');
        console.log('   ⚠️ WARNING: We may have deactivated the correct one!');
      } else {
        console.log('   ❌ This one was incorrect');
        console.log('   ✅ Good: We deactivated the incorrect one');
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error.details) {
      console.error('📋 Details:', error.details);
    }
    if (error.hint) {
      console.error('💡 Hint:', error.hint);
    }
  }
}

analyzeWMSOrgIds();
