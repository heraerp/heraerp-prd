#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSmartCodes() {
  // Get some existing smart codes
  const { data: entities, error } = await supabase
    .from('core_entities')
    .select('smart_code')
    .not('smart_code', 'is', null)
    .limit(10);

  if (entities) {
    console.log('Existing smart codes:');
    entities.forEach(e => console.log(`  ${e.smart_code}`));
  }

  // Test different smart code formats
  const testCodes = [
    'HERA.ISP.METRICS.DASHBOARD.REALTIME.v1',
    'HERA.ISP.CUSTOMER.SUBSCRIBER.BASE.v1',
    'HERA.ISP.REVENUE.MONTHLY.REPORT.v1',
    'HERA.ISP.NETWORK.PERFORMANCE.METRICS.v1',
    'HERA.ISP.BILLING.INVOICE.CUSTOMER.v1'
  ];
  
  const regex = /^HERA\.[A-Z0-9]{3,15}(\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;
  
  console.log('\nTesting smart codes:');
  testCodes.forEach(code => {
    const segments = code.split('.');
    const middleSegments = segments.slice(1, -1); // Remove HERA and v1
    console.log(`\n${code}`);
    console.log(`  Matches: ${regex.test(code)}`);
    console.log(`  Total segments: ${segments.length}`);
    console.log(`  Middle segments: ${middleSegments.length} (need 4-9)`);
    console.log(`  Pattern check: Industry="${middleSegments[0]}" (${middleSegments[0].length} chars)`);
  });
}

checkSmartCodes();