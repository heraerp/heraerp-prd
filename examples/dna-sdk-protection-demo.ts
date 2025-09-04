/**
 * HERA DNA SDK Protection Demo
 * This file demonstrates how the DNA SDK prevents violations at compile time
 */

import { 
  HeraDNAClient, 
  createOrganizationId, 
  createSmartCode,
  createEntityId,
  DNA,
  type SmartCode,
  type OrganizationId
} from '@hera/dna-sdk';

// ✅ CORRECT USAGE - Type-safe with DNA SDK
async function correctUsage() {
  // Create validated IDs
  const orgId = createOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  const smartCode = createSmartCode('HERA.CRM.CUST.ENT.PROF.v1');
  
  // Initialize client with type-safe organization ID
  const client = new HeraDNAClient({
    organizationId: orgId,
    enableRuntimeGates: true
  });
  
  // Create entity with all required fields
  const customer = await client.createEntity({
    entityType: 'customer',
    entityName: 'ACME Corporation',
    smartCode: smartCode,
    metadata: {
      industry: 'technology',
      employees: 500
    }
  });
  
  // Use fluent builder
  const product = await DNA.entity(orgId)
    .type('product')
    .name('Premium Widget')
    .code('PROD-001')
    .smartCode('HERA.INV.PROD.ITEM.STD.v1')
    .withMetadata({
      price: 99.99,
      category: 'widgets'
    })
    .build();
    
  // Create transaction with proper pattern
  const sale = await DNA.transaction(orgId)
    .type('sale')
    .smartCode('HERA.CRM.SALE.TXN.ORDER.v1')
    .fromEntity(customer.id)
    .amount(999.99)
    .withLines([
      {
        entityId: product.id,
        quantity: 10,
        unitPrice: 99.99,
        smartCode: createSmartCode('HERA.CRM.SALE.LINE.ITEM.v1')
      }
    ])
    .build();
}

// ❌ COMPILE-TIME ERRORS - These won't even compile!
async function compilationErrors() {
  // ERROR: Argument of type 'string' is not assignable to parameter of type 'OrganizationId'
  const client = new HeraDNAClient({
    organizationId: 'plain-string-not-allowed'
  });
  
  // ERROR: Property 'smartCode' is missing in type but required
  const entity = await client.createEntity({
    entityType: 'customer',
    entityName: 'Test'
    // Missing smartCode!
  });
  
  // ERROR: Argument of type 'string' is not assignable to parameter of type 'SmartCode'
  const badSmartCode = await client.createEntity({
    entityType: 'customer',
    entityName: 'Test',
    smartCode: 'NOT.A.VALID.SMART.CODE'
  });
  
  // ERROR: Property 'from' does not exist on type 'HeraDNAClient'
  // Direct database access is not available!
  const directDb = await client.from('core_entities').select('*');
  
  // ERROR: Argument of type '"custom_table"' is not assignable to parameter of type 'SacredTable'
  const customTable = await client.queryTable('custom_table');
  
  // ERROR: Property 'addColumn' does not exist on type 'HeraDNAClient'
  // Schema changes are impossible!
  await client.addColumn('core_entities', 'status', 'varchar');
  
  // ERROR: 'is_deleted' is not a valid field for entity metadata
  const softDelete = await client.createEntity({
    entityType: 'customer',
    entityName: 'Test',
    smartCode: createSmartCode('HERA.CRM.CUST.ENT.PROF.v1'),
    is_deleted: true // This field doesn't exist!
  });
}

// ❌ RUNTIME ERRORS - These compile but fail at runtime
async function runtimeErrors() {
  // This will throw: Invalid UUID format
  const badOrgId = createOrganizationId('not-a-uuid');
  
  // This will throw: Smart code doesn't match pattern
  const badSmartCode = createSmartCode('hera.crm.cust.ent.prof.v1'); // lowercase not allowed
  
  // This will throw: Cross-organization access denied
  const org1 = createOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  const org2 = createOrganizationId('a8b9c0d1-e2f3-4567-8901-23456789abcd');
  
  const client1 = new HeraDNAClient({ organizationId: org1 });
  const entity = await client1.createEntity({
    entityType: 'customer',
    entityName: 'Test',
    smartCode: createSmartCode('HERA.CRM.CUST.ENT.PROF.v1')
  });
  
  const client2 = new HeraDNAClient({ organizationId: org2 });
  // This will throw: Entity belongs to different organization
  await client2.updateEntity(entity.id, { entityName: 'Hacked!' });
}

// ✅ PROPER STATUS WORKFLOW - Using relationships, not columns
async function properStatusWorkflow() {
  const orgId = createOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  const client = new HeraDNAClient({ organizationId: orgId });
  
  // Create status entities (one-time setup)
  const draftStatus = await client.createEntity({
    entityType: 'workflow_status',
    entityName: 'Draft',
    entityCode: 'STATUS-DRAFT',
    smartCode: createSmartCode('HERA.WORKFLOW.STATUS.DRAFT.v1')
  });
  
  const activeStatus = await client.createEntity({
    entityType: 'workflow_status',
    entityName: 'Active',
    entityCode: 'STATUS-ACTIVE',
    smartCode: createSmartCode('HERA.WORKFLOW.STATUS.ACTIVE.v1')
  });
  
  // Create customer
  const customer = await client.createEntity({
    entityType: 'customer',
    entityName: 'New Customer',
    smartCode: createSmartCode('HERA.CRM.CUST.ENT.PROF.v1')
  });
  
  // Assign status via relationship
  await client.createRelationship({
    fromEntityId: customer.id,
    toEntityId: draftStatus.id,
    relationshipType: 'has_status',
    smartCode: createSmartCode('HERA.WORKFLOW.STATUS.ASSIGN.v1')
  });
  
  // Change status
  await client.createRelationship({
    fromEntityId: customer.id,
    toEntityId: activeStatus.id,
    relationshipType: 'has_status',
    smartCode: createSmartCode('HERA.WORKFLOW.STATUS.ASSIGN.v1')
  });
}

// ✅ WHATSAPP INTEGRATION - Using the DNA SDK
async function whatsAppWithDNA() {
  const orgId = createOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  const client = new HeraDNAClient({ organizationId: orgId });
  
  // Create WhatsApp thread (conversation)
  const thread = await DNA.transaction(orgId)
    .type('MESSAGE_THREAD')
    .smartCode('HERA.WHATSAPP.INBOX.THREAD.v1')
    .withMetadata({
      channel: 'whatsapp',
      phone_number: '+971501234567',
      status: 'open'
    })
    .build();
  
  // Send message
  const message = await DNA.transactionLine(orgId)
    .forTransaction(thread.id)
    .type('MESSAGE')
    .smartCode('HERA.WHATSAPP.MESSAGE.TEXT.v1')
    .description('Hello from HERA!')
    .withLineData({
      direction: 'outbound',
      text: 'Hello! How can I help you today?',
      channel_msg_id: `wamid_${Date.now()}`
    })
    .build();
}

// Export demo functions
export {
  correctUsage,
  compilationErrors,
  runtimeErrors,
  properStatusWorkflow,
  whatsAppWithDNA
};