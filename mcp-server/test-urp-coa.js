#!/usr/bin/env node

/**
 * Test URP Chart of Accounts Recipe
 * Tests the Universal Report Pattern with furniture organization GL accounts
 */

const { UniversalReportEngine } = require('../src/lib/dna/urp/report-engine');
const { universalApi } = require('../src/lib/universal-api');
const { supabase } = require('../src/lib/supabase');

const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

async function testDirectQuery() {
  console.log('\n=== Testing Direct Supabase Query ===');
  
  try {
    // Test 1: Direct query to see if GL accounts exist
    const { data: glAccounts, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'gl_account')
      .limit(5);
      
    if (error) {
      console.error('Direct query error:', error);
      return false;
    }
    
    console.log(`Found ${glAccounts?.length || 0} GL accounts for furniture org`);
    if (glAccounts && glAccounts.length > 0) {
      console.log('Sample GL account:', {
        id: glAccounts[0].id,
        entity_code: glAccounts[0].entity_code,
        entity_name: glAccounts[0].entity_name,
        smart_code: glAccounts[0].smart_code
      });
    }
    
    return glAccounts && glAccounts.length > 0;
  } catch (error) {
    console.error('Direct query exception:', error);
    return false;
  }
}

async function testUniversalApiRead() {
  console.log('\n=== Testing UniversalAPI Read Method ===');
  
  try {
    // Set organization context
    universalApi.setOrganizationId(FURNITURE_ORG_ID);
    
    // Test read method
    const result = await universalApi.read({ table: 'core_entities' });
    console.log('UniversalAPI read result structure:', {
      hasData: !!result.data,
      dataLength: result.data?.length || 0,
      error: result.error
    });
    
    // Filter for GL accounts
    if (result.data) {
      const glAccounts = result.data.filter(e => e.entity_type === 'gl_account');
      console.log(`Filtered ${glAccounts.length} GL accounts from ${result.data.length} total entities`);
      
      if (glAccounts.length > 0) {
        console.log('Sample GL account from universalApi:', {
          entity_code: glAccounts[0].entity_code,
          entity_name: glAccounts[0].entity_name
        });
      }
    }
    
    return result.data && result.data.length > 0;
  } catch (error) {
    console.error('UniversalAPI read exception:', error);
    return false;
  }
}

async function testURPPrimitive() {
  console.log('\n=== Testing URP Entity Resolver Primitive ===');
  
  try {
    // Import primitives directly
    const { EntityResolver } = require('../src/lib/dna/urp/primitives/urp-primitives');
    
    const resolver = new EntityResolver({
      organizationId: FURNITURE_ORG_ID,
      smartCodePrefix: 'HERA.URP'
    });
    
    const entities = await resolver.resolve({
      entityType: 'gl_account',
      includeDynamicData: true
    });
    
    console.log(`Entity Resolver found ${entities.length} GL accounts`);
    
    if (entities.length > 0) {
      console.log('Sample resolved GL account:', {
        entity_code: entities[0].entity_code,
        entity_name: entities[0].entity_name,
        dynamicData: entities[0].dynamicData?.length || 0
      });
    }
    
    return entities.length > 0;
  } catch (error) {
    console.error('Entity Resolver exception:', error);
    return false;
  }
}

async function testURPEngine() {
  console.log('\n=== Testing URP Report Engine ===');
  
  try {
    const reportEngine = new UniversalReportEngine({
      organizationId: FURNITURE_ORG_ID,
      smartCodePrefix: 'HERA.URP',
      enableCaching: false, // Disable cache for testing
      cacheTTL: 0
    });
    
    // Check available recipes
    const recipes = reportEngine.getAvailableRecipes();
    console.log(`Available recipes: ${recipes.length}`);
    const coaRecipe = recipes.find(r => r.name === 'HERA.URP.RECIPE.FINANCE.COA.v1');
    console.log('COA Recipe found:', !!coaRecipe);
    
    // Execute COA recipe
    console.log('\nExecuting Chart of Accounts recipe...');
    const result = await reportEngine.executeRecipe(
      'HERA.URP.RECIPE.FINANCE.COA.v1',
      {
        fiscalYear: 2024,
        includeInactive: false,
        hierarchyDepth: 5
      }
    );
    
    console.log('Recipe execution result:', {
      isArray: Array.isArray(result),
      length: Array.isArray(result) ? result.length : 'N/A',
      type: typeof result
    });
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('\nFirst account in hierarchy:', {
        accountCode: result[0].accountCode,
        entity_name: result[0].entity_name,
        accountType: result[0].accountType,
        hasChildren: result[0].children?.length > 0
      });
    }
    
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error('URP Engine exception:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

async function testRelationships() {
  console.log('\n=== Testing GL Account Relationships ===');
  
  try {
    const { data: relationships, error } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('relationship_type', 'parent_of')
      .limit(5);
      
    console.log(`Found ${relationships?.length || 0} parent-child relationships`);
    
    if (relationships && relationships.length > 0) {
      console.log('Sample relationship:', {
        from_entity_id: relationships[0].from_entity_id,
        to_entity_id: relationships[0].to_entity_id,
        relationship_type: relationships[0].relationship_type
      });
    }
    
    return relationships && relationships.length > 0;
  } catch (error) {
    console.error('Relationships query error:', error);
    return false;
  }
}

async function main() {
  console.log('Testing URP Chart of Accounts for Furniture Organization');
  console.log('Organization ID:', FURNITURE_ORG_ID);
  
  const results = {
    directQuery: await testDirectQuery(),
    universalApiRead: await testUniversalApiRead(),
    urpPrimitive: await testURPPrimitive(),
    relationships: await testRelationships(),
    urpEngine: await testURPEngine()
  };
  
  console.log('\n=== Test Results Summary ===');
  console.log('Direct Supabase Query:', results.directQuery ? '✅ PASS' : '❌ FAIL');
  console.log('UniversalAPI Read:', results.universalApiRead ? '✅ PASS' : '❌ FAIL');
  console.log('URP Entity Resolver:', results.urpPrimitive ? '✅ PASS' : '❌ FAIL');
  console.log('GL Relationships:', results.relationships ? '✅ PASS' : '❌ FAIL');
  console.log('URP Report Engine:', results.urpEngine ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(r => r === true);
  console.log('\nOverall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);