/**
 * Salon Theme - Custom Color Palette
 * Professional salon app with elegant purple-pink gradient
 */

export const salonPinterest2025Theme = {
  name: 'Salon Theme',
  colors: {
    // Background gradient colors
    bgStart: '#8332EC', // Purple start
    bgEnd: '#CE8A73', // Peach end

    // Surface colors
    surface: '#762866', // Dark purple surface
    surfaceLight: '#E7D8D5', // Light beige surface

    // Accent color
    accent: '#DD97E2', // Pink accent

    // Text colors
    textOnDark: '#FFFFFF', // White text on dark surfaces
    textOnLight: '#2D1B2E', // Very dark plum on light surfaces

    // Additional colors for various UI elements
    success: '#10B981', // Green for success states
    warning: '#F59E0B', // Amber for warnings
    danger: '#EF4444', // Red for errors
    info: '#3B82F6' // Blue for info
  }
}

// Color variations for different UI elements
export const salonColorVariants = {
  // Gradient combinations
  gradients: {
    background: 'from-[#8332EC] to-[#CE8A73]', // Main background gradient
    surface: 'from-[#762866] to-[#5A1F4F]', // Surface gradient variation
    accent: 'from-[#DD97E2] to-[#C573CC]', // Accent gradient
    highlight: 'from-[#DD97E2]/20 to-[#8332EC]/20' // Subtle highlight
  },

  // Status colors (using the accent and surface colors)
  status: {
    available: '#10B981', // Success green
    busy: '#DD97E2', // Accent pink
    break: '#F59E0B', // Warning amber
    offline: '#6B7280' // Gray
  },

  // Service categories (variations of the main colors)
  services: {
    hair: '#DD97E2', // Accent pink
    beauty: '#8332EC', // Purple
    nails: '#CE8A73', // Peach
    spa: '#762866', // Surface purple
    makeup: '#E7D8D5' // Light surface
  }
}
