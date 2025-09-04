/**
 * HERA DNA SDK - Compile-Time Protection Examples
 * This file demonstrates how the SDK prevents HERA violations at compile time
 */

import {
  HeraDNAClient,
  createOrganizationId,
  createSmartCode,
  SmartCode,
  OrganizationId
} from '../src';

// ✅ CORRECT: Type-safe usage
function correctUsage() {
  const orgId = createOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  const smartCode = createSmartCode('HERA.CRM.CUST.ENT.PROF.v1');
  
  const client = new HeraDNAClient({
    organizationId: orgId,
    enableRuntimeGates: true
  });

  // This compiles correctly
  client.createEntity({
    entityType: 'customer',
    entityName: 'Test Customer',
    smartCode: smartCode
  });
}

// ❌ INCORRECT: These examples would not compile

function violateSmartCode() {
  const orgId = createOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  
  // This would throw at runtime
  // const badCode = createSmartCode('invalid-format'); // ❌ Runtime error
  
  const client = new HeraDNAClient({ organizationId: orgId });

  // Cannot pass plain string where SmartCode is expected
  // client.createEntity({
  //   entityType: 'customer',
  //   entityName: 'Test',
  //   smartCode: 'HERA.CRM.CUST.ENT.PROF.v1' // ❌ Type error: string is not SmartCode
  // });
}

function violateOrganizationId() {
  // Cannot pass plain string where OrganizationId is expected
  // const client = new HeraDNAClient({
  //   organizationId: 'not-a-uuid' // ❌ Type error: string is not OrganizationId
  // });

  // Must use createOrganizationId
  const orgId = createOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  const client = new HeraDNAClient({ organizationId: orgId });
}

function violateSacredTables() {
  // The SDK only allows operations on sacred tables
  // No way to access custom tables through the SDK
  
  const orgId = createOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  const client = new HeraDNAClient({ organizationId: orgId });
  
  // Only sacred table operations are available
  client.queryEntities({ entityType: 'customer' }); // ✅ Correct
  
  // Cannot query arbitrary tables - method doesn't exist
  // client.queryTable('custom_table'); // ❌ Method doesn't exist
}

function enforceOrganizationIsolation() {
  const org1 = createOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  const org2 = createOrganizationId('a47ac10b-58cc-4372-a567-0e02b2c3d479');
  
  const client1 = new HeraDNAClient({ organizationId: org1 });
  const client2 = new HeraDNAClient({ organizationId: org2 });
  
  // Each client is bound to its organization
  // Cannot cross organization boundaries
  
  // This is safe - each client only accesses its own org
  client1.queryEntities({ entityType: 'customer' });
  client2.queryEntities({ entityType: 'customer' });
  
  // To switch organizations, must create new client
  const newClient = client1.switchOrganization(org2);
}

// Demonstrate branded types
function brandedTypes() {
  // These are distinct types, not just aliases
  let smartCode: SmartCode;
  let orgId: OrganizationId;
  let plainString: string = "test";
  
  // Cannot assign plain string to branded types
  // smartCode = plainString; // ❌ Type error
  // orgId = plainString; // ❌ Type error
  
  // Must use factory functions
  smartCode = createSmartCode('HERA.CRM.CUST.ENT.PROF.v1');
  orgId = createOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  
  // Cannot mix branded types
  // smartCode = orgId; // ❌ Type error
}

console.log('✅ Compile-time protection examples compiled successfully!');
console.log('Uncomment the error examples to see TypeScript prevent violations.');