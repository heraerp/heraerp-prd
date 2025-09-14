#!/usr/bin/env node

/**
 * 🔍 Find Exact Smart Code Constraint by Testing Variations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'; // Known working org

async function findExactConstraint() {
  console.log('🔍 Finding Exact Smart Code Constraint by Testing Variations\n');

  // Test 1: Use exact working pattern
  console.log('🧪 Test 1: Exact Working Pattern');
  await testPattern('HERA.FURNITURE.PRODUCT.CHAIR.EXECUTIVE.v1', 'Known working pattern');

  // Test 2: Change only the industry
  console.log('\n🧪 Test 2: Change Only Industry');
  const industryTests = [
    'HERA.ISP.PRODUCT.CHAIR.EXECUTIVE.v1',
    'HERA.TELECOM.PRODUCT.CHAIR.EXECUTIVE.v1',
    'HERA.RESTAURANT.PRODUCT.CHAIR.EXECUTIVE.v1',
    'HERA.SALON.PRODUCT.CHAIR.EXECUTIVE.v1'
  ];
  
  for (const pattern of industryTests) {
    await testPattern(pattern, 'Industry variation');
    await delay(200); // Small delay between tests
  }

  // Test 3: Change only the product category
  console.log('\n🧪 Test 3: Change Product Category');
  const categoryTests = [
    'HERA.FURNITURE.PRODUCT.TABLE.EXECUTIVE.v1',
    'HERA.FURNITURE.PRODUCT.SOFA.EXECUTIVE.v1',
    'HERA.FURNITURE.PRODUCT.BROADBAND.EXECUTIVE.v1'
  ];
  
  for (const pattern of categoryTests) {
    await testPattern(pattern, 'Category variation');
    await delay(200);
  }

  // Test 4: Change only the subtype
  console.log('\n🧪 Test 4: Change Subtype');
  const subtypeTests = [
    'HERA.FURNITURE.PRODUCT.CHAIR.DINING.v1',
    'HERA.FURNITURE.PRODUCT.CHAIR.OFFICE.v1',
    'HERA.FURNITURE.PRODUCT.CHAIR.PREMIUM.v1'
  ];
  
  for (const pattern of subtypeTests) {
    await testPattern(pattern, 'Subtype variation');
    await delay(200);
  }

  // Test 5: Try customer patterns
  console.log('\n🧪 Test 5: Customer Patterns');
  const customerTests = [
    'HERA.FURNITURE.CUSTOMER.RETAIL.v1',
    'HERA.ISP.CUSTOMER.RETAIL.v1',
    'HERA.FURNITURE.CUSTOMER.CORPORATE.v1'
  ];
  
  for (const pattern of customerTests) {
    await testPattern(pattern, 'Customer pattern');
    await delay(200);
  }

  // Test 6: Different segment counts
  console.log('\n🧪 Test 6: Different Segment Counts');
  const segmentTests = [
    'HERA.FURNITURE.PRODUCT.v1',                    // 4 segments
    'HERA.FURNITURE.PRODUCT.CHAIR.v1',              // 5 segments
    'HERA.FURNITURE.PRODUCT.CHAIR.EXECUTIVE.v1',    // 6 segments (working)
    'HERA.FURNITURE.PRODUCT.CHAIR.EXECUTIVE.PREMIUM.v1', // 7 segments
  ];
  
  for (const pattern of segmentTests) {
    await testPattern(pattern, `${pattern.split('.').length} segments`);
    await delay(200);
  }

  console.log('\n📊 Summary: Finding patterns that work vs fail...');
}

async function testPattern(smartCode, description) {
  try {
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: FURNITURE_ORG_ID,
        entity_type: 'product',
        entity_name: `Test ${description}`,
        entity_code: `TEST-${Date.now()}`,
        smart_code: smartCode,
        metadata: { test_pattern: true }
      })
      .select('id, smart_code')
      .single();

    if (error) {
      console.log(`  ❌ ${smartCode} - ${error.message.substring(0, 80)}...`);
      return false;
    } else {
      console.log(`  ✅ ${smartCode} - SUCCESS!`);
      
      // Clean up test data
      await supabase.from('core_entities').delete().eq('id', data.id);
      return true;
    }
  } catch (err) {
    console.log(`  ❌ ${smartCode} - ${err.message.substring(0, 80)}...`);
    return false;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the constraint discovery
findExactConstraint().catch(console.error);