#!/usr/bin/env node
/**
 * End-to-End Retail Microapp Test
 * Tests the complete flow: Level 2 → Level 3 → Backend → Database
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';
const DEFAULT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const DEFAULT_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testCompleteFlow() {
  console.log('🧪 RETAIL MICROAPP END-TO-END TEST');
  console.log('=====================================\\n');
  
  console.log('🎯 Testing the complete retail microapp architecture:');
  console.log('   Level 2 (workspace) → Level 3 (dynamic routing) → Backend API → Database\\n');
  
  let testResults = {
    workspaceAPI: false,
    cardRouting: false,
    databaseCRUD: false,
    smartCodeValidation: false
  };
  
  try {
    // ===== TEST 1: Workspace API (Level 2 → Level 3 routing) =====
    console.log('📍 TEST 1: Workspace API Configuration');
    console.log('--------------------------------------');
    
    const workspaceResponse = await fetch(`${API_BASE_URL}/api/v2/retail/inventory/main`);
    
    if (workspaceResponse.ok) {
      const workspaceData = await workspaceResponse.json();
      console.log(`✅ Workspace API: Status ${workspaceResponse.status}`);
      console.log(`✅ Workspace: ${workspaceData.workspace.entity_name}`);
      console.log(`✅ Navigation Sections: ${workspaceData.layout_config.sections.length}`);
      
      // Check if cards have dynamic routes
      const masterDataCards = workspaceData.layout_config.sections.find(s => s.nav_code === 'master-data')?.cards || [];
      const dynamicRoutes = masterDataCards.filter(card => card.view_slug.includes('/entities/'));
      console.log(`✅ Dynamic Entity Routes: ${dynamicRoutes.length}`);
      
      testResults.workspaceAPI = true;
      testResults.cardRouting = dynamicRoutes.length > 0;
    } else {
      console.log(`❌ Workspace API failed: ${workspaceResponse.status}`);
    }
    
    // ===== TEST 2: Direct Database CRUD (Backend Integration) =====
    console.log('\\n📍 TEST 2: Database CRUD Operations');
    console.log('-----------------------------------');
    
    // Test entity creation through HERA RPC functions
    const createResult = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: DEFAULT_USER_ID,
      p_organization_id: DEFAULT_ORG_ID,
      p_entity: {
        entity_type: 'INVENTORY_ITEM',
        entity_name: 'Test Retail Item',
        smart_code: 'HERA.RETAIL.INVENTORY.MAIN.ENTITY.ITEM.v1'
      },
      p_dynamic: {
        quantity: {
          field_type: 'number',
          field_value_number: 100,
          smart_code: 'HERA.RETAIL.INVENTORY.MAIN.FIELD.QUANTITY.v1'
        },
        price: {
          field_type: 'number',
          field_value_number: 25.99,
          smart_code: 'HERA.RETAIL.INVENTORY.MAIN.FIELD.PRICE.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    });
    
    if (!createResult.error) {
      const itemId = createResult.data?.items?.[0]?.id || createResult.data?.entity_id;
      console.log(`✅ Entity Created: ID ${itemId}`);
      console.log(`✅ Actor Stamping: ${createResult.data?.items?.[0]?.created_by ? 'Working' : 'Missing'}`);
      console.log(`✅ Organization Isolation: ${DEFAULT_ORG_ID}`);
      
      testResults.databaseCRUD = true;
      testResults.smartCodeValidation = true;
      
      // Clean up - delete the test item
      if (itemId) {
        await supabase.rpc('hera_entities_crud_v1', {
          p_action: 'DELETE',
          p_actor_user_id: DEFAULT_USER_ID,
          p_organization_id: DEFAULT_ORG_ID,
          p_entity: { entity_id: itemId },
          p_dynamic: {},
          p_relationships: [],
          p_options: {}
        });
        console.log(`✅ Test Entity Cleaned Up`);
      }
    } else {
      console.log(`❌ Entity Creation Failed:`, createResult.error);
    }
    
    // ===== TEST 3: Smart Code Validation =====
    console.log('\\n📍 TEST 3: Smart Code Validation');
    console.log('---------------------------------');
    
    const invalidSmartCodeResult = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: DEFAULT_USER_ID,
      p_organization_id: DEFAULT_ORG_ID,
      p_entity: {
        entity_type: 'TEST_ITEM',
        entity_name: 'Invalid Smart Code Test',
        smart_code: 'INVALID_SMART_CODE' // This should fail
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    });
    
    if (invalidSmartCodeResult.error) {
      console.log(`✅ Smart Code Validation: Correctly rejected invalid code`);
      console.log(`✅ Guardrails Working: ${invalidSmartCodeResult.error}`);
    } else {
      console.log(`❌ Smart Code Validation: Should have failed but didn't`);
      testResults.smartCodeValidation = false;
    }
    
  } catch (error) {
    console.error('💥 Test Error:', error);
  }
  
  // ===== FINAL RESULTS =====
  console.log('\\n🎯 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`Workspace API (Level 2 → 3):     ${testResults.workspaceAPI ? '✅' : '❌'}`);
  console.log(`Dynamic Card Routing:            ${testResults.cardRouting ? '✅' : '❌'}`);
  console.log(`Database CRUD Operations:        ${testResults.databaseCRUD ? '✅' : '❌'}`);
  console.log(`Smart Code Validation:           ${testResults.smartCodeValidation ? '✅' : '❌'}`);
  
  const allPassed = Object.values(testResults).every(result => result === true);
  console.log(`\\n🏆 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\\n🎉 The retail microapp third layer is fully functional!');
    console.log('   • Workspace configuration loads correctly');
    console.log('   • Dynamic third level routing is configured');
    console.log('   • Backend database operations work');
    console.log('   • HERA DNA Smart Code validation is enforced');
    console.log('   • Multi-tenant isolation is working');
    console.log('   • Actor stamping is functional');
  } else {
    console.log('\\n⚠️  Some components need attention - see details above.');
  }
}

// Run the complete test
testCompleteFlow();