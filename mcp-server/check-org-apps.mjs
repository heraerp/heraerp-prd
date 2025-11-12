import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Checking organization apps for duplicates...\n')

// Get DEFAULT_ORGANIZATION_ID from env
const orgId = process.env.DEFAULT_ORGANIZATION_ID

if (!orgId) {
  console.error('❌ DEFAULT_ORGANIZATION_ID not set in .env')
  process.exit(1)
}

console.log(`📊 Checking organization: ${orgId}\n`)

// Check the raw database table
console.log('🗄️  Querying core_organization_apps table...\n')

const { data: rawApps, error: rawError } = await supabase
  .from('core_organization_apps')
  .select('*')
  .eq('organization_id', orgId)
  .order('installed_at')

if (rawError) {
  console.error('❌ Query error:', rawError)
  process.exit(1)
}

if (!rawApps || rawApps.length === 0) {
  console.log('⚠️  No apps found for this organization')
  process.exit(0)
}

console.log(`Total app installations: ${rawApps.length}\n`)

const appCodes = {}
rawApps.forEach((app, idx) => {
  const isDuplicate = appCodes[app.app_code] ? '⚠️  DUPLICATE!' : ''
  appCodes[app.app_code] = (appCodes[app.app_code] || 0) + 1

  console.log(`${idx + 1}. ${app.app_code} ${isDuplicate}`)
  console.log(`   ID: ${app.id}`)
  console.log(`   Installed: ${app.installed_at}`)
  console.log(`   Status: ${app.status}`)
  console.log(`   Config: ${JSON.stringify(app.config)}`)
  console.log('')
})

// Show duplicate summary
const duplicates = Object.entries(appCodes).filter(([code, count]) => count > 1)
if (duplicates.length > 0) {
  console.log(`⚠️  DUPLICATES FOUND:\n`)
  duplicates.forEach(([code, count]) => {
    console.log(`   - ${code} appears ${count} times`)
  })
  console.log('')
  console.log('💡 Recommendation: Remove duplicate app installations from core_organization_apps table')
} else {
  console.log('✅ No duplicates found!')
}

console.log('\n✅ Done')
