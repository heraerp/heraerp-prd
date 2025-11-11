import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Query the function definition from Postgres
const { data, error } = await supabase.rpc('pg_get_functiondef', {
  funcid: (await supabase
    .from('pg_proc')
    .select('oid')
    .eq('proname', 'hera_dynamic_data_batch_v1')
    .single()).data?.oid
})

console.log('Function signature check - error:', error)
console.log('Function signature check - data:', data)
