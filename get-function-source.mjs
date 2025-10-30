#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getFunctionSource() {
  // Query to get function definition from PostgreSQL
  const query = `
    SELECT
      pg_get_functiondef(p.oid) as function_definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'hera_entities_crud_v1'
    AND n.nspname = 'public'
  `

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: query }).single()

  if (error) {
    console.error('Error fetching function:', error)
    console.log('\nTrying alternative method...\n')

    // Alternative: Use information_schema
    const altQuery = `
      SELECT routine_definition
      FROM information_schema.routines
      WHERE routine_name = 'hera_entities_crud_v1'
      AND routine_schema = 'public'
    `

    const { data: altData, error: altError } = await supabase.rpc('exec_sql', { sql_query: altQuery })

    if (altError) {
      console.error('Alternative method also failed:', altError)
      return
    }

    console.log('Function definition:')
    console.log(altData)
    return
  }

  console.log('Function definition retrieved successfully!')

  if (data && data.function_definition) {
    const filename = 'hera_entities_crud_v1_current.sql'
    fs.writeFileSync(filename, data.function_definition)
    console.log(`Saved to: ${filename}`)

    // Check for the error pattern
    if (data.function_definition.includes('source_entity_id')) {
      console.log('\n⚠️  WARNING: Function contains "source_entity_id"')
      console.log('This needs to be changed to "from_entity_id" for core_relationships table')
    }
  }
}

getFunctionSource().catch(console.error)
