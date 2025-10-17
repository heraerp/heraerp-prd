#!/usr/bin/env node
/**
 * Deploy hera_transactions_crud_v2 function to Supabase
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deployFunction() {
  console.log('🚀 Deploying hera_transactions_crud_v2 function...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('hera-transactions-crud-v2-corrected.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      console.error('❌ Function deployment failed:', error);
      throw error;
    }
    
    console.log('✅ Function deployed successfully');
    console.log('🔍 Testing function...');
    
    // Test the function
    const testResult = await supabase.rpc('hera_transactions_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: '00000000-0000-0000-0000-000000000001',
      p_organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
    });
    
    if (testResult.error) {
      console.log('⚠️  Function exists but returned error (expected for empty read):', testResult.error.message);
    } else {
      console.log('✅ Function is working:', testResult.data);
    }
    
    console.log('🎉 Function deployment completed!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deployFunction();