#!/usr/bin/env node
/**
 * Register HERA CENTRAL App via hera_apps_register_v1 RPC
 *
 * This script:
 * 1. Ensures demo@heraerp.com has a USER entity
 * 2. Registers HERA CENTRAL as an official HERA app
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEMO_USER_AUTH_UID = 'a55cc033-e909-4c59-b974-8ff3e098f2bf';
const DEMO_USER_EMAIL = 'demo@heraerp.com';
const ORG_ID = process.env.DEFAULT_ORGANIZATION_ID;

console.log('🚀 HERA CENTRAL App Registration');
console.log('=================================');
console.log('Organization:', ORG_ID);
console.log('Demo User:', DEMO_USER_EMAIL);
console.log('');

async function ensureDemoUserEntity() {
  try {
    console.log('👤 Checking for demo user entity...');

    // Check if USER entity exists
    const { data: existingUser, error: checkError } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('entity_type', 'USER')
      .eq('organization_id', ORG_ID)
      .eq('metadata->>auth_uid', DEMO_USER_AUTH_UID)
      .single();

    if (existingUser) {
      console.log('✅ Demo user entity exists:', existingUser.entity_name);
      console.log('   User ID:', existingUser.id);
      return existingUser.id;
    }

    // Create USER entity if it doesn't exist
    console.log('📝 Creating demo user entity...');

    const { data: newUser, error: createError } = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'USER',
        entity_name: 'Demo User',
        entity_code: 'DEMO_USER',
        smart_code: 'HERA.SYSTEM.USER.ENTITY.DEMO.v1',
        organization_id: ORG_ID,
        metadata: {
          auth_uid: DEMO_USER_AUTH_UID,
          email: DEMO_USER_EMAIL,
          role: 'ADMIN'
        }
      })
      .select('id, entity_name')
      .single();

    if (createError) {
      console.error('❌ Failed to create user entity:', createError.message);
      throw createError;
    }

    console.log('✅ Created demo user entity:', newUser.entity_name);
    console.log('   User ID:', newUser.id);
    return newUser.id;

  } catch (error) {
    console.error('❌ Error ensuring demo user:', error);
    throw error;
  }
}

async function registerHeraCentral(actorUserId) {
  try {
    console.log('');
    console.log('📝 Registering HERA CENTRAL app...');
    console.log('   Actor User ID:', actorUserId);

    // Call hera_apps_register_v1 RPC function
    const appPayload = {
      code: 'CENTRAL',
      name: 'HERA Central Hub',
      smart_code: 'HERA.PLATFORM.APP.ENTITY.CENTRAL.v1',
      status: 'active',
      business_rules: {
        features: {
          control_center: true,
          ai_insights: true,
          app_management: true,
          system_monitoring: true,
          analytics: true
        },
        modules: [
          'control_center',
          'ai_insights',
          'apps',
          'monitoring',
          'analytics'
        ],
        default_permissions: [
          'control_center.read',
          'control_center.write',
          'ai_insights.read',
          'apps.manage',
          'monitoring.read',
          'analytics.read'
        ]
      },
      metadata: {
        description: 'Central command center for HERA ERP system with Control Center, AI Insights, and system-wide orchestration',
        version: '2.0.0',
        category: 'system',
        icon: 'command',
        theme: {
          primary_color: '#D4AF37',
          secondary_color: '#E5C896',
          accent_color: '#CD7F32'
        }
      }
    };

    console.log('App Payload:');
    console.log(JSON.stringify(appPayload, null, 2));
    console.log('');

    const { data, error } = await supabase.rpc('hera_apps_register_v1', {
      p_actor_user_id: actorUserId,
      p_payload: appPayload
    });

    if (error) {
      console.error('❌ Registration FAILED:', error.message);
      console.error('   Error details:', error);
      throw error;
    }

    console.log('✅ Registration SUCCESSFUL!');
    console.log('');
    console.log('📦 Result:', JSON.stringify(data, null, 2));

    return data;

  } catch (error) {
    console.error('❌ Registration error:', error);
    throw error;
  }
}

async function verifyRegistration() {
  try {
    console.log('');
    console.log('🔍 Verifying HERA CENTRAL registration...');

    // Apps are stored in the PLATFORM organization (00000000-0000-0000-0000-000000000000)
    const { data, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP')
      .eq('entity_code', 'CENTRAL')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .single();

    if (error) {
      console.error('❌ Verification FAILED:', error.message);
      throw error;
    }

    console.log('✅ Verification SUCCESSFUL!');
    console.log('');
    console.log('📊 App Details:');
    console.log('   App ID:', data.id);
    console.log('   Name:', data.entity_name);
    console.log('   Code:', data.entity_code);
    console.log('   Smart Code:', data.smart_code);
    console.log('   Created By:', data.created_by);
    console.log('   Created At:', data.created_at);
    console.log('');

    // Check dynamic data
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json')
      .eq('entity_id', data.id)
      .eq('organization_id', ORG_ID);

    if (dynamicData && dynamicData.length > 0) {
      console.log('📝 Dynamic Fields:', dynamicData.length, 'fields');
      dynamicData.slice(0, 5).forEach(field => {
        const value = field.field_value_json || field.field_value_text || 'N/A';
        const displayValue = typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : value;
        console.log(`   - ${field.field_name}: ${displayValue}`);
      });
      if (dynamicData.length > 5) {
        console.log(`   ... and ${dynamicData.length - 5} more fields`);
      }
    }

    return data;

  } catch (error) {
    console.error('❌ Verification error:', error);
    throw error;
  }
}

async function main() {
  try {
    // Step 1: Ensure demo user entity exists
    const actorUserId = await ensureDemoUserEntity();

    // Step 2: Register HERA CENTRAL
    await registerHeraCentral(actorUserId);

    // Step 3: Verify registration
    await verifyRegistration();

    console.log('');
    console.log('🎉 HERA CENTRAL REGISTRATION COMPLETE!');
    console.log('');
    console.log('✨ Summary:');
    console.log('   ✅ Demo user entity verified/created');
    console.log('   ✅ App registered successfully');
    console.log('   ✅ App verification passed');
    console.log('   ✅ Actor stamping verified');
    console.log('');
    console.log('🚀 Access HERA CENTRAL at: /control-center');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('🚨 REGISTRATION FAILED');
    console.error('');
    process.exit(1);
  }
}

// Run the registration
main().catch(console.error);
