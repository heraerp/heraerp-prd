#!/usr/bin/env node

/**
 * Seed Salon Customers
 * 
 * Creates demo customers for salon with proper smart codes
 * and realistic data following HERA DNA standards
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Demo customer data
const DEMO_CUSTOMERS = [
  {
    name: 'Jennifer Anderson',
    email: 'jennifer.anderson@example.com',
    phone: '+1 (555) 123-4567',
    customer_type: 'vip',
    tags: 'VIP,Color Expert,Platinum Member',
    date_of_birth: '1985-03-15',
    address: '123 Luxury Ave, Beverly Hills, CA 90210',
    preferred_stylist: 'Michele',
    allergies: 'PPD sensitive',
    preferences: 'Prefers organic products, morning appointments only',
    notes: 'Long-time client, always tips well, refers many friends',
    lifetime_value: 12500,
    visit_count: 48,
    average_ticket: 260,
    loyalty_points: 2500,
    wallet_balance: 150
  },
  {
    name: 'Sarah Thompson',
    email: 'sarah.thompson@example.com',
    phone: '+1 (555) 234-5678',
    customer_type: 'regular',
    tags: 'Bridal,Extensions',
    date_of_birth: '1990-07-22',
    address: '456 Main St, Los Angeles, CA 90001',
    preferred_stylist: 'Angela',
    preferences: 'Likes balayage, prefers afternoon appointments',
    notes: 'Getting married in June 2025',
    lifetime_value: 4800,
    visit_count: 24,
    average_ticket: 200,
    loyalty_points: 960
  },
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@example.com',
    phone: '+1 (555) 345-6789',
    customer_type: 'new',
    tags: 'New Customer,Referral',
    date_of_birth: '1995-11-08',
    address: '789 Oak Street, Santa Monica, CA 90401',
    allergies: 'Fragrance allergy',
    preferences: 'First time customer, referred by Jennifer Anderson',
    lifetime_value: 0,
    visit_count: 0,
    average_ticket: 0,
    loyalty_points: 100 // Welcome bonus
  },
  {
    name: 'Emily Chen',
    email: 'emily.chen@example.com',
    phone: '+1 (555) 456-7890',
    customer_type: 'vip',
    tags: 'VIP,Keratin Expert,Monthly Member',
    date_of_birth: '1988-12-25',
    preferred_stylist: 'Michele',
    preferences: 'Monthly keratin treatments, prefers weekends',
    notes: 'Fashion blogger, posts about us on Instagram',
    lifetime_value: 8900,
    visit_count: 36,
    average_ticket: 247,
    loyalty_points: 1780,
    wallet_balance: 500
  },
  {
    name: 'Lisa Johnson',
    email: 'lisa.johnson@example.com',
    phone: '+1 (555) 567-8901',
    customer_type: 'regular',
    tags: 'Color Regular',
    date_of_birth: '1975-04-30',
    address: '321 Sunset Blvd, West Hollywood, CA 90069',
    preferences: 'Root touch-ups every 6 weeks',
    lifetime_value: 3200,
    visit_count: 20,
    average_ticket: 160,
    loyalty_points: 640
  }
];

async function seedSalonCustomers(organizationId) {
  console.log('🌱 Seeding salon customers...\n');

  for (const customerData of DEMO_CUSTOMERS) {
    try {
      // Create customer entity
      const { data: customer, error: customerError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'CUSTOMER',
          entity_name: customerData.name,
          entity_code: `CUST-${customerData.name.split(' ')[1].toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
          smart_code: 'HERA.SALON.CUSTOMER.ENTITY.PERSON.V1',
          status: 'active'
        })
        .select()
        .single();

      if (customerError) {
        console.error(`❌ Error creating customer ${customerData.name}:`, customerError);
        continue;
      }

      console.log(`✅ Created customer: ${customerData.name} (${customer.id})`);

      // Create dynamic fields
      const dynamicFields = [
        { field_name: 'name', field_value_text: customerData.name, smart_code: 'HERA.SALON.CUSTOMER.DYN.NAME.V1' },
        { field_name: 'email', field_value_text: customerData.email, smart_code: 'HERA.SALON.CUSTOMER.DYN.EMAIL.V1' },
        { field_name: 'phone', field_value_text: customerData.phone, smart_code: 'HERA.SALON.CUSTOMER.DYN.PHONE.V1' },
        { field_name: 'customer_type', field_value_text: customerData.customer_type, smart_code: 'HERA.SALON.CUSTOMER.DYN.TYPE.V1' },
        { field_name: 'tags', field_value_text: customerData.tags, smart_code: 'HERA.SALON.CUSTOMER.DYN.TAGS.V1' },
        { field_name: 'lifetime_value', field_value_number: customerData.lifetime_value, smart_code: 'HERA.SALON.CUSTOMER.DYN.LIFETIME.VALUE.V1' },
        { field_name: 'visit_count', field_value_number: customerData.visit_count, smart_code: 'HERA.SALON.CUSTOMER.DYN.VISIT.COUNT.V1' },
        { field_name: 'average_ticket', field_value_number: customerData.average_ticket, smart_code: 'HERA.SALON.CUSTOMER.DYN.AVG.TICKET.V1' },
        { field_name: 'loyalty_points', field_value_number: customerData.loyalty_points, smart_code: 'HERA.SALON.CUSTOMER.DYN.LOYALTY.POINTS.V1' },
        { field_name: 'status', field_value_text: 'active', smart_code: 'HERA.SALON.CUSTOMER.DYN.STATUS.V1' }
      ];

      // Add optional fields
      if (customerData.date_of_birth) {
        dynamicFields.push({
          field_name: 'date_of_birth',
          field_value_date: customerData.date_of_birth,
          smart_code: 'HERA.SALON.CUSTOMER.DYN.BIRTHDAY.V1'
        });
      }

      if (customerData.address) {
        dynamicFields.push({
          field_name: 'address',
          field_value_text: customerData.address,
          smart_code: 'HERA.SALON.CUSTOMER.DYN.ADDRESS.V1'
        });
      }

      if (customerData.preferred_stylist) {
        dynamicFields.push({
          field_name: 'preferred_stylist',
          field_value_text: customerData.preferred_stylist,
          smart_code: 'HERA.SALON.CUSTOMER.DYN.PREFERRED.STYLIST.V1'
        });
      }

      if (customerData.allergies) {
        dynamicFields.push({
          field_name: 'allergies',
          field_value_text: customerData.allergies,
          smart_code: 'HERA.SALON.CUSTOMER.DYN.ALLERGIES.V1'
        });
      }

      if (customerData.preferences) {
        dynamicFields.push({
          field_name: 'preferences',
          field_value_text: customerData.preferences,
          smart_code: 'HERA.SALON.CUSTOMER.DYN.PREFERENCES.V1'
        });
      }

      if (customerData.notes) {
        dynamicFields.push({
          field_name: 'notes',
          field_value_text: customerData.notes,
          smart_code: 'HERA.SALON.CUSTOMER.DYN.NOTES.V1'
        });
      }

      if (customerData.wallet_balance) {
        dynamicFields.push({
          field_name: 'wallet_balance',
          field_value_number: customerData.wallet_balance,
          smart_code: 'HERA.SALON.CUSTOMER.DYN.WALLET.BALANCE.V1'
        });
      }

      // Insert all dynamic fields
      const dynamicFieldsWithMeta = dynamicFields.map(field => ({
        ...field,
        organization_id: organizationId,
        entity_id: customer.id,
        field_type: field.field_value_text !== undefined ? 'text' : 
                   field.field_value_number !== undefined ? 'number' : 'date'
      }));

      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .insert(dynamicFieldsWithMeta);

      if (dynamicError) {
        console.error(`❌ Error creating dynamic fields for ${customerData.name}:`, dynamicError);
      } else {
        console.log(`  📝 Added ${dynamicFields.length} dynamic fields`);
      }

      // Set last visit date (random within last 60 days)
      if (customerData.visit_count > 0) {
        const lastVisitDays = Math.floor(Math.random() * 60) + 1;
        const lastVisitDate = new Date();
        lastVisitDate.setDate(lastVisitDate.getDate() - lastVisitDays);

        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: organizationId,
            entity_id: customer.id,
            field_name: 'last_visit',
            field_type: 'date',
            field_value_date: lastVisitDate.toISOString().split('T')[0],
            smart_code: 'HERA.SALON.CUSTOMER.DYN.LAST.VISIT.V1'
          });
      }

    } catch (error) {
      console.error(`❌ Unexpected error for ${customerData.name}:`, error);
    }
  }

  console.log('\n✨ Salon customers seeding complete!');
}

// Main execution
async function main() {
  const orgId = process.argv[2] || process.env.DEFAULT_ORGANIZATION_ID;

  if (!orgId) {
    console.error('❌ Please provide an organization ID as argument or set DEFAULT_ORGANIZATION_ID in .env');
    console.log('Usage: node seed-salon-customers.js <organization-id>');
    process.exit(1);
  }

  // Verify organization exists
  const { data: org, error: orgError } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    console.error('❌ Organization not found:', orgId);
    process.exit(1);
  }

  console.log(`🏢 Seeding customers for: ${org.organization_name} (${org.id})\n`);

  await seedSalonCustomers(orgId);
}

main().catch(console.error);