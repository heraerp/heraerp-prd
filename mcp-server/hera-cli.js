#!/usr/bin/env node
/**
 * HERA CLI - Direct Command Line Interface for MCP Server
 * Usage: node hera-cli.js <command> [args]
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'hera_software_inc';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];
  
  try {
    switch (command) {
      case 'tables':
      case 'list-tables':
        await listTables();
        break;
        
      case 'query':
        await queryTable(args[1], args.slice(2));
        break;
        
      case 'create-entity':
        await createEntity(args[1], args.slice(2).join(' '));
        break;
        
      case 'set-field':
        await setField(args[1], args[2], args.slice(3).join(' '));
        break;
        
      case 'create-transaction':
        await createTransaction(args[1], parseFloat(args[2]) || 0);
        break;
        
      case 'show-schema':
        await showSchema(args[1]);
        break;
        
      case 'count':
        await countRecords(args[1]);
        break;
        
      default:
        console.log(`Unknown command: ${command}`);
        showHelp();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function listTables() {
  console.log('\n📊 HERA Universal Tables:\n');
  const tables = [
    { name: 'core_organizations', desc: 'WHO: Multi-tenant business isolation' },
    { name: 'core_entities', desc: 'WHAT: All business objects' },
    { name: 'core_dynamic_data', desc: 'HOW: Unlimited custom fields' },
    { name: 'core_relationships', desc: 'WHY: Universal connections' },
    { name: 'universal_transactions', desc: 'WHEN: All business transactions' },
    { name: 'universal_transaction_lines', desc: 'DETAILS: Transaction breakdowns' }
  ];
  
  for (const table of tables) {
    const { count } = await supabase
      .from(table.name)
      .select('*', { count: 'exact', head: true })
      .eq(table.name !== 'core_organizations' ? 'organization_id' : 'id', organizationId);
    
    console.log(`  ${table.name.padEnd(30)} - ${table.desc}`);
    console.log(`  ${' '.padEnd(30)}   Records: ${count || 0}\n`);
  }
}

async function queryTable(tableName, filters = []) {
  if (!tableName) {
    console.log('Usage: query <table_name> [field:value ...]');
    return;
  }

  let query = supabase.from(tableName).select('*');
  
  // Apply organization filter
  if (tableName !== 'core_organizations') {
    query = query.eq('organization_id', organizationId);
  }
  
  // Apply additional filters
  filters.forEach(filter => {
    const [field, value] = filter.split(':');
    if (field && value) {
      query = query.eq(field, value);
    }
  });
  
  query = query.limit(10);
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Query error:', error.message);
    return;
  }
  
  console.log(`\n📋 Results from ${tableName} (showing first 10):\n`);
  
  if (data.length === 0) {
    console.log('No records found');
  } else {
    console.table(data.map(row => {
      // Simplify output
      const simplified = {};
      Object.keys(row).forEach(key => {
        if (row[key] !== null && key !== 'metadata' && key !== 'created_at' && key !== 'updated_at') {
          simplified[key] = row[key];
        }
      });
      return simplified;
    }));
  }
}

async function createEntity(entityType, entityName) {
  if (!entityType || !entityName) {
    console.log('Usage: create-entity <type> <name>');
    return;
  }

  const entityData = {
    organization_id: organizationId,
    entity_type: entityType,
    entity_name: entityName,
    entity_code: `${entityType.toUpperCase()}-${Date.now()}`,
    smart_code: `HERA.UNIV.${entityType.toUpperCase()}.CREATE.v1`,
    status: 'active',
    ai_confidence: 0.95,
    ai_classification: 'UNIV'
  };

  const { data, error } = await supabase
    .from('core_entities')
    .insert(entityData)
    .select()
    .single();

  if (error) {
    console.error('Create error:', error.message);
    return;
  }

  console.log('\n✅ Entity created successfully:');
  console.log(`  ID: ${data.id}`);
  console.log(`  Type: ${data.entity_type}`);
  console.log(`  Name: ${data.entity_name}`);
  console.log(`  Code: ${data.entity_code}`);
}

async function setField(entityId, fieldName, fieldValue) {
  if (!entityId || !fieldName || !fieldValue) {
    console.log('Usage: set-field <entity_id> <field_name> <value>');
    return;
  }

  const fieldData = {
    entity_id: entityId,
    field_name: fieldName,
    field_value_text: fieldValue,
    organization_id: organizationId,
    smart_code: 'HERA.UNIV.FIELD.DYN.v1'
  };

  const { data, error } = await supabase
    .from('core_dynamic_data')
    .upsert(fieldData, {
      onConflict: 'entity_id,field_name,organization_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Field error:', error.message);
    return;
  }

  console.log('\n✅ Dynamic field set:');
  console.log(`  Entity: ${data.entity_id}`);
  console.log(`  Field: ${data.field_name}`);
  console.log(`  Value: ${data.field_value_text}`);
}

async function createTransaction(type, amount) {
  if (!type) {
    console.log('Usage: create-transaction <type> <amount>');
    return;
  }

  const txData = {
    organization_id: organizationId,
    transaction_type: type,
    transaction_date: new Date().toISOString(),
    transaction_code: `TXN-${Date.now()}`,
    smart_code: `HERA.UNIV.${type.toUpperCase()}.TXN.v1`,
    total_amount: amount || 0,
    transaction_status: 'pending'
  };

  const { data, error } = await supabase
    .from('universal_transactions')
    .insert(txData)
    .select()
    .single();

  if (error) {
    console.error('Transaction error:', error.message);
    return;
  }

  console.log('\n✅ Transaction created:');
  console.log(`  ID: ${data.id}`);
  console.log(`  Type: ${data.transaction_type}`);
  console.log(`  Code: ${data.transaction_code}`);
  console.log(`  Amount: $${data.total_amount}`);
}

async function showSchema(tableName) {
  const schemas = {
    core_organizations: ['id', 'organization_name', 'organization_code', 'organization_type', 'status'],
    core_entities: ['id', 'organization_id', 'entity_type', 'entity_name', 'entity_code', 'smart_code', 'status'],
    core_dynamic_data: ['entity_id', 'field_name', 'field_value_text', 'field_value_number', 'field_value_boolean', 'field_value_date', 'field_value_json'],
    core_relationships: ['id', 'organization_id', 'parent_entity_id', 'child_entity_id', 'relationship_type', 'smart_code'],
    universal_transactions: ['id', 'organization_id', 'transaction_type', 'transaction_number', 'transaction_date', 'total_amount', 'smart_code'],
    universal_transaction_lines: ['id', 'transaction_id', 'line_number', 'line_entity_id', 'quantity', 'unit_price', 'line_amount']
  };

  if (tableName && schemas[tableName]) {
    console.log(`\n📋 Schema for ${tableName}:`);
    schemas[tableName].forEach(field => {
      console.log(`  - ${field}`);
    });
  } else {
    console.log('\n📊 All Table Schemas:');
    Object.entries(schemas).forEach(([table, fields]) => {
      console.log(`\n${table}:`);
      fields.forEach(field => {
        console.log(`  - ${field}`);
      });
    });
  }
}

async function countRecords(tableName) {
  if (!tableName) {
    console.log('Usage: count <table_name>');
    return;
  }

  let query = supabase.from(tableName).select('*', { count: 'exact', head: true });
  
  if (tableName !== 'core_organizations') {
    query = query.eq('organization_id', organizationId);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Count error:', error.message);
    return;
  }

  console.log(`\n📊 ${tableName}: ${count || 0} records`);
}

function showHelp() {
  console.log('\n🛡️ HERA CLI - Direct Database Access\n');
  console.log('Usage: node hera-cli.js <command> [args]\n');
  console.log('Commands:');
  console.log('  tables                          - List all universal tables with counts');
  console.log('  query <table> [field:value ...] - Query a table with optional filters');
  console.log('  create-entity <type> <name>     - Create a new entity');
  console.log('  set-field <id> <field> <value>  - Set a dynamic field value');
  console.log('  create-transaction <type> <amt> - Create a transaction');
  console.log('  show-schema [table]             - Show table schema(s)');
  console.log('  count <table>                   - Count records in a table');
  console.log('\nExamples:');
  console.log('  node hera-cli.js tables');
  console.log('  node hera-cli.js query core_entities entity_type:customer');
  console.log('  node hera-cli.js create-entity customer "Acme Corp"');
  console.log('  node hera-cli.js set-field abc-123 email "test@acme.com"');
  console.log(`\nCurrent Organization: ${organizationId}\n`);
}

// Run the CLI
main();