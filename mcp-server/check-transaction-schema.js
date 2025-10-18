/**
 * Check the actual schema of universal_transactions table
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  console.log('🔍 Checking universal_transactions schema\n')

  // Try to query one row to see available columns
  const { data, error } = await supabase
    .from('universal_transactions')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Error:', error)
  } else {
    if (data && data.length > 0) {
      console.log('✅ Sample transaction record:')
      console.log(JSON.stringify(data[0], null, 2))
      console.log('\n📋 Available columns:')
      console.log(Object.keys(data[0]).join(', '))
    } else {
      console.log('⚠️  No transactions found in database')
      console.log('Checking table structure via PostgREST...')

      // Try inserting with minimal fields to see what's required
      const { error: insertError } = await supabase
        .from('universal_transactions')
        .insert({})
        .select()

      console.log('Insert error (shows required fields):', insertError)
    }
  }

  // Also check universal_transaction_lines
  console.log('\n🔍 Checking universal_transaction_lines schema\n')

  const { data: linesData, error: linesError } = await supabase
    .from('universal_transaction_lines')
    .select('*')
    .limit(1)

  if (linesError) {
    console.error('❌ Error:', linesError)
  } else {
    if (linesData && linesData.length > 0) {
      console.log('✅ Sample transaction line record:')
      console.log(JSON.stringify(linesData[0], null, 2))
      console.log('\n📋 Available columns:')
      console.log(Object.keys(linesData[0]).join(', '))
    } else {
      console.log('⚠️  No transaction lines found')
    }
  }

  // Check core_entities for reference
  console.log('\n🔍 Checking core_entities schema\n')

  const { data: entitiesData, error: entitiesError } = await supabase
    .from('core_entities')
    .select('*')
    .limit(1)

  if (entitiesError) {
    console.error('❌ Error:', entitiesError)
  } else {
    if (entitiesData && entitiesData.length > 0) {
      console.log('📋 core_entities columns:')
      console.log(Object.keys(entitiesData[0]).join(', '))
    }
  }

  // Check core_relationships
  console.log('\n🔍 Checking core_relationships schema\n')

  const { data: relsData, error: relsError } = await supabase
    .from('core_relationships')
    .select('*')
    .limit(1)

  if (relsError) {
    console.error('❌ Error:', relsError)
  } else {
    if (relsData && relsData.length > 0) {
      console.log('📋 core_relationships columns:')
      console.log(Object.keys(relsData[0]).join(', '))
    }
  }
}

checkSchema().catch(console.error)
