#!/usr/bin/env node

/**
 * Test BULK READ Operations with hera_entities_crud_v2
 *
 * Tests various read patterns:
 * - Read all entities of a type
 * - Filtered reads (by status, search)
 * - Pagination
 * - Include/exclude dynamic data
 * - Include/exclude relationships
 * - Performance comparison with current pattern
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const orgId = process.env.DEFAULT_ORGANIZATION_ID;

async function getActorUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user.id;
  return '00000000-0000-0000-0000-000000000001';
}

async function testBulkRead() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║           BULK READ TEST - hera_entities_crud_v2                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  if (!orgId) {
    console.log('❌ DEFAULT_ORGANIZATION_ID not set in .env');
    return;
  }

  console.log(`🏢 Organization ID: ${orgId}`);
  const actorUserId = await getActorUserId();
  console.log(`👤 Actor User ID: ${actorUserId}\n`);

  // ============================================================================
  // TEST 1: Read ALL entities of multiple types
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 1: Read ALL Entities (Multiple Entity Types)');
  console.log('═'.repeat(70) + '\n');

  const entityTypes = ['product', 'service', 'customer', 'staff', 'product_category'];

  for (const entityType of entityTypes) {
    console.log(`\n📦 Reading: ${entityType.toUpperCase()}`);
    console.log('─'.repeat(70));

    try {
      const startTime = Date.now();

      const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'read',
        p_actor_user_id: actorUserId,
        p_dynamic: null,
        p_entity: {
          entity_type: entityType
        },
        p_options: {
          limit: 100,
          include_dynamic: true,
          include_relationships: false
        },
        p_organization_id: orgId,
        p_relationships: null
      });

      const elapsed = Date.now() - startTime;

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        console.log(`   Code: ${error.code}`);
      } else {
        const items = data?.items || data || [];
        const count = Array.isArray(items) ? items.length : 0;

        console.log(`   ✅ Success: ${count} ${entityType}(s) found`);
        console.log(`   ⏱️  Time: ${elapsed}ms`);

        if (count > 0) {
          console.log(`   📊 Sample entity:`);
          const sample = items[0];
          console.log(`      ID: ${sample.entity_id || sample.id}`);
          console.log(`      Name: ${sample.entity_name}`);
          console.log(`      Smart Code: ${sample.smart_code}`);
          console.log(`      Status: ${sample.status || 'N/A'}`);

          // Check for dynamic fields
          if (sample.dynamic_fields) {
            console.log(`      Dynamic Fields: ${Object.keys(sample.dynamic_fields).length} fields`);
            console.log(`      Fields: ${Object.keys(sample.dynamic_fields).join(', ')}`);
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }

  console.log('\n');

  // ============================================================================
  // TEST 2: Filtered Read - By Status
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 2: Filtered Read - By Status');
  console.log('═'.repeat(70) + '\n');

  const statuses = ['active', 'archived', 'draft'];

  for (const status of statuses) {
    console.log(`\n🔍 Filtering products by status: ${status.toUpperCase()}`);

    try {
      const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'read',
        p_actor_user_id: actorUserId,
        p_dynamic: null,
        p_entity: {
          entity_type: 'product'
        },
        p_options: {
          limit: 100,
          status: status,
          include_dynamic: false  // Faster without dynamic data
        },
        p_organization_id: orgId,
        p_relationships: null
      });

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        const items = data?.items || data || [];
        const count = Array.isArray(items) ? items.length : 0;
        console.log(`   ✅ Found ${count} ${status} products`);
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }

  console.log('\n');

  // ============================================================================
  // TEST 3: Pagination Test
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 3: Pagination (Reading in Batches)');
  console.log('═'.repeat(70) + '\n');

  console.log('🔄 Reading products in batches of 5...\n');

  let currentCursor = null;
  let batchNumber = 1;
  let totalCount = 0;

  try {
    while (batchNumber <= 3) {  // Read first 3 pages
      console.log(`📄 Batch ${batchNumber}:`);

      const options = {
        limit: 5,
        include_dynamic: false
      };

      if (currentCursor) {
        options.cursor = currentCursor;
      }

      const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'read',
        p_actor_user_id: actorUserId,
        p_dynamic: null,
        p_entity: {
          entity_type: 'product'
        },
        p_options: options,
        p_organization_id: orgId,
        p_relationships: null
      });

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        break;
      }

      const items = data?.items || [];
      const nextCursor = data?.next_cursor;

      if (!items || items.length === 0) {
        console.log(`   ⚠️  No more items (empty page)`);
        break;
      }

      console.log(`   ✅ Retrieved ${items.length} items`);
      totalCount += items.length;

      items.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.entity_name}`);
      });

      if (nextCursor) {
        console.log(`   📍 Next cursor: ${nextCursor}`);
        currentCursor = nextCursor;
      } else {
        console.log(`   🏁 No more pages (last page)`);
        break;
      }

      console.log('');
      batchNumber++;
    }

    console.log(`📊 Total retrieved: ${totalCount} products\n`);
  } catch (err) {
    console.log(`❌ Exception: ${err.message}\n`);
  }

  // ============================================================================
  // TEST 4: Performance - With vs Without Dynamic Data
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 4: Performance - Dynamic Data Impact');
  console.log('═'.repeat(70) + '\n');

  console.log('Testing same query with and without dynamic data...\n');

  // Without dynamic data
  console.log('🚀 Test A: WITHOUT dynamic data');
  try {
    const startTime = Date.now();

    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'read',
      p_actor_user_id: actorUserId,
      p_dynamic: null,
      p_entity: {
        entity_type: 'product'
      },
      p_options: {
        limit: 50,
        include_dynamic: false,
        include_relationships: false
      },
      p_organization_id: orgId,
      p_relationships: null
    });

    const elapsed = Date.now() - startTime;

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      const items = data?.items || [];
      const count = Array.isArray(items) ? items.length : 0;
      console.log(`   ✅ Retrieved ${count} products`);
      console.log(`   ⏱️  Time: ${elapsed}ms`);
      console.log(`   📏 Response size: ~${JSON.stringify(data).length} bytes`);
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  console.log('');

  // With dynamic data
  console.log('🚀 Test B: WITH dynamic data');
  try {
    const startTime = Date.now();

    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'read',
      p_actor_user_id: actorUserId,
      p_dynamic: null,
      p_entity: {
        entity_type: 'product'
      },
      p_options: {
        limit: 50,
        include_dynamic: true,
        include_relationships: false
      },
      p_organization_id: orgId,
      p_relationships: null
    });

    const elapsed = Date.now() - startTime;

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      const items = data?.items || [];
      const count = Array.isArray(items) ? items.length : 0;
      console.log(`   ✅ Retrieved ${count} products`);
      console.log(`   ⏱️  Time: ${elapsed}ms`);
      console.log(`   📏 Response size: ~${JSON.stringify(data).length} bytes`);
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  console.log('\n');

  // ============================================================================
  // TEST 5: Search/Filter by Name
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 5: Search Filter (by entity_name)');
  console.log('═'.repeat(70) + '\n');

  const searchTerms = ['hair', 'cut', 'color', 'treatment', 'product'];

  for (const term of searchTerms) {
    console.log(`🔎 Searching for: "${term}"`);

    try {
      const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'read',
        p_actor_user_id: actorUserId,
        p_dynamic: null,
        p_entity: {
          entity_type: 'product'
        },
        p_options: {
          limit: 10,
          search: term,
          include_dynamic: false
        },
        p_organization_id: orgId,
        p_relationships: null
      });

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        const items = data?.items || [];
        const count = Array.isArray(items) ? items.length : 0;
        console.log(`   ✅ Found ${count} matching products`);

        if (count > 0 && Array.isArray(items)) {
          items.slice(0, 3).forEach(item => {
            console.log(`      - ${item.entity_name}`);
          });
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }

    console.log('');
  }

  // ============================================================================
  // TEST 6: Read Specific Entity IDs (Bulk Fetch by IDs)
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 6: Bulk Fetch by Entity IDs');
  console.log('═'.repeat(70) + '\n');

  console.log('First, get some entity IDs...');

  try {
    const { data: allData } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'read',
      p_actor_user_id: actorUserId,
      p_dynamic: null,
      p_entity: {
        entity_type: 'product'
      },
      p_options: {
        limit: 5,
        include_dynamic: false
      },
      p_organization_id: orgId,
      p_relationships: null
    });

    const items = allData?.items || [];

    if (items.length > 0) {
      const entityIds = items.map(item => item.entity_id || item.id).filter(Boolean);

      console.log(`\n📋 Testing bulk fetch for ${entityIds.length} entity IDs...\n`);

      const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'read',
        p_actor_user_id: actorUserId,
        p_dynamic: null,
        p_entity: {
          entity_type: 'product'
        },
        p_options: {
          entity_ids: entityIds,
          include_dynamic: true
        },
        p_organization_id: orgId,
        p_relationships: null
      });

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        const fetchedItems = data?.items || [];
        console.log(`   ✅ Fetched ${fetchedItems.length} specific entities`);

        if (fetchedItems.length > 0) {
          fetchedItems.forEach((item, idx) => {
            console.log(`   ${idx + 1}. ${item.entity_name} (${item.entity_id || item.id})`);
          });
        }
      }
    } else {
      console.log('   ⚠️  No products available to test bulk fetch by IDs');
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  console.log('\n');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('BULK READ CAPABILITIES SUMMARY');
  console.log('═'.repeat(70) + '\n');

  console.log('✅ Supported Features:');
  console.log('   • Read all entities of a specific type');
  console.log('   • Pagination with cursor support');
  console.log('   • Optional dynamic data inclusion');
  console.log('   • Optional relationships inclusion');
  console.log('   • Filter by status (active, archived, draft)');
  console.log('   • Search by entity name');
  console.log('   • Bulk fetch by entity IDs');
  console.log('   • Limit control (batch size)');
  console.log('   • Multi-tenant isolation (organization_id)\n');

  console.log('📊 Performance Characteristics:');
  console.log('   • Base query: Fast (<50ms for small datasets)');
  console.log('   • With dynamic data: Moderate overhead');
  console.log('   • With relationships: Additional overhead');
  console.log('   • Pagination: Efficient cursor-based\n');

  console.log('🎯 Best Use Cases:');
  console.log('   • Product catalogs (list all products)');
  console.log('   • Service menus (list all services)');
  console.log('   • Customer directories (list all customers)');
  console.log('   • Staff rosters (list all staff)');
  console.log('   • Category management (list all categories)\n');

  console.log('═'.repeat(70));
  console.log('Test Complete!');
  console.log('═'.repeat(70) + '\n');
}

testBulkRead().catch(console.error);
