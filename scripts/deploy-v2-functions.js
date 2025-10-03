#!/usr/bin/env node

/**
 * Deploy HERA V2 RPC Functions
 * Deploys the fixed v2 versions of entity CRUD functions
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployFunction(filename) {
  try {
    console.log(`\n📦 Deploying ${filename}...`);
    
    const sqlPath = path.join(__dirname, '../database/functions/v2', filename);
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: sql
    }).single();
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      const { error: queryError } = await supabase.from('_dummy_').select().limit(0).then(() => {
        // This is a hack - we can't directly execute SQL, so we'll need to use migrations
        throw new Error('Direct SQL execution not available');
      });
      
      console.warn(`⚠️  Cannot deploy ${filename} directly - please run via Supabase migrations`);
      return false;
    }
    
    console.log(`✅ Successfully deployed ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deploying ${filename}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 HERA V2 Functions Deployment Script');
  console.log('=====================================\n');
  
  // List of v2 functions to deploy
  const functions = [
    'hera_entity_read_v2.sql',
    'hera_entity_delete_v2.sql'
  ];
  
  console.log('📋 Functions to deploy:');
  functions.forEach(f => console.log(`   - ${f}`));
  
  console.log('\n⚠️  NOTE: If direct deployment fails, you need to:');
  console.log('1. Copy the SQL files to your Supabase migrations folder');
  console.log('2. Run: supabase migration new v2_functions');
  console.log('3. Copy the SQL content into the migration file');
  console.log('4. Run: supabase db push\n');
  
  // Try to deploy functions
  let successCount = 0;
  for (const func of functions) {
    if (await deployFunction(func)) {
      successCount++;
    }
  }
  
  if (successCount === functions.length) {
    console.log('\n✅ All functions deployed successfully!');
  } else {
    console.log(`\n⚠️  Deployed ${successCount}/${functions.length} functions`);
    console.log('\n📝 Manual deployment instructions:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Create a new query');
    console.log('3. Copy and paste the SQL from these files:');
    functions.forEach(f => {
      console.log(`   - database/functions/v2/${f}`);
    });
    console.log('4. Run the query\n');
  }
}

main().catch(console.error);