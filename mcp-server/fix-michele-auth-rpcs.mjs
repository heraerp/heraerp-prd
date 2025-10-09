import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const newUserId = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
const hairTalkzOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

console.log('=== FIXING MICHELE AUTH RPC FUNCTIONS ===')

async function createMissingRPCs() {
  try {
    console.log('1. Creating resolve_user_identity_v1 function...')
    
    const identityFunction = `
      CREATE OR REPLACE FUNCTION resolve_user_identity_v1()
      RETURNS jsonb[]
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
          v_user_id UUID;
          v_result jsonb[];
      BEGIN
          -- Get the current user ID from auth context
          v_user_id := auth.uid();
          
          IF v_user_id IS NULL THEN
              RETURN ARRAY[]::jsonb[];
          END IF;
          
          -- Get organization IDs from USER_MEMBER_OF_ORG relationships
          WITH user_orgs AS (
              SELECT DISTINCT r.to_entity_id as organization_id
              FROM core_relationships r
              WHERE r.from_entity_id = v_user_id
              AND r.relationship_type = 'USER_MEMBER_OF_ORG'
              AND r.is_active = true
          )
          SELECT ARRAY[jsonb_build_object(
              'user_id', v_user_id,
              'organization_ids', COALESCE(array_agg(organization_id), ARRAY[]::UUID[])
          )]
          INTO v_result
          FROM user_orgs;
          
          RETURN COALESCE(v_result, ARRAY[jsonb_build_object(
              'user_id', v_user_id,
              'organization_ids', ARRAY[]::UUID[]
          )]::jsonb[]);
      END;
      $$;
    `
    
    const { error: identityError } = await supabase.rpc('exec_sql', { 
      query: identityFunction 
    })
    
    if (identityError) {
      console.log('Identity function result:', identityError)
    } else {
      console.log('✅ resolve_user_identity_v1 function created')
    }
    
    console.log('\\n2. Creating resolve_user_roles_in_org function...')
    
    const rolesFunction = `
      CREATE OR REPLACE FUNCTION resolve_user_roles_in_org(p_org UUID)
      RETURNS text[]
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
          v_user_id UUID;
          v_roles text[];
      BEGIN
          -- Get the current user ID from auth context
          v_user_id := auth.uid();
          
          IF v_user_id IS NULL OR p_org IS NULL THEN
              RETURN ARRAY[]::text[];
          END IF;
          
          -- Get roles from the USER_MEMBER_OF_ORG relationship
          SELECT ARRAY[
              COALESCE(
                  r.relationship_data->>'role',
                  'user'
              )
          ]
          INTO v_roles
          FROM core_relationships r
          WHERE r.from_entity_id = v_user_id
          AND r.to_entity_id = p_org
          AND r.relationship_type = 'USER_MEMBER_OF_ORG'
          AND r.is_active = true
          LIMIT 1;
          
          RETURN COALESCE(v_roles, ARRAY['user']::text[]);
      END;
      $$;
    `
    
    const { error: rolesError } = await supabase.rpc('exec_sql', { 
      query: rolesFunction 
    })
    
    if (rolesError) {
      console.log('Roles function result:', rolesError)
    } else {
      console.log('✅ resolve_user_roles_in_org function created')
    }
    
    console.log('\\n3. Granting permissions...')
    
    const permissions = `
      GRANT EXECUTE ON FUNCTION resolve_user_identity_v1() TO authenticated;
      GRANT EXECUTE ON FUNCTION resolve_user_roles_in_org(UUID) TO authenticated;
      GRANT EXECUTE ON FUNCTION resolve_user_identity_v1() TO anon;
      GRANT EXECUTE ON FUNCTION resolve_user_roles_in_org(UUID) TO anon;
    `
    
    const { error: permError } = await supabase.rpc('exec_sql', { 
      query: permissions 
    })
    
    if (permError) {
      console.log('Permissions result:', permError)
    } else {
      console.log('✅ Permissions granted')
    }
    
  } catch (error) {
    console.error('❌ Failed to create RPC functions:', error)
  }
}

async function testAuthFlow() {
  try {
    console.log('\\n4. Testing authentication flow...')
    
    // Test if we can call the RPC functions directly
    const { data: testIdentity, error: testIdentityError } = await supabase.rpc('resolve_user_identity_v1')
    
    console.log('Test identity result:', { data: testIdentity, error: testIdentityError })
    
    // Test direct relationship query (what should work)
    const { data: directQuery } = await supabase
      .from('core_relationships')
      .select('to_entity_id')
      .eq('from_entity_id', newUserId)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .eq('is_active', true)
    
    console.log('Direct relationship query:', directQuery)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

async function main() {
  await createMissingRPCs()
  await testAuthFlow()
  
  console.log('\\n🎯 RPC FUNCTIONS SETUP COMPLETE')
  console.log('📋 Next steps:')
  console.log('1. Michele should logout completely and clear browser cache')
  console.log('2. Login again with michele@hairtalkz.ae / HairTalkz2024!')
  console.log('3. Authentication should now work correctly')
  console.log('4. API calls should return data instead of 401 errors')
}

main().catch(console.error)