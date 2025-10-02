import { allPartners, type Partner } from '../../.contentlayer/generated'

/**
 * Get all published partners sorted by name
 */
export function getAllPartners(): Partner[] {
  return allPartners
    .filter(partner => partner.published !== false)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get a partner by slug (exact match)
 * Returns null if not found or not published
 */
export function getPartnerBySlug(slug: string): Partner | null {
  const partner = allPartners.find(
    p => p.slug === slug && p.published !== false
  )
  return partner ?? null
}

/**
 * Assert that all partner slugs are unique
 * Throws an error if duplicates are found
 */
export function assertUniqueSlugs(partners: Partner[]): void {
  const slugs = new Set<string>()
  const duplicates: string[] = []

  for (const partner of partners) {
    if (slugs.has(partner.slug)) {
      duplicates.push(partner.slug)
    }
    slugs.add(partner.slug)
  }

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate partner slugs found: ${duplicates.join(', ')}`
    )
  }
}

/**
 * Type guard to check if a partner has contacts
 */
export function hasContacts(partner: Partner): boolean {
  return Array.isArray(partner.contacts) && partner.contacts.length > 0
}

/**
 * Type guard to check if a partner has a headquarters location
 */
export function hasHeadquarters(partner: Partner): boolean {
  return typeof partner.locations === 'object' &&
         partner.locations !== null &&
         'hq' in partner.locations &&
         typeof partner.locations.hq === 'string'
}