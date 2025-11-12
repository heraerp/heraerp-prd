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

const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const appEntityId = '4041aee9-e638-4b79-a53b-c89e29ea3522'

console.log('🔧 Fixing duplicate ORG_HAS_APP relationships...\n')

try {
  // Step 1: Show current state
  console.log('📊 BEFORE - Current relationships:\n')
  const { data: before, error: beforeError } = await supabase
    .from('core_relationships')
    .select('id, is_active, created_at')
    .eq('relationship_type', 'ORG_HAS_APP')
    .eq('organization_id', orgId)
    .eq('to_entity_id', appEntityId)
    .order('created_at')

  if (beforeError) {
    console.error('❌ Error:', beforeError)
    process.exit(1)
  }

  before.forEach((rel, idx) => {
    console.log(`   ${idx + 1}. ID: ${rel.id}`)
    console.log(`      Active: ${rel.is_active}`)
    console.log(`      Created: ${rel.created_at}`)
    console.log('')
  })

  if (before.length <= 1) {
    console.log('✅ No duplicates found - nothing to fix!')
    process.exit(0)
  }

  // Step 2: Identify which to keep (oldest)
  const keepId = before[0].id
  const deleteIds = before.slice(1).map(r => r.id)

  console.log(`\n🎯 Strategy:`)
  console.log(`   KEEP: ${keepId} (oldest)`)
  console.log(`   DELETE: ${deleteIds.length} duplicate(s)`)
  deleteIds.forEach(id => console.log(`      - ${id}`))

  // Step 3: Delete duplicates
  console.log('\n🗑️  Deleting duplicates...\n')
  const { data: deleted, error: deleteError } = await supabase
    .from('core_relationships')
    .delete()
    .in('id', deleteIds)
    .select()

  if (deleteError) {
    console.error('❌ Delete error:', deleteError)
    process.exit(1)
  }

  console.log(`✅ Deleted ${deleted.length} duplicate relationship(s)`)

  // Step 4: Verify final state
  console.log('\n📊 AFTER - Remaining relationships:\n')
  const { data: after, error: afterError } = await supabase
    .from('core_relationships')
    .select('id, is_active, created_at')
    .eq('relationship_type', 'ORG_HAS_APP')
    .eq('organization_id', orgId)
    .eq('to_entity_id', appEntityId)
    .order('created_at')

  if (afterError) {
    console.error('❌ Error:', afterError)
    process.exit(1)
  }

  after.forEach((rel, idx) => {
    console.log(`   ${idx + 1}. ID: ${rel.id}`)
    console.log(`      Active: ${rel.is_active}`)
    console.log(`      Created: ${rel.created_at}`)
    console.log('')
  })

  if (after.length === 1) {
    console.log('✅ SUCCESS! Only one relationship remains.')
    console.log('\n💡 The React duplicate key warning should now be resolved!')
    console.log('   Refresh your browser to see the fix in action.')
  } else {
    console.log(`⚠️  Warning: Expected 1 relationship, but found ${after.length}`)
  }

} catch (err) {
  console.error('❌ Error:', err.message)
  console.error(err.stack)
  process.exit(1)
}
