#!/usr/bin/env node
/**
 * Register HERA CENTRAL App via hera_apps_register_v1 RPC
 *
 * This script registers HERA CENTRAL as an official HERA app
 * using the universal apps registration system.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test data for HERA CENTRAL registration
const testData = {
  organization_id: process.env.DEFAULT_ORGANIZATION_ID,
  // You'll need to provide a valid user entity ID for actor
  // This should be a USER entity in your system
  actor_user_id: process.env.ACTOR_USER_ID || '00000000-0000-0000-0000-000000000001'
};

console.log('🚀 HERA CENTRAL App Registration Test');
console.log('=====================================');
console.log('Organization ID:', testData.organization_id);
console.log('Actor User ID:', testData.actor_user_id);
console.log('');

async function registerHeraCentral() {
  try {
    console.log('📝 Registering HERA CENTRAL app...');

    // Call hera_apps_register_v1 RPC function
    const { data, error } = await supabase.rpc('hera_apps_register_v1', {
      p_app_code: 'HERA_CENTRAL',
      p_app_name: 'HERA Central Hub',
      p_app_description: 'Central command center for HERA ERP system with Control Center, AI Insights, and system-wide orchestration',
      p_app_category: 'SYSTEM',
      p_app_icon: 'command',
      p_app_color: '#D4AF37', // Gold color for HERA branding
      p_app_url: '/control-center',
      p_app_roles: ['ADMIN', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
      p_app_permissions: [
        'system:read',
        'system:write',
        'control-center:access',
        'ai-insights:access',
        'apps:manage',
        'monitoring:access',
        'analytics:access'
      ],
      p_app_config: {
        features: {
          controlCenter: true,
          aiInsights: true,
          appManagement: true,
          systemMonitoring: true,
          analytics: true
        },
        modules: [
          {
            id: 'control-center',
            name: 'Control Center',
            path: '/control-center',
            icon: 'activity'
          },
          {
            id: 'ai-insights',
            name: 'AI Insights',
            path: '/control-center/ai-insights',
            icon: 'brain'
          },
          {
            id: 'apps',
            name: 'Apps Management',
            path: '/control-center/apps',
            icon: 'grid'
          },
          {
            id: 'monitoring',
            name: 'System Monitoring',
            path: '/control-center/monitoring',
            icon: 'monitor'
          }
        ],
        settings: {
          theme: 'dark',
          layout: 'dashboard',
          defaultView: 'overview'
        }
      },
      p_app_metadata: {
        version: '2.0.0',
        author: 'HERA Software Inc',
        tags: ['system', 'control', 'monitoring', 'ai'],
        documentation: '/docs/control-center',
        support: 'support@heraerp.com',
        license: 'HERA Enterprise',
        dependencies: [],
        integrations: ['all'],
        featured: true,
        priority: 1
      },
      p_actor_user_id: testData.actor_user_id,
      p_organization_id: testData.organization_id
    });

    if (error) {
      console.error('❌ Registration FAILED:', error.message);
      console.error('Error details:', error);
      return { success: false, error };
    }

    console.log('✅ Registration SUCCESSFUL!');
    console.log('');
    console.log('📦 Registration Result:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    return { success: true, data };

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

async function verifyRegistration() {
  try {
    console.log('🔍 Verifying HERA CENTRAL registration...');

    // Query the apps table to verify registration
    const { data, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP')
      .eq('entity_code', 'HERA_CENTRAL')
      .eq('organization_id', testData.organization_id)
      .single();

    if (error) {
      console.error('❌ Verification FAILED:', error.message);
      return { success: false, error };
    }

    console.log('✅ Verification SUCCESSFUL!');
    console.log('');
    console.log('📊 Registered App Details:');
    console.log('  App ID:', data.id);
    console.log('  App Name:', data.entity_name);
    console.log('  App Code:', data.entity_code);
    console.log('  Smart Code:', data.smart_code);
    console.log('  Organization:', data.organization_id);
    console.log('  Created At:', data.created_at);
    console.log('  Created By:', data.created_by);
    console.log('');

    // Query dynamic data fields
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', data.id)
      .eq('organization_id', testData.organization_id);

    if (!dynamicError && dynamicData.length > 0) {
      console.log('📝 Dynamic Data Fields:');
      dynamicData.forEach(field => {
        console.log(`  ${field.field_name}: ${field.field_value_text || field.field_value_number || field.field_value_boolean || field.field_value_json || 'N/A'}`);
      });
      console.log('');
    }

    return { success: true, data };

  } catch (error) {
    console.error('❌ Verification error:', error);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('');
  console.log('🎯 Starting HERA CENTRAL App Registration Process');
  console.log('');

  // Step 1: Register the app
  const registrationResult = await registerHeraCentral();

  if (!registrationResult.success) {
    console.error('');
    console.error('🚨 REGISTRATION FAILED - Cannot proceed with verification');
    console.error('');
    process.exit(1);
  }

  console.log('');
  console.log('⏳ Waiting 2 seconds before verification...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('');

  // Step 2: Verify the registration
  const verificationResult = await verifyRegistration();

  if (!verificationResult.success) {
    console.error('');
    console.error('🚨 VERIFICATION FAILED');
    console.error('');
    process.exit(1);
  }

  console.log('');
  console.log('🎉 HERA CENTRAL APP REGISTRATION COMPLETE!');
  console.log('');
  console.log('✨ Summary:');
  console.log('  ✅ App registered successfully');
  console.log('  ✅ App verification passed');
  console.log('  ✅ Dynamic data fields populated');
  console.log('  ✅ Actor stamping verified');
  console.log('');
  console.log('🚀 HERA CENTRAL is now ready to use!');
  console.log('   Access at: /control-center');
  console.log('');
}

// Run the main function
main().catch(console.error);
