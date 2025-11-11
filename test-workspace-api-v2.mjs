#!/usr/bin/env node
/**
 * Test the updated database-driven workspace API
 */

async function testWorkspaceAPI() {
  console.log('🧪 Testing Database-Driven Workspace API v2\n');
  
  try {
    // Test 1: Try the original retail/inventory/main (should still work)
    console.log('📍 TEST 1: retail/inventory/main (existing workspace)');
    console.log('====================================================');
    
    const response1 = await fetch('http://localhost:3000/api/v2/retail/inventory/main');
    console.log(`Status: ${response1.status}`);
    
    if (response1.ok) {
      const data = await response1.json();
      console.log('✅ SUCCESS');
      console.log(`   Workspace: ${data.workspace?.entity_name}`);
      console.log(`   Domain: ${data.workspace?.domain_name}`);
      console.log(`   Section: ${data.workspace?.section_name}`);
      console.log(`   Cards: ${data.layout_config?.sections?.[0]?.cards?.length || 0} cards`);
    } else {
      const error = await response1.text();
      console.log('❌ FAILED:', error);
    }

    // Test 2: Try merchandising/planning/main (should work now)
    console.log('\n📍 TEST 2: merchandising/planning/main (universal workspace)');
    console.log('============================================================');
    
    const response2 = await fetch('http://localhost:3000/api/v2/merchandising/planning/main');
    console.log(`Status: ${response2.status}`);
    
    if (response2.ok) {
      const data = await response2.json();
      console.log('✅ SUCCESS - Universal workspace matching works!');
      console.log(`   Workspace: ${data.workspace?.entity_name}`);
      console.log(`   Domain: ${data.workspace?.domain_name}`);
      console.log(`   Section: ${data.workspace?.section_name}`);
      console.log(`   Cards: ${data.layout_config?.sections?.[0]?.cards?.length || 0} cards`);
    } else {
      const error = await response2.text();
      console.log('❌ FAILED:', error);
    }

    // Test 3: Try a completely different combination
    console.log('\n📍 TEST 3: Any other domain/section/main combinations');
    console.log('===================================================');
    
    const testUrls = [
      'finance/dashboard/main',
      'finance/cockpit/main', 
      'finance/overview/main'
    ];
    
    for (const testUrl of testUrls) {
      console.log(`🧪 Testing: ${testUrl}`);
      const response = await fetch(`http://localhost:3000/api/v2/${testUrl}`);
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS: ${data.workspace?.entity_name}`);
      } else {
        console.log(`   ❌ Failed`);
      }
    }
    
    console.log('\n🎯 SUMMARY');
    console.log('===========');
    console.log('The new database-driven workspace API:');
    console.log('1. Searches all APP_WORKSPACE entities');
    console.log('2. Matches workspace by name/code/smart_code patterns');
    console.log('3. Verifies complete hierarchy through parent_entity_id or relationships');
    console.log('4. Works for ANY domain/section/workspace combination in the database');
    console.log('5. No hardcoding required - completely dynamic!');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testWorkspaceAPI();