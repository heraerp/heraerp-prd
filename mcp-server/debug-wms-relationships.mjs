#!/usr/bin/env node
/**
 * Debug WMS User Relationships - Find the Multiple Rows Issue
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

async function debugWMSRelationships() {
  console.log('🔍 Debugging WMS User Relationships...\n');
  console.log('═'.repeat(60));

  const email = 'wms@heraerp.com';
  const userEntityId = '5febe281-3c9a-4774-9b18-ffded0be2085'; // From previous output

  try {
    console.log('\n📋 Step 1: Check MEMBER_OF relationships');
    console.log('─'.repeat(60));

    const { data: memberOf, error: memberError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userEntityId)
      .eq('relationship_type', 'MEMBER_OF');

    if (memberError) {
      console.error('❌ Error:', memberError);
    } else {
      console.log(`Found ${memberOf.length} MEMBER_OF relationships:\n`);
      memberOf.forEach((rel, i) => {
        console.log(`${i + 1}. Relationship ID: ${rel.id}`);
        console.log(`   From (User): ${rel.from_entity_id}`);
        console.log(`   To (Org): ${rel.to_entity_id}`);
        console.log(`   Organization ID: ${rel.organization_id}`);
        console.log(`   Is Active: ${rel.is_active ? '✅' : '❌'}`);
        console.log(`   Created: ${new Date(rel.created_at).toLocaleString()}`);
        console.log(`   Updated: ${new Date(rel.updated_at).toLocaleString()}`);
        console.log(`   Effective Date: ${rel.effective_date || 'N/A'}`);
        console.log(`   Expiration Date: ${rel.expiration_date || 'N/A'}`);
        if (rel.relationship_data) {
          console.log(`   Data:`, JSON.stringify(rel.relationship_data, null, 2));
        }
        console.log();
      });
    }

    console.log('\n📋 Step 2: Check HAS_ROLE relationships');
    console.log('─'.repeat(60));

    const { data: hasRole, error: roleError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userEntityId)
      .eq('relationship_type', 'HAS_ROLE');

    if (roleError) {
      console.error('❌ Error:', roleError);
    } else {
      console.log(`Found ${hasRole.length} HAS_ROLE relationships:\n`);
      hasRole.forEach((rel, i) => {
        console.log(`${i + 1}. Relationship ID: ${rel.id}`);
        console.log(`   From (User): ${rel.from_entity_id}`);
        console.log(`   To (Role): ${rel.to_entity_id}`);
        console.log(`   Organization ID: ${rel.organization_id}`);
        console.log(`   Is Active: ${rel.is_active ? '✅' : '❌'}`);
        console.log(`   Created: ${new Date(rel.created_at).toLocaleString()}`);
        console.log(`   Updated: ${new Date(rel.updated_at).toLocaleString()}`);
        console.log(`   Effective Date: ${rel.effective_date || 'N/A'}`);
        console.log(`   Expiration Date: ${rel.expiration_date || 'N/A'}`);
        if (rel.relationship_data) {
          console.log(`   Data:`, JSON.stringify(rel.relationship_data, null, 2));
        }
        console.log();
      });
    }

    console.log('\n📋 Step 3: Check organization details');
    console.log('─'.repeat(60));

    // Get unique organization IDs from MEMBER_OF
    const orgIds = [...new Set(memberOf.map(r => r.organization_id))];
    console.log(`Unique organizations from MEMBER_OF: ${orgIds.length}\n`);

    for (const orgId of orgIds) {
      const { data: org, error: orgError } = await supabase
        .from('core_organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (orgError) {
        console.error(`❌ Error fetching org ${orgId}:`, orgError.message);
      } else {
        console.log(`Organization: ${org.organization_name} (${org.organization_code})`);
        console.log(`   ID: ${org.id}`);
        console.log(`   Status: ${org.status}`);
        console.log(`   Type: ${org.organization_type || 'N/A'}`);
        if (org.settings) {
          console.log(`   Settings:`, JSON.stringify(org.settings, null, 2));
        }
        console.log();
      }
    }

    console.log('\n📋 Step 4: Check ORG_HAS_APP relationships for these orgs');
    console.log('─'.repeat(60));

    for (const orgId of orgIds) {
      const { data: apps, error: appError } = await supabase
        .from('core_relationships')
        .select('*, core_entities!core_relationships_to_entity_id_fkey(*)')
        .eq('organization_id', orgId)
        .eq('relationship_type', 'ORG_HAS_APP');

      if (appError) {
        console.error(`❌ Error fetching apps for org ${orgId}:`, appError.message);
      } else {
        console.log(`Apps for organization ${orgId}: ${apps.length}`);
        apps.forEach((app, i) => {
          console.log(`   ${i + 1}. App: ${app.core_entities?.entity_name} (${app.core_entities?.entity_code})`);
          console.log(`      Relationship ID: ${app.id}`);
          console.log(`      Is Active: ${app.is_active ? '✅' : '❌'}`);
          if (app.relationship_data) {
            console.log(`      Data:`, JSON.stringify(app.relationship_data, null, 2));
          }
        });
        console.log();
      }
    }

    console.log('\n📋 Step 5: Identify the Multiple Rows Issue');
    console.log('─'.repeat(60));

    // Check for duplicate MEMBER_OF relationships
    const memberOfByOrg = {};
    memberOf.forEach(rel => {
      const orgId = rel.organization_id;
      if (!memberOfByOrg[orgId]) {
        memberOfByOrg[orgId] = [];
      }
      memberOfByOrg[orgId].push(rel);
    });

    console.log('\nMEMBER_OF relationships grouped by organization:\n');
    Object.entries(memberOfByOrg).forEach(([orgId, rels]) => {
      console.log(`Organization ${orgId}: ${rels.length} MEMBER_OF relationship(s)`);
      if (rels.length > 1) {
        console.log('   ⚠️ DUPLICATE DETECTED! This could cause the subquery error!');
        rels.forEach((rel, i) => {
          console.log(`   ${i + 1}. ID: ${rel.id}, Created: ${new Date(rel.created_at).toLocaleString()}, Active: ${rel.is_active ? '✅' : '❌'}`);
        });
      }
    });

    // Check for duplicate HAS_ROLE relationships
    const hasRoleByOrg = {};
    hasRole.forEach(rel => {
      const orgId = rel.organization_id;
      if (!hasRoleByOrg[orgId]) {
        hasRoleByOrg[orgId] = [];
      }
      hasRoleByOrg[orgId].push(rel);
    });

    console.log('\nHAS_ROLE relationships grouped by organization:\n');
    Object.entries(hasRoleByOrg).forEach(([orgId, rels]) => {
      console.log(`Organization ${orgId}: ${rels.length} HAS_ROLE relationship(s)`);
      if (rels.length > 1) {
        console.log('   ℹ️ Multiple roles (this is normal)');
        rels.forEach((rel, i) => {
          const roleCode = rel.relationship_data?.role_code || 'N/A';
          console.log(`   ${i + 1}. ID: ${rel.id}, Role: ${roleCode}, Created: ${new Date(rel.created_at).toLocaleString()}, Active: ${rel.is_active ? '✅' : '❌'}`);
        });
      }
    });

    console.log('\n═'.repeat(60));
    console.log('🎯 DIAGNOSIS');
    console.log('═'.repeat(60));

    // Check for issues
    const duplicateMemberOf = Object.values(memberOfByOrg).some(rels => rels.length > 1);

    if (duplicateMemberOf) {
      console.log('\n❌ ISSUE FOUND: Duplicate MEMBER_OF relationships!');
      console.log('   The user has multiple MEMBER_OF relationships to the same organization.');
      console.log('   This causes the "more than one row returned by a subquery" error.');
      console.log('\n🔧 SOLUTION:');
      console.log('   1. Deactivate duplicate MEMBER_OF relationships (keep only one per org)');
      console.log('   2. Or add DISTINCT ON clause to the RPC function query');
    } else {
      console.log('\n✅ No duplicate MEMBER_OF relationships found');
      console.log('   The issue might be in the ORG_HAS_APP relationships or another subquery.');
    }

    // Check ORG_HAS_APP duplicates
    console.log('\n📋 Checking for duplicate ORG_HAS_APP relationships...');
    for (const orgId of orgIds) {
      const { data: apps, error: appError } = await supabase
        .from('core_relationships')
        .select('to_entity_id')
        .eq('organization_id', orgId)
        .eq('relationship_type', 'ORG_HAS_APP');

      if (!appError) {
        const appCounts = {};
        apps.forEach(app => {
          appCounts[app.to_entity_id] = (appCounts[app.to_entity_id] || 0) + 1;
        });

        const duplicates = Object.entries(appCounts).filter(([_, count]) => count > 1);
        if (duplicates.length > 0) {
          console.log(`\n⚠️ Org ${orgId} has duplicate ORG_HAS_APP relationships:`);
          duplicates.forEach(([appId, count]) => {
            console.log(`   App ${appId}: ${count} relationships`);
          });
        }
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

debugWMSRelationships();
