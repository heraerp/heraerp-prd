/**
 * HERA Integration - Universal Rates System
 * Generic rate fetching via Universal API v2
 */

import { apiV2 } from '@/lib/universal/v2/client'

export interface RateEntity {
  entity_id: string
  entity_name: string
  smart_code: string
  organization_id: string
  dynamic_fields: {
    rate_per_gram?: { value: number; type: 'number'; smart_code: string }
    currency?: { value: string; type: 'text'; smart_code: string }
    purity_base?: { value: number; type: 'number'; smart_code: string }
    effective_at?: { value: string; type: 'text'; smart_code: string }
    market_source?: { value: string; type: 'text'; smart_code: string }
    confidence_score?: { value: number; type: 'number'; smart_code: string }
  }
  created_at: string
  updated_at: string
}

export interface RateResult {
  rate_per_gram: number
  currency: string
  purity_base: number
  effective_at: string
  market_source?: string
  confidence_score?: number
}

/**
 * Get latest rate entity by smart code prefix
 */
export async function getLatestRateEntity(
  orgId: string,
  smartCodePrefix: string
): Promise<RateEntity | null> {
  try {
    const { data, error } = await apiV2.get('/entities', {
      organization_id: orgId,
      smart_code_prefix: smartCodePrefix,
      order_by: 'updated_at desc',
      limit: 1
    })

    if (error) {
      console.error('Failed to fetch rate entity:', error)
      return null
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return null
    }

    return data[0] as RateEntity
  } catch (error) {
    console.error('Error fetching rate entity:', error)
    return null
  }
}

/**
 * Get effective rate for a specific metal and purity
 */
export async function getEffectiveRate(
  orgId: string,
  metalType: 'gold' | 'silver' | 'platinum',
  atISO: string = new Date().toISOString(),
  targetPurity?: number
): Promise<RateResult | null> {
  const smartCodePrefix = `HERA.JEWELRY.ENTITY.PRICE_LIST.${metalType.toUpperCase()}_RATE`

  const rateEntity = await getLatestRateEntity(orgId, smartCodePrefix)

  if (!rateEntity) {
    return null
  }

  // Extract rate data from dynamic fields
  const ratePerGram = rateEntity.dynamic_fields.rate_per_gram?.value || 0
  const currency = rateEntity.dynamic_fields.currency?.value || 'INR'
  const purityBase = rateEntity.dynamic_fields.purity_base?.value || 24
  const effectiveAt = rateEntity.dynamic_fields.effective_at?.value || rateEntity.updated_at
  const marketSource = rateEntity.dynamic_fields.market_source?.value
  const confidenceScore = rateEntity.dynamic_fields.confidence_score?.value

  // Check if rate is still effective
  const effectiveDate = new Date(effectiveAt)
  const requestDate = new Date(atISO)

  if (requestDate < effectiveDate) {
    console.warn('Requested date is before rate effective date')
  }

  let adjustedRate = ratePerGram

  // Adjust rate for target purity if specified
  if (targetPurity && targetPurity !== purityBase) {
    const purityFactor = targetPurity / purityBase
    adjustedRate = ratePerGram * purityFactor
  }

  return {
    rate_per_gram: Math.round(adjustedRate * 100) / 100,
    currency,
    purity_base: targetPurity || purityBase,
    effective_at: effectiveAt,
    market_source: marketSource,
    confidence_score: confidenceScore
  }
}

/**
 * Create or update a rate entity
 */
export async function upsertRateEntity(
  orgId: string,
  metalType: 'gold' | 'silver' | 'platinum',
  rateData: {
    rate_per_gram: number
    currency?: string
    purity_base?: number
    market_source?: string
    confidence_score?: number
  }
): Promise<RateEntity | null> {
  try {
    const smartCode = `HERA.JEWELRY.ENTITY.PRICE_LIST.${metalType.toUpperCase()}_RATE.V1`

    const { data, error } = await apiV2.post('/entities', {
      organization_id: orgId,
      entity_type: 'price_list',
      entity_name: `${metalType.charAt(0).toUpperCase() + metalType.slice(1)} Rate ${new Date().toLocaleDateString()}`,
      entity_code: `${metalType.toUpperCase()}_RATE_${Date.now()}`,
      smart_code: smartCode,
      dynamic_fields: {
        rate_per_gram: {
          value: rateData.rate_per_gram,
          type: 'number',
          smart_code: `${smartCode}.RATE_PER_GRAM`
        },
        currency: {
          value: rateData.currency || 'INR',
          type: 'text',
          smart_code: `${smartCode}.CURRENCY`
        },
        purity_base: {
          value: rateData.purity_base || (metalType === 'gold' ? 24 : 999),
          type: 'number',
          smart_code: `${smartCode}.PURITY_BASE`
        },
        effective_at: {
          value: new Date().toISOString(),
          type: 'text',
          smart_code: `${smartCode}.EFFECTIVE_AT`
        },
        market_source: {
          value: rateData.market_source || 'MANUAL',
          type: 'text',
          smart_code: `${smartCode}.MARKET_SOURCE`
        },
        confidence_score: {
          value: rateData.confidence_score || 1.0,
          type: 'number',
          smart_code: `${smartCode}.CONFIDENCE_SCORE`
        }
      }
    })

    if (error) {
      console.error('Failed to upsert rate entity:', error)
      return null
    }

    return data as RateEntity
  } catch (error) {
    console.error('Error upserting rate entity:', error)
    return null
  }
}

/**
 * Get all current rates for organization
 */
export async function getCurrentRates(orgId: string): Promise<{
  gold?: RateResult
  silver?: RateResult
  platinum?: RateResult
}> {
  const [gold, silver, platinum] = await Promise.all([
    getEffectiveRate(orgId, 'gold'),
    getEffectiveRate(orgId, 'silver'),
    getEffectiveRate(orgId, 'platinum')
  ])

  return {
    ...(gold && { gold }),
    ...(silver && { silver }),
    ...(platinum && { platinum })
  }
}

/**
 * Calculate metal value using current rates
 */
export async function calculateMetalValue(
  orgId: string,
  metalType: 'gold' | 'silver' | 'platinum',
  weight: number,
  purity: number
): Promise<{
  metal_value: number
  rate_used: RateResult
  calculation: {
    weight: number
    purity: number
    purity_factor: number
    pure_weight: number
    rate_per_gram: number
  }
} | null> {
  const rate = await getEffectiveRate(orgId, metalType, undefined, 24) // Get 24K base rate

  if (!rate) {
    return null
  }

  const purityFactor = purity / 24
  const pureWeight = weight * purityFactor
  const metalValue = pureWeight * rate.rate_per_gram

  return {
    metal_value: Math.round(metalValue * 100) / 100,
    rate_used: rate,
    calculation: {
      weight,
      purity,
      purity_factor: purityFactor,
      pure_weight: pureWeight,
      rate_per_gram: rate.rate_per_gram
    }
  }
}
