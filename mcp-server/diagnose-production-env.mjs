#!/usr/bin/env node

/**
 * Production Environment Diagnostic
 * Compares local vs production environment differences
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function diagnoseProductionEnvironment() {
  console.log('🔍 HERA v2.2 Production Environment Diagnostic');
  console.log('===============================================');
  console.log();

  // 1. Check local environment variables
  console.log('1️⃣ Local Environment Variables:');
  console.log(`   SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...`);
  console.log(`   SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30)}...`);
  console.log(`   SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log();

  // 2. Test production debug endpoints
  console.log('2️⃣ Testing Production Debug Endpoints:');
  
  const endpoints = [
    'https://heraerp.com/api/v2/debug-simple',
    'https://heraerp.com/api/v2/debug/session',
    'https://heraerp.com/api/v2/_debug/session'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`   Testing: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'User-Agent': 'HERA-Diagnostic/1.0'
        }
      });
      
      const status = response.status;
      const contentType = response.headers.get('content-type');
      
      if (status === 200) {
        const data = await response.json();
        console.log(`   ✅ ${endpoint}: ${status} - ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        const text = await response.text();
        console.log(`   ❌ ${endpoint}: ${status} - ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   💥 ${endpoint}: ${error.message}`);
    }
  }
  console.log();

  // 3. Test local Supabase connection
  console.log('3️⃣ Local Supabase Connection Test:');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test basic connection
    const { data: orgs, error } = await supabase
      .from('core_organizations')
      .select('id, organization_name')
      .limit(1);

    if (error) {
      console.log('   ❌ Local Supabase connection failed:', error.message);
    } else {
      console.log('   ✅ Local Supabase connection working');
      console.log(`   📋 Sample org: ${orgs?.[0]?.organization_name || 'None found'}`);
    }

    // Test Michele's user entity
    const { data: michele, error: micheleError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .eq('smart_code', 'HERA.PLATFORM.USER.ENTITY.3CED4979-4C09-4E1E-8667-6707CFE6EC77.V1')
      .single();

    if (micheleError) {
      console.log('   ❌ Michele user entity check failed:', micheleError.message);
    } else {
      console.log('   ✅ Michele user entity found:', michele.entity_name);
    }

  } catch (error) {
    console.log('   💥 Local Supabase test failed:', error.message);
  }
  console.log();

  // 4. Check potential production differences
  console.log('4️⃣ Production Environment Differences:');
  console.log('   🔍 Common issues to check:');
  console.log('      • Environment variables missing in production');
  console.log('      • Different Supabase project in production');
  console.log('      • Cookie domain settings (.heraerp.com vs localhost)');
  console.log('      • SSL/HTTPS certificate issues');
  console.log('      • Serverless function cold starts');
  console.log('      • Production RLS policies too restrictive');
  console.log('      • Missing production data (user entities, memberships)');
  console.log();

  // 5. Generate production test script
  console.log('5️⃣ Production Test Commands:');
  console.log('   Run these in production browser console:');
  console.log('   ```javascript');
  console.log('   // Test session endpoint');
  console.log('   await fetch("/api/v2/debug/session", {credentials:"include"}).then(r=>r.json()).then(console.log)');
  console.log('   ');
  console.log('   // Check cookies');
  console.log('   console.log("Cookies:", document.cookie);');
  console.log('   ');
  console.log('   // Check localStorage');
  console.log('   console.log("Auth storage:", localStorage.getItem("hera-supabase-auth"));');
  console.log('   ```');
  console.log();

  // 6. Recommendations
  console.log('6️⃣ Diagnostic Recommendations:');
  console.log('   🎯 Next steps to resolve production issue:');
  console.log('      1. Test production /api/v2/debug/session endpoint');
  console.log('      2. Check if Michele user entity exists in production DB');
  console.log('      3. Verify production environment variables match local');
  console.log('      4. Check production cookie settings and domain');
  console.log('      5. Verify production Supabase project configuration');
  console.log();
}

await diagnoseProductionEnvironment();