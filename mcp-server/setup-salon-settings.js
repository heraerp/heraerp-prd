const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

async function setupSalonSettings() {
  console.log('🎯 Setting up salon organization settings...')
  
  try {
    // Create the organization if it doesn't exist
    console.log('\n1️⃣ Checking organization...')
    const { data: existingOrg, error: checkError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', SALON_ORG_ID)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking organization:', checkError)
      return
    }
    
    if (!existingOrg) {
      console.log('Creating Hair Talkz Salon organization...')
      const { data: newOrg, error: createError } = await supabase
        .from('core_organizations')
        .insert({
          id: SALON_ORG_ID,
          organization_name: 'Hair Talkz Salon',
          organization_code: 'HAIR-TALKZ',
          organization_type: 'salon',
          industry_classification: 'beauty_salon',
          status: 'active',
          settings: {
            business_type: 'salon',
            timezone: 'Asia/Dubai',
            currency: 'AED'
          }
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating organization:', createError)
        return
      }
      console.log('✅ Organization created:', newOrg.organization_name)
    } else {
      console.log('✅ Organization exists:', existingOrg.organization_name)
    }
    
    // Create organization entity for storing settings
    console.log('\n2️⃣ Creating organization entity...')
    
    const { data: orgEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'organization_config')
      .eq('entity_code', 'HAIR-TALKZ-CONFIG')
      .maybeSingle()
    
    let orgEntityId = null
    
    if (!orgEntity) {
      const { data: newEntity, error: createEntityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: SALON_ORG_ID,
          entity_type: 'organization_config',
          entity_code: 'HAIR-TALKZ-CONFIG',
          entity_name: 'Hair Talkz Configuration',
          smart_code: 'HERA.SALON.ORG.CONFIG.SETTINGS.v1',
          status: 'active',
          metadata: {
            description: 'Organization-level configuration and settings'
          }
        })
        .select()
        .single()
      
      if (createEntityError) {
        console.error('Error creating organization entity:', createEntityError)
        return
      }
      
      orgEntityId = newEntity.id
      console.log('✅ Created organization config entity:', newEntity.id)
    } else {
      orgEntityId = orgEntity.id
      console.log('✅ Organization config entity exists:', orgEntity.id)
    }
    
    // Create default settings in core_dynamic_data
    console.log('\n3️⃣ Creating default settings...')
    
    const settings = [
      {
        field_name: 'SALES_POLICY.v1',
        field_value_json: {
          vat_rate: 0.05,
          commission_rate: 0.35,
          include_tips_in_commission: false,
          tips_enabled: true,
          auto_calculate_tax: true,
          tax_inclusive_pricing: false,
          currency: 'AED',
          payment_methods: ['cash', 'card', 'digital_wallet']
        }
      },
      {
        field_name: 'SYSTEM_SETTINGS.v1',
        field_value_json: {
          feature_flags: {
            finance_dna: true,
            auto_journal: true,
            commissions: true,
            whatsapp_integration: false,
            advanced_reporting: true,
            inventory_management: true,
            appointment_booking: true,
            staff_management: true
          }
        }
      },
      {
        field_name: 'NOTIFICATION_POLICY.v1',
        field_value_json: {
          appointment_confirmed: { enabled: true, channels: ['email'] },
          appointment_reminder: { enabled: true, channels: ['sms'] },
          pos_payment_received: { enabled: true, channels: ['email'] }
        }
      },
      {
        field_name: 'ROLE_GRANTS.v1',
        field_value_json: []
      }
    ]
    
    for (const setting of settings) {
      // Check if setting already exists
      const { data: existing, error: checkErr } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('organization_id', SALON_ORG_ID)
        .eq('field_name', setting.field_name)
        .maybeSingle()
      
      if (checkErr && checkErr.code !== 'PGRST116') {
        console.error(`Error checking ${setting.field_name}:`, checkErr)
        continue
      }
      
      if (!existing) {
        const { error: insertError } = await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: SALON_ORG_ID,
            entity_id: orgEntityId, // Use organization config entity ID
            field_name: setting.field_name,
            field_type: 'json',
            field_value_json: setting.field_value_json,
            smart_code: `HERA.SALON.ORG.DYN.SETTINGS.${setting.field_name.replace('.v1', '')}.v1`,
            is_system_field: true
          })
        
        if (insertError) {
          console.error(`Error creating ${setting.field_name}:`, insertError)
        } else {
          console.log(`✅ Created ${setting.field_name}`)
        }
      } else {
        console.log(`✅ ${setting.field_name} already exists`)
      }
    }
    
    console.log('\n✨ Salon settings setup complete!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

setupSalonSettings()