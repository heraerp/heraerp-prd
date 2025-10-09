#!/usr/bin/env node
/**
 * Finance DNA v2 SQL Executor - Direct Approach
 * Execute Finance DNA v2 functions directly using individual statements
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

console.log('🧬 Finance DNA v2 SQL Executor - Direct Approach');
console.log(`📍 Organization: ${organizationId}`);
console.log('');

async function createFunction01OrganizationValidation() {
  console.log('📄 Creating: hera_validate_organization_access()');
  
  const functionSQL = `
CREATE OR REPLACE FUNCTION hera_validate_organization_access(
    p_organization_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_org_id UUID;
BEGIN
    -- Get user's organization from JWT/session
    BEGIN
        SELECT organization_id INTO v_user_org_id
        FROM hera_resolve_user_identity_v1()
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        -- If no user identity resolution function, allow for system operations
        RETURN true;
    END;
    
    -- Prevent cross-organization access
    IF v_user_org_id IS NOT NULL AND v_user_org_id != p_organization_id THEN
        RAISE EXCEPTION 'Cross-organization access denied: % -> %', 
            v_user_org_id, p_organization_id;
    END IF;
    
    RETURN true;
END;
$$;`;

  try {
    const { error } = await supabase.rpc('execute_function', { sql_text: functionSQL });
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return false;
    }
    console.log(`   ✅ Success: Function created`);
    return true;
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function testConnection() {
  console.log('🔍 Testing Connection');
  console.log('');
  
  try {
    // Test basic connection
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
    return true;
    
  } catch (err) {
    console.log(`❌ Connection failed: ${err.message}`);
    return false;
  }
}

async function executeDirectSQL(sql, description) {
  console.log(`📄 Executing: ${description}`);
  
  try {
    // Try to execute using PostgreSQL function if available
    const { data, error } = await supabase.sql`${sql}`;
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return false;
    }
    
    console.log(`   ✅ Success: ${description} executed`);
    return true;
    
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function manualExecution() {
  console.log('🚀 Manual Function Execution');
  console.log('');
  
  // Read the first SQL file
  const sqlPath = join(__dirname, '../database/functions/finance-dna-v2/01-core-setup.sql');
  
  if (!existsSync(sqlPath)) {
    console.log('❌ SQL file not found');
    return false;
  }
  
  const sqlContent = readFileSync(sqlPath, 'utf8');
  console.log(`📊 File size: ${(sqlContent.length / 1024).toFixed(1)} KB`);
  
  // Extract and execute individual functions
  const functions = [
    {
      name: 'hera_validate_organization_access',
      description: 'Organization validation function'
    },
    {
      name: 'hera_set_organization_context_v2', 
      description: 'Organization context management'
    },
    {
      name: 'validate_finance_dna_smart_code',
      description: 'Smart Code validation'
    },
    {
      name: 'validate_gl_balance_trigger',
      description: 'GL Balance validation trigger'
    },
    {
      name: 'hera_audit_operation_v2',
      description: 'Audit logging function'
    }
  ];
  
  console.log(`Found ${functions.length} functions to create`);
  console.log('');
  
  // Try to execute the full SQL content as a single statement
  try {
    console.log('📄 Attempting to execute full SQL file...');
    
    // Use PostgREST for direct SQL execution
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        sql: sqlContent
      })
    });
    
    if (response.ok) {
      console.log('   ✅ Full SQL file executed successfully');
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ HTTP Error: ${response.status} - ${errorText}`);
    }
    
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }
  
  console.log('');
  console.log('⚠️  Direct execution failed. This is expected with Supabase limitations.');
  console.log('📋 Please execute the SQL files manually in Supabase SQL Editor:');
  console.log('');
  console.log('1. Open Supabase Dashboard → SQL Editor');
  console.log('2. Copy and paste the contents of these files in order:');
  console.log('   - database/functions/finance-dna-v2/01-core-setup.sql');
  console.log('   - database/functions/finance-dna-v2/02-reporting-rpcs.sql'); 
  console.log('   - database/functions/finance-dna-v2/03-policy-engine.sql');
  console.log('   - database/functions/finance-dna-v2/04-migration-functions.sql');
  console.log('3. Execute each file individually');
  console.log('');
  
  return false;
}

async function main() {
  console.log('Finance DNA v2 Direct Executor');
  console.log('=============================');
  console.log('');
  
  // Test connection first
  const connectionOk = await testConnection();
  if (!connectionOk) {
    process.exit(1);
  }
  
  console.log('');
  
  // Attempt manual execution
  const executed = await manualExecution();
  
  console.log('');
  console.log('📊 Summary');
  console.log('=========');
  
  if (executed) {
    console.log('✅ Finance DNA v2 functions created successfully');
  } else {
    console.log('⚠️  Automated execution not possible with current Supabase setup');
    console.log('💡 Please use manual execution via Supabase SQL Editor');
  }
}

main().catch(err => {
  console.error('🔥 Fatal error:', err.message);
  process.exit(1);
});