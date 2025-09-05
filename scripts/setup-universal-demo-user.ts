#!/usr/bin/env npx tsx

/**
 * Setup Universal Demo User
 * Creates one demo user with access to all demo organizations
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables!')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Universal demo user
const UNIVERSAL_DEMO_USER = {
  email: 'demo@heraerp.com',
  password: 'DemoHERA2025!',
  name: 'HERA Demo User'
}

// Demo organizations to create/link
const DEMO_ORGS = [
  {
    organizationName: 'Bella Beauty Salon (Demo)',
    organizationCode: 'DEMO-SALON',
    organizationType: 'salon',
    industry: 'salon',
    subdomain: 'demo-salon'
  },
  {
    organizationName: 'Kochi Ice Cream Manufacturing (Demo)',
    organizationCode: 'DEMO-ICECREAM',
    organizationType: 'icecream',
    industry: 'manufacturing',
    subdomain: 'demo-icecream'
  },
  {
    organizationName: "Mario's Restaurant (Demo)",
    organizationCode: 'DEMO-RESTAURANT',
    organizationType: 'restaurant',
    industry: 'restaurant',
    subdomain: 'demo-restaurant'
  },
  {
    organizationName: 'Dr. Smith Family Practice (Demo)',
    organizationCode: 'DEMO-HEALTHCARE',
    organizationType: 'healthcare',
    industry: 'healthcare',
    subdomain: 'demo-healthcare'
  }
]

async function setupUniversalDemo() {
  console.log('🚀 Setting up universal demo user...\n')
  
  try {
    // Step 1: Create or get the universal demo user
    console.log('Creating universal demo user...')
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    let userId: string
    const existingUser = users?.find(u => u.email === UNIVERSAL_DEMO_USER.email)
    
    if (existingUser) {
      console.log(`✓ Demo user already exists: ${UNIVERSAL_DEMO_USER.email}`)
      userId = existingUser.id
    } else {
      // Create user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: UNIVERSAL_DEMO_USER.email,
        password: UNIVERSAL_DEMO_USER.password,
        email_confirm: true,
        user_metadata: {
          full_name: UNIVERSAL_DEMO_USER.name,
          demo_user: true
        }
      })
      
      if (authError) {
        console.error(`✗ Error creating user: ${authError.message}`)
        return
      }
      
      userId = authData.user!.id
      console.log(`✓ Created universal demo user: ${UNIVERSAL_DEMO_USER.email}`)
    }
    
    // Step 2: Create/link all demo organizations
    for (const demo of DEMO_ORGS) {
      console.log(`\nProcessing ${demo.organizationName}...`)
      
      // Check if organization exists
      const { data: existingOrg } = await supabase
        .from('core_organizations')
        .select('id')
        .eq('organization_code', demo.organizationCode)
        .single()
      
      let orgId: string
      
      if (existingOrg) {
        console.log(`✓ Organization already exists: ${demo.organizationName}`)
        orgId = existingOrg.id
      } else {
        // Create organization
        const { data: orgData, error: orgError } = await supabase
          .from('core_organizations')
          .insert({
            organization_name: demo.organizationName,
            organization_code: demo.organizationCode,
            organization_type: demo.organizationType,
            industry_classification: demo.industry,
            settings: {
              subdomain: demo.subdomain,
              business_type: demo.organizationType,
              demo_mode: true
            }
          })
          .select()
          .single()
        
        if (orgError) {
          console.error(`✗ Error creating organization: ${orgError.message}`)
          continue
        }
        
        orgId = orgData.id
        console.log(`✓ Created organization: ${demo.organizationName}`)
      }
      
      // Create user entity for this organization
      const { data: existingUserEntity } = await supabase
        .from('core_entities')
        .select('id')
        .eq('entity_type', 'user')
        .eq('metadata->>auth_user_id', userId)
        .single()
      
      let userEntityId: string
      
      if (!existingUserEntity) {
        const { data: userEntity, error: userEntityError } = await supabase
          .from('core_entities')
          .insert({
            entity_type: 'user',
            entity_name: UNIVERSAL_DEMO_USER.name,
            entity_code: `USER-DEMO`,
            smart_code: 'HERA.SYSTEM.USER.DEMO.v1',
            metadata: {
              auth_user_id: userId,
              email: UNIVERSAL_DEMO_USER.email,
              demo: true
            }
          })
          .select()
          .single()
        
        if (userEntityError) {
          console.error(`✗ Error creating user entity: ${userEntityError.message}`)
          continue
        } else {
          console.log(`✓ Created user entity for demo user`)
          userEntityId = userEntity.id
        }
      } else {
        console.log(`✓ User entity already exists for demo user`)
        userEntityId = existingUserEntity.id
      }
      
      // Create member_of relationship between user and organization
      const { data: existingRelationship } = await supabase
        .from('core_relationships')
        .select('id')
        .eq('from_entity_id', userEntityId)
        .eq('to_entity_id', orgId)
        .eq('relationship_type', 'member_of')
        .single()
      
      if (!existingRelationship) {
        const { error: relationshipError } = await supabase
          .from('core_relationships')
          .insert({
            from_entity_id: userEntityId,
            to_entity_id: orgId,
            relationship_type: 'member_of',
            smart_code: 'HERA.SYSTEM.REL.MEMBER_OF.v1',
            metadata: {
              role: 'owner',
              permissions: ['*'],
              joined_at: new Date().toISOString()
            }
          })
        
        if (relationshipError) {
          console.error(`✗ Error creating membership: ${relationshipError.message}`)
        } else {
          console.log(`✓ Created membership for ${demo.organizationName}`)
        }
      } else {
        console.log(`✓ Membership already exists for ${demo.organizationName}`)
      }
    }
    
    console.log('\n✅ Universal demo setup complete!')
    console.log('\nUniversal demo credentials:')
    console.log(`  Email: ${UNIVERSAL_DEMO_USER.email}`)
    console.log(`  Password: ${UNIVERSAL_DEMO_USER.password}`)
    console.log('\nThis user has access to all demo organizations.')
    console.log('The user can switch between organizations after logging in.')
    
  } catch (error) {
    console.error('✗ Unexpected error:', error)
  }
}

setupUniversalDemo().catch(console.error)