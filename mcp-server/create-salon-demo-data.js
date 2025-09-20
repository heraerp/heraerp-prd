#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Demo customers
const customers = [
  {
    entity_name: 'Sarah Johnson',
    entity_code: 'CUST-SALON-001',
    metadata: {
      phone: '+971501234567',
      email: 'sarah.johnson@email.com',
      loyalty_member: true,
      preferred_stylist: 'Jessica Miller',
      visit_frequency: 'monthly',
      last_visit: '2024-11-15'
    }
  },
  {
    entity_name: 'Emily Chen',
    entity_code: 'CUST-SALON-002',
    metadata: {
      phone: '+971502345678',
      email: 'emily.chen@email.com',
      loyalty_member: true,
      preferred_stylist: 'Amanda Wilson',
      visit_frequency: 'bi-weekly',
      last_visit: '2024-11-20'
    }
  },
  {
    entity_name: 'Maria Garcia',
    entity_code: 'CUST-SALON-003',
    metadata: {
      phone: '+971503456789',
      email: 'maria.garcia@email.com',
      loyalty_member: false,
      visit_frequency: 'monthly',
      last_visit: '2024-11-10'
    }
  },
  {
    entity_name: 'Aisha Mohammed',
    entity_code: 'CUST-SALON-004',
    metadata: {
      phone: '+971504567890',
      email: 'aisha.mohammed@email.com',
      loyalty_member: true,
      preferred_stylist: 'Nicole Brown',
      visit_frequency: 'weekly',
      last_visit: '2024-11-22'
    }
  },
  {
    entity_name: 'Priya Sharma',
    entity_code: 'CUST-SALON-005',
    metadata: {
      phone: '+971505678901',
      email: 'priya.sharma@email.com',
      loyalty_member: true,
      preferred_stylist: 'Jessica Miller',
      visit_frequency: 'monthly',
      last_visit: '2024-11-18'
    }
  }
];

// Demo stylists/employees
const stylists = [
  {
    entity_name: 'Jessica Miller',
    entity_code: 'EMP-SALON-001',
    metadata: {
      role: 'Senior Stylist',
      specialties: ['Hair Color', 'Highlights', 'Balayage'],
      experience_years: 8,
      hourly_rate: 150,
      commission_rate: 0.25,
      schedule: 'Tuesday-Saturday',
      phone: '+971506789012'
    }
  },
  {
    entity_name: 'Amanda Wilson',
    entity_code: 'EMP-SALON-002',
    metadata: {
      role: 'Stylist',
      specialties: ['Haircuts', 'Styling', 'Updos'],
      experience_years: 5,
      hourly_rate: 120,
      commission_rate: 0.20,
      schedule: 'Monday-Friday',
      phone: '+971507890123'
    }
  },
  {
    entity_name: 'Nicole Brown',
    entity_code: 'EMP-SALON-003',
    metadata: {
      role: 'Color Specialist',
      specialties: ['Hair Color', 'Color Correction', 'Treatments'],
      experience_years: 10,
      hourly_rate: 180,
      commission_rate: 0.30,
      schedule: 'Wednesday-Sunday',
      phone: '+971508901234'
    }
  },
  {
    entity_name: 'Sofia Martinez',
    entity_code: 'EMP-SALON-004',
    metadata: {
      role: 'Junior Stylist',
      specialties: ['Blowouts', 'Basic Cuts', 'Styling'],
      experience_years: 2,
      hourly_rate: 80,
      commission_rate: 0.15,
      schedule: 'Tuesday-Saturday',
      phone: '+971509012345'
    }
  }
];

