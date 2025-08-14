#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables manually from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function fixClient() {
  try {
    console.log('🔧 Fixing client association for restaurant demo...')
    
    // Create client record
    const { data: client, error: clientError } = await supabase
      .from('core_clients')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440001',
        client_name: 'Mario\'s Italian Bistro',
        client_code: 'MARIO_BISTRO',
        client_type: 'restaurant',
        headquarters_country: 'USA',
        primary_contact_email: 'mario@restaurant.com',
        status: 'active',
        subscription_tier: 'enterprise'
      }, { onConflict: 'id' })
      .select()

    if (clientError) {
      console.error('❌ Error creating client:', clientError)
      return
    }

    console.log('✅ Client record created/updated:', client?.[0]?.client_name)

    // Update organization to reference this client
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .update({ client_id: '550e8400-e29b-41d4-a716-446655440001' })
      .eq('id', '550e8400-e29b-41d4-a716-446655440000')
      .select()

    if (orgError) {
      console.error('❌ Error updating organization:', orgError)
      return
    }

    console.log('✅ Organization updated with client_id:', org?.[0]?.organization_name)
    console.log('🚀 Menu creation should now work!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixClient()