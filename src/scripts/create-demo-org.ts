#!/usr/bin/env tsx

/**
 * Create Demo Organization in Supabase
 * Smart Code: HERA.SCRIPT.CREATE.DEMO_ORG.v1
 * 
 * This script creates the actual Demo Organization (00000000000001) in Supabase
 * for testing the CRM Sales/Lead Management module.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_ORG_NAME = 'HERA Demo Organization';
const DEMO_ORG_CODE = 'DEMO-ORG-001';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function createDemoOrganization() {
  console.log('🏗️  Creating Demo Organization in Supabase...');
  console.log(`📋 Organization ID: ${DEMO_ORG_ID}`);
  console.log(`🏢 Organization Name: ${DEMO_ORG_NAME}`);
  console.log('');

  try {
    // Step 1: Check if organization already exists
    console.log('🔍 Step 1: Checking if organization already exists...');
    
    const { data: existingOrg, error: checkError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, status')
      .eq('id', DEMO_ORG_ID)
      .single();

    if (existingOrg && !checkError) {
      console.log(`✅ Organization already exists: ${existingOrg.organization_name} (${existingOrg.status})`);
      console.log('🎯 Demo Organization is ready for use!');
      return existingOrg;
    }

    // Step 2: Create the organization
    console.log('📦 Step 2: Creating new organization...');
    
    const organizationData = {
      id: DEMO_ORG_ID,
      organization_name: DEMO_ORG_NAME,
      organization_code: DEMO_ORG_CODE,
      organization_type: 'demo',
      industry_classification: 'technology',
      settings: {
        industry: 'technology',
        currency: 'USD',
        timezone: 'America/New_York',
        demo_environment: true,
        crm_modules: ['sales_leads', 'customer_support', 'marketing'],
        created_via: 'demo_script',
        purpose: 'CRM Sales/Lead Management Demo',
        test_data_included: true
      },
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // For demo purposes, we'll use a system user UUID
      created_by: '00000000-0000-0000-0000-000000000000',
      updated_by: '00000000-0000-0000-0000-000000000000'
    };

    const { data: newOrg, error: createError } = await supabase
      .from('core_organizations')
      .insert(organizationData)
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create organization: ${createError.message}`);
    }

    console.log(`✅ Organization created successfully!`);
    console.log(`   - ID: ${newOrg.id}`);
    console.log(`   - Name: ${newOrg.organization_name}`);
    console.log(`   - Code: ${newOrg.organization_code}`);
    console.log(`   - Status: ${newOrg.status}`);

    // Step 3: Create test user entities for demo accounts
    console.log('👤 Step 3: Creating demo user accounts...');
    
    const demoUsers = [
      {
        id: 'demo_user_sales_rep_001',
        entity_type: 'USER',
        entity_name: 'Alice Johnson',
        entity_code: 'USER-DEMO-001',
        organization_id: DEMO_ORG_ID,
        status: 'ACTIVE',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      },
      {
        id: 'demo_user_sales_manager_001',
        entity_type: 'USER', 
        entity_name: 'Bob Smith',
        entity_code: 'USER-DEMO-002',
        organization_id: DEMO_ORG_ID,
        status: 'ACTIVE',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      },
      {
        id: 'demo_user_admin_001',
        entity_type: 'USER',
        entity_name: 'Demo Admin',
        entity_code: 'USER-DEMO-003',
        organization_id: DEMO_ORG_ID,
        status: 'ACTIVE',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      }
    ];

    for (const user of demoUsers) {
      const { error: userError } = await supabase
        .from('core_entities')
        .upsert(user, { onConflict: 'id' });

      if (userError) {
        console.warn(`⚠️  Warning: Could not create user ${user.entity_name}: ${userError.message}`);
      } else {
        console.log(`   ✅ Created demo user: ${user.entity_name}`);
      }
    }

    // Step 4: Create demo CRM entities
    console.log('📊 Step 4: Creating demo CRM entities...');
    
    const demoEntities = [
      // Territories
      {
        id: 'demo_territory_001',
        entity_type: 'TERRITORY',
        entity_name: 'North America',
        entity_code: 'TERR-0001',
        organization_id: DEMO_ORG_ID,
        status: 'ACTIVE',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      },
      // Sales Reps
      {
        id: 'demo_sales_rep_001',
        entity_type: 'SALES_REP',
        entity_name: 'Alice Johnson',
        entity_code: 'REP-0001', 
        organization_id: DEMO_ORG_ID,
        status: 'ACTIVE',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      },
      // Customers
      {
        id: 'demo_customer_001',
        entity_type: 'CUSTOMER',
        entity_name: 'Acme Corporation',
        entity_code: 'CUST-0001',
        organization_id: DEMO_ORG_ID,
        status: 'ACTIVE',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      },
      // Leads
      {
        id: 'demo_lead_001',
        entity_type: 'LEAD',
        entity_name: 'Emily Chen',
        entity_code: 'LEAD-0001',
        organization_id: DEMO_ORG_ID,
        status: 'ACTIVE',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      },
      // Opportunities
      {
        id: 'demo_opportunity_001',
        entity_type: 'OPPORTUNITY',
        entity_name: 'Acme ERP Implementation',
        entity_code: 'OPP-0001',
        organization_id: DEMO_ORG_ID,
        status: 'ACTIVE',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      }
    ];

    for (const entity of demoEntities) {
      const { error: entityError } = await supabase
        .from('core_entities')
        .upsert(entity, { onConflict: 'id' });

      if (entityError) {
        console.warn(`⚠️  Warning: Could not create entity ${entity.entity_name}: ${entityError.message}`);
      } else {
        console.log(`   ✅ Created demo entity: ${entity.entity_name} (${entity.entity_type})`);
      }
    }

    // Step 5: Add dynamic data for some entities
    console.log('🔧 Step 5: Adding dynamic data...');
    
    const dynamicData = [
      // Sales Rep dynamic data
      {
        entity_id: 'demo_sales_rep_001',
        field_name: 'first_name',
        field_value: 'Alice',
        field_type: 'text',
        smart_code: 'HERA.CRM.SALES.SALES_REP.FIELD.FIRST_NAME.v1',
        organization_id: DEMO_ORG_ID,
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      },
      {
        entity_id: 'demo_sales_rep_001',
        field_name: 'last_name',
        field_value: 'Johnson',
        field_type: 'text',
        smart_code: 'HERA.CRM.SALES.SALES_REP.FIELD.LAST_NAME.v1',
        organization_id: DEMO_ORG_ID,
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      },
      {
        entity_id: 'demo_sales_rep_001',
        field_name: 'email',
        field_value: 'alice.johnson@demo.com',
        field_type: 'text',
        smart_code: 'HERA.CRM.SALES.SALES_REP.FIELD.EMAIL.v1',
        organization_id: DEMO_ORG_ID,
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      },
      // Lead dynamic data
      {
        entity_id: 'demo_lead_001',
        field_name: 'first_name',
        field_value: 'Emily',
        field_type: 'text',
        smart_code: 'HERA.CRM.SALES.LEAD.FIELD.FIRST_NAME.v1',
        organization_id: DEMO_ORG_ID,
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      },
      {
        entity_id: 'demo_lead_001',
        field_name: 'last_name',
        field_value: 'Chen',
        field_type: 'text',
        smart_code: 'HERA.CRM.SALES.LEAD.FIELD.LAST_NAME.v1',
        organization_id: DEMO_ORG_ID,
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      },
      {
        entity_id: 'demo_lead_001',
        field_name: 'email',
        field_value: 'emily.chen@startup.com',
        field_type: 'text',
        smart_code: 'HERA.CRM.SALES.LEAD.FIELD.EMAIL.v1',
        organization_id: DEMO_ORG_ID,
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      },
      {
        entity_id: 'demo_lead_001',
        field_name: 'lead_score',
        field_value: '75',
        field_type: 'number',
        smart_code: 'HERA.CRM.SALES.LEAD.FIELD.SCORE.v1',
        organization_id: DEMO_ORG_ID,
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_by: '00000000-0000-0000-0000-000000000000'
      }
    ];

    for (const data of dynamicData) {
      const { error: dataError } = await supabase
        .from('core_dynamic_data')
        .upsert(data, { onConflict: 'entity_id,field_name' });

      if (dataError) {
        console.warn(`⚠️  Warning: Could not create dynamic data for ${data.field_name}: ${dataError.message}`);
      }
    }

    console.log(`   ✅ Created ${dynamicData.length} dynamic data records`);

    // Step 6: Summary
    console.log('');
    console.log('🎉 DEMO ORGANIZATION CREATED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    console.log(`Organization ID: ${DEMO_ORG_ID}`);
    console.log(`Organization Name: ${DEMO_ORG_NAME}`);
    console.log(`Organization Code: ${DEMO_ORG_CODE}`);
    console.log(`Status: ACTIVE`);
    console.log('');
    console.log('📊 Demo Data Created:');
    console.log(`- Demo Users: ${demoUsers.length}`);
    console.log(`- CRM Entities: ${demoEntities.length}`);
    console.log(`- Dynamic Data Records: ${dynamicData.length}`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Access CRM Demo at: http://localhost:3000/demo-org/00000000000001/crm-sales');
    console.log('2. Test entity creation and workflows');
    console.log('3. Validate AI-powered features');
    console.log('4. Run comprehensive test suite');

    return newOrg;

  } catch (error) {
    console.error('❌ Failed to create demo organization:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

if (require.main === module) {
  createDemoOrganization().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { createDemoOrganization };