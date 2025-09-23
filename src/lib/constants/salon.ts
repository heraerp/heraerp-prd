// HairTalkz Salon Constants
export const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Michele's salon

// Organization mapping for subdomain routing
export const SALON_ORG_MAPPING = {
  'hairtalkz': '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  'hairtalkz.localhost': '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  'hairtalkz.heraerp.com': '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
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
  if (pathname?.startsWith('/~hairtalkz')) {
    return HAIRTALKZ_ORG_ID
  }
  
  // Default to HairTalkz org ID
  return HAIRTALKZ_ORG_ID
}

// Luxe color palette
export const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#B794F4',
  emerald: '#0F6F5C',
  ruby: '#DC2626',
  sapphire: '#2563EB',
  orange: '#F97316'
}