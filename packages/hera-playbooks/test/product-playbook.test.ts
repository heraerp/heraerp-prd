import { executePlaybook } from '../src/core/executor';
import { PRODUCT_PLAYBOOK_V1 } from '../src/salon/product.v1';
import { universalApiAdapters } from '../src/adapters/universalApiAdapter';

// Example test showing how to execute a playbook
async function testProductPlaybook() {
  console.log('🧪 Testing Salon Product Playbook...\n');
  
  // Mock entity data
  const productEntity = {
    id: 'prod_123',
    entity_type: 'SALON_PRODUCT',
    entity_name: 'Premium Hair Serum',
    dynamic_data: [
      { field_name: 'brand', field_value: 'HERA Beauty' },
      { field_name: 'category', field_value: 'hair_care' },
      { field_name: 'price_cost', field_value: 25.00 },
      { field_name: 'price_market', field_value: 89.99 },
    ],
  };
  
  // Execute playbook
  const result = await executePlaybook(PRODUCT_PLAYBOOK_V1, productEntity, {
    organizationId: 'org_test_123',
    actorId: 'user_admin_456',
    actorRole: 'admin',
    adapters: {
      // For testing, we'll use a mock adapter that logs operations
      setDynamic: (ctx, field) => {
        console.log(`  📝 SET DYNAMIC: ${field.name} = ${field.value} (${field.type})`);
        universalApiAdapters.setDynamic(ctx, field);
      },
      
      link: (ctx, rel) => {
        console.log(`  🔗 LINK: ${rel.type} from ${rel.from} to ${rel.to}`);
        universalApiAdapters.link(ctx, rel);
      },
      
      persist: async (ctx) => {
        console.log(`\n  💾 PERSIST:`);
        console.log(`     Headers:`, ctx.out.headers);
        console.log(`     Dynamic Fields:`, ctx.out.dynamicFields?.length || 0);
        console.log(`     Relationships:`, ctx.out.relationships?.length || 0);
        // In real usage, this would call the API
      },
      
      audit: (ctx, event, payload) => {
        console.log(`\n  📋 AUDIT: ${event}`, payload);
      },
      
      tx: async (fn) => {
        console.log(`  🔄 TRANSACTION: Starting...`);
        await fn();
        console.log(`  ✅ TRANSACTION: Committed`);
      },
      
      fetchEntityById: async (id, opts) => {
        console.log(`  🔍 FETCH: Entity ${id}`);
        return { id, ...opts };
      },
    },
  });
  
  // Show results
  console.log('\n📊 Execution Results:');
  console.log('Steps executed:', result.steps.length);
  console.log('\nStep Summary:');
  result.steps.forEach((step, i) => {
    const icon = step.status === 'ok' ? '✅' : '❌';
    console.log(`  ${i + 1}. ${icon} ${step.kind}:${step.id} - ${step.status}`);
    if (step.message) console.log(`     Message: ${step.message}`);
  });
  
  console.log('\nOutput State:');
  console.log('  Margin calculated:', result.state.margin);
  console.log('  Price after markup:', result.state.price);
  
  console.log('\n✨ Playbook execution complete!\n');
}

// Run the test
if (require.main === module) {
  testProductPlaybook().catch(console.error);
}