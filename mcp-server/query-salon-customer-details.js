// Query customer details for Hair Talkz Salon
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = process.env.DEFAULT_SALON_ORGANIZATION_ID || '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function querySalonCustomerDetails() {
  console.log('\n🏭 Querying customer details for Hair Talkz Salon');
  console.log(`Organization ID: ${SALON_ORG_ID}`);
  
  try {
    // Get one customer to check details
    const { data: customers, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'customer')
      .limit(3);

    if (error) {
      console.error('Error querying customers:', error);
      return;
    }

    console.log(`\n📋 Checking details for ${customers.length} customers:\n`);
    
    for (const customer of customers) {
      console.log(`Customer: ${customer.entity_name} (${customer.id})`);
      
      // Get all dynamic data for this customer
      const { data: dynamicData, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', customer.id)
        .eq('organization_id', SALON_ORG_ID);

      if (!dynamicError && dynamicData && dynamicData.length > 0) {
        console.log('  Dynamic Fields:');
        dynamicData.forEach(field => {
          const value = field.field_value || field.field_value_text || 
                       field.field_value_number || field.field_value_date || 
                       field.field_value_boolean;
          console.log(`    ${field.field_name}: ${value}`);
        });
      } else {
        console.log('  No dynamic data found');
      }

      // Get relationships (like loyalty status)
      const { data: relationships, error: relError } = await supabase
        .from('core_relationships')
        .select('*, related_entity:to_entity_id(entity_name, entity_code)')
        .eq('from_entity_id', customer.id)
        .eq('organization_id', SALON_ORG_ID);

      if (!relError && relationships && relationships.length > 0) {
        console.log('  Relationships:');
        relationships.forEach(rel => {
          console.log(`    ${rel.relationship_type}: ${rel.related_entity?.entity_name || rel.to_entity_id}`);
        });
      }

      // Get transaction count
      const { data: transactions, error: txError, count } = await supabase
        .from('universal_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', SALON_ORG_ID)
        .or(`source_entity_id.eq.${customer.id},target_entity_id.eq.${customer.id}`);

      if (!txError) {
        console.log(`  Transactions: ${count || 0}`);
      }

      console.log('');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the query
querySalonCustomerDetails();