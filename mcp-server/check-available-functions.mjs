#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFunctions() {
  console.log('🔍 Checking available RPC functions...\n');
  
  try {
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .like('proname', '%hera%')
      .order('proname');
    
    if (error) {
      console.log('❌ Error:', error);
      return;
    }
    
    console.log('📋 Available HERA functions:');
    data.forEach(func => {
      console.log(`   • ${func.proname}`);
    });
    
  } catch (error) {
    console.error('💥 Exception:', error.message);
  }
}

checkFunctions();