// Demo services
const services = [
  {
    entity_name: 'Haircut & Style',
    entity_code: 'SVC-SALON-001',
    metadata: {
      category: 'Cut & Style',
      duration_minutes: 45,
      price_aed: 120,
      description: 'Professional haircut with wash and blow-dry styling',
      booking_available: true,
      popular: true
    }
  },
  {
    entity_name: 'Hair Color',
    entity_code: 'SVC-SALON-002',
    metadata: {
      category: 'Color',
      duration_minutes: 90,
      price_aed: 350,
      description: 'Full head single-process color application',
      booking_available: true,
      requires_consultation: true
    }
  },
  {
    entity_name: 'Highlights',
    entity_code: 'SVC-SALON-003',
    metadata: {
      category: 'Color',
      duration_minutes: 120,
      price_aed: 450,
      description: 'Foil highlights for dimensional color',
      booking_available: true,
      requires_consultation: true,
      popular: true
    }
  },
  {
    entity_name: 'Blow Dry',
    entity_code: 'SVC-SALON-004',
    metadata: {
      category: 'Styling',
      duration_minutes: 30,
      price_aed: 80,
      description: 'Professional blow-dry styling',
      booking_available: true
    }
  },
  {
    entity_name: 'Hair Treatment',
    entity_code: 'SVC-SALON-005',
    metadata: {
      category: 'Treatment',
      duration_minutes: 60,
      price_aed: 200,
      description: 'Deep conditioning or keratin treatment',
      booking_available: true
    }
  },
  {
    entity_name: 'Updo/Special Occasion',
    entity_code: 'SVC-SALON-006',
    metadata: {
      category: 'Styling',
      duration_minutes: 60,
      price_aed: 250,
      description: 'Elegant updo for weddings and special events',
      booking_available: true,
      requires_consultation: true
    }
  },
  {
    entity_name: 'Balayage',
    entity_code: 'SVC-SALON-007',
    metadata: {
      category: 'Color',
      duration_minutes: 150,
      price_aed: 550,
      description: 'Hand-painted highlights for natural sun-kissed look',
      booking_available: true,
      requires_consultation: true,
      popular: true
    }
  },
  {
    entity_name: 'Root Touch-Up',
    entity_code: 'SVC-SALON-008',
    metadata: {
      category: 'Color',
      duration_minutes: 60,
      price_aed: 180,
      description: 'Color application for root regrowth',
      booking_available: true
    }
  }
];

async function createDemoData() {
  console.log('🎨 Creating Hair Talkz Salon demo data...\n');

  // Create customers
  console.log('👥 Creating customers...');
  for (const customer of customers) {
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: SALON_ORG_ID,
        entity_type: 'customer',
        entity_name: customer.entity_name,
        entity_code: customer.entity_code,
        smart_code: 'HERA.SALON.CUSTOMER.PROFILE.ACTIVE.v1',
        metadata: customer.metadata,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating customer ${customer.entity_name}:`, error.message);
    } else {
      console.log(`✅ Created customer: ${customer.entity_name}`);
    }
  }

  // Create stylists
  console.log('\n💇‍♀️ Creating stylists...');
  for (const stylist of stylists) {
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: SALON_ORG_ID,
        entity_type: 'employee',
        entity_name: stylist.entity_name,
        entity_code: stylist.entity_code,
        smart_code: 'HERA.SALON.EMPLOYEE.STYLIST.ACTIVE.v1',
        metadata: stylist.metadata,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating stylist ${stylist.entity_name}:`, error.message);
    } else {
      console.log(`✅ Created stylist: ${stylist.entity_name} (${stylist.metadata.role})`);
    }
  }

  // Create services
  console.log('\n✂️ Creating services...');
  for (const service of services) {
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: SALON_ORG_ID,
        entity_type: 'service',
        entity_name: service.entity_name,
        entity_code: service.entity_code,
        smart_code: 'HERA.SALON.SERVICE.BEAUTY.CATALOG.v1',
        metadata: service.metadata,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating service ${service.entity_name}:`, error.message);
    } else {
      console.log(`✅ Created service: ${service.entity_name} (AED ${service.metadata.price_aed})`);
    }
  }

  console.log('\n✨ Demo data creation complete!');
}

// Run the script
createDemoData().catch(console.error);