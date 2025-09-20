#!/usr/bin/env node

/**
 * Clean up failed salon data before re-running
 */

require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function cleanup() {
  console.log('🧹 Cleaning up failed salon data...');

  // Delete services that failed
  const serviceCodes = ['SVC-001', 'SVC-002', 'SVC-003', 'SVC-004', 'SVC-005', 'SVC-006'];
  for (const code of serviceCodes) {
    await supabase.from('core_entities')
      .delete()
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_code', code);
  }

  // Delete statuses that failed
  const statusCodes = ['STATUS-BOOKED', 'STATUS-CHECKED-IN', 'STATUS-IN-PROGRESS', 'STATUS-COMPLETED', 'STATUS-CANCELLED', 'STATUS-NO-SHOW'];
  for (const code of statusCodes) {
    await supabase.from('core_entities')
      .delete()
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_code', code);
  }

  console.log('✅ Cleanup complete');
}

cleanup();