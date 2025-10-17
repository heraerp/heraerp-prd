#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Smart Code Pattern: ^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$
// Valid Examples: HERA.SALON.SERVICE.TXN.SALE.v1
//                 HERA.SEC.PLATFORM.IDENTITY.USER.v1

function validateSmartCode(smartCode) {
  const pattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;
  return pattern.test(smartCode);
}

async function createProductionPlatform() {
  console.log('🏛️ Creating HERA Platform (PRODUCTION GRADE)...\n');
  
  try {
    const platformOrgId = '00000000-0000-0000-0000-000000000000';
    const salonOrgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
    
    // Step 1: Platform organization already exists - verify
    console.log('📋 Step 1: Verifying Platform Organization...');
    const { data: platformOrg } = await supabase
      .from('core_organizations')
      .select('id, organization_name')
      .eq('id', platformOrgId)
      .single();
      
    if (!platformOrg) {
      console.error('❌ Platform organization not found');
      return { success: false, error: 'Platform org missing' };
    }
    
    console.log(`✅ Platform Org: ${platformOrg.organization_name}\n`);
    
    // Step 2: Create Platform System User Entity (with VALID smart code)
    console.log('📋 Step 2: Creating Platform System User...');
    
    const platformUserSmartCode = 'HERA.SEC.PLATFORM.SYSTEM.USER.v1';
    console.log(`🧠 Smart Code: ${platformUserSmartCode}`);
    console.log(`✅ Pattern Valid: ${validateSmartCode(platformUserSmartCode)}\n`);
    
    // Check if platform user already exists
    const { data: existingPlatformUser } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', platformOrgId)
      .eq('entity_type', 'user')
      .eq('smart_code', platformUserSmartCode)
      .single();
      
    let platformUserId;
    
    if (existingPlatformUser) {
      console.log(`✅ Platform User exists: ${existingPlatformUser.id}`);
      platformUserId = existingPlatformUser.id;
    } else {
      const { data: platformUser, error: userError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: platformOrgId,
          entity_type: 'user',
          entity_name: 'HERA Platform System',
          entity_code: 'PLATFORM-SYSTEM',
          entity_description: 'Platform system user for cross-organization operations',
          smart_code: platformUserSmartCode,
          smart_code_status: 'active',
          ai_confidence: 1.0,
          ai_classification: {
            category: 'platform_infrastructure',
            security_level: 'system'
          },
          ai_insights: {
            purpose: 'Cross-organization platform operations',
            capabilities: ['identity_bridging', 'authorization_management']
          },
          business_rules: {
            immutable: true,
            system_managed: true,
            cross_tenant_access: true
          },
          metadata: {
            platform_version: 'v2.0.0',
            security_clearance: 'platform_admin',
            supabase_user_id: 'platform-system'
          },
          status: 'active'
        })
        .select()
        .single();
        
      if (userError) {
        console.error('❌ Error creating platform user:', userError);
        return { success: false, error: userError };
      }
      
      console.log(`✅ Created Platform User: ${platformUser.id}`);
      platformUserId = platformUser.id;
    }
    
    // Step 3: Create Salon Organization Anchor (with VALID smart code)
    console.log('\n📋 Step 3: Creating Salon Organization Anchor...');
    
    const salonAnchorSmartCode = 'HERA.SEC.ORG.ANCHOR.MEMBERSHIP.v1';
    console.log(`🧠 Smart Code: ${salonAnchorSmartCode}`);
    console.log(`✅ Pattern Valid: ${validateSmartCode(salonAnchorSmartCode)}\n`);
    
    // Check if salon anchor already exists
    const { data: existingSalonAnchor } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', salonOrgId)
      .eq('entity_type', 'org_anchor')
      .eq('smart_code', salonAnchorSmartCode)
      .single();
      
    let salonAnchorId;
    
    if (existingSalonAnchor) {
      console.log(`✅ Salon Anchor exists: ${existingSalonAnchor.id}`);
      salonAnchorId = existingSalonAnchor.id;
    } else {
      const { data: salonAnchor, error: anchorError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: salonOrgId,
          entity_type: 'org_anchor',
          entity_name: 'Salon Membership Anchor',
          entity_code: 'SALON-MEMBERSHIP-ANCHOR',
          entity_description: 'Organization anchor for user membership relationships',
          smart_code: salonAnchorSmartCode,
          smart_code_status: 'active',
          ai_confidence: 1.0,
          ai_classification: {
            category: 'organization_infrastructure',
            purpose: 'membership_management'
          },
          ai_insights: {
            purpose: 'Relationship terminus for user memberships',
            usage: 'All user→organization membership relationships terminate here',
            security: 'Enables tenant-scoped membership rows'
          },
          business_rules: {
            immutable: true,
            system_managed: true,
            relationship_terminus: true
          },
          metadata: {
            anchor_type: 'organization',
            max_memberships: 1000,
            membership_types: ['owner', 'admin', 'manager', 'user', 'guest', 'demo']
          },
          status: 'active'
        })
        .select()
        .single();
        
      if (anchorError) {
        console.error('❌ Error creating salon anchor:', anchorError);
        return { success: false, error: anchorError };
      }
      
      console.log(`✅ Created Salon Anchor: ${salonAnchor.id}`);
      salonAnchorId = salonAnchor.id;
    }
    
    // Step 4: Add Enterprise Configuration via Dynamic Data (with VALID smart codes)
    console.log('\n📋 Step 4: Adding Enterprise Configuration...');
    
    const configSmartCodes = [
      'HERA.SEC.CONFIG.SECURITY.TIER.v1',
      'HERA.SEC.CONFIG.COMPLIANCE.STANDARDS.v1',
      'HERA.SEC.CONFIG.AUDIT.RETENTION.v1',
      'HERA.SEC.CONFIG.SESSION.TIMEOUT.v1',
      'HERA.SEC.CONFIG.ORG.LIMIT.v1'
    ];
    
    // Validate all smart codes first
    console.log('🧠 Validating Configuration Smart Codes:');
    for (const smartCode of configSmartCodes) {
      const isValid = validateSmartCode(smartCode);
      console.log(`   ${smartCode}: ${isValid ? '✅' : '❌'}`);
      if (!isValid) {
        console.error('❌ Invalid smart code detected');
        return { success: false, error: `Invalid smart code: ${smartCode}` };
      }
    }
    console.log();
    
    const enterpriseConfig = [
      {
        entity_id: platformUserId,
        field_name: 'security_tier',
        field_type: 'configuration',
        field_value_text: 'enterprise',
        smart_code: configSmartCodes[0]
      },
      {
        entity_id: platformUserId,
        field_name: 'compliance_standards',
        field_type: 'configuration',
        field_value_json: ['SOC2', 'ISO27001', 'GDPR', 'HIPAA', 'PCI_DSS'],
        smart_code: configSmartCodes[1]
      },
      {
        entity_id: platformUserId,
        field_name: 'audit_retention',
        field_type: 'configuration',
        field_value_text: '7_years',
        smart_code: configSmartCodes[2]
      },
      {
        entity_id: platformUserId,
        field_name: 'session_timeout',
        field_type: 'configuration',
        field_value_text: '8_hours',
        smart_code: configSmartCodes[3]
      },
      {
        entity_id: salonAnchorId,
        field_name: 'max_memberships',
        field_type: 'limit',
        field_value_number: 1000,
        smart_code: configSmartCodes[4]
      }
    ];
    
    for (const config of enterpriseConfig) {
      // Check if config already exists
      const { data: existingConfig } = await supabase
        .from('core_dynamic_data')
        .select('id')
        .eq('organization_id', config.entity_id === platformUserId ? platformOrgId : salonOrgId)
        .eq('entity_id', config.entity_id)
        .eq('field_name', config.field_name)
        .single();
        
      if (!existingConfig) {
        const { error: configError } = await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: config.entity_id === platformUserId ? platformOrgId : salonOrgId,
            ...config,
            smart_code_status: 'active',
            ai_confidence: 1.0,
            validation_status: 'valid',
            is_required: true,
            is_system_field: true,
            is_searchable: false,
            field_order: 1
          });
          
        if (configError) {
          console.error(`❌ Error creating config ${config.field_name}:`, configError);
        } else {
          console.log(`   ✅ ${config.field_name}: ${config.field_value_text || config.field_value_number || 'JSON array'}`);
        }
      } else {
        console.log(`   ✅ ${config.field_name}: Already exists`);
      }
    }
    
    console.log('\n🚀 PRODUCTION Platform Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏛️ Platform Org ID: ${platformOrgId}`);
    console.log(`👤 Platform User ID: ${platformUserId}`);
    console.log(`🏢 Salon Org ID: ${salonOrgId}`);
    console.log(`⚓ Salon Anchor ID: ${salonAnchorId}`);
    console.log(`🧠 All Smart Codes: PRODUCTION VALID`);
    console.log(`🔐 Security Tier: Enterprise`);
    console.log(`📋 Compliance: SOC2, ISO27001, GDPR, HIPAA, PCI_DSS`);
    console.log(`⏰ Session Timeout: 8 hours`);
    console.log(`👥 Max Memberships: 1,000`);
    console.log(`🚀 Ready for Supabase Auth → HERA bridging`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return {
      platformOrgId,
      platformUserId,
      salonOrgId,
      salonAnchorId,
      success: true
    };
    
  } catch (error) {
    console.error('💥 Critical Error:', error);
    return { success: false, error };
  }
}

// Execute if called directly
if (require.main === module) {
  createProductionPlatform()
    .then(result => {
      if (result && result.success) {
        console.log('✅ PRODUCTION Setup completed successfully');
        process.exit(0);
      } else {
        console.error('❌ PRODUCTION Setup failed:', result ? result.error : 'Unknown error');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { createProductionPlatform };