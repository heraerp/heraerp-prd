#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = "0fd09e31-d257-4329-97eb-7d7f522ed6f0";

async function seedOperationalData() {
  console.log('🌟 Seeding Salon Operational Data\n');
  
  // 1. Create Stylists
  console.log('1️⃣ Creating Stylists...');
  
  const stylists = [
    { code: 'STY-001', name: 'Sarah Johnson', speciality: 'Hair Coloring', commission_rate: 0.35 },
    { code: 'STY-002', name: 'Maria Garcia', speciality: 'Hair Cutting', commission_rate: 0.35 },
    { code: 'STY-003', name: 'Fatima Al-Rahman', speciality: 'Hair Treatment', commission_rate: 0.40 },
    { code: 'STY-004', name: 'Lisa Chen', speciality: 'Hair Styling', commission_rate: 0.35 }
  ];
  
  const stylistIds = {};
  
  for (const stylist of stylists) {
    const stylistEntity = {
      organization_id: SALON_ORG_ID,
      entity_type: 'employee',
      entity_code: stylist.code,
      entity_name: stylist.name,
      smart_code: 'HERA.SALON.HR.EMPLOYEE.STYLIST.v1',
      status: 'active',
      metadata: {
        role: 'stylist',
        speciality: stylist.speciality,
        commission_rate: stylist.commission_rate,
        hire_date: '2025-01-01',
        employment_type: 'full_time'
      }
    };
    
    const { data, error } = await supabase
      .from('core_entities')
      .insert(stylistEntity)
      .select()
      .single();
    
    if (error) {
      console.error(`Error creating stylist ${stylist.name}:`, error);
    } else {
      stylistIds[stylist.code] = data.id;
      console.log(`  ✅ Created stylist: ${stylist.name}`);
    }
  }
  
  // 2. Create Service Chairs
  console.log('\n2️⃣ Creating Service Chairs...');
  
  const chairs = [
    { code: 'CHAIR-01', name: 'Station 1', type: 'cutting' },
    { code: 'CHAIR-02', name: 'Station 2', type: 'coloring' },
    { code: 'CHAIR-03', name: 'Station 3', type: 'washing' },
    { code: 'CHAIR-04', name: 'Station 4', type: 'styling' }
  ];
  
  for (const chair of chairs) {
    const chairEntity = {
      organization_id: SALON_ORG_ID,
      entity_type: 'equipment',
      entity_code: chair.code,
      entity_name: chair.name,
      smart_code: 'HERA.SALON.EQP.FURNITURE.CHAIR.v1',
      status: 'active',
      metadata: {
        equipment_type: 'service_chair',
        station_type: chair.type,
        location: 'main_floor'
      }
    };
    
    const { error } = await supabase
      .from('core_entities')
      .insert(chairEntity);
    
    if (error) {
      console.error(`Error creating chair ${chair.name}:`, error);
    } else {
      console.log(`  ✅ Created chair: ${chair.name}`);
    }
  }
  
  // 3. Create Services
  console.log('\n3️⃣ Creating Salon Services...');
  
  const services = [
    { code: 'SVC-HAIRCUT-BASIC', name: 'Basic Haircut', duration: 45, price: 75, category: 'cutting' },
    { code: 'SVC-HAIRCUT-STYLE', name: 'Cut & Style', duration: 60, price: 120, category: 'cutting' },
    { code: 'SVC-COLOR-FULL', name: 'Full Hair Color', duration: 120, price: 250, category: 'coloring' },
    { code: 'SVC-COLOR-ROOTS', name: 'Root Touch-up', duration: 90, price: 180, category: 'coloring' },
    { code: 'SVC-TREATMENT-KERATIN', name: 'Keratin Treatment', duration: 180, price: 450, category: 'treatment' },
    { code: 'SVC-BLOWDRY', name: 'Blow Dry', duration: 30, price: 50, category: 'styling' }
  ];
  
  const serviceIds = {};
  
  for (const service of services) {
    const serviceEntity = {
      organization_id: SALON_ORG_ID,
      entity_type: 'service',
      entity_code: service.code,
      entity_name: service.name,
      smart_code: 'HERA.SALON.SVC.CATALOG.ITEM.v1',
      status: 'active',
      metadata: {
        category: service.category,
        duration_minutes: service.duration,
        base_price: service.price,
        currency: 'AED',
        requires_consultation: service.category === 'treatment'
      }
    };
    
    const { data, error } = await supabase
      .from('core_entities')
      .insert(serviceEntity)
      .select()
      .single();
    
    if (error) {
      console.error(`Error creating service ${service.name}:`, error);
    } else {
      serviceIds[service.code] = data.id;
      
      // Add pricing to dynamic data
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: SALON_ORG_ID,
          entity_id: data.id,
          field_name: 'current_price',
          field_value_number: service.price,
          smart_code: 'HERA.SALON.SVC.PRICING.CURRENT.v1'
        });
      
      console.log(`  ✅ Created service: ${service.name} (${service.price} AED)`);
    }
  }
  
  // 4. Create Products
  console.log('\n4️⃣ Creating Retail Products...');
  
  const products = [
    { code: 'PRD-SHAMPOO-001', name: 'Professional Shampoo', price: 45, cost: 20, stock: 50 },
    { code: 'PRD-CONDITIONER-001', name: 'Professional Conditioner', price: 45, cost: 20, stock: 45 },
    { code: 'PRD-HAIROIL-001', name: 'Argan Hair Oil', price: 85, cost: 40, stock: 20 },
    { code: 'PRD-MASK-001', name: 'Hair Treatment Mask', price: 65, cost: 30, stock: 25 }
  ];
  
  for (const product of products) {
    const productEntity = {
      organization_id: SALON_ORG_ID,
      entity_type: 'product',
      entity_code: product.code,
      entity_name: product.name,
      smart_code: 'HERA.SALON.INV.PRODUCT.RETAIL.v1',
      status: 'active',
      metadata: {
        product_type: 'retail',
        category: 'hair_care',
        unit_cost: product.cost,
        retail_price: product.price,
        currency: 'AED'
      }
    };
    
    const { data, error } = await supabase
      .from('core_entities')
      .insert(productEntity)
      .select()
      .single();
    
    if (error) {
      console.error(`Error creating product ${product.name}:`, error);
    } else {
      // Add inventory levels
      await supabase
        .from('core_dynamic_data')
        .insert([
          {
            organization_id: SALON_ORG_ID,
            entity_id: data.id,
            field_name: 'qty_on_hand',
            field_value_number: product.stock,
            smart_code: 'HERA.SALON.INV.STOCK.QTY.v1'
          },
          {
            organization_id: SALON_ORG_ID,
            entity_id: data.id,
            field_name: 'reorder_level',
            field_value_number: 10,
            smart_code: 'HERA.SALON.INV.STOCK.REORDER.v1'
          }
        ]);
      
      console.log(`  ✅ Created product: ${product.name} (Stock: ${product.stock})`);
    }
  }
  
  // 5. Create Sample Customers
  console.log('\n5️⃣ Creating Sample Customers...');
  
  const customers = [
    { code: 'CUST-001', name: 'Aisha Mohammed', phone: '+971501234567', type: 'regular' },
    { code: 'CUST-002', name: 'Emma Thompson', phone: '+971502345678', type: 'vip' },
    { code: 'CUST-003', name: 'Priya Sharma', phone: '+971503456789', type: 'regular' },
    { code: 'CUST-004', name: 'Sofia Martinez', phone: '+971504567890', type: 'new' }
  ];
  
  for (const customer of customers) {
    const customerEntity = {
      organization_id: SALON_ORG_ID,
      entity_type: 'customer',
      entity_code: customer.code,
      entity_name: customer.name,
      smart_code: 'HERA.SALON.CRM.CUSTOMER.PROFILE.v1',
      status: 'active',
      metadata: {
        customer_type: customer.type,
        contact_phone: customer.phone,
        preferred_stylist: customer.type === 'vip' ? stylistIds['STY-001'] : null,
        loyalty_points: customer.type === 'vip' ? 250 : 0
      }
    };
    
    const { error } = await supabase
      .from('core_entities')
      .insert(customerEntity);
    
    if (error) {
      console.error(`Error creating customer ${customer.name}:`, error);
    } else {
      console.log(`  ✅ Created customer: ${customer.name} (${customer.type})`);
    }
  }
  
  // Summary
  console.log('\n🎉 Operational Data Seeding Complete!');
  console.log('=====================================');
  console.log('Created:');
  console.log('  - 4 Stylists (with commission rates)');
  console.log('  - 4 Service Chairs');
  console.log('  - 6 Services (with pricing)');
  console.log('  - 4 Products (with inventory)');
  console.log('  - 4 Customers (with profiles)');
  console.log('\nThe salon is now ready for:');
  console.log('  1. Appointment booking');
  console.log('  2. Service delivery');
  console.log('  3. Product sales');
  console.log('  4. Commission tracking');
  console.log('  5. Financial reporting');
}

seedOperationalData().catch(console.error);