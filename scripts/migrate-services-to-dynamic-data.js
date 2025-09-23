#!/usr/bin/env node

/**
 * Migration script to populate dynamic data for existing services
 * that were created before Phase 3.5 implementation
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample service data for existing services
const serviceData = {
  'SVC-SALON-001': { // Haircut & Style
    price: { amount: 150, currency_code: 'AED', tax_inclusive: false },
    duration_min: 45,
    category: 'Cut & Style',
    tax: { rate: 5, type: 'VAT' },
    commission: { type: 'percent', value: 40 }
  },
  'SVC-SALON-003': { // Highlights
    price: { amount: 350, currency_code: 'AED', tax_inclusive: false },
    duration_min: 120,
    category: 'Color',
    tax: { rate: 5, type: 'VAT' },
    commission: { type: 'percent', value: 35 }
  },
  'SVC-SALON-005': { // Hair Treatment
    price: { amount: 200, currency_code: 'AED', tax_inclusive: false },
    duration_min: 60,
    category: 'Treatment',
    tax: { rate: 5, type: 'VAT' },
    commission: { type: 'percent', value: 40 }
  },
  'SVC-SALON-006': { // Updo/Special Occasion
    price: { amount: 300, currency_code: 'AED', tax_inclusive: false },
    duration_min: 90,
    category: 'Styling',
    tax: { rate: 5, type: 'VAT' },
    commission: { type: 'percent', value: 45 }
  },
  'SVC-SALON-008': { // Root Touch-Up
    price: { amount: 180, currency_code: 'AED', tax_inclusive: false },
    duration_min: 60,
    category: 'Color',
    tax: { rate: 5, type: 'VAT' },
    commission: { type: 'percent', value: 35 }
  }
};

async function migrateServices() {
  try {
    console.log('Starting service dynamic data migration...');
    
    // Get organization ID from existing services
    const { data: services, error: servicesError } = await supabase
      .from('core_entities')
      .select('id, entity_code, organization_id')
      .eq('entity_type', 'service')
      .in('entity_code', Object.keys(serviceData));
    
    if (servicesError) {
      throw servicesError;
    }
    
    if (!services || services.length === 0) {
      console.log('No services found to migrate');
      return;
    }
    
    console.log(`Found ${services.length} services to migrate`);
    
    // Prepare dynamic data records
    const dynamicDataRecords = [];
    
    for (const service of services) {
      const data = serviceData[service.entity_code];
      if (!data) continue;
      
      // Price
      dynamicDataRecords.push({
        organization_id: service.organization_id,
        entity_id: service.id,
        field_name: 'service.base_price',
        field_type: 'json',
        field_value_json: data.price
      });
      
      // Duration
      dynamicDataRecords.push({
        organization_id: service.organization_id,
        entity_id: service.id,
        field_name: 'service.duration_min',
        field_type: 'number',
        field_value_number: data.duration_min
      });
      
      // Category
      dynamicDataRecords.push({
        organization_id: service.organization_id,
        entity_id: service.id,
        field_name: 'service.category',
        field_type: 'text',
        field_value_text: data.category
      });
      
      // Tax
      dynamicDataRecords.push({
        organization_id: service.organization_id,
        entity_id: service.id,
        field_name: 'service.tax',
        field_type: 'json',
        field_value_json: data.tax
      });
      
      // Commission
      dynamicDataRecords.push({
        organization_id: service.organization_id,
        entity_id: service.id,
        field_name: 'service.commission',
        field_type: 'json',
        field_value_json: data.commission
      });
    }
    
    // Insert dynamic data
    const { error: insertError } = await supabase
      .from('core_dynamic_data')
      .upsert(dynamicDataRecords, { 
        onConflict: 'organization_id,entity_id,field_name' 
      });
    
    if (insertError) {
      throw insertError;
    }
    
    console.log(`✅ Successfully migrated ${dynamicDataRecords.length} dynamic data records`);
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateServices();