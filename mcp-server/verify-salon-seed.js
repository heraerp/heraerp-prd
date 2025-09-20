const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role

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

async function verifySalonSeed() {
  console.log('🔍 Verifying salon seed data...\n')
  
  try {
    // Check dynamic data
    console.log('1️⃣ Checking dynamic data policies...')
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('field_name, smart_code, field_value_json')
      .eq('organization_id', SALON_ORG_ID)
      .in('field_name', ['SALES_POLICY.v1', 'SYSTEM_SETTINGS.v1', 'NOTIFICATION_POLICY.v1', 'ROLE_GRANTS.v1'])
    
    if (dynamicError) {
      console.error('Error:', dynamicError)
    } else {
      console.log(`Found ${dynamicData?.length || 0} policies:`)
      dynamicData?.forEach(d => {
        console.log(`  ✅ ${d.field_name} - ${d.smart_code}`)
        console.log(`     Value preview:`, JSON.stringify(d.field_value_json).substring(0, 100) + '...')
      })
    }
    
    // Check entities
    console.log('\n2️⃣ Checking entities...')
    const { data: entities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('entity_type, entity_name, smart_code')
      .eq('organization_id', SALON_ORG_ID)
    
    if (entitiesError) {
      console.error('Error:', entitiesError)
    } else {
      console.log(`Found ${entities?.length || 0} entities:`)
      entities?.forEach(e => {
        console.log(`  ✅ ${e.entity_type}: ${e.entity_name} - ${e.smart_code}`)
      })
    }
    
    // Check relationships
    console.log('\n3️⃣ Checking relationships...')
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('relationship_type, smart_code')
      .eq('organization_id', SALON_ORG_ID)
    
    if (relError) {
      console.error('Error:', relError)
    } else {
      console.log(`Found ${relationships?.length || 0} relationships:`)
      relationships?.forEach(r => {
        console.log(`  ✅ ${r.relationship_type} - ${r.smart_code}`)
      })
    }
    
    // Check transactions
    console.log('\n4️⃣ Checking transactions...')
    const { data: transactions, error: txnError } = await supabase
      .from('universal_transactions')
      .select('transaction_type, smart_code')
      .eq('organization_id', SALON_ORG_ID)
      .limit(5)
    
    if (txnError) {
      console.error('Error:', txnError)
    } else {
      console.log(`Found ${transactions?.length || 0} transactions:`)
      transactions?.forEach(t => {
        console.log(`  ✅ ${t.transaction_type} - ${t.smart_code}`)
      })
    }
    
    console.log('\n✨ Verification complete!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

verifySalonSeed()