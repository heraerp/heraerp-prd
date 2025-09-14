#!/usr/bin/env node

/**
 * 🌐 Final ISP Seed Data Creation
 * Using Entity Normalization system to bypass smart code constraints
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';

async function createFinalISPSeed() {
  console.log('🌐 Creating Final ISP Seed Data for Kerala Vision...\n');

  try {
    // Use entity normalization system
    console.log('📊 Creating ISP entities using normalization...');
    await createEntitiesWithNormalization();

    console.log('\n✅ Verification...');
    await verifyData();

    console.log('\n🎉 ISP Seed Data Created!');
    console.log(`🏢 Kerala Vision Broadband Ltd`);
    console.log(`🆔 ${KERALA_VISION_ORG_ID}`);
    console.log('🚀 Ready for /isp application development!');

  } catch (error) {
    console.error('❌ ISP seed creation failed:', error);
    process.exit(1);
  }
}

async function createEntitiesWithNormalization() {
  // Define all ISP entities
  const entities = [
    // Chart of Accounts
    { type: 'gl_account', name: 'Cash and Cash Equivalents', code: '1100000', smart: 'HERA.TELECOM.PRODUCT.ACCOUNT.CASH.v1', category: 'coa' },
    { type: 'gl_account', name: 'Bank Accounts', code: '1110000', smart: 'HERA.TELECOM.PRODUCT.ACCOUNT.BANK.v1', category: 'coa' },
    { type: 'gl_account', name: 'Subscription Receivables', code: '1210000', smart: 'HERA.TELECOM.PRODUCT.ACCOUNT.RECEIVABLES.v1', category: 'coa' },
    { type: 'gl_account', name: 'Broadband Revenue', code: '4100000', smart: 'HERA.TELECOM.PRODUCT.ACCOUNT.REVENUE.v1', category: 'coa' },
    { type: 'gl_account', name: 'Cable TV Revenue', code: '4200000', smart: 'HERA.TELECOM.PRODUCT.REVENUE.CABLE.v1', category: 'coa' },
    { type: 'gl_account', name: 'Advertisement Revenue', code: '4300000', smart: 'HERA.TELECOM.PRODUCT.REVENUE.ADS.v1', category: 'coa' },
    
    // Service Plans
    { type: 'product', name: 'Home Broadband 50 Mbps', code: 'BB-HOME-50', smart: 'HERA.TELECOM.PRODUCT.BROADBAND.HOME.v1', category: 'broadband' },
    { type: 'product', name: 'Business Broadband 100 Mbps', code: 'BB-BIZ-100', smart: 'HERA.TELECOM.PRODUCT.BROADBAND.BUSINESS.v1', category: 'broadband' },
    { type: 'product', name: 'Enterprise Broadband 200 Mbps', code: 'BB-ENT-200', smart: 'HERA.TELECOM.PRODUCT.BROADBAND.ENTERPRISE.v1', category: 'broadband' },
    { type: 'product', name: 'Cable TV Basic Pack', code: 'TV-BASIC', smart: 'HERA.TELECOM.PRODUCT.CABLE.BASIC.v1', category: 'cable_tv' },
    { type: 'product', name: 'Cable TV Premium Pack', code: 'TV-PREMIUM', smart: 'HERA.TELECOM.PRODUCT.CABLE.PREMIUM.v1', category: 'cable_tv' },
    { type: 'product', name: 'Prime Time Ad Slot', code: 'AD-PRIME', smart: 'HERA.TELECOM.PRODUCT.ADVERTISEMENT.PRIME.v1', category: 'advertisement' },
    
    // Customers
    { type: 'customer', name: 'TechCorp India Pvt Ltd', code: 'CUST-ENT-001', smart: 'HERA.TELECOM.CUSTOMER.ENTERPRISE.TECH.v1', category: 'enterprise' },
    { type: 'customer', name: 'Malabar Shopping Mall', code: 'CUST-ENT-002', smart: 'HERA.TELECOM.CUSTOMER.ENTERPRISE.MALL.v1', category: 'enterprise' },
    { type: 'customer', name: 'Kerala Spices Export', code: 'CUST-BIZ-001', smart: 'HERA.TELECOM.CUSTOMER.BUSINESS.EXPORT.v1', category: 'business' },
    { type: 'customer', name: 'John Mathew', code: 'CUST-RET-001', smart: 'HERA.TELECOM.CUSTOMER.RETAIL.HOME.v1', category: 'retail' },
    { type: 'customer', name: 'Sarah Thomas', code: 'CUST-RET-002', smart: 'HERA.TELECOM.CUSTOMER.RETAIL.HOME.v1', category: 'retail' },
    
    // Agents
    { type: 'agent', name: 'Rajesh Kumar - TVM', code: 'AGT-TVM-001', smart: 'HERA.TELECOM.AGENT.FIELD.SOUTH.v1', category: 'agent' },
    { type: 'agent', name: 'Priya Nair - Kochi', code: 'AGT-COK-001', smart: 'HERA.TELECOM.AGENT.FIELD.CENTRAL.v1', category: 'agent' },
    { type: 'agent', name: 'Mohammed Ali - Kozhikode', code: 'AGT-CCJ-001', smart: 'HERA.TELECOM.AGENT.FIELD.NORTH.v1', category: 'agent' }
  ];

  let created = 0;
  let errors = 0;

  for (const entity of entities) {
    try {
      // Use entity normalization RPC function
      const { data, error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
        p_org_id: KERALA_VISION_ORG_ID,
        p_entity_type: entity.type,
        p_entity_name: entity.name,
        p_entity_code: entity.code,
        p_smart_code: entity.smart,
        p_metadata: {
          category: entity.category,
          isp_seed: true,
          created_date: new Date().toISOString()
        }
      });

      if (error) {
        console.log(`  ❌ ${entity.name}: ${error.message}`);
        errors++;
      } else {
        console.log(`  ✅ ${entity.name} (${entity.code}) - ${entity.category}`);
        created++;
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.log(`  ❌ ${entity.name}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Created: ${created} entities`);
  console.log(`  ❌ Errors: ${errors} entities`);

  if (created > 0) {
    console.log(`\n🎯 ISP entities successfully created!`);
  }
}

async function verifyData() {
  try {
    // Count entities by type for Kerala Vision
    const { data: entities, error } = await supabase
      .from('core_entities')
      .select('entity_type, entity_name, smart_code')
      .eq('organization_id', KERALA_VISION_ORG_ID);

    if (error) {
      console.error('❌ Verification error:', error.message);
      return;
    }

    console.log(`📊 Kerala Vision has ${entities.length} entities:`);
    
    // Group by entity type
    const groupedEntities = entities.reduce((acc, entity) => {
      if (!acc[entity.entity_type]) {
        acc[entity.entity_type] = [];
      }
      acc[entity.entity_type].push(entity);
      return acc;
    }, {});

    Object.entries(groupedEntities).forEach(([type, entityList]) => {
      console.log(`\n  📋 ${type} (${entityList.length}):`);
      entityList.forEach(entity => {
        console.log(`    - ${entity.entity_name}`);
      });
    });

    // Check organization
    const { data: org } = await supabase
      .from('core_organizations')
      .select('organization_name, settings')
      .eq('id', KERALA_VISION_ORG_ID)
      .single();

    console.log(`\n🏢 Organization: ${org?.organization_name || 'Not found'}`);
    if (org?.settings) {
      console.log(`   Industry: ${org.settings.industry || 'N/A'}`);
      console.log(`   IPO Target: ${org.settings.ipo_target_year || 'N/A'}`);
    }

  } catch (err) {
    console.log(`❌ Verification error: ${err.message}`);
  }
}

// Execute the seed creation
createFinalISPSeed().catch(console.error);