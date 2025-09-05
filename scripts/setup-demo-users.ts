#!/usr/bin/env npx tsx

/**
 * Setup Demo Users and Organizations
 * Creates demo users with pre-configured organizations for each business type
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

// Demo organizations to create
const DEMO_ORGS = [
  {
    email: 'demo-salon@heraerp.com',
    password: 'DemoSalon2025!',
    organizationName: 'Bella Beauty Salon (Demo)',
    subdomain: 'demo-salon',
    businessType: 'salon',
    industry: 'salon',
    metadata: {
      demo: true,
      created_via: 'demo_setup_script'
    }
  },
  {
    email: 'demo-icecream@heraerp.com', 
    password: 'DemoIceCream2025!',
    organizationName: 'Kochi Ice Cream Manufacturing (Demo)',
    subdomain: 'demo-icecream',
    businessType: 'icecream',
    industry: 'manufacturing',
    metadata: {
      demo: true,
      created_via: 'demo_setup_script'
    }
  },
  {
    email: 'demo-restaurant@heraerp.com',
    password: 'DemoRestaurant2025!',
    organizationName: "Mario's Restaurant (Demo)",
    subdomain: 'demo-restaurant',
    businessType: 'restaurant',
    industry: 'restaurant',
    metadata: {
      demo: true,
      created_via: 'demo_setup_script'
    }
  },
  {
    email: 'demo-healthcare@heraerp.com',
    password: 'DemoHealthcare2025!',
    organizationName: 'Dr. Smith Family Practice (Demo)',
    subdomain: 'demo-healthcare', 
    businessType: 'healthcare',
    industry: 'healthcare',
    metadata: {
      demo: true,
      created_via: 'demo_setup_script'
    }
  }
]

async function createDemoUser(demo: typeof DEMO_ORGS[0]) {
  console.log(`\nCreating demo user: ${demo.email}`)
  
  try {
    // Step 1: Check if user already exists by listing all users (admin only)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    let userId: string
    const existingUser = users?.find(u => u.email === demo.email)
    
    if (existingUser) {
      console.log(`✓ User already exists: ${demo.email}`)
      userId = existingUser.id
    } else {
      // Create user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: {
          full_name: demo.organizationName,
          demo_user: true
        }
      })
      
      if (authError) {
        console.error(`✗ Error creating user: ${authError.message}`)
        return
      }
      
      userId = authData.user!.id
      console.log(`✓ Created user: ${demo.email}`)
    }
    
    // Step 2: Check if organization exists
    const { data: existingOrg } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('organization_name', demo.organizationName)
      .single()
    
    let orgId: string
    
    if (existingOrg) {
      console.log(`✓ Organization already exists: ${demo.subdomain}`)
      orgId = existingOrg.id
    } else {
      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('core_organizations')
        .insert({
          organization_name: demo.organizationName,
          organization_code: `DEMO-${demo.businessType.toUpperCase()}`,
          organization_type: demo.businessType,
          industry_classification: demo.industry,
          settings: {
            subdomain: demo.subdomain,
            business_type: demo.businessType,
            demo_mode: true,
            metadata: demo.metadata
          }
        })
        .select()
        .single()
      
      if (orgError) {
        console.error(`✗ Error creating organization: ${orgError.message}`)
        return
      }
      
      orgId = orgData.id
      console.log(`✓ Created organization: ${demo.organizationName}`)
    }
    
    // Step 3: Create user membership as a relationship
    // In HERA's universal architecture, memberships are relationships between user entities and organizations
    
    // First check if user entity exists
    const { data: existingUserEntity } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('entity_type', 'user')
      .eq('metadata->>user_id', userId)
      .single()
    
    let userEntityId: string
    
    if (!existingUserEntity) {
      // Create user entity if it doesn't exist
      const { data: userEntity, error: userEntityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'user',
          entity_name: demo.organizationName,
          entity_code: `USER-${userId.substring(0, 8)}`,
          smart_code: 'HERA.SYSTEM.USER.DEMO.v1',
          metadata: {
            user_id: userId,
            email: demo.email,
            demo: true,
            role: 'owner'
          }
        })
        .select()
        .single()
      
      if (userEntityError) {
        console.error(`✗ Error creating user entity: ${userEntityError.message}`)
        return
      }
      
      userEntityId = userEntity.id
    } else {
      userEntityId = existingUserEntity.id
    }
    
    // Create membership relationship
    const { error: relationshipError } = await supabase
      .from('core_relationships')
      .upsert({
        organization_id: orgId,
        from_entity_id: userEntityId,
        to_entity_id: orgId, // Self-referential to org
        relationship_type: 'member_of',
        smart_code: 'HERA.SYSTEM.MEMBERSHIP.OWNER.v1',
        metadata: {
          role: 'owner',
          permissions: ['*']
        }
      }, {
        onConflict: 'organization_id,from_entity_id,to_entity_id,relationship_type'
      })
    
    if (relationshipError) {
      console.error(`✗ Error creating membership relationship: ${relationshipError.message}`)
      return
    }
    
    console.log(`✓ Created membership for ${demo.email} in ${demo.organizationName}`)
    
    console.log(`✓ Successfully set up demo user: ${demo.email}`)
    console.log(`  → Login at: https://app.heraerp.com/auth/login`)
    console.log(`  → Email: ${demo.email}`)
    console.log(`  → Password: ${demo.password}`)
    console.log(`  → Organization: ${demo.subdomain}.heraerp.com`)
    
  } catch (error) {
    console.error(`✗ Unexpected error: ${error}`)
  }
}

async function main() {
  console.log('🚀 Setting up HERA demo users and organizations...\n')
  
  for (const demo of DEMO_ORGS) {
    await createDemoUser(demo)
  }
  
  console.log('\n✅ Demo setup complete!')
  console.log('\nDemo users can login at https://app.heraerp.com/auth/login')
  console.log('Each demo user has access to their specific business type interface.')
}

main().catch(console.error)