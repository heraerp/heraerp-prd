/**
 * Apply Matrix Gold Theme to MatrixIT World Organization
 * Simple script to update database with Matrix Gold branding
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Initialize Supabase client (using NEXT_PUBLIC variables from .env)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// MatrixIT World organization ID (from admin interface)
const ORGANIZATION_ID = '30c9841b-0472-4dc3-82af-6290192255ba'

// Matrix Gold theme configuration
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

async function applyMatrixGoldTheme() {
  try {
    console.log('🎨 Applying Matrix Gold Theme to MatrixIT World Organization')
    console.log('=' .repeat(70))
    console.log(`📍 Organization ID: ${ORGANIZATION_ID}`)
    console.log('')
    
    // Check if organization exists
    const { data: orgData, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, organization_name')
      .eq('id', ORGANIZATION_ID)
      .single()
    
    if (orgError) {
      console.error('❌ Organization not found:', orgError.message)
      return
    }
    
    console.log(`✅ Found organization: ${orgData.organization_name}`)
    console.log('')
    
    // Get current settings to preserve other data
    const { data: currentData } = await supabase
      .from('core_organizations')
      .select('settings')
      .eq('id', ORGANIZATION_ID)
      .single()

    const currentSettings = currentData?.settings || {}
    
    // Update organization with Matrix Gold theme in HERA Sacred Six compliant way
    const { error: updateError } = await supabase
      .from('core_organizations')
      .update({
        settings: {
          ...currentSettings,
          theme: matrixGoldTheme
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', ORGANIZATION_ID)
    
    if (updateError) {
      console.error('❌ Failed to update theme:', updateError.message)
      return
    }
    
    console.log('🎯 Matrix Gold Color Palette Applied:')
    console.log(`   Primary (Matrix Gold): ${matrixGoldTheme.primary_color}`)
    console.log(`   Secondary (Charcoal): ${matrixGoldTheme.secondary_color}`)
    console.log(`   Background (Pure White): ${matrixGoldTheme.background_color}`)
    console.log(`   Surface (Cream Yellow): ${matrixGoldTheme.surface_color}`)
    console.log(`   Text Primary (Matrix Black): ${matrixGoldTheme.text_primary}`)
    console.log(`   Text Secondary (Neutral Gray): ${matrixGoldTheme.text_secondary}`)
    console.log('')
    
    console.log('✅ Matrix Gold theme applied successfully!')
    console.log('')
    console.log('🔗 View Matrix Gold theme in action:')
    console.log('   http://localhost:3000/retail1/matrixitworld')
    console.log('')
    console.log('🧪 Test branding interface:')
    console.log('   http://localhost:3000/admin/branding/test')
    
  } catch (error) {
    console.error('❌ Error applying Matrix Gold theme:', error.message)
  }
}

// Run the Matrix Gold theme application
console.log('🚀 Starting Matrix Gold Theme Application...')
applyMatrixGoldTheme().then(() => {
  console.log('')
  console.log('🎉 Matrix Gold Theme Application Complete!')
  console.log('🔥 MatrixIT World now uses the premium Matrix Gold branding!')
  process.exit(0)
}).catch(error => {
  console.error('💥 Matrix Gold Theme Application Failed:', error)
  process.exit(1)
})