#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  try {
    const { data, error } = await supabase
      .from('core_organizations')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error:', error.message)
      return
    }

    console.log('Available columns in core_organizations:')
    if (data && data.length > 0) {
      console.log(Object.keys(data[0]))
    } else {
      console.log('No data found, creating a simple organization entry')
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkSchema()