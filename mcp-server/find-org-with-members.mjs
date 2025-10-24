#!/usr/bin/env node
/**
 * Find organizations that have members for testing
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findOrgsWithMembers() {
  console.log('🔍 Searching for organizations with members...\n');

  // Get all organizations
  const { data: orgs, error: orgError } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .limit(20);

  if (orgError) {
    console.error('❌ Query failed:', orgError.message);
    return;
  }

  console.log(`Found ${orgs.length} organizations, checking for members...\n`);

  for (const org of orgs) {
    const { data: members, error } = await supabase
      .from('core_relationships')
      .select('from_entity_id')
      .eq('organization_id', org.id)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('to_entity_id', org.id)
      .limit(5);

    if (members && members.length > 0) {
      console.log(`✅ ${org.organization_name}`);
      console.log(`   Org ID: ${org.id}`);
      console.log(`   Members: ${members.length}`);
      console.log(`   First Actor ID: ${members[0].from_entity_id}\n`);
    }
  }

  console.log('\n📝 Update your .env and test script:');
  console.log('\nDEFAULT_ORGANIZATION_ID=<org_id_from_above>');
  console.log('const TEST_ACTOR_ID = \'<actor_id_from_above>\';');
}

findOrgsWithMembers().catch(console.error);
