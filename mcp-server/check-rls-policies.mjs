import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function checkRLSPolicies() {
  console.log('=== CHECKING RLS POLICIES ===')
  
  try {
    // Check if RLS is enabled on core_relationships
    console.log('1. Checking RLS status on core_relationships...')
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql_query', { 
        query: `
          SELECT tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename IN ('core_relationships', 'core_dynamic_data')
        `
      })
    
    if (rlsError) {
      console.log('Using alternative method to check RLS...')
      
      // Try direct query
      const { data: tables, error: tableError } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('schemaname', 'public')
        .in('tablename', ['core_relationships', 'core_dynamic_data'])
      
      console.log('Table RLS status:', { data: tables, error: tableError })
    } else {
      console.log('RLS Status:', rlsStatus)
    }
    
    // Check policies using different approach
    console.log('\n2. Checking policies via pg_policies...')
    
    const { data: policies, error: policyError } = await supabase
      .rpc('exec_sql_query', {
        query: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
          FROM pg_policies 
          WHERE tablename IN ('core_relationships', 'core_dynamic_data')
          ORDER BY tablename, policyname
        `
      })
    
    if (policyError) {
      console.error('❌ Failed to check policies:', policyError)
    } else if (policies && policies.length > 0) {
      console.log('Found policies:')
      policies.forEach(policy => {
        console.log(`- ${policy.tablename}.${policy.policyname}: ${policy.cmd} for ${policy.roles?.join(', ') || 'all'}`)
        if (policy.qual) {
          console.log(`  Condition: ${policy.qual}`)
        }
      })
    } else {
      console.log('No RLS policies found on these tables')
    }
    
    // Test anon access with different approaches
    console.log('\n3. Testing anon access with auth simulation...')
    
    const anonSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    
    // Test 1: Direct query
    const { data: directQuery, error: directError } = await anonSupabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', '09b0b92a-d797-489e-bc03-5ca0a6272674')
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    
    console.log('Direct anon query:', { 
      count: directQuery?.length || 0, 
      error: directError?.message || 'none' 
    })
    
    // Test 2: With auth headers simulation
    const { data: authQuery, error: authError } = await anonSupabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', '09b0b92a-d797-489e-bc03-5ca0a6272674')
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    
    console.log('Auth simulated query:', { 
      count: authQuery?.length || 0, 
      error: authError?.message || 'none' 
    })
    
    // Check if there's an auth.users() function available
    console.log('\n4. Checking auth context availability...')
    const { data: authContext, error: authContextError } = await supabase
      .rpc('exec_sql_query', {
        query: `SELECT auth.uid() as current_user_id, auth.role() as current_role`
      })
    
    console.log('Auth context check:', { data: authContext, error: authContextError })
    
    // Temporarily disable RLS to test if that's the issue
    console.log('\n5. Testing with RLS temporarily disabled...')
    
    await supabase.rpc('exec_sql_query', {
      query: 'ALTER TABLE core_relationships DISABLE ROW LEVEL SECURITY'
    })
    
    const { data: noRlsQuery, error: noRlsError } = await anonSupabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', '09b0b92a-d797-489e-bc03-5ca0a6272674')
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    
    console.log('Query with RLS disabled:', { 
      count: noRlsQuery?.length || 0, 
      error: noRlsError?.message || 'none' 
    })
    
    // Re-enable RLS
    await supabase.rpc('exec_sql_query', {
      query: 'ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY'
    })
    console.log('RLS re-enabled')
    
  } catch (error) {
    console.error('💥 RLS check failed:', error)
  }
}

checkRLSPolicies().catch(console.error)