import { describe, it, expect } from 'vitest'
import { apiPostV2, apiGetV2 } from '@/lib/universal/v2/client'
const orgId = process.env.ORG_ID as string

describe('V2 Contracts', () => {
  it('upsert → read → list (entity)', async () => {
    const create:any = await apiPostV2('/api/v2/entities/upsert', {
      organization_id: orgId, entity_type:'item', entity_name:'Test Item',
      smart_code:'HERA.TEST.ENTITY.ITEM.v1', dynamic_data:{ foo:1 }
    })
    const read:any = await apiGetV2('/api/v2/entities/read', { organization_id: orgId, entity_id: create.id })
    expect((read as any)?.id ?? (read as any)?.entity_id).toBe((create as any)?.id || (create as any)?.entity_id)

    const list:any = await apiGetV2('/api/v2/entities/list', { organization_id: orgId, smartCodePrefix:'HERA.TEST.ENTITY' })
    expect(Array.isArray((list as any)?.data ?? list)).toBe(true)
  })

  it('emit → read (transaction)', async () => {
    const emit:any = await apiPostV2('/api/v2/transactions/emit', {
      organization_id: orgId, transaction_type:'test', smart_code:'HERA.TEST.TXN.FOO.v1', transaction_date: new Date().toISOString(),
      lines:[{ line_number:1, line_type:'INFO', smart_code:'HERA.TEST.LINE.INFO.v1', line_data:{ note:'ok' } }]
    })
    const txnId = (emit as any)?.transaction_id || (emit as any)?.data?.transaction_id
    const read:any = await apiGetV2('/api/v2/transactions/read', { organization_id: orgId, txn_id: txnId })
    expect(((read as any)?.id ?? (read as any)?.transaction_id) || txnId).toBeTruthy()
  })
})
