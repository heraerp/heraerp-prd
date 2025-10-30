import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 Checking core_organizations schema...\n')

  // Try to fetch one row to see the structure
  const { data, error } = await supabase
    .from('core_organizations')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (data && data.length > 0) {
    console.log('✅ Table structure (columns):')
    Object.keys(data[0]).forEach(key => {
      console.log(`   - ${key}: ${typeof data[0][key]}`)
    })
    console.log('\n📋 Sample row:')
    console.log(data[0])
  } else {
    console.log('⚠️ Table is empty')
  }
}

checkSchema()
