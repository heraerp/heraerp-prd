#!/usr/bin/env node
/**
 * Use HERA System Templates
 * Demonstrates how to use the system organization templates in practice
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// HERA System Organization ID
const SYSTEM_ORG_ID = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944';

// Current working organization
const CURRENT_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  console.log('\n🔧 HERA System Templates Usage\n');

  switch (command) {
    case 'create-customer':
      await createCustomerWithTemplate();
      break;
      
    case 'create-transaction':
      await createTransactionWithTemplate();
      break;
      
    case 'assign-status':
      await assignStatusToEntity(args[1], args[2]);
      break;
      
    case 'setup-workflow':
      await setupWorkflowForEntity(args[1]);
      break;
      
    case 'add-standard-fields':
      await addStandardFieldsToEntity(args[1]);
      break;
      
    case 'demo-complete-flow':
      await demoCompleteFlow();
      break;
      
    default:
      showHelp();
  }
}

async function createCustomerWithTemplate() {
  console.log('📋 Creating Customer Using System Template...\n');
  
  // First, get the customer template from system org
  const { data: template } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SYSTEM_ORG_ID)
    .eq('entity_type', 'entity_type_definition')
    .eq('entity_code', 'ET-CUSTOMER')
    .single();
  
  if (!template) {
    console.log('❌ Customer template not found');
    return;
  }
  
  console.log(`Using template: ${template.entity_name}`);
  console.log(`Smart Code Pattern: ${template.smart_code}\n`);
  
  // Create a customer based on the template
  const { data: customer, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: CURRENT_ORG_ID,
      entity_type: 'customer',
      entity_name: 'Acme Corporation',
      entity_code: 'CUST-ACME-001',
      smart_code: template.smart_code.replace('TEMPLATE', 'CREATE'),
      metadata: {
        created_from_template: template.id,
        template_org: SYSTEM_ORG_ID
      },
      ai_confidence: 0.95,
      status: 'active'
    })
    .select()
    .single();
  
  if (error) {
    console.log('❌ Error creating customer:', error.message);
    return;
  }
  
  console.log('✅ Customer created:', customer.id);
  console.log(`   Name: ${customer.entity_name}`);
  console.log(`   Code: ${customer.entity_code}\n`);
  
  // Now add standard fields from the template
  console.log('Adding standard fields...\n');
  
  // Get standard customer fields from system org
  const { data: fields } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SYSTEM_ORG_ID)
    .eq('entity_type', 'field_definition')
    .in('entity_code', ['FIELD-EMAIL', 'FIELD-PHONE', 'FIELD-CREDIT_LIMIT', 'FIELD-PAYMENT_TERMS']);
  
  if (fields) {
    for (const field of fields) {
      const fieldName = field.entity_name.replace('Field: ', '');
      const fieldType = field.metadata?.field_type || 'text';
      
      let fieldData = {
        organization_id: CURRENT_ORG_ID,
        entity_id: customer.id,
        field_name: fieldName,
        smart_code: field.smart_code.replace('TEMPLATE', 'VALUE'),
        field_type: fieldType
      };
      
      // Set sample values
      switch (fieldName) {
        case 'email':
          fieldData.field_value_text = 'contact@acme.com';
          break;
        case 'phone':
          fieldData.field_value_text = '+1-555-0123';
          break;
        case 'credit_limit':
          fieldData.field_value_number = 50000;
          break;
        case 'payment_terms':
          fieldData.field_value_text = 'NET30';
          break;
      }
      
      const { error: fieldError } = await supabase
        .from('core_dynamic_data')
        .insert(fieldData);
      
      if (!fieldError) {
        console.log(`  ✅ Added field: ${fieldName} = ${fieldData.field_value_text || fieldData.field_value_number}`);
      }
    }
  }
  
  console.log('\n✅ Customer setup complete with template fields!');
  return customer.id;
}

async function createTransactionWithTemplate() {
  console.log('💰 Creating Transaction Using System Template...\n');
  
  // Get the sale transaction template
  const { data: template } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SYSTEM_ORG_ID)
    .eq('entity_type', 'transaction_type')
    .eq('entity_code', 'TXN-SALE')
    .single();
  
  if (!template) {
    console.log('❌ Sale transaction template not found');
    return;
  }
  
  console.log(`Using template: ${template.entity_name}`);
  console.log(`Properties:`, template.metadata);
  
  // Create a transaction
  const { data: transaction, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: CURRENT_ORG_ID,
      transaction_type: 'sale',
      transaction_code: `SALE-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: 15000,
      smart_code: template.smart_code.replace('TEMPLATE', 'CREATE'),
      metadata: {
        created_from_template: template.id,
        affects_accounting: template.metadata?.affects_accounting,
        category: template.metadata?.category
      }
    })
    .select()
    .single();
  
  if (!error) {
    console.log('\n✅ Transaction created:', transaction.id);
    console.log(`   Type: ${transaction.transaction_type}`);
    console.log(`   Amount: $${transaction.total_amount}`);
  }
  
  return transaction?.id;
}

async function assignStatusToEntity(entityId, statusCode) {
  if (!entityId || !statusCode) {
    console.log('Usage: node use-system-templates.js assign-status <entity-id> <status-code>');
    console.log('Status codes: DRAFT, PENDING, IN_PROGRESS, APPROVED, etc.');
    return;
  }
  
  console.log(`🔄 Assigning Status ${statusCode} to Entity ${entityId}...\n`);
  
  // Get the status entity from system org
  const { data: status } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SYSTEM_ORG_ID)
    .eq('entity_type', 'workflow_status')
    .eq('entity_code', `STATUS-${statusCode.toUpperCase()}`)
    .single();
  
  if (!status) {
    console.log(`❌ Status ${statusCode} not found in system templates`);
    return;
  }
  
  // Get the relationship type template
  const { data: relType } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SYSTEM_ORG_ID)
    .eq('entity_type', 'relationship_type')
    .eq('entity_code', 'REL-HAS_STATUS')
    .single();
  
  // Create status entity in current org if it doesn't exist
  const { data: localStatus } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', CURRENT_ORG_ID)
    .eq('entity_type', 'workflow_status')
    .eq('entity_code', status.entity_code)
    .single();
  
  let statusEntityId = localStatus?.id;
  
  if (!localStatus) {
    // Copy the status to current org
    const { data: newStatus } = await supabase
      .from('core_entities')
      .insert({
        ...status,
        id: undefined,
        organization_id: CURRENT_ORG_ID,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    statusEntityId = newStatus?.id;
    console.log(`✅ Created local status entity: ${status.entity_name}`);
  }
  
  // Create the relationship
  const { error } = await supabase
    .from('core_relationships')
    .insert({
      organization_id: CURRENT_ORG_ID,
      from_entity_id: entityId,
      to_entity_id: statusEntityId,
      relationship_type: 'has_status',
      smart_code: relType?.smart_code || 'HERA.REL.WORKFLOW.HAS_STATUS.v1',
      metadata: {
        assigned_at: new Date().toISOString(),
        assigned_by: 'system',
        status_code: statusCode,
        status_name: status.entity_name,
        color: status.metadata?.color_code
      }
    });
  
  if (!error) {
    console.log(`✅ Status assigned successfully!`);
    console.log(`   Entity: ${entityId}`);
    console.log(`   Status: ${status.entity_name} (${status.metadata?.color_code})`);
  }
}

async function setupWorkflowForEntity(entityId) {
  if (!entityId) {
    console.log('Usage: node use-system-templates.js setup-workflow <entity-id>');
    return;
  }
  
  console.log(`🔄 Setting Up Complete Workflow for Entity ${entityId}...\n`);
  
  // Assign initial status (DRAFT)
  await assignStatusToEntity(entityId, 'DRAFT');
  
  console.log('\n📋 Available workflow transitions:');
  console.log('  DRAFT → PENDING (Submit for Review)');
  console.log('  PENDING → IN_PROGRESS (Start Processing)');
  console.log('  PENDING → REJECTED (Reject)');
  console.log('  IN_PROGRESS → UNDER_REVIEW (Submit for Review)');
  console.log('  UNDER_REVIEW → APPROVED (Approve)');
  console.log('  UNDER_REVIEW → REJECTED (Reject)');
  console.log('  APPROVED → COMPLETED (Complete)');
  console.log('  Any → CANCELLED (Cancel)');
  console.log('  COMPLETED → ARCHIVED (Archive)\n');
  
  console.log('✅ Workflow setup complete! Entity is now in DRAFT status.');
}

async function addStandardFieldsToEntity(entityId) {
  if (!entityId) {
    console.log('Usage: node use-system-templates.js add-standard-fields <entity-id>');
    return;
  }
  
  console.log(`📝 Adding Standard Fields to Entity ${entityId}...\n`);
  
  // Get the entity to determine its type
  const { data: entity } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', entityId)
    .single();
  
  if (!entity) {
    console.log('❌ Entity not found');
    return;
  }
  
  console.log(`Entity Type: ${entity.entity_type}`);
  console.log(`Entity Name: ${entity.entity_name}\n`);
  
  // Determine which fields to add based on entity type
  let fieldCodes = [];
  switch (entity.entity_type) {
    case 'customer':
    case 'vendor':
      fieldCodes = ['FIELD-EMAIL', 'FIELD-PHONE', 'FIELD-ADDRESS_LINE_1', 'FIELD-CITY', 'FIELD-COUNTRY', 'FIELD-CREDIT_LIMIT'];
      break;
    case 'product':
      fieldCodes = ['FIELD-CATEGORY', 'FIELD-SUBCATEGORY', 'FIELD-TAGS'];
      break;
    case 'project':
    case 'task':
      fieldCodes = ['FIELD-START_DATE', 'FIELD-END_DATE', 'FIELD-DUE_DATE', 'FIELD-COMPLETION_PERCENTAGE', 'FIELD-PRIORITY'];
      break;
    default:
      fieldCodes = ['FIELD-CATEGORY', 'FIELD-TAGS', 'FIELD-PRIORITY'];
  }
  
  // Get field templates
  const { data: fields } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SYSTEM_ORG_ID)
    .eq('entity_type', 'field_definition')
    .in('entity_code', fieldCodes);
  
  if (fields) {
    console.log('Adding fields:\n');
    
    for (const field of fields) {
      const fieldName = field.entity_name.replace('Field: ', '');
      const fieldType = field.metadata?.field_type || 'text';
      
      const { error } = await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: CURRENT_ORG_ID,
          entity_id: entityId,
          field_name: fieldName,
          field_type: fieldType,
          smart_code: field.smart_code.replace('TEMPLATE', 'INSTANCE'),
          metadata: {
            from_template: field.id,
            category: field.metadata?.category
          }
        });
      
      if (!error) {
        console.log(`  ✅ Added field: ${fieldName} (${fieldType})`);
      }
    }
  }
  
  console.log('\n✅ Standard fields added successfully!');
}

async function demoCompleteFlow() {
  console.log('🎯 Complete Demo: Create Customer → Add Fields → Create Transaction → Assign Status\n');
  
  // Step 1: Create Customer
  console.log('Step 1: Creating Customer...\n');
  const customerId = await createCustomerWithTemplate();
  
  if (!customerId) return;
  
  console.log('\n---\n');
  
  // Step 2: Setup Workflow
  console.log('Step 2: Setting up Workflow...\n');
  await setupWorkflowForEntity(customerId);
  
  console.log('\n---\n');
  
  // Step 3: Create Transaction
  console.log('Step 3: Creating Sale Transaction...\n');
  const transactionId = await createTransactionWithTemplate();
  
  if (transactionId) {
    // Link transaction to customer
    await supabase
      .from('core_relationships')
      .insert({
        organization_id: CURRENT_ORG_ID,
        from_entity_id: transactionId,
        to_entity_id: customerId,
        relationship_type: 'related_to',
        smart_code: 'HERA.REL.REFERENCE.RELATED_TO.v1',
        metadata: {
          relationship_context: 'customer_transaction'
        }
      });
    
    console.log(`\n✅ Linked transaction to customer`);
  }
  
  console.log('\n---\n');
  
  // Step 4: Update Status
  console.log('Step 4: Updating Customer Status to PENDING...\n');
  await assignStatusToEntity(customerId, 'PENDING');
  
  console.log('\n---\n');
  
  console.log('🎉 Complete demo finished! Summary:');
  console.log(`  • Customer created with ID: ${customerId}`);
  console.log(`  • Standard fields added (email, phone, credit limit, etc.)`);
  console.log(`  • Transaction created with ID: ${transactionId}`);
  console.log(`  • Workflow status: DRAFT → PENDING`);
  console.log(`  • All using HERA System Organization templates!`);
}

function showHelp() {
  console.log('Usage: node use-system-templates.js <command> [args]\n');
  console.log('Commands:');
  console.log('  create-customer              - Create a customer using templates');
  console.log('  create-transaction           - Create a transaction using templates');
  console.log('  assign-status <id> <status>  - Assign workflow status to entity');
  console.log('  setup-workflow <entity-id>   - Setup complete workflow for entity');
  console.log('  add-standard-fields <id>     - Add standard fields to entity');
  console.log('  demo-complete-flow           - Run complete demo flow');
  console.log('\nStatus Codes: DRAFT, PENDING, IN_PROGRESS, APPROVED, REJECTED, etc.');
}

// Run the tool
main().catch(console.error);