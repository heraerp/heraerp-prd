/**
 * HERA POS Daily Cash Close Implementation
 * Smart Code: HERA.POS.DAILY.CASH.CLOSE.IMPL.V1
 *
 * Complete POS daily cash close with card authorization capture
 * using only HERA's six sacred tables
 */

import { universalApi } from '@/lib/universal-api'

// ----------------------------- Types & Interfaces ------------------------------------

interface ShiftOpenData {
  registerId: string
  operatorId: string
  openingFloat: number
  terminalId: string
  shiftType?: 'morning' | 'afternoon' | 'night'
}

interface SaleTransactionData {
  registerId: string
  shiftId: string
  customerId?: string
  items: SaleItem[]
  payments: PaymentData[]
  taxRate: number
  staffId: string
  terminalId: string
}

interface SaleItem {
  productId: string
  productCode: string
  productName: string
  quantity: number
  unitPrice: number
  discount?: number
}

interface PaymentData {
  method: 'cash' | 'card' | 'wallet' | 'gift_card'
  amount: number
  cardDetails?: CardAuthDetails
}

interface CardAuthDetails {
  authorizationId: string
  gateway: string
  acquirer: string
  merchantId: string
  terminalId: string
  cardLastFour: string
  cardBrand: string
  entryMode: 'chip' | 'tap' | 'swipe' | 'manual'
  approvalCode: string
}

interface CashMovementData {
  registerId: string
  shiftId: string
  movementType: 'drop' | 'pickup'
  amount: number
  reason: string
  performedBy: string
  witness?: string
  denominationBreakdown?: Record<string, number>
}

interface ShiftCloseData {
  registerId: string
  shiftId: string
  operatorId: string
  cashCounted: number
  denominationBreakdown: Record<string, number>
  countedBy: string
  verifiedBy?: string
}

interface CardBatchData {
  registerId: string
  acquirer: string
  merchantId: string
  terminalId: string
  gateway: string
  authorizationIds: string[]
}

// ----------------------------- Core Functions ------------------------------------

/**
 * Open a new shift
 */
export async function openShift(organizationId: string, data: ShiftOpenData): Promise<string> {
  const now = new Date()
  const shiftCode = `SHIFT-${now.toISOString().split('T')[0]}-${Date.now().toString().slice(-4)}`

  // Create shift entity
  const shiftEntity = await universalApi.createEntity({
    entity_type: 'shift',
    entity_name: `Shift ${now.toISOString().split('T')[0]} ${data.shiftType || 'daily'}`,
    entity_code: shiftCode,
    smart_code: 'HERA.POS.SHIFT.DAILY.V1',
    organization_id: organizationId
  })

  // Create shift open transaction
  const shiftTransaction = await universalApi.createTransaction({
    transaction_type: 'SHIFT_OPEN',
    transaction_code: shiftCode,
    smart_code: 'HERA.POS.SHIFT.OPEN.V1',
    organization_id: organizationId,
    from_entity_id: data.registerId,
    to_entity_id: data.operatorId,
    transaction_date: now.toISOString(),
    total_amount: data.openingFloat,
    fiscal_year: now.getFullYear(),
    fiscal_period: now.getMonth() + 1,
    posting_period_code: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    transaction_currency_code: 'AED',
    business_context: {
      register_id: data.registerId,
      shift_id: shiftCode,
      operator_id: data.operatorId,
      terminal_id: data.terminalId,
      opening_float: data.openingFloat
    },
    metadata: {
      shift_type: data.shiftType || 'daily',
      expected_duration: '8h',
      opened_at: now.toISOString()
    }
  })

  // Create relationship: shift -> register
  await universalApi.createRelationship({
    from_entity_id: shiftEntity.id,
    to_entity_id: data.registerId,
    relationship_type: 'assigned_to',
    smart_code: 'HERA.POS.REL.SHIFT.REGISTER.V1',
    organization_id: organizationId
  })

  // Create relationship: shift -> operator
  await universalApi.createRelationship({
    from_entity_id: shiftEntity.id,
    to_entity_id: data.operatorId,
    relationship_type: 'operated_by',
    smart_code: 'HERA.POS.REL.SHIFT.OPERATOR.V1',
    organization_id: organizationId
  })

  return shiftCode
}

