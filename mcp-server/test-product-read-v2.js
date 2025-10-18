#!/usr/bin/env node

/**
 * Test PRODUCT Read using hera_entities_crud_v2
 * Based on /salon/products page implementation
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

async function testProductRead() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║        PRODUCT READ TEST - hera_entities_crud_v2                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Product Configuration from entityPresets.ts:');
  console.log('   Entity Type: product (lowercase)');
  console.log('   Smart Code: HERA.SALON.PROD.ENT.RETAIL.V1');
  console.log('   Dynamic Fields:');
  console.log('     - price_market (number) - HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1');
  console.log('     - price_cost (number) - HERA.SALON.PRODUCT.DYN.PRICE.COST.v1');
  console.log('     - stock_quantity (number) - HERA.SALON.PRODUCT.DYN.STOCK.QTY.v1');
  console.log('     - reorder_level (number) - HERA.SALON.PRODUCT.DYN.REORDER.LEVEL.v1');
  console.log('     - barcode_primary (text) - HERA.SALON.PRODUCT.DYN.BARCODE.PRIMARY.V1');
  console.log('     - sku (text) - HERA.SALON.PRODUCT.DYN.SKU.v1');
  console.log('     - size (text) - HERA.SALON.PRODUCT.DYN.SIZE.v1');
  console.log('   Relationships:');
  console.log('     - HAS_CATEGORY');
  console.log('     - HAS_BRAND');
  console.log('     - STOCK_AT (branches)');
  console.log('');

  // ============================================================================
  // TEST 1: Read products WITHOUT dynamic data
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 1: Read Products - WITHOUT Dynamic Data (Base Query)');
  console.log('═'.repeat(70) + '\n');

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
        limit: 10,
        include_dynamic: false,
        include_relationships: false
      },
      p_organization_id: orgId,
      p_relationships: null
    });

    const elapsed = Date.now() - startTime;

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', JSON.stringify(error, null, 2));
    } else {
      const items = data?.items || data || [];
      const count = Array.isArray(items) ? items.length : 0;

      console.log(`✅ Retrieved ${count} products`);
      console.log(`⏱️  Time: ${elapsed}ms`);
      console.log(`📏 Response Size: ${JSON.stringify(data).length} bytes\n`);

      if (count > 0 && Array.isArray(items)) {
        console.log('📦 Sample Product (without dynamic data):\n');
        const product = items[0];

        console.log(`   Name: ${product.entity_name}`);
        console.log(`   ID: ${product.entity_id || product.id}`);
        console.log(`   Code: ${product.entity_code}`);
        console.log(`   Type: ${product.entity_type}`);
        console.log(`   Smart Code: ${product.smart_code}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Created: ${product.created_at}`);
        console.log(`   Updated: ${product.updated_at}`);

        console.log(`\n   📦 Full Entity:\n`);
        console.log(JSON.stringify(product, null, 4));
      } else {
        console.log('⚠️  No products found. Database might be empty.');
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // ============================================================================
  // TEST 2: Read products WITH dynamic data
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 2: Read Products - WITH Dynamic Data (Full Query)');
  console.log('═'.repeat(70) + '\n');

  console.log('🔍 This matches the useHeraProducts configuration:');
  console.log('   include_dynamic: true');
  console.log('   include_relationships: false (unless filtering by branch)\n');

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
        limit: 10,
        include_dynamic: true,  // Should include price_market, price_cost, etc.
        include_relationships: false
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
      const count = Array.isArray(items) ? items.length : 0;

      console.log(`✅ Retrieved ${count} products`);
      console.log(`⏱️  Time: ${elapsed}ms`);
      console.log(`📏 Response Size: ${JSON.stringify(data).length} bytes\n`);

      if (count > 0 && Array.isArray(items)) {
        console.log('📦 Sample Product (with dynamic data):\n');
        const product = items[0];

        console.log(`   Name: ${product.entity_name}`);
        console.log(`   ID: ${product.entity_id || product.id}`);
        console.log(`   Smart Code: ${product.smart_code}`);

        // Check dynamic fields
        console.log(`\n   💎 Dynamic Fields Check:`);

        const expectedFields = [
          'price_market',
          'price_cost',
          'stock_quantity',
          'reorder_level',
          'barcode_primary',
          'sku',
          'size'
        ];

        // Check if dynamic_fields exists as object
        if (product.dynamic_fields) {
          console.log(`      ✅ dynamic_fields object exists`);
          console.log(`      Fields:`, Object.keys(product.dynamic_fields));
        } else if (product.dynamic) {
          console.log(`      ✅ dynamic object exists`);
          console.log(`      Fields:`, Object.keys(product.dynamic));
        }

        // Check if fields are merged at top level
        const topLevelFields = expectedFields.filter(f => product[f] !== undefined);
        if (topLevelFields.length > 0) {
          console.log(`      ✅ Fields merged at top level:`);
          topLevelFields.forEach(field => {
            console.log(`         - ${field}: ${product[field]}`);
          });
        } else {
          console.log(`      ⚠️  No dynamic fields found (neither in object nor top-level)`);
        }

        console.log(`\n   📦 Full Product Entity:\n`);
        console.log(JSON.stringify(product, null, 4));
      } else {
        console.log('⚠️  No products found. Database might be empty.');
        console.log('\n💡 To create test products, use the /salon/products page UI');
        console.log('   or run the create product script.');
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // ============================================================================
  // TEST 3: Read products WITH relationships (STOCK_AT branches)
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 3: Read Products - WITH Relationships (Branch Stock)');
  console.log('═'.repeat(70) + '\n');

  console.log('🔍 This matches branch filtering in useHeraProducts\n');

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
        limit: 10,
        include_dynamic: true,
        include_relationships: true  // Include STOCK_AT relationships
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
      const count = Array.isArray(items) ? items.length : 0;

      console.log(`✅ Retrieved ${count} products`);
      console.log(`⏱️  Time: ${elapsed}ms`);
      console.log(`📏 Response Size: ${JSON.stringify(data).length} bytes\n`);

      if (count > 0 && Array.isArray(items)) {
        console.log('📦 Sample Product (with relationships):\n');
        const product = items[0];

        console.log(`   Name: ${product.entity_name}`);

        // Check relationships
        if (product.relationships) {
          console.log(`\n   🔗 Relationships:`);

          const relTypes = ['STOCK_AT', 'stock_at', 'HAS_CATEGORY', 'has_category'];
          relTypes.forEach(relType => {
            if (product.relationships[relType]) {
              const rels = Array.isArray(product.relationships[relType])
                ? product.relationships[relType]
                : [product.relationships[relType]];

              console.log(`      ${relType}: ${rels.length} relationship(s)`);

              rels.forEach((rel, idx) => {
                console.log(`         ${idx + 1}. ${rel.to_entity?.entity_name || rel.to_entity_id}`);
              });
            }
          });

          console.log(`\n      All relationship keys:`, Object.keys(product.relationships));
        } else {
          console.log(`   ⚠️  No relationships found`);
        }

        console.log(`\n   📦 Full Product with Relationships:\n`);
        console.log(JSON.stringify(product, null, 4));
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // ============================================================================
  // COMPARISON SUMMARY
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('COMPARISON: Current Pattern vs RPC V2');
  console.log('═'.repeat(70) + '\n');

  console.log('📊 Current Pattern (useHeraProducts → useUniversalEntity):');
  console.log('   1. Call getEntities RPC with entity_type: "product"');
  console.log('   2. Fetch dynamic data for all products (separate API call)');
  console.log('   3. Client-side merge of dynamic fields into products');
  console.log('   4. Client-side filtering by branch using STOCK_AT relationships');
  console.log('   Total: 2 API calls + client processing\n');

  console.log('📊 RPC V2 Pattern (hera_entities_crud_v2):');
  console.log('   1. Single RPC call with include_dynamic: true');
  console.log('   2. Server returns merged entity with all dynamic fields');
  console.log('   3. Optional include_relationships for STOCK_AT filtering');
  console.log('   Total: 1 API call (server-side processing)\n');

  console.log('✨ Key Differences:');
  console.log('   • RPC V2: 50% fewer API calls (2 → 1)');
  console.log('   • RPC V2: Server-side data merging (faster)');
  console.log('   • RPC V2: Consistent response format');
  console.log('   • RPC V2: Built-in pagination with cursor');
  console.log('   • RPC V2: Mandatory actor tracking for audit\n');

  console.log('🎯 Expected Dynamic Fields in Response:');
  console.log('   price_market: 99.99');
  console.log('   price_cost: 50.00');
  console.log('   stock_quantity: 100');
  console.log('   reorder_level: 10');
  console.log('   barcode_primary: "1234567890"');
  console.log('   sku: "PROD-001"');
  console.log('   size: "500ml"\n');

  console.log('═'.repeat(70));
  console.log('Test Complete!');
  console.log('═'.repeat(70) + '\n');
}

testProductRead().catch(console.error);
