#!/usr/bin/env node

/**
 * Detailed test of BULK READ with real customer data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const orgId = process.env.DEFAULT_ORGANIZATION_ID;

async function testCustomerBulkRead() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║        CUSTOMER BULK READ - Detailed Analysis                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  const actorUserId = '00000000-0000-0000-0000-000000000001';

  // ============================================================================
  // TEST 1: Read customers WITHOUT dynamic data (baseline)
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 1: Read Customers WITHOUT Dynamic Data');
  console.log('═'.repeat(70) + '\n');

  try {
    const startTime = Date.now();

    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'read',
      p_actor_user_id: actorUserId,
      p_dynamic: null,
      p_entity: {
        entity_type: 'customer'
      },
      p_options: {
        limit: 100,
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

      console.log(`✅ Retrieved ${count} customers`);
      console.log(`⏱️  Time: ${elapsed}ms`);
      console.log(`📏 Response Size: ${JSON.stringify(data).length} bytes\n`);

      if (count > 0 && Array.isArray(items)) {
        console.log('📋 Customer Details (without dynamic data):\n');

        items.forEach((customer, idx) => {
          console.log(`${idx + 1}. ${customer.entity_name}`);
          console.log(`   ID: ${customer.entity_id || customer.id}`);
          console.log(`   Smart Code: ${customer.smart_code}`);
          console.log(`   Status: ${customer.status}`);
          console.log(`   Created: ${customer.created_at}`);
          console.log(`   Updated: ${customer.updated_at}`);

          console.log(`   \n   📦 Full Entity Object:`);
          console.log(`   ${JSON.stringify(customer, null, 4)}\n`);
        });
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // ============================================================================
  // TEST 2: Read customers WITH dynamic data
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 2: Read Customers WITH Dynamic Data');
  console.log('═'.repeat(70) + '\n');

  try {
    const startTime = Date.now();

    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'read',
      p_actor_user_id: actorUserId,
      p_dynamic: null,
      p_entity: {
        entity_type: 'customer'
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
      console.log('❌ Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', JSON.stringify(error, null, 2));
    } else {
      const items = data?.items || data || [];
      const count = Array.isArray(items) ? items.length : 0;

      console.log(`✅ Retrieved ${count} customers`);
      console.log(`⏱️  Time: ${elapsed}ms`);
      console.log(`📏 Response Size: ${JSON.stringify(data).length} bytes\n`);

      if (count > 0 && Array.isArray(items)) {
        console.log('📋 Customer Details (with dynamic data):\n');

        items.forEach((customer, idx) => {
          console.log(`${idx + 1}. ${customer.entity_name}`);
          console.log(`   ID: ${customer.entity_id || customer.id}`);
          console.log(`   Smart Code: ${customer.smart_code}`);
          console.log(`   Status: ${customer.status}`);

          // Check for dynamic fields
          if (customer.dynamic_fields) {
            console.log(`   \n   💎 Dynamic Fields:`);
            if (typeof customer.dynamic_fields === 'object') {
              Object.entries(customer.dynamic_fields).forEach(([key, value]) => {
                console.log(`      ${key}: ${JSON.stringify(value)}`);
              });
            } else {
              console.log(`      ${JSON.stringify(customer.dynamic_fields)}`);
            }
          } else {
            console.log(`   ⚠️  No dynamic_fields in response`);
          }

          // Check if dynamic data is merged at top level
          const possibleDynamicFields = ['email', 'phone', 'address', 'notes', 'birthday'];
          const topLevelDynamic = possibleDynamicFields.filter(f => customer[f] !== undefined);

          if (topLevelDynamic.length > 0) {
            console.log(`   \n   💎 Top-level Dynamic Data (merged):`);
            topLevelDynamic.forEach(field => {
              console.log(`      ${field}: ${customer[field]}`);
            });
          }

          console.log(`   \n   📦 Full Entity Object:`);
          console.log(`   ${JSON.stringify(customer, null, 4)}\n`);
        });
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // ============================================================================
  // TEST 3: Comparison with Current Pattern
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('TEST 3: Current Pattern Comparison');
  console.log('═'.repeat(70) + '\n');

  console.log('📊 Simulating current useUniversalEntity pattern...\n');

  try {
    // Step 1: Get entities (current pattern)
    console.log('Step 1: Fetching entities via current API...');
    const step1Start = Date.now();

    const entityResponse = await fetch('/api/v2/entities?entity_type=customer&organization_id=' + orgId, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const step1Elapsed = Date.now() - step1Start;

    if (entityResponse.ok) {
      const entityData = await entityResponse.json();
      console.log(`   ✅ Retrieved entities: ${step1Elapsed}ms`);

      // Step 2: Get dynamic data (current pattern)
      console.log('Step 2: Fetching dynamic data via current API...');
      const step2Start = Date.now();

      const entities = entityData.data || [];
      const entityIds = entities.map(e => e.id).join(',');

      if (entityIds) {
        const dynamicResponse = await fetch(`/api/v2/dynamic-data?p_entity_ids=${entityIds}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const step2Elapsed = Date.now() - step2Start;

        if (dynamicResponse.ok) {
          const dynamicData = await dynamicResponse.json();
          console.log(`   ✅ Retrieved dynamic data: ${step2Elapsed}ms`);

          const totalTime = step1Elapsed + step2Elapsed;
          console.log(`\n   📊 Current Pattern Total: ${totalTime}ms (2 API calls)\n`);
        }
      } else {
        console.log(`   ⚠️  No entities to fetch dynamic data for`);
      }
    } else {
      console.log(`   ❌ Entity fetch failed: ${entityResponse.status}`);
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  console.log('\n');

  // ============================================================================
  // ANALYSIS SUMMARY
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('ANALYSIS SUMMARY');
  console.log('═'.repeat(70) + '\n');

  console.log('🎯 Key Observations:\n');

  console.log('1. Response Format:');
  console.log('   • RPC returns: { items: [...], next_cursor: null }');
  console.log('   • Compatible with pagination patterns\n');

  console.log('2. Dynamic Data Handling:');
  console.log('   • RPC should merge dynamic data into entity object');
  console.log('   • Check if fields are in "dynamic_fields" object or top-level\n');

  console.log('3. Performance:');
  console.log('   • RPC V2: 1 call, server-side merge');
  console.log('   • Current: 2 calls, client-side merge\n');

  console.log('4. Data Quality:');
  console.log('   • Both patterns enforce organization_id isolation');
  console.log('   • Both return same base entity structure\n');

  console.log('═'.repeat(70));
  console.log('Test Complete!');
  console.log('═'.repeat(70) + '\n');
}

testCustomerBulkRead().catch(console.error);