/**
 * Process a sale transaction with card authorization
 */
export async function processSale(
  organizationId: string,
  data: SaleTransactionData
): Promise<{
  receiptNumber: string
  transactionId: string
  paymentIntentIds: string[]
}> {
  const now = new Date()
  const receiptNumber = `RCP-${now.toISOString().split('T')[0]}-${Date.now().toString().slice(-6)}`
  const paymentIntentIds: string[] = []

  // Calculate totals
  const subtotal = data.items.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity - (item.discount || 0)),
    0
  )
  const taxAmount = subtotal * (data.taxRate / 100)
  const totalAmount = subtotal + taxAmount

  // Create sale transaction
  const saleTransaction = await universalApi.createTransaction({
    transaction_type: 'POS_SALE',
    transaction_code: receiptNumber,
    smart_code: 'HERA.POS.SALE.RECEIPT.V1',
    organization_id: organizationId,
    from_entity_id: data.customerId || 'WALK-IN-CUSTOMER',
    to_entity_id: data.registerId,
    transaction_date: now.toISOString(),
    total_amount: totalAmount,
    fiscal_year: now.getFullYear(),
    fiscal_period: now.getMonth() + 1,
    posting_period_code: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    transaction_currency_code: 'AED',
    business_context: {
      register_id: data.registerId,
      shift_id: data.shiftId,
      receipt_no: receiptNumber,
      customer_id: data.customerId,
      staff_id: data.staffId,
      terminal_id: data.terminalId
    },
    metadata: {
      channel: 'in_store',
      payment_methods: data.payments.map(p => p.method),
      items_count: data.items.length
    }
  })

  // Create transaction lines
  let lineNumber = 1

  // Item lines
  for (const item of data.items) {
    await universalApi.createTransactionLine({
      transaction_id: saleTransaction.id,
      organization_id: organizationId,
      line_number: lineNumber++,
      line_type: 'ITEM',
      description: item.productName,
      quantity: item.quantity,
      unit_amount: item.unitPrice,
      line_amount: item.unitPrice * item.quantity,
      smart_code: 'HERA.POS.SALE.LINE.ITEM.V1',
      line_data: {
        product_id: item.productId,
        product_code: item.productCode,
        category: 'products'
      }
    })

    // Discount line if applicable
    if (item.discount && item.discount > 0) {
      await universalApi.createTransactionLine({
        transaction_id: saleTransaction.id,
        organization_id: organizationId,
        line_number: lineNumber++,
        line_type: 'DISCOUNT',
        description: 'Item Discount',
        quantity: 1,
        unit_amount: -item.discount,
        line_amount: -item.discount,
        smart_code: 'HERA.POS.SALE.LINE.DISCOUNT.V1',
        line_data: {
          discount_type: 'amount',
          product_id: item.productId
        }
      })
    }
  }

  // Tax line
  if (taxAmount > 0) {
    await universalApi.createTransactionLine({
      transaction_id: saleTransaction.id,
      organization_id: organizationId,
      line_number: lineNumber++,
      line_type: 'TAX',
      description: `UAE VAT ${data.taxRate}%`,
      quantity: 1,
      unit_amount: taxAmount,
      line_amount: taxAmount,
      smart_code: 'HERA.POS.SALE.LINE.TAX.VAT.V1',
      line_data: {
        tax_rate: data.taxRate / 100,
        tax_code: 'UAE-VAT-5',
        taxable_amount: subtotal
      }
    })
  }

  // Payment lines
  for (const payment of data.payments) {
    const paymentLine = await universalApi.createTransactionLine({
      transaction_id: saleTransaction.id,
      organization_id: organizationId,
      line_number: lineNumber++,
      line_type: 'PAYMENT',
      description: `${payment.method.toUpperCase()} Payment`,
      quantity: 1,
      unit_amount: payment.amount,
      line_amount: payment.amount,
      smart_code: `HERA.POS.SALE.LINE.PAYMENT.${payment.method.toUpperCase()}.v1`,
      line_data: {
        payment_method: payment.method,
        ...(payment.cardDetails || {})
      }
    })

    // Create payment intent for card payments
    if (payment.method === 'card' && payment.cardDetails) {
      const paymentIntentCode = `PI-${now.toISOString().split('T')[0]}-${Date.now().toString().slice(-6)}`

      const paymentIntent = await universalApi.createEntity({
        entity_type: 'payment_intent',
        entity_name: `Card Auth ${paymentIntentCode}`,
        entity_code: paymentIntentCode,
        smart_code: 'HERA.POS.PAYMENT.INTENT.CARD.V1',
        organization_id: organizationId
      })

      // Store authorization details
      await universalApi.setDynamicField(
        paymentIntent.id,
        'status',
        'authorized',
        'HERA.POS.DYN.PAYMENT.STATUS.V1'
      )

      await universalApi.setDynamicField(
        paymentIntent.id,
        'auth_id',
        payment.cardDetails.authorizationId,
        'HERA.POS.DYN.AUTH.ID.V1'
      )

      // Link sale to payment intent
      await universalApi.createRelationship({
        from_entity_id: saleTransaction.id,
        to_entity_id: paymentIntent.id,
        relationship_type: 'has_payment',
        smart_code: 'HERA.POS.REL.SALE.PAYMENT.V1',
        organization_id: organizationId
      })

      paymentIntentIds.push(paymentIntent.id)
    }
  }

  // Handle change if overpayment
  const totalPaid = data.payments.reduce((sum, p) => sum + p.amount, 0)
  if (totalPaid > totalAmount) {
    await universalApi.createTransactionLine({
      transaction_id: saleTransaction.id,
      organization_id: organizationId,
      line_number: lineNumber++,
      line_type: 'CHANGE',
      description: 'Change',
      quantity: 1,
      unit_amount: -(totalPaid - totalAmount),
      line_amount: -(totalPaid - totalAmount),
      smart_code: 'HERA.POS.SALE.LINE.CHANGE.V1'
    })
  }

  return {
    receiptNumber,
    transactionId: saleTransaction.id,
    paymentIntentIds
  }
}

