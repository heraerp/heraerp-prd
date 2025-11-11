/**
 * Create MatrixIT World Organization in HERA Database
 * Creates organization record with Matrix Gold theme
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// MatrixIT World organization details
const ORGANIZATION_ID = '30c9841b-0472-4dc3-82af-6290192255ba'

const matrixGoldTheme = {
  primary_color: '#F5C400',        // Matrix Gold - Primary brand color
  secondary_color: '#4A4A4A',      // Charcoal Gray - Professional backgrounds  
  accent_color: '#F5C400',         // Matrix Gold - Key accent elements
  success_color: '#10B981',        // Standard success green
  warning_color: '#F5C400',        // Matrix Gold for warnings
  error_color: '#EF4444',          // Standard error red
  background_color: '#FFFFFF',     // Pure White - Clean backgrounds
  surface_color: '#FFF8E1',        // Cream Yellow - Light accent backgrounds
  text_primary: '#2C2C2C',         // Matrix Black - Primary text
  text_secondary: '#757575',       // Neutral Gray - Secondary text
  border_color: '#E0E0E0',         // Light gray borders
  font_family_heading: 'Inter',
  font_family_body: 'Inter', 
  font_size_base: '16px',
  line_height_base: '1.5',
  border_radius: '8px',
  shadow_intensity: 'medium',
  theme_mode: 'light',
  animations_enabled: true,
  reduced_motion: false,
  high_contrast: false
}

const organizationData = {
  id: ORGANIZATION_ID,
  organization_name: 'MatrixIT World',
  organization_code: 'MATRIXITWORLD',
  organization_type: 'retail',
  created_by: '00000000-0000-0000-0000-000000000001', // System user
  updated_by: '00000000-0000-0000-0000-000000000001', // System user
  settings: {
    theme: matrixGoldTheme,
    features: {
      multi_branch: true,
      inventory_management: true,
      mobile_retail: true,
      pc_retail: true,
      distribution: true,
      analytics: true
    },
    branches: [
      { id: 'kochi-main', name: 'Kochi Main', city: 'Kochi' },
      { id: 'trivandrum-main', name: 'Trivandrum Main', city: 'Trivandrum' },
      { id: 'kozhikode-distributor', name: 'Kozhikode Distributor', city: 'Kozhikode' },
      { id: 'thrissur-retail', name: 'Thrissur Retail', city: 'Thrissur' },
      { id: 'kannur-service', name: 'Kannur Service', city: 'Kannur' },
      { id: 'kollam-retail', name: 'Kollam Retail', city: 'Kollam' }
    ],
    address: {
      street: 'Technology Park',
      city: 'Kochi',
      state: 'Kerala',
      country: 'India',
      postal_code: '682001'
    }
  }
}

async function createMatrixITWorldOrganization() {
  try {
    console.log('🏢 Creating MatrixIT World Organization')
    console.log('=' .repeat(70))
    console.log(`📍 Organization ID: ${ORGANIZATION_ID}`)
    console.log(`🏷️  Organization Name: ${organizationData.organization_name}`)
    console.log('')
    
    // Check if organization already exists
    const { data: existingOrg } = await supabase
      .from('core_organizations')
      .select('id, organization_name')
      .eq('id', ORGANIZATION_ID)
      .single()
    
    if (existingOrg) {
      console.log(`✅ Organization already exists: ${existingOrg.organization_name}`)
      console.log('🎨 Updating with Matrix Gold theme...')
      
      // Update existing organization with Matrix Gold theme
      const { error: updateError } = await supabase
        .from('core_organizations')
        .update({
          settings: {
            ...organizationData.settings
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', ORGANIZATION_ID)
      
      if (updateError) {
        console.error('❌ Failed to update theme:', updateError.message)
        return
      }
      
      console.log('✅ Matrix Gold theme applied to existing organization!')
    } else {
      // Create new organization
      const { error: createError } = await supabase
        .from('core_organizations')
        .insert([organizationData])
      
      if (createError) {
        console.error('❌ Failed to create organization:', createError.message)
        return
      }
      
      console.log('✅ MatrixIT World organization created successfully!')
    }
    
    console.log('')
    console.log('🎯 Matrix Gold Color Palette Applied:')
    console.log(`   Primary (Matrix Gold): ${matrixGoldTheme.primary_color}`)
    console.log(`   Secondary (Charcoal): ${matrixGoldTheme.secondary_color}`)
    console.log(`   Background (Pure White): ${matrixGoldTheme.background_color}`)
    console.log(`   Surface (Cream Yellow): ${matrixGoldTheme.surface_color}`)
    console.log(`   Text Primary (Matrix Black): ${matrixGoldTheme.text_primary}`)
    console.log(`   Text Secondary (Neutral Gray): ${matrixGoldTheme.text_secondary}`)
    console.log('')
    
    console.log('🔗 Access MatrixIT World with Matrix Gold theme:')
    console.log('   http://localhost:3000/retail1/matrixitworld')
    console.log('')
    console.log('🧪 Test branding interface:')
    console.log('   http://localhost:3000/admin/branding/test')
    
  } catch (error) {
    console.error('❌ Error creating MatrixIT World organization:', error.message)
  }
}

// Run the creation process
console.log('🚀 Starting MatrixIT World Organization Creation...')
createMatrixITWorldOrganization().then(() => {
  console.log('')
  console.log('🎉 MatrixIT World Organization Setup Complete!')
  console.log('🔥 Ready for Matrix Gold branding experience!')
  process.exit(0)
}).catch(error => {
  console.error('💥 Organization Creation Failed:', error)
  process.exit(1)
})