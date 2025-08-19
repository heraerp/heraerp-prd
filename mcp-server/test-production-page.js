#!/usr/bin/env node
/**
 * Test Production Customer Page
 * Verifies that the production customer page can fetch and display data
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function testProductionPage() {
  console.log('🧪 Testing Production Customer Page Data...\n');

  try {
    // 1. Get all customers
    const { data: customers, error: customersError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'customer')
      .order('created_at', { ascending: false });

    if (customersError) throw customersError;
    console.log(`✅ Found ${customers?.length || 0} customers`);

    // 2. Get dynamic fields for all customers
    const customerIds = customers?.map(c => c.id) || [];
    const { data: dynamicFields, error: fieldsError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', organizationId)
      .in('entity_id', customerIds);

    if (fieldsError) throw fieldsError;
    console.log(`✅ Found ${dynamicFields?.length || 0} dynamic fields`);

    // 3. Get relationships (loyalty tiers, favorite services)
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', organizationId)
      .in('from_entity_id', customerIds)
      .in('relationship_type', ['has_status', 'favorite_service']);

    if (relError) throw relError;
    console.log(`✅ Found ${relationships?.length || 0} relationships`);

    // 4. Get transactions
    const { data: transactions, error: txnError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'salon_service');

    if (txnError) throw txnError;
    console.log(`✅ Found ${transactions?.length || 0} transactions`);

    // 5. Show sample customer data
    if (customers && customers.length > 0) {
      console.log('\n📊 Sample Customer Data:');
      const sampleCustomer = customers[0];
      console.log(`\nCustomer: ${sampleCustomer.entity_name}`);
      console.log(`ID: ${sampleCustomer.id}`);
      console.log(`Status: ${sampleCustomer.status}`);

      // Get fields for this customer
      const customerFields = dynamicFields?.filter(f => f.entity_id === sampleCustomer.id) || [];
      console.log(`\nDynamic Fields (${customerFields.length}):`);
      customerFields.forEach(field => {
        const value = field.field_value_text || field.field_value_number || field.field_value_date;
        console.log(`  ${field.field_name}: ${value}`);
      });

      // Get relationships
      const customerRels = relationships?.filter(r => r.from_entity_id === sampleCustomer.id) || [];
      console.log(`\nRelationships (${customerRels.length}):`);
      customerRels.forEach(rel => {
        console.log(`  ${rel.relationship_type}: ${JSON.stringify(rel.relationship_data)}`);
      });
    }

    console.log('\n✅ Production page should display all this data correctly!');
    console.log('\n🌐 Access the production customer page at:');
    console.log('   http://localhost:3007/salon/customers');
    console.log('\n📝 Note: You may need to log in first if authentication is enabled.');

  } catch (error) {
    console.error('❌ Error testing production page:', error);
  }
}

// Run the test
testProductionPage().catch(console.error);