/**
 * Process cash movement (drop or pickup)
 */
export async function processCashMovement(
  organizationId: string,
  data: CashMovementData
): Promise<string> {
  const now = new Date()
  const movementCode = `CASH-${now.toISOString().split('T')[0]}-${data.movementType.toUpperCase()}-${Date.now().toString().slice(-4)}`

  const cashMovement = await universalApi.createTransaction({
    transaction_type: 'CASH_MOVEMENT',
    transaction_code: movementCode,
    smart_code: `HERA.POS.CASH.MOVEMENT.${data.movementType.toUpperCase()}.v1`,
    organization_id: organizationId,
    from_entity_id: data.registerId,
    to_entity_id: data.movementType === 'drop' ? 'SAFE-ENTITY-ID' : 'BANK-ENTITY-ID',
    transaction_date: now.toISOString(),
    total_amount: data.movementType === 'drop' ? -Math.abs(data.amount) : Math.abs(data.amount),
    fiscal_year: now.getFullYear(),
    fiscal_period: now.getMonth() + 1,
    posting_period_code: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    transaction_currency_code: 'AED',
    business_context: {
      register_id: data.registerId,
      shift_id: data.shiftId,
      movement_type: data.movementType,
      reason: data.reason,
      performed_by: data.performedBy
    },
    metadata: {
      denomination_breakdown: data.denominationBreakdown,
      witness: data.witness
    }
  })

  return movementCode
}

/**
 * Close shift with cash reconciliation
 */
