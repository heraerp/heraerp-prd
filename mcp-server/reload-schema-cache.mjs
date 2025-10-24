#!/usr/bin/env node
/**
 * Reload PostgREST schema cache for Supabase
 */

import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function reloadSchemaCache() {
  console.log('🔄 Attempting to reload PostgREST schema cache...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  // PostgREST schema cache reload endpoint
  const reloadUrl = `${supabaseUrl}/rest/v1/`;

  try {
    // Try sending a NOTIFY command to reload schema
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/pgrst_watch`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({})
    });

    if (response.ok) {
      console.log('✅ Schema cache reload triggered successfully!');
      const data = await response.text();
      console.log('Response:', data);
    } else {
      console.log('⚠️  Method 1 failed, trying alternative...');
      console.log('Status:', response.status, response.statusText);

      // Alternative: Send SIGHUP signal via SQL
      console.log('\n🔄 Attempting alternative method via NOTIFY...\n');

      const notifyResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/pg_notify`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: 'pgrst',
          payload: 'reload schema'
        })
      });

      if (notifyResponse.ok) {
        console.log('✅ Alternative method succeeded!');
      } else {
        console.log('❌ Alternative method also failed');
        console.log('Status:', notifyResponse.status, notifyResponse.statusText);
      }
    }
  } catch (error) {
    console.error('❌ Error reloading schema cache:', error.message);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('ℹ️  Note: If automatic reload failed, please manually reload');
  console.log('   the schema cache in Supabase Dashboard:');
  console.log('   Settings → API → Reload Schema');
  console.log('═══════════════════════════════════════════════════════\n');

  // Wait a moment for cache to clear
  console.log('⏳ Waiting 3 seconds for cache to clear...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Now test if function is available
  console.log('🧪 Testing if hera_onboard_user_v1 is now available...\n');

  const testResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/hera_onboard_user_v1`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_supabase_user_id: '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a',
      p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
    })
  });

  console.log('Test Response Status:', testResponse.status, testResponse.statusText);

  if (testResponse.ok) {
    const result = await testResponse.json();
    console.log('✅ Function is now available!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } else {
    const errorText = await testResponse.text();
    console.log('❌ Function still not available');
    console.log('Error:', errorText);
  }
}

reloadSchemaCache().catch(console.error);
