#!/usr/bin/env node
/**
 * Verify if HERA Salon Demo exists as entity in core_entities
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const orgId = 'de5f248d-7747-44f3-9d11-a279f3158fa5'; // HERA Salon Demo

console.log('🔍 Checking organization in core_entities...');
console.log('📋 Organization ID:', orgId);
console.log('');

try {
  // Check if organization exists in core_entities with this exact ID
  const { data: orgEntity, error: entityError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', orgId)
    .maybeSingle();

  if (entityError) {
    console.log('   ❌ Error checking core_entities:', entityError);
  } else if (!orgEntity) {
    console.log('   ❌ Organization NOT FOUND in core_entities with id:', orgId);
    console.log('');
    console.log('   🔍 Searching for organization entity by organization_id...');
    
    // Search by organization_id instead
    const { data: orgEntities, error: searchError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'ORGANIZATION');
    
    if (searchError) {
      console.log('   ❌ Search error:', searchError);
    } else if (orgEntities && orgEntities.length > 0) {
      console.log('   ✅ Found ORGANIZATION entities with organization_id:', orgId);
      orgEntities.forEach(e => {
        console.log('   Entity ID:', e.id);
        console.log('   Entity Type:', e.entity_type);
        console.log('   Entity Name:', e.entity_name);
        console.log('   Organization ID:', e.organization_id);
        console.log('');
      });
    } else {
      console.log('   ❌ No ORGANIZATION entity found with organization_id:', orgId);
    }
  } else {
    console.log('   ✅ Organization EXISTS in core_entities');
    console.log('   Entity ID:', orgEntity.id);
    console.log('   Entity Type:', orgEntity.entity_type);
    console.log('   Entity Name:', orgEntity.entity_name);
    console.log('   Organization ID:', orgEntity.organization_id);
    console.log('   Smart Code:', orgEntity.smart_code);
  }

} catch (error) {
  console.error('💥 Unexpected error:', error);
}
