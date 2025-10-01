import { describe, it, expect } from 'vitest'
import { apiPostV2 } from '@/lib/universal/v2/client'
const orgId = process.env.ORG_ID as string

describe('Jewelry Guardrails', () => {
  it('rejects invalid net weight', async () => {
    let error:any = null
    try {
      await apiPostV2('/api/v2/entities/upsert', {
        organization_id: orgId, entity_type:'item', entity_name:'Bad Item',
        smart_code:'HERA.JEWELRY.ENTITY.ITEM.RETAIL.v1',
        dynamic_data:{ gross_weight:10, stone_weight:1, net_weight:4, purity_karat:22, making_charge_type:'per_gram', making_charge_rate:500, gst_slab:3, hsn_code:'7113' }
      })
    } catch (e:any){ error = e }
    expect(error).toBeTruthy()
  })
})
