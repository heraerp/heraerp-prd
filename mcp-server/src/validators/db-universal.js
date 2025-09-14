const { z } = require('zod')
const { SmartCode } = require('../schemas/smart-code')

// Aligns with database/production/production-schema.sql

// Production guardrail status set (narrowed)
const TxStatus = z.enum(['draft', 'pending', 'approved', 'posted', 'void', 'failed'])

const UniversalTransaction = z.object({
  organization_id: z.string().uuid(),
  transaction_type: z.string(),
  transaction_number: z.string(),
  transaction_date: z.string().or(z.date()),
  smart_code: SmartCode,
  description: z.string().optional(),
  total_amount: z.number().or(z.string()),
  currency_code: z.string().default('USD'),
  exchange_rate: z.number().or(z.string()).optional(),
  base_currency_amount: z.number().or(z.string()).optional(),
  base_currency_code: z.string().optional(),
  reference_entity_id: z.string().uuid().optional(),
  reference_number: z.string().optional(),
  external_reference: z.string().optional(),
  business_category: z.string().optional(),
  accounting_category: z.string().optional(),
  tax_category: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  custom_fields: z.record(z.any()).optional(),
  status: TxStatus.default('pending'),
})

const LineType = z.enum(['item', 'service', 'discount', 'tax', 'fee', 'shipping', 'adjustment'])

const UniversalTransactionLine = z.object({
  organization_id: z.string().uuid(),
  transaction_id: z.string().uuid(),
  line_number: z.number().int().nonnegative(),
  line_entity_id: z.string().uuid().optional(),
  quantity: z.number().or(z.string()).optional(),
  unit_of_measure: z.string().optional(),
  unit_price: z.number().or(z.string()).optional(),
  line_amount: z.number().or(z.string()),
  discount_percentage: z.number().or(z.string()).optional(),
  discount_amount: z.number().or(z.string()).optional(),
  tax_amount: z.number().or(z.string()).optional(),
  tax_rate: z.number().or(z.string()).optional(),
  smart_code: SmartCode.optional(),
  description: z.string().optional(),
  line_type: LineType.default('item'),
  metadata: z.record(z.any()).optional(),
})

module.exports = {
  UniversalTransaction,
  UniversalTransactionLine,
  TxStatus,
  LineType,
}

// ---------------------------------------------
// Compat normalization + strict runtime checks
// ---------------------------------------------

const STATUS_SET = new Set(['draft', 'pending', 'approved', 'posted', 'void', 'failed'])
const LINE_TYPES = new Set(['item', 'service', 'discount', 'tax', 'fee', 'shipping', 'adjustment'])

function iso4217(s) {
  return /^[A-Z]{3}$/.test(String(s || ''))
}

function normHeaderLegacyToProd(h, warnings) {
  const out = { ...h }
  if ('occurred_at' in out && !('transaction_date' in out)) {
    out.transaction_date = out.occurred_at
    warnings.push('COMPAT: occurred_at -> transaction_date')
  }
  if ('amount' in out && !('total_amount' in out)) {
    out.total_amount = out.amount
    warnings.push('COMPAT: amount -> total_amount')
  }
  if ('status_code' in out && !('status' in out)) {
    out.status = out.status_code
    warnings.push('COMPAT: status_code -> status')
  }
  return out
}

function normLineLegacyToProd(l, warnings) {
  const out = { ...l }
  if ('position' in out && !('line_number' in out)) {
    out.line_number = out.position
    warnings.push('COMPAT: position -> line_number')
  }
  if ('amount' in out && !('line_amount' in out)) {
    out.line_amount = out.amount
    warnings.push('COMPAT: amount -> line_amount')
  }
  if ('uom' in out && !('unit_of_measure' in out)) {
    out.unit_of_measure = out.uom
    warnings.push('COMPAT: uom -> unit_of_measure')
  }
  if ('line_type_id' in out && !('line_type' in out)) {
    out.line_type = out.line_type_id
    warnings.push('COMPAT: line_type_id -> line_type')
  }
  return out
}

function validateTransactionBundle(headerIn, linesIn, opts = {}) {
  const warnings = []
  const compat = !!opts.compat

  const header = compat ? normHeaderLegacyToProd(headerIn, warnings) : { ...headerIn }
  const lines = compat ? linesIn.map((l) => normLineLegacyToProd(l, warnings)) : linesIn.map((l) => ({ ...l }))

  // Required header fields
  const reqH = ['transaction_type', 'transaction_date', 'currency_code', 'total_amount', 'status', 'organization_id']
  for (const k of reqH) {
    if (header[k] === undefined || header[k] === null || header[k] === '') throw new Error(`HEADER_MISSING_${k.toUpperCase()}`)
  }

  // Header value checks
  if (!STATUS_SET.has(header.status)) throw new Error('STATUS_INVALID')
  if (!iso4217(header.currency_code)) throw new Error('CURRENCY_INVALID')

  // Idempotency (hint)
  if (!header.transaction_number && !(header.metadata && header.metadata.idempotency_key)) warnings.push('IDEMPOTENCY_HINT: provide transaction_number or metadata.idempotency_key')

  // Lines required fields & checks
  if (!Array.isArray(lines) || lines.length === 0) throw new Error('LINES_EMPTY')
  for (const [i, l] of lines.entries()) {
    const reqL = ['line_number', 'line_type', 'quantity', 'unit_of_measure', 'unit_price', 'line_amount', 'organization_id']
    for (const k of reqL) if (l[k] === undefined || l[k] === null || l[k] === '') throw new Error(`LINE${i + 1}_MISSING_${k.toUpperCase()}`)
    if (!LINE_TYPES.has(l.line_type)) throw new Error(`LINE${i + 1}_LINE_TYPE_INVALID:${l.line_type}`)
  }

  // Totals
  const sum = lines.reduce((a, l) => a + Number(l.line_amount), 0)
  if (Number(header.total_amount) !== sum) throw new Error(`HEADER_TOTAL_MISMATCH: header.total_amount=${header.total_amount} vs sum(lines)=${sum}`)

  return { ok: true, header, lines, warnings }
}

module.exports.validateTransactionBundle = validateTransactionBundle
module.exports._compatNormalizeHeader = normHeaderLegacyToProd
module.exports._compatNormalizeLine = normLineLegacyToProd
module.exports._constants = { STATUS_SET, LINE_TYPES }
