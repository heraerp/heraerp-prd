#!/usr/bin/env node

/**
 * Test Universal API v2 RPC Entity Read Function
 * Tests the hera_entity_read_v1 RPC function to fetch salon services
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = '/api/v2/universal/entity-read';

// Test parameters - Using Hair Talkz Salon (confirmed has services)
const testParams = {
  organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0', // Hair Talkz Salon - DNA Testing
  entity_type: 'service',
  limit: 5,
  include_dynamic_data: true,
  status: 'active'
};

async function testEntityRead() {
  console.log('🧪 Testing Universal API v2 RPC Entity Read Function');
  console.log('=' . repeat(60));

  // Build query string
  const queryParams = new URLSearchParams(testParams);
  const url = `${API_BASE_URL}${API_ENDPOINT}?${queryParams}`;

  console.log('\n📍 Endpoint:', API_ENDPOINT);
  console.log('📋 Parameters:', testParams);
  console.log('🔗 Full URL:', url);
  console.log('\n' + '=' . repeat(60));

  try {
    console.log('\n🚀 Making API request...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    console.log('\n📊 Response Status:', response.status);
    console.log('✅ Response received successfully\n');

    if (data.error) {
      console.error('❌ Error in response:', data.error);
      console.error('Message:', data.message);
      return;
    }

    // Display results
    console.log('🎯 API Version:', data.api_version);
    console.log('✨ Success:', data.success);

    if (data.data && Array.isArray(data.data)) {
      console.log(`\n📦 Found ${data.data.length} salon service(s):\n`);

      data.data.forEach((service, index) => {
        console.log(`${index + 1}. Service: ${service.entity_name}`);
        console.log(`   - ID: ${service.id}`);
        console.log(`   - Code: ${service.entity_code || 'N/A'}`);
        console.log(`   - Smart Code: ${service.smart_code}`);
        console.log(`   - Type: ${service.entity_type}`);

        // Show metadata if available
        if (service.metadata) {
          console.log(`   - Metadata:`, JSON.stringify(service.metadata, null, 2));
        }

        // Show dynamic data if included
        if (service.dynamic_data && service.dynamic_data.length > 0) {
          console.log(`   - Dynamic Fields:`);
          service.dynamic_data.forEach(field => {
            const value = field.field_value_text || field.field_value_number ||
                         field.field_value_date || field.field_value_boolean;
            console.log(`     • ${field.field_name}: ${value}`);
          });
        }

        console.log('   ' + '-'.repeat(40));
      });

      // Show pagination info if available
      if (data.total_count !== undefined) {
        console.log(`\n📄 Pagination Info:`);
        console.log(`   - Total Records: ${data.total_count}`);
        console.log(`   - Limit: ${testParams.limit}`);
        console.log(`   - Offset: 0`);
      }

    } else if (data.data) {
      // Single entity response
      console.log('\n📦 Single entity found:');
      console.log(JSON.stringify(data.data, null, 2));
    } else {
      console.log('\n⚠️ No data returned');
    }

    console.log('\n' + '=' . repeat(60));
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Alternative test: Direct RPC function call using Supabase
async function testDirectRPC() {
  console.log('\n\n🧪 Testing Direct RPC Function Call');
  console.log('=' . repeat(60));

  try {
    // Load environment and Supabase
    require('dotenv').config();
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️ Supabase credentials not found in environment');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('\n🔌 Calling RPC function: hera_entity_read_v1');
    console.log('📋 Parameters:', {
      p_organization_id: testParams.organization_id,
      p_entity_type: 'service',
      p_limit: 5,
      p_include_dynamic_data: true
    });

    const { data, error } = await supabase.rpc('hera_entity_read_v1', {
      p_organization_id: testParams.organization_id,
      p_entity_type: 'service',
      p_entity_code: null,
      p_entity_id: null,
      p_smart_code: null,
      p_status: 'active',
      p_include_relationships: false,
      p_include_dynamic_data: true,
      p_limit: 5,
      p_offset: 0
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      return;
    }

    console.log('\n✅ RPC call successful!');
    console.log(`📦 Found ${data?.data?.length || 0} service(s)`);

    if (data?.data && data.data.length > 0) {
      console.log('\nServices:');
      data.data.forEach((service, i) => {
        console.log(`${i + 1}. ${service.entity_name} (${service.smart_code})`);
      });
    }

  } catch (error) {
    console.error('❌ Direct RPC test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  // Test via API endpoint
  await testEntityRead();

  // Test direct RPC call
  await testDirectRPC();
}

// Execute
runTests().catch(console.error);