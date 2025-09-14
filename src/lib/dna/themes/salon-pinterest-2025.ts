/**
 * Pinterest 2025 Salon & Beauty Color Palette
 * Applied to HERA Glassmorphic Dark Template
 */

export const salonPinterest2025Theme = {
  name: 'Salon Pinterest 2025',
  colors: {
    // Primary: Cherry Red - Bold, vibrant red for energy and passion
    primary: '#DC143C',
    
    // Secondary: Aura Indigo - Mystical lilac-purple for ethereal vibe
    secondary: '#9370DB',
    
    // Accent: Butter Yellow - Warm, playful pastel yellow
    accent: '#FFE4B5',
    
    // Danger: Deeper Cherry Red for alerts
    danger: '#B91C1C',
    dangerDark: '#991B1B',
    
    // Dark Base: Deep indigo-black for contrast
    darkBase: '#1A0F1F',
    
    // Additional colors for the palette
    dillGreen: '#8FBC8F',  // Fresh, tangy green
    alpineOat: '#D2B48C',  // Cozy beige neutral
  }
}

// Color variations for different UI elements
export const salonColorVariants = {
  // Gradient combinations
  gradients: {
    primary: 'from-[#DC143C] to-[#9370DB]',      // Cherry to Indigo
    secondary: 'from-[#9370DB] to-[#FFE4B5]',    // Indigo to Butter
    accent: 'from-[#FFE4B5] to-[#8FBC8F]',       // Butter to Dill
    warm: 'from-[#DC143C] to-[#FFE4B5]',         // Cherry to Butter
    natural: 'from-[#8FBC8F] to-[#D2B48C]',      // Dill to Alpine
  },
  
  // Status colors
  status: {
    available: '#8FBC8F',    // Dill Green
    busy: '#DC143C',         // Cherry Red
    break: '#FFE4B5',        // Butter Yellow
    offline: '#D2B48C'       // Alpine Oat
  },
  
  // Service categories
  services: {
    hair: '#DC143C',         // Cherry Red
    beauty: '#9370DB',       // Aura Indigo
    nails: '#FFE4B5',        // Butter Yellow
    spa: '#8FBC8F',          // Dill Green
    makeup: '#D2B48C'        // Alpine Oat
  }
}