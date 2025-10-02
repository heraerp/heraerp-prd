/**
 * HERA Jewelry Rules Pack
 * Business validation and transformation rules for jewelry domain
 */

import type { SmartCodeRules } from '@/lib/universal/v2/hooks'

interface JewelryItem {
  gross_weight?: number
  stone_weight?: number
  net_weight?: number
  purity_karat?: number
  making_charge_type?: 'per_gram' | 'fixed' | 'percent'
  making_charge_rate?: number
  gst_slab?: number
  hsn_code?: string
  hallmark_no?: string
  purity_factor?: number
}

interface JewelryTransaction {
  transaction_type: string
  smart_code: string
  lines?: Array<{
    line_amount: number
    smart_code: string
    [key: string]: any
  }>
}

/**
 * Validate jewelry item entity
 */
function validateEntity(entity: any): string[] {
  const errors: string[] = []

  if (!entity.smart_code?.includes('HERA.JEWELRY.')) {
    return errors // Only validate jewelry entities
  }

  if (entity.smart_code.includes('ITEM.RETAIL')) {
    const item = entity.dynamic_fields as JewelryItem

    // Weight validations
    if (item.gross_weight !== undefined && item.gross_weight < 0) {
      errors.push('Gross weight must be non-negative')
    }

    if (item.stone_weight !== undefined && item.stone_weight < 0) {
      errors.push('Stone weight must be non-negative')
    }

    if (item.net_weight !== undefined && item.net_weight < 0) {
      errors.push('Net weight must be non-negative')
    }

    // Weight relationship validation
    if (item.gross_weight && item.stone_weight && item.net_weight) {
      const calculatedNet = item.gross_weight - item.stone_weight
      if (Math.abs(calculatedNet - item.net_weight) > 0.005) {
        errors.push('Net weight must equal gross weight minus stone weight (±0.005g tolerance)')
      }
    }

    // Purity validation
    if (item.purity_karat !== undefined) {
      if (![10, 14, 18, 22, 24].includes(item.purity_karat)) {
        errors.push('Purity karat must be one of: 10, 14, 18, 22, 24')
      }
    }

    // Making charge validation
    if (
      item.making_charge_type &&
      !['per_gram', 'fixed', 'percent'].includes(item.making_charge_type)
    ) {
      errors.push('Making charge type must be: per_gram, fixed, or percent')
    }

    // GST slab validation
    if (item.gst_slab !== undefined && ![0, 3].includes(item.gst_slab)) {
      errors.push('GST slab must be 0 or 3')
    }

    // HSN code validation
    if (item.hsn_code && !item.hsn_code.startsWith('711')) {
      errors.push('HSN code must start with 711 for jewelry items')
    }
  }

  return errors
}

/**
 * Validate jewelry transaction
 */
function validateTxn(transaction: JewelryTransaction): string[] {
  const errors: string[] = []

  if (!transaction.smart_code?.includes('HERA.JEWELRY.')) {
    return errors // Only validate jewelry transactions
  }

  // SALE.POS must include GST line
  if (transaction.smart_code.includes('SALE.POS')) {
    const hasGSTLine = transaction.lines?.some(line => line.smart_code.includes('TAX.GST'))

    if (!hasGSTLine) {
      errors.push('SALE.POS transaction must include GST tax line')
    }
  }

  // EXCHANGE.OLDGOLD must have negative line amount
  if (transaction.smart_code.includes('EXCHANGE.OLDGOLD')) {
    const exchangeLines = transaction.lines?.filter(line =>
      line.smart_code.includes('EXCHANGE.OLDGOLD')
    )

    if (exchangeLines?.some(line => line.line_amount >= 0)) {
      errors.push('EXCHANGE.OLDGOLD lines must have negative amounts')
    }
  }

  return errors
}

/**
 * Pre-submit transaction processing
 */
function preSubmitTxn(transaction: any): any {
  if (!transaction.smart_code?.includes('HERA.JEWELRY.')) {
    return transaction
  }

  // Derive purity factor if missing
  if (transaction.lines) {
    transaction.lines = transaction.lines.map((line: any) => {
      if (line.purity_karat && !line.purity_factor) {
        line.purity_factor = line.purity_karat / 24
      }

      // Ensure rate fallback injection when absent
      if (line.smart_code?.includes('ITEM.RETAIL') && !line.gold_rate_per_gram) {
        // This would be fetched from current rate in real implementation
        line.needs_rate_injection = true
      }

      return line
    })
  }

  return transaction
}

/**
 * Post-read entity processing
 */
function postReadEntity(entity: any): any {
  if (!entity.smart_code?.includes('HERA.JEWELRY.')) {
    return entity
  }

  // Normalize weights to 3 decimal places
  if (entity.dynamic_fields) {
    const fields = entity.dynamic_fields

    if (fields.gross_weight) {
      fields.gross_weight = Math.round(fields.gross_weight * 1000) / 1000
    }

    if (fields.stone_weight) {
      fields.stone_weight = Math.round(fields.stone_weight * 1000) / 1000
    }

    if (fields.net_weight) {
      fields.net_weight = Math.round(fields.net_weight * 1000) / 1000
    }
  }

  return entity
}

/**
 * Post-read transaction processing
 */
function postReadTxn(transaction: any): any {
  if (!transaction.smart_code?.includes('HERA.JEWELRY.')) {
    return transaction
  }

  // Normalize line amounts and weights
  if (transaction.lines) {
    transaction.lines = transaction.lines.map((line: any) => {
      // Normalize weights
      if (line.gross_weight) {
        line.gross_weight = Math.round(line.gross_weight * 1000) / 1000
      }

      if (line.stone_weight) {
        line.stone_weight = Math.round(line.stone_weight * 1000) / 1000
      }

      if (line.net_weight) {
        line.net_weight = Math.round(line.net_weight * 1000) / 1000
      }

      return line
    })
  }

  return transaction
}

/**
 * Jewelry domain rules export
 */
export const jewelryRules: SmartCodeRules = {
  validateEntity,
  validateTxn,
  preSubmitTxn,
  postReadEntity,
  postReadTxn
}
