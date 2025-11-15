#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTableSchema() {
  console.log('\n🔍 CHECKING universal_transaction_lines SCHEMA\n')

  try {
    // Query information_schema to get column details
    const { data: columns, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'universal_transaction_lines'
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })
      .single()

    if (error) {
      console.log('❌ RPC not available, trying direct query...\n')

      // Get actual data to show column names
      const { data: sample, error: sampleError } = await supabase
        .from('universal_transaction_lines')
        .select('*')
        .limit(1)

      if (sampleError) {
        console.error('❌ Error:', sampleError)
        return
      }

      if (sample && sample.length > 0) {
        console.log('✅ Table columns (from sample data):')
        Object.keys(sample[0]).forEach(col => {
          const value = sample[0][col]
          const type = typeof value
          console.log(`  - ${col}: ${type} = ${JSON.stringify(value)}`)
        })
      }
    } else {
      console.log('✅ Table schema:')
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkTableSchema()
