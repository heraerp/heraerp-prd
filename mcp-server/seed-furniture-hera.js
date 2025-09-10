#!/usr/bin/env node
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

if (!supabaseUrl || !supabaseServiceKey || !organizationId) {
  console.error('❌ Missing required environment variables');
  console.error('SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('DEFAULT_ORGANIZATION_ID:', !!organizationId);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedFurnitureData() {
  console.log('🪑 Seeding furniture data using HERA patterns...');
  console.log(`📍 Organization ID: ${organizationId}`);

  try {
    // Create a few essential products
    const products = [
      {
        entity_type: 'product',
        entity_code: 'DESK-EXE-001',
        entity_name: 'Executive Office Desk - Premium Teak',
        smart_code: 'HERA.FURNITURE.PRODUCT.DESK.v1',
        metadata: {
          category: 'Office Furniture',
          sub_category: 'Desks',
          hsn_code: '940330',
          uom: 'PCS'
        },
        status: 'active'
      },
      {
        entity_type: 'product',
        entity_code: 'CHAIR-ERG-001',
        entity_name: 'Ergonomic High-Back Office Chair',
        smart_code: 'HERA.FURNITURE.PRODUCT.CHAIR.v1',
        metadata: {
          category: 'Office Furniture',
          sub_category: 'Chairs',
          hsn_code: '940130',
          uom: 'PCS'
        },
        status: 'active'
      },
      {
        entity_type: 'product',
        entity_code: 'TABLE-CONF-001',
        entity_name: 'Conference Table 8-Seater',
        smart_code: 'HERA.FURNITURE.PRODUCT.TABLE.v1',
        metadata: {
          category: 'Conference Room',
          sub_category: 'Tables',
          hsn_code: '940360',
          uom: 'PCS'
        },
        status: 'active'
      }
    ];

    const createdProducts = [];
    for (const product of products) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          ...product,
          organization_id: organizationId
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating product ${product.entity_name}:`, error.message);
      } else {
        console.log(`✅ Created product: ${product.entity_name}`);
        createdProducts.push(data);

        // Add dynamic data
        const dynamicFields = [
          { field_name: 'selling_price', field_value_number: product.entity_code === 'DESK-EXE-001' ? 55000 : product.entity_code === 'CHAIR-ERG-001' ? 18500 : 95000 },
          { field_name: 'unit_cost', field_value_number: product.entity_code === 'DESK-EXE-001' ? 35000 : product.entity_code === 'CHAIR-ERG-001' ? 12000 : 68000 },
          { field_name: 'stock_quantity', field_value_number: 10 }
        ];

        for (const field of dynamicFields) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: organizationId,
              entity_id: data.id,
              ...field,
              smart_code: product.smart_code,
              created_at: new Date().toISOString()
            });
        }
      }
    }

    // Create sample customers
    const customers = [
      {
        entity_type: 'customer',
        entity_code: 'CUST-MAR-001',
        entity_name: 'Marriott Hotels India',
        smart_code: 'HERA.FURNITURE.CUSTOMER.HOTEL.v1',
        metadata: {
          industry: 'Hospitality',
          segment: 'Enterprise'
        },
        status: 'active'
      },
      {
        entity_type: 'customer',
        entity_code: 'CUST-TM-001',
        entity_name: 'Tech Mahindra Limited',
        smart_code: 'HERA.FURNITURE.CUSTOMER.CORPORATE.v1',
        metadata: {
          industry: 'IT Services',
          segment: 'Enterprise'
        },
        status: 'active'
      }
    ];

    const createdCustomers = [];
    for (const customer of customers) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          ...customer,
          organization_id: organizationId
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating customer ${customer.entity_name}:`, error.message);
      } else {
        console.log(`✅ Created customer: ${customer.entity_name}`);
        createdCustomers.push(data);
      }
    }

    // Create sample sales orders
    if (createdCustomers.length > 0 && createdProducts.length > 0) {
      const order = {
        transaction_type: 'sales_order',
        transaction_code: 'SO-FRN-2025-0001',
        transaction_date: new Date().toISOString(),
        source_entity_id: createdCustomers[0].id,
        total_amount: 550000,
        smart_code: 'HERA.FURNITURE.SALES.ORDER.v1',
        metadata: {
          customer_po: 'MH-PO-2025-1234',
          delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          payment_terms: 30,
          status: 'confirmed'
        }
      };

      const { data: orderData, error: orderError } = await supabase
        .from('universal_transactions')
        .insert({
          ...order,
          organization_id: organizationId
        })
        .select()
        .single();

      if (orderError) {
        console.error(`❌ Error creating sales order:`, orderError.message);
      } else {
        console.log(`✅ Created sales order: ${order.transaction_code}`);

        // Add line item
        await supabase
          .from('universal_transaction_lines')
          .insert({
            organization_id: organizationId,
            transaction_id: orderData.id,
            line_number: 1,
            entity_id: createdProducts[0].id,
            quantity: '10',
            unit_amount: 55000,
            line_amount: 550000,
            smart_code: 'HERA.FURNITURE.SALES.ORDER.LINE.v1',
            created_at: new Date().toISOString()
          });
      }
    }

    console.log('🎉 Furniture data seeding completed!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  }
}

seedFurnitureData();