#!/usr/bin/env node
/**
 * Test HERA MCP Server Connection
 * Verifies that the MCP server can connect to Supabase and query the universal tables
 */

require('dotenv').config();

async function testConnection() {
  console.log('🔧 Testing HERA MCP Server Connection...\n');
  
  // Import Supabase
  const { createClient } = await import('@supabase/supabase-js');
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
  
  console.log('📡 Supabase URL:', process.env.SUPABASE_URL);
  console.log('🔑 Using Service Role Key: Yes');
  console.log('🏢 Default Organization:', process.env.DEFAULT_ORGANIZATION_ID || 'hera_software_inc');
  console.log('\n---\n');
  
  // Test each of the 6 sacred tables
  const tables = [
    'core_organizations',
    'core_entities',
    'core_dynamic_data',
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
  ];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Table accessible (query successful)`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
  
  console.log('\n---\n');
  
  // Try to fetch organizations
  try {
    const { data: orgs, error } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_code')
      .limit(5);
    
    if (error) {
      console.log('❌ Could not fetch organizations:', error.message);
    } else if (orgs && orgs.length > 0) {
      console.log('📊 Sample Organizations:');
      orgs.forEach(org => {
        console.log(`   - ${org.organization_name} (${org.organization_code || org.id})`);
      });
    } else {
      console.log('ℹ️ No organizations found in database');
    }
  } catch (e) {
    console.log('❌ Error fetching organizations:', e.message);
  }
  
  console.log('\n---\n');
  console.log('🎯 MCP Server Connection Test Complete!');
  console.log('\nNext steps:');
  console.log('1. Restart Claude Desktop app');
  console.log('2. Check the MCP menu (bottom right) to see "hera-universal" server');
  console.log('3. Use HERA tools in your conversations!');
}

testConnection().catch(console.error);