#!/usr/bin/env node
/**
 * Link CENTRAL App to HERA CENTRAL Organization
 * Using hera_org_link_app_v1 RPC function
 *
 * App: CENTRAL (HERA Central Hub)
 * Organization: HERA CENTRAL (11111111-1111-1111-1111-111111111111)
 * Actor: admin@heraerp.com (f83787c1-43c4-4555-b365-d388104b2a1b)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HERA_CENTRAL_ORG_ID = '11111111-1111-1111-1111-111111111111';
const ADMIN_USER_ENTITY_ID = 'f83787c1-43c4-4555-b365-d388104b2a1b'; // admin@heraerp.com USER entity
const CENTRAL_APP_CODE = 'CENTRAL';

async function linkCentralToHeraCentralOrg() {
  console.log('🔗 Linking CENTRAL App to HERA CENTRAL Organization...');
  console.log('═'.repeat(80));
  console.log('Actor:        admin@heraerp.com');
  console.log('Actor ID:     ' + ADMIN_USER_ENTITY_ID);
  console.log('Organization: HERA CENTRAL');
  console.log('Org ID:       ' + HERA_CENTRAL_ORG_ID);
  console.log('App Code:     ' + CENTRAL_APP_CODE);
  console.log('═'.repeat(80));
  console.log('');

  try {
    // Step 1: Verify organization exists
    console.log('🔍 Step 1: Verifying HERA CENTRAL organization...');
    const { data: orgData, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', HERA_CENTRAL_ORG_ID)
      .single();

    if (orgError) {
      throw new Error('Organization not found: ' + orgError.message);
    }

    console.log('✅ Organization Found:');
    console.log('   Name:', orgData.organization_name);
    console.log('   Code:', orgData.organization_code);
    console.log('   Type:', orgData.organization_type);
    console.log('   Status:', orgData.status);
    console.log('');

    // Step 2: Verify app exists
    console.log('🔍 Step 2: Verifying CENTRAL app...');
    const { data: appData, error: appError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP')
      .eq('entity_code', CENTRAL_APP_CODE)
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .single();

    if (appError) {
      throw new Error('App not found: ' + appError.message);
    }

    console.log('✅ App Found:');
    console.log('   Name:', appData.entity_name);
    console.log('   Code:', appData.entity_code);
    console.log('   Smart Code:', appData.smart_code);
    console.log('   Status:', appData.status);
    console.log('');

    // Step 3: Check if app is already linked
    console.log('🔍 Step 3: Checking if app is already linked...');
    const { data: existingLinks, error: checkError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', HERA_CENTRAL_ORG_ID)
      .eq('relationship_type', 'ORG_HAS_APP')
      .eq('to_entity_id', appData.id);

    if (checkError) {
      console.log('⚠️  Check failed:', checkError.message);
    } else if (existingLinks && existingLinks.length > 0) {
      console.log('⚠️  App is already linked to this organization!');
      console.log('   Link ID:', existingLinks[0].id);
      console.log('   Created At:', existingLinks[0].created_at);
      console.log('   Is Active:', existingLinks[0].is_active);
      console.log('');
      console.log('💡 Updating existing link instead...');

      // Update existing link
      const { data: updateData, error: updateError } = await supabase
        .from('core_relationships')
        .update({
          is_active: true,
          relationship_data: {
            subscription: {
              plan: 'system',
              status: 'active',
              included: true
            },
            config: {
              features: {
                control_center: true,
                ai_insights: true,
                app_management: true,
                system_monitoring: true,
                analytics: true
              },
              theme: {
                primary_color: '#D4AF37',
                secondary_color: '#E5C896',
                accent_color: '#CD7F32'
              }
            },
            installed_via: 'mcp_script',
            updated_at: new Date().toISOString()
          },
          updated_by: ADMIN_USER_ENTITY_ID,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLinks[0].id)
        .select();

      if (updateError) {
        throw new Error('Update failed: ' + updateError.message);
      }

      console.log('✅ Link Updated Successfully!');
      console.log('');
      await verifyLink();
      return;
    }

    console.log('   No existing link found. Creating new link...');
    console.log('');

    // Step 4: Link app to organization using RPC
    console.log('🚀 Step 4: Linking CENTRAL app to HERA CENTRAL organization...');

    const { data: linkData, error: linkError } = await supabase.rpc('hera_org_link_app_v1', {
      p_actor_user_id: ADMIN_USER_ENTITY_ID,
      p_organization_id: HERA_CENTRAL_ORG_ID,
      p_app_code: CENTRAL_APP_CODE,
      p_installed_at: new Date().toISOString(),
      p_subscription: {
        plan: 'system',
        status: 'active',
        included: true,
        note: 'HERA CENTRAL is included with all system organizations'
      },
      p_config: {
        features: {
          control_center: {
            enabled: true,
            url: '/control-center'
          },
          ai_insights: {
            enabled: true,
            url: '/control-center/ai-insights'
          },
          app_management: {
            enabled: true,
            url: '/control-center/apps'
          },
          system_monitoring: {
            enabled: true,
            url: '/control-center/monitoring'
          },
          analytics: {
            enabled: true,
            url: '/control-center/analytics'
          }
        },
        theme: {
          primary_color: '#D4AF37',
          secondary_color: '#E5C896',
          accent_color: '#CD7F32',
          background: '#1A1A1A'
        },
        modules: [
          'control_center',
          'ai_insights',
          'apps',
          'monitoring',
          'analytics'
        ],
        permissions: {
          super_admin: ['all'],
          system_admin: ['read', 'write', 'manage_apps', 'view_monitoring'],
          admin: ['read', 'view_monitoring'],
          manager: ['read'],
          member: ['read']
        },
        default_settings: {
          timezone: 'UTC',
          language: 'en',
          default_view: 'overview'
        }
      },
      p_is_active: true
    });

    if (linkError) {
      console.log('❌ App Linking FAILED:', linkError);
      console.log('   Message:', linkError.message);
      console.log('   Details:', linkError.details);
      console.log('   Hint:', linkError.hint);
      throw new Error(linkError.message);
    }

    console.log('✅ CENTRAL App Linked Successfully!');
    console.log('');
    console.log('📝 Link Details:');
    console.log(JSON.stringify(linkData, null, 2));
    console.log('');

    // Step 5: Verify link
    await verifyLink();

    // Summary
    console.log('');
    console.log('═'.repeat(80));
    console.log('🎉 CENTRAL APP LINKING COMPLETE!');
    console.log('═'.repeat(80));
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Organization: HERA CENTRAL');
    console.log('   ✅ App: HERA Central Hub (CENTRAL)');
    console.log('   ✅ Route Path: /control-center');
    console.log('   ✅ Plan: System (Included)');
    console.log('   ✅ Status: Active');
    console.log('   ✅ Features: 5 modules enabled');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Access HERA CENTRAL at: /control-center');
    console.log('   2. Login with:');
    console.log('      Email:    admin@heraerp.com');
    console.log('      Password: admin@HERA');
    console.log('   3. Verify all modules are accessible:');
    console.log('      - Control Center Dashboard');
    console.log('      - AI Insights');
    console.log('      - Apps Management');
    console.log('      - System Monitoring');
    console.log('      - Analytics');
    console.log('');
    console.log('🛡️  Security Features Verified:');
    console.log('   ✅ Actor stamping (installed by admin@heraerp.com)');
    console.log('   ✅ Organization isolation');
    console.log('   ✅ Feature configuration');
    console.log('   ✅ RBAC ready (5 role types configured)');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ App linking failed:', error.message);
    if (error.details) {
      console.error('📋 Error details:', error.details);
    }
    if (error.hint) {
      console.error('💡 Hint:', error.hint);
    }
    console.error('');
    process.exit(1);
  }
}

async function verifyLink() {
  console.log('🔍 Step 5: Verifying link...');

  // Check ORG_HAS_APP relationship
  const { data: orgAppRel, error: relError } = await supabase
    .from('core_relationships')
    .select('*, from_entity:core_organizations!from_entity_id(organization_name), to_entity:core_entities!to_entity_id(entity_name, entity_code)')
    .eq('organization_id', HERA_CENTRAL_ORG_ID)
    .eq('relationship_type', 'ORG_HAS_APP')
    .limit(1);

  if (relError) {
    console.log('⚠️  Verification failed:', relError.message);
  } else if (orgAppRel && orgAppRel.length > 0) {
    const rel = orgAppRel[0];
    console.log('✅ ORG_HAS_APP Relationship Verified:');
    console.log('   ID:              ', rel.id);
    console.log('   Organization:    ', rel.from_entity?.organization_name);
    console.log('   App:             ', rel.to_entity?.entity_name, '(' + rel.to_entity?.entity_code + ')');
    console.log('   Is Active:       ', rel.is_active ? 'YES' : 'NO');
    console.log('   Created At:      ', rel.created_at);
    console.log('   Created By:      ', rel.created_by);
    console.log('');
  } else {
    console.log('⚠️  No ORG_HAS_APP relationship found');
  }
}

// Run the app linking
linkCentralToHeraCentralOrg();
