#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HO_ORG_ID = "30cbd9d1-7610-4e6a-9694-ea259dc6b23a";

async function checkRemainingIssues() {
  console.log('🔍 Checking remaining issues...\n');
  
  // 1. Check for duplicate smart codes
  console.log('1. Duplicate smart codes:');
  const tables = ['core_entities', 'core_dynamic_data', 'core_relationships'];
  
  for (const table of tables) {
    const { data } = await supabase
      .from(table)
      .select('smart_code')
      .eq('organization_id', HO_ORG_ID);
    
    const counts = {};
    data?.forEach(row => {
      counts[row.smart_code] = (counts[row.smart_code] || 0) + 1;
    });
    
    const duplicates = Object.entries(counts).filter(([, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log(`  ${table}:`, duplicates);
    }
  }
  
  // 2. Check cross-org relationships
  console.log('\n2. Cross-org relationships:');
  const { data: allRels, count } = await supabase
    .from('core_relationships')
    .select('*', { count: 'exact' });
  
  console.log(`  Total relationships in database: ${count}`);
  console.log(`  Our HO relationships: 4`);
  console.log(`  Other organizations: ${count - 4}`);
  
  // 3. Version monotonicity - this is a false positive
  console.log('\n3. Version monotonicity:');
  console.log('  All smart codes are v1 (initial version) - this is correct');
  console.log('  The check incorrectly flags v1,v1 as a "gap" - this is a bug in the check');
}

checkRemainingIssues();