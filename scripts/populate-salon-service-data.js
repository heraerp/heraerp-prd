#!/usr/bin/env node

/**
 * Populate dynamic data for salon services
 * This script adds price, duration, category, tax, and commission data to existing services
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz

// Sample service data based on typical salon services
const serviceData = {
  'Haircut & Style': { 
    price: 150, 
    duration: 45, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 40 }
  },
  'Hair Color': { 
    price: 350, 
    duration: 120, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 35 }
  },
  'Highlights': { 
    price: 450, 
    duration: 180, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 35 }
  },
  'Blow Dry': { 
    price: 100, 
    duration: 30, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 50 }
  },
  'Hair Treatment': { 
    price: 200, 
    duration: 60, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 40 }
  },
  'Balayage': { 
    price: 500, 
    duration: 240, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 35 }
  },
  'Brazilian Blowout': { 
    price: 800, 
    duration: 180, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 30 }
  },
  'Deep Conditioning': { 
    price: 150, 
    duration: 45, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 45 }
  },
  'Hair Cut': { 
    price: 100, 
    duration: 30, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 50 }
  },
  'Keratin Treatment': { 
    price: 600, 
    duration: 180, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 30 }
  },
  'Hair Extensions': { 
    price: 1200, 
    duration: 240, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 25 }
  },
  'Root Touch-Up': { 
    price: 250, 
    duration: 90, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 40 }
  },
  'Perm': { 
    price: 400, 
    duration: 180, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 35 }
  },
  'Updo/Special Occasion': { 
    price: 300, 
    duration: 90, 
    category: 'Hair Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 40 }
  },
  'Manicure': { 
    price: 80, 
    duration: 45, 
    category: 'Nail Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 50 }
  },
  'Pedicure': { 
    price: 120, 
    duration: 60, 
    category: 'Nail Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 50 }
  },
  'Facial': { 
    price: 200, 
    duration: 60, 
    category: 'Spa Services',
    tax_rate: 5,
    commission: { type: 'percent', value: 40 }
  }
};

async function populateServiceData() {
  console.log('🎨 Populating salon service dynamic data...\n');

  // First, fetch all services for the organization
  const { data: services, error: servicesError } = await supabase
    .from('core_entities')
    .select('id, entity_name, smart_code')
    .eq('organization_id', ORGANIZATION_ID)
    .eq('entity_type', 'service');

  if (servicesError) {
    console.error('Error fetching services:', servicesError);
    return;
  }

  console.log(`Found ${services.length} services to update\n`);

  let created = 0;
  let errors = 0;

  for (const service of services) {
    const data = serviceData[service.entity_name];
    if (!data) {
      console.log(`⚠️  No data template for: ${service.entity_name}`);
      continue;
    }

    console.log(`\n📝 Processing: ${service.entity_name}`);

    const dynamicDataEntries = [];

    // Price
    if (data.price) {
      dynamicDataEntries.push({
        organization_id: ORGANIZATION_ID,
        entity_id: service.id,
        field_slug: 'service.price',
        field_value: JSON.stringify({ 
          value: data.price,
          currency: 'AED',
          effective_from: new Date().toISOString()
        }),
        field_value_number: data.price,
        smart_code: 'HERA.SALON.SERVICE.PRICE.V1',
        created_by: 'system',
        updated_by: 'system'
      });
    }

    // Duration
    if (data.duration) {
      dynamicDataEntries.push({
        organization_id: ORGANIZATION_ID,
        entity_id: service.id,
        field_slug: 'service.duration_min',
        field_value_number: data.duration,
        smart_code: 'HERA.SALON.SERVICE.DURATION.V1',
        created_by: 'system',
        updated_by: 'system'
      });
    }

    // Category
    if (data.category) {
      dynamicDataEntries.push({
        organization_id: ORGANIZATION_ID,
        entity_id: service.id,
        field_slug: 'service.category',
        field_value_text: data.category,
        smart_code: 'HERA.SALON.SERVICE.CATEGORY.V1',
        created_by: 'system',
        updated_by: 'system'
      });
    }

    // Tax
    if (data.tax_rate) {
      dynamicDataEntries.push({
        organization_id: ORGANIZATION_ID,
        entity_id: service.id,
        field_slug: 'service.tax',
        field_value: JSON.stringify({ 
          rate: data.tax_rate,
          type: 'VAT'
        }),
        field_value_number: data.tax_rate,
        smart_code: 'HERA.SALON.SERVICE.TAX.V1',
        created_by: 'system',
        updated_by: 'system'
      });
    }

    // Commission
    if (data.commission) {
      dynamicDataEntries.push({
        organization_id: ORGANIZATION_ID,
        entity_id: service.id,
        field_slug: 'service.commission',
        field_value: JSON.stringify(data.commission),
        field_value_number: data.commission.value,
        smart_code: 'HERA.SALON.SERVICE.COMMISSION.V1',
        created_by: 'system',
        updated_by: 'system'
      });
    }

    // Insert all dynamic data entries
    const { error: insertError } = await supabase
      .from('core_dynamic_data')
      .upsert(dynamicDataEntries, {
        onConflict: 'organization_id,entity_id,field_slug'
      });

    if (insertError) {
      console.error(`  ❌ Error: ${insertError.message}`);
      errors++;
    } else {
      console.log(`  ✅ Added ${dynamicDataEntries.length} dynamic data entries`);
      created += dynamicDataEntries.length;
    }
  }

  console.log('\n🎉 Summary:');
  console.log(`  ✅ Created: ${created} dynamic data entries`);
  console.log(`  ❌ Errors: ${errors}`);
}

// Run the script
populateServiceData()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });