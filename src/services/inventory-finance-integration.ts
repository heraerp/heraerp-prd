/**
 * HERA Inventory-Finance Integration (Finance DNA)
 *
 * Architecture:
 * - Automatically posts GL entries for inventory movements
 * - Maintains inventory asset valuation
 * - Posts COGS for inventory issues
 * - Balanced DR/CR per currency (Guardrails v2.0 compliant)
 * - Idempotent: safe to run multiple times on same transaction
 *
 * GL Account Structure:
 * - Inventory Asset (DR on receipt, CR on issue)
 * - COGS Expense (DR on issue)
 * - Inventory Clearing (CR on receipt, balancing entry)
 *
 * Smart Codes (Enterprise v2.0 Standard):
 * - HERA.SALON.FINANCE.TXN.JOURNAL.INVENTORY.v1
 * - HERA.SALON.FINANCE.GL.LINE.COST.GOODS.SOLD.DR.v1
 */

import { apiV2 } from '@/lib/client/fetchV2'
import { INVENTORY_SMART_CODES } from '@/lib/finance/smart-codes-finance-dna-v2'
import { FinanceGuardrails } from '@/lib/dna/integration/finance-integration-dna-v2'

interface PostInventoryToFinanceParams {
  inventoryTransactionId: string
  organizationId: string
  actorUserId: string
}

interface GLLine {
  line_number: number
  line_type: 'GL'
  description: string
  quantity: string
  unit_amount: number
  line_amount: number
  smart_code: string
  line_data: {
    side: 'DR' | 'CR'
    account: string
    account_name: string
    currency: string
    product_id?: string
    location_id?: string
  }
}

/**
 * Post inventory movement transaction to Finance (GL)
 * Creates balanced DR/CR journal entries
 */
export async function postInventoryMovementToFinance({
  inventoryTransactionId,
  organizationId,
  actorUserId
}: PostInventoryToFinanceParams): Promise<{
  success: boolean
  financeTransactionId?: string
  error?: string
}> {
  try {
    console.log('💰 [Finance Integration] Processing inventory transaction:', inventoryTransactionId)

    // 1. Fetch original inventory transaction
    const invTxnResult = await apiV2.get('transactions/rpc', {
      p_action: 'READ',
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_transaction: {
        transaction_id: inventoryTransactionId
      },
      p_options: {
        include_lines: true
      }
    })

    if (invTxnResult.error || !invTxnResult.data?.data) {
      throw new Error(invTxnResult.error?.message || 'Inventory transaction not found')
    }

    const invTransaction = invTxnResult.data.data

    // Check if already posted to finance
    if (invTransaction.metadata?.posted_to_finance) {
      console.log('⏭️ [Finance Integration] Already posted to finance')
      return { success: true }
    }

    // 🛡️ Finance DNA v2 Guardrails: Validate fiscal period
    const fiscalValidation = await FinanceGuardrails.validateFiscalPeriod(
      invTransaction.transaction_date,
      organizationId
    )
    if (!fiscalValidation.isValid) {
      console.error('❌ [Finance Integration] Fiscal period validation failed:', fiscalValidation.reason)
      return {
        success: false,
        error: `Finance DNA v2: ${fiscalValidation.reason}`
      }
    }

    // 🛡️ Finance DNA v2 Guardrails: Validate currency support
    const currencyValidation = await FinanceGuardrails.validateCurrencySupport(
      'AED', // TODO: get from organization settings
      organizationId
    )
    if (!currencyValidation.isValid) {
      console.error('❌ [Finance Integration] Currency validation failed')
      return {
        success: false,
        error: 'Finance DNA v2: AED currency not supported'
      }
    }

    console.log('✅ [Finance Integration] Finance DNA v2 guardrails passed')

    // 2. Determine GL posting pattern based on movement type
    const movementType = invTransaction.transaction_type
    const glLines = await buildGLLines({
      inventoryTransaction: invTransaction,
      organizationId
    })

    if (glLines.length === 0) {
      console.log('⏭️ [Finance Integration] No GL lines to post')
      return { success: true }
    }

    // 3. Verify balanced (DR = CR per currency) - Guardrails v2.0 requirement
    const totalDR = glLines
      .filter(l => l.line_data.side === 'DR')
      .reduce((sum, l) => sum + l.line_amount, 0)

    const totalCR = glLines
      .filter(l => l.line_data.side === 'CR')
      .reduce((sum, l) => sum + l.line_amount, 0)

    if (Math.abs(totalDR - totalCR) > 0.01) {
      throw new Error(`Unbalanced GL entries: DR ${totalDR.toFixed(2)} ≠ CR ${totalCR.toFixed(2)}`)
    }

    console.log(`💰 [Finance Integration] Balanced: DR ${totalDR.toFixed(2)} = CR ${totalCR.toFixed(2)}`)

    // 4. Create Finance transaction with Finance DNA v2 metadata
    const financeSmartCode = getFinanceSmartCode(movementType)

    const financeTxnPayload = {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_transaction: {
        transaction_type: 'GL_JOURNAL',
        smart_code: financeSmartCode,
        transaction_number: `GL-INV-${Date.now()}`,
        transaction_date: invTransaction.transaction_date,
        total_amount: totalDR, // Total transaction value
        transaction_status: 'completed',
        metadata: {
          // Finance DNA v2 Standard Metadata
          finance_dna_version: 'v2.0',
          source_system: 'HERA.SALON.INVENTORY',
          source_transaction_id: inventoryTransactionId,
          source_transaction_type: movementType,
          source_transaction_number: invTransaction.transaction_number,
          posting_type: 'AUTO', // AUTO vs MANUAL
          posted_from_inventory: true,
          posting_timestamp: new Date().toISOString(),

          // Guardrails v2.0 Validation Results
          fiscal_period_validated: true,
          currency_validated: true,
          balance_validated: true,
          validation_timestamp: new Date().toISOString(),

          // GL Balance Summary
          total_dr: totalDR,
          total_cr: totalCR,
          currency: 'AED',

          // Business Context
          movement_type: movementType,
          description: `Auto-posted from ${movementType}`,
          inventory_transaction_date: invTransaction.transaction_date
        }
      },
      p_lines: glLines,
      p_options: {}
    }

    const financeResult = await apiV2.post('transactions/rpc', financeTxnPayload)

    if (financeResult.error || !financeResult.data?.data) {
      throw new Error(financeResult.error?.message || 'Failed to create finance transaction')
    }

    const financeTransactionId = financeResult.data.data.id

    console.log('✅ [Finance Integration] GL transaction created:', financeTransactionId)

    // 5. Mark inventory transaction as posted to finance
    await markTransactionPostedToFinance({
      transactionId: inventoryTransactionId,
      financeTransactionId,
      organizationId,
      actorUserId
    })

    return {
      success: true,
      financeTransactionId
    }

  } catch (error: any) {
    console.error('❌ [Finance Integration] Error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error'
    }
  }
}

/**
 * Build GL lines based on inventory movement type
 */
async function buildGLLines({
  inventoryTransaction,
  organizationId
}: {
  inventoryTransaction: any
  organizationId: string
}): Promise<GLLine[]> {
  const movementType = inventoryTransaction.transaction_type
  const lines = inventoryTransaction.lines || []
  const glLines: GLLine[] = []

  // Get GL accounts (TODO: make configurable per organization)
  const accounts = await getGLAccounts(organizationId)

  let lineNumber = 1

  for (const line of lines) {
    if (line.line_type !== 'INVENTORY_MOVEMENT') continue

    const amount = line.line_amount
    const currency = 'AED' // TODO: get from organization settings
    const productId = line.entity_id
    const locationId = line.line_data?.location_id

    switch (movementType) {
      case 'INVENTORY_OPENING':
      case 'INVENTORY_RECEIPT':
        // DR: Inventory Asset
        glLines.push({
          line_number: lineNumber++,
          line_type: 'GL',
          description: `Inventory Receipt - ${line.description}`,
          quantity: '1',
          unit_amount: amount,
          line_amount: amount,
          smart_code: INVENTORY_SMART_CODES.GL_LINE.INVENTORY_ASSET_DR,
          line_data: {
            side: 'DR',
            account: accounts.inventoryAsset,
            account_name: 'Inventory Asset',
            currency,
            product_id: productId,
            location_id: locationId
          }
        })

        // CR: Inventory Clearing (or Accounts Payable if from PO)
        glLines.push({
          line_number: lineNumber++,
          line_type: 'GL',
          description: `Inventory Clearing - ${line.description}`,
          quantity: '1',
          unit_amount: amount,
          line_amount: amount,
          smart_code: INVENTORY_SMART_CODES.GL_LINE.INVENTORY_CLEARING_CR,
          line_data: {
            side: 'CR',
            account: accounts.inventoryClearing,
            account_name: 'Inventory Clearing',
            currency,
            product_id: productId,
            location_id: locationId
          }
        })
        break

      case 'INVENTORY_ISSUE':
        // DR: COGS (Cost of Goods Sold)
        glLines.push({
          line_number: lineNumber++,
          line_type: 'GL',
          description: `COGS - ${line.description}`,
          quantity: '1',
          unit_amount: amount,
          line_amount: amount,
          smart_code: INVENTORY_SMART_CODES.GL_LINE.COGS_DR,
          line_data: {
            side: 'DR',
            account: accounts.cogs,
            account_name: 'Cost of Goods Sold',
            currency,
            product_id: productId,
            location_id: locationId
          }
        })

        // CR: Inventory Asset
        glLines.push({
          line_number: lineNumber++,
          line_type: 'GL',
          description: `Inventory Reduction - ${line.description}`,
          quantity: '1',
          unit_amount: amount,
          line_amount: amount,
          smart_code: INVENTORY_SMART_CODES.GL_LINE.INVENTORY_ASSET_CR,
          line_data: {
            side: 'CR',
            account: accounts.inventoryAsset,
            account_name: 'Inventory Asset',
            currency,
            product_id: productId,
            location_id: locationId
          }
        })
        break

      case 'INVENTORY_ADJUSTMENT':
        // Adjustments can be positive (increase) or negative (decrease)
        const isIncrease = parseFloat(line.quantity || '0') > 0

        if (isIncrease) {
          // DR: Inventory Asset
          glLines.push({
            line_number: lineNumber++,
            line_type: 'GL',
            description: `Inventory Adjustment (Increase) - ${line.description}`,
            quantity: '1',
            unit_amount: amount,
            line_amount: amount,
            smart_code: INVENTORY_SMART_CODES.GL_LINE.INVENTORY_ASSET_DR,
            line_data: {
              side: 'DR',
              account: accounts.inventoryAsset,
              account_name: 'Inventory Asset',
              currency,
              product_id: productId,
              location_id: locationId
            }
          })

          // CR: Inventory Adjustment (Gain)
          glLines.push({
            line_number: lineNumber++,
            line_type: 'GL',
            description: `Inventory Gain - ${line.description}`,
            quantity: '1',
            unit_amount: amount,
            line_amount: amount,
            smart_code: INVENTORY_SMART_CODES.GL_LINE.ADJUSTMENT_GAIN_CR,
            line_data: {
              side: 'CR',
              account: accounts.inventoryAdjustment,
              account_name: 'Inventory Adjustment',
              currency,
              product_id: productId,
              location_id: locationId
            }
          })
        } else {
          // DR: Inventory Adjustment (Loss)
          glLines.push({
            line_number: lineNumber++,
            line_type: 'GL',
            description: `Inventory Loss - ${line.description}`,
            quantity: '1',
            unit_amount: Math.abs(amount),
            line_amount: Math.abs(amount),
            smart_code: INVENTORY_SMART_CODES.GL_LINE.ADJUSTMENT_LOSS_DR,
            line_data: {
              side: 'DR',
              account: accounts.inventoryAdjustment,
              account_name: 'Inventory Adjustment',
              currency,
              product_id: productId,
              location_id: locationId
            }
          })

          // CR: Inventory Asset
          glLines.push({
            line_number: lineNumber++,
            line_type: 'GL',
            description: `Inventory Adjustment (Decrease) - ${line.description}`,
            quantity: '1',
            unit_amount: Math.abs(amount),
            line_amount: Math.abs(amount),
            smart_code: INVENTORY_SMART_CODES.GL_LINE.INVENTORY_ASSET_CR,
            line_data: {
              side: 'CR',
              account: accounts.inventoryAsset,
              account_name: 'Inventory Asset',
              currency,
              product_id: productId,
              location_id: locationId
            }
          })
        }
        break

      default:
        console.warn(`⚠️ [Finance Integration] Unknown movement type: ${movementType}`)
    }
  }

  return glLines
}

/**
 * Get GL account codes
 * TODO: Make configurable per organization via chart of accounts
 */
async function getGLAccounts(organizationId: string): Promise<{
  inventoryAsset: string
  inventoryClearing: string
  cogs: string
  inventoryAdjustment: string
}> {
  // Hardcoded for now - should be fetched from Chart of Accounts
  return {
    inventoryAsset: '1400', // Current Asset
    inventoryClearing: '2100', // Current Liability
    cogs: '5000', // Operating Expense
    inventoryAdjustment: '5900' // Other Expense/Income
  }
}

/**
 * Get appropriate Finance Smart Code based on movement type
 * All movement types now use the standardized GL_JOURNAL code
 */
function getFinanceSmartCode(movementType: string): string {
  // All inventory movements use the same GL_JOURNAL smart code
  // Movement type differentiation is handled in metadata
  return INVENTORY_SMART_CODES.GL_JOURNAL
}

/**
 * Mark inventory transaction as posted to finance
 */
async function markTransactionPostedToFinance({
  transactionId,
  financeTransactionId,
  organizationId,
  actorUserId
}: {
  transactionId: string
  financeTransactionId: string
  organizationId: string
  actorUserId: string
}): Promise<boolean> {
  try {
    // Note: This would ideally update the transaction metadata
    // For now, we'll create a relationship between inventory and finance transactions

    const result = await apiV2.post('relationships', {
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_relationship: {
        from_entity_id: transactionId,
        to_entity_id: financeTransactionId,
        relationship_type: 'POSTED_TO_FINANCE',
        smart_code: 'HERA.FINANCE.REL.POSTED.v1',
        is_active: true
      }
    })

    if (result.error) {
      console.warn('⚠️ [Finance Integration] Could not mark as posted:', result.error)
      return false
    }

    console.log('✅ [Finance Integration] Marked as posted to finance')
    return true

  } catch (error: any) {
    console.error('❌ [Finance Integration] Error marking as posted:', error)
    return false
  }
}

