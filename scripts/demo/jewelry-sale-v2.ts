import { apiPostV2, apiGetV2 } from '@/lib/universal/v2/nodeClient'
const orgId = process.env.ORG_ID as string

async function main(){
  if (!orgId) throw new Error('Set ORG_ID env')

  const list:any = await apiGetV2('/api/v2/entities', { organization_id: orgId, entity_type:'item' })
  const item = (list as any)?.data?.[0] || (list as any)?.[0]
  const rateList:any = await apiGetV2('/api/v2/entities', { organization_id: orgId, entity_type:'price_list' })
  const rate = (rateList as any)?.data?.[0]?.dynamic_data?.rate_per_gram ?? (rateList as any)?.[0]?.dynamic_data?.rate_per_gram ?? 6200

  const payload = {
    organization_id: orgId,
    transaction_type: 'sale',
    smart_code: 'HERA.JEWELRY.TXN.SALE.POS.V1',
    transaction_date: new Date().toISOString(),
    lines: [
      { line_number:1, line_type:'ITEM', smart_code:'HERA.JEWELRY.LINE.ITEM.RETAIL.V1', entity_id:item.id || item.entity_id, quantity:1,
        line_data:{ net_weight:item.dynamic_data?.net_weight ?? item.dynamic_fields?.net_weight?.value, purity_karat:item.dynamic_data?.purity_karat ?? item.dynamic_fields?.purity_karat?.value, gold_rate_per_gram:rate, making_charge_type:'per_gram', making_charge_rate:550 } },
      { line_number:2, line_type:'TAX', smart_code:'HERA.JEWELRY.LINE.TAX.GST.V1', line_data:{ gst_slab:3, mode:'CGST_SGST' } }
    ]
  }

  const res:any = await apiPostV2('/api/v2/transactions', payload)
  const txnId = (res as any)?.data?.transaction_id || (res as any)?.transaction_id
  const read:any = await apiGetV2('/api/v2/transactions', { organization_id: orgId, transaction_id: txnId })
  const lineCount = (read as any)?.data?.lines?.length ?? (read as any)?.lines?.length
  console.log({ transaction_id: txnId, lines: lineCount })
}
main().catch(e=>{ console.error(e); process.exit(1) })
