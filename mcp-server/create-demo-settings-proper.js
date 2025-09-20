const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDemoSettings() {
  console.log('🔧 Creating demo organization settings...\n');
  
  const organizationId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz
  
  // First, create or get the organization settings entity
  let settingsEntity;
  
  // Check if settings entity exists
  const { data: existingEntity } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'org_settings')
    .single();
    
  if (existingEntity) {
    console.log('✅ Organization settings entity already exists');
    settingsEntity = existingEntity;
  } else {
    // Create settings entity
    const { data: newEntity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'org_settings',
        entity_name: 'Hair Talkz Salon Settings',
        entity_code: 'SETTINGS-HAIRTALKZ',
        smart_code: 'HERA.SALON.SETTINGS.ENT.CONFIG.v1',
        status: 'active'
      })
      .select()
      .single();
      
    if (entityError) {
      console.error('❌ Error creating settings entity:', entityError);
      return;
    }
    
    console.log('✅ Created organization settings entity');
    settingsEntity = newEntity;
  }
  
  const settings = [
    {
      organization_id: organizationId,
      entity_id: settingsEntity.id,
      field_name: 'SALES_POLICY.v1',
      field_value_json: {
        allow_negative_quantity: false,
        allow_backorders: false,
        require_customer: true,
        auto_reserve_inventory: true,
        payment_terms_days: 30,
        default_tax_rate: 0.05
      },
      field_value_text: 'Sales policy for salon',
      smart_code: 'HERA.SALON.POL.DYN.SALES.v1'
    },
    {
      organization_id: organizationId,
      entity_id: settingsEntity.id,
      field_name: 'INVENTORY_POLICY.v1',
      field_value_json: {
        track_inventory: true,
        allow_negative_stock: false,
        reorder_point_multiplier: 2,
        safety_stock_days: 7,
        auto_reorder: false
      },
      field_value_text: 'Inventory policy for salon products',
      smart_code: 'HERA.SALON.POL.DYN.INV.v1'
    },
    {
      organization_id: organizationId,
      entity_id: settingsEntity.id,
      field_name: 'NOTIFICATION_POLICY.v1',
      field_value_json: {
        email_on_booking: true,
        email_on_cancellation: true,
        sms_reminders: true,
        reminder_hours_before: 24,
        notification_email: 'manager@hairtalkz.com'
      },
      field_value_text: 'Notification settings',
      smart_code: 'HERA.SALON.POL.DYN.NOTIFY.v1'
    },
    {
      organization_id: organizationId,
      entity_id: settingsEntity.id,
      field_name: 'SYSTEM_SETTINGS.v1',
      field_value_json: {
        timezone: 'Asia/Dubai',
        date_format: 'DD/MM/YYYY',
        currency: 'AED',
        language: 'en',
        working_hours: {
          monday: { open: '09:00', close: '21:00' },
          tuesday: { open: '09:00', close: '21:00' },
          wednesday: { open: '09:00', close: '21:00' },
          thursday: { open: '09:00', close: '21:00' },
          friday: { open: '10:00', close: '22:00' },
          saturday: { open: '09:00', close: '22:00' },
          sunday: { open: '10:00', close: '20:00' }
        }
      },
      field_value_text: 'System settings',
      smart_code: 'HERA.SALON.SYS.DYN.CONFIG.v1'
    },
    {
      organization_id: organizationId,
      entity_id: settingsEntity.id,
      field_name: 'ROLE_GRANTS.v1',
      field_value_json: {
        admin: ['all'],
        manager: ['read', 'write', 'delete'],
        receptionist: ['read', 'write:appointments', 'write:customers'],
        stylist: ['read:appointments', 'read:customers', 'write:services']
      },
      field_value_text: 'Role permissions',
      smart_code: 'HERA.SALON.SEC.DYN.ROLES.v1'
    }
  ];
  
  for (const setting of settings) {
    // Check if it already exists
    const { data: existing } = await supabase
      .from('core_dynamic_data')
      .select('id')
      .eq('organization_id', setting.organization_id)
      .eq('field_name', setting.field_name)
      .single();
      
    if (existing) {
      console.log(`✅ ${setting.field_name} already exists`);
      continue;
    }
    
    // Create the setting
    const { data, error } = await supabase
      .from('core_dynamic_data')
      .insert(setting)
      .select()
      .single();
      
    if (error) {
      console.error(`❌ Error creating ${setting.field_name}:`, error);
    } else {
      console.log(`✅ Created ${setting.field_name}`);
    }
  }
  
  console.log('\n✨ Demo settings setup complete!');
}

createDemoSettings().catch(console.error);