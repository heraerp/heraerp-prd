'use client'

import { universalApi } from '@/lib/universal-api-v2'
import { heraCode } from '@/lib/smart-codes'
import { flags } from '@/config/flags'
import { getOrgSettings, getTodayFiscalStamp } from '@/lib/playbook/org-finance-utils'

interface PosTicket {
  id: string
  total: number
  taxTotal?: number
  items: Array<{ name: string; qty: number; price: number; entity_id?: string }>
  payments: Array<{ method: string; amount: number }>
  customer_entity_id?: string
}

/**
 * Post a POS event with idempotency, currency/fiscal stamping
 */
export async function postEventWithBranch(
  orgId: string,
  branchEntityId: string,
  ticket: PosTicket,
  createdBy?: string
) {
  universalApi.setOrganizationId(orgId)
  const extRef = `pos:${ticket.id}`

  // Idempotency: short-circuit if header already exists
  const existingResponse = await universalApi.getTransactions({
    filters: {
      organization_id: orgId,
      transaction_type: 'POS_SALE',
      external_reference: extRef
    },
    pageSize: 1
  })
  
  if (existingResponse.success && existingResponse.data && existingResponse.data.length > 0) {
    console.log('Transaction already exists for ticket:', ticket.id)
    return existingResponse.data[0]
  }

  const org = await getOrgSettings(orgId) // currency, etc.
  const fiscal = await getTodayFiscalStamp(orgId) // optional, may be null

  const header: any = {
    organization_id: orgId,
    transaction_type: 'POS_SALE',
    transaction_date: new Date().toISOString(),
    source_entity_id: branchEntityId,
    target_entity_id: ticket.customer_entity_id ?? null,
    total_amount: Number(ticket.total) || 0,
    smart_code: heraCode('HERA.SALON.POS.SALE.HEADER.v1'),
    external_reference: extRef,
    business_context: { ticket_id: ticket.id },
    metadata: { ui: 'pos', tax_total: ticket.taxTotal ?? 0 },
    created_by: createdBy ?? null,
  }

  // Currency / fiscal stamping (if available)
  header.transaction_currency_code = org?.finance?.currency ?? 'USD'
  header.base_currency_code = org?.finance?.base_currency ?? header.transaction_currency_code
  header.exchange_rate = 1
  
  if (fiscal) {
    header.fiscal_year = fiscal.year
    header.fiscal_period = fiscal.period
    header.posting_period_code = fiscal.code // e.g., "2025-09"
  }

  console.debug('POS header payload →', header)
  const txnResponse = await universalApi.createTransaction(header)
  
  if (!txnResponse.success || !txnResponse.data) {
    console.error('DB header insert error →', txnResponse.error)
    throw new Error(`createTransaction failed: ${txnResponse.error}`)
  }

  const txn = txnResponse.data
  let ln = 1
  const lines: any[] = []

  // Canonical line types map
  const LINE = {
    SERVICE: 'SERVICE',
    PRODUCT: 'PRODUCT',
    TAX: 'TAX',
    PAYMENT: 'PAYMENT',
    DISCOUNT: 'DISCOUNT',
    COMMISSION: 'COMMISSION',
    ADJUSTMENT: 'ADJUSTMENT',
    ROUNDING: 'ROUNDING',
  } as const

  // Service/Product lines
  for (const item of ticket.items) {
    lines.push({
      organization_id: orgId,
      transaction_id: txn.id,
      line_number: ln++,
      line_type: LINE.SERVICE, // keep canonical
      entity_id: item.entity_id ?? null,
      description: item.name,
      quantity: item.qty,
      unit_amount: item.price,
      line_amount: item.qty * item.price,
      smart_code: heraCode('HERA.SALON.POS.LINE.SERVICE.v1'),
      line_data: {},
    })
  }

  // Tax line
  if (ticket.taxTotal && ticket.taxTotal > 0) {
    lines.push({
      organization_id: orgId,
      transaction_id: txn.id,
      line_number: ln++,
      line_type: LINE.TAX,
      description: 'Sales Tax/VAT',
      line_amount: ticket.taxTotal,
      smart_code: heraCode('HERA.SALON.POS.LINE.TAX.v1'),
      line_data: {},
    })
  }

  // Payment lines (negative to balance)
  for (const p of ticket.payments) {
    lines.push({
      organization_id: orgId,
      transaction_id: txn.id,
      line_number: ln++,
      line_type: LINE.PAYMENT,
      description: p.method,
      line_amount: -Math.abs(p.amount),
      smart_code: heraCode('HERA.SALON.POS.PAYMENT.' + p.method.toUpperCase() + '.v1'),
      line_data: {},
    })
  }

  // Create all lines
  for (const line of lines) {
    const lineResponse = await universalApi.createTransactionLine(line)
    if (!lineResponse.success) {
      console.error('DB line insert error →', lineResponse.error, line)
      throw new Error(`createTransactionLine failed: ${lineResponse.error}`)
    }
  }

  // Break-glass: optionally skip Finance DNA posting
  if (!flags.ENABLE_FINANCE_POSTING) {
    console.warn('Finance posting disabled by flag; returning POS doc only.')
    return txn
  }

  return txn
}