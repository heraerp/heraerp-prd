#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HO_ORG_ID = "30cbd9d1-7610-4e6a-9694-ea259dc6b23a";

async function clearHOData() {
  console.log('Clearing HO data in dependency order...');
  
  // Clear in reverse order to avoid FK constraints
  const tables = [
    'universal_transaction_lines',
    'universal_transactions',
    'core_relationships',
    'core_dynamic_data',
    'core_entities'
  ];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('organization_id', HO_ORG_ID);
    
    if (error) {
      console.error(`Error clearing ${table}:`, error);
    } else {
      console.log(`✅ Cleared ${table}`);
    }
  }
  
  console.log('Done');
}

clearHOData();