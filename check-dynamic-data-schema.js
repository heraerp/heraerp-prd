import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  console.log('Checking core_dynamic_data schema...\n')
  
  // Get a sample record to see the actual columns
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error:', error)
  } else if (data && data.length > 0) {
    console.log('Sample record columns:')
    console.log(Object.keys(data[0]))
    console.log('\nSample record:')
    console.log(JSON.stringify(data[0], null, 2))
  } else {
    console.log('No records found')
  }
}

checkSchema()