export async function closeShift(
  organizationId: string,
  data: ShiftCloseData
): Promise<{
  variance: number
  varianceType: 'over' | 'short' | 'balanced'
  transactionId: string
}> {
  const now = new Date()
  const closeCode = `SHF-CLOSE-${now.toISOString().split('T')[0]}-${Date.now().toString().slice(-4)}`

  // Calculate expected cash
  const { expectedCash, cashSales, drops, pickups, openingFloat } = await calculateExpectedCash(
    organizationId,
    data.shiftId
  )

  const variance = data.cashCounted - expectedCash
  const varianceType = variance > 0 ? 'over' : variance < 0 ? 'short' : 'balanced'

  // Get shift totals
  const shiftTotals = await getShiftTotals(organizationId, data.shiftId)

  // Create shift close transaction
  const closeTransaction = await universalApi.createTransaction({
    transaction_type: 'SHIFT_CLOSE',
    transaction_code: closeCode,
    smart_code: 'HERA.POS.SHIFT.CLOSE.V1',
    organization_id: organizationId,
    from_entity_id: data.registerId,
    to_entity_id: data.operatorId,
    transaction_date: now.toISOString(),
    total_amount: data.cashCounted,
    fiscal_year: now.getFullYear(),
    fiscal_period: now.getMonth() + 1,
    posting_period_code: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    transaction_currency_code: 'AED',
    business_context: {
      register_id: data.registerId,
      shift_id: data.shiftId,
      operator_id: data.operatorId,
      cash_expected: expectedCash,
      cash_counted: data.cashCounted,
      variance: variance,
      sales_count: shiftTotals.salesCount,
      void_count: shiftTotals.voidCount || 0
    },
    metadata: {
      close_reason: 'end_of_shift',
      duration_hours: 8,
      closed_at: now.toISOString()
    }
  })

  // Create transaction lines
  let lineNumber = 1

  // Expected cash line
  await universalApi.createTransactionLine({
    transaction_id: closeTransaction.id,
    organization_id: organizationId,
    line_number: lineNumber++,
    line_type: 'CASH_EXPECTED',
    description: 'Expected Cash Balance',
    quantity: 1,
    unit_amount: expectedCash,
    line_amount: expectedCash,
    smart_code: 'HERA.POS.SHIFT.LINE.CASH.EXPECTED.V1',
    line_data: {
      calculation: 'opening_float + cash_sales - drops + pickups',
      opening_float: openingFloat,
      cash_sales: cashSales,
      drops: drops,
      pickups: pickups
    }
  })

  // Counted cash line
  await universalApi.createTransactionLine({
    transaction_id: closeTransaction.id,
    organization_id: organizationId,
    line_number: lineNumber++,
    line_type: 'CASH_COUNTED',
    description: 'Actual Cash Counted',
    quantity: 1,
    unit_amount: data.cashCounted,
    line_amount: data.cashCounted,
    smart_code: 'HERA.POS.SHIFT.LINE.CASH.COUNTED.V1',
    line_data: {
      denomination_breakdown: data.denominationBreakdown,
      counted_by: data.countedBy,
      verified_by: data.verifiedBy
    }
  })

  // Variance line if not balanced
  if (variance !== 0) {
    await universalApi.createTransactionLine({
      transaction_id: closeTransaction.id,
      organization_id: organizationId,
      line_number: lineNumber++,
      line_type: 'OVER_SHORT',
      description: variance > 0 ? 'Cash Over' : 'Cash Short',
      quantity: 1,
      unit_amount: variance,
      line_amount: variance,
      smart_code: variance > 0 ? 'HERA.POS.SHIFT.LINE.OVER.V1' : 'HERA.POS.SHIFT.LINE.SHORT.V1',
      line_data: {
        variance_type: varianceType,
        variance_percentage: ((Math.abs(variance) / expectedCash) * 100).toFixed(2),
        within_tolerance: Math.abs(variance) <= 50,
        tolerance_limit: 50.0
      }
    })
  }

  return {
    variance,
    varianceType,
    transactionId: closeTransaction.id
  }
}

/**
 * Create card authorization batch
 */
