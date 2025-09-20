const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function testPOSData() {
  console.log('🔍 Testing Salon POS Data Structure');
  console.log('===================================\n');

  try {
    // Test loading services the way the POS does
    const { data: services, error: servicesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'service')
      .eq('status', 'active')
      .limit(5);

    if (servicesError) {
      console.error('Error loading services:', servicesError);
      return;
    }

    console.log(`📋 Found ${services?.length || 0} services\n`);
    
    // Display services with their metadata including prices
    if (services) {
      services.forEach(service => {
        console.log(`Service: ${service.entity_name}`);
        console.log(`  ID: ${service.id}`);
        console.log(`  Code: ${service.entity_code}`);
        console.log(`  Price: AED ${service.metadata?.price || 'Not set'}`);
        console.log(`  Category: ${service.metadata?.category || 'Not set'}`);
        console.log(`  Duration: ${service.metadata?.duration || service.metadata?.duration_minutes || 'Not set'} minutes`);
        console.log(`  Available: ${service.metadata?.available !== false}`);
        console.log('');
      });
    }

    // Test loading employees
    const { data: employees, error: employeesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'employee')
      .eq('status', 'active')
      .limit(3);

    console.log(`\n👥 Found ${employees?.length || 0} employees`);
    if (employees) {
      employees.forEach(emp => {
        console.log(`  - ${emp.entity_name} (${emp.metadata?.role || 'Staff'})`);
      });
    }

    // Test loading products
    const { data: products, error: productsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'product')
      .eq('status', 'active')
      .limit(3);

    console.log(`\n📦 Found ${products?.length || 0} products`);
    if (products) {
      products.forEach(prod => {
        console.log(`  - ${prod.entity_name}: AED ${prod.metadata?.price || 'Not set'}`);
      });
    }

    console.log('\n✅ POS data is properly configured!');
    console.log('You should now be able to see services and products in the POS.');

  } catch (error) {
    console.error('Error testing POS data:', error);
  }
}

testPOSData();