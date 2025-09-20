const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Use anon key to test RLS

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

async function testSalonSettings() {
  console.log('🧪 Testing salon settings retrieval...\n')
  
  try {
    // Get the organization config entity
    console.log('1️⃣ Finding organization config entity...')
    const { data: orgEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'organization_config')
      .maybeSingle()
    
    if (entityError) {
      console.error('Error finding org entity:', entityError)
      return
    }
    
    if (!orgEntity) {
      console.error('No organization config entity found')
      return
    }
    
    console.log('✅ Found org config entity:', orgEntity.id)
    
    // Test each setting retrieval
    const settingKeys = ['SALES_POLICY.v1', 'SYSTEM_SETTINGS.v1', 'NOTIFICATION_POLICY.v1', 'ROLE_GRANTS.v1']
    
    console.log('\n2️⃣ Testing setting retrievals...')
    for (const key of settingKeys) {
      const { data, error } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('organization_id', SALON_ORG_ID)
        .eq('entity_id', orgEntity.id)
        .eq('field_name', key)
        .maybeSingle()
      
      if (error) {
        console.error(`❌ Error retrieving ${key}:`, error.message)
      } else if (!data) {
        console.log(`⚠️  ${key}: Not found`)
      } else {
        console.log(`✅ ${key}: Retrieved successfully`)
        console.log(`   Value:`, JSON.stringify(data.field_value_json, null, 2).split('\n').slice(0, 3).join('\n') + '...')
      }
    }
    
    console.log('\n✨ Test complete!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testSalonSettings()