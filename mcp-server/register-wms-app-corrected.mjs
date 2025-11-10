#!/usr/bin/env node
/**
 * Register Waste Management System (WMS) App
 * CORRECTED: Using direct entity creation (APP entity in PLATFORM org)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const testData = {
  actor_user_id: "09b0b92a-d797-489e-bc03-5ca0a6272674", // Michele Hair
  platform_org_id: "00000000-0000-0000-0000-000000000000" // PLATFORM organization
};

async function registerWMSApp() {
  console.log('📱 Registering Waste Management System App...');
  console.log('👤 Actor User ID:', testData.actor_user_id);
  console.log('🏢 Platform Org ID:', testData.platform_org_id);
  console.log('');

  try {
    // Step 1: Check if WMS app already exists
    console.log('🔍 Step 1: Checking if WMS app already exists...');

    const { data: existingApps, error: checkError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', testData.platform_org_id)
      .eq('entity_type', 'APP')
      .eq('entity_code', 'WMS');

    if (checkError) {
      console.log('⚠️ Check failed:', checkError.message);
    } else if (existingApps && existingApps.length > 0) {
      console.log('⚠️ WMS app already exists!');
      console.log('   ID:', existingApps[0].id);
      console.log('   Name:', existingApps[0].entity_name);
      console.log('   Status:', existingApps[0].status);
      console.log('');
      console.log('💡 Updating existing app instead of creating new one...');

      // Update existing app
      const { data: updateData, error: updateError } = await supabase
        .from('core_entities')
        .update({
          entity_name: 'HERA Waste Management System',
          status: 'active',
          smart_code: 'HERA.PLATFORM.APP.ENTITY.WMS.v1',
          business_rules: {
            theme: 'sustainability',
            route_path: '/wms',
            icon: 'recycle',
            category: 'vertical_erp',
            industry: 'waste_management'
          },
          metadata: {
            version: '1.0',
            description: 'Complete waste management solution with route optimization, fleet tracking, customer portal, and environmental compliance reporting',
            features: {
              route_optimization: true,
              fleet_tracking: true,
              customer_portal: true,
              environmental_reporting: true,
              mobile_app: true,
              billing_automation: true
            },
            modules: [
              { code: 'ROUTES', name: 'Route Management', icon: 'map' },
              { code: 'FLEET', name: 'Fleet Management', icon: 'truck' },
              { code: 'CUSTOMERS', name: 'Customer Management', icon: 'users' },
              { code: 'SCHEDULING', name: 'Schedule Management', icon: 'calendar' },
              { code: 'BILLING', name: 'Billing & Invoicing', icon: 'dollar-sign' },
              { code: 'REPORTS', name: 'Reporting & Analytics', icon: 'bar-chart' },
              { code: 'INVENTORY', name: 'Bin Inventory', icon: 'archive' },
              { code: 'COMPLIANCE', name: 'Compliance Management', icon: 'shield' }
            ],
            service_types: [
              { code: 'RESIDENTIAL', name: 'Residential Collection', color: '#3b82f6' },
              { code: 'COMMERCIAL', name: 'Commercial Collection', color: '#8b5cf6' },
              { code: 'RECYCLING', name: 'Recycling Services', color: '#10b981' },
              { code: 'ORGANIC', name: 'Organic Waste', color: '#84cc16' },
              { code: 'HAZARDOUS', name: 'Hazardous Materials', color: '#ef4444' },
              { code: 'BULK', name: 'Bulk Item Pickup', color: '#f59e0b' }
            ],
            pricing: {
              model: 'subscription',
              plans: [
                { code: 'STARTER', name: 'Starter', price: 199.00, currency: 'USD', billing_cycle: 'monthly' },
                { code: 'PROFESSIONAL', name: 'Professional', price: 499.00, currency: 'USD', billing_cycle: 'monthly' },
                { code: 'ENTERPRISE', name: 'Enterprise', price: 1299.00, currency: 'USD', billing_cycle: 'monthly' }
              ]
            }
          },
          updated_by: testData.actor_user_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingApps[0].id)
        .select();

      if (updateError) {
        throw new Error('Update failed: ' + updateError.message);
      }

      console.log('✅ WMS App Updated Successfully!');
      console.log('   App ID:', existingApps[0].id);

      return {
        success: true,
        app_id: existingApps[0].id,
        mode: 'UPDATE'
      };
    }

    // Step 2: Create new APP entity in PLATFORM organization
    console.log('🚀 Step 2: Creating WMS app entity in PLATFORM organization...');

    const { data: insertData, error: insertError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: testData.platform_org_id,
        entity_type: 'APP',
        entity_code: 'WMS',
        entity_name: 'HERA Waste Management System',
        smart_code: 'HERA.PLATFORM.APP.ENTITY.WMS.v1',
        status: 'active',
        business_rules: {
          theme: 'sustainability',
          route_path: '/wms',
          icon: 'recycle',
          category: 'vertical_erp',
          industry: 'waste_management',
          colors: {
            primary: '#10b981',
            secondary: '#14b8a6',
            accent: '#06b6d4'
          }
        },
        metadata: {
          version: '1.0',
          description: 'Complete waste management solution with route optimization, fleet tracking, customer portal, and environmental compliance reporting',
          features: {
            route_optimization: true,
            fleet_tracking: true,
            customer_portal: true,
            environmental_reporting: true,
            mobile_app: true,
            billing_automation: true
          },
          modules: [
            { code: 'ROUTES', name: 'Route Management', description: 'Create and optimize collection routes', icon: 'map' },
            { code: 'FLEET', name: 'Fleet Management', description: 'Track and manage collection vehicles', icon: 'truck' },
            { code: 'CUSTOMERS', name: 'Customer Management', description: 'Manage service agreements', icon: 'users' },
            { code: 'SCHEDULING', name: 'Schedule Management', description: 'Schedule pickups', icon: 'calendar' },
            { code: 'BILLING', name: 'Billing & Invoicing', description: 'Automated billing', icon: 'dollar-sign' },
            { code: 'REPORTS', name: 'Reporting & Analytics', description: 'Environmental reports', icon: 'bar-chart' },
            { code: 'INVENTORY', name: 'Bin Inventory', description: 'Track bins', icon: 'archive' },
            { code: 'COMPLIANCE', name: 'Compliance Management', description: 'Environmental compliance', icon: 'shield' }
          ],
          default_permissions: {
            owner: ['all'],
            admin: ['read', 'write', 'delete', 'manage_users'],
            manager: ['read', 'write', 'manage_routes', 'manage_fleet'],
            dispatcher: ['read', 'write', 'assign_routes', 'track_vehicles'],
            driver: ['read', 'update_status', 'complete_pickups'],
            customer_service: ['read', 'write', 'customer_portal'],
            accountant: ['read', 'billing', 'reports'],
            member: ['read']
          },
          service_types: [
            { code: 'RESIDENTIAL', name: 'Residential Collection', icon: 'home', color: '#3b82f6' },
            { code: 'COMMERCIAL', name: 'Commercial Collection', icon: 'building', color: '#8b5cf6' },
            { code: 'RECYCLING', name: 'Recycling Services', icon: 'recycle', color: '#10b981' },
            { code: 'ORGANIC', name: 'Organic Waste', icon: 'leaf', color: '#84cc16' },
            { code: 'HAZARDOUS', name: 'Hazardous Materials', icon: 'alert-triangle', color: '#ef4444' },
            { code: 'BULK', name: 'Bulk Item Pickup', icon: 'package', color: '#f59e0b' }
          ],
          pricing: {
            model: 'subscription',
            plans: [
              {
                code: 'STARTER',
                name: 'Starter',
                price: 199.00,
                currency: 'USD',
                billing_cycle: 'monthly',
                limits: { routes: 10, vehicles: 5, customers: 500, users: 3 }
              },
              {
                code: 'PROFESSIONAL',
                name: 'Professional',
                price: 499.00,
                currency: 'USD',
                billing_cycle: 'monthly',
                limits: { routes: 50, vehicles: 25, customers: 5000, users: 10 }
              },
              {
                code: 'ENTERPRISE',
                name: 'Enterprise',
                price: 1299.00,
                currency: 'USD',
                billing_cycle: 'monthly',
                limits: { routes: 'unlimited', vehicles: 'unlimited', customers: 'unlimited', users: 'unlimited' }
              }
            ]
          }
        },
        created_by: testData.actor_user_id,
        updated_by: testData.actor_user_id
      })
      .select();

    if (insertError) {
      console.log('❌ App Registration FAILED:', insertError);
      throw new Error(insertError.message);
    }

    const appId = insertData[0].id;

    console.log('✅ WMS App Registered Successfully!');
    console.log('');
    console.log('📝 App Details:');
    console.log('   App ID:', appId);
    console.log('   App Code: WMS');
    console.log('   App Name: HERA Waste Management System');
    console.log('   Smart Code: HERA.PLATFORM.APP.ENTITY.WMS.v1');
    console.log('   Version: 1.0');
    console.log('   Status: active');
    console.log('   Route Path: /wms');
    console.log('');

    // Step 3: Verify using hera_apps_get_v1
    console.log('🔍 Step 3: Verifying app registration with hera_apps_get_v1...');

    const { data: verifyData, error: verifyError } = await supabase.rpc('hera_apps_get_v1', {
      p_actor_user_id: testData.actor_user_id,
      p_selector: { code: 'WMS' }
    });

    if (verifyError) {
      console.log('⚠️ Verification failed:', verifyError.message);
    } else {
      console.log('✅ App Verification Successful!');
      const app = verifyData.app;
      console.log('   ID:', app.id);
      console.log('   Name:', app.name);
      console.log('   Code:', app.code);
      console.log('   Smart Code:', app.smart_code);
      console.log('   Status:', app.status);
    }

    // Step 4: List all apps
    console.log('');
    console.log('📊 Step 4: Listing all registered apps...');

    const { data: allApps, error: listError } = await supabase
      .from('core_entities')
      .select('id, entity_code, entity_name, status, created_at')
      .eq('organization_id', testData.platform_org_id)
      .eq('entity_type', 'APP')
      .order('entity_code');

    if (!listError && allApps) {
      console.log(`✅ Found ${allApps.length} registered apps:`);
      console.log('');
      allApps.forEach((app, index) => {
        const isWMS = app.entity_code === 'WMS';
        const marker = isWMS ? '🆕' : '   ';
        console.log(`${marker} ${index + 1}. ${app.entity_name} (${app.entity_code})`);
        console.log(`      ID: ${app.id}`);
        console.log(`      Status: ${app.status}`);
        if (isWMS) {
          console.log(`      👉 NEW: Just registered!`);
        }
      });
    }

    // Summary
    console.log('');
    console.log('═'.repeat(60));
    console.log('🎉 WMS APP REGISTRATION COMPLETE!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ App ID:', appId);
    console.log('   ✅ App Code: WMS');
    console.log('   ✅ App Name: HERA Waste Management System');
    console.log('   ✅ Route Path: /wms');
    console.log('   ✅ Smart Code: HERA.PLATFORM.APP.ENTITY.WMS.v1');
    console.log('   ✅ Version: 1.0');
    console.log('   ✅ Status: active');
    console.log('   ✅ Modules: 8 (Routes, Fleet, Customers, Scheduling, Billing, Reports, Inventory, Compliance)');
    console.log('   ✅ Pricing Plans: 3 (Starter $199, Professional $499, Enterprise $1299)');
    console.log('   ✅ Service Types: 6 (Residential, Commercial, Recycling, Organic, Hazardous, Bulk)');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Link WMS app to HERA Waste Management Demo org');
    console.log('      Command: node link-wms-to-org.mjs');
    console.log('   2. Configure app settings for the organization');
    console.log('   3. Onboard users with appropriate roles');
    console.log('   4. Create initial routes and service areas');

    return {
      success: true,
      app_id: appId,
      app_code: 'WMS',
      mode: 'CREATE'
    };

  } catch (error) {
    console.error('\n❌ App registration failed:', error.message);
    if (error.details) {
      console.error('📋 Error details:', error.details);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

// Run
console.log('🚀 HERA Waste Management System - App Registration');
console.log('═'.repeat(60));
console.log('');
registerWMSApp()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Registration completed successfully!');
      console.log(`   Mode: ${result.mode}`);
      console.log(`   App ID: ${result.app_id}`);
      process.exit(0);
    } else {
      console.log('\n❌ Registration failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
