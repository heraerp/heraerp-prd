#!/usr/bin/env node

/**
 * Test Category CRUD using hera_entities_crud_v2
 *
 * This script tests the new unified RPC against the production category workflow
 * Used in: /salon/products page -> ProductCategory management
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const orgId = process.env.DEFAULT_ORGANIZATION_ID;

// Get a test user ID
async function getActorUserId() {
  // Try to get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return user.id;
  }

  // Try to find any user in the organization
  const { data: users } = await supabase
    .from('auth.users')
    .select('id')
    .limit(1);

  if (users && users.length > 0) {
    return users[0].id;
  }

  // Fallback to a test UUID (this might not work for production RPC)
  return '00000000-0000-0000-0000-000000000001';
}

async function testCategoryCRUD() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║  CATEGORY CRUD TEST - hera_entities_crud_v2 vs Current Pattern   ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  if (!orgId) {
    console.log('❌ DEFAULT_ORGANIZATION_ID not set in .env');
    return;
  }

  console.log(`🏢 Organization ID: ${orgId}`);

  // Get actor user ID
  const actorUserId = await getActorUserId();
  console.log(`👤 Actor User ID: ${actorUserId}\n`);

  let createdCategoryId = null;

  // ============================================================================
  // TEST 1: CREATE CATEGORY using hera_entities_crud_v2
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 1: CREATE CATEGORY (New RPC vs Current Pattern)');
  console.log('═'.repeat(70) + '\n');

  // Current pattern from useHeraProductCategories:
  // 1. Create entity via /api/v2/entities (POST)
  // 2. Create dynamic fields via /api/v2/dynamic-data/batch (POST)

  // New pattern with hera_entities_crud_v2:
  // 1. Single RPC call with everything

  const testCategory = {
    name: 'RPC V2 Test Category ' + Date.now(),
    description: 'Created using hera_entities_crud_v2 RPC',
    display_order: 99,
    icon: 'TestIcon',
    color: '#FF6B6B',
    active: true
  };

  console.log('📋 Category Data:');
  console.log(JSON.stringify(testCategory, null, 2));
  console.log('');

  console.log('🔄 Calling hera_entities_crud_v2 (CREATE)...\n');

  try {
    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'create',
      p_actor_user_id: actorUserId,
      p_dynamic: {
        display_order: testCategory.display_order,
        icon: testCategory.icon,
        color: testCategory.color,
        active: testCategory.active
      },
      p_entity: {
        entity_type: 'product_category',
        entity_name: testCategory.name,
        entity_description: testCategory.description,
        smart_code: 'HERA.SALON.CATEGORY.ENT.PRODUCT.V1',
        status: 'active'
      },
      p_options: {},
      p_organization_id: orgId,
      p_relationships: []
    });

    if (error) {
      console.log('❌ CREATE Failed:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details || 'N/A');
      console.log('   Hint:', error.hint || 'N/A');
    } else {
      console.log('✅ CREATE Success!');
      console.log('   Response:', JSON.stringify(data, null, 2));

      // Extract entity ID from response
      if (data && typeof data === 'object') {
        createdCategoryId = data.entity_id || data.id || data.data?.entity_id || data.data?.id;
      }

      if (createdCategoryId) {
        console.log('   📦 Created Category ID:', createdCategoryId);
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // ============================================================================
  // TEST 2: READ CATEGORIES using hera_entities_crud_v2
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 2: READ CATEGORIES (New RPC vs Current Pattern)');
  console.log('═'.repeat(70) + '\n');

  // Current pattern from useUniversalEntity:
  // 1. Call getEntities RPC
  // 2. Fetch dynamic data via /api/v2/dynamic-data (separate call)
  // 3. Merge dynamic data into entities

  // New pattern with hera_entities_crud_v2:
  // 1. Single RPC call returns everything

  console.log('🔄 Calling hera_entities_crud_v2 (READ)...\n');

  try {
    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'read',
      p_actor_user_id: actorUserId,
      p_dynamic: null,
      p_entity: {
        entity_type: 'product_category'
      },
      p_options: {
        limit: 10,
        include_dynamic: true,
        include_relationships: false
      },
      p_organization_id: orgId,
      p_relationships: null
    });

    if (error) {
      console.log('❌ READ Failed:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details || 'N/A');
    } else {
      const categories = data?.items || data || [];
      console.log('✅ READ Success!');
      console.log(`   Found: ${Array.isArray(categories) ? categories.length : 'unknown'} categories`);

      if (Array.isArray(categories) && categories.length > 0) {
        console.log('\n   📦 Sample Category:');
        console.log(JSON.stringify(categories[0], null, 2));

        // Check if our created category is in the list
        if (createdCategoryId) {
          const ourCategory = categories.find(c => c.entity_id === createdCategoryId || c.id === createdCategoryId);
          if (ourCategory) {
            console.log('\n   ✅ Found our newly created category!');
            console.log('   📦 Our Category:');
            console.log(JSON.stringify(ourCategory, null, 2));
          }
        }
      } else if (data) {
        console.log('\n   📦 Response Format:');
        console.log(JSON.stringify(data, null, 2));
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // ============================================================================
  // TEST 3: UPDATE CATEGORY using hera_entities_crud_v2
  // ============================================================================
  if (createdCategoryId) {
    console.log('═'.repeat(70));
    console.log('TEST 3: UPDATE CATEGORY (New RPC vs Current Pattern)');
    console.log('═'.repeat(70) + '\n');

    console.log(`📝 Updating category: ${createdCategoryId}\n`);

    // Current pattern from useHeraProductCategories:
    // 1. Update entity via /api/v2/entities (PUT)
    // 2. Update dynamic fields are included in the PUT payload

    // New pattern with hera_entities_crud_v2:
    // 1. Single RPC call with updates

    const updates = {
      name: testCategory.name + ' [UPDATED]',
      description: 'Updated via hera_entities_crud_v2',
      color: '#4ECDC4',
      display_order: 88
    };

    console.log('📋 Update Data:');
    console.log(JSON.stringify(updates, null, 2));
    console.log('');

    console.log('🔄 Calling hera_entities_crud_v2 (UPDATE)...\n');

    try {
      const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'update',
        p_actor_user_id: actorUserId,
        p_dynamic: {
          color: updates.color,
          display_order: updates.display_order
        },
        p_entity: {
          entity_id: createdCategoryId,
          entity_type: 'product_category',
          entity_name: updates.name,
          entity_description: updates.description
        },
        p_options: {},
        p_organization_id: orgId,
        p_relationships: null
      });

      if (error) {
        console.log('❌ UPDATE Failed:', error.message);
        console.log('   Code:', error.code);
        console.log('   Details:', error.details || 'N/A');
      } else {
        console.log('✅ UPDATE Success!');
        console.log('   Response:', JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.log('❌ Exception:', err.message);
    }

    console.log('\n');
  }

  // ============================================================================
  // TEST 4: DELETE CATEGORY using hera_entities_crud_v2
  // ============================================================================
  if (createdCategoryId) {
    console.log('═'.repeat(70));
    console.log('TEST 4: DELETE CATEGORY (New RPC vs Current Pattern)');
    console.log('═'.repeat(70) + '\n');

    console.log(`🗑️  Deleting category: ${createdCategoryId}\n`);

    // Current pattern from useHeraProductCategories:
    // 1. Archive by updating status to 'archived' (soft delete)
    // 2. OR hard delete via DELETE /api/v2/entities/{id}

    // New pattern with hera_entities_crud_v2:
    // 1. Single RPC call with delete action

    console.log('🔄 Calling hera_entities_crud_v2 (DELETE - soft delete/archive)...\n');

    try {
      const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'delete',
        p_actor_user_id: actorUserId,
        p_dynamic: null,
        p_entity: {
          entity_id: createdCategoryId,
          entity_type: 'product_category'
        },
        p_options: {
          hard_delete: false  // Soft delete (archive)
        },
        p_organization_id: orgId,
        p_relationships: null
      });

      if (error) {
        console.log('❌ DELETE Failed:', error.message);
        console.log('   Code:', error.code);
        console.log('   Details:', error.details || 'N/A');
      } else {
        console.log('✅ DELETE Success!');
        console.log('   Response:', JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.log('❌ Exception:', err.message);
    }

    console.log('\n');
  }

  // ============================================================================
  // COMPARISON SUMMARY
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('COMPARISON SUMMARY: Current Pattern vs hera_entities_crud_v2');
  console.log('═'.repeat(70) + '\n');

  console.log('📊 Current Pattern (useHeraProductCategories + useUniversalEntity):');
  console.log('   CREATE:');
  console.log('     1. POST /api/v2/entities (create entity)');
  console.log('     2. POST /api/v2/dynamic-data/batch (add dynamic fields)');
  console.log('     Total: 2 API calls\n');

  console.log('   READ:');
  console.log('     1. RPC getEntities (fetch entities)');
  console.log('     2. GET /api/v2/dynamic-data (fetch dynamic fields for all entities)');
  console.log('     3. Client-side merge of dynamic data');
  console.log('     Total: 2 API calls + client processing\n');

  console.log('   UPDATE:');
  console.log('     1. PUT /api/v2/entities (update entity + dynamic fields together)');
  console.log('     Total: 1 API call\n');

  console.log('   DELETE:');
  console.log('     1. PUT /api/v2/entities (update status to archived)');
  console.log('     OR DELETE /api/v2/entities/{id} (hard delete)');
  console.log('     Total: 1 API call\n');

  console.log('─'.repeat(70) + '\n');

  console.log('📊 New Pattern (hera_entities_crud_v2):');
  console.log('   CREATE: 1 RPC call (entity + dynamic + relationships)');
  console.log('   READ:   1 RPC call (returns everything merged)');
  console.log('   UPDATE: 1 RPC call (entity + dynamic + relationships)');
  console.log('   DELETE: 1 RPC call (soft or hard delete)\n');

  console.log('─'.repeat(70) + '\n');

  console.log('✨ Benefits of hera_entities_crud_v2:');
  console.log('   ✅ Atomic operations (all-or-nothing transaction)');
  console.log('   ✅ Reduced network calls (50% reduction for CREATE)');
  console.log('   ✅ Server-side data merging (no client processing)');
  console.log('   ✅ Built-in actor tracking (audit trail)');
  console.log('   ✅ Consistent interface across all CRUD operations');
  console.log('   ✅ Relationship management in same call\n');

  console.log('⚠️  Considerations:');
  console.log('   ⚠️  Requires actor_user_id (current pattern optional)');
  console.log('   ⚠️  New API contract (migration needed)');
  console.log('   ⚠️  Must fix smart_code constraint issue for dynamic fields\n');

  console.log('═'.repeat(70));
  console.log('Test Complete!');
  console.log('═'.repeat(70) + '\n');
}

// Run the test
testCategoryCRUD().catch(console.error);
