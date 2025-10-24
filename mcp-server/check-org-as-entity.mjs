#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HAIR_TALKZ_ORG = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

console.log('🔍 Checking if organizations exist as entities...\n');

// Check if Hair Talkz org exists in core_entities
const { data: orgEntity, error } = await supabase
  .from('core_entities')
  .select('*')
  .eq('id', HAIR_TALKZ_ORG)
  .single();

if (error) {
  console.log('❌ Error:', error.message);
} else if (orgEntity) {
  console.log('✅ Organization exists in core_entities:');
  console.log('   ID:', orgEntity.id);
  console.log('   Type:', orgEntity.entity_type);
  console.log('   Name:', orgEntity.entity_name);
  console.log('   Smart Code:', orgEntity.smart_code);
} else {
  console.log('⚠️  Organization NOT in core_entities');
}

// Check existing relationships pointing to organizations
console.log('\n🔍 Checking existing MEMBER_OF relationships...\n');

const { data: rels } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('relationship_type', 'MEMBER_OF')
  .eq('to_entity_id', HAIR_TALKZ_ORG)
  .limit(1);

if (rels && rels.length > 0) {
  console.log('✅ Found relationship:');
  console.log('   from_entity_id:', rels[0].from_entity_id);
  console.log('   to_entity_id:', rels[0].to_entity_id);
  console.log('   organization_id:', rels[0].organization_id);
}
