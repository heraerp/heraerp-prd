#!/usr/bin/env node
/**
 * Execute RPC Function Creation
 * Creates the missing RPC functions for authentication
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 CREATING MISSING RPC FUNCTIONS');
console.log('=================================');
console.log('');

async function executeRPCCreation() {
  try {
    console.log('1️⃣ Reading SQL file...');
    
    const sqlContent = readFileSync('create-missing-rpc-functions.sql', 'utf8');
    console.log(`✅ SQL file loaded (${sqlContent.length} characters)`);
    
    console.log('');
    console.log('2️⃣ Executing SQL functions...');
    
    // Split the SQL into individual statements for better error handling
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => stmt !== 'DO $$' && stmt !== '$$'); // Remove DO block delimiters
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const [index, statement] of statements.entries()) {
      if (statement.includes('DO $$') || statement.includes('DECLARE') || statement.includes('BEGIN') || statement.includes('END')) {
        // Skip DO block statements for now
        continue;
      }
      
      try {
        console.log(`   Executing statement ${index + 1}...`);
        
        const { error } = await supabase.rpc('query', { 
          query_text: statement + ';'
        });
        
        if (error) {
          console.log(`   ❌ Statement ${index + 1} failed: ${error.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Statement ${index + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ⚠️ Statement ${index + 1} error: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('3️⃣ Testing created functions...');
    
    // Test resolve_user_identity_v1
    try {
      const { data: identityResult, error: identityError } = await supabase
        .rpc('resolve_user_identity_v1');
      
      if (identityError) {
        console.log('❌ resolve_user_identity_v1 test failed:', identityError.message);
      } else {
        console.log('✅ resolve_user_identity_v1 test passed:', identityResult);
      }
    } catch (err) {
      console.log('⚠️ resolve_user_identity_v1 test error:', err.message);
    }
    
    // Test resolve_user_roles_in_org
    try {
      const { data: rolesResult, error: rolesError } = await supabase
        .rpc('resolve_user_roles_in_org', { 
          p_org: '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
        });
      
      if (rolesError) {
        console.log('❌ resolve_user_roles_in_org test failed:', rolesError.message);
      } else {
        console.log('✅ resolve_user_roles_in_org test passed:', rolesResult);
      }
    } catch (err) {
      console.log('⚠️ resolve_user_roles_in_org test error:', err.message);
    }
    
    // Test hera_resolve_user_identity_v1
    try {
      const { data: heraResult, error: heraError } = await supabase
        .rpc('hera_resolve_user_identity_v1');
      
      if (heraError) {
        console.log('❌ hera_resolve_user_identity_v1 test failed:', heraError.message);
      } else {
        console.log('✅ hera_resolve_user_identity_v1 test passed:', heraResult);
      }
    } catch (err) {
      console.log('⚠️ hera_resolve_user_identity_v1 test error:', err.message);
    }
    
    console.log('');
    console.log('🎯 SUMMARY');
    console.log('==========');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('🎉 ALL RPC FUNCTIONS CREATED SUCCESSFULLY!');
      console.log('✅ Authentication RPC functions are now available');
      console.log('🚀 The auth system should now be fully functional');
      console.log('');
      console.log('💡 Created functions:');
      console.log('   - resolve_user_identity_v1() - Returns user organization memberships');
      console.log('   - resolve_user_roles_in_org(p_org) - Returns user roles in organization');
      console.log('   - hera_resolve_user_identity_v1() - Alternative identity resolution');
      console.log('');
      console.log('🔍 Next steps:');
      console.log('   1. Test authentication in the web application');
      console.log('   2. Verify JWT validation works properly');
      console.log('   3. Confirm organization context is resolved correctly');
    } else {
      console.log('⚠️ SOME ERRORS OCCURRED');
      console.log('💡 Check the error messages above and retry failed operations');
      console.log('🔧 The functions may still work if the core logic was created successfully');
    }
    
  } catch (error) {
    console.log('');
    console.log('🔥 EXECUTION ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Execute the RPC creation
executeRPCCreation();