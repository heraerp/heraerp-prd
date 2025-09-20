#\!/usr/bin/env node

require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function cleanupSalonData() {
  console.log('🧹 Cleaning up previous salon data...');

  try {
    // Clean up in reverse order of dependencies
    console.log('Cleaning transaction lines...');
    await supabase
      .from('universal_transaction_lines')
      .delete()
      .eq('organization_id', ORGANIZATION_ID)
      .like('smart_code', 'HERA.SALON.%');

    console.log('Cleaning transactions...');
    await supabase
      .from('universal_transactions')
      .delete()
      .eq('organization_id', ORGANIZATION_ID)
      .like('smart_code', 'HERA.SALON.%');

    console.log('Cleaning dynamic data...');
    await supabase
      .from('core_dynamic_data')
      .delete()
      .eq('organization_id', ORGANIZATION_ID)
      .like('smart_code', 'HERA.SALON.%');

    console.log('Cleaning relationships...');
    await supabase
      .from('core_relationships')
      .delete()
      .eq('organization_id', ORGANIZATION_ID)
      .like('smart_code', 'HERA.SALON.%');

    console.log('Cleaning entities...');
    await supabase
      .from('core_entities')
      .delete()
      .eq('organization_id', ORGANIZATION_ID)
      .like('smart_code', 'HERA.SALON.%');

    console.log('✅ Cleanup complete\!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupSalonData();
