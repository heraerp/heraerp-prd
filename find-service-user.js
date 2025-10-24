#!/usr/bin/env node

// Find SERVICE_USER_ENTITY_ID for HERA v2.2
// This script finds the service user entity that should be used for SERVICE_USER_ENTITY_ID

const { createClient } = require('@supabase/supabase-js');

// Use environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.log('💡 Set it from your .env file:');
  console.log('   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findServiceUser() {
  console.log('🔍 Searching for service user entities...');

  // Search for entities that could be the service user
  const { data: serviceEntities, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, organization_id, smart_code, status')
    .eq('entity_type', 'user')
    .or('entity_name.ilike.%service%,entity_name.ilike.%system%,entity_name.ilike.%hera%,entity_name.ilike.%admin%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Database query failed:', error);
    return;
  }

  if (!serviceEntities || serviceEntities.length === 0) {
    console.log('⚠️  No service user entities found');
    console.log('💡 You may need to create a service user entity first');
    return;
  }

  console.log(`✅ Found ${serviceEntities.length} potential service users:`);
  console.log('');

  serviceEntities.forEach((entity, index) => {
    console.log(`${index + 1}. ${entity.entity_name}`);
    console.log(`   ID: ${entity.id}`);
    console.log(`   Organization: ${entity.organization_id}`);
    console.log(`   Status: ${entity.status}`);
    console.log(`   Smart Code: ${entity.smart_code || 'None'}`);
    console.log('');
  });

  // Recommend the most likely candidate
  const recommended = serviceEntities.find(e => 
    e.entity_name.toLowerCase().includes('service') ||
    e.entity_name.toLowerCase().includes('system') ||
    e.entity_name.toLowerCase().includes('hera')
  );

  if (recommended) {
    console.log('🎯 Recommended SERVICE_USER_ENTITY_ID:');
    console.log(`   ${recommended.id}`);
    console.log('');
    console.log('🔧 Set this in Railway:');
    console.log(`   railway variables --set "SERVICE_USER_ENTITY_ID=${recommended.id}"`);
  }
}

findServiceUser().catch(console.error);