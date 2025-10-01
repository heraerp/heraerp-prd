import { apiPostV2 } from '@/lib/universal/v2/nodeClient'

const orgId = process.env.ORG_ID as string

async function upsertEntity(payload: any) {
  const { data, error } = await apiPostV2('/api/v2/entities', payload)
  if (error) throw error
  return data as any
}

async function main(){
  if(!orgId) throw new Error('Set ORG_ID env')

  const showroom = await upsertEntity({
    organization_id: orgId,
    entity_type: 'branch',
    entity_name: 'Main Showroom',
    smart_code: 'HERA.JEWELRY.ENTITY.BRANCH.SHOWROOM.v1'
  })

  const tax = await upsertEntity({
    organization_id: orgId,
    entity_type: 'tax_profile',
    entity_name: 'GST Default',
    smart_code: 'HERA.JEWELRY.ENTITY.TAX_PROFILE.GST.v1',
    dynamic_data: { place_of_supply:'IN-KA', mode:'CGST_SGST' }
  })

  const rate = await upsertEntity({
    organization_id: orgId,
    entity_type: 'price_list',
    entity_name: 'Gold Rate (24K baseline)',
    smart_code: 'HERA.JEWELRY.ENTITY.PRICE_LIST.GOLD_RATE.v1',
    dynamic_data: { symbol:'XAU', unit:'gram', purity_base:24, rate_per_gram:6400, currency:'INR', effective_at:new Date().toISOString(), source:'SEED' }
  })

  const customer = await upsertEntity({
    organization_id: orgId,
    entity_type: 'customer',
    entity_name: 'Walk-in',
    smart_code: 'HERA.JEWELRY.ENTITY.CUSTOMER.RETAIL.v1'
  })

  const items = await Promise.all(
    Array.from({length:6}).map((_,i)=> upsertEntity({
      organization_id: orgId,
      entity_type: 'item',
      entity_name: `22K Bangle ${i+1}`,
      smart_code: 'HERA.JEWELRY.ENTITY.ITEM.RETAIL.v1',
      metadata: { sku: `BNG22-${i+1}` },
      dynamic_data: { gross_weight: 25 + i, stone_weight: 0, net_weight: 25 + i, purity_karat:22, making_charge_type:'per_gram', making_charge_rate:550, gst_slab:3, hsn_code:'7113' }
    }))
  )

  console.log(JSON.stringify({ showroom, tax, rate, customer, items: items.map((it:any)=>it.id || it.entity_id) }, null, 2))
}

main().catch(e=>{ console.error(e); process.exit(1) })
