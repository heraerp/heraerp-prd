// Query customers for Hair Talkz Salon
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = process.env.DEFAULT_SALON_ORGANIZATION_ID || '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function querySalonCustomers() {
  console.log('\n🏭 Querying customers for Hair Talkz Salon');
  console.log(`Organization ID: ${SALON_ORG_ID}`);
  
  try {
    // Query customer entities
    const { data: customers, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'customer')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error querying customers:', error);
      return;
    }

    console.log(`\n✅ Found ${customers.length} customers:\n`);
    
    if (customers.length === 0) {
      console.log('No customers found. You may need to create some demo customers.');
    } else {
      customers.forEach((customer, index) => {
        console.log(`${index + 1}. ${customer.entity_name}`);
        console.log(`   ID: ${customer.id}`);
        console.log(`   Code: ${customer.entity_code}`);
        console.log(`   Created: ${new Date(customer.created_at).toLocaleDateString()}`);
        console.log('');
      });
    }

    // Also check dynamic data for customer details
    if (customers.length > 0) {
      console.log('\n📋 Checking customer details...');
      
      const customerIds = customers.map(c => c.id);
      const { data: dynamicData, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .in('entity_id', customerIds)
        .in('field_name', ['email', 'phone']);

      if (!dynamicError && dynamicData) {
        console.log(`Found ${dynamicData.length} customer contact details`);
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the query
querySalonCustomers();