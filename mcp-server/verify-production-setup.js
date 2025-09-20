#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyProductionSetup() {
  console.log('🔍 Verifying PRODUCTION Platform Setup...\n');
  
  try {
    const platformOrgId = '00000000-0000-0000-0000-000000000000';
    const salonOrgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
    
    // 1. Verify Platform Organization
    console.log('📋 Step 1: Verifying Platform Organization...');
    const { data: platformOrg, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_code, organization_type')
      .eq('id', platformOrgId)
      .single();
      
    if (orgError || !platformOrg) {
      console.error('❌ Platform organization not found:', orgError);
      return { success: false };
    }
    
    console.log(`✅ Platform Org: ${platformOrg.organization_name} (${platformOrg.organization_type})`);
    
    // 2. Verify Platform System User
    console.log('\n📋 Step 2: Verifying Platform System User...');
    const { data: platformUsers, error: userError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, smart_code, smart_code_status')
      .eq('organization_id', platformOrgId)
      .eq('entity_type', 'user');
      
    if (userError) {
      console.error('❌ Error querying platform users:', userError);
      return { success: false };
    }
    
    console.log(`✅ Found ${platformUsers.length} platform user(s):`);
    platformUsers.forEach(user => {
      console.log(`   • ${user.entity_name} (${user.entity_code})`);
      console.log(`     Smart Code: ${user.smart_code} (${user.smart_code_status})`);
    });
    
    // 3. Verify Salon Organization Anchor
    console.log('\n📋 Step 3: Verifying Salon Organization Anchor...');
    const { data: salonAnchors, error: anchorError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, smart_code, smart_code_status')
      .eq('organization_id', salonOrgId)
      .eq('entity_type', 'org_anchor');
      
    if (anchorError) {
      console.error('❌ Error querying salon anchors:', anchorError);
      return { success: false };
    }
    
    console.log(`✅ Found ${salonAnchors.length} salon anchor(s):`);
    salonAnchors.forEach(anchor => {
      console.log(`   • ${anchor.entity_name} (${anchor.entity_code})`);
      console.log(`     Smart Code: ${anchor.smart_code} (${anchor.smart_code_status})`);
    });
    
    // 4. Verify Dynamic Data Configuration
    console.log('\n📋 Step 4: Verifying Dynamic Data Configuration...');
    const { data: configs, error: configError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_text, field_value_number, field_value_json, smart_code')
      .in('organization_id', [platformOrgId, salonOrgId])
      .eq('is_system_field', true);
      
    if (configError) {
      console.error('❌ Error querying configurations:', configError);
      return { success: false };
    }
    
    console.log(`✅ Found ${configs.length} system configuration(s):`);
    configs.forEach(config => {
      const value = config.field_value_text || config.field_value_number || 
                    (config.field_value_json ? JSON.stringify(config.field_value_json) : 'null');
      console.log(`   • ${config.field_name}: ${value}`);
      console.log(`     Smart Code: ${config.smart_code}`);
    });
    
    // 5. Smart Code Pattern Validation
    console.log('\n📋 Step 5: Validating Smart Code Patterns...');
    const smartCodePattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;
    
    // Check entity smart codes
    const allEntitySmartCodes = [...platformUsers, ...salonAnchors].map(e => e.smart_code);
    const allConfigSmartCodes = configs.map(c => c.smart_code);
    const allSmartCodes = [...allEntitySmartCodes, ...allConfigSmartCodes];
    
    let validCount = 0;
    let invalidCount = 0;
    
    allSmartCodes.forEach(smartCode => {
      const isValid = smartCodePattern.test(smartCode);
      if (isValid) {
        validCount++;
        console.log(`   ✅ ${smartCode}`);
      } else {
        invalidCount++;
        console.log(`   ❌ ${smartCode}`);
      }
    });
    
    console.log(`\n📊 Smart Code Validation Summary:`);
    console.log(`   ✅ Valid: ${validCount}`);
    console.log(`   ❌ Invalid: ${invalidCount}`);
    console.log(`   📊 Total: ${allSmartCodes.length}`);
    
    const allValid = invalidCount === 0;
    const hasRequiredEntities = platformUsers.length > 0 && salonAnchors.length > 0;
    const hasConfig = configs.length > 0;
    
    console.log('\n🚀 PRODUCTION SETUP VERIFICATION COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏛️ Platform Organization: ${platformOrg ? '✅' : '❌'}`);
    console.log(`👤 Platform System User: ${hasRequiredEntities ? '✅' : '❌'}`);
    console.log(`⚓ Salon Organization Anchor: ${salonAnchors.length > 0 ? '✅' : '❌'}`);
    console.log(`⚙️ Enterprise Configuration: ${hasConfig ? '✅' : '❌'}`);
    console.log(`🧠 Smart Code Compliance: ${allValid ? '✅ PRODUCTION READY' : '❌ NEEDS FIXING'}`);
    console.log(`🔐 Ready for Auth Bridging: ${allValid && hasRequiredEntities ? '✅' : '❌'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return {
      success: allValid && hasRequiredEntities && hasConfig,
      platformOrg,
      platformUsers,
      salonAnchors,
      configs,
      smartCodeCompliance: { valid: validCount, invalid: invalidCount, total: allSmartCodes.length }
    };
    
  } catch (error) {
    console.error('💥 Verification Error:', error);
    return { success: false, error };
  }
}

// Execute if called directly
if (require.main === module) {
  verifyProductionSetup()
    .then(result => {
      if (result && result.success) {
        console.log('✅ PRODUCTION Setup verification passed');
        process.exit(0);
      } else {
        console.error('❌ PRODUCTION Setup verification failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { verifyProductionSetup };