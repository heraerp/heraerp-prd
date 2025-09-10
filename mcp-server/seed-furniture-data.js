#!/usr/bin/env node
require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

if (!supabaseUrl || !supabaseAnonKey || !organizationId) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Furniture products
const FURNITURE_PRODUCTS = [
  {
    entity_code: 'DESK-EXE-001',
    entity_name: 'Executive Office Desk - Premium Teak',
    entity_type: 'product',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1',
    metadata: {
      category: 'Office Furniture',
      sub_category: 'Desks',
      hsn_code: '940330',
      uom: 'PCS'
    },
    dynamic_fields: {
      material: 'Premium Teak Wood',
      finish: 'Natural Polish',
      length_cm: 180,
      width_cm: 90,
      height_cm: 75,
      weight_kg: 85,
      unit_cost: 35000,
      selling_price: 55000
    }
  },
  {
    entity_code: 'CHAIR-ERG-001',
    entity_name: 'Ergonomic High-Back Office Chair',
    entity_type: 'product',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1',
    metadata: {
      category: 'Office Furniture',
      sub_category: 'Chairs',
      hsn_code: '940130',
      uom: 'PCS'
    },
    dynamic_fields: {
      material: 'Mesh Back, Leather Seat',
      finish: 'Black',
      unit_cost: 12000,
      selling_price: 18500
    }
  },
  {
    entity_code: 'TABLE-CONF-008',
    entity_name: 'Conference Table 8-Seater Oval',
    entity_type: 'product', 
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1',
    metadata: {
      category: 'Conference Room',
      sub_category: 'Tables',
      hsn_code: '940360',
      uom: 'PCS'
    },
    dynamic_fields: {
      material: 'Engineered Wood with Veneer',
      finish: 'Walnut',
      length_cm: 300,
      width_cm: 120,
      height_cm: 75,
      unit_cost: 68000,
      selling_price: 95000
    }
  }
];

// Customers
const CUSTOMERS = [
  {
    entity_code: 'CUST-MAR-001',
    entity_name: 'Marriott Hotels India',
    entity_type: 'customer',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.CUSTOMER.v1',
    metadata: { 
      industry: 'Hospitality',
      segment: 'Enterprise'
    },
    dynamic_fields: {
      gst_number: '29AABCM1234E1Z5',
      credit_limit: 5000000,
      payment_terms: 30,
      contact_person: 'Rajesh Kumar',
      contact_email: 'rajesh.kumar@marriott.com',
      contact_phone: '+91-9876543210'
    }
  },
  {
    entity_code: 'CUST-ITC-001',
    entity_name: 'ITC Hotels Ltd',
    entity_type: 'customer',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.CUSTOMER.v1',
    metadata: { 
      industry: 'Hospitality',
      segment: 'Enterprise'
    },
    dynamic_fields: {
      gst_number: '29AAACI1234F1Z6',
      credit_limit: 8000000,
      payment_terms: 45,
      contact_person: 'Priya Sharma',
      contact_email: 'priya.sharma@itchotels.com',
      contact_phone: '+91-9876543211'
    }
  },
  {
    entity_code: 'CUST-TM-001',
    entity_name: 'Tech Mahindra Limited',
    entity_type: 'customer',
    smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.CUSTOMER.v1',
    metadata: { 
      industry: 'IT Services',
      segment: 'Enterprise'
    },
    dynamic_fields: {
      gst_number: '29AAACT1234G1Z7',
      credit_limit: 10000000,
      payment_terms: 60,
      contact_person: 'Amit Patel',
      contact_email: 'amit.patel@techmahindra.com',
      contact_phone: '+91-9876543212'
    }
  }
];