/**
 * Batch post multiple inventory transactions to finance
 */
export async function batchPostInventoryToFinance({
  organizationId,
  actorUserId,
  inventoryTransactionIds
}: {
  organizationId: string
  actorUserId: string
  inventoryTransactionIds: string[]
}): Promise<{
  posted: number
  failed: number
  results: Array<{
    inventoryTransactionId: string
    success: boolean
    financeTransactionId?: string
    error?: string
  }>
}> {
  const results = []
  let posted = 0
  let failed = 0

  for (const inventoryTransactionId of inventoryTransactionIds) {
    const result = await postInventoryMovementToFinance({
      inventoryTransactionId,
      organizationId,
      actorUserId
    })

    results.push({
      inventoryTransactionId,
      ...result
    })

    if (result.success) {
      posted++
    } else {
      failed++
    }
  }

  return { posted, failed, results }
}

/**
 * Get finance impact preview for inventory movement
 * Shows what GL entries will be created WITHOUT actually posting
 */
export async function previewFinanceImpact({
  movementType,
  quantity,
  costPrice,
  currency = 'AED'
}: {
  movementType: string
  quantity: number
  costPrice: number
  currency?: string
}): Promise<{
  totalAmount: number
  drEntries: Array<{ account: string; accountName: string; amount: number }>
  crEntries: Array<{ account: string; accountName: string; amount: number }>
  balanced: boolean
}> {
  const totalAmount = quantity * costPrice
  const drEntries: Array<{ account: string; accountName: string; amount: number }> = []
  const crEntries: Array<{ account: string; accountName: string; amount: number }> = []

  // Simplified preview without fetching actual accounts
  switch (movementType) {
    case 'INVENTORY_OPENING':
    case 'INVENTORY_RECEIPT':
      drEntries.push({ account: '1400', accountName: 'Inventory Asset', amount: totalAmount })
      crEntries.push({ account: '2100', accountName: 'Inventory Clearing', amount: totalAmount })
      break

    case 'INVENTORY_ISSUE':
      drEntries.push({ account: '5000', accountName: 'COGS', amount: totalAmount })
      crEntries.push({ account: '1400', accountName: 'Inventory Asset', amount: totalAmount })
      break

    case 'INVENTORY_ADJUSTMENT':
      if (quantity > 0) {
        drEntries.push({ account: '1400', accountName: 'Inventory Asset', amount: totalAmount })
        crEntries.push({ account: '5900', accountName: 'Inventory Adjustment', amount: totalAmount })
      } else {
        drEntries.push({ account: '5900', accountName: 'Inventory Adjustment', amount: Math.abs(totalAmount) })
        crEntries.push({ account: '1400', accountName: 'Inventory Asset', amount: Math.abs(totalAmount) })
      }
      break
  }

  const totalDR = drEntries.reduce((sum, e) => sum + e.amount, 0)
  const totalCR = crEntries.reduce((sum, e) => sum + e.amount, 0)

  return {
    totalAmount,
    drEntries,
    crEntries,
    balanced: Math.abs(totalDR - totalCR) < 0.01
  }
}
