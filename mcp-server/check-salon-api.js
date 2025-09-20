// Quick check to see what the universal API is returning
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function checkAPI() {
  console.log('🔍 Checking what Universal API would return');
  console.log('=====================================\n');

  try {
    // Simulate what the POS component does - read ALL entities
    const { data: allEntities, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('Error reading entities:', error);
      return;
    }

    console.log(`Total active entities: ${allEntities.length}`);

    // Filter by organization
    const orgEntities = allEntities.filter(e => e.organization_id === SALON_ORG_ID);
    console.log(`Salon org entities: ${orgEntities.length}`);

    // Filter services
    const services = orgEntities.filter(e => 
      e.smart_code && (
        e.smart_code.startsWith('HERA.SALON.SVC.') ||
        e.entity_type === 'service'
      )
    );
    console.log(`\n📋 Services found: ${services.length}`);
    
    // Show first 3 services
    services.slice(0, 3).forEach(s => {
      console.log(`  - ${s.entity_name} (${s.entity_type})`);
      console.log(`    Smart code: ${s.smart_code}`);
      console.log(`    Price: ${s.metadata?.price || 'No price'}`);
    });

    // Filter products
    const products = orgEntities.filter(e => 
      e.smart_code && (
        e.smart_code.startsWith('HERA.SALON.PRD.') ||
        e.smart_code.startsWith('HERA.SALON.RETAIL.') ||
        e.entity_type === 'product'
      )
    );
    console.log(`\n📦 Products found: ${products.length}`);
    
    // Show first 3 products
    products.slice(0, 3).forEach(p => {
      console.log(`  - ${p.entity_name} (${p.entity_type})`);
      console.log(`    Smart code: ${p.smart_code}`);
      console.log(`    Price: ${p.metadata?.price || 'No price'}`);
    });

    // Filter employees
    const employees = orgEntities.filter(e => 
      e.smart_code && (
        e.smart_code.startsWith('HERA.SALON.STAFF.') ||
        e.smart_code.startsWith('HERA.SALON.HR.') ||
        e.entity_type === 'employee'
      )
    );
    console.log(`\n👥 Employees found: ${employees.length}`);

    // Check if prices are in metadata
    const itemsWithPrice = [...services, ...products].filter(item => item.metadata?.price);
    console.log(`\n💰 Items with prices in metadata: ${itemsWithPrice.length}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAPI();