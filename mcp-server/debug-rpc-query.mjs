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

const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Hairtalkz org
const platformOrg = '00000000-0000-0000-0000-000000000000'

console.log('🔍 Debugging why apps_per_org returns duplicates...\n')

try {
  // Simulate the apps_per_org CTE query from the RPC function
  const { data, error } = await supabase
    .from('core_relationships')
    .select(`
      id,
      organization_id,
      to_entity_id,
      relationship_type,
      relationship_data,
      is_active
    `)
    .eq('relationship_type', 'ORG_HAS_APP')
    .eq('organization_id', orgId)

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  console.log(`📊 ORG_HAS_APP relationships for org ${orgId}:\n`)
  console.log(`   Found ${data.length} relationship(s)\n`)

  for (const rel of data) {
    console.log(`Relationship ${rel.id}:`)
    console.log(`   To Entity: ${rel.to_entity_id}`)
    console.log(`   Active: ${rel.is_active !== false}`)

    // Get the app entity details
    const { data: appEntity, error: appError } = await supabase
      .from('core_entities')
      .select('id, entity_code, entity_name, entity_type, organization_id')
      .eq('id', rel.to_entity_id)
      .single()

    if (appError) {
      console.error(`   ❌ Error fetching app entity:`, appError)
    } else {
      console.log(`   App: ${appEntity.entity_code} - ${appEntity.entity_name}`)
      console.log(`   App Entity Type: ${appEntity.entity_type}`)
      console.log(`   App Org ID: ${appEntity.organization_id}`)
      console.log(`   Is Platform App: ${appEntity.organization_id === platformOrg}`)
    }
    console.log('')
  }

  // Now check if there are multiple APP entities with the same code
  const { data: allApps, error: allAppsError } = await supabase
    .from('core_entities')
    .select('id, entity_code, entity_name, organization_id')
    .eq('entity_type', 'APP')

  if (allAppsError) {
    console.error('❌ Error fetching all apps:', allAppsError)
  } else {
    console.log(`\n📱 All APP entities in database:\n`)
    const appsByCode = {}
    allApps.forEach(app => {
      if (!appsByCode[app.entity_code]) {
        appsByCode[app.entity_code] = []
      }
      appsByCode[app.entity_code].push(app)
    })

    Object.entries(appsByCode).forEach(([code, apps]) => {
      console.log(`   ${code}: ${apps.length} entity/entities`)
      apps.forEach(app => {
        const orgType = app.organization_id === platformOrg ? 'PLATFORM' : app.organization_id
        console.log(`      - ${app.entity_name} (${app.id}) in ${orgType}`)
      })
    })

    const duplicateCodes = Object.entries(appsByCode).filter(([code, apps]) => apps.length > 1)
    if (duplicateCodes.length > 0) {
      console.log(`\n⚠️  Found duplicate APP entity codes!`)
      console.log(`   This could cause the RPC JOIN to create multiple rows`)
    }
  }

} catch (err) {
  console.error('❌ Error:', err.message)
  console.error(err.stack)
  process.exit(1)
}
