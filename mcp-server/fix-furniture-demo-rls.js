#!/usr/bin/env node

/**
 * Fix RLS policies for furniture demo user
 * This ensures demo@keralafurniture.com can access all furniture organization data
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'
const DEMO_EMAIL = 'demo@keralafurniture.com'

async function main() {
  console.log('🔐 Fixing RLS policies for furniture demo user...')
  console.log('📧 Demo Email:', DEMO_EMAIL)
  console.log('🏭 Organization ID:', FURNITURE_ORG_ID)
  
  try {
    // First, check if the demo user exists
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) {
      console.error('Error fetching users:', userError)
      return
    }
    
    const demoUser = users.users.find(u => u.email === DEMO_EMAIL)
    if (!demoUser) {
      console.error('❌ Demo user not found:', DEMO_EMAIL)
      return
    }
    
    console.log('✅ Demo user found:', demoUser.id)
    
    // Check current data access
    console.log('\n📊 Checking current data access...')
    
    // Test as service role (should see everything)
    const { data: allEmployees, error: allError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'employee')
    
    console.log('Service role sees:', allEmployees?.length || 0, 'employees')
    
    // Create RLS policies
    console.log('\n🔧 Creating/updating RLS policies...')
    
    // SQL to create policies
    const policies = [
      // core_entities
      `DROP POLICY IF EXISTS "furniture_demo_entities_select" ON public.core_entities`,
      `CREATE POLICY "furniture_demo_entities_select" ON public.core_entities 
       FOR SELECT TO authenticated 
       USING (organization_id = '${FURNITURE_ORG_ID}'::uuid 
              AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                   OR auth.email() = '${DEMO_EMAIL}'))`,
      
      `DROP POLICY IF EXISTS "furniture_demo_entities_all" ON public.core_entities`,
      `CREATE POLICY "furniture_demo_entities_all" ON public.core_entities 
       FOR ALL TO authenticated 
       USING (organization_id = '${FURNITURE_ORG_ID}'::uuid 
              AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                   OR auth.email() = '${DEMO_EMAIL}'))
       WITH CHECK (organization_id = '${FURNITURE_ORG_ID}'::uuid 
                   AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                        OR auth.email() = '${DEMO_EMAIL}'))`,
      
      // universal_transactions
      `DROP POLICY IF EXISTS "furniture_demo_transactions_select" ON public.universal_transactions`,
      `CREATE POLICY "furniture_demo_transactions_select" ON public.universal_transactions 
       FOR SELECT TO authenticated 
       USING (organization_id = '${FURNITURE_ORG_ID}'::uuid 
              AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                   OR auth.email() = '${DEMO_EMAIL}'))`,
      
      `DROP POLICY IF EXISTS "furniture_demo_transactions_all" ON public.universal_transactions`,
      `CREATE POLICY "furniture_demo_transactions_all" ON public.universal_transactions 
       FOR ALL TO authenticated 
       USING (organization_id = '${FURNITURE_ORG_ID}'::uuid 
              AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                   OR auth.email() = '${DEMO_EMAIL}'))
       WITH CHECK (organization_id = '${FURNITURE_ORG_ID}'::uuid 
                   AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                        OR auth.email() = '${DEMO_EMAIL}'))`,
      
      // core_dynamic_data
      `DROP POLICY IF EXISTS "furniture_demo_dynamic_select" ON public.core_dynamic_data`,
      `CREATE POLICY "furniture_demo_dynamic_select" ON public.core_dynamic_data 
       FOR SELECT TO authenticated 
       USING (organization_id = '${FURNITURE_ORG_ID}'::uuid 
              AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                   OR auth.email() = '${DEMO_EMAIL}'))`,
      
      `DROP POLICY IF EXISTS "furniture_demo_dynamic_all" ON public.core_dynamic_data`,
      `CREATE POLICY "furniture_demo_dynamic_all" ON public.core_dynamic_data 
       FOR ALL TO authenticated 
       USING (organization_id = '${FURNITURE_ORG_ID}'::uuid 
              AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                   OR auth.email() = '${DEMO_EMAIL}'))
       WITH CHECK (organization_id = '${FURNITURE_ORG_ID}'::uuid 
                   AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                        OR auth.email() = '${DEMO_EMAIL}'))`,
      
      // core_relationships
      `DROP POLICY IF EXISTS "furniture_demo_relationships_select" ON public.core_relationships`,
      `CREATE POLICY "furniture_demo_relationships_select" ON public.core_relationships 
       FOR SELECT TO authenticated 
       USING (organization_id = '${FURNITURE_ORG_ID}'::uuid 
              AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                   OR auth.email() = '${DEMO_EMAIL}'))`,
      
      `DROP POLICY IF EXISTS "furniture_demo_relationships_all" ON public.core_relationships`,
      `CREATE POLICY "furniture_demo_relationships_all" ON public.core_relationships 
       FOR ALL TO authenticated 
       USING (organization_id = '${FURNITURE_ORG_ID}'::uuid 
              AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                   OR auth.email() = '${DEMO_EMAIL}'))
       WITH CHECK (organization_id = '${FURNITURE_ORG_ID}'::uuid 
                   AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                        OR auth.email() = '${DEMO_EMAIL}'))`,
      
      // universal_transaction_lines
      `DROP POLICY IF EXISTS "furniture_demo_lines_select" ON public.universal_transaction_lines`,
      `CREATE POLICY "furniture_demo_lines_select" ON public.universal_transaction_lines 
       FOR SELECT TO authenticated 
       USING (organization_id = '${FURNITURE_ORG_ID}'::uuid 
              AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                   OR auth.email() = '${DEMO_EMAIL}'))`,
      
      `DROP POLICY IF EXISTS "furniture_demo_lines_all" ON public.universal_transaction_lines`,
      `CREATE POLICY "furniture_demo_lines_all" ON public.universal_transaction_lines 
       FOR ALL TO authenticated 
       USING (organization_id = '${FURNITURE_ORG_ID}'::uuid 
              AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                   OR auth.email() = '${DEMO_EMAIL}'))
       WITH CHECK (organization_id = '${FURNITURE_ORG_ID}'::uuid 
                   AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                        OR auth.email() = '${DEMO_EMAIL}'))`,
      
      // core_organizations
      `DROP POLICY IF EXISTS "furniture_demo_org_select" ON public.core_organizations`,
      `CREATE POLICY "furniture_demo_org_select" ON public.core_organizations 
       FOR SELECT TO authenticated 
       USING (id = '${FURNITURE_ORG_ID}'::uuid 
              AND (auth.jwt()->>'email' = '${DEMO_EMAIL}' 
                   OR auth.email() = '${DEMO_EMAIL}'))`
    ]
    
    // Execute each policy
    for (const sql of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      if (error) {
        console.error('Error executing SQL:', sql.substring(0, 50) + '...', error)
      } else {
        console.log('✅ Policy created/updated')
      }
    }
    
    console.log('\n🎉 RLS policies have been updated!')
    console.log('📌 The furniture demo user should now be able to access all furniture organization data')
    console.log('\n⚠️  Note: You may need to log out and log back in for the changes to take effect')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

main().catch(console.error)