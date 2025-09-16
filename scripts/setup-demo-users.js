// ================================================================================
// HERA DEMO USER SETUP SCRIPT
// Smart Code: HERA.SETUP.DEMO.USERS.v1
// Creates demo users in Supabase with proper organization assignments
// ================================================================================

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const demoUsers = [
  {
    email: 'demo.salon@heraerp.com',
    password: 'DemoSalon2024!',
    organizationId: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    organizationName: 'Hair Talkz Salon Demo',
    userMetadata: {
      name: 'Salon Demo User',
      role: 'admin',
      demo: true
    }
  },
  {
    email: 'demo.restaurant@heraerp.com',
    password: 'DemoRestaurant2024!',
    organizationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    organizationName: "Mario's Restaurant Demo",
    userMetadata: {
      name: 'Restaurant Demo User',
      role: 'admin',
      demo: true
    }
  },
  {
    email: 'demo.manufacturing@heraerp.com',
    password: 'DemoManufacturing2024!',
    organizationId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    organizationName: 'TechCorp Manufacturing Demo',
    userMetadata: {
      name: 'Manufacturing Demo User',
      role: 'admin',
      demo: true
    }
  },
  {
    email: 'demo.retail@heraerp.com',
    password: 'DemoRetail2024!',
    organizationId: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    organizationName: 'Fashion Boutique Demo',
    userMetadata: {
      name: 'Retail Demo User',
      role: 'admin',
      demo: true
    }
  }
]

async function setupDemoUsers() {
  console.log('🚀 Setting up HERA demo users...\n')

  for (const demoUser of demoUsers) {
    console.log(`📧 Processing ${demoUser.email}...`)

    try {
      // Step 1: Check if organization exists
      const { data: existingOrg, error: orgCheckError } = await supabase
        .from('core_organizations')
        .select('id')
        .eq('id', demoUser.organizationId)
        .single()

      if (orgCheckError || !existingOrg) {
        console.log(`  ✅ Creating organization: ${demoUser.organizationName}`)
        
        // Create organization in core_organizations
        const { error: orgError } = await supabase
          .from('core_organizations')
          .insert({
            id: demoUser.organizationId,
            name: demoUser.organizationName,
            status: 'active',
            settings: {
              demo_account: true,
              read_only: true,
              reset_daily: true
            },
            metadata: {
              created_for: 'demo',
              industry: demoUser.email.includes('salon') ? 'beauty' : 
                        demoUser.email.includes('restaurant') ? 'food_service' :
                        demoUser.email.includes('manufacturing') ? 'manufacturing' : 'retail'
            }
          })

        if (orgError) {
          console.error(`  ❌ Failed to create organization: ${orgError.message}`)
          continue
        }
      } else {
        console.log(`  ℹ️  Organization already exists`)
      }

      // Step 2: Check if user exists
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(demoUser.email)

      if (!existingUser?.user) {
        // Step 3: Create user
        console.log(`  ✅ Creating user: ${demoUser.email}`)
        
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: demoUser.email,
          password: demoUser.password,
          email_confirm: true,
          user_metadata: demoUser.userMetadata
        })

        if (createError) {
          console.error(`  ❌ Failed to create user: ${createError.message}`)
          continue
        }

        // Step 4: Create user entity in core_entities
        const { error: entityError } = await supabase
          .from('core_entities')
          .insert({
            entity_type: 'user',
            entity_name: demoUser.userMetadata.name,
            entity_code: `USER-${demoUser.email.split('@')[0].toUpperCase()}`,
            organization_id: demoUser.organizationId,
            smart_code: 'HERA.USER.DEMO.ACCOUNT.v1',
            metadata: {
              user_id: newUser.user?.id,
              email: demoUser.email,
              role: demoUser.userMetadata.role,
              demo: true
            }
          })

        if (entityError) {
          console.error(`  ❌ Failed to create user entity: ${entityError.message}`)
        }

        console.log(`  ✅ Demo user created successfully`)
      } else {
        console.log(`  ℹ️  User already exists`)
        
        // Update user metadata if needed
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.user.id,
          {
            user_metadata: {
              ...existingUser.user.user_metadata,
              ...demoUser.userMetadata
            }
          }
        )

        if (updateError) {
          console.error(`  ⚠️  Failed to update user metadata: ${updateError.message}`)
        }
      }

    } catch (error) {
      console.error(`  ❌ Error processing ${demoUser.email}:`, error)
    }

    console.log()
  }

  console.log('✨ Demo user setup complete!\n')
  console.log('📋 Next steps:')
  console.log('1. Ensure Row Level Security (RLS) policies are configured in Supabase')
  console.log('2. Test demo login at http://localhost:3000/demo')
  console.log('3. Each demo user can only access their assigned organization\n')
}

// Run the setup
setupDemoUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Setup failed:', error)
    process.exit(1)
  })