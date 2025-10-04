const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkData() {
  console.log('\n=== Checking Service Categories ===')
  const { data: categories, error: catError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'service_category')
    .eq('is_deleted', false)
    .limit(10)

  if (catError) {
    console.error('Category query error:', catError)
  } else {
    console.log('Categories found:', categories?.length || 0)
    categories?.forEach(c => {
      console.log(`  - ${c.entity_name} (${c.id}) - org: ${c.organization_id}`)
    })
  }

  console.log('\n=== Checking Services ===')
  const { data: services, error: svcError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'service')
    .eq('is_deleted', false)
    .limit(10)

  if (svcError) {
    console.error('Service query error:', svcError)
  } else {
    console.log('Services found:', services?.length || 0)
    services?.forEach(s => {
      console.log(`  - ${s.entity_name} (${s.id}) - org: ${s.organization_id}`)
    })
  }

  console.log('\n=== Checking Organizations ===')
  const { data: orgs, error: orgError } = await supabase
    .from('core_organizations')
    .select('*')
    .limit(5)

  if (orgError) {
    console.error('Org query error:', orgError)
  } else {
    console.log('Organizations found:', orgs?.length || 0)
    orgs?.forEach(o => {
      console.log(`  - ${o.organization_name} (${o.id})`)
    })
  }
}

checkData().then(() => process.exit(0))
