// HairTalkz Salon Constants
export const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Michele's salon

// Organization mapping for subdomain routing
export const SALON_ORG_MAPPING = {
  hairtalkz: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  'hairtalkz.localhost': '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  'hairtalkz.heraerp.com': '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  heratalkz: '378f24fb-d496-4ff7-8afa-ea34895a0eb8', // Support typo version
  'heratalkz.localhost': '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  'heratalkz.heraerp.com': '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
}

// Get organization ID based on hostname or path
export function getSalonOrgId(hostname?: string, pathname?: string): string {
  // Check subdomain
  if (hostname) {
    for (const [domain, orgId] of Object.entries(SALON_ORG_MAPPING)) {
      if (hostname.includes(domain)) {
        return orgId
      }
    }
  }

  // Check path-based routing (for localhost development)
  if (pathname?.startsWith('/~hairtalkz') || pathname?.startsWith('/~heratalkz')) {
    return HAIRTALKZ_ORG_ID
  }

  // Default to HairTalkz org ID
  return HAIRTALKZ_ORG_ID
}

// Luxe color palette - Enhanced for enterprise dashboard
export const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  goldLight: '#E5C158',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  bronzeLight: '#A89168',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#B794F4',

  // Enhanced emerald with better contrast
  emerald: '#10B981', // Brighter emerald green (from Tailwind emerald-500)
  emeraldDark: '#059669', // emerald-600
  emeraldLight: '#34D399', // emerald-400
  emeraldGlow: 'rgba(16, 185, 129, 0.4)', // For glow effects

  ruby: '#DC2626',
  rubyDark: '#991B1B',
  sapphire: '#2563EB',
  sapphireDark: '#1E40AF',
  sapphireLight: '#3B82F6',
  orange: '#F97316',
  orangeDark: '#D97706',
  purple: '#9333EA',

  // Status colors for analytics
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Chart colors palette
  chartColors: {
    primary: '#D4AF37',
    secondary: '#10B981',
    tertiary: '#3B82F6',
    quaternary: '#F59E0B',
    quinary: '#B794F4',
    senary: '#F97316'
  }
}
