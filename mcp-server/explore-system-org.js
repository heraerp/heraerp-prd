#!/usr/bin/env node
/**
 * Explore HERA System Organization
 * View and use the templates from the system organization
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// HERA System Organization ID
const SYSTEM_ORG_ID = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944';

async function exploreSystemOrg() {
  const args = process.argv.slice(2);
  const command = args[0] || 'summary';

  console.log('\n🏛️ HERA System Organization Explorer\n');

  switch (command) {
    case 'summary':
      await showSummary();
      break;
    
    case 'entity-types':
      await showEntityTypes();
      break;
      
    case 'fields':
      await showStandardFields();
      break;
      
    case 'statuses':
      await showWorkflowStatuses();
      break;
      
    case 'relationships':
      await showRelationshipTypes();
      break;
      
    case 'transactions':
      await showTransactionTypes();
      break;
      
    case 'patterns':
      await showSmartCodePatterns();
      break;
      
    case 'copy-to':
      await copyTemplates(args[1]);
      break;
      
    default:
      showHelp();
  }
}

async function showSummary() {
  console.log('📊 System Organization Summary\n');
  
  const types = [
    'entity_type_definition',
    'field_definition',
    'workflow_status',
    'relationship_type',
    'transaction_type',
    'smart_code_pattern'
  ];
  
  for (const type of types) {
    const { count } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', SYSTEM_ORG_ID)
      .eq('entity_type', type);
    
    console.log(`  ${type.padEnd(25)} : ${count || 0} templates`);
  }
  
  console.log('\n💡 Commands:');
  console.log('  node explore-system-org.js entity-types    - List all entity type templates');
  console.log('  node explore-system-org.js fields          - List standard fields');
  console.log('  node explore-system-org.js statuses        - List workflow statuses');
  console.log('  node explore-system-org.js relationships   - List relationship types');
  console.log('  node explore-system-org.js transactions    - List transaction types');
  console.log('  node explore-system-org.js patterns        - List smart code patterns');
  console.log('  node explore-system-org.js copy-to <org-id> - Copy templates to another org');
}

async function showEntityTypes() {
  console.log('📋 Universal Entity Type Templates\n');
  
  const { data } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SYSTEM_ORG_ID)
    .eq('entity_type', 'entity_type_definition')
    .order('entity_name');
  
  if (data) {
    const byCategory = {};
    data.forEach(item => {
      const category = item.metadata?.category || 'other';
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(item);
    });
    
    Object.entries(byCategory).forEach(([category, items]) => {
      console.log(`\n${category.toUpperCase()}:`);
      items.forEach(item => {
        console.log(`  ${item.entity_code.padEnd(20)} - ${item.entity_name}`);
        console.log(`  ${' '.padEnd(20)}   Smart Code: ${item.smart_code}`);
      });
    });
  }
}

async function showStandardFields() {
  console.log('📝 Standard Dynamic Fields Registry\n');
  
  const { data } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SYSTEM_ORG_ID)
    .eq('entity_type', 'field_definition')
    .order('entity_name');
  
  if (data) {
    const byCategory = {};
    data.forEach(item => {
      const category = item.metadata?.category || 'other';
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(item);
    });
    
    Object.entries(byCategory).forEach(([category, items]) => {
      console.log(`\n${category.toUpperCase()} FIELDS:`);
      items.forEach(item => {
        const fieldName = item.entity_name.replace('Field: ', '');
        const fieldType = item.metadata?.field_type || 'text';
        const validation = item.metadata?.validation ? ` (${item.metadata.validation})` : '';
        console.log(`  ${fieldName.padEnd(20)} - Type: ${fieldType}${validation}`);
      });
    });
  }
}

async function showWorkflowStatuses() {
  console.log('🔄 Standard Workflow Statuses\n');
  
  const { data } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SYSTEM_ORG_ID)
    .eq('entity_type', 'workflow_status')
    .order('metadata->display_order');
  
  if (data) {
    console.log('  Order  Status              Color      Properties');
    console.log('  -----  -------             -----      ----------');
    data.forEach(item => {
      const order = String(item.metadata?.display_order || 0).padEnd(5);
      const name = item.entity_name.padEnd(18);
      const color = (item.metadata?.color_code || '').padEnd(9);
      const props = [];
      if (item.metadata?.is_initial) props.push('Initial');
      if (item.metadata?.is_terminal) props.push('Terminal');
      console.log(`  ${order}  ${name}  ${color}  ${props.join(', ')}`);
    });
  }
}

async function showRelationshipTypes() {
  console.log('🔗 Standard Relationship Types\n');
  
  const { data } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SYSTEM_ORG_ID)
    .eq('entity_type', 'relationship_type')
    .order('entity_name');
  
  if (data) {
    const byCategory = {};
    data.forEach(item => {
      const category = item.metadata?.category || 'other';
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(item);
    });
    
    Object.entries(byCategory).forEach(([category, items]) => {
      console.log(`\n${category.toUpperCase()}:`);
      items.forEach(item => {
        console.log(`  ${item.entity_code.padEnd(20)} - ${item.entity_name}`);
      });
    });
  }
}

async function showTransactionTypes() {
  console.log('💰 Standard Transaction Types\n');
  
  const { data } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SYSTEM_ORG_ID)
    .eq('entity_type', 'transaction_type')
    .order('entity_name');
  
  if (data) {
    const byCategory = {};
    data.forEach(item => {
      const category = item.metadata?.category || 'other';
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(item);
    });
    
    Object.entries(byCategory).forEach(([category, items]) => {
      console.log(`\n${category.toUpperCase()}:`);
      items.forEach(item => {
        const flags = [];
        if (item.metadata?.requires_approval) flags.push('Requires Approval');
        if (item.metadata?.affects_inventory) flags.push('Affects Inventory');
        if (item.metadata?.affects_accounting) flags.push('Affects GL');
        
        console.log(`  ${item.entity_code.padEnd(20)} - ${item.entity_name}`);
        if (flags.length > 0) {
          console.log(`  ${' '.padEnd(20)}   ${flags.join(', ')}`);
        }
      });
    });
  }
}

async function showSmartCodePatterns() {
  console.log('🧠 Smart Code Patterns\n');
  
  const { data } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SYSTEM_ORG_ID)
    .eq('entity_type', 'smart_code_pattern');
  
  if (data) {
    data.forEach(item => {
      console.log(`\n${item.entity_name}:`);
      console.log(`  Pattern: ${item.metadata?.pattern}`);
      console.log(`  Example: ${item.metadata?.pattern.replace(/{(\w+)}/g, (match, p1) => {
        const examples = {
          INDUSTRY: 'REST',
          MODULE: 'CRM',
          FUNCTION: 'CUST',
          TYPE: 'CREATE',
          VERSION: '1',
          ACTION: 'STATUS',
          DETAIL: 'ASSIGN',
          CATEGORY: 'BUSINESS'
        };
        return examples[p1] || p1;
      })}`);
    });
  }
}

async function copyTemplates(targetOrgId) {
  if (!targetOrgId) {
    console.log('❌ Please provide target organization ID');
    console.log('Usage: node explore-system-org.js copy-to <organization-id>');
    return;
  }
  
  console.log(`📋 Copying templates to organization: ${targetOrgId}\n`);
  
  // Get all templates from system org
  const { data: templates } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SYSTEM_ORG_ID);
  
  if (!templates) {
    console.log('❌ No templates found');
    return;
  }
  
  let copied = 0;
  for (const template of templates) {
    // Create a copy with new org ID
    const newEntity = {
      ...template,
      id: undefined, // Let database generate new ID
      organization_id: targetOrgId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        ...template.metadata,
        copied_from: SYSTEM_ORG_ID,
        copied_at: new Date().toISOString()
      }
    };
    
    const { error } = await supabase
      .from('core_entities')
      .insert(newEntity);
    
    if (!error) {
      copied++;
      if (copied % 10 === 0) {
        console.log(`  ✅ Copied ${copied} templates...`);
      }
    }
  }
  
  console.log(`\n✅ Successfully copied ${copied} templates to target organization!`);
}

function showHelp() {
  console.log('Usage: node explore-system-org.js <command>\n');
  console.log('Commands:');
  console.log('  summary         - Show overview of all templates');
  console.log('  entity-types    - List all entity type templates');
  console.log('  fields          - List standard dynamic fields');
  console.log('  statuses        - List workflow statuses');
  console.log('  relationships   - List relationship types');
  console.log('  transactions    - List transaction types'); 
  console.log('  patterns        - List smart code patterns');
  console.log('  copy-to <org>   - Copy all templates to another organization');
}

// Run the explorer
exploreSystemOrg().catch(console.error);