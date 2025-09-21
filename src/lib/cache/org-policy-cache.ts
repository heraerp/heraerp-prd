/**
 * In-memory cache for organization policies (VAT, rounding, discount caps)
 * 60-second TTL to avoid re-reading per request
 */

interface OrgPolicy {
  vatRate: number
  rounding: 'ROUND' | 'CEIL' | 'FLOOR'
  discountCaps: {
    maxPercent: number
    maxAmount: number
  }
  currency: string
  cachedAt: number
}

const policyCache = new Map<string, OrgPolicy>()
const CACHE_TTL_MS = 60 * 1000 // 60 seconds

export async function getOrgPolicy(organizationId: string): Promise<OrgPolicy> {
  const cached = policyCache.get(organizationId)
  const now = Date.now()

  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached
  }

  // Default policy for Hair Talkz (can be made database-driven later)
  const policy: OrgPolicy = {
    vatRate: 0.2, // 20% VAT standard for UK
    rounding: 'ROUND',
    discountCaps: {
      maxPercent: 50,
      maxAmount: 1000
    },
    currency: 'GBP',
    cachedAt: now
  }

  policyCache.set(organizationId, policy)
  return policy
}

export function clearPolicyCache(organizationId?: string) {
  if (organizationId) {
    policyCache.delete(organizationId)
  } else {
    policyCache.clear()
  }
}
