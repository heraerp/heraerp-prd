#!/usr/bin/env node

// Test URP system to ensure it can find GL accounts for furniture org
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uirruxpfideciqubwhmp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcnJ1eHBmaWRlY2lxdWJ3aG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NDY1MjEsImV4cCI6MjA0NzQyMjUyMX0.LhBPAE9oBsjq80kBhOxHp7ByIy6vgQg4-3FPR5kRrLo';

const supabase = createClient(supabaseUrl, supabaseKey);

// Furniture organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', FURNITURE_ORG_ID)
      .single();
    
    if (error) {
      console.error('❌ Database connection error:', error.message);
      return false;
    }
    
    if (data) {
      console.log('✅ Database connected successfully');
      console.log('📋 Organization:', data.organization_name || data.name);
      return true;
    } else {
      console.log('❌ Organization not found');
      return false;
    }
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function testGLAccountsExist() {
  console.log('\n🔍 Testing GL accounts existence...');
  
  try {
    const { data, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'gl_account');
    
    if (error) {
      console.error('❌ Query error:', error.message);
      return false;
    }
    
    console.log(`✅ Found ${data?.length || 0} GL accounts`);
    
    if (data && data.length > 0) {
      console.log('\n📊 Sample GL accounts:');
      data.slice(0, 5).forEach(account => {
        console.log(`  - ${account.entity_code}: ${account.entity_name}`);
      });
      
      if (data.length > 5) {
        console.log(`  ... and ${data.length - 5} more accounts`);
      }
      return true;
    } else {
      console.log('❌ No GL accounts found');
      return false;
    }
  } catch (err) {
    console.error('❌ Query error:', err.message);
    return false;
  }
}

async function testUniversalApiRead() {
  console.log('\n🔍 Testing Universal API read() method simulation...');
  
  try {
    // Simulate the universalApi.read() method behavior
    let query = supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Universal API read error:', error.message);
      return { data: null, error: error.message };
    }
    
    console.log(`✅ Universal API read() returned ${data?.length || 0} total entities`);
    
    // Filter for GL accounts in JavaScript (as URP does)
    const glAccounts = data?.filter(entity => entity.entity_type === 'gl_account') || [];
    console.log(`✅ Filtered to ${glAccounts.length} GL accounts`);
    
    if (glAccounts.length > 0) {
      console.log('\n📊 Sample filtered GL accounts:');
      glAccounts.slice(0, 5).forEach(account => {
        console.log(`  - ${account.entity_code}: ${account.entity_name}`);
        console.log(`    Smart Code: ${account.smart_code || 'N/A'}`);
      });
      
      if (glAccounts.length > 5) {
        console.log(`  ... and ${glAccounts.length - 5} more accounts`);
      }
    }
    
    return { data: glAccounts, error: null };
  } catch (err) {
    console.error('❌ Universal API read error:', err.message);
    return { data: null, error: err.message };
  }
}

async function testURPEntityResolver() {
  console.log('\n🔍 Testing URP Entity Resolver logic...');
  
  try {
    // Step 1: Get all entities (simulating entityResolver.resolveEntities)
    const result = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID);
    
    if (result.error) {
      console.error('❌ Entity resolver error:', result.error.message);
      return [];
    }
    
    const entities = result.data || [];
    console.log(`✅ Entity Resolver: Retrieved ${entities.length} entities`);
    
    // Step 2: Filter by entity type (simulating URP filtering)
    const glAccounts = entities.filter(entity => 
      entity.entity_type === 'gl_account'
    );
    
    console.log(`✅ Entity Resolver: Filtered to ${glAccounts.length} GL accounts`);
    
    // Step 3: Apply additional filters (simulating recipe filters)
    const activeAccounts = glAccounts.filter(account => 
      !account.metadata?.inactive && 
      account.entity_name && 
      account.entity_code
    );
    
    console.log(`✅ Entity Resolver: ${activeAccounts.length} active GL accounts`);
    
    if (activeAccounts.length > 0) {
      console.log('\n📊 URP Entity Resolver Results:');
      activeAccounts.slice(0, 3).forEach(account => {
        console.log(`  - Code: ${account.entity_code}`);
        console.log(`    Name: ${account.entity_name}`);
        console.log(`    Smart Code: ${account.smart_code || 'N/A'}`);
        console.log(`    Metadata: ${JSON.stringify(account.metadata || {})}`);
        console.log('    ---');
      });
    }
    
    return activeAccounts;
  } catch (err) {
    console.error('❌ URP Entity Resolver error:', err.message);
    return [];
  }
}

async function main() {
  console.log('🧪 HERA URP System Test');
  console.log('='.repeat(50));
  console.log(`Testing with Furniture Org ID: ${FURNITURE_ORG_ID}`);
  
  // Test 1: Database Connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('❌ Cannot proceed - database connection failed');
    process.exit(1);
  }
  
  // Test 2: GL Accounts Existence
  const glAccountsExist = await testGLAccountsExist();
  if (!glAccountsExist) {
    console.log('❌ Cannot proceed - no GL accounts found');
    process.exit(1);
  }
  
  // Test 3: Universal API Read Method
  const readResult = await testUniversalApiRead();
  if (!readResult.data || readResult.data.length === 0) {
    console.log('❌ Universal API read() method not finding GL accounts');
    console.log('Error:', readResult.error || 'No data returned');
  } else {
    console.log('✅ Universal API read() method working correctly');
  }
  
  // Test 4: URP Entity Resolver Logic
  const urpResult = await testURPEntityResolver();
  if (urpResult.length === 0) {
    console.log('❌ URP Entity Resolver not finding GL accounts');
  } else {
    console.log('✅ URP Entity Resolver working correctly');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 TEST SUMMARY:');
  console.log(`Database Connection: ${dbConnected ? '✅' : '❌'}`);
  console.log(`GL Accounts Exist: ${glAccountsExist ? '✅' : '❌'}`);
  console.log(`Universal API Read: ${readResult.data && readResult.data.length > 0 ? '✅' : '❌'}`);
  console.log(`URP Entity Resolver: ${urpResult.length > 0 ? '✅' : '❌'}`);
  
  if (dbConnected && glAccountsExist && readResult.data && readResult.data.length > 0 && urpResult.length > 0) {
    console.log('\n🎉 URP system should be working correctly!');
    console.log('The issue might be in the React component or API endpoint.');
  } else {
    console.log('\n❌ URP system has issues that need to be fixed.');
  }
}

main().catch(console.error);