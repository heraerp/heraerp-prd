export function buildPosEmitPayload({
  organization_id,
  branch_id,
  customer_id,
  items,
  discount = 0,
  tax = 0,
  paid,
  method = 'CASH'
}: {
  organization_id: string
  branch_id: string
  customer_id?: string
  items: Array<{ product_id: string; qty: number; price: number; serials?: string[] }>
  discount?: number
  tax?: number
  paid: number
  method?: string
}) {
  return {
    organization_id,
    smart_code: 'HERA.ITD.SALES.POS.POST.V1',
    transaction_type: 'SALE',
    header: { date: new Date().toISOString(), branch_id, customer_id, currency: 'INR' },
    lines: [
      ...items.map((it, i) => ({
        line_number: i + 1,
        line_type: 'ITEM',
        entity_id: it.product_id,
        quantity: it.qty,
        unit_amount: it.price,
        metadata: it.serials ? { serials: it.serials } : undefined
      })),
      ...(discount ? [{ line_number: 900, line_type: 'DISCOUNT', line_amount: -Math.abs(discount) }] : []),
      ...(tax ? [{ line_number: 990, line_type: 'TAX', line_amount: tax }] : []),
      { line_number: 1000, line_type: 'PAYMENT', line_amount: paid, metadata: { method } }
    ]
  }
}

