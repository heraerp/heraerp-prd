#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS
)

async function checkSchema() {
  console.log('Checking core_entities table schema...\n')
  
  try {
    // Try to get one record to see the actual columns
    const { data, error } = await supabase
      .from('core_entities')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error:', error)
      return
    }
    
    if (data && data.length > 0) {
      console.log('Available columns in core_entities:')
      console.log(Object.keys(data[0]).join(', '))
      console.log('\nSample data:')
      console.log(JSON.stringify(data[0], null, 2))
    } else {
      console.log('No data found, trying to insert minimal record...')
      
      // Try minimal insert to see what's required
      const { error: insertError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: 'f0af4ced-9d12-4a55-a649-b484368db249',
          entity_type: 'test',
          entity_code: 'TEST-001',
          entity_name: 'Test Entity'
        })
      
      if (insertError) {
        console.log('Insert error reveals required fields:', insertError.message)
      }
    }
  } catch (e) {
    console.error('Exception:', e)
  }
}

checkSchema()