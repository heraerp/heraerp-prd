#!/usr/bin/env node

/**
 * Script to add missing tax and commission data for services
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

async function addMissingData() {
  try {
    console.log('Adding missing tax and commission data...');
    
    // Get all services
    const { data: services, error: servicesError } = await supabase
      .from('core_entities')
      .select('id, entity_name, organization_id')
      .in('entity_type', ['service', 'svc'])
      .eq('status', 'active');
    
    if (servicesError) {
      throw servicesError;
    }
    
    console.log(`Found ${services.length} services`);
    
    // Default tax and commission data
    const defaultTax = { rate: 5, type: 'VAT' };
    const defaultCommission = { type: 'percent', value: 40 };
    
    const dynamicDataRecords = [];
    
    for (const service of services) {
      // Add tax data
      dynamicDataRecords.push({
        organization_id: service.organization_id,
        entity_id: service.id,
        field_name: 'service.tax',
        field_type: 'json',
        field_value_json: defaultTax,
        smart_code: 'HERA.SALON.SERVICE.TAX.V1'
      });
      
      // Add commission data
      dynamicDataRecords.push({
        organization_id: service.organization_id,
        entity_id: service.id,
        field_name: 'service.commission',
        field_type: 'json',
        field_value_json: defaultCommission,
        smart_code: 'HERA.SALON.SERVICE.COMMISSION.V1'
      });
    }
    
    // Insert dynamic data in batches
    console.log(`Inserting ${dynamicDataRecords.length} records...`);
    
    // Insert in smaller batches to avoid issues
    const batchSize = 50;
    let successCount = 0;
    
    for (let i = 0; i < dynamicDataRecords.length; i += batchSize) {
      const batch = dynamicDataRecords.slice(i, i + batchSize);
      
      // First delete any existing records to avoid conflicts
      for (const record of batch) {
        await supabase
          .from('core_dynamic_data')
          .delete()
          .match({
            organization_id: record.organization_id,
            entity_id: record.entity_id,
            field_name: record.field_name
          });
      }
      
      // Then insert new records
      const { data, error } = await supabase
        .from('core_dynamic_data')
        .insert(batch);
      
      if (error) {
        console.error(`Batch ${i/batchSize + 1} error:`, error);
      } else {
        successCount += batch.length;
      }
    }
    
    if (successCount === 0) {
      throw new Error('No records were inserted');
    }
    
    console.log(`✅ Successfully added tax and commission data for ${services.length} services`);
    
  } catch (error) {
    console.error('Failed to add data:', error);
    process.exit(1);
  }
}

// Run the script
addMissingData();