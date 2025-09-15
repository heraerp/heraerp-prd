#!/usr/bin/env node

/**
 * Enhanced Furniture Sales Seed Data
 * Creates diverse sales scenarios for Kerala Furniture Works
 * Including: retail, corporate, bulk orders, canceled orders, returns
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

// Helper function to calculate delivery date based on order type
function calculateDeliveryDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

async function getExistingData() {
  console.log('📊 Fetching existing products and customers...');
  
  // Get products
  const { data: products, error: prodError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', KERALA_FURNITURE_ORG_ID)
    .eq('entity_type', 'product')
    .limit(10);
    
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
    .limit(10);
    
  if (custError) {
    console.error('❌ Error fetching customers:', custError);
    return null;
  }
  
  console.log(`✅ Found ${products.length} products and ${customers.length} customers`);
  return { products, customers };
}

async function createNewCustomers() {
  console.log('\n👥 Creating additional customers...');
  
  const newCustomers = [
    {
      entity_type: 'customer',
      entity_name: 'Hilton Hotels India',
      entity_code: 'CUST-HIL-001',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.CUSTOMER.HOSPITALITY.v1',
      metadata: {
        customer_type: 'hospitality',
        location: 'Mumbai',
        credit_limit: 5000000,
        segment: 'premium',
        payment_terms: 'net_60'
      }
    },
    {
      entity_type: 'customer',
      entity_name: 'Greenfield Apartments',
      entity_code: 'CUST-GRF-001',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.CUSTOMER.RESIDENTIAL.v1',
      metadata: {
        customer_type: 'residential',
        location: 'Bengaluru',
        credit_limit: 2000000,
        segment: 'bulk',
        payment_terms: 'net_45'
      }
    },
    {
      entity_type: 'customer',
      entity_name: 'Individual - Rajesh Kumar',
      entity_code: 'CUST-IND-001',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.CUSTOMER.INDIVIDUAL.v1',
      metadata: {
        customer_type: 'individual',
        location: 'Kochi',
        credit_limit: 100000,
        segment: 'retail',
        payment_terms: 'cash'
      }
    },
    {
      entity_type: 'customer',
      entity_name: 'Amazon India Offices',
      entity_code: 'CUST-AMZ-001',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.CUSTOMER.CORPORATE.v1',
      metadata: {
        customer_type: 'corporate',
        location: 'Hyderabad',
        credit_limit: 10000000,
        segment: 'enterprise',
        payment_terms: 'net_90'
      }
    }
  ];
  
  const { data, error } = await supabase
    .from('core_entities')
    .insert(newCustomers)
    .select();
    
  if (error) {
    console.error('❌ Error creating customers:', error);
    return [];
  }
  
  console.log(`✅ Created/Updated ${data.length} customers`);
  return data;
}

async function createSalesOrders(products, customers) {
  console.log('\n📋 Creating diverse sales orders...');
  
  if (!products.length || !customers.length) {
    console.error('❌ Need products and customers to create orders');
    return;
  }
  
  // Map customer names to their data for easier reference
  const customerMap = {};
  customers.forEach(c => {
    customerMap[c.entity_name] = c;
  });
  
  // Map products for easier reference
  const productMap = {};
  products.forEach(p => {
    productMap[p.entity_code] = p;
  });
  
  const salesOrders = [
    // 1. Large corporate order - In Production
    {
      transaction_type: 'sales_order',
      transaction_code: generateTransactionCode('SO'),
      transaction_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      source_entity_id: customerMap['Amazon India Offices']?.id || customers[0].id,
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.CORPORATE.v1',
      total_amount: 2500000,
      transaction_status: 'in_production',
      metadata: {
        status: 'in_production',
        order_type: 'corporate_bulk',
        delivery_date: calculateDeliveryDate(30),
        payment_terms: 'net_90',
        priority: 'high',
        contract_number: 'AMZ-2024-FRN-001',
        notes: 'New office setup - 3 floors, 500 workstations'
      }
    },
    
    // 2. Hotel chain order - Partially Delivered
    {
      transaction_type: 'sales_order',
      transaction_code: generateTransactionCode('SO'),
      transaction_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      source_entity_id: customerMap['Hilton Hotels India']?.id || customers[0].id,
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.HOSPITALITY.v1',
      total_amount: 1850000,
      transaction_status: 'partially_delivered',
      metadata: {
        status: 'partially_delivered',
        order_type: 'hospitality',
        delivery_date: calculateDeliveryDate(10),
        payment_terms: 'net_60',
        priority: 'high',
        delivered_percentage: 60,
        remaining_items: '40 beds, 20 wardrobes',
        project: 'Hilton Mumbai Renovation Phase 2'
      }
    },
    
    // 3. Residential complex order - Confirmed
    {
      transaction_type: 'sales_order',
      transaction_code: generateTransactionCode('SO'),
      transaction_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      source_entity_id: customerMap['Greenfield Apartments']?.id || customers[0].id,
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.RESIDENTIAL.v1',
      total_amount: 3200000,
      transaction_status: 'confirmed',
      metadata: {
        status: 'confirmed',
        order_type: 'residential_bulk',
        delivery_date: calculateDeliveryDate(45),
        payment_terms: 'net_45',
        priority: 'medium',
        units: 40,
        project: 'Tower A - Common Area Furnishing',
        includes_installation: true
      }
    },
    
    // 4. Individual retail order - Delivered
    {
      transaction_type: 'sales_order',
      transaction_code: generateTransactionCode('SO'),
      transaction_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
      source_entity_id: customerMap['Individual - Rajesh Kumar']?.id || customers[0].id,
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.RETAIL.v1',
      total_amount: 125000,
      transaction_status: 'delivered',
      metadata: {
        status: 'delivered',
        order_type: 'retail',
        delivery_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        payment_terms: 'cash',
        priority: 'standard',
        delivery_address: '123 MG Road, Kochi',
        customer_satisfaction: 'excellent',
        review_rating: 5
      }
    },
    
    // 5. Canceled order
    {
      transaction_type: 'sales_order',
      transaction_code: generateTransactionCode('SO'),
      transaction_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      source_entity_id: customerMap['Corporate Office Solutions']?.id || customers[0].id,
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.CANCELED.v1',
      total_amount: 450000,
      transaction_status: 'canceled',
      metadata: {
        status: 'canceled',
        order_type: 'corporate',
        cancellation_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        cancellation_reason: 'Budget constraints due to project postponement',
        refund_status: 'completed',
        refund_amount: 45000, // 10% cancellation fee
        original_delivery_date: calculateDeliveryDate(20)
      }
    },
    
    // 6. Rush order - In Transit
    {
      transaction_type: 'sales_order',
      transaction_code: generateTransactionCode('SO-RUSH'),
      transaction_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      source_entity_id: customerMap['Modern Homes Interior']?.id || customers[0].id,
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.RUSH.v1',
      total_amount: 180000,
      transaction_status: 'in_transit',
      metadata: {
        status: 'in_transit',
        order_type: 'rush_delivery',
        delivery_date: calculateDeliveryDate(2),
        payment_terms: 'immediate',
        priority: 'urgent',
        rush_charges: 15000,
        tracking_number: 'KFW-EXP-2024-1234',
        carrier: 'Kerala Express Logistics',
        estimated_delivery: calculateDeliveryDate(2)
      }
    },
    
    // 7. Custom order - Design Phase
    {
      transaction_type: 'sales_order',
      transaction_code: generateTransactionCode('SO-CUSTOM'),
      transaction_date: new Date().toISOString(), // Today
      source_entity_id: customerMap['Marriott Hotels India']?.id || customers[0].id,
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.CUSTOM.v1',
      total_amount: 950000,
      transaction_status: 'design_phase',
      metadata: {
        status: 'design_phase',
        order_type: 'custom_design',
        delivery_date: calculateDeliveryDate(60),
        payment_terms: 'milestone_based',
        priority: 'high',
        design_approval_required: true,
        designer_assigned: 'Arjun Menon',
        custom_requirements: 'Themed furniture for heritage property',
        milestone_1: { amount: 285000, status: 'paid', description: 'Design approval' },
        milestone_2: { amount: 475000, status: 'pending', description: 'Production completion' },
        milestone_3: { amount: 190000, status: 'pending', description: 'Installation' }
      }
    }
  ];
  
  // Insert all orders
  const { data: orderData, error: orderError } = await supabase
    .from('universal_transactions')
    .insert(salesOrders)
    .select();
    
  if (orderError) {
    console.error('❌ Error creating sales orders:', orderError);
    return;
  }
  
  console.log(`✅ Created ${orderData.length} sales orders`);
  
  // Create order lines
  console.log('\n📦 Creating order line items...');
  
  const orderLines = [];
  
  // Lines for Amazon order (large corporate)
  if (orderData[0]) {
    orderLines.push(
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[0].id,
        line_number: 1,
        line_type: 'item',
        entity_id: productMap['DESK-001']?.id || products[0].id,
        quantity: 500,
        unit_amount: 2800,
        line_amount: 1400000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.BULK.v1',
        line_data: { 
          bulk_discount: 20, 
          original_price: 3500,
          product_name: 'Office Desk L-Shaped',
          customization: 'Logo engraving on all units'
        }
      },
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[0].id,
        line_number: 2,
        line_type: 'item',
        entity_id: productMap['CHAIR-001']?.id || products[1].id,
        quantity: 500,
        unit_amount: 2200,
        line_amount: 1100000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.BULK.v1',
        line_data: { 
          bulk_discount: 15,
          original_price: 2588,
          product_name: 'Executive Office Chair',
          color_variant: 'Black and Grey mix'
        }
      }
    );
  }
  
  // Lines for Hilton order (partially delivered)
  if (orderData[1]) {
    orderLines.push(
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[1].id,
        line_number: 1,
        line_type: 'item',
        entity_id: products.find(p => p.entity_name.includes('Wardrobe'))?.id || products[2].id,
        quantity: 50,
        unit_amount: 28000,
        line_amount: 1400000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.HOSPITALITY.v1',
        line_data: { 
          product_name: '3-Door Wardrobe',
          delivered_quantity: 30,
          pending_quantity: 20,
          room_numbers: 'Floors 5-10'
        }
      },
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[1].id,
        line_number: 2,
        entity_id: products.find(p => p.entity_name.includes('Table'))?.id || products[3].id,
        quantity: 25,
        unit_amount: 18000,
        line_amount: 450000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.HOSPITALITY.v1',
        line_data: { 
          product_name: 'Teak Wood Side Table',
          delivered_quantity: 25,
          pending_quantity: 0,
          location: 'Premium Suites'
        }
      }
    );
  }
  
  // Lines for residential order
  if (orderData[2]) {
    orderLines.push(
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[2].id,
        line_number: 1,
        entity_id: productMap['SOFA-001']?.id || products[4].id,
        quantity: 40,
        unit_amount: 65000,
        line_amount: 2600000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.RESIDENTIAL.v1',
        line_data: { 
          product_name: 'Leather Sofa Set 3+2',
          bulk_discount: 23.5,
          original_price: 85000,
          delivery_location: 'Common areas - all towers',
          includes_installation: true
        }
      },
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[2].id,
        line_number: 2,
        entity_id: productMap['TABLE-001']?.id || products[1].id,
        quantity: 20,
        unit_amount: 30000,
        line_amount: 600000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.RESIDENTIAL.v1',
        line_data: { 
          product_name: 'Teak Wood Center Table',
          bulk_discount: 25,
          original_price: 40000,
          delivery_location: 'Lobby areas'
        }
      }
    );
  }
  
  // Lines for individual order
  if (orderData[3]) {
    orderLines.push(
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[3].id,
        line_number: 1,
        entity_id: productMap['SOFA-001']?.id || products[4].id,
        quantity: 1,
        unit_amount: 85000,
        line_amount: 85000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.RETAIL.v1',
        line_data: { 
          product_name: 'Leather Sofa Set 3+2',
          color: 'Tan Brown',
          warranty: '5 years',
          free_delivery: true
        }
      },
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[3].id,
        line_number: 2,
        entity_id: productMap['TABLE-001']?.id || products[1].id,
        quantity: 1,
        unit_amount: 40000,
        line_amount: 40000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.RETAIL.v1',
        line_data: { 
          product_name: 'Teak Wood Center Table',
          matching_set: true,
          warranty: '5 years'
        }
      }
    );
  }
  
  // Lines for canceled order
  if (orderData[4]) {
    orderLines.push(
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[4].id,
        line_number: 1,
        entity_id: productMap['DESK-001']?.id || products[0].id,
        quantity: 20,
        unit_amount: 22500,
        line_amount: 450000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.CANCELED.v1',
        line_data: { 
          product_name: 'Office Desk L-Shaped',
          cancellation_status: 'refunded',
          refund_processed: true
        }
      }
    );
  }
  
  // Lines for rush order
  if (orderData[5]) {
    orderLines.push(
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[5].id,
        line_number: 1,
        entity_id: productMap['WARDROBE-001']?.id || products[2].id,
        quantity: 3,
        unit_amount: 35000,
        line_amount: 105000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.RUSH.v1',
        line_data: { 
          product_name: '3-Door Wardrobe',
          rush_manufacturing: true,
          express_delivery: true
        }
      },
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[5].id,
        line_number: 2,
        entity_id: productMap['TABLE-001']?.id || products[1].id,
        quantity: 2,
        unit_amount: 30000,
        line_amount: 60000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.RUSH.v1',
        line_data: { 
          product_name: 'Teak Wood Dining Table',
          in_stock: true,
          immediate_dispatch: true
        }
      },
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[5].id,
        line_number: 3,
        entity_id: null, // Rush delivery charge
        quantity: 1,
        unit_amount: 15000,
        line_amount: 15000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.DELIVERY.v1',
        line_data: { 
          charge_type: 'rush_delivery',
          description: 'Express delivery charges (48 hours)'
        }
      }
    );
  }
  
  // Lines for custom order
  if (orderData[6]) {
    orderLines.push(
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        transaction_id: orderData[6].id,
        line_number: 1,
        entity_id: products[0]?.id, // Custom product based on existing
        quantity: 25,
        unit_amount: 38000,
        line_amount: 950000,
        smart_code: 'HERA.FURNITURE.SALES.LINE.CUSTOM.v1',
        line_data: { 
          product_base: 'Executive Chair',
          customization: 'Heritage Kerala design with brass inlay',
          material_upgrade: 'Premium teak wood frame',
          fabric: 'Traditional Kerala handloom upholstery',
          design_hours: 120,
          approval_status: 'pending_customer_approval'
        }
      }
    );
  }
  
  // Insert all order lines
  const { data: lineData, error: lineError } = await supabase
    .from('universal_transaction_lines')
    .insert(orderLines)
    .select();
    
  if (lineError) {
    console.error('❌ Error creating order lines:', lineError);
    return;
  }
  
  console.log(`✅ Created ${lineData.length} order line items`);
  
  // Create some sales-related dynamic data
  console.log('\n🔧 Adding sales analytics data...');
  
  const dynamicData = [];
  
  // Add customer preferences
  if (customerMap['Amazon India Offices']) {
    dynamicData.push(
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        entity_id: customerMap['Amazon India Offices'].id,
        field_name: 'preferred_payment_method',
        field_value_text: 'wire_transfer',
        smart_code: 'HERA.FURNITURE.CUSTOMER.PREFERENCE.v1'
      },
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        entity_id: customerMap['Amazon India Offices'].id,
        field_name: 'total_lifetime_value',
        field_value_number: 15000000,
        smart_code: 'HERA.FURNITURE.CUSTOMER.ANALYTICS.v1'
      },
      {
        organization_id: KERALA_FURNITURE_ORG_ID,
        entity_id: customerMap['Amazon India Offices'].id,
        field_name: 'preferred_delivery_window',
        field_value_text: 'weekdays_9am_5pm',
        smart_code: 'HERA.FURNITURE.CUSTOMER.LOGISTICS.v1'
      }
    );
  }
  
  if (dynamicData.length > 0) {
    const { error: dynError } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicData);
      
    if (dynError) {
      console.error('❌ Error adding dynamic data:', dynError);
    } else {
      console.log('✅ Added customer analytics data');
    }
  }
}

async function createSalesRelationships(orderData) {
  console.log('\n🔗 Creating sales workflow relationships...');
  
  // Get workflow status entities
  const { data: statuses } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', KERALA_FURNITURE_ORG_ID)
    .eq('entity_type', 'workflow_status')
    .in('entity_code', ['STATUS-CONFIRMED', 'STATUS-IN_PRODUCTION', 'STATUS-DELIVERED']);
    
  if (statuses && statuses.length > 0 && orderData && orderData.length > 0) {
    const relationships = [];
    
    // Add status relationships for some orders
    const statusMap = {};
    statuses.forEach(s => {
      statusMap[s.entity_code] = s.id;
    });
    
    if (orderData[0] && statusMap['STATUS-IN_PRODUCTION']) {
      relationships.push({
        organization_id: KERALA_FURNITURE_ORG_ID,
        from_entity_id: orderData[0].id,
        to_entity_id: statusMap['STATUS-IN_PRODUCTION'],
        relationship_type: 'has_status',
        smart_code: 'HERA.WORKFLOW.STATUS.ASSIGN.v1',
        metadata: {
          assigned_at: new Date().toISOString(),
          reason: 'Materials procured, production started'
        }
      });
    }
    
    if (relationships.length > 0) {
      const { error } = await supabase
        .from('core_relationships')
        .insert(relationships);
        
      if (error) {
        console.error('❌ Error creating relationships:', error);
      } else {
        console.log(`✅ Created ${relationships.length} workflow relationships`);
      }
    }
  }
}

async function main() {
  console.log('🏭 Kerala Furniture Works - Enhanced Sales Data Seeding\n');
  console.log(`📍 Organization ID: ${KERALA_FURNITURE_ORG_ID}\n`);
  
  try {
    // Get existing data
    const existingData = await getExistingData();
    if (!existingData) {
      console.error('❌ Could not fetch existing data');
      return;
    }
    
    // Create new customers
    const newCustomers = await createNewCustomers();
    
    // Combine all customers
    const allCustomers = [...existingData.customers, ...newCustomers];
    
    // Create sales orders with lines
    const orderData = await createSalesOrders(existingData.products, allCustomers);
    
    // Create relationships
    if (orderData) {
      await createSalesRelationships(orderData);
    }
    
    console.log('\n✅ Enhanced sales data seeding complete!');
    console.log('\n📊 Summary:');
    console.log('- Created multiple sales order types (corporate, retail, custom, rush, etc.)');
    console.log('- Added diverse customer segments (hospitality, residential, individual)');
    console.log('- Included various order statuses and workflows');
    console.log('- Added realistic metadata for reporting and analytics');
    
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding
main().catch(console.error);