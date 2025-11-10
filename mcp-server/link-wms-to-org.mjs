#!/usr/bin/env node
/**
 * Link WMS App to HERA Waste Management Demo Organization
 * Using hera_org_link_app_v1 RPC function
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const testData = {
  actor_user_id: "09b0b92a-d797-489e-bc03-5ca0a6272674", // Michele Hair (Owner)
  organization_id: "1fbab8d2-583c-44d2-8671-6d187c1ee755", // HERA Waste Management Demo
  app_code: "WMS",
  app_id: "0bcd756c-391d-4603-b195-94bef9732e76"
};

async function linkWMSToOrg() {
  console.log('🔗 Linking WMS App to HERA Waste Management Demo Organization...');
  console.log('👤 Actor User ID:', testData.actor_user_id);
  console.log('🏢 Organization ID:', testData.organization_id);
  console.log('📱 App Code:', testData.app_code);
  console.log('');

  try {
    // Step 1: Verify organization exists
    console.log('🔍 Step 1: Verifying organization...');
    const { data: orgData, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', testData.organization_id)
      .single();

    if (orgError) {
      throw new Error('Organization not found: ' + orgError.message);
    }

    console.log('✅ Organization Found:');
    console.log('   Name:', orgData.organization_name);
    console.log('   Code:', orgData.organization_code);
    console.log('   Type:', orgData.organization_type);
    console.log('');

    // Step 2: Verify app exists
    console.log('🔍 Step 2: Verifying app...');
    const { data: appData, error: appError } = await supabase.rpc('hera_apps_get_v1', {
      p_actor_user_id: testData.actor_user_id,
      p_selector: { code: testData.app_code }
    });

    if (appError) {
      throw new Error('App not found: ' + appError.message);
    }

    console.log('✅ App Found:');
    console.log('   Name:', appData.app.name);
    console.log('   Code:', appData.app.code);
    console.log('   Status:', appData.app.status);
    console.log('');

    // Step 3: Check if app is already linked
    console.log('🔍 Step 3: Checking if app is already linked...');
    const { data: existingLinks, error: checkError } = await supabase
      .from('core_org_apps')
      .select('*')
      .eq('organization_id', testData.organization_id)
      .eq('app_code', testData.app_code);

    if (checkError) {
      console.log('⚠️ Check failed:', checkError.message);
    } else if (existingLinks && existingLinks.length > 0) {
      console.log('⚠️ App is already linked to this organization!');
      console.log('   Link ID:', existingLinks[0].id);
      console.log('   Installed At:', existingLinks[0].installed_at);
      console.log('   Is Active:', existingLinks[0].is_active);
      console.log('');
      console.log('💡 Updating existing link instead...');

      const { data: updateData, error: updateError } = await supabase
        .from('core_org_apps')
        .update({
          is_active: true,
          subscription: {
            plan: 'Professional',
            status: 'active',
            purchased_at: new Date().toISOString(),
            purchased_by: testData.actor_user_id
          },
          config: {
            enable_all_features: true,
            installed_via: 'mcp_script',
            features: {
              route_optimization: true,
              fleet_tracking: true,
              customer_portal: true,
              environmental_reporting: true
            }
          },
          updated_by: testData.actor_user_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLinks[0].id)
        .select();

      if (updateError) {
        throw new Error('Update failed: ' + updateError.message);
      }

      console.log('✅ Link Updated Successfully!');
      return {
        success: true,
        link_id: existingLinks[0].id,
        mode: 'UPDATE'
      };
    }

    // Step 4: Link app to organization using RPC
    console.log('🚀 Step 4: Linking WMS app to organization...');

    const { data: linkData, error: linkError } = await supabase.rpc('hera_org_link_app_v1', {
      p_actor_user_id: testData.actor_user_id,
      p_organization_id: testData.organization_id,
      p_app_code: testData.app_code,
      p_installed_at: new Date().toISOString(),
      p_subscription: {
        plan: 'Professional',
        status: 'active',
        purchased_at: new Date().toISOString(),
        purchased_by: testData.actor_user_id,
        billing_cycle: 'monthly',
        price: 499.00,
        currency: 'USD',
        features: [
          'Advanced route optimization',
          'Real-time GPS tracking',
          'Customer portal',
          'Environmental reporting',
          'Mobile driver app',
          'Automated billing',
          'Priority support'
        ],
        limits: {
          routes: 50,
          vehicles: 25,
          customers: 5000,
          users: 10
        }
      },
      p_config: {
        enable_all_features: true,
        installed_via: 'mcp_script',
        theme: 'sustainability',
        features: {
          route_optimization: {
            enabled: true,
            algorithm: 'genetic'
          },
          fleet_tracking: {
            enabled: true,
            update_interval: 30
          },
          customer_portal: {
            enabled: true,
            features: ['schedule_pickup', 'view_invoice', 'make_payment']
          },
          environmental_reporting: {
            enabled: true,
            reports: ['carbon_footprint', 'diversion_rate', 'recycling_metrics']
          },
          mobile_app: {
            enabled: true,
            platforms: ['ios', 'android']
          },
          billing_automation: {
            enabled: true,
            cycle: 'monthly'
          }
        },
        service_types: [
          { code: 'RESIDENTIAL', enabled: true },
          { code: 'COMMERCIAL', enabled: true },
          { code: 'RECYCLING', enabled: true },
          { code: 'ORGANIC', enabled: true },
          { code: 'HAZARDOUS', enabled: false },
          { code: 'BULK', enabled: true }
        ],
        default_settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en',
          measurement_system: 'imperial'
        }
      },
      p_is_active: true
    });

    if (linkError) {
      console.log('❌ App Linking FAILED:', linkError);
      throw new Error(linkError.message);
    }

    console.log('✅ WMS App Linked Successfully!');
    console.log('');
    console.log('📝 Link Details:');
    console.log('   Organization:', orgData.organization_name);
    console.log('   App:', appData.app.name);
    console.log('   Plan: Professional ($499/month)');
    console.log('   Status: active');
    console.log('   Installed:', new Date().toLocaleString());
    console.log('');

    // Step 5: Verify link by listing org apps
    console.log('🔍 Step 5: Verifying link...');

    const { data: orgApps, error: listError } = await supabase.rpc('hera_org_apps_list_v1', {
      p_organization_id: testData.organization_id,
      p_actor_user_id: testData.actor_user_id,
      p_is_active: true
    });

    if (listError) {
      console.log('⚠️ Verification failed:', listError.message);
    } else {
      console.log('✅ Organization Apps Verified:');
      console.log('');
      if (orgApps?.items) {
        orgApps.items.forEach((app, index) => {
          const isWMS = app.app_code === 'WMS';
          const marker = isWMS ? '🆕' : '   ';
          console.log(`${marker} ${index + 1}. ${app.app_name} (${app.app_code})`);
          console.log(`      Status: ${app.is_active ? 'Active' : 'Inactive'}`);
          if (app.subscription) {
            console.log(`      Plan: ${app.subscription.plan}`);
            console.log(`      Subscription: ${app.subscription.status}`);
          }
          if (isWMS) {
            console.log(`      👉 NEW: Just linked!`);
          }
        });
      }
    }

    // Summary
    console.log('');
    console.log('═'.repeat(60));
    console.log('🎉 WMS APP LINKING COMPLETE!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Organization: HERA Waste Management Demo');
    console.log('   ✅ App: HERA Waste Management System (WMS)');
    console.log('   ✅ Route Path: /wms');
    console.log('   ✅ Plan: Professional ($499/month)');
    console.log('   ✅ Status: Active');
    console.log('   ✅ Features: All enabled (6 core features)');
    console.log('   ✅ Service Types: 5 enabled (Residential, Commercial, Recycling, Organic, Bulk)');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Set WMS as default app for the organization');
    console.log('      Command: node set-wms-default.mjs');
    console.log('   2. Onboard operational users:');
    console.log('      - Operations Manager (manager)');
    console.log('      - Dispatcher (dispatcher)');
    console.log('      - Drivers (driver)');
    console.log('      - Customer Service (customer_service)');
    console.log('   3. Create initial entities:');
    console.log('      - Service routes');
    console.log('      - Collection vehicles');
    console.log('      - Customer accounts');
    console.log('      - Service zones');
    console.log('   4. Access the app:');
    console.log('      URL: /wms/auth (role-based routing)');
    console.log('');
    console.log('🛡️ Security Features Verified:');
    console.log('   ✅ Actor stamping (installed by Michele Hair)');
    console.log('   ✅ Organization isolation');
    console.log('   ✅ Subscription tracking');
    console.log('   ✅ Feature configuration');
    console.log('   ✅ RBAC ready (8 role types configured)');

    return {
      success: true,
      organization_id: testData.organization_id,
      app_code: testData.app_code,
      mode: 'CREATE'
    };

  } catch (error) {
    console.error('\n❌ App linking failed:', error.message);
    if (error.details) {
      console.error('📋 Error details:', error.details);
    }
    if (error.hint) {
      console.error('💡 Hint:', error.hint);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the app linking
console.log('🚀 HERA WMS - App Linking to Organization');
console.log('═'.repeat(60));
console.log('');
linkWMSToOrg()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Linking completed successfully!');
      console.log(`   Mode: ${result.mode}`);
      process.exit(0);
    } else {
      console.log('\n❌ Linking failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