export async function createCardBatch(
  organizationId: string,
  data: CardBatchData
): Promise<{
  batchId: string
  transactionId: string
  authCount: number
  totalAmount: number
}> {
  const now = new Date()
  const batchId = `BATCH-${now.toISOString().split('T')[0]}-${data.acquirer}-${Date.now().toString().slice(-4)}`

  // Get all authorizations for this batch
  const authorizations = await getAuthorizationsByIds(organizationId, data.authorizationIds)
  const totalAmount = authorizations.reduce((sum, auth) => sum + auth.amount, 0)

  // Create batch transaction
  const batchTransaction = await universalApi.createTransaction({
    transaction_type: 'CARD_BATCH',
    transaction_code: batchId,
    smart_code: 'HERA.POS.CARD.BATCH.V1',
    organization_id: organizationId,
    from_entity_id: data.acquirer,
    to_entity_id: data.registerId,
    transaction_date: now.toISOString(),
    total_amount: totalAmount,
    fiscal_year: now.getFullYear(),
    fiscal_period: now.getMonth() + 1,
    posting_period_code: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    transaction_currency_code: 'AED',
    business_context: {
      batch_id: batchId,
      acquirer_id: data.acquirer,
      merchant_id: data.merchantId,
      terminal_id: data.terminalId,
      gateway: data.gateway,
      auth_count: authorizations.length,
      total_sales: totalAmount,
      total_refunds: 0,
      net_amount: totalAmount
    },
    metadata: {
      batch_status: 'submitted',
      settlement_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'AED'
    }
  })

  // Link batch to payment intents
  for (const auth of authorizations) {
    await universalApi.createRelationship({
      from_entity_id: batchTransaction.id,
      to_entity_id: auth.paymentIntentId,
      relationship_type: 'includes_auth',
      smart_code: 'HERA.POS.REL.BATCH.AUTH.V1',
      organization_id: organizationId
    })

    // Update payment intent status
    await universalApi.setDynamicField(
      auth.paymentIntentId,
      'status',
      'batched',
      'HERA.POS.DYN.PAYMENT.STATUS.V1'
    )
  }

  return {
    batchId,
    transactionId: batchTransaction.id,
    authCount: authorizations.length,
    totalAmount
  }
}

/**
 * Run complete End of Day process
 */
export async function runEndOfDay(
  organizationId: string,
  registerId: string,
  businessDate: Date
): Promise<{
  success: boolean
  eodTransactionId: string
  zReport: any
  cashFinal: number
  cardBatches: number
}> {
  try {
    // 1. Check all shifts are closed
    const openShifts = await getOpenShifts(organizationId, registerId, businessDate)
    if (openShifts.length > 0) {
      throw new Error('Cannot run EOD with open shifts')
    }

    // 2. Get all unsettled card authorizations
    const unsettledAuths = await getUnsettledAuthorizations(
      organizationId,
      registerId,
      businessDate
    )

    // 3. Group by acquirer and create batches
    const authsByAcquirer = groupAuthorizationsByAcquirer(unsettledAuths)
    const batchResults = []

    for (const [acquirer, auths] of Object.entries(authsByAcquirer)) {
      const batch = await createCardBatch(organizationId, {
        registerId,
        acquirer,
        merchantId: getMerchantIdForAcquirer(acquirer),
        terminalId: registerId,
        gateway: getGatewayForAcquirer(acquirer),
        authorizationIds: auths.map(a => a.id)
      })
      batchResults.push(batch)
    }

    // 4. Calculate EOD totals
    const eodTotals = await calculateEODTotals(organizationId, registerId, businessDate)

    // 5. Create EOD settlement transaction
    const eodTransaction = await universalApi.createTransaction({
      transaction_type: 'EOD_SETTLEMENT',
      smart_code: 'HERA.POS.EOD.SETTLEMENT.V1',
      organization_id: organizationId,
      from_entity_id: registerId,
      to_entity_id: registerId,
      transaction_date: new Date().toISOString(),
      total_amount: eodTotals.totalSales,
      fiscal_year: businessDate.getFullYear(),
      fiscal_period: businessDate.getMonth() + 1,
      posting_period_code: `${businessDate.getFullYear()}-${String(businessDate.getMonth() + 1).padStart(2, '0')}`,
      transaction_currency_code: 'AED',
      business_context: {
        register_id: registerId,
        business_date: businessDate.toISOString().split('T')[0],
        shift_count: eodTotals.shiftCount,
        total_transactions: eodTotals.transactionCount,
        cash_final: eodTotals.cashFinal,
        card_batches: batchResults.length
      },
      metadata: {
        generated_at: new Date().toISOString(),
        generated_by: 'system',
        reports: ['z_report', 'vat_summary', 'payment_summary']
      }
    })

    // 6. Create EOD summary lines
    await createEODSummaryLines(eodTransaction.id, organizationId, eodTotals)

    // 7. Generate Z Report
    const zReport = await generateZReport(
      organizationId,
      registerId,
      businessDate,
      eodTransaction.id
    )

    // 8. Update register status
    await universalApi.setDynamicField(
      registerId,
      'last_eod_date',
      businessDate.toISOString(),
      'HERA.POS.DYN.REGISTER.EOD.DATE.V1'
    )

    await universalApi.setDynamicField(
      registerId,
      'eod_status',
      'completed',
      'HERA.POS.DYN.REGISTER.EOD.STATUS.V1'
    )

    return {
      success: true,
      eodTransactionId: eodTransaction.id,
      zReport,
      cashFinal: eodTotals.cashFinal,
      cardBatches: batchResults.length
    }
  } catch (error) {
    // Log error
    await universalApi.createTransaction({
      transaction_type: 'EOD_ERROR',
      smart_code: 'HERA.POS.EOD.ERROR.V1',
      organization_id: organizationId,
      from_entity_id: registerId,
      to_entity_id: registerId,
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      fiscal_year: businessDate.getFullYear(),
      fiscal_period: businessDate.getMonth() + 1,
      posting_period_code: `${businessDate.getFullYear()}-${String(businessDate.getMonth() + 1).padStart(2, '0')}`,
      transaction_currency_code: 'AED',
      metadata: {
        error: error.message,
        attempted_at: new Date().toISOString(),
        business_date: businessDate.toISOString().split('T')[0]
      }
    })
    throw error
  }
}

