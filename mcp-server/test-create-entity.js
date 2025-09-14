#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreate() {
  // Try with a simpler approach - no smart code first
  console.log('Testing entity creation...\n');
  
  const testEntity = {
    organization_id: 'a1b2c3d4-5678-90ab-cdef-000000000001',
    entity_type: 'isp_metrics',
    entity_name: 'Kerala Vision Dashboard',
    entity_code: 'KV-DASHBOARD-001'
  };
  
  console.log('Creating WITHOUT smart_code first...');
  const { data: entity1, error: error1 } = await supabase
    .from('core_entities')
    .insert(testEntity)
    .select();
    
  if (error1) {
    console.log('Error:', error1.message);
  } else {
    console.log('Success! Entity created:', entity1[0].id);
  }
  
  // Now try with smart code
  console.log('\nCreating WITH smart_code...');
  const { data: entity2, error: error2 } = await supabase
    .from('core_entities')
    .insert({
      ...testEntity,
      entity_code: 'KV-DASHBOARD-002',
      smart_code: 'HERA.ISP.METRICS.DASHBOARD.REALTIME.v1'
    })
    .select();
    
  if (error2) {
    console.log('Error:', error2.message);
    console.log('Details:', error2);
  } else {
    console.log('Success! Entity created:', entity2[0].id);
  }
}

testCreate();