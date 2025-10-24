#!/usr/bin/env node
/**
 * Find a valid actor-organization combination for testing
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function findValidActor() {
  console.log('🔍 Searching for valid actor in organization...\n');
  console.log(`Organization ID: ${TEST_ORG_ID}\n`);

  // Query for members of this organization
  const { data: members, error } = await supabase
    .from('core_relationships')
    .select('from_entity_id, relationship_type')
    .eq('organization_id', TEST_ORG_ID)
    .eq('relationship_type', 'MEMBER_OF')
    .eq('to_entity_id', TEST_ORG_ID)
    .limit(10);

  if (error) {
    console.error('❌ Query failed:', error.message);
    return;
  }

  if (!members || members.length === 0) {
    console.log('⚠️  No members found in this organization');
    console.log('\nOptions:');
    console.log('1. Use a different organization ID');
    console.log('2. Onboard a user to this organization');
    return;
  }

  console.log(`✅ Found ${members.length} member(s):\n`);

  for (const member of members) {
    console.log(`  Actor ID: ${member.from_entity_id}`);
  }

  console.log('\n📝 Update your test script with one of these actor IDs:');
  console.log(`\nconst TEST_ACTOR_ID = '${members[0].from_entity_id}';`);
}

findValidActor().catch(console.error);
