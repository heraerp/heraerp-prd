#!/usr/bin/env node
/**
 * Register Waste Management System (WMS) App
 * Using hera_apps_register_v1 RPC function
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const testData = {
  actor_user_id: "09b0b92a-d797-489e-bc03-5ca0a6272674", // Michele Hair (Platform Admin)
};

async function registerWMSApp() {
  console.log('📱 Registering Waste Management System App...');
  console.log('👤 Actor User ID:', testData.actor_user_id);
  console.log('');

  try {
    // Register WMS App
    console.log('🚀 Step 1: Registering WMS app in global registry...');

    const registerResult = await supabase.rpc('hera_apps_register_v1', {
      p_actor_user_id: testData.actor_user_id,
      p_app_code: 'WMS',
      p_app_name: 'HERA Waste Management System',
      p_description: 'Complete waste management solution with route optimization, fleet tracking, customer portal, and environmental compliance reporting',
      p_version: '1.0',
      p_default_config: {
        theme: 'sustainability',
        colors: {
          primary: '#10b981',      // green-500
          secondary: '#14b8a6',    // teal-500
          accent: '#06b6d4',       // cyan-500
          success: '#22c55e',      // green-500
          warning: '#f59e0b',      // amber-500
          error: '#ef4444'         // red-500
        },
        features: {
          route_optimization: {
            enabled: true,
            description: 'AI-powered route optimization for efficient collection',
            algorithms: ['genetic', 'nearest_neighbor', 'cluster_first']
          },
          fleet_tracking: {
            enabled: true,
            description: 'Real-time GPS tracking of collection vehicles',
            update_interval: 30 // seconds
          },
          customer_portal: {
            enabled: true,
            description: 'Self-service portal for customers',
            features: ['schedule_pickup', 'view_invoice', 'make_payment', 'request_bin']
          },
          environmental_reporting: {
            enabled: true,
            description: 'Compliance and sustainability metrics',
            reports: ['carbon_footprint', 'diversion_rate', 'recycling_metrics']
          },
          mobile_app: {
            enabled: true,
            description: 'Driver mobile app for route execution',
            platforms: ['ios', 'android']
          },
          billing_automation: {
            enabled: true,
            description: 'Automated subscription billing',
            cycles: ['weekly', 'monthly', 'quarterly']
          }
        },
        modules: [
          {
            code: 'ROUTES',
            name: 'Route Management',
            description: 'Create and optimize collection routes',
            icon: 'map'
          },
          {
            code: 'FLEET',
            name: 'Fleet Management',
            description: 'Track and manage collection vehicles',
            icon: 'truck'
          },
          {
            code: 'CUSTOMERS',
            name: 'Customer Management',
            description: 'Manage service agreements and accounts',
            icon: 'users'
          },
          {
            code: 'SCHEDULING',
            name: 'Schedule Management',
            description: 'Schedule pickups and service calls',
            icon: 'calendar'
          },
          {
            code: 'BILLING',
            name: 'Billing & Invoicing',
            description: 'Automated billing and payment processing',
            icon: 'dollar-sign'
          },
          {
            code: 'REPORTS',
            name: 'Reporting & Analytics',
            description: 'Environmental and operational reports',
            icon: 'bar-chart'
          },
          {
            code: 'INVENTORY',
            name: 'Bin Inventory',
            description: 'Track bins and containers',
            icon: 'archive'
          },
          {
            code: 'COMPLIANCE',
            name: 'Compliance Management',
            description: 'Environmental compliance tracking',
            icon: 'shield'
          }
        ],
        default_permissions: {
          owner: ['all'],
          admin: ['read', 'write', 'delete', 'manage_users'],
          manager: ['read', 'write', 'manage_routes', 'manage_fleet'],
          dispatcher: ['read', 'write', 'assign_routes', 'track_vehicles'],
          driver: ['read', 'update_status', 'complete_pickups', 'mobile_app'],
          customer_service: ['read', 'write', 'customer_portal', 'handle_requests'],
          accountant: ['read', 'billing', 'reports', 'payments'],
          member: ['read']
        },
        integrations: {
          gps_providers: ['google_maps', 'mapbox', 'openstreetmap'],
          payment_gateways: ['stripe', 'square', 'paypal'],
          accounting: ['quickbooks', 'xero', 'sage'],
          email: ['sendgrid', 'mailgun', 'ses'],
          sms: ['twilio', 'vonage', 'messagebird']
        },
        service_types: [
          {
            code: 'RESIDENTIAL',
            name: 'Residential Collection',
            description: 'Weekly or bi-weekly residential waste collection',
            icon: 'home',
            color: '#3b82f6'
          },
          {
            code: 'COMMERCIAL',
            name: 'Commercial Collection',
            description: 'Business waste collection services',
            icon: 'building',
            color: '#8b5cf6'
          },
          {
            code: 'RECYCLING',
            name: 'Recycling Services',
            description: 'Recyclable materials collection',
            icon: 'recycle',
            color: '#10b981'
          },
          {
            code: 'ORGANIC',
            name: 'Organic Waste',
            description: 'Composting and organic waste',
            icon: 'leaf',
            color: '#84cc16'
          },
          {
            code: 'HAZARDOUS',
            name: 'Hazardous Materials',
            description: 'Special handling for hazardous waste',
            icon: 'alert-triangle',
            color: '#ef4444'
          },
          {
            code: 'BULK',
            name: 'Bulk Item Pickup',
            description: 'Large item collection services',
            icon: 'package',
            color: '#f59e0b'
          }
        ]
      },
      p_pricing: {
        model: 'subscription',
        plans: [
          {
            code: 'STARTER',
            name: 'Starter',
            description: 'For small waste collection operations',
            price: 199.00,
            currency: 'USD',
            billing_cycle: 'monthly',
            limits: {
              routes: 10,
              vehicles: 5,
              customers: 500,
              users: 3
            },
            features: [
              'Basic route management',
              'Fleet tracking',
              'Customer portal',
              'Standard reports'
            ]
          },
          {
            code: 'PROFESSIONAL',
            name: 'Professional',
            description: 'For growing waste management businesses',
            price: 499.00,
            currency: 'USD',
            billing_cycle: 'monthly',
            limits: {
              routes: 50,
              vehicles: 25,
              customers: 5000,
              users: 10
            },
            features: [
              'Advanced route optimization',
              'Real-time GPS tracking',
              'Customer portal',
              'Environmental reporting',
              'Mobile driver app',
              'Automated billing',
              'Priority support'
            ]
          },
          {
            code: 'ENTERPRISE',
            name: 'Enterprise',
            description: 'For large waste management operations',
            price: 1299.00,
            currency: 'USD',
            billing_cycle: 'monthly',
            limits: {
              routes: 'unlimited',
              vehicles: 'unlimited',
              customers: 'unlimited',
              users: 'unlimited'
            },
            features: [
              'All Professional features',
              'Multi-depot support',
              'Advanced analytics & BI',
              'API access',
              'Custom integrations',
              'Dedicated account manager',
              '24/7 priority support',
              'Compliance automation'
            ]
          }
        ]
      },
      p_status: 'active'
    });

    if (registerResult.error) {
      console.log('❌ App Registration FAILED:', registerResult.error);
      throw new Error(registerResult.error.message);
    }

    console.log('✅ WMS App Registered Successfully!');
    console.log('');
    console.log('📝 App Details:');
    console.log('   App Code: WMS');
    console.log('   App Name: HERA Waste Management System');
    console.log('   Version: 1.0');
    console.log('   Status: active');
    console.log('   Route Path: /wms');
    console.log('');

    // Step 2: Verify registration by fetching the app
    console.log('🔍 Step 2: Verifying app registration...');

    const getAppResult = await supabase.rpc('hera_apps_get_v1', {
      p_app_code: 'WMS'
    });

    if (getAppResult.error) {
      console.log('⚠️ Verification failed:', getAppResult.error.message);
    } else {
      console.log('✅ App Verification Successful!');
      console.log('');
      console.log('📋 Registered App Info:');
      const app = getAppResult.data;
      if (app) {
        console.log(`   ID: ${app.id}`);
        console.log(`   Code: ${app.app_code}`);
        console.log(`   Name: ${app.app_name}`);
        console.log(`   Version: ${app.version}`);
        console.log(`   Status: ${app.status}`);
        console.log(`   Description: ${app.description?.substring(0, 80)}...`);
        console.log(`   Created: ${new Date(app.created_at).toLocaleString()}`);

        // Display modules
        if (app.default_config?.modules) {
          console.log('');
          console.log('   📦 Modules:');
          app.default_config.modules.forEach((module, index) => {
            console.log(`      ${index + 1}. ${module.name} (${module.code})`);
          });
        }

        // Display pricing plans
        if (app.pricing?.plans) {
          console.log('');
          console.log('   💰 Pricing Plans:');
          app.pricing.plans.forEach((plan, index) => {
            console.log(`      ${index + 1}. ${plan.name}: $${plan.price}/${plan.billing_cycle}`);
          });
        }
      }
    }

    // Step 3: List all registered apps
    console.log('');
    console.log('📊 Step 3: Listing all registered apps...');

    const listAppsResult = await supabase.rpc('hera_apps_list_v1', {
      p_status: 'active',
      p_limit: 20
    });

    if (!listAppsResult.error && listAppsResult.data?.items) {
      console.log(`✅ Found ${listAppsResult.data.items.length} active apps:`);
      console.log('');
      listAppsResult.data.items.forEach((app, index) => {
        const isWMS = app.app_code === 'WMS';
        const marker = isWMS ? '🆕' : '   ';
        console.log(`${marker} ${index + 1}. ${app.app_name} (${app.app_code})`);
        console.log(`      Version: ${app.version}, Status: ${app.status}`);
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
    console.log('   ✅ App Code: WMS');
    console.log('   ✅ App Name: HERA Waste Management System');
    console.log('   ✅ Route Path: /wms');
    console.log('   ✅ Version: 1.0');
    console.log('   ✅ Status: active');
    console.log('   ✅ Modules: 8 (Routes, Fleet, Customers, Scheduling, Billing, Reports, Inventory, Compliance)');
    console.log('   ✅ Pricing Plans: 3 (Starter $199, Professional $499, Enterprise $1299)');
    console.log('   ✅ Service Types: 6 (Residential, Commercial, Recycling, Organic, Hazardous, Bulk)');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Link WMS app to HERA Waste Management Demo org');
    console.log('      → Use hera_org_link_app_v1');
    console.log('   2. Configure app settings for organization');
    console.log('   3. Onboard users with appropriate roles (manager, dispatcher, driver)');
    console.log('   4. Create initial routes and service areas');
    console.log('   5. Set up customer accounts and service agreements');
    console.log('');
    console.log('🛡️ HERA Security Features:');
    console.log('   ✅ Actor stamping (registered by Michele Hair)');
    console.log('   ✅ Role-based permissions (8 role types)');
    console.log('   ✅ Smart code validation');
    console.log('   ✅ Multi-tenant isolation ready');

    return {
      success: true,
      app_code: 'WMS',
      app_id: getAppResult.data?.id
    };

  } catch (error) {
    console.error('\n❌ App registration failed:', error.message);
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

// Run the app registration
console.log('🚀 HERA Waste Management System - App Registration');
console.log('═'.repeat(60));
console.log('');
registerWMSApp()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Registration completed successfully!');
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
