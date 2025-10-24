#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking core_relationships schema...');
  
  const { data, error } = await supabase
    .from('core_relationships')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('❌ Error:', error.message);
    
    // Try to get more info
    console.log('\n🔍 Checking available tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%relationship%');
      
    if (tables) {
      console.log('📋 Found relationship tables:', tables.map(t => t.table_name));
    }
  } else {
    console.log('✅ core_relationships table accessible');
    if (data && data.length > 0) {
      console.log('📋 Available columns:', Object.keys(data[0]));
    }
  }
}

await checkSchema();