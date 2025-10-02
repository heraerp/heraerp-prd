/**
 * HERA Jewelry UCR Helper
 * Smart code utilities for jewelry domain
 */

import jewelrySmartCodes from '@/data/ucr/jewelry.smart-codes.json'

type SmartCodeKind = 'entities' | 'transactions' | 'lines' | 'relationships'

interface SmartCodeMap {
  entities: Record<string, string>
  transactions: Record<string, string>
  lines: Record<string, string>
  relationships: Record<string, string>
}

/**
 * Get jewelry smart code by kind and key
 */
export function getJewelrySmartCode(kind: SmartCodeKind, key: string): string {
  const codes = jewelrySmartCodes as SmartCodeMap

  if (!codes[kind] || !codes[kind][key]) {
    throw new Error(`Smart code not found: ${kind}.${key}`)
  }

  return codes[kind][key]
}

/**
 * Common smart code getters for convenience
 */
export const JewelrySmartCodes = {
  // Entities
  ITEM_RETAIL: () => getJewelrySmartCode('entities', 'ITEM_RETAIL'),
  COLLECTION: () => getJewelrySmartCode('entities', 'COLLECTION'),
  METAL: () => getJewelrySmartCode('entities', 'METAL'),
  STONE: () => getJewelrySmartCode('entities', 'STONE'),
  PRICE_LIST_GOLD_RATE: () => getJewelrySmartCode('entities', 'PRICE_LIST_GOLD_RATE'),
  PRICE_LIST_DIAMOND_RATE: () => getJewelrySmartCode('entities', 'PRICE_LIST_DIAMOND_RATE'),
  VENDOR_KARIGAR: () => getJewelrySmartCode('entities', 'VENDOR_KARIGAR'),
  CUSTOMER_RETAIL: () => getJewelrySmartCode('entities', 'CUSTOMER_RETAIL'),
  BRANCH_SHOWROOM: () => getJewelrySmartCode('entities', 'BRANCH_SHOWROOM'),
  TAX_PROFILE_GST: () => getJewelrySmartCode('entities', 'TAX_PROFILE_GST'),

  // Transactions
  SALE_POS: () => getJewelrySmartCode('transactions', 'SALE_POS'),
  RETURN_POS: () => getJewelrySmartCode('transactions', 'RETURN_POS'),
  EXCHANGE_OLDGOLD: () => getJewelrySmartCode('transactions', 'EXCHANGE_OLDGOLD'),
  APPROVAL_MEMO: () => getJewelrySmartCode('transactions', 'APPROVAL_MEMO'),
  PURCHASE_GRN: () => getJewelrySmartCode('transactions', 'PURCHASE_GRN'),
  JOBWORK_ISSUE: () => getJewelrySmartCode('transactions', 'JOBWORK_ISSUE'),
  JOBWORK_RECEIPT: () => getJewelrySmartCode('transactions', 'JOBWORK_RECEIPT'),
  MELT_SCRAP: () => getJewelrySmartCode('transactions', 'MELT_SCRAP'),
  STOCK_TRANSFER: () => getJewelrySmartCode('transactions', 'STOCK_TRANSFER'),
  INVENTORY_COUNT: () => getJewelrySmartCode('transactions', 'INVENTORY_COUNT'),
  REPAIR_INTAKE: () => getJewelrySmartCode('transactions', 'REPAIR_INTAKE'),
  REPAIR_DELIVERY: () => getJewelrySmartCode('transactions', 'REPAIR_DELIVERY'),

  // Lines
  ITEM_RETAIL_LINE: () => getJewelrySmartCode('lines', 'ITEM_RETAIL'),
  MAKING_CHARGE: () => getJewelrySmartCode('lines', 'MAKING_CHARGE'),
  STONE_VALUE: () => getJewelrySmartCode('lines', 'STONE_VALUE'),
  TAX_GST: () => getJewelrySmartCode('lines', 'TAX_GST'),
  EXCHANGE_OLDGOLD_LINE: () => getJewelrySmartCode('lines', 'EXCHANGE_OLDGOLD'),
  ADJUSTMENT_ROUNDING: () => getJewelrySmartCode('lines', 'ADJUSTMENT_ROUNDING'),

  // Relationships
  BOM_COMPONENT: () => getJewelrySmartCode('relationships', 'BOM_COMPONENT'),
  PRICE_LIST_ASSIGNMENT: () => getJewelrySmartCode('relationships', 'PRICE_LIST_ASSIGNMENT'),
  JOBWORK_ASSIGNMENT: () => getJewelrySmartCode('relationships', 'JOBWORK_ASSIGNMENT')
}

/**
 * Validate if smart code belongs to jewelry domain
 */
export function isJewelrySmartCode(smartCode: string): boolean {
  return smartCode.startsWith('HERA.JEWELRY.')
}

/**
 * Extract smart code components
 */
export function parseJewelrySmartCode(smartCode: string): {
  domain: string
  category: string
  type: string
  subtype?: string
  version: string
} | null {
  const parts = smartCode.split('.')

  if (parts.length < 4 || parts[0] !== 'HERA' || parts[1] !== 'JEWELRY') {
    return null
  }

  return {
    domain: parts[1], // JEWELRY
    category: parts[2], // ITEM, SALE, etc.
    type: parts[3], // RETAIL, POS, etc.
    subtype: parts[4], // Optional
    version: parts[parts.length - 1] // V1, V2, etc.
  }
}
