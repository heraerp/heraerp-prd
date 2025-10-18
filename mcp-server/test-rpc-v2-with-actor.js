#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testWithActor() {
  console.log('🧪 Testing hera_entities_crud_v2 with ACTOR\n');

  const orgId = process.env.DEFAULT_ORGANIZATION_ID;

  if (!orgId) {
    console.log('⚠️  DEFAULT_ORGANIZATION_ID not set in .env');
    return;
  }

  // First, get a valid user from the organization
  console.log('Step 1: Finding a valid actor (user) in organization...\n');

  let actorUserId = null;

  try {
    const { data: users, error } = await supabase
      .from('core_users')
      .select('user_id, email, full_name')
      .eq('organization_id', orgId)
      .limit(1);

    if (error) {
      console.log('❌ Error fetching users:', error.message);
      console.log('   Trying alternative method...\n');

      // Try using auth.users() if available
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        actorUserId = authData.user.id;
        console.log('✅ Using authenticated user:', actorUserId);
      }
    } else if (users && users.length > 0) {
      actorUserId = users[0].user_id;
      console.log('✅ Found user:', users[0].email || users[0].full_name);
      console.log('   User ID:', actorUserId);
    }
  } catch (err) {
    console.log('⚠️  Could not fetch user, trying with a test UUID...');
    // Use a test UUID - the function might accept any UUID
    actorUserId = '00000000-0000-0000-0000-000000000001';
  }

  if (!actorUserId) {
    console.log('⚠️  No actor found, using test UUID');
    actorUserId = '00000000-0000-0000-0000-000000000001';
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 1: CREATE entity with actor
  console.log('Test 1: CREATE - Create a new test product with actor');
  console.log(`   Actor User ID: ${actorUserId}\n`);

  try {
    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'create',
      p_actor_user_id: actorUserId,
      p_dynamic: {
        price: 99.99,
        description: 'Test product created via hera_entities_crud_v2',
        category: 'Testing'
      },
      p_entity: {
        entity_type: 'product',
        entity_name: 'RPC V2 Test Product ' + Date.now(),
        smart_code: 'HERA.TEST.PRODUCT.ITEM.RPC.V1'
      },
      p_options: {},
      p_organization_id: orgId,
      p_relationships: []
    });

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details || 'N/A');
      console.log('   Hint:', error.hint || 'N/A');
    } else {
      console.log('✅ Success! Response:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
    console.log('   Stack:', err.stack);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: READ entities with actor
  console.log('Test 2: READ - List products with actor');
  console.log(`   Actor User ID: ${actorUserId}\n`);

  try {
    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'read',
      p_actor_user_id: actorUserId,
      p_dynamic: null,
      p_entity: {
        entity_type: 'product'
      },
      p_options: {
        limit: 5
      },
      p_organization_id: orgId,
      p_relationships: null
    });

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details || 'N/A');
    } else {
      console.log('✅ Success! Found', Array.isArray(data) ? data.length : 'unknown count', 'products');
      if (Array.isArray(data) && data.length > 0) {
        console.log('\n📦 First product:');
        console.log(JSON.stringify(data[0], null, 2));
      } else if (data) {
        console.log('\n📦 Response data:');
        console.log(JSON.stringify(data, null, 2));
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('📊 RPC Function Analysis:');
  console.log('✅ Function: hera_entities_crud_v2');
  console.log('📋 Parameters:');
  console.log('   - p_action: "create" | "read" | "update" | "delete"');
  console.log('   - p_actor_user_id: UUID (REQUIRED)');
  console.log('   - p_dynamic: JSONB (dynamic field data)');
  console.log('   - p_entity: JSONB (entity metadata)');
  console.log('   - p_options: JSONB (query options like limit)');
  console.log('   - p_organization_id: UUID (REQUIRED)');
  console.log('   - p_relationships: JSONB array (related entities)');
  console.log('\n🎯 Purpose: Unified CRUD endpoint for entities with built-in:');
  console.log('   - Dynamic data handling');
  console.log('   - Relationship management');
  console.log('   - Actor tracking for audit trails');
  console.log('   - Organization isolation');
}

testWithActor();
