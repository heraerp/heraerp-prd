#!/usr/bin/env node
/**
 * Test organization UPDATE operation
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const orgId = 'de5f248d-7747-44f3-9d11-a279f3158fa5'; // HERA Salon Demo (organization_id)
const orgEntityId = '7f1d5200-2106-4f94-8095-8a04bc114623'; // Organization entity ID in core_entities
const actorUserId = '1ac56047-78c9-4c2c-93db-84dcf307ab91'; // USER entity ID (not auth user ID)

console.log('🔍 Testing organization UPDATE operation...');
console.log('📋 Organization ID:', orgId);
console.log('👤 Actor User ID:', actorUserId);
console.log('');

try {
  // Test UPDATE with entity_type: 'ORGANIZATION'
  console.log('1️⃣ Testing UPDATE with entity_type: ORGANIZATION...');

  const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'UPDATE',
    p_actor_user_id: actorUserId,
    p_organization_id: orgId,
    p_entity: {
      entity_id: orgEntityId, // ✅ Use entity ID, not organization ID
      entity_type: 'ORGANIZATION'
    },
    p_dynamic: {
      organization_name: {
        type: 'text',
        value: 'HERA Salon Demo (Updated)',
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.NAME.v1'
      },
      phone: {
        type: 'text',
        value: '+971 50 123 4567',
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.PHONE.v1'
      }
    },
    p_relationships: [],
    p_options: {
      include_dynamic: true
    }
  });

  if (error) {
    console.log('   ❌ UPDATE Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('   ✅ UPDATE Success!');
    console.log('   Response:', JSON.stringify(data, null, 2));
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('💡 DIAGNOSIS');
  console.log('═'.repeat(60));

  if (error) {
    console.log('❌ UPDATE FAILED because organization does not exist in core_entities');
    console.log('');
    console.log('📋 The issue:');
    console.log('   - Organization exists in core_organizations table');
    console.log('   - Organization does NOT exist in core_entities table');
    console.log('   - RPC hera_entities_crud_v1 requires entity in core_entities');
    console.log('   - UPDATE action cannot find entity to update');
    console.log('');
    console.log('🔧 SOLUTION OPTIONS:');
    console.log('');
    console.log('Option 1: CREATE organization entity first');
    console.log('   - Run CREATE action with entity_type: ORGANIZATION');
    console.log('   - This creates entry in core_entities');
    console.log('   - Then UPDATE will work');
    console.log('');
    console.log('Option 2: Update core_organizations directly');
    console.log('   - Use Supabase update on core_organizations table');
    console.log('   - Store settings in organization settings JSONB column');
    console.log('   - Don\'t use hera_entities_crud_v1 for organizations');
    console.log('');
    console.log('Option 3: Use ORG entity_type instead of ORGANIZATION');
    console.log('   - Some orgs in system use entity_type: ORG');
    console.log('   - But this is inconsistent with standard');
  }

} catch (error) {
  console.error('💥 Unexpected error:', error);
}
