#!/usr/bin/env node

/**
 * Direct test without RPC function - using plain Supabase queries
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDirectQuery() {
  console.log('🧪 Testing Direct Supabase Query for Hair Talkz Services');
  console.log('=' . repeat(60));

  const HAIR_TALKZ_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

  try {
    // Direct query to get services
    const { data: services, error } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_name,
        entity_code,
        entity_type,
        smart_code,
        metadata,
        created_at
      `)
      .eq('organization_id', HAIR_TALKZ_ORG_ID)
      .eq('entity_type', 'service')
      .limit(5)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Query Error:', error);
      return;
    }

    console.log(`\n✅ Found ${services.length} services:\n`);

    services.forEach((service, i) => {
      console.log(`${i + 1}. ${service.entity_name}`);
      console.log(`   Code: ${service.entity_code || 'N/A'}`);
      console.log(`   Smart Code: ${service.smart_code}`);
      console.log(`   Created: ${new Date(service.created_at).toLocaleDateString()}`);
      console.log();
    });

    // Get dynamic data (prices) for these services
    console.log('📊 Getting service prices from dynamic data...');
    console.log('-' . repeat(40));

    const serviceIds = services.map(s => s.id);

    const { data: prices, error: priceError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_number, field_value_text')
      .in('entity_id', serviceIds)
      .eq('field_name', 'base_price');

    if (prices && prices.length > 0) {
      console.log('\n💰 Service Prices:');
      prices.forEach(price => {
        const service = services.find(s => s.id === price.entity_id);
        if (service) {
          const amount = price.field_value_number || price.field_value_text;
          console.log(`   ${service.entity_name}: AED ${amount}`);
        }
      });
    } else {
      console.log('ℹ️ No price data found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '=' . repeat(60));
  console.log('✅ Direct query test completed!');
}

// Test using Universal API v2 class
async function testUniversalAPIv2() {
  console.log('\n\n🧪 Testing Universal API v2 Class');
  console.log('=' . repeat(60));

  try {
    const { UniversalAPIv2 } = require('./src/lib/universal-api-v2');

    const api = new UniversalAPIv2();
    api.setOrganizationId('0fd09e31-d257-4329-97eb-7d7f522ed6f0');

    const result = await api.getEntities({
      filters: { entity_type: 'service' },
      pageSize: 5
    });

    if (result.success) {
      console.log(`\n✅ API v2 Success! Found ${result.data?.length || 0} services`);

      if (result.data && result.data.length > 0) {
        console.log('\nServices:');
        result.data.forEach((service, i) => {
          console.log(`${i + 1}. ${service.entity_name} (${service.entity_code || 'no code'})`);
        });
      }
    } else {
      console.log('❌ API v2 Error:', result.error);
    }

  } catch (error) {
    console.log('⚠️ Could not load Universal API v2 class:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testDirectQuery();
  await testUniversalAPIv2();
}

runAllTests().catch(console.error);