import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qqagokigwuujyeyrgdkq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMzAwNzUsImV4cCI6MjA1MDgwNjA3NX0.cHDV_te3s0J6fV96lG-x_DkYVZFqVCFqjfj1pWLZSfw'
)

async function check() {
  console.log('\n🔍 Checking Entity Types...\n')

  const { data: entities } = await supabase
    .from('core_entities')
    .select('entity_type')
    .limit(1000)

  if (!entities) {
    console.log('❌ No entities found')
    return
  }

  const typeCounts = {}
  entities.forEach(e => {
    typeCounts[e.entity_type] = (typeCounts[e.entity_type] || 0) + 1
  })

  console.log('Entity Types Found:')
  Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`)
  })
}

check()
