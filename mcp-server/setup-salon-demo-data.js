const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function setupSalonDemoData() {
  console.log('🚀 Setting up demo data for Hair Talkz Salon');
  console.log(`Organization ID: ${SALON_ORG_ID}`);
  console.log('================================\n');

  try {
    // 1. Create service categories
    console.log('1️⃣ Creating service categories...');
    const categories = [
      { name: 'Hair Services', code: 'HAIR', smart_code: 'HERA.SALON.CAT.SERVICE.HAIR.V1' },
      { name: 'Nail Services', code: 'NAIL', smart_code: 'HERA.SALON.CAT.SERVICE.NAIL.V1' },
      { name: 'Spa Services', code: 'SPA', smart_code: 'HERA.SALON.CAT.SERVICE.SPA.V1' },
      { name: 'Retail Products', code: 'RETAIL', smart_code: 'HERA.SALON.CAT.PRODUCT.RETAIL.V1' }
    ];

    const categoryIds = {};
    for (const cat of categories) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: SALON_ORG_ID,
          entity_type: 'service_category',
          entity_name: cat.name,
          entity_code: cat.code,
          smart_code: cat.smart_code,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating category ${cat.name}:`, error);
      } else {
        categoryIds[cat.code] = data.id;
        console.log(`✅ Created category: ${cat.name}`);
      }
    }

    // 2. Create services
    console.log('\n2️⃣ Creating salon services...');
    const services = [
      { name: 'Hair Cut', code: 'SVC-HAIRCUT', category: 'HAIR', duration: 30, smart_code: 'HERA.SALON.SVC.ITEM.HAIRCUT.V1' },
      { name: 'Hair Color', code: 'SVC-COLOR', category: 'HAIR', duration: 120, smart_code: 'HERA.SALON.SVC.ITEM.COLOR.V1' },
      { name: 'Hair Treatment', code: 'SVC-TREATMENT', category: 'HAIR', duration: 60, smart_code: 'HERA.SALON.SVC.ITEM.TREATMENT.V1' },
      { name: 'Manicure', code: 'SVC-MANICURE', category: 'NAIL', duration: 45, smart_code: 'HERA.SALON.SVC.ITEM.MANICURE.V1' },
      { name: 'Pedicure', code: 'SVC-PEDICURE', category: 'NAIL', duration: 60, smart_code: 'HERA.SALON.SVC.ITEM.PEDICURE.V1' },
      { name: 'Facial', code: 'SVC-FACIAL', category: 'SPA', duration: 90, smart_code: 'HERA.SALON.SVC.ITEM.FACIAL.V1' }
    ];

    const serviceIds = {};
    for (const svc of services) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: SALON_ORG_ID,
          entity_type: 'service',
          entity_name: svc.name,
          entity_code: svc.code,
          smart_code: svc.smart_code,
          status: 'active',
          metadata: {
            duration_minutes: svc.duration,
            category: svc.category
          }
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating service ${svc.name}:`, error);
      } else {
        serviceIds[svc.code] = data.id;
        console.log(`✅ Created service: ${svc.name} (${svc.duration} min)`);
      }
    }

    // 3. Create retail products
    console.log('\n3️⃣ Creating retail products...');
    const products = [
      { name: 'Shampoo - Professional', code: 'PRD-SHAMPOO', smart_code: 'HERA.SALON.PRD.ITEM.SHAMPOO.V1', stock: 50 },
      { name: 'Conditioner - Professional', code: 'PRD-CONDITIONER', smart_code: 'HERA.SALON.PRD.ITEM.CONDITIONER.V1', stock: 45 },
      { name: 'Hair Serum', code: 'PRD-SERUM', smart_code: 'HERA.SALON.PRD.ITEM.SERUM.V1', stock: 30 },
      { name: 'Hair Spray', code: 'PRD-SPRAY', smart_code: 'HERA.SALON.PRD.ITEM.SPRAY.V1', stock: 25 },
      { name: 'Nail Polish - Red', code: 'PRD-POLISH-RED', smart_code: 'HERA.SALON.PRD.ITEM.POLISH.V1', stock: 20 },
      { name: 'Face Cream', code: 'PRD-FACE-CREAM', smart_code: 'HERA.SALON.PRD.ITEM.CREAM.V1', stock: 15 }
    ];

    const productIds = {};
    for (const prod of products) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: SALON_ORG_ID,
          entity_type: 'product',
          entity_name: prod.name,
          entity_code: prod.code,
          smart_code: prod.smart_code,
          status: 'active',
          metadata: {
            category: 'RETAIL',
            stock_quantity: prod.stock,
            track_inventory: true
          }
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating product ${prod.name}:`, error);
      } else {
        productIds[prod.code] = data.id;
        console.log(`✅ Created product: ${prod.name} (Stock: ${prod.stock})`);
      }
    }

    // 4. Create staff members
    console.log('\n4️⃣ Creating staff members...');
    const staff = [
      { name: 'Sarah Johnson', code: 'STAFF-SARAH', role: 'Senior Stylist', commission: 40, smart_code: 'HERA.SALON.STAFF.EMP.STYLIST.V1' },
      { name: 'Maria Garcia', code: 'STAFF-MARIA', role: 'Colorist', commission: 45, smart_code: 'HERA.SALON.STAFF.EMP.COLORIST.V1' },
      { name: 'Emily Chen', code: 'STAFF-EMILY', role: 'Nail Technician', commission: 35, smart_code: 'HERA.SALON.STAFF.EMP.NAIL.TECH.V1' },
      { name: 'Jessica Kim', code: 'STAFF-JESSICA', role: 'Spa Therapist', commission: 35, smart_code: 'HERA.SALON.STAFF.EMP.SPA.THERAPIST.V1' }
    ];

    const staffIds = {};
    for (const person of staff) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: SALON_ORG_ID,
          entity_type: 'employee',
          entity_name: person.name,
          entity_code: person.code,
          smart_code: person.smart_code,
          status: 'active',
          metadata: {
            role: person.role,
            commission_rate: person.commission,
            department: 'salon_services'
          }
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating staff ${person.name}:`, error);
      } else {
        staffIds[person.code] = data.id;
        console.log(`✅ Created staff: ${person.name} - ${person.role} (${person.commission}% commission)`);
      }
    }

    // 5. Create price list
    console.log('\n5️⃣ Creating price list...');
    const { data: priceList, error: priceListError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: SALON_ORG_ID,
        entity_type: 'pricelist',
        entity_name: 'Standard Price List',
        entity_code: 'PL-STANDARD',
        smart_code: 'HERA.SALON.PRICE.LIST.STANDARD.V1',
        status: 'active',
        metadata: {
          currency: 'AED',
          effective_date: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (priceListError) {
      console.error('Error creating price list:', priceListError);
      return;
    }

    console.log(`✅ Created price list: Standard Price List`);

    // 6. Add prices to price list
    console.log('\n6️⃣ Adding prices to price list...');
    const prices = [
      // Services
      { entity_id: serviceIds['SVC-HAIRCUT'], price: 120, entity_type: 'service', name: 'Hair Cut' },
      { entity_id: serviceIds['SVC-COLOR'], price: 350, entity_type: 'service', name: 'Hair Color' },
      { entity_id: serviceIds['SVC-TREATMENT'], price: 180, entity_type: 'service', name: 'Hair Treatment' },
      { entity_id: serviceIds['SVC-MANICURE'], price: 80, entity_type: 'service', name: 'Manicure' },
      { entity_id: serviceIds['SVC-PEDICURE'], price: 100, entity_type: 'service', name: 'Pedicure' },
      { entity_id: serviceIds['SVC-FACIAL'], price: 250, entity_type: 'service', name: 'Facial' },
      // Products
      { entity_id: productIds['PRD-SHAMPOO'], price: 45, entity_type: 'product', name: 'Shampoo' },
      { entity_id: productIds['PRD-CONDITIONER'], price: 48, entity_type: 'product', name: 'Conditioner' },
      { entity_id: productIds['PRD-SERUM'], price: 85, entity_type: 'product', name: 'Hair Serum' },
      { entity_id: productIds['PRD-SPRAY'], price: 55, entity_type: 'product', name: 'Hair Spray' },
      { entity_id: productIds['PRD-POLISH-RED'], price: 25, entity_type: 'product', name: 'Nail Polish' },
      { entity_id: productIds['PRD-FACE-CREAM'], price: 120, entity_type: 'product', name: 'Face Cream' }
    ];

    for (const priceEntry of prices) {
      const { error } = await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: SALON_ORG_ID,
          entity_id: priceList.id,
          field_name: `price_${priceEntry.entity_type}_${priceEntry.entity_id}`,
          field_value_number: priceEntry.price,
          field_type: 'number',
          smart_code: `HERA.SALON.PRICE.ITEM.${priceEntry.entity_type.toUpperCase()}.V1`
        });

      if (error) {
        console.error(`Error adding price for ${priceEntry.name}:`, error);
      } else {
        console.log(`✅ Added price: ${priceEntry.name} - AED ${priceEntry.price}`);
      }
    }

    // 7. Create membership tiers
    console.log('\n7️⃣ Creating membership tiers...');
    const memberships = [
      { name: 'Gold Membership', code: 'MEMBER-GOLD', discount: 20, smart_code: 'HERA.SALON.MEMBER.TIER.GOLD.V1' },
      { name: 'Silver Membership', code: 'MEMBER-SILVER', discount: 15, smart_code: 'HERA.SALON.MEMBER.TIER.SILVER.V1' },
      { name: 'Bronze Membership', code: 'MEMBER-BRONZE', discount: 10, smart_code: 'HERA.SALON.MEMBER.TIER.BRONZE.V1' }
    ];

    for (const member of memberships) {
      const { error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: SALON_ORG_ID,
          entity_type: 'membership_tier',
          entity_name: member.name,
          entity_code: member.code,
          smart_code: member.smart_code,
          status: 'active',
          metadata: {
            discount_percentage: member.discount,
            benefits: ['priority_booking', 'complimentary_services']
          }
        });

      if (error) {
        console.error(`Error creating membership ${member.name}:`, error);
      } else {
        console.log(`✅ Created membership: ${member.name} (${member.discount}% discount)`);
      }
    }

    // 8. Create sample customers
    console.log('\n8️⃣ Creating sample customers...');
    const customers = [
      { name: 'Alice Thompson', code: 'CUST-ALICE', email: 'alice@example.com', phone: '+971501234567' },
      { name: 'Bob Martinez', code: 'CUST-BOB', email: 'bob@example.com', phone: '+971502345678' },
      { name: 'Carol White', code: 'CUST-CAROL', email: 'carol@example.com', phone: '+971503456789' }
    ];

    for (const cust of customers) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: SALON_ORG_ID,
          entity_type: 'customer',
          entity_name: cust.name,
          entity_code: cust.code,
          smart_code: 'HERA.SALON.CUSTOMER.RETAIL.V1',
          status: 'active'
        })
        .select()
        .single();

      if (!error && data) {
        // Add contact details
        await supabase.from('core_dynamic_data').insert([
          {
            organization_id: SALON_ORG_ID,
            entity_id: data.id,
            field_name: 'email',
            field_value_text: cust.email,
            field_type: 'text',
            smart_code: 'HERA.CONTACT.EMAIL.PRIMARY.V1'
          },
          {
            organization_id: SALON_ORG_ID,
            entity_id: data.id,
            field_name: 'phone',
            field_value_text: cust.phone,
            field_type: 'text',
            smart_code: 'HERA.CONTACT.PHONE.MOBILE.V1'
          }
        ]);
        console.log(`✅ Created customer: ${cust.name}`);
      }
    }

    console.log('\n✨ Demo data setup complete!');
    console.log('================================');
    console.log('Summary:');
    console.log(`- ${categories.length} service categories`);
    console.log(`- ${services.length} services`);
    console.log(`- ${products.length} retail products`);
    console.log(`- ${staff.length} staff members`);
    console.log(`- ${prices.length} prices configured`);
    console.log(`- ${memberships.length} membership tiers`);
    console.log(`- ${customers.length} sample customers`);
    console.log('\nThe salon POS is ready for testing! 🎉');

  } catch (error) {
    console.error('Error setting up demo data:', error);
  }
}

setupSalonDemoData();