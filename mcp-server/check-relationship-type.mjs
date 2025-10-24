#!/usr/bin/env node
/**
 * Check the relationship type created by hera_onboard_user_v1
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SALON_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

async function checkRelationshipType() {
  console.log('🔍 Checking relationship types for salon users...\n');

  const userIds = [
    { name: 'Owner', id: '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a' },
    { name: 'Receptionist 1', id: '4578ce6d-db51-4838-9dc9-faca4cbe30bb' },
    { name: 'Receptionist 2', id: 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7' }
  ];

  for (const user of userIds) {
    console.log(`👤 ${user.name} (${user.id}):`);

    // Check relationships in core_relationships table
    const { data, error } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', user.id)
      .eq('to_entity_id', SALON_ORG_ID);

    if (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    } else if (data && data.length > 0) {
      data.forEach(rel => {
        console.log(`   ✅ Relationship found:`);
        console.log(`      ID: ${rel.id}`);
        console.log(`      Type: ${rel.relationship_type}`);
        console.log(`      From: ${rel.from_entity_id}`);
        console.log(`      To: ${rel.to_entity_id}`);
        console.log(`      Organization ID: ${rel.organization_id}`);
        console.log(`      Metadata: ${JSON.stringify(rel.metadata, null, 10)}`);
        console.log(`      Created: ${rel.created_at}`);
      });
    } else {
      console.log(`   ⚠️  No relationships found`);
    }
    console.log('');
  }

  // Also check what relationship types exist in the system
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('All relationship types in system:\n');

  const { data: allTypes, error: typesError } = await supabase
    .from('core_relationships')
    .select('relationship_type')
    .limit(100);

  if (typesError) {
    console.log('❌ Error fetching types:', typesError.message);
  } else {
    const uniqueTypes = [...new Set(allTypes.map(r => r.relationship_type))];
    uniqueTypes.forEach(type => {
      console.log(`   - ${type}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

checkRelationshipType().catch(console.error);
