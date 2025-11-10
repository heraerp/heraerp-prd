/**
 * ================================================================================
 * HERA Finance DNA v2 - Smart Code Registry
 * Enterprise-Grade Production Standards
 * ================================================================================
 *
 * Smart Code Standards (MANDATORY):
 * - Minimum 6 segments, maximum 8 segments
 * - ALL UPPERCASE except version
 * - Version MUST be lowercase .v1 (not .V1)
 * - NO underscores (use dots only)
 * - Structure: HERA.MODULE.DOMAIN.TYPE.SUBTYPE.ACTION.v1
 *
 * Version History:
 * - v1: Initial production release (2025-11-06)
 *
 * ================================================================================
 */

// ============================================================================
// INVENTORY SMART CODES
// ============================================================================

export const INVENTORY_SMART_CODES = {
  // Transaction Types (7 segments each)
  TRANSACTION: {
    OPENING: 'HERA.SALON.INVENTORY.TXN.OPENING.STOCK.v1',
    RECEIPT: 'HERA.SALON.INVENTORY.TXN.RECEIPT.STOCK.v1',
    ADJUSTMENT: 'HERA.SALON.INVENTORY.TXN.ADJUSTMENT.STOCK.v1',
    ISSUE: 'HERA.SALON.INVENTORY.TXN.ISSUE.STOCK.v1'
  },

  // GL Journal (7 segments)
  GL_JOURNAL: 'HERA.SALON.FINANCE.TXN.JOURNAL.INVENTORY.v1',

  // GL Lines - Asset & Clearing (8 segments each)
  GL_LINE: {
    // Receipts & Opening Stock
    INVENTORY_ASSET_DR: 'HERA.SALON.FINANCE.GL.LINE.INVENTORY.ASSET.DR.v1',
    INVENTORY_CLEARING_CR: 'HERA.SALON.FINANCE.GL.LINE.INVENTORY.CLEARING.CR.v1',

    // Issues & Sales
    COGS_DR: 'HERA.SALON.FINANCE.GL.LINE.COGS.DR.v1',
    INVENTORY_ASSET_CR: 'HERA.SALON.FINANCE.GL.LINE.INVENTORY.ASSET.CR.v1',

    // Adjustments
    ADJUSTMENT_GAIN_CR: 'HERA.SALON.FINANCE.GL.LINE.INVENTORY.ADJUSTMENT.CR.v1',
    ADJUSTMENT_LOSS_DR: 'HERA.SALON.FINANCE.GL.LINE.INVENTORY.ADJUSTMENT.DR.v1'
  },

  // Stock Entity (6 segments)
  ENTITY: {
    STOCK: 'HERA.SALON.INVENTORY.ENTITY.STOCK.PROJECTION.v1'
  },

  // Dynamic Fields (6-7 segments each)
  FIELD: {
    QUANTITY: 'HERA.SALON.INVENTORY.FIELD.STOCK.QUANTITY.v1',
    COST_PRICE: 'HERA.SALON.INVENTORY.FIELD.COST.PRICE.v1',
    LAST_MOVEMENT: 'HERA.SALON.INVENTORY.FIELD.LAST.MOVEMENT.v1',
    LAST_UPDATED: 'HERA.SALON.INVENTORY.FIELD.LAST.UPDATED.v1'
  },

  // Relationships (7-8 segments)
  RELATIONSHIP: {
    STOCK_OF_PRODUCT: 'HERA.SALON.INVENTORY.REL.STOCK.OF.PRODUCT.v1',
    STOCK_AT_LOCATION: 'HERA.SALON.INVENTORY.REL.STOCK.AT.LOCATION.v1'
  }
} as const

// ============================================================================
// EXPENSE SMART CODES
// ============================================================================

