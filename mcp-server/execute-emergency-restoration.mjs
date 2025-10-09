#!/usr/bin/env node
/**
 * Emergency Relationship Restoration Script
 * Restores critical relationships lost during Finance DNA v2 cleanup
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

console.log('🚨 EMERGENCY RELATIONSHIP RESTORATION');
console.log('=====================================');
console.log(`📍 Organization: ${ORG_ID}`);
console.log('');

async function checkCurrentState() {
  console.log('🔍 Checking current relationship state...');
  
  const { data: count, error } = await supabase
    .from('core_relationships')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID);
    
  if (error) {
    console.log('❌ Error checking relationships:', error.message);
    return 0;
  }
  
  console.log(`📊 Current relationships: ${count || 0}`);
  return count || 0;
}

async function executeRestorationSQL() {
  console.log('🔧 Executing emergency restoration SQL...');
  
  const sqlFile = join(__dirname, 'emergency-relationship-restoration.sql');
  if (!existsSync(sqlFile)) {
    throw new Error('Emergency restoration SQL file not found');
  }
  
  const sql = readFileSync(sqlFile, 'utf8');
  
  // Split SQL into individual statements and execute them
  const statements = sql.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;
    
    try {
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql_statement: statement 
      });
      
      if (error) {
        console.log(`❌ Error in statement ${i + 1}:`, error.message);
        errorCount++;
      } else {
        successCount++;
        if (data && data.length > 0) {
          console.log(`✅ Statement ${i + 1}: ${JSON.stringify(data[0])}`);
        }
      }
    } catch (err) {
      console.log(`❌ Exception in statement ${i + 1}:`, err.message);
      errorCount++;
    }
  }
  
  console.log('');
  console.log(`📊 SQL Execution Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  return { successCount, errorCount };
}

async function verifyRestoration() {
  console.log('🔍 Verifying restoration results...');
  
  const verifications = [
    {
      name: 'User Memberships',
      query: supabase
        .from('core_relationships')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ORG_ID)
        .eq('relationship_type', 'user_member_of_org')
    },
    {
      name: 'Status Relationships',
      query: supabase
        .from('core_relationships')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ORG_ID)
        .eq('relationship_type', 'has_status')
    },
    {
      name: 'Account Hierarchy',
      query: supabase
        .from('core_relationships')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ORG_ID)
        .eq('relationship_type', 'parent_of')
    }
  ];
  
  let totalRestored = 0;
  
  for (const verification of verifications) {
    const { data: count, error } = await verification.query;
    
    if (error) {
      console.log(`❌ ${verification.name}: Error - ${error.message}`);
    } else {
      console.log(`✅ ${verification.name}: ${count || 0} relationships`);
      totalRestored += count || 0;
    }
  }
  
  const { data: totalCount, error: totalError } = await supabase
    .from('core_relationships')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID);
    
  if (!totalError) {
    console.log(`📊 Total relationships restored: ${totalCount || 0}`);
  }
  
  return totalRestored;
}

async function main() {
  try {
    console.log('Emergency Relationship Restoration Started');
    console.log('=========================================');
    console.log('');
    
    // Check current state
    const initialCount = await checkCurrentState();
    console.log('');
    
    if (initialCount > 0) {
      console.log('⚠️  Some relationships already exist. Proceeding with restoration...');
      console.log('');
    }
    
    // Execute restoration
    const { successCount, errorCount } = await executeRestorationSQL();
    console.log('');
    
    // Verify results
    const restoredCount = await verifyRestoration();
    console.log('');
    
    // Final status
    console.log('🎯 RESTORATION SUMMARY');
    console.log('=====================');
    console.log(`📊 Initial relationships: ${initialCount}`);
    console.log(`🔧 SQL statements executed: ${successCount}`);
    console.log(`❌ SQL errors: ${errorCount}`);
    console.log(`✅ Relationships restored: ${restoredCount}`);
    console.log('');
    
    if (restoredCount > 0 && errorCount === 0) {
      console.log('🎉 EMERGENCY RESTORATION SUCCESSFUL!');
      console.log('✅ Critical relationships have been restored');
      console.log('🚀 System should now be functional');
      process.exit(0);
    } else if (restoredCount > 0) {
      console.log('⚠️  PARTIAL RESTORATION COMPLETED');
      console.log('💡 Some relationships restored, check errors above');
      process.exit(1);
    } else {
      console.log('🚨 RESTORATION FAILED');
      console.log('❌ No relationships were restored');
      process.exit(2);
    }
    
  } catch (error) {
    console.log('');
    console.log('🔥 FATAL ERROR:', error.message);
    console.log('');
    console.log('💡 Please check:');
    console.log('   - Database connection settings');
    console.log('   - Service role key permissions');
    console.log('   - SQL file exists and is readable');
    process.exit(3);
  }
}

// Run the restoration
main();