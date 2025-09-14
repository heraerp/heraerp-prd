#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLineColumns() {
  // Check universal_transaction_lines columns
  const { data: lineData, error: lineError } = await supabase
    .from('universal_transaction_lines')
    .select('*')
    .limit(1);
    
  if (!lineError && lineData) {
    console.log('✅ universal_transaction_lines columns:', Object.keys(lineData[0] || {}).join(', ') || 'No data found');
  } else if (lineError) {
    console.log('❌ Error:', lineError);
  }
}

checkLineColumns();