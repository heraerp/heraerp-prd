#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use the NEXT_PUBLIC_ prefixed variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const KERALA_FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

async function createOrganization() {
  console.log('📦 Creating Kerala Furniture Works organization...');
  
  const { data, error } = await supabase
    .from('core_organizations')
    .upsert({
      id: KERALA_FURNITURE_ORG_ID,
      organization_name: 'Kerala Furniture Works',
      organization_code: 'KFW-001',
      organization_type: 'furniture_manufacturer',
      industry_classification: 'furniture_manufacturing',
      status: 'active',
      settings: {
        industry: 'furniture',
        location: 'Kerala, India',
        established: '1995',
        business_type: 'manufacturing'
      }
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating organization:', error);
    return false;
  }

  console.log('✅ Organization created:', data.organization_name);
  return true;
}

async function createProducts() {
  console.log('\n🪑 Creating furniture products...');
  
  const products = [
    {
      entity_type: 'product',
      entity_name: 'Executive Office Chair',
      entity_code: 'CHAIR-001',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.CHAIR.EXECUTIVE.v1',
      metadata: {
        category: 'seating',
        material: 'leather',
        color: 'black',
        price: 15000
      }
    },
    {
      entity_type: 'product',
      entity_name: 'Teak Wood Dining Table',
      entity_code: 'TABLE-001',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.TABLE.DINING.v1',
      metadata: {
        category: 'tables',
        material: 'teak_wood',
        seats: 6,
        price: 45000
      }
    },
    {
      entity_type: 'product',
      entity_name: '3-Door Wardrobe',
      entity_code: 'WARDROBE-001',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.WARDROBE.3DOOR.v1',
      metadata: {
        category: 'storage',
        material: 'engineered_wood',
        doors: 3,
        price: 35000
      }
    },
    {
      entity_type: 'product',
      entity_name: 'Office Desk L-Shaped',
      entity_code: 'DESK-001',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.DESK.LSHAPED.v1',
      metadata: {
        category: 'office',
        material: 'particle_board',
        shape: 'l_shaped',
        price: 22000
      }
    },
    {
      entity_type: 'product',
      entity_name: 'Leather Sofa Set 3+2',
      entity_code: 'SOFA-001',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.SOFA.LEATHER.v1',
      metadata: {
        category: 'living_room',
        material: 'leather',
        seats: '3+2',
        price: 85000
      }
    }
  ];

  const { data, error } = await supabase
    .from('core_entities')
    .insert(products)
    .select();

  if (error) {
    console.error('❌ Error creating products:', error);
    return [];
  }

  console.log(`✅ Created ${data.length} products`);
  return data;
}

async function createCustomers() {
  console.log('\n👥 Creating customers...');
  
  const customers = [
    {
      entity_type: 'customer',
      entity_name: 'Modern Homes Interior',
      entity_code: 'CUST-001',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.CUSTOMER.RETAIL.v1',
      metadata: {
        customer_type: 'retail',
        location: 'Kochi',
        credit_limit: 500000
      }
    },
    {
      entity_type: 'customer',
      entity_name: 'Corporate Office Solutions',
      entity_code: 'CUST-002',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.CUSTOMER.CORPORATE.v1',
      metadata: {
        customer_type: 'corporate',
        location: 'Thiruvananthapuram',
        credit_limit: 1000000
      }
    }
  ];

  const { data, error } = await supabase
    .from('core_entities')
    .insert(customers)
    .select();

  if (error) {
    console.error('❌ Error creating customers:', error);
    return [];
  }

  console.log(`✅ Created ${data.length} customers`);
  return data;
}

async function createSalesOrders(products, customers) {
  console.log('\n📋 Creating sales orders...');
  
  if (!products.length || !customers.length) {
    console.error('❌ Need products and customers to create orders');
    return;
  }

  // Create sales order headers
  const orders = [
    {
      transaction_type: 'sales_order',
      transaction_code: 'SO-2024-001',
      transaction_date: '2024-09-10T10:30:00Z',
      source_entity_id: customers[0].id, // Modern Homes Interior
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.v1',
      total_amount: 150000,
      transaction_status: 'confirmed',
      metadata: {
        status: 'confirmed',
        delivery_date: '2024-09-25',
        payment_terms: 'net_30'
      }
    },
    {
      transaction_type: 'sales_order',
      transaction_code: 'SO-2024-002',
      transaction_date: '2024-09-11T14:15:00Z',
      source_entity_id: customers[1].id, // Corporate Office Solutions
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.v1',
      total_amount: 285000,
      transaction_status: 'in_production',
      metadata: {
        status: 'in_production',
        delivery_date: '2024-09-30',
        payment_terms: 'net_60'
      }
    },
    {
      transaction_type: 'sales_order',
      transaction_code: 'SO-2024-003',
      transaction_date: '2024-09-12T09:00:00Z',
      source_entity_id: customers[0].id, // Modern Homes Interior
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.v1',
      total_amount: 85000,
      transaction_status: 'delivered',
      metadata: {
        status: 'delivered',
        delivery_date: '2024-09-20',
        payment_terms: 'cash'
      }
    }
  ];

  const { data: orderData, error: orderError } = await supabase
    .from('universal_transactions')
    .insert(orders)
    .select();

  if (orderError) {
    console.error('❌ Error creating orders:', orderError);
    return;
  }

  console.log(`✅ Created ${orderData.length} sales orders`);

  // Create order lines
  const orderLines = [
    // Order 1 - Modern Homes Interior
    {
      organization_id: KERALA_FURNITURE_ORG_ID,
      transaction_id: orderData[0].id,
      line_number: 1,
      entity_id: products[1].id, // Teak Wood Dining Table
      quantity: 2,
      unit_amount: 45000,
      line_amount: 90000,
      smart_code: 'HERA.FURNITURE.SALES.LINE.PRODUCT.v1',
      line_data: { discount: 0, product_name: 'Teak Wood Dining Table' }
    },
    {
      organization_id: KERALA_FURNITURE_ORG_ID,
      transaction_id: orderData[0].id,
      line_number: 2,
      entity_id: products[0].id, // Executive Office Chair
      quantity: 4,
      unit_amount: 15000,
      line_amount: 60000,
      smart_code: 'HERA.FURNITURE.SALES.LINE.PRODUCT.v1',
      line_data: { discount: 0, product_name: 'Executive Office Chair' }
    },
    // Order 2 - Corporate Office Solutions
    {
      organization_id: KERALA_FURNITURE_ORG_ID,
      transaction_id: orderData[1].id,
      line_number: 1,
      entity_id: products[3].id, // Office Desk L-Shaped
      quantity: 10,
      unit_amount: 22000,
      line_amount: 220000,
      smart_code: 'HERA.FURNITURE.SALES.LINE.PRODUCT.v1',
      line_data: { discount: 0, product_name: 'Office Desk L-Shaped' }
    },
    {
      organization_id: KERALA_FURNITURE_ORG_ID,
      transaction_id: orderData[1].id,
      line_number: 2,
      entity_id: products[0].id, // Executive Office Chair
      quantity: 10,
      unit_amount: 15000,
      line_amount: 135000,
      discount_amount: 15000,
      smart_code: 'HERA.FURNITURE.SALES.LINE.PRODUCT.v1',
      line_data: { discount: 10, discount_amount: 15000, original_amount: 150000, product_name: 'Executive Office Chair' }
    },
    // Order 3 - Modern Homes Interior
    {
      organization_id: KERALA_FURNITURE_ORG_ID,
      transaction_id: orderData[2].id,
      line_number: 1,
      entity_id: products[4].id, // Leather Sofa Set
      quantity: 1,
      unit_amount: 85000,
      line_amount: 85000,
      smart_code: 'HERA.FURNITURE.SALES.LINE.PRODUCT.v1',
      line_data: { discount: 0, product_name: 'Leather Sofa Set 3+2' }
    }
  ];

  const { data: lineData, error: lineError } = await supabase
    .from('universal_transaction_lines')
    .insert(orderLines)
    .select();

  if (lineError) {
    console.error('❌ Error creating order lines:', lineError);
    return;
  }

  console.log(`✅ Created ${lineData.length} order lines`);
}

async function main() {
  console.log('🏭 Kerala Furniture Works - Data Setup\n');
  
  // Create organization
  const orgCreated = await createOrganization();
  if (!orgCreated) {
    console.log('⚠️  Organization may already exist, continuing...');
  }

  // Create products
  const products = await createProducts();
  
  // Create customers
  const customers = await createCustomers();
  
  // Create sales orders
  await createSalesOrders(products, customers);
  
  console.log('\n✅ Kerala Furniture Works data setup complete!');
}

// Run the setup
main().catch(console.error);