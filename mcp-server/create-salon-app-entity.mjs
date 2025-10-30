#!/usr/bin/env node
/**
 * Create SALON APP entity in PLATFORM organization
 *
 * Since hera_apps_register_v1 is not yet deployed, we'll create the entity directly
 * using the Supabase client with proper HERA DNA patterns.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Platform organization UUID (canonical constant)
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000';
const TEST_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'; // michele user

console.log('🎨 Creating SALON APP entity in PLATFORM organization\n');

// SALON APP entity data
const salonApp = {
  organization_id: PLATFORM_ORG_ID,
  entity_type: 'APP',
  entity_code: 'SALON',
  entity_name: 'HERA Salon Management',
  entity_description: 'Complete salon management solution with appointments, POS, inventory, and reports',
  smart_code: 'HERA.PLATFORM.APP.ENTITY.SALON.v1',
  status: 'active',
  business_rules: {
    modules: ['appointments', 'pos', 'inventory', 'reports', 'customers', 'staff'],
    subscription_plans: ['basic', 'professional', 'premium', 'enterprise'],
    features: {
      appointments: {
        enabled: true,
        calendar: true,
        reminders: true,
        recurring: true
      },
      pos: {
        enabled: true,
        payments: ['cash', 'card', 'digital'],
        receipts: true,
        refunds: true
      },
      inventory: {
        enabled: true,
        stock_alerts: true,
        suppliers: true,
        purchase_orders: true
      },
      reports: {
        enabled: true,
        dashboard: true,
        analytics: true,
        exports: ['pdf', 'excel', 'csv']
      }
    }
  },
  metadata: {
    ui_route: '/salon',
    icon: 'scissors',
    color_theme: 'gold',
    default_currency: 'AED',
    supported_languages: ['en', 'ar'],
    category: 'retail',
    industry: 'beauty_wellness'
  },
  created_by: TEST_USER_ID,
  updated_by: TEST_USER_ID,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

console.log('📝 App Data:');
console.log(`   Code: ${salonApp.entity_code}`);
console.log(`   Name: ${salonApp.entity_name}`);
console.log(`   Smart Code: ${salonApp.smart_code}`);
console.log(`   Organization: ${PLATFORM_ORG_ID} (PLATFORM)\n`);

// Check if SALON app already exists
console.log('🔍 Checking if SALON app already exists...');
const { data: existingApp, error: checkError } = await supabase
  .from('core_entities')
  .select('id, entity_name, entity_code, smart_code')
  .eq('organization_id', PLATFORM_ORG_ID)
  .eq('entity_type', 'APP')
  .eq('entity_code', 'SALON')
  .single();

if (existingApp) {
  console.log('⚠️  SALON app already exists:');
  console.log(`   ID: ${existingApp.id}`);
  console.log(`   Name: ${existingApp.entity_name}`);
  console.log(`   Smart Code: ${existingApp.smart_code}\n`);
  console.log('✅ No action needed - SALON app is already registered\n');
  process.exit(0);
}

console.log('✅ SALON app does not exist yet. Creating...\n');

// Insert the SALON app entity
const { data: newApp, error: insertError } = await supabase
  .from('core_entities')
  .insert(salonApp)
  .select()
  .single();

if (insertError) {
  console.error('❌ Error creating SALON app:', insertError);
  process.exit(1);
}

console.log('✅ SALON APP created successfully!\n');
console.log('📋 App Details:');
console.log(`   ID: ${newApp.id}`);
console.log(`   Name: ${newApp.entity_name}`);
console.log(`   Code: ${newApp.entity_code}`);
console.log(`   Smart Code: ${newApp.smart_code}`);
console.log(`   Status: ${newApp.status}`);
console.log(`   Organization: ${newApp.organization_id}\n`);

console.log('🎉 HERA SALON APP is now registered in the PLATFORM organization!');
console.log('   You can now use hera_org_link_app_v1 to install it in tenant organizations.\n');
