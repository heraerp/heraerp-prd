#!/usr/bin/env node
/**
 * Finance DNA v2 SQL Executor (ES Module Compatible)
 * Execute all Finance DNA v2 SQL files in Supabase in the correct sequence
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually
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

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

console.log('🧬 Finance DNA v2 SQL Executor');
console.log(`📍 Organization: ${organizationId}`);
console.log(`🔗 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
console.log('');

// SQL Files to execute in sequence
const sqlFiles = [
  {
    name: '01-core-setup.sql',
    description: 'Core Finance DNA v2 setup functions',
    path: '../database/functions/finance-dna-v2/01-core-setup.sql'
  },
  {
    name: '02-reporting-rpcs.sql', 
    description: 'High-performance reporting RPC functions',
    path: '../database/functions/finance-dna-v2/02-reporting-rpcs.sql'
  },
  {
    name: '03-policy-engine.sql',
    description: 'Policy-as-data engine functions',
    path: '../database/functions/finance-dna-v2/03-policy-engine.sql'
  },
  {
    name: '04-migration-functions.sql',
    description: 'Zero Tables migration functions',
    path: '../database/functions/finance-dna-v2/04-migration-functions.sql'
  }
];

async function executeSQLFile(file) {
  console.log(`📄 Executing: ${file.name}`);
  console.log(`   ${file.description}`);
  
  const fullPath = join(__dirname, file.path);
  
  if (!existsSync(fullPath)) {
    console.log(`   ❌ File not found: ${fullPath}`);
    return { success: false, error: 'File not found' };
  }
  
  try {
    const sqlContent = readFileSync(fullPath, 'utf8');
    console.log(`   📊 File size: ${(sqlContent.length / 1024).toFixed(1)} KB`);
    
    // Split SQL content into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`   📋 Found ${statements.length} SQL statements`);
    
    let successCount = 0;
    let errors = [];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--') || statement.length < 10) {
        continue;
      }
      
      try {
        // Use raw SQL execution through PostgreSQL connection
        const { data, error } = await supabase
          .rpc('exec_sql', { sql_statement: statement })
          .single();
        
        if (error) {
          // Some statements like CREATE OR REPLACE might not have data response
          // Try alternative method for DDL statements
          if (statement.toUpperCase().includes('CREATE') || 
              statement.toUpperCase().includes('DROP') ||
              statement.toUpperCase().includes('ALTER')) {
            
            // For DDL statements, try using a different approach
            console.log(`   ⚠️  Statement ${i + 1}: DDL statement, executing directly`);
            
            // Execute using edge function approach or rpc
            const { error: ddlError } = await supabase
              .rpc('execute_ddl', { ddl_statement: statement });
              
            if (ddlError) {
              errors.push(`Statement ${i + 1}: ${ddlError.message}`);
              console.log(`   ❌ Statement ${i + 1} failed: ${ddlError.message}`);
            } else {
              successCount++;
              console.log(`   ✅ Statement ${i + 1}: DDL executed`);
            }
          } else {
            errors.push(`Statement ${i + 1}: ${error.message}`);
            console.log(`   ❌ Statement ${i + 1} failed: ${error.message}`);
          }
        } else {
          successCount++;
          console.log(`   ✅ Statement ${i + 1}: Success`);
        }
      } catch (err) {
        errors.push(`Statement ${i + 1}: ${err.message}`);
        console.log(`   ❌ Statement ${i + 1} exception: ${err.message}`);
      }
    }
    
    const totalStatements = statements.filter(s => s && !s.startsWith('--') && s.length >= 10).length;
    console.log(`   📊 Results: ${successCount}/${totalStatements} statements executed successfully`);
    
    if (errors.length > 0) {
      console.log(`   ⚠️  Errors encountered: ${errors.length}`);
      return { 
        success: successCount === totalStatements, 
        error: errors.join('; '), 
        successCount, 
        totalStatements 
      };
    }
    
    console.log(`   ✅ Success: ${file.name} executed completely`);
    return { success: true, successCount, totalStatements };
    
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function checkConnection() {
  console.log('🔍 Phase 1: Pre-Execution Validation');
  console.log('');
  
  // Test basic connection
  try {
    const { data, error } = await supabase
      .from('core_organizations')
      .select('id, organization_name')
      .eq('id', organizationId)
      .single();
    
    if (error) {
      console.log(`❌ Organization not found: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Connected to organization: ${data.organization_name}`);
    
    // Check Sacred Six tables
    const tables = ['core_entities', 'core_dynamic_data', 'core_relationships', 
                   'universal_transactions', 'universal_transaction_lines'];
    
    for (const table of tables) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      
      if (countError) {
        console.log(`❌ Table ${table}: ${countError.message}`);
        return false;
      }
      
      console.log(`✅ Table ${table}: ${count || 0} records`);
    }
    
    return true;
    
  } catch (err) {
    console.log(`❌ Connection failed: ${err.message}`);
    return false;
  }
}

async function executeFunctions() {
  console.log('🚀 Phase 2: SQL Execution');
  console.log('');
  
  const results = [];
  
  for (const file of sqlFiles) {
    const result = await executeSQLFile(file);
    results.push({ file: file.name, ...result });
    console.log('');
    
    if (!result.success) {
      console.log(`🚨 Stopping execution due to error in ${file.name}`);
      break;
    }
  }
  
  return results;
}

async function testFunctions() {
  console.log('🧪 Phase 3: Function Testing');
  console.log('');
  
  // Test organization validation function
  try {
    const { data, error } = await supabase.rpc('hera_validate_organization_access', {
      p_organization_id: organizationId
    });
    
    if (error) {
      console.log(`❌ Organization validation test failed: ${error.message}`);
    } else {
      console.log(`✅ Organization validation: ${data ? 'PASS' : 'FAIL'}`);
    }
  } catch (err) {
    console.log(`❌ Function test error: ${err.message}`);
  }
  
  // Test trial balance function
  try {
    const { data, error } = await supabase.rpc('hera_generate_trial_balance_v2', {
      p_organization_id: organizationId,
      p_as_of_date: new Date().toISOString().split('T')[0]
    });
    
    if (error) {
      console.log(`❌ Trial balance test failed: ${error.message}`);
    } else {
      console.log(`✅ Trial balance function: ${data?.length || 0} accounts`);
    }
  } catch (err) {
    console.log(`❌ Trial balance test error: ${err.message}`);
  }
}

async function main() {
  console.log('Finance DNA v2 Implementation Executor');
  console.log('=====================================');
  console.log('');
  
  // Phase 1: Validation
  const connectionOk = await checkConnection();
  if (!connectionOk) {
    console.log('🚨 Pre-execution validation failed. Aborting.');
    process.exit(1);
  }
  
  console.log('');
  
  // Phase 2: Execution
  const results = await executeFunctions();
  
  console.log('');
  
  // Phase 3: Testing
  await testFunctions();
  
  console.log('');
  console.log('📊 Execution Summary');
  console.log('==================');
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.file}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('');
  console.log(`🎯 Overall Result: ${successCount}/${totalCount} files executed successfully`);
  
  if (successCount === totalCount) {
    console.log('🎉 Finance DNA v2 implementation complete!');
    process.exit(0);
  } else {
    console.log('⚠️  Partial implementation. Please review errors above.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('🔥 Fatal error:', err.message);
  process.exit(1);
});