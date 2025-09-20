#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSalonDemoUser() {
  console.log('👤 Creating Salon Demo User (HERA Authorization DNA)...\n');
  
  try {
    const platformOrgId = '00000000-0000-0000-0000-000000000000';
    const salonOrgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
    const salonAnchorId = '9c62b61a-144b-459b-a660-3d8d2f152bed';
    
    // Demo user identity following DNA pattern
    const demoSupabaseUserId = 'demo|salon-receptionist';
    
    console.log('📋 Step 1: Creating Demo User Entity (Platform Org)...');
    console.log(`🔗 Supabase Bridge ID: ${demoSupabaseUserId}\n`);
    
    // Check if demo user already exists
    const { data: existingUsers } = await supabase
      .from('core_entities')
      .select('id, entity_name, metadata')
      .eq('organization_id', platformOrgId)
      .eq('entity_type', 'user')
      .ilike('entity_name', '%Demo Salon%');
      
    let demoUserId;
    
    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      console.log(`✅ Demo User exists: ${existingUser.id}`);
      console.log(`   Name: ${existingUser.entity_name}\n`);
      demoUserId = existingUser.id;
    } else {
      const demoUserSmartCode = 'HERA.SEC.DEMO.USER.SALON.v1';
      
      const { data: demoUser, error: userError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: platformOrgId,
          entity_type: 'user',
          entity_name: 'Demo Salon Receptionist',
          entity_code: 'DEMO-SALON-RECEPTIONIST',
          entity_description: 'Demo user for salon application testing',
          smart_code: demoUserSmartCode,
          smart_code_status: 'active',
          ai_confidence: 1.0,
          ai_classification: {
            category: 'demo_user',
            industry: 'salon',
            role: 'receptionist'
          },
          ai_insights: {
            purpose: 'Demo user for salon application',
            capabilities: ['appointment_management', 'customer_service'],
            limitations: ['no_financial_access', 'read_only_settings']
          },
          business_rules: {
            demo_user: true,
            session_timeout: '30_minutes',
            read_only_finance: true,
            auto_logout: true
          },
          metadata: {
            supabase_user_id: demoSupabaseUserId,
            demo_type: 'salon_receptionist',
            industry: 'beauty_services',
            expires_after: '30_minutes',
            created_for: 'demonstration'
          },
          status: 'active'
        })
        .select()
        .single();
        
      if (userError) {
        console.error('❌ Error creating demo user:', userError);
        return { success: false, error: userError };
      }
      
      console.log('✅ Created Demo User Entity:');
      console.log(`   ID: ${demoUser.id}`);
      console.log(`   Name: ${demoUser.entity_name}`);
      console.log(`   Smart Code: ${demoUser.smart_code}`);
      console.log(`   Bridge: ${demoUser.metadata.supabase_user_id}\n`);
      
      demoUserId = demoUser.id;
    }
    
    // Step 2: Create Membership Relationship (Salon Scoped)
    console.log('📋 Step 2: Creating Demo User Membership (Salon Org)...');
    
    // Check if membership already exists
    const { data: existingMembership } = await supabase
      .from('core_relationships')
      .select('id, relationship_data')
      .eq('organization_id', salonOrgId)
      .eq('from_entity_id', demoUserId)
      .eq('to_entity_id', salonAnchorId)
      .eq('relationship_type', 'membership')
      .single();
      
    if (existingMembership) {
      console.log(`✅ Demo Membership exists: ${existingMembership.id}`);
      console.log(`   Role: ${existingMembership.relationship_data?.role}`);
      console.log(`   Scopes: ${existingMembership.relationship_data?.scopes?.length} permissions\n`);
    } else {
      const membershipSmartCode = 'HERA.SEC.MEMBERSHIP.DEMO.SALON.v1';
      
      // Demo receptionist role and scopes
      const demoRole = 'HERA.SEC.ROLE.RECEPTIONIST.DEMO.v1';
      const demoScopes = [
        'read:HERA.SALON.SERVICE.APPOINTMENT',
        'write:HERA.SALON.SERVICE.APPOINTMENT',
        'read:HERA.SALON.CRM.CUSTOMER',
        'write:HERA.SALON.CRM.CUSTOMER',
        'read:HERA.SALON.SERVICE.CATALOG',
        'read:HERA.SALON.INVENTORY.PRODUCT'
      ];
      
      const { data: membership, error: membershipError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: salonOrgId, // CRITICAL: Tenant-scoped
          from_entity_id: demoUserId,
          to_entity_id: salonAnchorId,
          relationship_type: 'membership',
          relationship_direction: 'outbound',
          smart_code: membershipSmartCode,
          smart_code_status: 'active',
          ai_confidence: 1.0,
          ai_classification: {
            category: 'user_membership',
            type: 'demo_access'
          },
          ai_insights: {
            purpose: 'Demo user access to salon application',
            scope: 'Limited receptionist capabilities',
            restrictions: 'No financial or admin access'
          },
          business_logic: {
            demo_membership: true,
            auto_expire: '30_minutes',
            limited_scope: true
          },
          relationship_data: {
            role: demoRole,
            scopes: demoScopes,
            permissions: {
              can_manage_appointments: true,
              can_view_customers: true,
              can_create_customers: true,
              can_access_finance: false,
              can_modify_settings: false,
              can_manage_users: false
            },
            session_limits: {
              max_duration: '30_minutes',
              auto_logout: true,
              concurrent_sessions: 1
            },
            demo_restrictions: {
              read_only_finance: true,
              no_data_export: true,
              limited_reporting: true
            }
          },
          is_active: true,
          effective_date: new Date().toISOString(),
          expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        })
        .select()
        .single();
        
      if (membershipError) {
        console.error('❌ Error creating membership:', membershipError);
        return { success: false, error: membershipError };
      }
      
      console.log('✅ Created Demo Membership:');
      console.log(`   ID: ${membership.id}`);
      console.log(`   Role: ${membership.relationship_data.role}`);
      console.log(`   Scopes: ${membership.relationship_data.scopes.length} permissions`);
      console.log(`   Expires: ${membership.expiration_date}\n`);
    }
    
    console.log('🚀 Salon Demo User Setup Complete (HERA Authorization DNA)!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Demo User ID: ${demoUserId}`);
    console.log(`🔗 Supabase Bridge: ${demoSupabaseUserId}`);
    console.log(`🏢 Organization: Hair Talkz Salon`);
    console.log(`🎭 Role: Demo Receptionist`);
    console.log(`🔐 Scopes: 6 salon permissions`);
    console.log(`⏰ Session Duration: 30 minutes`);
    console.log(`🚀 Ready for: /demo/salon → /salon/dashboard`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return {
      success: true,
      demoUserId,
      salonOrgId,
      salonAnchorId,
      supabaseUserId: demoSupabaseUserId
    };
    
  } catch (error) {
    console.error('💥 Critical Error:', error);
    return { success: false, error };
  }
}

// Execute if called directly
if (require.main === module) {
  createSalonDemoUser()
    .then(result => {
      if (result && result.success) {
        console.log('✅ Salon Demo User setup completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Salon Demo User setup failed:', result ? result.error : 'Unknown error');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { createSalonDemoUser };