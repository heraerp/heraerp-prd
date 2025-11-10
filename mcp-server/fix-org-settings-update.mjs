#!/usr/bin/env node
/**
 * Diagnose and fix organization settings update issue
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const orgId = 'de5f248d-7747-44f3-9d11-a279f3158fa5'; // HERA Salon Demo (organization_id)
const actorUserId = '1ac56047-78c9-4c2c-93db-84dcf307ab91'; // USER entity ID

console.log('🔍 DIAGNOSIS: Organization Settings Update Issue');
console.log('═'.repeat(60));
console.log('');

try {
  // Step 1: Find the organization entity
  console.log('1️⃣ Finding organization entity in core_entities...');
  
  const { data: orgEntities, error: searchError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_type', 'ORGANIZATION');
  
  if (searchError || !orgEntities || orgEntities.length === 0) {
    console.log('   ❌ ERROR: Organization entity not found');
    console.log('   This means settings page cannot UPDATE because entity doesn not exist');
    process.exit(1);
  }
  
  const orgEntity = orgEntities[0];
  console.log('   ✅ Organization entity found:');
  console.log('      Entity ID:', orgEntity.id);
  console.log('      Organization ID:', orgEntity.organization_id);
  console.log('      Entity Name:', orgEntity.entity_name);
  console.log('');
  
  // Step 2: Test UPDATE with correct entity ID
  console.log('2️⃣ Testing UPDATE with correct entity ID...');
  
  const testUpdate = {
    organization_name: {
      type: 'text',
      value: 'HERA Salon Demo',
      smart_code: 'HERA.SALON.ORGANIZATION.FIELD.NAME.v1'
    },
    phone: {
      type: 'text',
      value: '+971 50 999 8888',
      smart_code: 'HERA.SALON.ORGANIZATION.FIELD.PHONE.v1'
    }
  };
  
  const { data: updateResult, error: updateError } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'UPDATE',
    p_actor_user_id: actorUserId,
    p_organization_id: orgId,
    p_entity: {
      entity_id: orgEntity.id, // ✅ Use entity ID, NOT organization ID
      entity_type: 'ORGANIZATION'
    },
    p_dynamic: testUpdate,
    p_relationships: [],
    p_options: {
      include_dynamic: true
    }
  });
  
  if (updateError) {
    console.log('   ❌ UPDATE failed:', updateError);
  } else {
    console.log('   ✅ UPDATE succeeded!');
    console.log('      Updated phone to:', '+971 50 999 8888');
  }
  
  console.log('');
  console.log('═'.repeat(60));
  console.log('💡 ROOT CAUSE & SOLUTION');
  console.log('═'.repeat(60));
  console.log('');
  console.log('🔴 PROBLEM:');
  console.log('   Settings page is using organization_id as entity_id');
  console.log('   But UPDATE requires the actual entity_id from core_entities');
  console.log('');
  console.log('   Organization ID:', orgId);
  console.log('   Entity ID:      ', orgEntity.id);
  console.log('   ❌ These are DIFFERENT!');
  console.log('');
  console.log('✅ SOLUTION:');
  console.log('   1. SecuredSalonProvider must include entity_id in organization object');
  console.log('   2. Settings page must use organization.entity_id for UPDATE');
  console.log('');
  console.log('📝 CHANGES NEEDED:');
  console.log('');
  console.log('   A) SecuredSalonProvider.tsx (loadOrganizationDetails):');
  console.log('      return {');
  console.log('        id: orgId,                    // organization_id');
  console.log('        entity_id: orgEntity.id,      // ← ADD THIS');
  console.log('        name: organization_name,');
  console.log('        ...');
  console.log('      }');
  console.log('');
  console.log('   B) settings/page.tsx (line 253):');
  console.log('      p_entity: {');
  console.log('        entity_id: organization.entity_id || organizationId, // ← USE entity_id');
  console.log('        entity_type: "ORGANIZATION"');
  console.log('      }');
  console.log('');
  
} catch (error) {
  console.error('💥 Unexpected error:', error);
}
