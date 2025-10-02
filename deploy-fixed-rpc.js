#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deployFixedRPC() {
  console.log('🔧 Deploying Fixed RPC Function: hera_entity_read_v1');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read the fixed SQL file
  const sqlPath = path.join(__dirname, 'database/functions/v2/hera_entity_read_v1_fixed.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    console.log('📝 Creating a migration for the fixed function...');

    // Since we can't directly execute SQL, let's save it as a migration
    const migrationPath = path.join(__dirname, 'supabase/migrations', `${Date.now()}_fix_hera_entity_read_v1.sql`);

    // Ensure migrations directory exists
    const migrationsDir = path.dirname(migrationPath);
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Write the migration file
    fs.writeFileSync(migrationPath, sql);
    console.log('✅ Migration file created at:', migrationPath);
    console.log('📌 Please run: npx supabase db push to apply the migration');

    console.log('\n🔍 For now, let\'s test if the function exists and what error we get...');

    // Test the function
    console.log('\n📊 Testing the fixed function...');
    const { data: testData, error: testError } = await supabase.rpc('hera_entity_read_v1', {
      p_organization_id: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', // Hair Talkz
      p_entity_type: 'service',
      p_limit: 5,
      p_include_dynamic_data: true
    });

    if (testError) {
      console.error('❌ Test error:', testError);
    } else {
      console.log('✅ Test successful!');
      if (testData?.success && testData?.data) {
        console.log(`📋 Found ${testData.data.length} services`);
        testData.data.slice(0, 5).forEach((service, i) => {
          console.log(`  ${i + 1}. ${service.entity_name} (${service.entity_code || 'no code'})`);
        });
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

deployFixedRPC();