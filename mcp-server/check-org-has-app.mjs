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

console.log('🔍 Checking ORG_HAS_APP relationships for duplicates...\n')

const orgId = process.env.DEFAULT_ORGANIZATION_ID

try {
  // Step 1: Query the core_relationships table for ORG_HAS_APP
  const { data, error } = await supabase
    .from('core_relationships')
    .select('id, from_entity_id, to_entity_id, organization_id, relationship_data, is_active, created_at')
    .eq('relationship_type', 'ORG_HAS_APP')
    .eq('organization_id', orgId)
    .order('created_at')

  if (error) {
    console.error('❌ Query error:', error)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No ORG_HAS_APP relationships found for this organization')
    process.exit(0)
  }

  // Step 2: Get app details for each relationship
  const appEntityIds = data.map(r => r.to_entity_id)
  const { data: appEntities, error: appError } = await supabase
    .from('core_entities')
    .select('id, entity_code, entity_name, entity_type')
    .in('id', appEntityIds)

  if (appError) {
    console.error('❌ App entities query error:', appError)
  }

  console.log(`📊 Total ORG_HAS_APP relationships: ${data.length}\n`)

  const appCounts = {}
  data.forEach((rel, idx) => {
    const appEntity = appEntities?.find(e => e.id === rel.to_entity_id)
    const appCode = appEntity?.entity_code || 'UNKNOWN'
    const appName = appEntity?.entity_name || 'Unknown'
    const isDuplicate = appCounts[appCode] ? '⚠️  DUPLICATE!' : ''
    appCounts[appCode] = (appCounts[appCode] || 0) + 1

    console.log(`${idx + 1}. ${appCode} (${appName}) ${isDuplicate}`)
    console.log(`   Relationship ID: ${rel.id}`)
    console.log(`   To Entity ID: ${rel.to_entity_id}`)
    console.log(`   Active: ${rel.is_active !== false}`)
    console.log(`   Created: ${rel.created_at}`)
    console.log('')
  })

  // Show duplicate summary
  const duplicates = Object.entries(appCounts).filter(([code, count]) => count > 1)
  if (duplicates.length > 0) {
    console.log(`\n⚠️  DUPLICATES FOUND:\n`)
    duplicates.forEach(([code, count]) => {
      console.log(`   - ${code} appears ${count} times`)

      // Show the relationship IDs for duplicates
      const dupRels = data.filter(r => {
        const appEntity = appEntities?.find(e => e.id === r.to_entity_id)
        return appEntity?.entity_code === code
      })
      console.log(`     Relationship IDs to delete (keep first, delete rest):`)
      dupRels.slice(1).forEach(r => {
        console.log(`       DELETE FROM core_relationships WHERE id = '${r.id}';`)
      })
    })
    console.log('\n💡 Fix: Run the DELETE statements above to remove duplicates')
  } else {
    console.log('✅ No duplicates found!')
  }

} catch (err) {
  console.error('❌ Error:', err.message)
  process.exit(1)
}
