/**
 * HERA Jewelry Rates System
 * Jewelry-specific rate functions using Universal Integration Hub
 */

import { getEffectiveRate, calculateMetalValue as calcMetalValue, getCurrentRates } from '@/lib/integration/rates'

/**
 * Get effective gold rate with purity adjustment
 */
export async function getEffectiveGoldRate(
  orgId: string, 
  atISO: string = new Date().toISOString(), 
  purityK: number = 22
): Promise<{
  rate_per_gram: number
  currency: string
  purity_karat: number
  effective_at: string
  source?: string
} | null> {
  const result = await getEffectiveRate(orgId, 'gold', atISO, purityK)
  
  if (!result) {
    return null
  }

  return {
    rate_per_gram: result.rate_per_gram,
    currency: result.currency,
    purity_karat: result.purity_base,
    effective_at: result.effective_at,
    source: result.market_source
  }
}

/**
 * Get effective silver rate
 */
export async function getEffectiveSilverRate(
  orgId: string,
  atISO: string = new Date().toISOString()
): Promise<{
  rate_per_gram: number
  currency: string
  purity_base: number
  effective_at: string
  source?: string
} | null> {
  return await getEffectiveRate(orgId, 'silver', atISO)
}

/**
 * Calculate jewelry metal value
 */
export async function calculateJewelryMetalValue(
  orgId: string,
  metalType: 'gold' | 'silver' | 'platinum',
  weightGrams: number,
  purityKarat: number
): Promise<{
  metal_value: number
  rate_per_gram: number
  pure_weight: number
  calculation_details: {
    gross_weight: number
    purity_karat: number
    purity_factor: number
    rate_source: string
  }
} | null> {
  const result = await calcMetalValue(orgId, metalType, weightGrams, purityKarat)
  
  if (!result) {
    return null
  }

  return {
    metal_value: result.metal_value,
    rate_per_gram: result.rate_used.rate_per_gram,
    pure_weight: result.calculation.pure_weight,
    calculation_details: {
      gross_weight: weightGrams,
      purity_karat: purityKarat,
      purity_factor: result.calculation.purity_factor,
      rate_source: result.rate_used.market_source || 'UNKNOWN'
    }
  }
}

/**
 * Get all current jewelry rates
 */
export async function getJewelryRates(orgId: string) {
  return await getCurrentRates(orgId)
}