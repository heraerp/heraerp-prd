#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Getting RPC function definition...\n')

const { data, error } = await supabase.rpc('pg_get_functiondef', {
  func_oid: '\'hera_microapp_catalog_v2\'::regproc'
})

if (error) {
  console.error('❌ Error:', error.message)
  
  // Try alternative method
  console.log('\nTrying query from pg_proc...')
  
  const { data: procData, error: procError } = await supabase
    .from('pg_proc')
    .select('*')
    .ilike('proname', 'hera_microapp_catalog%')
    .limit(5)
  
  if (procError) {
    console.error('❌ Query error:', procError.message)
  } else {
    console.log('Found functions:', procData?.map(p => p.proname))
  }
} else {
  console.log('Function definition:')
  console.log(data)
}
