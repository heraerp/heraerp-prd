const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateOrganizationSubdomain() {
  // Update hera2 organization to include subdomain in settings
  const { data, error } = await supabase
    .from('core_organizations')
    .update({
      settings: {
        subdomain: 'hera2'
      }
    })
    .eq('organization_name', 'hera2')
    .select()

  if (error) {
    console.error('Error updating organization:', error)
  } else {
    console.log('Organization updated:', data)
  }
}

updateOrganizationSubdomain()