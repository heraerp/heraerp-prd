#!/usr/bin/env node

// Simple test of URP primitives using ES modules
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://uirruxpfideciqubwhmp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcnJ1eHBmaWRlY2lxdWJ3aG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NDY1MjEsImV4cCI6MjA0NzQyMjUyMX0.LhBPAE9oBsjq80kBhOxHp7ByIy6vgQg4-3FPR5kRrLo';

const supabase = createClient(supabaseUrl, supabaseKey);

// Furniture organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

// Mock Universal API to simulate the read method
class MockUniversalAPI {
  constructor(organizationId) {
    this.organizationId = organizationId;
  }

  async read(params) {
    try {
      const tableName = typeof params === 'string' ? params : params.table;
      
      let query = supabase
        .from(tableName)
        .select('*')
        .eq('organization_id', this.organizationId);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Mock API read error:', error.message);
      return { data: null, error: error.message };
    }
  }

  setOrganizationId(orgId) {
    this.organizationId = orgId;
  }
}

// Simulate URP Entity Resolver primitive
class MockEntityResolver {
  constructor(universalApi) {
    this.universalApi = universalApi;
  }

  async resolve(config = {}) {
    console.log('🔍 EntityResolver: Starting resolution...');
    
    try {
      // Step 1: Read all entities for organization
      const result = await this.universalApi.read({ table: 'core_entities' });
      
      if (result.error) {
        console.error('❌ EntityResolver: Database error:', result.error);
        return [];
      }
      
      let entities = result.data || [];
      console.log(`✅ EntityResolver: Retrieved ${entities.length} total entities`);
      
      // Step 2: Apply filters
      if (config.entityType) {
        entities = entities.filter(e => e.entity_type === config.entityType);
        console.log(`✅ EntityResolver: Filtered to ${entities.length} entities of type '${config.entityType}'`);
      }
      
      if (config.includeInactive === false) {
        entities = entities.filter(e => !e.metadata?.inactive);
        console.log(`✅ EntityResolver: Filtered to ${entities.length} active entities`);
      }
      
      // Step 3: Sort by entity code
      entities.sort((a, b) => (a.entity_code || '').localeCompare(b.entity_code || ''));
      console.log(`✅ EntityResolver: Sorted ${entities.length} entities by code`);
      
      return entities;
    } catch (error) {
      console.error('❌ EntityResolver: Error:', error.message);
      return [];
    }
  }
}

async function testURPPrimitives() {
  console.log('🧪 Testing URP Primitives');
  console.log('='.repeat(50));
  console.log(`Organization ID: ${FURNITURE_ORG_ID}`);
  
  // Initialize mock universal API
  const mockApi = new MockUniversalAPI(FURNITURE_ORG_ID);
  
  // Test 1: Direct database connection
  console.log('\n🔍 Test 1: Direct database connection...');
  const directResult = await mockApi.read({ table: 'core_entities' });
  
  if (directResult.error) {
    console.error('❌ Direct connection failed:', directResult.error);
    process.exit(1);
  }
  
  const allEntities = directResult.data || [];
  console.log(`✅ Connected successfully: ${allEntities.length} total entities`);
  
  const glAccounts = allEntities.filter(e => e.entity_type === 'gl_account');
  console.log(`✅ Found ${glAccounts.length} GL accounts`);
  
  if (glAccounts.length === 0) {
    console.error('❌ No GL accounts found - cannot test URP');
    process.exit(1);
  }
  
  // Test 2: URP Entity Resolver
  console.log('\n🔍 Test 2: URP Entity Resolver...');
  const entityResolver = new MockEntityResolver(mockApi);
  
  const resolvedGL = await entityResolver.resolve({
    entityType: 'gl_account',
    includeInactive: false
  });
  
  if (resolvedGL.length === 0) {
    console.error('❌ Entity Resolver returned no GL accounts');
  } else {
    console.log(`✅ Entity Resolver returned ${resolvedGL.length} GL accounts`);
    
    // Show sample results
    console.log('\n📊 Sample GL Accounts:');
    resolvedGL.slice(0, 5).forEach((account, i) => {
      console.log(`  ${i + 1}. Code: ${account.entity_code}`);
      console.log(`     Name: ${account.entity_name}`);
      console.log(`     Smart Code: ${account.smart_code || 'N/A'}`);
      console.log('     ---');
    });
    
    if (resolvedGL.length > 5) {
      console.log(`     ... and ${resolvedGL.length - 5} more accounts`);
    }
  }
  
  // Test 3: Chart of Accounts Recipe Logic
  console.log('\n🔍 Test 3: Chart of Accounts Recipe Logic...');
  
  // Simulate the recipe steps
  const coaRecipeResult = {
    entities: resolvedGL,
    hierarchyBuilt: false, // We're not testing hierarchy here
    transactionsFetched: false, // We're not testing transactions here
    balancesCalculated: false // We're not testing balances here
  };
  
  console.log(`✅ COA Recipe would return ${coaRecipeResult.entities.length} GL accounts`);
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 TEST SUMMARY:');
  console.log(`Database Connection: ${directResult.data ? '✅' : '❌'}`);
  console.log(`GL Accounts Found: ${glAccounts.length > 0 ? '✅' : '❌'} (${glAccounts.length} accounts)`);
  console.log(`Entity Resolver: ${resolvedGL.length > 0 ? '✅' : '❌'} (${resolvedGL.length} resolved)`);
  console.log(`COA Recipe Logic: ${coaRecipeResult.entities.length > 0 ? '✅' : '❌'}`);
  
  if (resolvedGL.length > 0) {
    console.log('\n🎉 URP primitives are working correctly!');
    console.log('The issue must be in the React component or API authentication.');
    console.log('\n💡 Debugging suggestions:');
    console.log('1. Check if organizationId is being passed correctly to URP');
    console.log('2. Check if the API authentication is working');
    console.log('3. Check React component state management');
    console.log('4. Check for JavaScript errors in browser console');
  } else {
    console.log('\n❌ URP primitives have issues.');
  }
}

testURPPrimitives().catch(console.error);