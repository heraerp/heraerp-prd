// Update demo user passwords to use "demo123"
const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')

async function updateDemoPasswords() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Hash the demo password
    const demoPasswordHash = await bcrypt.hash('demo123', 12)
    console.log('Generated hash for "demo123":', demoPasswordHash)

    // Update Mario's password
    const { data: mario, error: marioError } = await supabase
      .from('core_entities')
      .select('metadata')
      .eq('entity_type', 'user')
      .filter('metadata->>email', 'eq', 'mario@restaurant.com')
      .single()

    if (mario) {
      const updatedMetadata = {
        ...mario.metadata,
        password_hash: demoPasswordHash
      }

      const { error: updateError } = await supabase
        .from('core_entities')
        .update({ metadata: updatedMetadata })
        .eq('entity_type', 'user')
        .filter('metadata->>email', 'eq', 'mario@restaurant.com')

      if (updateError) {
        console.error('Error updating Mario:', updateError)
      } else {
        console.log('✅ Updated Mario password to "demo123"')
      }
    }

    // Update Demo User password
    const { data: demoUser, error: demoError } = await supabase
      .from('core_entities')
      .select('metadata')
      .eq('entity_type', 'user')
      .filter('metadata->>email', 'eq', 'demo@hera.com')
      .single()

    if (demoUser) {
      const updatedMetadata = {
        ...demoUser.metadata,
        password_hash: demoPasswordHash
      }

      const { error: updateError } = await supabase
        .from('core_entities')
        .update({ metadata: updatedMetadata })
        .eq('entity_type', 'user')
        .filter('metadata->>email', 'eq', 'demo@hera.com')

      if (updateError) {
        console.error('Error updating Demo User:', updateError)
      } else {
        console.log('✅ Updated Demo User password to "demo123"')
      }
    }

    console.log('\n🎉 Demo passwords updated successfully!')
    console.log('You can now login with:')
    console.log('- mario@restaurant.com / demo123')
    console.log('- demo@hera.com / demo123')

  } catch (error) {
    console.error('❌ Error updating passwords:', error.message)
  }
}

if (require.main === module) {
  updateDemoPasswords()
}