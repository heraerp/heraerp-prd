// Create test transactions for revenue testing
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function createTestTransactions() {
  const organizationId = '550e8400-e29b-41d4-a716-446655440000';
  
  try {
    // Get staff and services
    const { data: staff } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'employee')
      .limit(3);
      
    const { data: services } = await supabase
      .from('core_entities')
      .select('id, entity_name, core_dynamic_data(*)')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'salon_service')
      .limit(5);
      
    const { data: clients } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'customer')
      .limit(5);
      
    console.log(`Found ${staff?.length || 0} staff, ${services?.length || 0} services, ${clients?.length || 0} clients`);
    
    // Create transactions for this month
    const now = new Date();
    const transactions = [];
    
    // Create 10 completed appointments/sales
    for (let i = 0; i < 10; i++) {
      const service = services[i % services.length];
      const staffMember = staff[i % staff.length];
      const client = clients[i % clients.length] || { id: null, entity_name: 'Walk-in Client' };
      
      // Extract price from dynamic data
      const priceField = service.core_dynamic_data?.find(f => f.field_name === 'price');
      const price = priceField?.field_value_number || 100;
      
      const transaction = {
        organization_id: organizationId,
        transaction_type: i % 2 === 0 ? 'appointment' : 'sale',
        transaction_code: `TXN-TEST-${Date.now()}-${i}`,
        transaction_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).toISOString(),
        source_entity_id: client.id,
        target_entity_id: staffMember.id,
        total_amount: price,
        transaction_status: 'completed',
        smart_code: 'HERA.SALON.SALE.COMPLETED.v1',
        metadata: {
          service_id: service.id,
          service_name: service.entity_name,
          client_name: client.entity_name,
          staff_name: staffMember.entity_name,
          payment_method: 'card'
        }
      };
      
      transactions.push(transaction);
    }
    
    // Insert all transactions
    const { data, error } = await supabase
      .from('universal_transactions')
      .insert(transactions)
      .select();
      
    if (error) throw error;
    
    console.log(`✅ Created ${data.length} test transactions`);
    console.log(`💰 Total revenue: $${transactions.reduce((sum, t) => sum + t.total_amount, 0)}`);
    
  } catch (error) {
    console.error('Error creating test transactions:', error);
  }
}

createTestTransactions();