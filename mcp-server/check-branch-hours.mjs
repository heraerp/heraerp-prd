import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkBranchHours() {
  console.log('🏢 Checking Branch Opening/Closing Hours\n')
  console.log('=' .repeat(70))

  // Get organization ID from env
  const orgId = process.env.DEFAULT_ORGANIZATION_ID

  if (!orgId) {
    console.error('❌ DEFAULT_ORGANIZATION_ID not set in .env')
    return
  }

  console.log(`\nOrganization ID: ${orgId}\n`)

  // Fetch branches
  const { data: branches, error: branchError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_type', 'BRANCH')
    .eq('status', 'active')

  if (branchError) {
    console.error('❌ Error fetching branches:', branchError)
    return
  }

  console.log(`Found ${branches.length} branches\n`)

  for (const branch of branches) {
    console.log(`\n📍 Branch: ${branch.entity_name} (${branch.entity_code})`)
    console.log(`   ID: ${branch.id}`)

    // Fetch dynamic fields for this branch
    const { data: dynamicFields, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_id', branch.id)

    if (dynamicError) {
      console.error('   ❌ Error fetching dynamic fields:', dynamicError)
      continue
    }

    console.log(`   Dynamic Fields: ${dynamicFields.length} fields found`)

    const openingTime = dynamicFields.find(f => f.field_name === 'opening_time')
    const closingTime = dynamicFields.find(f => f.field_name === 'closing_time')

    if (openingTime) {
      console.log(`   ✅ Opening Time: ${openingTime.field_value_text}`)
    } else {
      console.log(`   ❌ Opening Time: NOT SET`)
    }

    if (closingTime) {
      console.log(`   ✅ Closing Time: ${closingTime.field_value_text}`)
    } else {
      console.log(`   ❌ Closing Time: NOT SET`)
    }

    if (dynamicFields.length > 0) {
      console.log(`\n   All Dynamic Fields:`)
      dynamicFields.forEach(field => {
        const value = field.field_value_text || 
                     field.field_value_number || 
                     field.field_value_boolean || 
                     field.field_value_date || 
                     JSON.stringify(field.field_value_json)
        console.log(`     - ${field.field_name}: ${value}`)
      })
    }
  }

  console.log('\n' + '=' .repeat(70))
}

checkBranchHours().catch(console.error)
