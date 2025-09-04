#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function enhanceSalonData(subdomain) {
  console.log(`\n🚀 Enhancing salon data for: ${subdomain}\n`);

  try {
    // 1. Find organization by subdomain
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('settings->>subdomain', subdomain)
      .single();

    if (orgError || !org) {
      console.error('❌ Organization not found:', orgError?.message);
      return;
    }

    console.log(`✅ Found organization: ${org.organization_name} (${org.id})`);
    const orgId = org.id;
    const today = new Date();

    // 2. Get existing services
    const { data: services } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'service');

    console.log(`   Found ${services?.length || 0} existing services`);

    // 3. Create sample customers
    console.log('\n📋 Creating customers...');
    const customers = [
      { name: "Emma Wilson", code: "CUST-001", phone: "+971501234567", email: "emma@example.com", type: "regular" },
      { name: "Fatima Al Rashid", code: "CUST-002", phone: "+971502345678", email: "fatima@example.com", type: "vip" },
      { name: "Sophie Chen", code: "CUST-003", phone: "+971503456789", email: "sophie@example.com", type: "regular" },
      { name: "Aisha Khan", code: "CUST-004", phone: "+971504567890", email: "aisha@example.com", type: "vip" },
      { name: "Maria Garcia", code: "CUST-005", phone: "+971505678901", email: "maria@example.com", type: "regular" },
    ];

    const customerIds = {};

    for (const customer of customers) {
      const { data: customerEntity } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'customer',
          entity_name: customer.name,
          entity_code: customer.code,
          smart_code: 'HERA.SALON.CRM.CUSTOMER.v1',
          status: 'active',
          metadata: {
            phone: customer.phone,
            email: customer.email,
            customer_type: customer.type,
            loyalty_points: customer.type === 'vip' ? 500 : 100
          }
        })
        .select()
        .single();

      if (customerEntity) {
        customerIds[customer.code] = customerEntity.id;
        console.log(`   ✅ Created customer: ${customer.name}`);

        // Add contact info as dynamic data
        await supabase
          .from('core_dynamic_data')
          .insert([
            {
              organization_id: orgId,
              entity_id: customerEntity.id,
              field_name: 'phone',
              field_value_text: customer.phone,
              smart_code: 'HERA.SALON.CUSTOMER.PHONE.v1'
            },
            {
              organization_id: orgId,
              entity_id: customerEntity.id,
              field_name: 'email',
              field_value_text: customer.email,
              smart_code: 'HERA.SALON.CUSTOMER.EMAIL.v1'
            }
          ]);
      }
    }

    // 4. Get existing staff
    const { data: staff } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'employee');

    console.log(`\n👥 Found ${staff?.length || 0} staff members`);

    // 5. Create sample appointments for today
    console.log('\n📅 Creating appointments for today...');
    
    if (services && services.length > 0 && staff && staff.length > 0) {
      const appointments = [
        {
          customer: customerIds["CUST-001"],
          service: services[0].id,
          stylist: staff[0].id,
          time: "10:00 AM",
          status: "confirmed"
        },
        {
          customer: customerIds["CUST-002"],
          service: services[1] ? services[1].id : services[0].id,
          stylist: staff[1] ? staff[1].id : staff[0].id,
          time: "11:00 AM",
          status: "confirmed"
        },
        {
          customer: customerIds["CUST-003"],
          service: services[0].id,
          stylist: staff[0].id,
          time: "2:00 PM",
          status: "confirmed"
        },
        {
          customer: customerIds["CUST-004"],
          service: services[2] ? services[2].id : services[0].id,
          stylist: staff[1] ? staff[1].id : staff[0].id,
          time: "3:00 PM",
          status: "in_progress"
        },
        {
          customer: customerIds["CUST-005"],
          service: services[0].id,
          stylist: staff[0].id,
          time: "4:00 PM",
          status: "scheduled"
        }
      ];

      for (const apt of appointments) {
        // Create appointment as entity
        const { data: aptEntity } = await supabase
          .from('core_entities')
          .insert({
            organization_id: orgId,
            entity_type: 'appointment',
            entity_name: `Appointment - ${apt.time}`,
            entity_code: `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            smart_code: 'HERA.SALON.BOOKING.APPOINTMENT.v1',
            status: 'active',
            metadata: {
              customer_id: apt.customer,
              service_id: apt.service,
              stylist_id: apt.stylist,
              appointment_date: today.toISOString().split('T')[0],
              appointment_time: apt.time,
              status: apt.status,
              duration_minutes: 60,
              price: 150
            }
          })
          .select()
          .single();

        if (aptEntity) {
          console.log(`   ✅ Created appointment: ${apt.time} - ${apt.status}`);

          // Create transaction for completed/in-progress appointments
          if (apt.status === 'completed' || apt.status === 'in_progress') {
            await supabase
              .from('universal_transactions')
              .insert({
                organization_id: orgId,
                transaction_type: 'sale',
                transaction_code: `SALE-${Date.now()}`,
                smart_code: 'HERA.SALON.SALE.SERVICE.v1',
                from_entity_id: apt.customer,
                to_entity_id: aptEntity.id,
                total_amount: 150,
                transaction_date: today.toISOString(),
                status: apt.status === 'completed' ? 'completed' : 'pending',
                metadata: {
                  service_name: 'Hair Service',
                  stylist_name: 'Staff Member',
                  payment_method: 'cash'
                }
              });
          }
        }
      }
    }

    // 6. Create some inventory items
    console.log('\n📦 Creating inventory products...');
    const products = [
      { name: "L'Oreal Shampoo 500ml", code: "PROD-001", stock: 25, price: 45 },
      { name: "Keratin Treatment Kit", code: "PROD-002", stock: 10, price: 350 },
      { name: "Hair Color - Brown", code: "PROD-003", stock: 15, price: 80 },
      { name: "Hair Spa Cream 200ml", code: "PROD-004", stock: 30, price: 65 },
      { name: "Hair Serum 100ml", code: "PROD-005", stock: 20, price: 55 },
    ];

    for (const product of products) {
      const { data: productEntity } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'product',
          entity_name: product.name,
          entity_code: product.code,
          smart_code: 'HERA.SALON.INVENTORY.PRODUCT.v1',
          status: 'active',
          metadata: {
            stock_quantity: product.stock,
            price: product.price,
            category: 'hair_care'
          }
        })
        .select()
        .single();

      if (productEntity) {
        console.log(`   ✅ Created product: ${product.name}`);

        // Add stock and price as dynamic data
        await supabase
          .from('core_dynamic_data')
          .insert([
            {
              organization_id: orgId,
              entity_id: productEntity.id,
              field_name: 'stock_quantity',
              field_value_number: product.stock,
              smart_code: 'HERA.SALON.INVENTORY.STOCK.v1'
            },
            {
              organization_id: orgId,
              entity_id: productEntity.id,
              field_name: 'retail_price',
              field_value_number: product.price,
              smart_code: 'HERA.SALON.PRODUCT.PRICE.v1'
            }
          ]);
      }
    }

    console.log('\n✅ Enhanced salon data successfully!');
    console.log(`\n🌐 Visit: http://${subdomain}.lvh.me:3000/salon-data to see the results`);

  } catch (error) {
    console.error('Error enhancing salon data:', error);
  }
}

// Get subdomain from command line
const subdomain = process.argv[2] || 'greentrends';
enhanceSalonData(subdomain);