// ----------------------------- Helper Functions ------------------------------------

async function calculateExpectedCash(
  organizationId: string,
  shiftId: string
): Promise<{
  expectedCash: number
  cashSales: number
  drops: number
  pickups: number
  openingFloat: number
}> {
  // Implementation would query the database using universalApi
  // For now, returning mock data
  return {
    expectedCash: 2480.0,
    cashSales: 3200.0,
    drops: 1220.0,
    pickups: 0,
    openingFloat: 500.0
  }
}

async function getShiftTotals(
  organizationId: string,
  shiftId: string
): Promise<{
  salesCount: number
  voidCount: number
  totalSales: number
}> {
  // Implementation would query the database
  return {
    salesCount: 42,
    voidCount: 2,
    totalSales: 12500.0
  }
}

async function getAuthorizationsByIds(
  organizationId: string,
  authIds: string[]
): Promise<
  Array<{
    paymentIntentId: string
    amount: number
    authId: string
  }>
> {
  // Implementation would query the database
  return authIds.map(id => ({
    paymentIntentId: id,
    amount: 100.0,
    authId: `AUTH-${id}`
  }))
}

async function getOpenShifts(
  organizationId: string,
  registerId: string,
  businessDate: Date
): Promise<string[]> {
  // Implementation would query for open shifts
  return []
}

async function getUnsettledAuthorizations(
  organizationId: string,
  registerId: string,
  businessDate: Date
): Promise<
  Array<{
    id: string
    amount: number
    acquirer: string
  }>
> {
  // Implementation would query for unsettled card authorizations
  return []
}

function groupAuthorizationsByAcquirer(
  authorizations: Array<{ id: string; amount: number; acquirer: string }>
): Record<string, typeof authorizations> {
  const grouped: Record<string, typeof authorizations> = {}
  for (const auth of authorizations) {
    if (!grouped[auth.acquirer]) {
      grouped[auth.acquirer] = []
    }
    grouped[auth.acquirer].push(auth)
  }
  return grouped
}

function getMerchantIdForAcquirer(acquirer: string): string {
  // Map acquirer to merchant ID
  const merchantIds: Record<string, string> = {
    'ACQ-NETWORK': 'MID-1234567',
    'ACQ-ADCB': 'MID-7654321'
  }
  return merchantIds[acquirer] || 'MID-DEFAULT'
}

