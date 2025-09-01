const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ICE_CREAM_ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656';

async function setupIceCreamDemo() {
  console.log('Setting up ice cream demo data...');

  try {
    // 1. Create Products
    const products = [
      {
        organization_id: ICE_CREAM_ORG_ID,
        entity_type: 'product',
        entity_name: 'Vanilla Ice Cream',
        entity_code: 'ICE-VANILLA-001',
        smart_code: 'HERA.MFG.PROD.ICE.VANILLA.v1',
        metadata: { 
          category: 'ice_cream',
          flavor: 'vanilla',
          unit: 'liter',
          production_cost: 45
        }
      },
      {
        organization_id: ICE_CREAM_ORG_ID,
        entity_type: 'product',
        entity_name: 'Chocolate Ice Cream',
        entity_code: 'ICE-CHOCO-001',
        smart_code: 'HERA.MFG.PROD.ICE.CHOCOLATE.v1',
        metadata: { 
          category: 'ice_cream',
          flavor: 'chocolate',
          unit: 'liter',
          production_cost: 50
        }
      },
      {
        organization_id: ICE_CREAM_ORG_ID,
        entity_type: 'product',
        entity_name: 'Strawberry Ice Cream',
        entity_code: 'ICE-STRAW-001',
        smart_code: 'HERA.MFG.PROD.ICE.STRAWBERRY.v1',
        metadata: { 
          category: 'ice_cream',
          flavor: 'strawberry',
          unit: 'liter',
          production_cost: 48
        }
      }
    ];

    const { data: createdProducts, error: prodError } = await supabase
      .from('core_entities')
      .insert(products)
      .select();

    if (prodError) {
      console.error('Error creating products:', prodError);
      return;
    }
    console.log(`✅ Created ${createdProducts.length} products`);

    // 2. Create Outlets
    const outlets = [
      {
        organization_id: ICE_CREAM_ORG_ID,
        entity_type: 'location',
        entity_name: 'Kochi Main Factory',
        entity_code: 'OUTLET-FACTORY-001',
        smart_code: 'HERA.MFG.LOC.FACTORY.MAIN.v1',
        metadata: { 
          type: 'factory',
          address: 'Kochi Industrial Area',
          capacity: 5000
        }
      },
      {
        organization_id: ICE_CREAM_ORG_ID,
        entity_type: 'location',
        entity_name: 'Kochi City Outlet',
        entity_code: 'OUTLET-RETAIL-001',
        smart_code: 'HERA.MFG.LOC.OUTLET.CITY.v1',
        metadata: { 
          type: 'retail',
          address: 'MG Road, Kochi',
          capacity: 100
        }
      },
      {
        organization_id: ICE_CREAM_ORG_ID,
        entity_type: 'location',
        entity_name: 'Marine Drive Outlet',
        entity_code: 'OUTLET-RETAIL-002',
        smart_code: 'HERA.MFG.LOC.OUTLET.MARINE.v1',
        metadata: { 
          type: 'retail',
          address: 'Marine Drive, Kochi',
          capacity: 80
        }
      }
    ];

    const { data: createdOutlets, error: outletError } = await supabase
      .from('core_entities')
      .insert(outlets)
      .select();

    if (outletError) {
      console.error('Error creating outlets:', outletError);
      return;
    }
    console.log(`✅ Created ${createdOutlets.length} outlets`);

    // 3. Create Production Transactions
    const today = new Date();
    const transactions = [];
    
    // Create some production batches
    for (let i = 0; i < 5; i++) {
      const productIndex = i % 3;
      const product = createdProducts[productIndex];
      
      transactions.push({
        organization_id: ICE_CREAM_ORG_ID,
        transaction_type: 'production',
        transaction_code: `PROD-${Date.now()}-${i}`,
        transaction_date: new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
        total_amount: 100 * (productIndex + 1), // Quantity produced
        smart_code: 'HERA.MFG.TXN.PROD.BATCH.v1',
        metadata: {
          batch_number: `BATCH-2024-${String(i + 1).padStart(3, '0')}`,
          quality_status: 'passed',
          production_cost: product.metadata.production_cost * 100,
          factory_id: createdOutlets[0].id,
          product_id: product.id
        }
      });
    }

    const { data: createdTransactions, error: txnError } = await supabase
      .from('universal_transactions')
      .insert(transactions)
      .select();

    if (txnError) {
      console.error('Error creating transactions:', txnError);
      return;
    }
    console.log(`✅ Created ${createdTransactions.length} production transactions`);

    // 4. Add some inventory levels as dynamic data
    for (const product of createdProducts) {
      const inventoryData = {
        organization_id: ICE_CREAM_ORG_ID,
        entity_id: product.id,
        field_name: 'current_inventory',
        field_value_number: Math.floor(Math.random() * 500) + 100,
        smart_code: 'HERA.INV.DYN.STOCK.LEVEL.v1',
        metadata: {
          unit: 'liters',
          last_updated: new Date().toISOString()
        }
      };

      const { error: dynError } = await supabase
        .from('core_dynamic_data')
        .insert(inventoryData);

      if (dynError) {
        console.error('Error creating inventory data:', dynError);
      }
    }

    console.log('\n🎉 Ice cream demo data setup complete!');
    console.log('\nSummary:');
    console.log(`- Products: ${createdProducts.length}`);
    console.log(`- Outlets: ${createdOutlets.length}`);
    console.log(`- Production Transactions: ${createdTransactions.length}`);
    console.log(`- Organization: ${ICE_CREAM_ORG_ID}`);

  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupIceCreamDemo();