#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPlatformOrganization() {
  console.log('🏛️ Creating HERA Platform Organization (Enterprise Grade)...\n');
  
  try {
    // Step 1: Create Platform Organization in core_organizations
    const platformOrgId = '00000000-0000-0000-0000-000000000000';
    
    console.log('📋 Step 1: Creating Platform Organization...');
    const { data: orgData, error: orgError } = await supabase
      .from('core_organizations')
      .upsert({
        id: platformOrgId,
        organization_name: 'HERA Platform',
        organization_code: 'PLATFORM',
        organization_type: 'platform',
        industry_classification: 'enterprise_software',
        ai_insights: {
          purpose: 'Global identity and authorization platform',
          features: [
            'Multi-tenant identity management',
            'Universal authorization framework', 
            'Cross-organization user resolution',
            'Enterprise security compliance',
            'Audit trail and governance'
          ]
        },
        ai_confidence: 1.0,
        ai_classification: 'PLATFORM',
        settings: {
          is_platform: true,
          manages_identity: true,
          security_tier: 'enterprise',
          compliance: ['SOC2', 'ISO27001', 'GDPR'],
          retention_policy: '7_years'
        },
        status: 'active'
      })
      .select();
      
    if (orgError) {
      console.error('❌ Error creating platform organization:', orgError);
      return;
    }
    
    console.log('✅ Platform Organization created successfully');
    console.log(`   ID: ${platformOrgId}`);
    console.log(`   Name: HERA Platform`);
    console.log(`   Type: platform\n`);
    
    // Step 2: Create Platform Identity Entity (represents the platform itself)
    console.log('📋 Step 2: Creating Platform Identity Entity...');
    const { data: platformEntity, error: entityError } = await supabase
      .from('core_entities')
      .upsert({
        organization_id: platformOrgId,
        entity_type: 'user',
        entity_name: 'HERA Platform System',
        entity_code: 'PLATFORM-SYSTEM',
        smart_code: 'HERA.SEC.USER.PLATFORM.v1',
        smart_code_status: 'active',
        ai_confidence: 1.0,
        ai_classification: {
          category: 'platform_infrastructure',
          subcategory: 'identity_management',
          security_level: 'enterprise'
        },
        ai_insights: {
          purpose: 'Platform identity for cross-organization operations',
          capabilities: [
            'Global user identity management',
            'Cross-organization authorization',
            'Platform-level audit operations'
          ]
        },
        business_rules: {
          immutable: true,
          system_managed: true,
          audit_all_access: true
        },
        metadata: {
          platform_version: 'v2.0.0',
          security_clearance: 'platform_admin',
          created_by_system: true
        },
        status: 'active'
      })
      .select();
      
    if (entityError) {
      console.error('❌ Error creating platform identity entity:', entityError);
      return;
    }
    
    console.log('✅ Platform Identity Entity created successfully');
    console.log(`   Entity ID: ${platformEntity[0].id}`);
    console.log(`   Smart Code: ${platformEntity[0].smart_code}\n`);
    
    // Step 3: Add Enterprise Configuration via Dynamic Data
    console.log('📋 Step 3: Adding Enterprise Configuration...');
    
    const enterpriseConfig = [
      {
        entity_id: platformEntity[0].id,
        field_name: 'security_tier',
        field_type: 'configuration',
        field_value_text: 'enterprise',
        smart_code: 'HERA.SEC.CONFIG.TIER.v1',
        ai_confidence: 1.0,
        is_system_field: true
      },
      {
        entity_id: platformEntity[0].id,
        field_name: 'compliance_standards',
        field_type: 'configuration',
        field_value_json: ['SOC2', 'ISO27001', 'GDPR', 'HIPAA', 'PCI_DSS'],
        smart_code: 'HERA.SEC.CONFIG.COMPLIANCE.v1',
        ai_confidence: 1.0,
        is_system_field: true
      },
      {
        entity_id: platformEntity[0].id,
        field_name: 'audit_retention',
        field_type: 'configuration',
        field_value_text: '7_years',
        smart_code: 'HERA.SEC.CONFIG.RETENTION.v1',
        ai_confidence: 1.0,
        is_system_field: true
      },
      {
        entity_id: platformEntity[0].id,
        field_name: 'max_organizations',
        field_type: 'limit',
        field_value_number: 10000,
        smart_code: 'HERA.SEC.CONFIG.LIMIT.ORGS.v1',
        ai_confidence: 1.0,
        is_system_field: true
      },
      {
        entity_id: platformEntity[0].id,
        field_name: 'session_timeout',
        field_type: 'configuration',
        field_value_text: '8_hours',
        smart_code: 'HERA.SEC.CONFIG.SESSION.v1',
        ai_confidence: 1.0,
        is_system_field: true
      }
    ];
    
    for (const config of enterpriseConfig) {
      const { error: configError } = await supabase
        .from('core_dynamic_data')
        .upsert({
          organization_id: platformOrgId,
          ...config,
          smart_code_status: 'active',
          validation_status: 'valid',
          is_required: true,
          is_searchable: false
        });
        
      if (configError) {
        console.error(`❌ Error creating config ${config.field_name}:`, configError);
      } else {
        console.log(`   ✅ ${config.field_name}: ${config.field_value_text || config.field_value_number || 'JSON array'}`);
      }
    }
    
    console.log('\n🚀 Platform Organization Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Platform ID: ${platformOrgId}`);
    console.log(`🏛️ Organization: HERA Platform`);
    console.log(`🔐 Security Tier: Enterprise`);
    console.log(`📋 Compliance: SOC2, ISO27001, GDPR, HIPAA, PCI_DSS`);
    console.log(`⏰ Audit Retention: 7 years`);
    console.log(`👥 Max Organizations: 10,000`);
    console.log(`🕒 Session Timeout: 8 hours`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return {
      platformOrgId,
      platformEntityId: platformEntity[0].id,
      success: true
    };
    
  } catch (error) {
    console.error('💥 Critical Error:', error);
    return { success: false, error };
  }
}

// Execute if called directly
if (require.main === module) {
  createPlatformOrganization()
    .then(result => {
      if (result && result.success) {
        console.log('✅ Setup completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Setup failed:', result ? result.error : 'Unknown error');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { createPlatformOrganization };