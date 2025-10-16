#!/usr/bin/env node

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function applyRLSFix() {
  console.log('🛡️ Applying RLS policy fixes...')
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Drop existing policies
  console.log('🗑️ Dropping existing restrictive policies...')
  
  const dropPolicies = [
    `DROP POLICY IF EXISTS "core_relationships_select" ON core_relationships;`,
    `DROP POLICY IF EXISTS "core_relationships_read" ON core_relationships;`,
    `DROP POLICY IF EXISTS "Users can read their own relationships" ON core_relationships;`
  ]

  for (const sql of dropPolicies) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (error) console.log('⚠️ Drop policy error (expected):', error.message)
  }

  // Create new policy
  console.log('✅ Creating new RLS policy...')
  
  const createPolicySQL = `
    CREATE POLICY "Users can read their own relationships" ON core_relationships
      FOR SELECT
      USING (
        -- Allow reading if the user is the source of the relationship
        auth.uid()::text = from_entity_id
        OR
        -- Allow reading if the user is the target of the relationship  
        auth.uid()::text = to_entity_id
        OR
        -- Allow if they have OWNER/ADMIN role in the organization
        EXISTS (
          SELECT 1 FROM core_relationships r
          WHERE r.from_entity_id = auth.uid()::text 
          AND r.to_entity_id = core_relationships.organization_id
          AND r.relationship_type = 'MEMBER_OF'
          AND r.is_active = true
          AND (r.relationship_data->>'role' IN ('OWNER', 'ADMIN'))
        )
      );
  `

  const { error: policyError } = await supabase.rpc('exec_sql', { sql_query: createPolicySQL })
  
  if (policyError) {
    console.error('❌ Error creating policy:', policyError)
  } else {
    console.log('✅ RLS policy created successfully')
  }

  // Ensure RLS is enabled and permissions are granted
  console.log('🔒 Ensuring RLS is enabled...')
  
  const enableRLSSQL = `
    ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;
    GRANT SELECT ON core_relationships TO authenticated;
    GRANT SELECT ON core_relationships TO anon;
  `

  const { error: enableError } = await supabase.rpc('exec_sql', { sql_query: enableRLSSQL })
  
  if (enableError) {
    console.error('❌ Error enabling RLS:', enableError)
  } else {
    console.log('✅ RLS enabled and permissions granted')
  }

  console.log('🎉 RLS policy fix complete!')
}

applyRLSFix().catch(console.error)