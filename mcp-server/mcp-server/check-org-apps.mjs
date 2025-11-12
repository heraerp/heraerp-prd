import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Checking organization apps for duplicates...\n')

// Get the user's organization from session
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError) {
  console.error('❌ Auth error:', authError)
  process.exit(1)
}

// Query organization apps via the introspection API
const { data, error } = await supabase.rpc('hera_user_introspection_v2', {
  p_user_id: user?.id
})

if (error) {
  console.error('❌ Query error:', error)
  process.exit(1)
}

console.log('📊 Introspection result:')
console.log('User Entity ID:', data?.user_entity_id)
console.log('Default Org:', data?.default_organization_id)
console.log('\n📱 Organizations and their apps:\n')

if (data?.organizations) {
  data.organizations.forEach((org, idx) => {
    console.log(`${idx + 1}. ${org.name} (${org.id})`)
    console.log(`   Code: ${org.code}`)
    console.log(`   Role: ${org.primary_role}`)
    console.log(`   Apps (${org.apps?.length || 0}):`)
    
    if (org.apps && org.apps.length > 0) {
      const appCodes = {}
      org.apps.forEach((app, appIdx) => {
        const isDuplicate = appCodes[app.code] ? '⚠️  DUPLICATE!' : ''
        appCodes[app.code] = (appCodes[app.code] || 0) + 1
        console.log(`      ${appIdx + 1}. ${app.name} (${app.code}) ${isDuplicate}`)
      })
      
      // Show duplicate summary
      const duplicates = Object.entries(appCodes).filter(([code, count]) => count > 1)
      if (duplicates.length > 0) {
        console.log(`\n   ⚠️  DUPLICATES FOUND:`)
        duplicates.forEach(([code, count]) => {
          console.log(`      - ${code} appears ${count} times`)
        })
      }
    }
    console.log('')
  })
}

// Also check the raw database table
console.log('\n🗄️  Checking raw core_organization_apps table...\n')

const { data: rawApps, error: rawError } = await supabase
  .from('core_organization_apps')
  .select('*')
  .order('organization_id, app_code')

if (!rawError && rawApps) {
  console.log(`Total app installations: ${rawApps.length}\n`)
  
  const byOrg = {}
  rawApps.forEach(app => {
    if (!byOrg[app.organization_id]) {
      byOrg[app.organization_id] = []
    }
    byOrg[app.organization_id].push(app)
  })
  
  Object.entries(byOrg).forEach(([orgId, apps]) => {
    console.log(`Org ${orgId}: ${apps.length} app(s)`)
    const appCodes = {}
    apps.forEach(app => {
      appCodes[app.app_code] = (appCodes[app.app_code] || 0) + 1
      console.log(`   - ${app.app_code} (installed: ${app.installed_at})`)
    })
    
    const duplicates = Object.entries(appCodes).filter(([code, count]) => count > 1)
    if (duplicates.length > 0) {
      console.log(`   ⚠️  DUPLICATES:`)
      duplicates.forEach(([code, count]) => {
        console.log(`      ${code}: ${count} times`)
      })
    }
    console.log('')
  })
}

console.log('✅ Done')
