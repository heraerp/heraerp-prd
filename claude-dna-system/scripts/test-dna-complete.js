import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from the main project
config({ path: '../.env.local' });

// Create Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteDNASystem() {
  console.log('🧬 TESTING COMPLETE HERA DNA SYSTEM...\n');
  
  // Check environment variables first
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
    console.error('❌ Environment Error: SUPABASE_URL not found');
    console.error('Please check your .env.local file in the main project');
    return;
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Environment Error: SUPABASE_SERVICE_ROLE_KEY not found');
    console.error('Please check your .env.local file in the main project');
    return;
  }
  
  console.log(`📡 Connecting to: ${process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL}`);
  console.log(`🔑 Using service key: ${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...\n`);
  
  const tests = [];
  
  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing Supabase connection...');
    const { data: connectionTest, error: connError } = await supabase
      .from('core_organizations')
      .select('count')
      .limit(1);
    
    if (connError) {
      throw new Error(`Connection failed: ${connError.message}`);
    }
    
    console.log('✅ Supabase connection successful\n');
    tests.push('✅ Connection');

    // Test 2: Check HERA schema exists (FIXED VERSION)
    console.log('2️⃣ Testing HERA schema...');
    
    // Test each table individually by trying to access it
    const tableTests = [
      'core_organizations',
      'core_entities', 
      'core_dynamic_data',
      'core_relationships', 
      'universal_transactions', 
      'universal_transaction_lines'
    ];
    
    const existingTables = [];
    
    for (const tableName of tableTests) {
      try {
        console.log(`   🔍 Checking ${tableName}...`);
        const { error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (!error) {
          existingTables.push(tableName);
          console.log(`   ✅ ${tableName} - Found`);
        } else {
          console.log(`   ❌ ${tableName} - Error: ${error.message}`);
        }
      } catch (e) {
        console.log(`   ❌ ${tableName} - Exception: ${e.message}`);
      }
    }
    
    if (existingTables.length < 6) {
      throw new Error(`HERA schema incomplete. Found ${existingTables.length}/6 tables: [${existingTables.join(', ')}]. Missing: [${tableTests.filter(t => !existingTables.includes(t)).join(', ')}]`);
    }
    
    console.log(`✅ HERA schema verified: ${existingTables.length}/6 tables found\n`);
    tests.push('✅ HERA Schema');

    // Test 3: DNA organization exists
    console.log('3️⃣ Testing DNA organization...');
    const { data: dnaOrg, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('organization_code', 'HERA-DNA-SYS')
      .single();
    
    if (orgError || !dnaOrg) {
      console.log('⚠️ DNA organization not found. This is expected if DNA system SQL hasn\'t been deployed yet.');
      console.log('   Let\'s check what organizations exist...');
      
      const { data: allOrgs, error: allOrgsError } = await supabase
        .from('core_organizations')
        .select('organization_code, organization_name, organization_type')
        .limit(10);
      
      if (allOrgs && allOrgs.length > 0) {
        console.log('   📋 Existing organizations:');
        allOrgs.forEach(org => {
          console.log(`     - ${org.organization_code}: ${org.organization_name} (${org.organization_type})`);
        });
      } else {
        console.log('   📋 No organizations found in database');
      }
      
      // Don't throw error, just continue to next test
      console.log('   ℹ️ Will proceed with DNA system deployment...\n');
    } else {
      console.log(`✅ DNA Organization found: ${dnaOrg.organization_name}`);
      console.log(`   Status: ${dnaOrg.status}`);
      console.log(`   Industry: ${dnaOrg.industry_classification}\n`);
      tests.push('✅ DNA Organization');
    }

    // Test 4: Check if DNA patterns exist (only if DNA org exists)
    if (tests.includes('✅ DNA Organization')) {
      console.log('4️⃣ Testing DNA patterns...');
      const { data: patterns, error: patternError } = await supabase
        .from('core_entities')
        .select('entity_type, entity_name, smart_code')
        .eq('organization_id', dnaOrg.id)
        .order('entity_type, entity_name');
      
      if (patternError || !patterns || patterns.length === 0) {
        console.log('⚠️ No DNA patterns found. DNA system SQL needs to be deployed.');
      } else {
        console.log(`✅ Found ${patterns.length} DNA patterns:`);
        patterns.forEach(p => {
          console.log(`   - ${p.smart_code}: ${p.entity_name}`);
        });
        console.log('');
        tests.push(`✅ ${patterns.length} DNA Patterns`);
      }
    } else {
      console.log('4️⃣ Skipping DNA patterns test (no DNA organization found)\n');
    }

    // Test 5: Test basic HERA system organization
    console.log('5️⃣ Testing HERA system foundation...');
    const { data: heraOrg, error: heraError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('organization_code', 'HERA-SYS-001')
      .single();
    
    if (heraError || !heraOrg) {
      console.log('⚠️ HERA system organization not found. Let me try to create it...');
      
      const { data: newOrg, error: createError } = await supabase
        .from('core_organizations')
        .insert({
          organization_name: 'HERA System Foundation',
          organization_code: 'HERA-SYS-001',
          organization_type: 'hera_system',
          industry_classification: 'enterprise_software',
          status: 'active',
          ai_classification: 'system_org',
          ai_confidence: 1.0000
        })
        .select()
        .single();
      
      if (createError) {
        console.log(`❌ Could not create HERA system org: ${createError.message}`);
      } else {
        console.log(`✅ HERA System Foundation created: ${newOrg.organization_name}`);
        tests.push('✅ HERA System Foundation');
      }
    } else {
      console.log(`✅ HERA System Foundation found: ${heraOrg.organization_name}`);
      tests.push('✅ HERA System Foundation');
    }

    // Final Results
    console.log('\n🎉 SYSTEM TEST RESULTS:');
    tests.forEach(test => console.log(`  ${test}`));
    
    console.log('\n🚀 HERA FOUNDATION TEST SUMMARY:');
    console.log(`   Total Tests Passed: ${tests.length}`);
    console.log(`   Schema Status: ${existingTables.length === 6 ? '✅ Complete' : '⚠️ Incomplete'}`);
    
    if (existingTables.length === 6) {
      console.log('\n✨ HERA UNIVERSAL SCHEMA IS OPERATIONAL!');
      console.log('\n📋 Next steps:');
      console.log('   1. Deploy the DNA system SQL to create DNA organization and patterns');
      console.log('   2. Test the complete DNA system functionality');
      console.log('   3. Ready for revolutionary Claude CLI development!');
    } else {
      console.log('\n⚠️ Schema issues detected. Please check the Universal Schema deployment.');
    }
    
  } catch (error) {
    console.error('\n❌ SYSTEM TEST FAILED:');
    console.error(`Error: ${error.message}`);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Verify all 6 HERA universal tables are deployed in Supabase');
    console.error('2. Check your .env.local file has correct Supabase credentials');
    console.error('3. Make sure SUPABASE_SERVICE_ROLE_KEY has proper permissions');
    console.error('4. Try running the Universal Schema SQL script again if needed');
  }
}

// Run the complete test
testCompleteDNASystem().catch(console.error);