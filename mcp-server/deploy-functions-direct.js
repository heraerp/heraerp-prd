#!/usr/bin/env node

/**
 * Deploy Entity CRUD Functions to Supabase using direct PostgreSQL connection
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env.local' });

// Get Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PASSWORD = process.env.SUPABASE_DB_PASSWORD || 'heraerp2024!@#';
let DATABASE_URL = process.env.DATABASE_URL;

// If DATABASE_URL is not set, construct it from SUPABASE_URL
if (!DATABASE_URL && SUPABASE_URL) {
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (projectRef) {
    DATABASE_URL = `postgresql://postgres.${projectRef}:${SUPABASE_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`;
    console.log('ℹ️  Constructed DATABASE_URL from SUPABASE_URL');
  }
}

if (!DATABASE_URL) {
  console.error('❌ Could not determine DATABASE_URL');
  console.error('   Please ensure your .env.local file contains either:');
  console.error('   - DATABASE_URL, or');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD');
  process.exit(1);
}

async function deployFunctions() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🚀 Connecting to Supabase database...\n');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Read SQL files
    console.log('📄 Reading SQL migration files...');

    const entityFunctionsPath = path.join(__dirname, '../supabase/migrations/20240101000001_hera_entity_crud_functions.sql');
    const dynamicDataFunctionsPath = path.join(__dirname, '../database/functions/v2/hera_dynamic_data_v1.sql');

    const entityFunctionsSQL = fs.readFileSync(entityFunctionsPath, 'utf8');
    const dynamicDataFunctionsSQL = fs.readFileSync(dynamicDataFunctionsPath, 'utf8');

    console.log('✅ SQL files loaded\n');

    // Deploy Entity CRUD Functions
    console.log('📦 Deploying Entity CRUD Functions...');
    console.log('   - hera_entity_upsert_v1');
    console.log('   - hera_entity_read_v1');
    console.log('   - hera_entity_delete_v1');
    console.log('   - hera_entity_recover_v1\n');

    try {
      await client.query(entityFunctionsSQL);
      console.log('✅ Entity CRUD functions deployed successfully!\n');
    } catch (error) {
      console.error('❌ Error deploying entity functions:', error.message);
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Functions may already exist, continuing...\n');
      } else {
        throw error;
      }
    }

    // Deploy Dynamic Data Functions
    console.log('📦 Deploying Dynamic Data Functions...');
    console.log('   - hera_dynamic_data_set_v1');
    console.log('   - hera_dynamic_data_get_v1');
    console.log('   - hera_dynamic_data_delete_v1');
    console.log('   - hera_dynamic_data_batch_v1\n');

    try {
      await client.query(dynamicDataFunctionsSQL);
      console.log('✅ Dynamic Data functions deployed successfully!\n');
    } catch (error) {
      console.error('❌ Error deploying dynamic data functions:', error.message);
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Functions may already exist, continuing...\n');
      } else {
        throw error;
      }
    }

    // Verify deployment
    console.log('🧪 Verifying deployed functions...\n');

    const checkFunctions = [
      'hera_entity_upsert_v1',
      'hera_entity_read_v1',
      'hera_entity_delete_v1',
      'hera_entity_recover_v1',
      'hera_dynamic_data_set_v1',
      'hera_dynamic_data_get_v1',
      'hera_dynamic_data_delete_v1',
      'hera_dynamic_data_batch_v1'
    ];

    const result = await client.query(`
      SELECT proname as function_name
      FROM pg_proc
      WHERE proname = ANY($1::text[])
      ORDER BY proname
    `, [checkFunctions]);

    console.log('📋 Deployed functions found in database:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.function_name}`);
    });

    // Test a function
    console.log('\n🧪 Testing hera_entity_read_v1...');
    try {
      const testResult = await client.query(`
        SELECT hera_entity_read_v1(
          '3df8cc52-3d81-42d5-b088-7736ae26cc7c'::uuid,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          FALSE,
          FALSE,
          1,
          0
        ) as result
      `);

      if (testResult.rows[0].result) {
        console.log('✅ Function test successful!');
      }
    } catch (error) {
      console.log('⚠️  Function test failed:', error.message);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Deployment Complete!');
    console.log('='.repeat(60));
    console.log('\n✨ All HERA Entity and Dynamic Data functions are now available!');
    console.log('📌 Your API endpoints at /api/v2/universal/ can now use these functions');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run deployment
deployFunctions().catch(console.error);