#!/usr/bin/env node

/**
 * Apply RLS policies to allow public read access for demo organizations
 */

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Demo organization IDs
const DEMO_ORG_IDS = [
  '1471e87b-b27e-42ef-8192-343cc5e0d656', // Kochi Ice Cream
  '8c4f6b2d-5a91-4e8c-b3d7-1f9e8a7c6d54', // Mario's Restaurant
  'a2e5f8d9-7b3c-4f6e-9d1a-8c7e5b4a2f9d', // Dr. Smith's Practice
  'c7d9e4f8-3b2a-4e6d-8f1c-9a7b5c3d2e8f', // Bella Beauty Salon
  'e5f8a9d7-2c3b-4f7e-8d1a-7b6c4e3f2a9d'  // TechGear Electronics
]

async function applyDemoRLSPolicies() {
  console.log('🔒 Applying RLS policies for demo organizations...\n')

  try {
    // Create RLS policies for each table
    const policies = [
      {
        table: 'core_organizations',
        name: 'Allow public read for demo organizations',
        using: `id IN ('${DEMO_ORG_IDS.join("','")}')`
      },
      {
        table: 'core_entities',
        name: 'Allow public read for demo organization entities',
        using: `organization_id IN ('${DEMO_ORG_IDS.join("','")}')`
      },
      {
        table: 'core_dynamic_data',
        name: 'Allow public read for demo organization dynamic data',
        using: `organization_id IN ('${DEMO_ORG_IDS.join("','")}')`
      },
      {
        table: 'core_relationships',
        name: 'Allow public read for demo organization relationships',
        using: `organization_id IN ('${DEMO_ORG_IDS.join("','")}')`
      },
      {
        table: 'universal_transactions',
        name: 'Allow public read for demo organization transactions',
        using: `organization_id IN ('${DEMO_ORG_IDS.join("','")}')`
      },
      {
        table: 'universal_transaction_lines',
        name: 'Allow public read for demo organization transaction lines',
        using: `transaction_id IN (SELECT id FROM universal_transactions WHERE organization_id IN ('${DEMO_ORG_IDS.join("','")}'))`
      }
    ]

    for (const policy of policies) {
      console.log(`📋 Creating policy for ${policy.table}...`)
      
      // Drop existing policy if it exists
      const dropSql = `DROP POLICY IF EXISTS "${policy.name}" ON ${policy.table};`
      const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropSql })
      
      if (dropError) {
        console.log(`   ⚠️  Could not drop existing policy: ${dropError.message}`)
      }
      
      // Create new policy
      const createSql = `
        CREATE POLICY "${policy.name}"
        ON ${policy.table}
        FOR SELECT
        USING (${policy.using});
      `
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createSql })
      
      if (createError) {
        console.log(`   ❌ Failed to create policy: ${createError.message}`)
        
        // If exec_sql doesn't exist, try a different approach
        if (createError.message.includes('function') || createError.message.includes('exist')) {
          console.log('   ℹ️  The exec_sql function is not available.')
          console.log('   Please run the SQL script manually in Supabase dashboard.')
        }
      } else {
        console.log(`   ✅ Policy created successfully`)
      }
    }
    
    console.log('\n🧪 Testing anonymous access after policy creation...')
    
    // Test with anonymous key
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data: testData, error: testError } = await anonClient
      .from('core_entities')
      .select('entity_type')
      .eq('organization_id', DEMO_ORG_IDS[0])
      .limit(5)
    
    if (testError) {
      console.log('   ❌ Anonymous access still blocked:', testError.message)
      console.log('\n⚠️  RLS policies may need to be applied manually.')
      console.log('\n📝 Manual steps:')
      console.log('   1. Go to Supabase Dashboard > SQL Editor')
      console.log('   2. Copy and run the SQL from: database/migrations/add-demo-rls-policies.sql')
      console.log('   3. This will enable public read access for all demo organizations')
    } else {
      console.log(`   ✅ Anonymous access working! Found ${testData?.length || 0} entities`)
      console.log('\n🎉 Success! The ice cream dashboard should now show data.')
    }
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    console.log('\n📝 Please apply the policies manually via Supabase dashboard.')
  }
}

// Run the script
applyDemoRLSPolicies()