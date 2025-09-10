// Test furniture seeding with Universal API
const { universalApi } = require('../src/lib/universal-api');

const orgId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c';

async function seedFurniture() {
  try {
    console.log('Setting organization ID:', orgId);
    universalApi.setOrganizationId(orgId);
    
    // Create a test product
    console.log('Creating test product...');
    const product = await universalApi.createEntity({
      entity_type: 'product',
      entity_code: 'TEST-PROD-001',
      entity_name: 'Test Furniture Product',
      smart_code: 'HERA.FURNITURE.PRODUCT.TEST.v1',
      metadata: { category: 'Test' }
    });
    
    console.log('Product created:', product);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

seedFurniture();