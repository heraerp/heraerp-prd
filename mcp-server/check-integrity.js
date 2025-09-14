#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SMART_CODE_REGEX = /^HERA\.[A-Z0-9]{3,15}(\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;

async function runIntegrityChecks() {
  console.log('=== SALON ERP INTEGRITY CHECKS ===\n');

  try {
    // Check 1: Organization exists
    console.log('1. Checking DEMO-SALON organization...');
    const { data: orgs, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('organization_code', 'DEMO-SALON');
    
    console.log(`   Organizations found: ${orgs?.length || 0}`);
    if (orgs?.length > 0) {
      console.log(`   Organization ID: ${orgs[0].id}`);
    }

    // Check 2: Entities with bad data
    console.log('\n2. Checking entities...');
    const { data: entities, error: entError } = await supabase
      .from('core_entities')
      .select('*');
    
    const badEntities = entities?.filter(e => 
      !e.organization_id || 
      !e.smart_code ||
      !SMART_CODE_REGEX.test(e.smart_code)
    ) || [];
    
    console.log(`   Total entities: ${entities?.length || 0}`);
    console.log(`   Bad entities: ${badEntities.length}`);

    // Check 3: Dynamic data
    console.log('\n3. Checking dynamic data...');
    const { data: dynData, error: dynError } = await supabase
      .from('core_dynamic_data')
      .select('*');
    
    const badDynData = dynData?.filter(d => !d.smart_code) || [];
    console.log(`   Total dynamic data: ${dynData?.length || 0}`);
    console.log(`   Missing smart_code: ${badDynData.length}`);

    // Check 4: Transactions
    console.log('\n4. Checking transactions...');
    const { data: txns, error: txnError } = await supabase
      .from('universal_transactions')
      .select('*');
    
    const badTxns = txns?.filter(t => 
      !t.transaction_currency_code ||
      !t.smart_code ||
      !SMART_CODE_REGEX.test(t.smart_code)
    ) || [];
    
    console.log(`   Total transactions: ${txns?.length || 0}`);
    console.log(`   Bad transactions: ${badTxns.length}`);

    // Check 5: Transaction lines
    console.log('\n5. Checking transaction lines...');
    const { data: lines, error: lineError } = await supabase
      .from('universal_transaction_lines')
      .select('*');
    
    const badLines = lines?.filter(l => 
      !l.organization_id ||
      !l.transaction_id ||
      l.line_number == null ||
      !l.line_type ||
      !l.smart_code
    ) || [];
    
    console.log(`   Total lines: ${lines?.length || 0}`);
    console.log(`   Bad lines: ${badLines.length}`);

    // DEMO-SALON specific stats
    if (orgs?.length > 0) {
      const demoOrgId = orgs[0].id;
      
      console.log('\n=== DEMO-SALON SPECIFIC STATS ===');
      
      // Entities in DEMO-SALON
      const demoEntities = entities?.filter(e => e.organization_id === demoOrgId) || [];
      console.log(`\n6. Entities in DEMO-SALON: ${demoEntities.length}`);
      demoEntities.forEach(e => {
        console.log(`   - ${e.entity_type}: ${e.entity_name} (${e.entity_code})`);
      });

      // Transactions in DEMO-SALON
      const demoTxns = txns?.filter(t => t.organization_id === demoOrgId) || [];
      console.log(`\n7. Transactions in DEMO-SALON: ${demoTxns.length}`);
      demoTxns.forEach(t => {
        console.log(`   - ${t.transaction_type}: ${t.transaction_code} ($${t.total_amount})`);
      });
    }

    // Show invalid smart codes
    console.log('\n8. Invalid smart codes:');
    const invalidCodes = new Set();
    
    entities?.forEach(e => {
      if (e.smart_code && !SMART_CODE_REGEX.test(e.smart_code)) {
        invalidCodes.add(`Entity: ${e.smart_code}`);
      }
    });
    
    txns?.forEach(t => {
      if (t.smart_code && !SMART_CODE_REGEX.test(t.smart_code)) {
        invalidCodes.add(`Transaction: ${t.smart_code}`);
      }
    });

    if (invalidCodes.size === 0) {
      console.log('   None found ✓');
    } else {
      invalidCodes.forEach(code => console.log(`   - ${code}`));
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`✓ DEMO-SALON exists: ${orgs?.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✓ Bad entities: ${badEntities.length} (should be 0)`);
    console.log(`✓ Bad dynamic data: ${badDynData.length} (should be 0)`);
    console.log(`✓ Bad transactions: ${badTxns.length} (should be 0)`);
    console.log(`✓ Bad lines: ${badLines.length} (should be 0)`);

  } catch (error) {
    console.error('Error running checks:', error);
  }
}

runIntegrityChecks();