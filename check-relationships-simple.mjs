import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qqagokigwuujyeyrgdkq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMzAwNzUsImV4cCI6MjA1MDgwNjA3NX0.cHDV_te3s0J6fV96lG-x_DkYVZFqVCFqjfj1pWLZSfw'
)

async function check() {
  console.log('\n🔍 Checking Services and Relationships...\n')

  // Get one service as example
  const { data: services } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, organization_id')
    .eq('entity_type', 'SERVICE')
    .limit(3)

  if (!services || services.length === 0) {
    console.log('❌ No services found')
    return
  }

  console.log(`✅ Found ${services.length} services (showing first 3):\n`)

  for (const service of services) {
    console.log(`📋 Service: ${service.entity_name} (${service.id})`)
    console.log(`   Org ID: ${service.organization_id}`)

    // Check relationships
    const { data: rels } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('source_entity_id', service.id)

    console.log(`   Relationships: ${rels?.length || 0}`)
    if (rels && rels.length > 0) {
      for (const rel of rels) {
        console.log(`   → ${rel.relationship_type} to ${rel.target_entity_id}`)
        
        // Get target entity info
        const { data: target } = await supabase
          .from('core_entities')
          .select('entity_name, entity_type')
          .eq('id', rel.target_entity_id)
          .single()
        
        if (target) {
          console.log(`      (${target.entity_type}: ${target.entity_name})`)
        }
      }
    }
    console.log('')
  }

  // Check branches
  const { data: branches } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('entity_type', 'BRANCH')
    .limit(5)

  console.log(`🏢 Branches (${branches?.length || 0}):`)
  branches?.forEach(b => console.log(`   📍 ${b.entity_name} (${b.id})`))
}

check()
