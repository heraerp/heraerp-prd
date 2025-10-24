#!/usr/bin/env node

/**
 * Test UPPERCASE vs lowercase entity_type in hera_entities_crud_v2
 * Compare results with current useUniversalEntity pattern
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ACTUAL PRODUCTION IDS from authenticated session
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const actorUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674';

async function testUppercaseVsLowercase() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   UPPERCASE vs lowercase entity_type - Comparison Test           ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // ============================================================================
  // TEST 1: RPC V2 with lowercase 'product' (what we've been using)
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 1: RPC V2 with LOWERCASE entity_type: "product"');
  console.log('═'.repeat(70) + '\n');

  let lowercaseProducts = [];
  try {
    const startTime = Date.now();

    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'read',
      p_actor_user_id: actorUserId,
      p_dynamic: null,
      p_entity: {
        entity_type: 'product'  // lowercase
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
      console.log('❌ Error:', error.message);
      console.log('   Code:', error.code);
    } else {
      const items = data?.items || data || [];
      lowercaseProducts = Array.isArray(items) ? items : [];
      const count = lowercaseProducts.length;

      console.log(`✅ Retrieved ${count} products`);
      console.log(`⏱️  Time: ${elapsed}ms`);
      console.log(`📏 Response Size: ${JSON.stringify(data).length} bytes\n`);

      if (count > 0) {
        console.log('📦 First Product Summary:');
        const product = lowercaseProducts[0];
        console.log(`   Name: ${product.entity_name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Smart Code: ${product.smart_code}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Metadata keys: ${Object.keys(product.metadata || {}).join(', ')}`);
        console.log(`   Dynamic keys: ${Object.keys(product.dynamic || {}).join(', ')}`);
        console.log(`   Relationship types: ${Object.keys(product.relationships || {}).join(', ')}`);
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // ============================================================================
  // TEST 2: RPC V2 with UPPERCASE 'PRODUCT' (what useUniversalEntity sends)
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 2: RPC V2 with UPPERCASE entity_type: "PRODUCT"');
  console.log('═'.repeat(70) + '\n');

  let uppercaseProducts = [];
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
      console.log('❌ Error:', error.message);
      console.log('   Code:', error.code);
    } else {
      const items = data?.items || data || [];
      uppercaseProducts = Array.isArray(items) ? items : [];
      const count = uppercaseProducts.length;

      console.log(`✅ Retrieved ${count} products`);
      console.log(`⏱️  Time: ${elapsed}ms`);
      console.log(`📏 Response Size: ${JSON.stringify(data).length} bytes\n`);

      if (count > 0) {
        console.log('📦 First Product Summary:');
        const product = uppercaseProducts[0];
        console.log(`   Name: ${product.entity_name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Smart Code: ${product.smart_code}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Metadata keys: ${Object.keys(product.metadata || {}).join(', ')}`);
        console.log(`   Dynamic keys: ${Object.keys(product.dynamic || {}).join(', ')}`);
        console.log(`   Relationship types: ${Object.keys(product.relationships || {}).join(', ')}`);
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // ============================================================================
  // TEST 3: Direct Supabase query (simulating what useUniversalEntity does)
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 3: Current Pattern - Direct Supabase Query');
  console.log('═'.repeat(70) + '\n');

  console.log('Simulating useUniversalEntity behavior:');
  console.log('1. Query core_entities with entity_type = "PRODUCT" (uppercase)');
  console.log('2. Filter by organization_id\n');

  let directQueryProducts = [];
  try {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'product')  // Try lowercase first
      .eq('organization_id', orgId)
      .limit(100);

    const elapsed = Date.now() - startTime;

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      directQueryProducts = data || [];
      console.log(`✅ Retrieved ${directQueryProducts.length} products (lowercase query)`);
      console.log(`⏱️  Time: ${elapsed}ms\n`);
    }

    // Also try uppercase
    const { data: dataUpper, error: errorUpper } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'PRODUCT')  // UPPERCASE
      .eq('organization_id', orgId)
      .limit(100);

    if (errorUpper) {
      console.log('❌ Error (uppercase):', errorUpper.message);
    } else {
      console.log(`✅ Retrieved ${(dataUpper || []).length} products (UPPERCASE query)`);
    }

  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // ============================================================================
  // COMPARISON ANALYSIS
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('DETAILED COMPARISON');
  console.log('═'.repeat(70) + '\n');

  console.log('📊 Results Summary:');
  console.log(`   lowercase "product": ${lowercaseProducts.length} products`);
  console.log(`   UPPERCASE "PRODUCT": ${uppercaseProducts.length} products`);
  console.log(`   Direct query (lowercase): ${directQueryProducts.length} products\n`);

  if (lowercaseProducts.length > 0 && uppercaseProducts.length > 0) {
    console.log('🔍 Comparing First Product from Each Query:\n');

    const lower = lowercaseProducts[0];
    const upper = uppercaseProducts[0];

    console.log('Entity IDs:');
    console.log(`   lowercase: ${lower.id}`);
    console.log(`   UPPERCASE: ${upper.id}`);
    console.log(`   Same product? ${lower.id === upper.id ? '✅ YES' : '❌ NO'}\n`);

    console.log('Entity Names:');
    console.log(`   lowercase: ${lower.entity_name}`);
    console.log(`   UPPERCASE: ${upper.entity_name}`);
    console.log(`   Match? ${lower.entity_name === upper.entity_name ? '✅ YES' : '❌ NO'}\n`);

    console.log('Metadata Comparison:');
    const lowerMeta = JSON.stringify(lower.metadata || {});
    const upperMeta = JSON.stringify(upper.metadata || {});
    console.log(`   lowercase metadata: ${lowerMeta}`);
    console.log(`   UPPERCASE metadata: ${upperMeta}`);
    console.log(`   Match? ${lowerMeta === upperMeta ? '✅ YES' : '❌ NO'}\n`);

    console.log('Dynamic Data Comparison:');
    const lowerDyn = JSON.stringify(lower.dynamic || {});
    const upperDyn = JSON.stringify(upper.dynamic || {});
    console.log(`   lowercase dynamic: ${lowerDyn}`);
    console.log(`   UPPERCASE dynamic: ${upperDyn}`);
    console.log(`   Match? ${lowerDyn === upperDyn ? '✅ YES' : '❌ NO'}\n`);

    console.log('Relationships Comparison:');
    const lowerRels = Object.keys(lower.relationships || {}).join(', ');
    const upperRels = Object.keys(upper.relationships || {}).join(', ');
    console.log(`   lowercase relationships: ${lowerRels}`);
    console.log(`   UPPERCASE relationships: ${upperRels}`);
    console.log(`   Match? ${lowerRels === upperRels ? '✅ YES' : '❌ NO'}\n`);
  }

  // ============================================================================
  // FULL PRODUCT DETAILS COMPARISON
  // ============================================================================
  if (lowercaseProducts.length > 0) {
    console.log('═'.repeat(70));
    console.log('FULL PRODUCT DETAILS - lowercase "product"');
    console.log('═'.repeat(70) + '\n');
    console.log(JSON.stringify(lowercaseProducts[0], null, 2));
    console.log('\n');
  }

  if (uppercaseProducts.length > 0) {
    console.log('═'.repeat(70));
    console.log('FULL PRODUCT DETAILS - UPPERCASE "PRODUCT"');
    console.log('═'.repeat(70) + '\n');
    console.log(JSON.stringify(uppercaseProducts[0], null, 2));
    console.log('\n');
  }

  // ============================================================================
  // CONCLUSION
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('CONCLUSION');
  console.log('═'.repeat(70) + '\n');

  if (lowercaseProducts.length === uppercaseProducts.length && lowercaseProducts.length > 0) {
    if (lowercaseProducts[0].id === uppercaseProducts[0].id) {
      console.log('✅ CASE INSENSITIVE: RPC V2 accepts both lowercase and UPPERCASE');
      console.log('   Both queries return the same products\n');
    } else {
      console.log('⚠️  WARNING: Different products returned!');
      console.log('   Case sensitivity may be affecting results\n');
    }
  } else if (lowercaseProducts.length === 0 && uppercaseProducts.length === 0) {
    console.log('⚠️  Both queries returned 0 products');
    console.log('   Unable to determine case sensitivity\n');
  } else {
    console.log('🔴 CASE SENSITIVE: Different result counts!');
    console.log(`   lowercase: ${lowercaseProducts.length} products`);
    console.log(`   UPPERCASE: ${uppercaseProducts.length} products\n`);
  }

  console.log('═'.repeat(70));
  console.log('Test Complete!');
  console.log('═'.repeat(70) + '\n');
}

testUppercaseVsLowercase().catch(console.error);
