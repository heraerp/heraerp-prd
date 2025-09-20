#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSalonOrgAnchor() {
  console.log('🏢 Creating Salon Organization Anchor Entity...\n');
  
  try {
    // Target Salon Organization
    const salonOrgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
    
    console.log('📋 Step 1: Verify Salon Organization exists...');
    const { data: salonOrg, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_code')
      .eq('id', salonOrgId)
      .single();
      
    if (orgError || !salonOrg) {
      console.error('❌ Salon organization not found:', orgError);
      return { success: false, error: 'Salon org not found' };
    }
    
    console.log('✅ Salon Organization verified:');
    console.log(`   ID: ${salonOrg.id}`);
    console.log(`   Name: ${salonOrg.organization_name}`);
    console.log(`   Code: ${salonOrg.organization_code}\n`);
    
    // Step 2: Create or verify org anchor entity
    console.log('📋 Step 2: Creating Organization Anchor Entity...');
    
    // Check if org anchor already exists
    const { data: existingAnchor } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code')
      .eq('organization_id', salonOrgId)
      .eq('entity_type', 'org_anchor')
      .single();
      
    if (existingAnchor) {
      console.log('✅ Organization Anchor already exists:');
      console.log(`   Entity ID: ${existingAnchor.id}`);
      console.log(`   Name: ${existingAnchor.entity_name}`);
      console.log(`   Code: ${existingAnchor.entity_code}\n`);
      
      return {
        salonOrgId,
        salonAnchorId: existingAnchor.id,
        success: true,
        existing: true
      };
    }
    
    // Create new org anchor entity (with minimal smart code)
    const { data: anchorEntity, error: anchorError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: salonOrgId,
        entity_type: 'org_anchor',
        entity_name: `${salonOrg.organization_name} Anchor`,
        entity_code: `${salonOrg.organization_code}-ANCHOR`,
        entity_description: 'Organization anchor entity for membership relationships',
        smart_code: 'HERA.SEC.ORG.ANCHOR.v1',
        smart_code_status: 'active',
        ai_confidence: 1.0,
        ai_insights: {
          purpose: 'Relationship terminus for user memberships',
          usage: 'All user→organization membership relationships point to this entity',
          security: 'Enables tenant-scoped membership rows in core_relationships'
        },
        business_rules: {
          immutable: true,
          system_managed: true,
          relationship_terminus: true
        },
        metadata: {
          anchor_type: 'organization',
          created_by: 'platform_setup',
          purpose: 'membership_relationships'
        },
        status: 'active'
      })
      .select()
      .single();
      
    if (anchorError) {
      console.error('❌ Error creating org anchor entity:', anchorError);
      return { success: false, error: anchorError };
    }
    
    console.log('✅ Organization Anchor Entity created successfully:');
    console.log(`   Entity ID: ${anchorEntity.id}`);
    console.log(`   Name: ${anchorEntity.entity_name}`);
    console.log(`   Code: ${anchorEntity.entity_code}`);
    console.log(`   Type: ${anchorEntity.entity_type}\n`);
    
    // Step 3: Add enterprise configuration for the anchor
    console.log('📋 Step 3: Adding Anchor Configuration...');
    
    const anchorConfig = [
      {
        entity_id: anchorEntity.id,
        field_name: 'max_memberships',
        field_type: 'limit',
        field_value_number: 1000,
        field_order: 1,
        is_system_field: true,
        is_required: true
      },
      {
        entity_id: anchorEntity.id,
        field_name: 'membership_types',
        field_type: 'configuration',
        field_value_json: ['owner', 'admin', 'manager', 'user', 'guest', 'demo'],
        field_order: 2,
        is_system_field: true,
        is_required: true
      },
      {
        entity_id: anchorEntity.id,
        field_name: 'default_role',
        field_type: 'configuration',
        field_value_text: 'user',
        field_order: 3,
        is_system_field: true,
        is_required: false
      }
    ];
    
    for (const config of anchorConfig) {
      const { error: configError } = await supabase
        .from('core_dynamic_data')
        .upsert({
          organization_id: salonOrgId,
          ...config,
          validation_status: 'valid',
          is_searchable: false
        });
        
      if (configError) {
        console.error(`❌ Error creating config ${config.field_name}:`, configError);
      } else {
        console.log(`   ✅ ${config.field_name}: ${config.field_value_text || config.field_value_number || 'JSON array'}`);
      }
    }
    
    console.log('\n🚀 Salon Organization Anchor Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏢 Salon Org ID: ${salonOrgId}`);
    console.log(`⚓ Anchor Entity ID: ${anchorEntity.id}`);
    console.log(`🏛️ Organization: ${salonOrg.organization_name}`);
    console.log(`👥 Max Memberships: 1,000`);
    console.log(`🔐 Ready for user membership relationships`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return {
      salonOrgId,
      salonAnchorId: anchorEntity.id,
      success: true,
      existing: false
    };
    
  } catch (error) {
    console.error('💥 Critical Error:', error);
    return { success: false, error };
  }
}

// Execute if called directly
if (require.main === module) {
  createSalonOrgAnchor()
    .then(result => {
      if (result && result.success) {
        console.log('✅ Salon Anchor setup completed successfully');
        if (result.existing) {
          console.log('ℹ️  Used existing anchor entity');
        } else {
          console.log('🆕 Created new anchor entity');
        }
        process.exit(0);
      } else {
        console.error('❌ Salon Anchor setup failed:', result ? result.error : 'Unknown error');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { createSalonOrgAnchor };