#!/usr/bin/env node

/**
 * Simple Furniture Sales Seed Data
 * Creates a few clean sales orders for Kerala Furniture Works
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const KERALA_FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

// Helper function to generate unique transaction codes
function generateTransactionCode(prefix = 'SO') {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}${month}-${random}`;
}

async function getExistingData() {
  console.log('📊 Fetching existing products and customers...');
  
  // Get products
  const { data: products, error: prodError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', KERALA_FURNITURE_ORG_ID)
    .eq('entity_type', 'product')
    .limit(5);
    
  if (prodError) {
    console.error('❌ Error fetching products:', prodError);
    return null;
  }
  
  // Get customers  
  const { data: customers, error: custError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', KERALA_FURNITURE_ORG_ID)
    .eq('entity_type', 'customer')
    .limit(5);
    
  if (custError) {
    console.error('❌ Error fetching customers:', custError);
    return null;
  }
  
  console.log(`✅ Found ${products.length} products and ${customers.length} customers`);
  return { products, customers };
}

async function createSimpleSalesOrders(products, customers) {
  console.log('\n📋 Creating sales orders...');
  
  if (!products.length || !customers.length) {
    console.error('❌ Need products and customers to create orders');
    return;
  }
  
  const salesOrders = [
    // 1. Large corporate order
    {
      transaction_type: 'sales_order',
      transaction_code: generateTransactionCode('SO'),
      transaction_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      source_entity_id: customers[0].id,
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.CUSTOM.v1',
      total_amount: 350000,
      transaction_status: 'confirmed',
      metadata: {
        customer_name: customers[0].entity_name,
        delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        payment_terms: 'net_30',
        order_type: 'corporate'
      }
    },
    
    // 2. Retail order
    {
      transaction_type: 'sales_order',
      transaction_code: generateTransactionCode('SO'),
      transaction_date: new Date().toISOString(),
      source_entity_id: customers[1] ? customers[1].id : customers[0].id,
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.CUSTOM.v1',
      total_amount: 125000,
      transaction_status: 'pending',
      metadata: {
        customer_name: customers[1] ? customers[1].entity_name : customers[0].entity_name,
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        payment_terms: 'cash_on_delivery',
        order_type: 'retail'
      }
    },
    
    // 3. Express delivery order
    {
      transaction_type: 'sales_order',
      transaction_code: generateTransactionCode('SO-EXPRESS'),
      transaction_date: new Date().toISOString(),
      source_entity_id: customers[2] ? customers[2].id : customers[0].id,
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.RUSH.v1',
      total_amount: 88000,
      transaction_status: 'processing',
      metadata: {
        customer_name: customers[2] ? customers[2].entity_name : customers[0].entity_name,
        delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        payment_terms: 'immediate',
        order_type: 'express',
        express_charges: 8000
      }
    }
  ];
  
  // Insert orders
  const { data: orderData, error: orderError } = await supabase
    .from('universal_transactions')
    .insert(salesOrders)
    .select();
    
  if (orderError) {
    console.error('❌ Error creating sales orders:', orderError);
    return null;
  }
  
  console.log(`✅ Created ${orderData.length} sales orders`);
  
  // Create order lines
  console.log('\n📦 Creating order line items...');
  
  const orderLines = [];
  
  // Lines for order 1 (corporate)
  if (orderData[0] && products[0]) {
    orderLines.push(
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[0].id,
        line_number: 1,
        line_type: 'item',
        entity_id: products[0].id,
        quantity: 10,
        unit_amount: 22000,
        line_amount: 220000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.PRODUCT.v1',
        line_data: { 
          product_name: products[0].entity_name,
          discount_percent: 10
        }
      }
    );
    
    if (products[1]) {
      orderLines.push(
        {
          organization_id: KERALA_FURNITURE_ORG_ID,
          transaction_id: orderData[0].id,
          line_number: 2,
          line_type: 'item',
          entity_id: products[1].id,
          quantity: 5,
          unit_amount: 26000,
          line_amount: 130000,
          smart_code: 'HERA.FURNITURE.SALES.LINE.PRODUCT.v1',
          line_data: { 
            product_name: products[1].entity_name,
            discount_percent: 5
          }
        }
      );
    }
  }
  
  // Lines for order 2 (retail)
  if (orderData[1] && products[2]) {
    orderLines.push(
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[1].id,
        line_number: 1,
        line_type: 'item',
        entity_id: products[2] ? products[2].id : products[0].id,
        quantity: 1,
        unit_amount: 85000,
        line_amount: 85000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.PRODUCT.v1',
        line_data: { 
          product_name: products[2] ? products[2].entity_name : products[0].entity_name
        }
      },
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[1].id,
        line_number: 2,
        line_type: 'item',
        entity_id: products[1] ? products[1].id : products[0].id,
        quantity: 1,
        unit_amount: 40000,
        line_amount: 40000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.PRODUCT.v1',
        line_data: { 
          product_name: products[1] ? products[1].entity_name : products[0].entity_name
        }
      }
    );
  }
  
  // Lines for order 3 (express)
  if (orderData[2] && products[0]) {
    orderLines.push(
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[2].id,
        line_number: 1,
        line_type: 'item',
        entity_id: products[0].id,
        quantity: 2,
        unit_amount: 40000,
        line_amount: 80000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.PRODUCT.v1',
        line_data: { 
          product_name: products[0].entity_name,
          express_delivery: true
        }
      },
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[2].id,
        line_number: 2,
        line_type: 'service',
        entity_id: null,
        quantity: 1,
        unit_amount: 8000,
        line_amount: 8000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.DELIVERY.v1',
        line_data: { 
          service_type: 'express_delivery',
          description: 'Express delivery charge (48 hours)'
        }
      }
    );
  }
  
  // Insert order lines
  if (orderLines.length > 0) {
    const { data: lineData, error: lineError } = await supabase
      .from('universal_transaction_lines')
      .insert(orderLines)
      .select();
      
    if (lineError) {
      console.error('❌ Error creating order lines:', lineError);
      console.error('Details:', lineError.details);
      return null;
    }
    
    console.log(`✅ Created ${lineData.length} order line items`);
  }
  
  return orderData;
}

async function main() {
  console.log('🏭 Kerala Furniture Works - Sales Data Seeding\n');
  console.log(`📍 Organization ID: ${KERALA_FURNITURE_ORG_ID}\n`);
  
  try {
    // Get existing data
    const existingData = await getExistingData();
    if (!existingData) {
      console.error('❌ Could not fetch existing data');
      return;
    }
    
    // Create sales orders with lines
    const orderData = await createSimpleSalesOrders(existingData.products, existingData.customers);
    
    if (orderData) {
      console.log('\n✅ Sales data seeding complete!');
      console.log('\n📊 Summary:');
      console.log('- Created 3 sales orders with different types');
      console.log('- Added line items with proper line_type field');
      console.log('- Included corporate, retail, and express delivery orders');
    }
    
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding
main().catch(console.error);