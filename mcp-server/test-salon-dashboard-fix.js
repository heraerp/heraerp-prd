const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

async function testSalonDashboardFix() {
  console.log('🧪 Testing salon dashboard data access...\n')
  
  try {
    // Test with organization context in headers
    console.log('1️⃣ Creating Supabase client with organization headers...')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'X-Organization-Id': SALON_ORG_ID
        }
      }
    })
    
    // Test organization query
    console.log('\n2️⃣ Testing organization query...')
    const { data: orgData, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', SALON_ORG_ID)
      .maybeSingle()
    
    if (orgError) {
      console.error('❌ Organization query error:', orgError.message)
    } else {
      console.log('✅ Organization found:', orgData?.organization_name || 'No data')
    }
    
    // Find the organization config entity
    console.log('\n3️⃣ Finding organization config entity...')
    const { data: configEntity, error: configError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'organization_config')
      .maybeSingle()
    
    if (configError) {
      console.error('❌ Config entity query error:', configError.message)
    } else if (!configEntity) {
      console.log('⚠️  No config entity found')
    } else {
      console.log('✅ Config entity found:', configEntity.id)
      
      // Test settings queries
      console.log('\n4️⃣ Testing settings queries...')
      const settingKeys = ['SALES_POLICY.v1', 'SYSTEM_SETTINGS.v1', 'NOTIFICATION_POLICY.v1', 'ROLE_GRANTS.v1']
      
      for (const key of settingKeys) {
        const { data, error } = await supabase
          .from('core_dynamic_data')
          .select('*')
          .eq('organization_id', SALON_ORG_ID)
          .eq('field_name', key)
          .maybeSingle()
        
        if (error) {
          console.error(`❌ ${key}: Error - ${error.message}`)
          if (error.message.includes('app.current_org')) {
            console.log('   💡 RLS policy expects app.current_org - need database functions')
          }
        } else if (!data) {
          console.log(`⚠️  ${key}: Not found`)
        } else {
          console.log(`✅ ${key}: Found`)
        }
      }
    }
    
    // Test if we can query entities (for inventory)
    console.log('\n5️⃣ Testing entity queries (for inventory)...')
    const { data: products, error: productError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'product')
      .limit(5)
    
    if (productError) {
      console.error('❌ Product query error:', productError.message)
    } else {
      console.log(`✅ Found ${products?.length || 0} products`)
    }
    
    console.log('\n📋 Summary:')
    console.log('The main issue is that RLS policies expect hera_current_org_id() function')
    console.log('which needs to be created in the database. The SQL script has been')
    console.log('generated at: create-rls-functions.sql')
    console.log('\nTo fix:')
    console.log('1. Run the SQL script in your Supabase SQL editor')
    console.log('2. This will create the necessary functions and update RLS policies')
    console.log('3. The policies will allow demo organizations to be accessed')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testSalonDashboardFix()