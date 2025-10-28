#!/usr/bin/env node
/**
 * Create Greenworms ERP Organization
 * Using HERA Enhanced Autobuild System for waste management
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test admin user (we'll create a new one specifically for Greenworms)
const PLATFORM_ADMIN_USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'; // hairtalkz2022@gmail.com

console.log('🌱 Creating Greenworms ERP Organization');
console.log('='.repeat(70));

async function createGreenworms() {
  console.log('\n📋 Creating Greenworms Organization...');
  
  try {
    const { data, error } = await supabase.rpc('hera_organization_create_v1', {
      p_organization_id: randomUUID(),
      p_organization_name: 'Greenworms ERP',
      p_organization_type: 'BUSINESS',
      p_status: 'ACTIVE',
      p_subscription_plan: 'ENTERPRISE',
      p_max_users: 100,
      p_metadata: {
        industry: 'environmental_services',
        base_currency_code: 'INR',
        fiscal_calendar: 'calendar_year',
        time_zone: 'Asia/Kolkata',
        tax_enabled: true,
        default_vat_rate: 0.18,
        posting_bundles: ['finance_dna_v2_2'],
        guardrails_profile: 'hera_guardrails_v2_0',
        modules: [
          'CUSTOMER_MANAGEMENT',
          'SERVICE_MANAGEMENT', 
          'SCHEDULING_DISPATCH',
          'BILLING_INVOICING',
          'FINANCIALS',
          'EXPENSE_TRACKING',
          'INVENTORY_MAINT',
          'FLEET_TRANSPORT',
          'COMPLIANCE_REPORTING',
          'INSPECTIONS',
          'HRM_RECRUITMENT',
          'COMPLAINTS_CRM',
          'ANALYTICS'
        ],
        business_domains: [
          'WASTE_COLLECTION',
          'WASTE_PROCESSING', 
          'RDF_PRODUCTION',
          'FLEET_MANAGEMENT',
          'QUALITY_ASSURANCE',
          'FINANCIAL_MANAGEMENT'
        ],
        service_levels: ['DAILY', 'WEEKLY', 'MONTHLY'],
        contract_types: ['RESIDENTIAL', 'COMMERCIAL', 'MUNICIPAL'],
        pricing_models: ['PER_PICKUP', 'WEIGHT_BASED', 'FIXED_MONTHLY'],
        waste_categories: ['MIXED', 'PLASTIC', 'PAPER', 'METAL', 'ORGANIC', 'RDF_FEED'],
        quality_grades: ['A', 'B', 'C'],
        vehicle_types: ['COMPACTOR', 'HOOK_LOADER', 'FLATBED', 'TIPPER'],
        facility_types: ['MCF', 'MRF', 'RDF_PLANT', 'CEMENT_PLANT', 'RECYCLER'],
        location_types: ['CUSTOMER_SITE', 'MCF', 'MRF', 'RDF_FACILITY', 'CEMENT_PLANT', 'RECYCLER'],
        staff_roles: ['DRIVER', 'HELPER', 'SUPERVISOR', 'INSPECTOR']
      }
    });

    if (error) {
      console.log('   ❌ Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
      return null;
    } else {
      console.log('   ✅ Success!');
      console.log('   Organization ID:', data.organization_id);
      console.log('   Organization Name:', data.organization_name);
      
      // Store organization ID for later use
      console.log('\n🎯 GREENWORMS_ORGANIZATION_ID=' + data.organization_id);
      
      return data;
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message);
    return null;
  }
}

async function createGreenwormsDemoUser(orgId) {
  console.log('\n📋 Creating Greenworms Demo User...');
  
  try {
    // Create user entity for demo purposes
    const { data: userEntity, error: userError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: PLATFORM_ADMIN_USER_ID,
      p_organization_id: orgId,
      p_entity: {
        entity_type: 'USER',
        entity_name: 'Greenworms Admin User',
        smart_code: 'HERA.WASTE.MASTER.USER.ADMIN.v1'
      },
      p_dynamic: {
        email: {
          field_type: 'text',
          field_value_text: 'admin@greenworms.in',
          smart_code: 'HERA.WASTE.MASTER.USER.FIELD.EMAIL.v1'
        },
        role: {
          field_type: 'text', 
          field_value_text: 'ADMIN',
          smart_code: 'HERA.WASTE.MASTER.USER.FIELD.ROLE.v1'
        },
        phone: {
          field_type: 'text',
          field_value_text: '+91-9876543210',
          smart_code: 'HERA.WASTE.MASTER.USER.FIELD.PHONE.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    });

    if (userError) {
      console.log('   ❌ User Error:', userError.message);
    } else {
      console.log('   ✅ Demo User Created!');
      console.log('   User Entity ID:', userEntity.entity_id);
    }

    return userEntity;
  } catch (err) {
    console.log('   ❌ User Exception:', err.message);
    return null;
  }
}

async function main() {
  console.log('\n🚀 Starting Greenworms ERP Organization Setup...');
  
  // Step 1: Create organization
  const org = await createGreenworms();
  if (!org) {
    console.log('\n❌ Failed to create organization. Exiting.');
    process.exit(1);
  }

  // Step 2: Create demo user
  const user = await createGreenwormsDemoUser(org.organization_id);
  
  console.log('\n' + '='.repeat(70));
  console.log('🎉 Greenworms ERP Organization Setup Complete!');
  console.log('');
  console.log('📋 Details:');
  console.log(`   Organization ID: ${org.organization_id}`);
  console.log(`   Organization Name: ${org.organization_name}`);
  console.log(`   Industry: environmental_services`);
  console.log(`   Base Currency: INR`);
  console.log(`   Timezone: Asia/Kolkata`);
  console.log(`   Tax Rate: 18%`);
  if (user) {
    console.log(`   Demo User: admin@greenworms.in`);
    console.log(`   User Entity ID: ${user.entity_id}`);
  }
  console.log('');
  console.log('🔧 Next Steps:');
  console.log('   1. Generate entity CRUD pages using Enhanced HERA Autobuild System');
  console.log('   2. Set GREENWORMS_ORGANIZATION_ID in environment');
  console.log('   3. Run phase-by-phase entity generation');
  console.log('');
  console.log('💡 Copy this environment variable:');
  console.log(`   export GREENWORMS_ORGANIZATION_ID="${org.organization_id}"`);
  console.log('');
}

main().catch(console.error);