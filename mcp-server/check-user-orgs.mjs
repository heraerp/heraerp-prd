import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

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

console.log('🔍 Checking user organizations and apps...\n')

const userEmail = 'hairtalkz2022@gmail.com' // The demo user

try {
  // Get auth user
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Auth error:', authError)
    process.exit(1)
  }

  const authUser = users.find(u => u.email === userEmail)
  if (!authUser) {
    console.error(`❌ User not found: ${userEmail}`)
    process.exit(1)
  }

  console.log(`👤 User: ${authUser.email} (${authUser.id})`)
  const userEntityId = authUser.user_metadata?.hera_user_entity_id || authUser.id
  console.log(`   User Entity ID: ${userEntityId}\n`)

  // Call the introspection function
  const { data: introspection, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
    p_actor_user_id: userEntityId
  })

  if (introspectError) {
    console.error('❌ Introspection error:', introspectError)
    process.exit(1)
  }

  console.log('📊 Introspection result:\n')
  console.log(`   Organization count: ${introspection.organization_count}`)
  console.log(`   Default org ID: ${introspection.default_organization_id}`)
  console.log(`   Default app: ${introspection.default_app}\n`)

  console.log('🏢 Organizations:\n')
  introspection.organizations.forEach((org, idx) => {
    console.log(`${idx + 1}. ${org.name} (${org.code})`)
    console.log(`   ID: ${org.id}`)
    console.log(`   Role: ${org.primary_role}`)
    console.log(`   Apps (${org.apps.length}):`)
    org.apps.forEach((app, appIdx) => {
      console.log(`      ${appIdx + 1}. ${app.code} - ${app.name}`)
    })
    console.log('')
  })

  // Check for duplicate apps ACROSS organizations
  const allApps = introspection.organizations.flatMap(org => org.apps.map(app => ({
    orgId: org.id,
    orgName: org.name,
    appCode: app.code,
    appName: app.name
  })))

  console.log(`📱 Total app installations across all orgs: ${allApps.length}\n`)

  const appCodeCounts = {}
  allApps.forEach(app => {
    if (!appCodeCounts[app.appCode]) {
      appCodeCounts[app.appCode] = []
    }
    appCodeCounts[app.appCode].push(`${app.orgName} (${app.orgId})`)
  })

  const duplicateCodes = Object.entries(appCodeCounts).filter(([code, orgs]) => orgs.length > 1)
  if (duplicateCodes.length > 0) {
    console.log('⚠️  Same app code appears in multiple organizations:\n')
    duplicateCodes.forEach(([code, orgs]) => {
      console.log(`   ${code}:`)
      orgs.forEach(org => console.log(`      - ${org}`))
    })
    console.log('\n💡 This could cause duplicate keys if all apps are merged into one array!')
  } else {
    console.log('✅ No app codes are duplicated across organizations')
  }

} catch (err) {
  console.error('❌ Error:', err.message)
  console.error(err.stack)
  process.exit(1)
}
