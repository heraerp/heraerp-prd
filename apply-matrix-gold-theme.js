/**
 * Apply Matrix Gold Theme to MatrixIT World Organization
 * Updates the database with the new Matrix Gold branding colors
 */

import { brandingEngine } from './src/lib/platform/branding-engine.js'
import { MATRIXITWORLD_CONFIG } from './src/lib/constants/matrixitworld.js'

async function applyMatrixGoldTheme() {
  console.log('🎨 Applying Matrix Gold Theme to MatrixIT World Organization')
  console.log('=' .repeat(60))
  
  // Matrix Gold Brand Colors
  const matrixGoldTheme = {
    // Matrix Gold Brand Colors (as specified)
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
    
    // Typography and styling
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
  
  try {
    console.log('🎯 Matrix Gold Color Palette:')
    console.log(`   Primary (Matrix Gold): ${matrixGoldTheme.primary_color}`)
    console.log(`   Secondary (Charcoal): ${matrixGoldTheme.secondary_color}`)
    console.log(`   Background (Pure White): ${matrixGoldTheme.background_color}`)
    console.log(`   Surface (Cream Yellow): ${matrixGoldTheme.surface_color}`)
    console.log(`   Text Primary (Matrix Black): ${matrixGoldTheme.text_primary}`)
    console.log(`   Text Secondary (Neutral Gray): ${matrixGoldTheme.text_secondary}`)
    console.log('')
    
    const organizationId = MATRIXITWORLD_CONFIG.ORGANIZATION_ID
    console.log(`📍 Organization ID: ${organizationId}`)
    console.log('⚡ Applying Matrix Gold theme to database...')
    
    const startTime = Date.now()
    const success = await brandingEngine.updateBranding(organizationId, matrixGoldTheme)
    const duration = Date.now() - startTime
    
    if (success) {
      console.log(`✅ Matrix Gold theme applied successfully in ${duration}ms`)
      console.log('')
      console.log('🎯 Theme Application Results:')
      console.log('   - CSS variables updated in database')
      console.log('   - Color variations generated (50-900 shades)')
      console.log('   - Branding engine cache updated')
      console.log('   - Real-time theme switching enabled')
      console.log('')
      console.log('🔗 View Matrix Gold theme in action:')
      console.log('   http://localhost:3000/retail1/matrixitworld')
      console.log('   http://localhost:3000/retail1/matrixitworld/dashboard')
      console.log('')
      console.log('🧪 Test branding interface:')
      console.log('   http://localhost:3000/admin/branding/test')
      
    } else {
      console.error('❌ Failed to apply Matrix Gold theme')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Error applying Matrix Gold theme:', error.message)
    process.exit(1)
  }
}

// Run the Matrix Gold theme application
console.log('🚀 Starting Matrix Gold Theme Application...')
applyMatrixGoldTheme().then(() => {
  console.log('')
  console.log('🎉 Matrix Gold Theme Application Complete!')
  console.log('🔥 MatrixIT World now uses the premium Matrix Gold branding!')
}).catch(error => {
  console.error('💥 Matrix Gold Theme Application Failed:', error)
})