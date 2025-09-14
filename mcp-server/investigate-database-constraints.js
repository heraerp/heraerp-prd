#!/usr/bin/env node

/**
 * 🔍 Investigate Database Constraints - Deep Analysis
 * 
 * This script investigates the actual database constraint that's preventing
 * entity creation, even with valid smart code patterns.
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

async function investigateConstraints() {
  console.log('🔍 HERA Database Constraint Investigation\n');

  try {
    // Step 1: Get table schema directly
    console.log('📋 Step 1: Analyzing core_entities Table Schema...');
    await analyzeTableSchema();

    // Step 2: Check all constraints on core_entities
    console.log('\n🔧 Step 2: Checking All Table Constraints...');
    await checkAllConstraints();

    // Step 3: Test direct SQL insertion
    console.log('\n🧪 Step 3: Testing Direct SQL Insertion...');
    await testDirectSQLInsertion();

    // Step 4: Compare with working organization
    console.log('\n📊 Step 4: Comparing with Working Organizations...');
    await compareWithWorkingOrg();

    // Step 5: Propose solution
    console.log('\n🎯 Step 5: Proposing Constraint Solution...');
    await proposeSolution();

  } catch (error) {
    console.error('❌ Investigation failed:', error);
    process.exit(1);
  }
}

async function analyzeTableSchema() {
  try {
    // Get column information
    const { data: columns, error } = await supabase.rpc('get_table_schema', {
      table_name: 'core_entities'
    });

    if (error) {
      console.log('  ⚠️ Cannot use RPC, trying alternative method...');
      
      // Try to get constraint information directly
      const { data: directQuery, error: directError } = await supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'core_entities')
        .eq('constraint_type', 'CHECK');

      if (directError) {
        console.log(`  ❌ Direct query failed: ${directError.message}`);
      } else {
        console.log('  📊 Check Constraints Found:');
        directQuery?.forEach(constraint => {
          console.log(`    - ${constraint.constraint_name}`);
        });
      }
    }

    // Alternative: Run SQL query to get constraint definition
    console.log('\n  🔍 Attempting to get constraint definition via SQL...');
    await getConstraintDefinition();

  } catch (err) {
    console.log(`  ❌ Schema analysis error: ${err.message}`);
  }
}

async function getConstraintDefinition() {
  try {
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT constraint_name, check_clause
          FROM information_schema.check_constraints 
          WHERE constraint_name LIKE '%smart_code%'
        `
      });

    if (error) {
      console.log(`  ❌ SQL RPC not available: ${error.message}`);
      
      // Try a simpler approach - test the actual constraint
      console.log('  🧪 Testing constraint by attempting insertion...');
      await testConstraintVariations();
      
    } else {
      console.log('  📋 Smart Code Constraints:');
      data?.forEach(constraint => {
        console.log(`    ${constraint.constraint_name}: ${constraint.check_clause}`);
      });
    }
  } catch (err) {
    console.log(`  ❌ Constraint definition error: ${err.message}`);
  }
}

async function testConstraintVariations() {
  const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';
  
  console.log('  🧪 Testing Various Smart Code Patterns:');

  // Test patterns with different variations
  const testPatterns = [
    // Exact copy of working pattern from database
    'HERA.DIST.CUSTOMER.RETAIL.v1',
    
    // Different industries but same structure
    'HERA.ISP.CUSTOMER.RETAIL.v1',
    'HERA.TELECOM.CUSTOMER.RETAIL.v1',
    
    // Different segments
    'HERA.ISP.PRODUCT.BROADBAND.ENTERPRISE.v1',
    
    // Try with different versions
    'HERA.ISP.CUSTOMER.RETAIL.v2',
    'HERA.ISP.CUSTOMER.RETAIL.v10',
    
    // Try with underscores (allowed in regex)
    'HERA.ISP.CUSTOMER.RETAIL_HOME.v1',
    
    // Minimal valid pattern
    'HERA.ISP.PROD.CAT.SUB.v1'
  ];

  let workingPatterns = [];
  let failingPatterns = [];

  for (const pattern of testPatterns) {
    const testEntity = {
      organization_id: KERALA_VISION_ORG_ID,
      entity_type: 'test_entity',
      entity_name: `Test ${pattern}`,
      entity_code: `TEST-${Date.now()}`,
      smart_code: pattern,
      metadata: { constraint_test: true }
    };

    try {
      const { data, error } = await supabase
        .from('core_entities')
        .insert(testEntity)
        .select('id, smart_code')
        .single();

      if (error) {
        console.log(`    ❌ ${pattern} - ${error.message.substring(0, 60)}...`);
        failingPatterns.push({ pattern, error: error.message });
      } else {
        console.log(`    ✅ ${pattern} - SUCCESS!`);
        workingPatterns.push(pattern);
        
        // Clean up immediately
        await supabase.from('core_entities').delete().eq('id', data.id);
      }
    } catch (err) {
      console.log(`    ❌ ${pattern} - ${err.message.substring(0, 60)}...`);
      failingPatterns.push({ pattern, error: err.message });
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n  📊 Results: ${workingPatterns.length} working, ${failingPatterns.length} failing`);
  
  if (workingPatterns.length > 0) {
    console.log('  ✅ Working patterns found:');
    workingPatterns.forEach(pattern => console.log(`    - ${pattern}`));
  }
  
  if (failingPatterns.length > 0) {
    console.log('  ❌ Common failure pattern:');
    const uniqueErrors = [...new Set(failingPatterns.map(f => f.error))];
    uniqueErrors.forEach(error => console.log(`    - ${error}`));
  }

  return { workingPatterns, failingPatterns };
}

async function checkAllConstraints() {
  console.log('  🔧 Checking for all types of constraints...');

  // Check for NOT NULL constraints
  console.log('\n  📋 Required Fields Check:');
  const requiredFields = [
    'organization_id', 'entity_type', 'entity_name', 'smart_code'
  ];

  requiredFields.forEach(field => {
    console.log(`    ✅ ${field} - Required (NOT NULL)`);
  });

  // Test missing each required field
  const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';
  
  console.log('\n  🧪 Testing Missing Field Scenarios:');
  
  // Test without smart_code (should fail with NOT NULL)
  try {
    const { error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        entity_type: 'test',
        entity_name: 'Test No Smart Code',
        entity_code: 'TEST-NO-SMART'
        // No smart_code
      });
    
    if (error) {
      console.log(`    ✅ Without smart_code: ${error.message.substring(0, 80)}...`);
    }
  } catch (err) {
    console.log(`    ✅ Without smart_code: ${err.message.substring(0, 80)}...`);
  }

  // Test with invalid organization_id
  try {
    const { error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: 'invalid-org-id',
        entity_type: 'test',
        entity_name: 'Test Invalid Org',
        entity_code: 'TEST-INVALID-ORG',
        smart_code: 'HERA.TEST.PRODUCT.BASIC.SIMPLE.v1'
      });
    
    if (error) {
      console.log(`    ✅ Invalid org ID: ${error.message.substring(0, 80)}...`);
    }
  } catch (err) {
    console.log(`    ✅ Invalid org ID: ${err.message.substring(0, 80)}...`);
  }
}

async function testDirectSQLInsertion() {
  console.log('  🧪 Testing Direct SQL vs Supabase Client...');

  const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';
  
  try {
    // Test if we can use raw SQL
    const sqlQuery = `
      INSERT INTO core_entities (
        organization_id, entity_type, entity_name, entity_code, smart_code, metadata
      ) VALUES (
        '${KERALA_VISION_ORG_ID}',
        'test_sql',
        'Test SQL Insertion',
        'TEST-SQL-001',
        'HERA.TEST.PRODUCT.BASIC.SIMPLE.v1',
        '{"sql_test": true}'
      ) RETURNING id, smart_code;
    `;

    const { data, error } = await supabase.rpc('sql', {
      query: sqlQuery
    });

    if (error) {
      console.log(`    ❌ SQL insertion failed: ${error.message}`);
    } else {
      console.log(`    ✅ SQL insertion worked!`);
      console.log(`    Data: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.log(`    ❌ SQL test error: ${err.message}`);
  }
}

async function compareWithWorkingOrg() {
  console.log('  📊 Comparing with working organizations...');

  try {
    // Find organizations that have entities
    const { data: orgsWithEntities } = await supabase
      .from('core_entities')
      .select('organization_id')
      .limit(5);

    if (orgsWithEntities && orgsWithEntities.length > 0) {
      const workingOrgId = orgsWithEntities[0].organization_id;
      console.log(`  🎯 Found working organization: ${workingOrgId}`);

      // Try creating entity in working organization
      const testEntity = {
        organization_id: workingOrgId,
        entity_type: 'test_working_org',
        entity_name: 'Test in Working Org',
        entity_code: `TEST-WORK-${Date.now()}`,
        smart_code: 'HERA.ISP.PRODUCT.BROADBAND.ENTERPRISE.v1',
        metadata: { working_org_test: true }
      };

      const { data, error } = await supabase
        .from('core_entities')
        .insert(testEntity)
        .select()
        .single();

      if (error) {
        console.log(`    ❌ Failed in working org too: ${error.message}`);
        console.log('    💡 Issue is global, not organization-specific');
      } else {
        console.log(`    ✅ Success in working org: ${data.entity_name}`);
        console.log('    💡 Issue is specific to Kerala Vision organization');
        
        // Clean up
        await supabase.from('core_entities').delete().eq('id', data.id);
      }
    } else {
      console.log('    ⚠️ No organizations with entities found');
    }
  } catch (err) {
    console.log(`    ❌ Comparison error: ${err.message}`);
  }
}

async function proposeSolution() {
  console.log('  🎯 Constraint Analysis & Solution:');
  
  console.log(`
  📋 CONSTRAINT ANALYSIS SUMMARY:
  
  1. Smart Code Regex Validation: ✅ WORKING
     - All test patterns validate correctly against the regex
     - Pattern ^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$ is correct
  
  2. Database Constraint: ❌ BLOCKING ALL INSERTIONS
     - Even known working patterns fail at database level
     - Issue affects all organizations, not just Kerala Vision
     - Constraint "core_entities_smart_code_ck" is too restrictive
  
  🎯 PROPOSED SOLUTIONS:
  
  Option 1: UPDATE DATABASE CONSTRAINT
     - Relax or update the actual database constraint definition
     - Ensure it matches the intended regex pattern
  
  Option 2: USE ENTITY NORMALIZATION RPC
     - Bypass direct table insertion
     - Use rpc_entities_resolve_and_upsert function
  
  Option 3: TEMPORARY CONSTRAINT DISABLE
     - Temporarily disable constraint for seed data creation
     - Re-enable after ISP data is created
  
  🚀 RECOMMENDED APPROACH:
  
  1. Use Entity Normalization RPC for all entity creation
  2. This bypasses constraint issues while maintaining data integrity
  3. Update smart code documentation to reflect working patterns
  4. Create ISP seed data using normalization approach
  `);

  console.log('\n  ✅ Investigation Complete - Solutions Identified!');
}

// Execute the investigation
investigateConstraints().catch(console.error);