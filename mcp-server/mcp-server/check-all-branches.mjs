import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read .env from parent directory
const envPath = resolve('../../.env')
const envContent = readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
  }
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // HairTalkz org

async function checkAllBranches() {
  console.log('🏢 Checking All Branches for Opening/Closing Times\n')
  console.log('=' .repeat(80))

  // Fetch all branches
  const { data: branches, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_type', 'BRANCH')
    .eq('status', 'active')
    .order('entity_name')

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`\nFound ${branches.length} active branches:\n`)

  const branchesWithHours = []
  const branchesWithoutHours = []

  for (const branch of branches) {
    // Fetch dynamic fields
    const { data: dynamicFields } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', branch.id)

    const openingTime = dynamicFields?.find(f => f.field_name === 'opening_time')
    const closingTime = dynamicFields?.find(f => f.field_name === 'closing_time')

    const branchInfo = {
      name: branch.entity_name,
      code: branch.entity_code,
      id: branch.id,
      opening: openingTime?.field_value_text || null,
      closing: closingTime?.field_value_text || null
    }

    if (openingTime && closingTime) {
      branchesWithHours.push(branchInfo)
    } else {
      branchesWithoutHours.push(branchInfo)
    }
  }

  // Display branches WITH hours
  if (branchesWithHours.length > 0) {
    console.log('✅ Branches WITH Operating Hours:\n')
    branchesWithHours.forEach(branch => {
      console.log(`   📍 ${branch.name} (${branch.code})`)
      console.log(`      Opening: ${branch.opening}`)
      console.log(`      Closing: ${branch.closing}`)
      console.log(`      ID: ${branch.id}`)
      console.log('')
    })
  }

  // Display branches WITHOUT hours
  if (branchesWithoutHours.length > 0) {
    console.log('=' .repeat(80))
    console.log(`\n⚠️  Branches WITHOUT Operating Hours (${branchesWithoutHours.length}):\n`)
    branchesWithoutHours.forEach(branch => {
      console.log(`   📍 ${branch.name} (${branch.code})`)
      console.log(`      ID: ${branch.id}`)
      console.log('')
    })
  }

  console.log('=' .repeat(80))
  console.log('\n📊 Summary:')
  console.log(`   ✅ With hours: ${branchesWithHours.length}`)
  console.log(`   ⚠️  Without hours: ${branchesWithoutHours.length}`)
  console.log(`   📍 Total branches: ${branches.length}`)
}

checkAllBranches().catch(console.error)