async function seedData() {
  try {
    console.log('🪑 Starting furniture data seeding...');
    console.log(`📍 Organization ID: ${organizationId}`);

    // Create products
    console.log('\n📦 Creating products...');
    const productIds = [];
    for (const product of FURNITURE_PRODUCTS) {
      const { data: entity, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: product.entity_type,
          entity_code: product.entity_code,
          entity_name: product.entity_name,
          smart_code: product.smart_code,
          metadata: product.metadata,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating product ${product.entity_name}:`, error.message);
        continue;
      }

      console.log(`✅ Created product: ${product.entity_name}`);
      productIds.push(entity.id);

      // Add dynamic fields
      for (const [field, value] of Object.entries(product.dynamic_fields)) {
        const fieldType = typeof value === 'number' ? 'field_value_number' : 'field_value_text';
        
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: organizationId,
            entity_id: entity.id,
            field_name: field,
            [fieldType]: value,
            smart_code: product.smart_code
          });
      }
    }

    // Create customers
    console.log('\n👥 Creating customers...');
    const customerIds = [];
    for (const customer of CUSTOMERS) {
      const { data: entity, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: customer.entity_type,
          entity_code: customer.entity_code,
          entity_name: customer.entity_name,
          smart_code: customer.smart_code,
          metadata: customer.metadata,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating customer ${customer.entity_name}:`, error.message);
        continue;
      }

      console.log(`✅ Created customer: ${customer.entity_name}`);
      customerIds.push(entity);

      // Add dynamic fields
      for (const [field, value] of Object.entries(customer.dynamic_fields)) {
        const fieldType = typeof value === 'number' ? 'field_value_number' : 'field_value_text';
        
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: organizationId,
            entity_id: entity.id,
            field_name: field,
            [fieldType]: value,
            smart_code: customer.smart_code
          });
      }
    }

    // Create sample sales orders
    console.log('\n📋 Creating sample sales orders...');
    if (customerIds.length > 0 && productIds.length > 0) {
      // Order 1: Marriott - Executive Desk
      const order1 = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: organizationId,
          transaction_type: 'sales_order',
          transaction_code: 'SO-FRN-2025-0001',
          transaction_date: new Date().toISOString(),
          source_entity_id: customerIds[0].id,
          total_amount: 550000,
          smart_code: 'HERA.FURNITURE.SALES.ORDER.v1',
          metadata: {
            customer_po: 'MH-PO-2025-1234',
            delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            payment_terms: 30,
            status: 'confirmed'
          }
        })
        .select()
        .single();

      if (!order1.error) {
        console.log(`✅ Created sales order: SO-FRN-2025-0001`);
        
        // Add line item
        await supabase
          .from('universal_transaction_lines')
          .insert({
            organization_id: organizationId,
            transaction_id: order1.data.id,
            line_number: 1,
            entity_id: productIds[0],
            quantity: '10',
            unit_amount: 55000,
            line_amount: 550000,
            smart_code: 'HERA.FURNITURE.SALES.ORDER.LINE.v1'
          });
      }

      // Order 2: ITC - Conference Table
      if (customerIds.length > 1 && productIds.length > 2) {
        const order2 = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: organizationId,
            transaction_type: 'sales_order',
            transaction_code: 'SO-FRN-2025-0002',
            transaction_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            source_entity_id: customerIds[1].id,
            total_amount: 475000,
            smart_code: 'HERA.FURNITURE.SALES.ORDER.v1',
            metadata: {
              customer_po: 'ITC-PO-2025-5678',
              delivery_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
              payment_terms: 45,
              status: 'in_production'
            }
          })
          .select()
          .single();

        if (!order2.error) {
          console.log(`✅ Created sales order: SO-FRN-2025-0002`);
          
          // Add line item
          await supabase
            .from('universal_transaction_lines')
            .insert({
              organization_id: organizationId,
              transaction_id: order2.data.id,
              line_number: 1,
              entity_id: productIds[2],
              quantity: '5',
              unit_amount: 95000,
              line_amount: 475000,
              smart_code: 'HERA.FURNITURE.SALES.ORDER.LINE.v1'
            });
        }
      }
    }

    console.log('\n🎉 Furniture data seeding completed!');
    console.log(`📊 Summary: ${productIds.length} products, ${customerIds.length} customers created`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  }
}

seedData();