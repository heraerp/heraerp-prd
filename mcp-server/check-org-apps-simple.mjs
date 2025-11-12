import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Use service role with auth bypass
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
)

console.log('🔍 Checking organization apps for duplicates...\n')

const orgId = process.env.DEFAULT_ORGANIZATION_ID

if (!orgId) {
  console.error('❌ DEFAULT_ORGANIZATION_ID not set in .env')
  process.exit(1)
}

console.log(`📊 Checking organization: ${orgId}\n`)

try {
  // Query the apps table
  const { data, error } = await supabase
    .from('core_organization_apps')
    .select('*')
    .eq('organization_id', orgId)
    .order('installed_at')

  if (error) {
    console.error('❌ Query error:', error)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No apps found for this organization')
    process.exit(0)
  }

  console.log(`Total app installations: ${data.length}\n`)

  const appCodes = {}
  data.forEach((app, idx) => {
    const isDuplicate = appCodes[app.app_code] ? '⚠️  DUPLICATE!' : ''
    appCodes[app.app_code] = (appCodes[app.app_code] || 0) + 1

    console.log(`${idx + 1}. ${app.app_code} ${isDuplicate}`)
    console.log(`   ID: ${app.id}`)
    console.log(`   Installed: ${app.installed_at}`)
    console.log(`   Status: ${app.status}`)
    console.log('')
  })

  // Show duplicate summary
  const duplicates = Object.entries(appCodes).filter(([code, count]) => count > 1)
  if (duplicates.length > 0) {
    console.log(`\n⚠️  DUPLICATES FOUND:\n`)
    duplicates.forEach(([code, count]) => {
      console.log(`   - ${code} appears ${count} times`)
    })
    console.log('\n💡 Fix: Remove duplicate entries from core_organization_apps table')
  } else {
    console.log('✅ No duplicates found!')
  }

} catch (err) {
  console.error('❌ Error:', err.message)
  process.exit(1)
}
