export async function listOwners(orgId: string) {
  try {
    const res = await fetch(`/api/playbook/crm/owners?orgId=${orgId}`, { cache: 'no-store' })
    if (!res.ok) return []
    const { items } = await res.json()
    return (items || []).map((u: any) => ({ id: u.id, name: u.name || u.entity_name || u.email || 'User' }))
  } catch {
    return []
  }
}

export async function listStages(orgId: string) {
  try {
    const res = await fetch(`/api/playbook/crm/stages?orgId=${orgId}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('fallback')
    const { items } = await res.json()
    return (items || []).map((s: any) => ({ id: s.code || s.name, name: s.name }))
  } catch {
    return ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'].map((s) => ({ id: s, name: s }))
  }
}

