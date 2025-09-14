const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyNormalizationViaAPI() {
  console.log('=== Applying HERA Entity Normalization DNA via API ===\n');
  
  try {
    // First, let's test our ability to create the normalization function
    console.log('Testing if we can create functions via RPC...\n');
    
    // Test creating a simple function first
    const testFunctionSQL = `
    CREATE OR REPLACE FUNCTION test_normalization_setup()
    RETURNS text AS $$
    BEGIN
      RETURN 'Normalization setup test successful';
    END;
    $$ LANGUAGE plpgsql;
    `;
    
    // Since we can't execute arbitrary SQL via the API, let's create 
    // the normalization incrementally using what we can do
    
    console.log('Step 1: Creating normalized_name entries for existing entities...');
    
    // Get all entities without normalized names
    const { data: entities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('id, entity_name, organization_id')
      .is('status', null)
      .or('status.neq.deleted')
      .limit(100);
    
    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError);
      return;
    }
    
    console.log(`Found ${entities.length} entities to process`);
    
    // Check which ones already have normalized names
    const entityIds = entities.map(e => e.id);
    const { data: existingNormalized } = await supabase
      .from('core_dynamic_data')
      .select('entity_id')
      .in('entity_id', entityIds)
      .eq('field_name', 'normalized_name');
    
    const existingIds = new Set(existingNormalized?.map(n => n.entity_id) || []);
    const entitiesToNormalize = entities.filter(e => !existingIds.has(e.id));
    
    console.log(`${entitiesToNormalize.length} entities need normalized names`);
    
    // Create normalized names
    for (const entity of entitiesToNormalize) {
      const normalizedName = entity.entity_name
        .toLowerCase()
        .replace(/\s+(llc|inc|ltd|limited|corporation|corp|company|co)\.?$/gi, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      const { error } = await supabase
        .from('core_dynamic_data')
        .insert({
          entity_id: entity.id,
          field_name: 'normalized_name',
          field_value_text: normalizedName,
          organization_id: entity.organization_id,
          smart_code: 'HERA.SYSTEM.NORMALIZATION.NAME.v1'
        });
      
      if (error) {
        console.error(`Failed to normalize ${entity.entity_name}:`, error.message);
      } else {
        console.log(`✅ Normalized: ${entity.entity_name} → ${normalizedName}`);
      }
    }
    
    console.log('\nStep 2: Instructions for manual SQL execution...\n');
    console.log('Since we cannot create database functions via the API, please:');
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/awfcrncxngqwbhqapffb/sql/new');
    console.log('2. Copy the contents of: db/init/01_hera_entity_normalization_dna.sql');
    console.log('3. Paste and execute in the SQL editor');
    console.log('\nThe SQL file contains:');
    console.log('- pg_trgm extension activation');
    console.log('- RLS policies for organization isolation');
    console.log('- Normalization trigger function');
    console.log('- Entity resolution RPC function');
    console.log('- Duplicate detection views');
    console.log('- Performance indexes');
    
    // Test if the function exists after manual creation
    console.log('\nStep 3: Testing if rpc_entities_resolve_and_upsert exists...');
    
    const { data: testData, error: testError } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
      p_org_id: '84a3654b-907b-472a-ac8f-a1ffb6fb711b',
      p_entity_type: 'test',
      p_entity_name: 'Test Entity'
    });
    
    if (testError && testError.message.includes('does not exist')) {
      console.log('❌ Function not yet created. Please run the SQL manually.');
    } else if (testError) {
      console.log('⚠️  Function exists but returned:', testError.message);
    } else {
      console.log('✅ Function is working! Result:', testData);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

applyNormalizationViaAPI();