export const EXPENSE_SMART_CODES = {
  // Transaction Type (7 segments)
  TRANSACTION: {
    OPERATIONAL: 'HERA.SALON.FINANCE.TXN.EXPENSE.OPERATIONAL.v1'
  },

  // GL Journal (7 segments)
  GL_JOURNAL: 'HERA.SALON.FINANCE.TXN.JOURNAL.EXPENSE.v1',

  // Expense Line Items (7 segments each)
  LINE_ITEM: {
    RENT: 'HERA.SALON.EXPENSE.LINE.ITEM.RENT.v1',
    UTILITIES: 'HERA.SALON.EXPENSE.LINE.ITEM.UTILITIES.v1',
    SALARY: 'HERA.SALON.EXPENSE.LINE.ITEM.SALARY.v1',
    WAGES: 'HERA.SALON.EXPENSE.LINE.ITEM.WAGES.v1',
    SUPPLIES: 'HERA.SALON.EXPENSE.LINE.ITEM.SUPPLIES.v1',
    MARKETING: 'HERA.SALON.EXPENSE.LINE.ITEM.MARKETING.v1',
    MAINTENANCE: 'HERA.SALON.EXPENSE.LINE.ITEM.MAINTENANCE.v1',
    INSURANCE: 'HERA.SALON.EXPENSE.LINE.ITEM.INSURANCE.v1',
    DEPRECIATION: 'HERA.SALON.EXPENSE.LINE.ITEM.DEPRECIATION.v1',
    OTHER: 'HERA.SALON.EXPENSE.LINE.ITEM.OTHER.v1'
  },

  // GL Lines - Expense Categories (8 segments each)
  GL_LINE_DR: {
    RENT: 'HERA.SALON.FINANCE.GL.LINE.EXPENSE.RENT.DR.v1',
    UTILITIES: 'HERA.SALON.FINANCE.GL.LINE.EXPENSE.UTILITIES.DR.v1',
    SALARY: 'HERA.SALON.FINANCE.GL.LINE.EXPENSE.SALARY.DR.v1',
    WAGES: 'HERA.SALON.FINANCE.GL.LINE.EXPENSE.WAGES.DR.v1',
    SUPPLIES: 'HERA.SALON.FINANCE.GL.LINE.EXPENSE.SUPPLIES.DR.v1',
    MARKETING: 'HERA.SALON.FINANCE.GL.LINE.EXPENSE.MARKETING.DR.v1',
    MAINTENANCE: 'HERA.SALON.FINANCE.GL.LINE.EXPENSE.MAINTENANCE.DR.v1',
    INSURANCE: 'HERA.SALON.FINANCE.GL.LINE.EXPENSE.INSURANCE.DR.v1',
    DEPRECIATION: 'HERA.SALON.FINANCE.GL.LINE.EXPENSE.DEPRECIATION.DR.v1',
    OTHER: 'HERA.SALON.FINANCE.GL.LINE.EXPENSE.OTHER.DR.v1'
  },

  // GL Lines - Payment Methods (7 segments each)
  GL_LINE_CR: {
    CASH: 'HERA.SALON.FINANCE.GL.LINE.CASH.CR.v1',
    BANK: 'HERA.SALON.FINANCE.GL.LINE.BANK.CR.v1',
    CARD: 'HERA.SALON.FINANCE.GL.LINE.CARD.CR.v1'
  }
} as const

// ============================================================================
// SALES SMART CODES (Reference - Already in gl-posting-engine.ts)
// ============================================================================

export const SALES_SMART_CODES = {
  // GL Journal (7 segments)
  GL_JOURNAL: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v2',  // v2 because upgraded

  // GL Lines - Debit Side (7-8 segments)
  GL_LINE_DR: {
    CASH: 'HERA.SALON.FINANCE.GL.LINE.CASH.DR.v2',
    CARD: 'HERA.SALON.FINANCE.GL.LINE.CARD.DR.v2',
    BANK: 'HERA.SALON.FINANCE.GL.LINE.BANK.DR.v2',
    SERVICE_DISCOUNT: 'HERA.SALON.FINANCE.GL.LINE.DISCOUNT.SERVICE.DR.v2',
    PRODUCT_DISCOUNT: 'HERA.SALON.FINANCE.GL.LINE.DISCOUNT.PRODUCT.DR.v2',
    CART_DISCOUNT: 'HERA.SALON.FINANCE.GL.LINE.DISCOUNT.CART.DR.v2'
  },

  // GL Lines - Credit Side (7-8 segments)
  GL_LINE_CR: {
    SERVICE_REVENUE: 'HERA.SALON.FINANCE.GL.LINE.REVENUE.SERVICE.CR.v2',
    PRODUCT_REVENUE: 'HERA.SALON.FINANCE.GL.LINE.REVENUE.PRODUCT.CR.v2',
    VAT: 'HERA.SALON.FINANCE.GL.LINE.VAT.CR.v2',
    TIPS: 'HERA.SALON.FINANCE.GL.LINE.TIPS.CR.v2'
  }
} as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate smart code format
 * @param smartCode - Smart code to validate
 * @returns true if valid, false otherwise
 */
export function validateSmartCode(smartCode: string): boolean {
  // Must match: HERA.SEGMENT.SEGMENT...SEGMENT.v1
  const pattern = /^HERA(\.[A-Z0-9]+){5,7}\.v\d+$/
  return pattern.test(smartCode)
}

/**
 * Get smart code version
 * @param smartCode - Smart code string
 * @returns version number (e.g., 1, 2)
 */
export function getSmartCodeVersion(smartCode: string): number {
  const match = smartCode.match(/\.v(\d+)$/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Get smart code module
 * @param smartCode - Smart code string
 * @returns module name (e.g., 'SALON', 'FINANCE')
 */
export function getSmartCodeModule(smartCode: string): string {
  const parts = smartCode.split('.')
  return parts[1] || ''
}

/**
 * Get smart code domain
 * @param smartCode - Smart code string
 * @returns domain name (e.g., 'INVENTORY', 'EXPENSE')
 */
export function getSmartCodeDomain(smartCode: string): string {
  const parts = smartCode.split('.')
  return parts[2] || ''
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All Finance DNA v2 smart codes
 */
export const FINANCE_DNA_V2_SMART_CODES = {
  INVENTORY: INVENTORY_SMART_CODES,
  EXPENSE: EXPENSE_SMART_CODES,
  SALES: SALES_SMART_CODES
} as const

/**
 * Type-safe smart code access
 */
export type InventorySmartCode = typeof INVENTORY_SMART_CODES
export type ExpenseSmartCode = typeof EXPENSE_SMART_CODES
export type SalesSmartCode = typeof SALES_SMART_CODES
export type FinanceDNASmartCodes = typeof FINANCE_DNA_V2_SMART_CODES
