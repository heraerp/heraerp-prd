/**
 * HERA DNA SDK - Basic Usage Example
 * Demonstrates type-safe operations with the SDK
 */

import {
  HeraDNAClient,
  createOrganizationId,
  createSmartCode,
  DNA,
  isSmartCode,
  validateEntityType
} from '../src';

async function main() {
  console.log('🧬 HERA DNA SDK Example\n');

  // 1. Initialize client with organization context
  const orgId = createOrganizationId('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  const client = new HeraDNAClient({
    organizationId: orgId,
    enableRuntimeGates: true,
    enableAudit: true
  });

  console.log('✅ Client initialized with organization:', orgId);

  // 2. Create a customer entity
  console.log('\n📦 Creating customer entity...');
  const customerSmartCode = createSmartCode('HERA.CRM.CUST.ENT.PROF.v1');
  
  const customerResult = await client.createEntity({
    entityType: 'customer',
    entityName: 'ACME Corporation',
    entityCode: 'CUST-001',
    smartCode: customerSmartCode,
    metadata: {
      industry: 'Technology',
      size: 'Enterprise',
      annual_revenue: 50000000
    }
  });

  if (customerResult.success && customerResult.data) {
    console.log('✅ Customer created:', customerResult.data.id);
  }

  // 3. Add dynamic fields to customer
  console.log('\n🔧 Adding dynamic fields...');
  if (customerResult.success && customerResult.data) {
    const creditLimitResult = await client.setDynamicField({
      entityId: customerResult.data.id,
      fieldName: 'credit_limit',
      fieldValue: 100000,
      smartCode: createSmartCode('HERA.CRM.CUST.DYN.CREDIT.v1')
    });

    if (creditLimitResult.success) {
      console.log('✅ Credit limit set to $100,000');
    }
  }

  // 4. Create a product using builder pattern
  console.log('\n🏗️ Creating product with builder...');
  const product = DNA.entity(orgId)
    .type('product')
    .name('Premium Widget')
    .code('PROD-001')
    .smartCode('HERA.INV.PROD.ITEM.STD.v1')
    .metadata({
      category: 'Electronics',
      price: 99.99,
      stock_quantity: 500
    })
    .build();

  console.log('✅ Product built:', product);

  // 5. Create a sales transaction
  console.log('\n💰 Creating sales transaction...');
  const saleSmartCode = DNA.smartCode()
    .industry('RETAIL')
    .module('SALES')
    .function('ORDER')
    .type('STD')
    .version(1)
    .build();

  const saleResult = await client.createTransaction({
    transactionType: 'sale',
    transactionCode: 'SALE-2024-001',
    transactionDate: new Date(),
    smartCode: saleSmartCode,
    totalAmount: 999.90,
    currency: 'USD',
    metadata: {
      payment_method: 'credit_card',
      sales_channel: 'online'
    }
  });

  if (saleResult.success) {
    console.log('✅ Sale transaction created');
  }

  // 6. Query entities
  console.log('\n🔍 Querying entities...');
  const queryResult = await client.queryEntities({
    entityType: 'customer',
    limit: 10
  });

  if (queryResult.success && queryResult.data) {
    console.log(`✅ Found ${queryResult.data.length} customers`);
  }

  // 7. Demonstrate type safety
  console.log('\n🛡️ Type Safety Examples:');
  
  // This won't compile - wrong smart code format
  // const invalidCode = createSmartCode('INVALID-CODE'); // ❌ Error!
  
  // This won't compile - wrong ID format
  // const invalidOrg = createOrganizationId('not-a-uuid'); // ❌ Error!
  
  // Type guards work
  const someValue: unknown = 'HERA.CRM.CUST.ENT.PROF.v1';
  if (isSmartCode(someValue)) {
    console.log('✅ Valid smart code detected:', someValue);
  }

  // Validation helpers
  try {
    validateEntityType('customer');
    console.log('✅ Entity type validation passed');
  } catch (error) {
    console.error('❌ Validation failed:', error);
  }

  console.log('\n🎉 Example completed successfully!');
}

// Run the example
main().catch(console.error);