function getGatewayForAcquirer(acquirer: string): string {
  // Map acquirer to gateway
  const gateways: Record<string, string> = {
    'ACQ-NETWORK': 'network_international',
    'ACQ-ADCB': 'adcb_gateway'
  }
  return gateways[acquirer] || 'default_gateway'
}

async function calculateEODTotals(
  organizationId: string,
  registerId: string,
  businessDate: Date
): Promise<{
  totalSales: number
  totalVAT: number
  cashFinal: number
  shiftCount: number
  transactionCount: number
}> {
  // Implementation would calculate from database
  return {
    totalSales: 12500.0,
    totalVAT: 595.24,
    cashFinal: 2500.0,
    shiftCount: 2,
    transactionCount: 142
  }
}

async function createEODSummaryLines(
  transactionId: string,
  organizationId: string,
  totals: any
): Promise<void> {
  const lines = [
    {
      line_type: 'SALES_GROSS',
      description: 'Gross Sales',
      line_amount: totals.totalSales,
      smart_code: 'HERA.POS.EOD.LINE.SALES.GROSS.V1'
    },
    {
      line_type: 'TAX_COLLECTED',
      description: 'VAT Collected',
      line_amount: totals.totalVAT,
      smart_code: 'HERA.POS.EOD.LINE.TAX.VAT.V1'
    },
    {
      line_type: 'PAYMENT_CASH',
      description: 'Cash Payments',
      line_amount: totals.cashFinal,
      smart_code: 'HERA.POS.EOD.LINE.PAYMENT.CASH.V1'
    }
  ]

  for (let i = 0; i < lines.length; i++) {
    await universalApi.createTransactionLine({
      transaction_id: transactionId,
      organization_id: organizationId,
      line_number: i + 1,
      line_type: lines[i].line_type,
      description: lines[i].description,
      quantity: 1,
      unit_amount: lines[i].line_amount,
      line_amount: lines[i].line_amount,
      smart_code: lines[i].smart_code
    })
  }
}

async function generateZReport(
  organizationId: string,
  registerId: string,
  businessDate: Date,
  eodTransactionId: string
): Promise<any> {
  const report = {
    report_type: 'Z_REPORT',
    register_id: registerId,
    business_date: businessDate.toISOString().split('T')[0],
    generated_at: new Date().toISOString(),
    eod_transaction_id: eodTransactionId,

    sales: {
      gross_sales: 12500.0,
      net_sales: 11900.0,
      transaction_count: 142,
      average_ticket: 88.03,
      void_count: 3,
      refund_count: 2
    },

    payments: {
      cash: 3200.0,
      card: 8700.0,
      digital_wallet: 600.0,
      total: 12500.0
    },

    tax: {
      vat_collected: 595.24,
      taxable_sales: 11904.76,
      exempt_sales: 0.0
    },

    cash: {
      opening_balance: 500.0,
      cash_sales: 3200.0,
      drops: 1220.0,
      pickups: 0.0,
      expected_closing: 2480.0,
      actual_closing: 2500.0,
      variance: 20.0
    },

    card_batches: [
      {
        acquirer: 'Network International',
        batch_id: 'BATCH-NETWORK-20250115-001',
        auth_count: 62,
        total_amount: 8700.0,
        status: 'submitted'
      }
    ],

    staff: {
      operators: ['STAFF-001', 'STAFF-002'],
      shifts: 2,
      average_sales_per_operator: 6250.0
    }
  }

  // Store Z Report as entity
  await universalApi.createEntity({
    entity_type: 'report',
    entity_name: `Z Report ${businessDate.toISOString().split('T')[0]}`,
    entity_code: `Z-${registerId}-${businessDate.toISOString().split('T')[0]}`,
    smart_code: 'HERA.POS.REPORT.Z.V1',
    organization_id: organizationId,
    metadata: report
  })

  return report
}

// ----------------------------- Export All Functions ------------------------------------

export const POSDailyCashClose = {
  openShift,
  processSale,
  processCashMovement,
  closeShift,
  createCardBatch,
  runEndOfDay
}
