import { universalApi } from '@/lib/universal-api'

function toPage<T>(items: T[], total?: number) {
  return { items, page: 1, pageSize: items.length, total: total ?? items.length }
}

export const legacyCrmApi = {
  async leads({ orgId, q }: any) {
    universalApi.setOrganizationId(orgId)
    const res = await universalApi.getEntities({ filters: { entity_type: 'lead' } })
    const items = (res.data || []).filter(
      (e: any) => !q || e.entity_name?.toLowerCase().includes(q.toLowerCase())
    )
    return toPage(items)
  },
  async opportunities({ orgId, q }: any) {
    universalApi.setOrganizationId(orgId)
    const res = await universalApi.getEntities({ filters: { entity_type: 'opportunity' } })
    const items = (res.data || []).filter(
      (e: any) => !q || e.entity_name?.toLowerCase().includes(q.toLowerCase())
    )
    return toPage(items)
  },
  async activities({ orgId, q }: any) {
    universalApi.setOrganizationId(orgId)
    const res = await universalApi.getEntities({ filters: { entity_type: 'activity' } })
    const items = (res.data || []).filter(
      (e: any) => !q || e.entity_name?.toLowerCase().includes(q.toLowerCase())
    )
    return toPage(items)
  }
}
