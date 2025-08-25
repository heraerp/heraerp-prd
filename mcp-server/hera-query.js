#!/usr/bin/env node
/**
 * HERA Quick Query Tool
 * Simple tool to query and view universal tables
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const orgId = process.env.DEFAULT_ORGANIZATION_ID;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  console.log(`\n🛡️ HERA Query Tool - Organization: ${orgId}\n`);

  switch (command) {
    case 'summary':
      await showSummary();
      break;
    
    case 'entities':
      await showEntities();
      break;
      
    case 'transactions':
      await showTransactions();
      break;
      
    case 'relationships':
      await showRelationships();
      break;
      
    case 'dynamic':
      await showDynamicData();
      break;
      
    default:
      showHelp();
  }
}

async function showSummary() {
  console.log('📊 Database Summary:\n');
  
  const tables = [
    'core_organizations',
    'core_entities',
    'core_dynamic_data',
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
  ];
  
  for (const table of tables) {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });
    
    if (table !== 'core_organizations') {
      query = query.eq('organization_id', orgId);
    }
    
    const { count } = await query;
    console.log(`  ${table.padEnd(30)} : ${count || 0} records`);
  }
}

async function showEntities() {
  const { data, error } = await supabase
    .from('core_entities')
    .select('id, entity_type, entity_name, entity_code, smart_code, status')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('📋 Recent Entities:\n');
  if (data.length === 0) {
    console.log('No entities found');
  } else {
    data.forEach(entity => {
      console.log(`  ${entity.entity_type.padEnd(15)} : ${entity.entity_name} (${entity.entity_code})`);
      console.log(`  ${' '.padEnd(15)}   ID: ${entity.id}`);
      console.log(`  ${' '.padEnd(15)}   Smart Code: ${entity.smart_code}\n`);
    });
  }
}

async function showTransactions() {
  const { data, error } = await supabase
    .from('universal_transactions')
    .select('id, transaction_type, transaction_code, transaction_date, total_amount')
    .eq('organization_id', orgId)
    .order('transaction_date', { ascending: false })
    .limit(20);
    
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('💰 Recent Transactions:\n');
  if (!data || data.length === 0) {
    console.log('No transactions found');
  } else {
    data.forEach(tx => {
      const date = new Date(tx.transaction_date).toLocaleDateString();
      console.log(`  ${tx.transaction_type.padEnd(15)} : ${tx.transaction_code} - $${tx.total_amount}`);
      console.log(`  ${' '.padEnd(15)}   Date: ${date}`);
      console.log(`  ${' '.padEnd(15)}   ID: ${tx.id}\n`);
    });
  }
}

async function showRelationships() {
  const { data, error } = await supabase
    .from('core_relationships')
    .select(`
      id,
      relationship_type,
      from_entity:core_entities!core_relationships_from_entity_id_fkey(entity_name),
      to_entity:core_entities!core_relationships_to_entity_id_fkey(entity_name)
    `)
    .eq('organization_id', orgId)
    .limit(20);
    
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('🔗 Recent Relationships:\n');
  if (!data || data.length === 0) {
    console.log('No relationships found');
  } else {
    data.forEach(rel => {
      const parent = rel.parent_entity?.entity_name || 'Unknown';
      const child = rel.child_entity?.entity_name || 'Unknown';
      console.log(`  ${parent} --[${rel.relationship_type}]--> ${child}`);
    });
  }
}

async function showDynamicData() {
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .select(`
      field_name,
      field_value_text,
      field_value_number,
      entity:core_entities!core_dynamic_data_entity_id_fkey(entity_name)
    `)
    .eq('organization_id', orgId)
    .limit(20);
    
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('🔧 Recent Dynamic Fields:\n');
  if (!data || data.length === 0) {
    console.log('No dynamic fields found');
  } else {
    data.forEach(field => {
      const value = field.field_value_text || field.field_value_number || '';
      const entity = field.entity?.entity_name || 'Unknown';
      console.log(`  ${entity.padEnd(20)} : ${field.field_name} = ${value}`);
    });
  }
}

function showHelp() {
  console.log('Usage: node hera-query.js <command>\n');
  console.log('Commands:');
  console.log('  summary      - Show record counts for all tables');
  console.log('  entities     - List recent entities');
  console.log('  transactions - List recent transactions');
  console.log('  relationships - Show entity relationships');
  console.log('  dynamic      - Show dynamic field data');
  console.log('  help         - Show this help message');
}

main().catch(console.error);