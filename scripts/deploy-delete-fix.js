#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployDeleteFix() {
  console.log('🚀 Deploying fixed delete function...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'functions', 'v2', 'hera_entity_delete_v2_fixed.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('execute_sql', {
      p_query: sql
    });

    if (error) {
      console.error('❌ Failed to deploy function:', error);
      console.log('\n📝 Alternative: Copy the SQL from the following file and run in Supabase SQL Editor:');
      console.log(`   ${sqlPath}`);
      return;
    }

    console.log('✅ Fixed delete function deployed successfully!');
    
    // Test the function
    console.log('\n🧪 Testing soft delete...');
    
    // Get a test entity
    const { data: entities } = await supabase
      .from('core_entities')
      .select('id, entity_name, organization_id')
      .eq('entity_type', 'CATEGORY')
      .limit(1);

    if (entities?.length) {
      const testEntity = entities[0];
      console.log(`📍 Testing with entity: ${testEntity.entity_name} (${testEntity.id})`);
      
      // Check current status
      const { data: currentStatus } = await supabase
        .from('core_dynamic_data')
        .select('field_value_text')
        .eq('entity_id', testEntity.id)
        .eq('field_name', 'status')
        .single();
      
      console.log(`   Current status: ${currentStatus?.field_value_text || 'not set'}`);
    }

  } catch (err) {
    console.error('❌ Deployment failed:', err.message);
  }
}

deployDeleteFix();