#!/usr/bin/env node

/**
 * Compare Current Pattern (useUniversalEntity) vs RPC V2 (hera_entities_crud_v2)
 * Using UPPERCASE "PRODUCT" only (ignoring old lowercase products)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ACTUAL PRODUCTION IDS
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const actorUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674';

async function compareCurrentVsRpcV2() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   Current Pattern vs RPC V2 - Can We Replace?                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  console.log('Testing with UPPERCASE "PRODUCT" only (correct products)\n\n');

  let currentPatternProducts = [];
  let rpcV2Products = [];

  // ============================================================================
  // METHOD 1: Current Pattern (what useUniversalEntity does)
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('METHOD 1: Current Pattern (useUniversalEntity simulation)');
  console.log('═'.repeat(70) + '\n');

  console.log('Step 1: Call getEntities RPC...');

  try {
    const step1Start = Date.now();

    // This is what getEntities() does internally
    const { data: entitiesData, error: entitiesError } = await supabase.rpc('hera_get_entities_v1', {
      p_organization_id: orgId,
      p_entity_type: 'PRODUCT',  // UPPERCASE
      p_status: null,
      p_include_relationships: true,
      p_include_dynamic: true
    });

    const step1Elapsed = Date.now() - step1Start;

    if (entitiesError) {
      console.log('   ❌ Error:', entitiesError.message);
    } else {
      const entities = Array.isArray(entitiesData) ? entitiesData : [];
      console.log(`   ✅ Retrieved ${entities.length} entities`);
      console.log(`   ⏱️  Time: ${step1Elapsed}ms\n`);

      // Step 2: Fetch dynamic data (separate call)
      if (entities.length > 0) {
        console.log('Step 2: Fetch dynamic data for all entities...');
        const step2Start = Date.now();

        const entityIds = entities.map(e => e.id);

        // Simulate the fetch call to /api/v2/dynamic-data
        const { data: { session } } = await supabase.auth.getSession();

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-hera-org': orgId
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/dynamic-data?p_entity_ids=${entityIds.join(',')}`,
          { headers }
        );

        const step2Elapsed = Date.now() - step2Start;

        if (response.ok) {
          const dynamicResult = await response.json();
          const allDynamicData = dynamicResult.data || [];

          console.log(`   ✅ Retrieved dynamic data for ${allDynamicData.length} fields`);
          console.log(`   ⏱️  Time: ${step2Elapsed}ms\n`);

          // Step 3: Client-side merge
          console.log('Step 3: Client-side merge of dynamic data...');
          const step3Start = Date.now();

          const dynamicDataByEntity = new Map();
          allDynamicData.forEach((field) => {
            if (!dynamicDataByEntity.has(field.entity_id)) {
              dynamicDataByEntity.set(field.entity_id, []);
            }
            dynamicDataByEntity.get(field.entity_id).push(field);
          });

          currentPatternProducts = entities.map((entity) => {
            const dynamicData = dynamicDataByEntity.get(entity.id) || [];
            const mergedData = { ...entity };

            dynamicData.forEach((field) => {
              if (field.field_type === 'number') {
                mergedData[field.field_name] = field.field_value_number;
              } else if (field.field_type === 'text') {
                mergedData[field.field_name] = field.field_value_text;
              } else if (field.field_type === 'json') {
                mergedData[field.field_name] = field.field_value_json;
              }
            });

            return mergedData;
          });

          const step3Elapsed = Date.now() - step3Start;
          console.log(`   ✅ Merged dynamic data into ${currentPatternProducts.length} products`);
          console.log(`   ⏱️  Time: ${step3Elapsed}ms\n`);

          const totalTime = step1Elapsed + step2Elapsed + step3Elapsed;
          console.log(`📊 TOTAL TIME: ${totalTime}ms (${entities.length} products, 2 API calls + merge)\n`);

        } else {
          console.log(`   ❌ Dynamic data fetch failed: ${response.status}\n`);
          currentPatternProducts = entities;
        }
      }
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message);
  }

  console.log('\n');

  // ============================================================================
  // METHOD 2: RPC V2 Pattern (hera_entities_crud_v2)
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('METHOD 2: RPC V2 Pattern (hera_entities_crud_v2)');
  console.log('═'.repeat(70) + '\n');

  console.log('Single RPC call with server-side merge...');

  try {
    const startTime = Date.now();

    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'read',
      p_actor_user_id: actorUserId,
      p_dynamic: null,
      p_entity: {
        entity_type: 'PRODUCT'  // UPPERCASE
      },
      p_options: {
        limit: 100,
        include_dynamic: true,
        include_relationships: true
      },
      p_organization_id: orgId,
      p_relationships: null
    });

    const elapsed = Date.now() - startTime;

    if (error) {
      console.log('   ❌ Error:', error.message);
    } else {
      rpcV2Products = data?.items || [];
      console.log(`   ✅ Retrieved ${rpcV2Products.length} products`);
      console.log(`   ⏱️  Time: ${elapsed}ms\n`);
      console.log(`📊 TOTAL TIME: ${elapsed}ms (${rpcV2Products.length} products, 1 API call)\n`);
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message);
  }

  console.log('\n');

  // ============================================================================
  // DETAILED COMPARISON
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('DETAILED COMPARISON');
  console.log('═'.repeat(70) + '\n');

  console.log('📊 Count Comparison:');
  console.log(`   Current Pattern: ${currentPatternProducts.length} products`);
  console.log(`   RPC V2:          ${rpcV2Products.length} products`);
  console.log(`   Match? ${currentPatternProducts.length === rpcV2Products.length ? '✅ YES' : '❌ NO'}\n`);

  if (currentPatternProducts.length > 0 && rpcV2Products.length > 0) {
    // Sort both arrays by ID for comparison
    const sortedCurrent = [...currentPatternProducts].sort((a, b) => a.id.localeCompare(b.id));
    const sortedRpc = [...rpcV2Products].sort((a, b) => a.id.localeCompare(b.id));

    console.log('🔍 Product ID Comparison:\n');

    const currentIds = new Set(sortedCurrent.map(p => p.id));
    const rpcIds = new Set(sortedRpc.map(p => p.id));

    const allIds = new Set([...currentIds, ...rpcIds]);

    let matchCount = 0;
    let missingInRpc = [];
    let missingInCurrent = [];

    allIds.forEach(id => {
      const inCurrent = currentIds.has(id);
      const inRpc = rpcIds.has(id);

      if (inCurrent && inRpc) {
        matchCount++;
      } else if (inCurrent && !inRpc) {
        missingInRpc.push(id);
      } else if (!inCurrent && inRpc) {
        missingInCurrent.push(id);
      }
    });

    console.log(`   Both methods: ${matchCount} products`);
    console.log(`   Only in Current: ${missingInRpc.length} products`);
    console.log(`   Only in RPC V2: ${missingInCurrent.length} products\n`);

    if (missingInRpc.length > 0) {
      console.log('   ⚠️  Products missing in RPC V2:');
      missingInRpc.forEach(id => {
        const product = sortedCurrent.find(p => p.id === id);
        console.log(`      - ${product.entity_name} (${id})`);
      });
      console.log('');
    }

    if (missingInCurrent.length > 0) {
      console.log('   ⚠️  Products missing in Current Pattern:');
      missingInCurrent.forEach(id => {
        const product = sortedRpc.find(p => p.id === id);
        console.log(`      - ${product.entity_name} (${id})`);
      });
      console.log('');
    }

    // Compare first matching product in detail
    const firstId = sortedCurrent[0]?.id;
    if (firstId && rpcIds.has(firstId)) {
      console.log('═'.repeat(70));
      console.log('FIELD-BY-FIELD COMPARISON - First Product');
      console.log('═'.repeat(70) + '\n');

      const currentProduct = sortedCurrent[0];
      const rpcProduct = sortedRpc.find(p => p.id === firstId);

      console.log(`Product: ${currentProduct.entity_name}\n`);

      // Core fields
      console.log('Core Fields:');
      const coreFields = ['id', 'entity_name', 'entity_code', 'entity_type', 'smart_code', 'status'];
      coreFields.forEach(field => {
        const currentVal = currentProduct[field];
        const rpcVal = rpcProduct[field];
        const match = currentVal === rpcVal;
        console.log(`   ${field}:`);
        console.log(`      Current: ${currentVal}`);
        console.log(`      RPC V2:  ${rpcVal}`);
        console.log(`      ${match ? '✅ Match' : '❌ Mismatch'}`);
      });

      console.log('\nDynamic Fields:');
      const dynamicFields = ['price_market', 'price_cost', 'stock_quantity', 'category'];
      dynamicFields.forEach(field => {
        const currentVal = currentProduct[field];
        const rpcVal = rpcProduct[field];

        // For RPC V2, check if it's in the dynamic object
        const rpcDynamicVal = rpcProduct.dynamic?.[field]?.value;

        console.log(`   ${field}:`);
        console.log(`      Current: ${currentVal}`);
        console.log(`      RPC V2 (merged): ${rpcVal}`);
        console.log(`      RPC V2 (dynamic object): ${rpcDynamicVal}`);
        console.log(`      ${currentVal === rpcVal || currentVal === rpcDynamicVal ? '✅ Match' : '❌ Mismatch'}`);
      });

      console.log('\nRelationships:');
      const currentRels = Object.keys(currentProduct.relationships || {});
      const rpcRels = Object.keys(rpcProduct.relationships || {});
      console.log(`   Current: ${currentRels.join(', ')}`);
      console.log(`   RPC V2:  ${rpcRels.join(', ')}`);
      console.log(`   ${currentRels.length === rpcRels.length ? '✅ Match' : '❌ Mismatch'}\n`);

      console.log('═'.repeat(70));
      console.log('FULL PRODUCT - Current Pattern');
      console.log('═'.repeat(70) + '\n');
      console.log(JSON.stringify(currentProduct, null, 2));
      console.log('\n\n');

      console.log('═'.repeat(70));
      console.log('FULL PRODUCT - RPC V2');
      console.log('═'.repeat(70) + '\n');
      console.log(JSON.stringify(rpcProduct, null, 2));
      console.log('\n\n');
    }
  }

  // ============================================================================
  // CONCLUSION
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('CAN WE REPLACE OLD RPC WITH RPC V2?');
  console.log('═'.repeat(70) + '\n');

  const sameCount = currentPatternProducts.length === rpcV2Products.length;
  const hasProducts = currentPatternProducts.length > 0 && rpcV2Products.length > 0;

  if (!hasProducts) {
    console.log('⚠️  Cannot compare - insufficient data\n');
  } else if (sameCount) {
    console.log('✅ YES - RPC V2 returns the same number of products\n');
    console.log('Next Steps:');
    console.log('   1. Verify dynamic fields are merged correctly');
    console.log('   2. Verify relationships are included');
    console.log('   3. Test with useHeraProducts hook');
    console.log('   4. Replace getEntities with hera_entities_crud_v2\n');
  } else {
    console.log('⚠️  INVESTIGATE - Different product counts\n');
    console.log('Possible reasons:');
    console.log('   1. Different filtering logic');
    console.log('   2. Status filtering differences');
    console.log('   3. Case sensitivity issues\n');
  }

  console.log('Performance Improvement:');
  console.log(`   Current Pattern: 2 API calls + client merge`);
  console.log(`   RPC V2 Pattern:  1 API call (server merge)`);
  console.log(`   Reduction:       50% fewer API calls ✅\n`);

  console.log('═'.repeat(70));
  console.log('Test Complete!');
  console.log('═'.repeat(70) + '\n');
}

compareCurrentVsRpcV2().catch(console.error);
