#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use the NEXT_PUBLIC_ prefixed variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('🔍 Checking actual database columns...\n');
  
  // Check core_organizations columns
  const { data: orgData, error: orgError } = await supabase
    .from('core_organizations')
    .select('*')
    .limit(1);
    
  if (!orgError && orgData) {
    console.log('✅ core_organizations columns:', Object.keys(orgData[0] || {}).join(', ') || 'No data');
  }
  
  // Check universal_transactions columns
  const { data: txnData, error: txnError } = await supabase
    .from('universal_transactions')
    .select('*')
    .limit(1);
    
  if (!txnError && txnData) {
    console.log('✅ universal_transactions columns:', Object.keys(txnData[0] || {}).join(', ') || 'No data');
  }
}

checkColumns().catch(console.error);