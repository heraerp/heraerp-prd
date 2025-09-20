#!/usr/bin/env node

/**
 * Create basic salon entities for dashboard
 */

require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function createBasicEntities() {
  try {
    console.log('Creating basic salon entities...');

    // 1. Create salon location
    const { data: salon, error: salonError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORGANIZATION_ID,
        entity_type: 'location',
        entity_name: 'Hair Talkz Salon',
        entity_code: 'SALON-001',
        smart_code: 'HERA.SALON.LOC.MAIN.BRANCH.v1'
      })
      .select()
      .single();

    if (salonError && !salonError.message.includes('duplicate')) {
      console.error('Salon error:', salonError);
    } else if (salon) {
      console.log('✅ Created salon location');
    }

    // 2. Create services
    const services = [
      { name: 'Haircut', price: 50 },
      { name: 'Color Service', price: 120 },
      { name: 'Styling', price: 80 },
      { name: 'Treatment', price: 150 }
    ];

    for (const service of services) {
      const { error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'product',
          entity_name: service.name,
          entity_code: `SVC-${service.name.toUpperCase().replace(' ', '-')}`,
          smart_code: 'HERA.SALON.SVC.STANDARD.v1',
          metadata: { price: service.price, type: 'service' }
        });

      if (!error) {
        console.log(`✅ Created service: ${service.name}`);
      }
    }

    // 3. Create staff
    const staff = ['Sarah', 'Emma', 'Lisa', 'Maria'];
    for (const name of staff) {
      const { error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'employee',
          entity_name: name,
          entity_code: `STAFF-${name.toUpperCase()}`,
          smart_code: 'HERA.SALON.HR.STAFF.STYLIST.v1',
          metadata: { role: 'Stylist' }
        });

      if (!error) {
        console.log(`✅ Created staff: ${name}`);
      }
    }

    console.log('✅ Basic entities created successfully!');
  } catch (error) {
    console.error('Error creating entities:', error);
  }
}

createBasicEntities();