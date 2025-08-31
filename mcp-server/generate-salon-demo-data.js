// HERA Salon Demo Data Generator
// Creates sample data for Dubai Luxury Salon

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Default salon organization ID
const SALON_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

async function generateSalonDemoData(organizationId = SALON_ORG_ID) {
  console.log('💅 HERA Salon Demo Data Generator');
  console.log('==================================\n');
  console.log(`Organization: Dubai Luxury Salon`);
  console.log(`Organization ID: ${organizationId}\n`);

  try {
    // 1. Create Stylists
    console.log('👥 Creating Stylists...');
    const stylists = [
      { name: 'Emma Davis', role: 'Senior Stylist', commission: 0.35 },
      { name: 'Sarah Johnson', role: 'Color Specialist', commission: 0.40 },
      { name: 'Maria Garcia', role: 'Nail Artist', commission: 0.30 },
      { name: 'Jessica Kim', role: 'Spa Therapist', commission: 0.35 },
      { name: 'Fatima Al-Rashid', role: 'Makeup Artist', commission: 0.45 }
    ];

    const createdStylists = [];
    for (const stylist of stylists) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'employee',
          entity_name: stylist.name,
          entity_code: `EMP-${Date.now().toString().slice(-6)}`,
          smart_code: 'HERA.SALON.EMPLOYEE.STYLIST.v1',
          status: 'active',
          metadata: {
            role: 'stylist',
            specialty: stylist.role,
            hire_date: '2023-01-15'
          }
        })
        .select()
        .single();

      if (!error) {
        createdStylists.push(data);
        
        // Add commission rate
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: organizationId,
            entity_id: data.id,
            field_name: 'commission_rate',
            field_value_number: stylist.commission,
            smart_code: 'HERA.SALON.FIELD.COMMISSION.v1'
          });
        
        console.log(`✅ Created stylist: ${stylist.name} (${stylist.role})`);
      }
    }

    // 2. Create Services
    console.log('\n💇 Creating Services...');
    const services = [
      { name: 'Women\'s Haircut', category: 'hair', price: 150, duration: 60 },
      { name: 'Hair Color', category: 'hair', price: 350, duration: 120 },
      { name: 'Highlights', category: 'hair', price: 450, duration: 150 },
      { name: 'Keratin Treatment', category: 'hair', price: 800, duration: 180 },
      { name: 'Manicure', category: 'nail', price: 80, duration: 45 },
      { name: 'Pedicure', category: 'nail', price: 100, duration: 60 },
      { name: 'Gel Nails', category: 'nail', price: 150, duration: 75 },
      { name: 'Classic Facial', category: 'facial', price: 200, duration: 60 },
      { name: 'Anti-Aging Facial', category: 'facial', price: 350, duration: 90 },
      { name: 'Full Body Massage', category: 'spa', price: 300, duration: 90 },
      { name: 'Hot Stone Massage', category: 'spa', price: 400, duration: 90 },
      { name: 'Party Makeup', category: 'makeup', price: 250, duration: 60 },
      { name: 'Bridal Makeup', category: 'makeup', price: 1200, duration: 180 }
    ];

    const createdServices = [];
    for (const service of services) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'service',
          entity_name: service.name,
          entity_code: `SVC-${Date.now().toString().slice(-6)}`,
          smart_code: 'HERA.SALON.SERVICE.CATALOG.v1',
          status: 'active',
          metadata: {
            category: service.category,
            popular: service.price > 300
          }
        })
        .select()
        .single();

      if (!error) {
        createdServices.push(data);
        
        // Add price
        await supabase
          .from('core_dynamic_data')
          .insert([
            {
              organization_id: organizationId,
              entity_id: data.id,
              field_name: 'price',
              field_value_number: service.price,
              smart_code: 'HERA.SALON.FIELD.PRICE.v1'
            },
            {
              organization_id: organizationId,
              entity_id: data.id,
              field_name: 'duration_minutes',
              field_value_number: service.duration,
              smart_code: 'HERA.SALON.FIELD.DURATION.v1'
            }
          ]);
        
        console.log(`✅ Created service: ${service.name} - AED ${service.price}`);
      }
    }

    // 3. Create Products
    console.log('\n📦 Creating Products...');
    const products = [
      { name: 'Blonde Toner', category: 'hair_color', stock: 3, min: 5, cost: 45 },
      { name: 'Purple Shampoo', category: 'hair_care', stock: 12, min: 10, cost: 35 },
      { name: 'Keratin Serum', category: 'hair_treatment', stock: 8, min: 5, cost: 65 },
      { name: 'Hair Mask', category: 'hair_treatment', stock: 15, min: 10, cost: 40 },
      { name: 'Nail Polish - Red', category: 'nail_polish', stock: 2, min: 5, cost: 15 },
      { name: 'Nail Polish - Pink', category: 'nail_polish', stock: 4, min: 5, cost: 15 },
      { name: 'Cuticle Oil', category: 'nail_care', stock: 10, min: 8, cost: 20 },
      { name: 'Face Cream', category: 'skincare', stock: 6, min: 5, cost: 80 },
      { name: 'Cleanser', category: 'skincare', stock: 8, min: 5, cost: 50 },
      { name: 'Setting Spray', category: 'makeup', stock: 3, min: 5, cost: 45 }
    ];

    for (const product of products) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'product',
          entity_name: product.name,
          entity_code: `PRD-${Date.now().toString().slice(-6)}`,
          smart_code: 'HERA.SALON.PRODUCT.INVENTORY.v1',
          status: 'active',
          metadata: {
            category: product.category,
            for_sale: true
          }
        })
        .select()
        .single();

      if (!error) {
        // Add inventory data
        await supabase
          .from('core_dynamic_data')
          .insert([
            {
              organization_id: organizationId,
              entity_id: data.id,
              field_name: 'current_stock',
              field_value_number: product.stock,
              smart_code: 'HERA.SALON.FIELD.STOCK.v1'
            },
            {
              organization_id: organizationId,
              entity_id: data.id,
              field_name: 'min_stock',
              field_value_number: product.min,
              smart_code: 'HERA.SALON.FIELD.MIN_STOCK.v1'
            },
            {
              organization_id: organizationId,
              entity_id: data.id,
              field_name: 'unit_cost',
              field_value_number: product.cost,
              smart_code: 'HERA.SALON.FIELD.COST.v1'
            }
          ]);
        
        const isLow = product.stock <= product.min;
        console.log(`✅ Created product: ${product.name} - Stock: ${product.stock}${isLow ? ' ⚠️ LOW' : ''}`);
      }
    }

    // 4. Create Clients
    console.log('\n👥 Creating Clients...');
    const clients = [
      { name: 'Aisha Mohammed', phone: '+971501234567', birthMonth: 8, birthDay: 15 },
      { name: 'Layla Ahmed', phone: '+971502345678', birthMonth: 8, birthDay: 22 },
      { name: 'Sofia Patel', phone: '+971503456789', birthMonth: 8, birthDay: 29 },
      { name: 'Zara Khan', phone: '+971504567890', birthMonth: 9, birthDay: 5 },
      { name: 'Noor Al-Rashid', phone: '+971505678901', birthMonth: 9, birthDay: 18 }
    ];

    const createdClients = [];
    for (const client of clients) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'customer',
          entity_name: client.name,
          entity_code: `CUST-${Date.now().toString().slice(-6)}`,
          smart_code: 'HERA.SALON.CUSTOMER.PROFILE.v1',
          status: 'active',
          metadata: {
            vip: Math.random() > 0.7,
            source: 'walk-in'
          }
        })
        .select()
        .single();

      if (!error) {
        createdClients.push(data);
        
        // Add contact info and birthday
        const birthYear = new Date().getFullYear() - Math.floor(Math.random() * 30 + 20);
        await supabase
          .from('core_dynamic_data')
          .insert([
            {
              organization_id: organizationId,
              entity_id: data.id,
              field_name: 'phone',
              field_value_text: client.phone,
              smart_code: 'HERA.SALON.FIELD.PHONE.v1'
            },
            {
              organization_id: organizationId,
              entity_id: data.id,
              field_name: 'birth_date',
              field_value_date: `${birthYear}-${String(client.birthMonth).padStart(2, '0')}-${String(client.birthDay).padStart(2, '0')}`,
              smart_code: 'HERA.SALON.FIELD.BIRTHDATE.v1'
            }
          ]);
        
        console.log(`✅ Created client: ${client.name} (Birthday: ${client.birthMonth}/${client.birthDay})`);
      }
    }

    // 5. Create Today's Appointments
    console.log('\n📅 Creating Today\'s Appointments...');
    const today = new Date();
    const appointments = [
      { time: 9, client: 0, stylist: 0, service: 0 },  // Aisha with Emma - Haircut
      { time: 10, client: 1, stylist: 1, service: 2 }, // Layla with Sarah - Highlights
      { time: 11, client: 2, stylist: 2, service: 4 }, // Sofia with Maria - Manicure
      { time: 14, client: 3, stylist: 3, service: 9 }, // Zara with Jessica - Massage
      { time: 15, client: 4, stylist: 4, service: 11 } // Noor with Fatima - Makeup
    ];

    for (const apt of appointments) {
      const appointmentDate = new Date(today);
      appointmentDate.setHours(apt.time, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: organizationId,
          transaction_type: 'appointment',
          transaction_code: `APT-${Date.now().toString().slice(-6)}`,
          transaction_date: appointmentDate.toISOString(),
          from_entity_id: createdClients[apt.client].id,
          to_entity_id: createdStylists[apt.stylist].id,
          total_amount: services[apt.service].price,
          smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.v1',
          metadata: {
            service_id: createdServices[apt.service].id,
            service_name: services[apt.service].name,
            duration_minutes: services[apt.service].duration,
            status: 'scheduled',
            client_name: clients[apt.client].name,
            stylist_name: stylists[apt.stylist].name
          }
        })
        .select()
        .single();

      if (!error) {
        console.log(`✅ Booked: ${clients[apt.client].name} with ${stylists[apt.stylist].name} at ${apt.time}:00 for ${services[apt.service].name}`);
      }
    }

    // 6. Create Recent Sales
    console.log('\n💰 Creating Recent Sales...');
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Yesterday's completed appointments
    const sales = [
      { amount: 450, service: 'Highlights', stylist: 'Sarah Johnson' },
      { amount: 300, service: 'Full Body Massage', stylist: 'Jessica Kim' },
      { amount: 150, service: 'Gel Nails', stylist: 'Maria Garcia' },
      { amount: 350, service: 'Hair Color', stylist: 'Sarah Johnson' },
      { amount: 250, service: 'Party Makeup', stylist: 'Fatima Al-Rashid' }
    ];

    for (const sale of sales) {
      await supabase
        .from('universal_transactions')
        .insert({
          organization_id: organizationId,
          transaction_type: 'sale',
          transaction_code: `SLE-${Date.now().toString().slice(-6)}`,
          transaction_date: yesterday.toISOString(),
          total_amount: sale.amount,
          smart_code: 'HERA.SALON.SALE.TRANSACTION.v1',
          metadata: {
            service_name: sale.service,
            stylist_name: sale.stylist,
            status: 'completed',
            payment_method: 'card'
          }
        });
    }
    
    console.log(`✅ Created ${sales.length} sales transactions for yesterday`);

    // Summary
    console.log('\n========================================');
    console.log('✨ SALON DEMO DATA GENERATION COMPLETE');
    console.log('========================================');
    console.log(`✅ ${stylists.length} Stylists created`);
    console.log(`✅ ${services.length} Services created`);
    console.log(`✅ ${products.length} Products created (${products.filter(p => p.stock <= p.min).length} low stock)`);
    console.log(`✅ ${clients.length} Clients created`);
    console.log(`✅ ${appointments.length} Appointments scheduled for today`);
    console.log(`✅ ${sales.length} Sales transactions for yesterday`);
    console.log('\n💅 Dubai Luxury Salon is ready for business!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  const orgId = process.argv[2] || SALON_ORG_ID;
  generateSalonDemoData(orgId)
    .then(() => {
      console.log('\n✅ Demo data generation complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { generateSalonDemoData };