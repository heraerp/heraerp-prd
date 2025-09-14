#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';

async function createSettingsData() {
  console.log('⚙️  Creating Kerala Vision Settings Data...\n');

  // Default system settings
  const defaultSettings = {
    // General Settings
    org_name: 'Kerala Vision Internet Services Pvt Ltd',
    business_id: 'KL2019ISP0001',
    fiscal_year_start: 'april',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    date_format: 'DD/MM/YYYY',
    
    // Network Configuration
    network_uptime_threshold: 99.5,
    bandwidth_reserve: 20,
    max_oversubscription_ratio: '1:8',
    latency_threshold: 50,
    packet_loss_threshold: 0.5,
    auto_failover: true,
    bgp_enabled: true,
    
    // Billing & Revenue Rules
    billing_cycle: 'monthly',
    payment_due_days: 7,
    late_fee_percentage: 2,
    auto_suspend_days: 15,
    tax_rate: 18,
    invoice_prefix: 'KV-INV-',
    prorate_billing: true,
    auto_invoice: true,
    
    // Customer Management
    min_contract_period: 3,
    installation_fee: 1500,
    security_deposit: 2000,
    customer_portal: true,
    auto_renewal: true,
    referral_bonus: 500,
    churn_alert_days: 30,
    
    // Field Agent Configuration
    base_commission_rate: 10,
    new_customer_bonus: 1000,
    performance_threshold: 90,
    performance_bonus_rate: 5,
    territory_overlap: false,
    agent_app_required: true,
    
    // Alerts & Notifications
    email_notifications: true,
    sms_notifications: true,
    notification_email: 'admin@keralavision.com',
    alert_phone: '+91 98765 43210',
    revenue_alert_threshold: 10,
    network_alert_cooldown: 30,
    
    // Meta
    last_updated: new Date().toISOString(),
    version: '1.0.0'
  };

  // Check if settings already exist
  const { data: existing } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('entity_type', 'system_settings')
    .single();

  if (existing) {
    // Update existing settings
    const { error } = await supabase
      .from('core_entities')
      .update({
        metadata: defaultSettings
      })
      .eq('id', existing.id);

    if (!error) {
      console.log('✅ Settings updated successfully!');
    } else {
      console.error('❌ Error updating settings:', error.message);
    }
  } else {
    // Create new settings entity
    const { error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        entity_type: 'system_settings',
        entity_name: 'Kerala Vision System Settings',
        entity_code: 'SETTINGS-001',
        smart_code: 'HERA.ISP.CONFIG.SYSTEM.SETTINGS.v1',
        metadata: defaultSettings
      });

    if (!error) {
      console.log('✅ Settings created successfully!');
    } else {
      console.error('❌ Error creating settings:', error.message);
    }
  }

  // Create business rules transactions for audit trail
  console.log('\n📋 Creating business rules audit trail...');
  
  const businessRules = [
    {
      rule_type: 'billing',
      rule_name: 'Monthly Billing Cycle',
      rule_value: 'Payment due 7 days after invoice',
      impact: 'high'
    },
    {
      rule_type: 'network',
      rule_name: 'Uptime SLA',
      rule_value: '99.5% minimum uptime guarantee',
      impact: 'critical'
    },
    {
      rule_type: 'agent',
      rule_name: 'Commission Structure',
      rule_value: '10% base + 5% performance bonus',
      impact: 'medium'
    }
  ];

  for (const rule of businessRules) {
    const { error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        transaction_type: 'config_change',
        transaction_code: `RULE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        smart_code: 'HERA.ISP.CONFIG.RULE.CHANGE.v1',
        metadata: {
          ...rule,
          changed_by: 'System Administrator',
          change_type: 'initial_setup'
        }
      });

    if (!error) {
      console.log(`  ✓ Created rule: ${rule.rule_name}`);
    }
  }

  console.log('\n✅ Settings data creation complete!');
  console.log('\n🚀 Visit http://localhost:3003/isp/settings to manage configuration!');
}

createSettingsData();