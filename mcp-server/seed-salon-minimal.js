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

async function upsert(table, rows) {
  for (const row of rows) {
    const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' })
    if (error) {
      console.error(`❌ ${table} upsert failed:`, error.message)
    } else {
      console.log(`✅ ${table}: ${row.entity_name || row.field_name || row.transaction_type || 'row'} inserted/updated`)
    }
  }
}

async function seedSalonMinimal() {
  console.log('🌱 Seeding minimal Salon data...\n')

  // Check if organization exists first
  const { data: org, error: orgError } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .eq('id', '0fd09e31-d257-4329-97eb-7d7f522ed6f0')
    .single()
  
  if (orgError) {
    console.error('❌ Organization not found:', orgError.message)
    return
  }
  
  console.log('✅ Found organization:', org.organization_name)
  console.log('\n📦 Creating entities...')

  // 1. Platform-level user entity
  await upsert('core_entities', [
    {
      id: '11111111-1111-4111-8111-111111111111',
      organization_id: '00000000-0000-0000-0000-000000000000',
      entity_type: 'user',
      entity_name: 'Demo Receptionist',
      entity_code: 'USER.DEMO.RECEPTIONIST',
      smart_code: 'HERA.AUTH.IDENTITY.USER.PLATFORM.v1',
      business_rules: { source: 'supabase' },
      metadata: { supabase_user_id: 'demo|salon-receptionist' },
      status: 'active'
    }
  ])

  // 2. Tenant org anchor
  await upsert('core_entities', [
    {
      id: '9c62b61a-144b-459b-a660-3d8d2f152bed',
      organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
      entity_type: 'organization_anchor',
      entity_name: 'Salon HQ Anchor',
      entity_code: 'ORG.ANCHOR.SALON',
      smart_code: 'HERA.SALON.ANCHOR.ORG.ENTITY.CONFIG.v1',
      status: 'active'
    }
  ])

  console.log('\n🔗 Creating relationships...')
  
  // 3. Membership relationship
  await upsert('core_relationships', [
    {
      id: '22222222-2222-4222-8222-222222222222',
      organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
      from_entity_id: '11111111-1111-4111-8111-111111111111',
      to_entity_id: '9c62b61a-144b-459b-a660-3d8d2f152bed',
      relationship_type: 'ORG_MEMBERSHIP',
      relationship_data: { role: 'RECEPTIONIST', scopes: ['appointments.read','appointments.write'] },
      smart_code: 'HERA.AUTH.MEMBERSHIP.SALON.RECEPTIONIST.v1',
      is_active: true
    }
  ])

  console.log('\n📋 Creating policies...')
  
  // 4. Dynamic policies
  await upsert('core_dynamic_data', [
    {
      id: '33333333-3333-4333-8333-333333333333',
      organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
      entity_id: '6d7833a9-c910-4e9b-9e9f-215b9dc616af', // organization_config entity we created earlier
      field_name: 'ROLE_GRANTS.v1',
      field_type: 'json',
      field_value_json: {
        RECEPTIONIST: { scopes: ['appointments.read','appointments.write'] },
        STYLIST: { scopes: ['appointments.read','services.read'] },
        MANAGER: { scopes: ['ops.full','finance.read'] },
        OWNER: { scopes: ['admin.full','finance.full'] }
      },
      smart_code: 'HERA.SALON.POLICY.ROLE.GRANTS.CONFIG.v1'
    },
    {
      id: '33333333-3333-4333-8333-333333333334',
      organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
      entity_id: '6d7833a9-c910-4e9b-9e9f-215b9dc616af', // organization_config entity we created earlier
      field_name: 'SYSTEM_SETTINGS.v1',
      field_type: 'json',
      field_value_json: { 
        currency: 'AED', 
        vat_rate: 0.05, 
        timezone: 'Asia/Dubai',
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
      },
      smart_code: 'HERA.SALON.POLICY.SYSTEM_SETTINGS.v1'
    },
    {
      id: '33333333-3333-4333-8333-333333333335',
      organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
      entity_id: '6d7833a9-c910-4e9b-9e9f-215b9dc616af', // organization_config entity we created earlier
      field_name: 'SALES_POLICY.v1',
      field_type: 'json',
      field_value_json: { 
        commission_model: 'standard',
        commission_rate: 0.35,
        tip_enabled: true,
        include_tips_in_commission: false,
        vat_rate: 0.05,
        auto_calculate_tax: true,
        tax_inclusive_pricing: false,
        currency: 'AED',
        payment_methods: ['cash', 'card', 'digital_wallet']
      },
      smart_code: 'HERA.SALON.POLICY.SALES.CONFIG.MAIN.v1'
    },
    {
      id: '33333333-3333-4333-8333-333333333336',
      organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
      entity_id: '6d7833a9-c910-4e9b-9e9f-215b9dc616af', // organization_config entity we created earlier
      field_name: 'NOTIFICATION_POLICY.v1',
      field_type: 'json',
      field_value_json: { 
        whatsapp_enabled: true,
        opt_in_required: true,
        appointment_confirmed: { enabled: true, channels: ['email'] },
        appointment_reminder: { enabled: true, channels: ['sms'] },
        pos_payment_received: { enabled: true, channels: ['email'] }
      },
      smart_code: 'HERA.SALON.POLICY.NOTIFY.CONFIG.MAIN.v1'
    }
  ])

  console.log('\n📝 Creating audit transaction...')
  
  // 5. Login audit event
  await upsert('universal_transactions', [
    {
      id: '44444444-4444-4444-8444-444444444444',
      organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
      transaction_type: 'AUTH_LOGIN',
      transaction_code: 'LOGIN.DEMO.RECEPTIONIST',
      smart_code: 'HERA.AUTH.LOGIN.SALON.DEMO.TRACK.v1',
      transaction_date: new Date().toISOString(),
      business_context: {
        from_entity_id: '11111111-1111-4111-8111-111111111111',
        to_entity_id: '9c62b61a-144b-459b-a660-3d8d2f152bed',
        role: 'RECEPTIONIST'
      },
      total_amount: 0
    }
  ])

  console.log('\n🔍 Verifying seed data...')
  
  // Verify the data
  const checks = [
    { table: 'core_entities', filter: { id: '11111111-1111-4111-8111-111111111111' }, name: 'Platform User' },
    { table: 'core_entities', filter: { id: '9c62b61a-144b-459b-a660-3d8d2f152bed' }, name: 'Salon Anchor' },
    { table: 'core_relationships', filter: { id: '22222222-2222-4222-8222-222222222222' }, name: 'Membership' },
    { 
      table: 'core_dynamic_data', 
      filter: { organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0' }, 
      name: 'Dynamic Policies' 
    },
    { table: 'universal_transactions', filter: { id: '44444444-4444-4444-8444-444444444444' }, name: 'Login Event' }
  ]

  for (const check of checks) {
    const { count, error } = await supabase
      .from(check.table)
      .select('*', { count: 'exact', head: true })
      .match(check.filter)
    
    if (error) {
      console.log(`❌ ${check.name}: Error - ${error.message}`)
    } else {
      console.log(`${count > 0 ? '✅' : '❌'} ${check.name}: ${count} records`)
    }
  }

  console.log('\n✨ Minimal Salon seed complete!')
  console.log('\n📱 Next steps:')
  console.log('1. The salon dashboard should now load without 400 errors')
  console.log('2. Settings queries (SALES_POLICY.v1, etc.) should return data')
  console.log('3. The demo receptionist session should work properly')
}

seedSalonMinimal().catch(console.error)