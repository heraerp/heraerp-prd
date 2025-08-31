#!/usr/bin/env node

/**
 * Check production database for Kochi Ice Cream data
 */

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase with service role key for full access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const KOCHI_ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

async function checkProductionData() {
  console.log('🔍 Checking production database for Kochi Ice Cream data...\n')
  console.log(`Organization ID: ${KOCHI_ORG_ID}`)
  console.log(`Supabase URL: ${supabaseUrl}\n`)

  try {
    // 1. Check if organization exists
    console.log('1️⃣ Checking organization...')
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', KOCHI_ORG_ID)
      .single()

    if (orgError) {
      console.log('❌ Organization not found:', orgError.message)
      console.log('\n💡 The organization needs to be created first.')
      return
    }

    console.log(`✅ Organization found: ${org.organization_name}`)
    console.log(`   Type: ${org.organization_type || 'Not set'}`)
    console.log(`   Code: ${org.organization_code || 'Not set'}`)

    // 2. Count entities by type
    console.log('\n2️⃣ Checking entities...')
    const entityTypes = ['product', 'location', 'raw_material', 'supplier', 'recipe', 'gl_account']
    
    for (const entityType of entityTypes) {
      const { count, error } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', KOCHI_ORG_ID)
        .eq('entity_type', entityType)

      if (error) {
        console.log(`   ❌ Error counting ${entityType}: ${error.message}`)
      } else {
        console.log(`   ${entityType}: ${count || 0}`)
      }
    }

    // 3. Check for demo route mapping
    console.log('\n3️⃣ Checking demo route mapping...')
    const SYSTEM_ORG_ID = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'
    
    const { data: mappings, error: mappingError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SYSTEM_ORG_ID)
      .eq('entity_type', 'demo_route_mapping')

    if (mappingError) {
      console.log('   ❌ Error checking mappings:', mappingError.message)
    } else {
      console.log(`   Found ${mappings?.length || 0} demo route mappings in system org`)
      
      // Check for /icecream mapping
      if (mappings && mappings.length > 0) {
        for (const mapping of mappings) {
          const { data: routeData } = await supabase
            .from('core_dynamic_data')
            .select('field_name, field_value_text')
            .eq('entity_id', mapping.id)
            .in('field_name', ['route_path', 'target_org_id'])

          const route = routeData?.find(d => d.field_name === 'route_path')?.field_value_text
          const targetOrg = routeData?.find(d => d.field_name === 'target_org_id')?.field_value_text
          
          if (route === '/icecream') {
            console.log(`   ✅ Found /icecream route mapping to: ${targetOrg}`)
            if (targetOrg !== KOCHI_ORG_ID) {
              console.log(`   ⚠️  WARNING: Route maps to different org ID!`)
            }
          }
        }
      }
    }

    // 4. Check recent transactions
    console.log('\n4️⃣ Checking transactions...')
    const { data: txns, error: txnError } = await supabase
      .from('universal_transactions')
      .select('transaction_type, created_at')
      .eq('organization_id', KOCHI_ORG_ID)
      .order('created_at', { ascending: false })
      .limit(5)

    if (txnError) {
      console.log('   ❌ Error checking transactions:', txnError.message)
    } else if (txns && txns.length > 0) {
      console.log(`   Found ${txns.length} recent transactions:`)
      txns.forEach(txn => {
        console.log(`   - ${txn.transaction_type} (${new Date(txn.created_at).toLocaleDateString()})`)
      })
    } else {
      console.log('   No transactions found')
    }

    // 5. Summary and recommendations
    console.log('\n📊 Summary:')
    const { count: totalEntities } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', KOCHI_ORG_ID)

    console.log(`   Total entities: ${totalEntities || 0}`)

    if (!totalEntities || totalEntities === 0) {
      console.log('\n⚠️  No data found for Kochi Ice Cream!')
      console.log('\n💡 To fix this, run:')
      console.log('   node setup-kochi-icecream.js')
      console.log('\n   This will create all necessary master data.')
    } else {
      console.log('\n✅ Kochi Ice Cream has data in production!')
      console.log('\n💡 If the dashboard is still empty, check:')
      console.log('   1. Browser console for any errors')
      console.log('   2. Network tab to see if API calls are failing')
      console.log('   3. Ensure the app is using the correct Supabase URL')
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }
}

// Run the check
checkProductionData()