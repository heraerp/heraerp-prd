#!/usr/bin/env node
/**
 * Create HERA CENTRAL Organization
 * Organization ID: 11111111-1111-1111-1111-111111111111
 * Uses: hera_organizations_crud_v1 RPC
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Use the demo user we created earlier
const ACTOR_USER_ID = '03b7ea5e-2acd-469f-b509-51fe924527cf'; // demo@heraerp.com
const HERA_CENTRAL_ORG_ID = '11111111-1111-1111-1111-111111111111';

async function createHeraCentralOrg() {
  console.log('🏢 Creating HERA CENTRAL Organization...');
  console.log('═'.repeat(80));
  console.log('Organization ID:   ' + HERA_CENTRAL_ORG_ID);
  console.log('Organization Name: HERA CENTRAL');
  console.log('Actor User:        demo@heraerp.com');
  console.log('═'.repeat(80));
  console.log('');

  const payload = {
    id: HERA_CENTRAL_ORG_ID, // Specify the exact org ID
    organization_name: 'HERA CENTRAL',
    organization_code: 'CENTRAL',
    organization_type: 'system',
    industry_classification: 'technology',
    parent_organization_id: null, // No parent - this is a top-level org
    status: 'active',
    smart_code: 'HERA.SYSTEM.ORG.CENTRAL.v1',
    settings: {
      is_demo: false,
      org_type: 'system',
      description: 'HERA CENTRAL - System administration and control center organization',
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
    }
  };

  console.log('📤 Request Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');
  console.log('═'.repeat(80));
  console.log('');

  try {
    console.log('🚀 Creating organization with hera_organizations_crud_v1...');

    const { data, error } = await supabase.rpc('hera_organizations_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: ACTOR_USER_ID,
      p_payload: payload
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      console.error('');
      console.error('Error Details:');
      console.error('  Message:', error.message);
      console.error('  Details:', error.details);
      console.error('  Hint:', error.hint);
      console.error('  Code:', error.code);
      console.error('');
      return;
    }

    console.log('✅ Organization Created Successfully!');
    console.log('');
    console.log('📊 Response Data:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    if (data && data.organization) {
      const org = data.organization;

      console.log('═'.repeat(80));
      console.log('🎯 NEW ORGANIZATION DETAILS:');
      console.log('═'.repeat(80));
      console.log('Organization ID:   ' + org.id);
      console.log('Organization Name: ' + org.organization_name);
      console.log('Organization Code: ' + org.organization_code);
      console.log('Organization Type: ' + org.organization_type);
      console.log('Industry:          ' + org.industry_classification);
      console.log('Status:            ' + org.status);
      console.log('Smart Code:        ' + org.smart_code);
      console.log('Created By:        ' + org.created_by);
      console.log('Created At:        ' + org.created_at);
      console.log('═'.repeat(80));
      console.log('');

      // Verify the organization was created
      console.log('🔍 Verifying organization creation...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('core_organizations')
        .select('*')
        .eq('id', HERA_CENTRAL_ORG_ID)
        .single();

      if (verifyError) {
        console.error('⚠️  Verification failed:', verifyError.message);
      } else {
        console.log('✅ Organization verified in database!');
        console.log('');
        console.log('📋 Database Record:');
        console.log('   ID:               ' + verifyData.id);
        console.log('   Name:             ' + verifyData.organization_name);
        console.log('   Code:             ' + verifyData.organization_code);
        console.log('   Type:             ' + verifyData.organization_type);
        console.log('   Status:           ' + verifyData.status);
        console.log('   Smart Code:       ' + verifyData.smart_code);
        console.log('');
      }

      console.log('═'.repeat(80));
      console.log('💡 NEXT STEPS:');
      console.log('═'.repeat(80));
      console.log('1. Update .env with:');
      console.log('   HERA_CENTRAL_ORG_ID=' + HERA_CENTRAL_ORG_ID);
      console.log('');
      console.log('2. Link CENTRAL app to this organization:');
      console.log('   Use: hera_org_link_app_v1');
      console.log('   App Code: CENTRAL');
      console.log('   Org ID: ' + HERA_CENTRAL_ORG_ID);
      console.log('');
      console.log('3. Create/assign users to this organization');
      console.log('   Use: hera_onboard_user_v1 or create memberships');
      console.log('');
      console.log('4. Access HERA CENTRAL at:');
      console.log('   /control-center');
      console.log('═'.repeat(80));
      console.log('');

    } else if (data && data.organization_id) {
      // Handle alternative response format
      console.log('═'.repeat(80));
      console.log('🎯 NEW ORGANIZATION CREATED:');
      console.log('═'.repeat(80));
      console.log('Organization ID: ' + data.organization_id);
      console.log('═'.repeat(80));
    }

    console.log('');
    console.log('🎉 HERA CENTRAL ORGANIZATION SETUP COMPLETE!');
    console.log('');

  } catch (err) {
    console.error('');
    console.error('💥 Unexpected Error:', err);
    console.error('');
    process.exit(1);
  }
}

// Run the creation
createHeraCentralOrg();
