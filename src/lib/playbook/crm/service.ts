import { createServerClient } from '@/lib/supabase/server'
import { assertOrgId, isCRMSmartCode } from '@/lib/smart-codes/crm-catalog'
import type { Activity, CRMQuery, Funnel, Opportunity, PipelineSummary, Lead, PageResult, Account } from './types'

// Shared helpers
function parseArray(val?: string | string[]) {
  if (!val) return undefined
  if (Array.isArray(val)) return val
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

function paginate<T>(items: T[], page = 1, pageSize = 20): PageResult<T> {
  const p = Math.max(1, page)
  const ps = Math.max(1, pageSize)
  const start = (p - 1) * ps
  const slice = items.slice(start, start + ps)
  return { items: slice, page: p, pageSize: ps, total: items.length }
}

async function loadDynamicMap(entityIds: string[], orgId: string) {
  const supabase = createServerClient()
  if (entityIds.length === 0) return new Map<string, Record<string, any>>()
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', orgId)
    .in('entity_id', entityIds)
  if (error) throw error
  const map = new Map<string, Record<string, any>>()
  for (const row of data || []) {
    const key = row.entity_id as string
    const value = row.field_value_text ?? row.field_value_number ?? row.field_value_date ?? row.field_value_boolean
    if (!map.has(key)) map.set(key, {})
    map.get(key)![row.field_name] = value
  }
  return map
}

export async function listLeads(q: CRMQuery): Promise<PageResult<Lead>> {
  assertOrgId(q.orgId)
  const supabase = createServerClient()
  // base entities
  let query = supabase
    .from('core_entities')
    .select('id, entity_name, smart_code, created_at, updated_at')
    .eq('organization_id', q.orgId)

  // prefer smart code filter; fallback to entity_type when absent
  query = query.ilike('smart_code', 'HERA.CRM.LEAD.%')

  if (q.q) query = query.ilike('entity_name', `%${q.q}%`)
  if (q.from) query = query.gte('created_at', q.from)
  if (q.to) query = query.lte('created_at', q.to)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error

  const ids = (data || []).map(r => r.id)
  const dyn = await loadDynamicMap(ids, q.orgId)

  let items: Lead[] = (data || []).map(r => ({
    id: r.id,
    entity_name: r.entity_name,
    owner_id: dyn.get(r.id)?.owner_id,
    stage: dyn.get(r.id)?.stage,
    source: dyn.get(r.id)?.source,
    amount: Number(dyn.get(r.id)?.amount) || undefined,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  }))

  // server-side filters based on dynamic fields
  const owners = parseArray(q.owner)
  if (owners && owners.length) items = items.filter(i => i.owner_id && owners.includes(i.owner_id))
  const stages = parseArray(q.stage)
  if (stages?.length) items = items.filter(i => i.stage && stages.includes(i.stage))

  return paginate(items, q.page, q.pageSize)
}

export async function listOpportunities(q: CRMQuery): Promise<PageResult<Opportunity>> {
  assertOrgId(q.orgId)
  const supabase = createServerClient()
  let query = supabase
    .from('core_entities')
    .select('id, entity_name, smart_code, created_at, updated_at')
    .eq('organization_id', q.orgId)
    .ilike('smart_code', 'HERA.CRM.OPPORTUNITY.%')

  if (q.q) query = query.ilike('entity_name', `%${q.q}%`)
  if (q.from) query = query.gte('created_at', q.from)
  if (q.to) query = query.lte('created_at', q.to)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  const ids = (data || []).map(r => r.id)
  const dyn = await loadDynamicMap(ids, q.orgId)

  let items: Opportunity[] = (data || []).map(r => ({
    id: r.id,
    entity_name: r.entity_name,
    amount: Number(dyn.get(r.id)?.amount) || 0,
    currency: dyn.get(r.id)?.currency || 'USD',
    stage: dyn.get(r.id)?.stage || 'qualification',
    probability: Number(dyn.get(r.id)?.probability) || undefined,
    close_date: dyn.get(r.id)?.close_date,
    owner_id: dyn.get(r.id)?.owner_id,
    account_id: dyn.get(r.id)?.account_id,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  }))

  const owners2 = parseArray(q.owner)
  if (owners2 && owners2.length) items = items.filter(i => i.owner_id && owners2.includes(i.owner_id))
  const stages = parseArray(q.stage)
  if (stages?.length) items = items.filter(i => i.stage && stages.includes(i.stage))

  return paginate(items, q.page, q.pageSize)
}

export async function listActivities(q: CRMQuery): Promise<PageResult<Activity>> {
  assertOrgId(q.orgId)
  const supabase = createServerClient()

  // Activities are commonly entities too; filter by smart_code family if present
  let query = supabase
    .from('core_entities')
    .select('id, entity_name, smart_code, created_at')
    .eq('organization_id', q.orgId)
    .ilike('smart_code', 'HERA.CRM.ACTIVITY.%')

  if (q.q) query = query.ilike('entity_name', `%${q.q}%`)
  if (q.from) query = query.gte('created_at', q.from)
  if (q.to) query = query.lte('created_at', q.to)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  const ids = (data || []).map(r => r.id)
  const dyn = await loadDynamicMap(ids, q.orgId)

  let items: Activity[] = (data || []).map(r => ({
    id: r.id,
    activity_type: (dyn.get(r.id)?.activity_type || 'task') as Activity['activity_type'],
    subject: r.entity_name,
    assigned_to: dyn.get(r.id)?.assigned_to,
    due_at: dyn.get(r.id)?.due_at,
    status: (dyn.get(r.id)?.status || 'pending') as Activity['status'],
    account_id: dyn.get(r.id)?.account_id,
    contact_id: dyn.get(r.id)?.contact_id,
    created_at: r.created_at as string,
  }))

  const owners3 = parseArray(q.owner)
  if (owners3 && owners3.length) items = items.filter(i => i.assigned_to && owners3.includes(i.assigned_to))
  if (q.type) items = items.filter(i => i.activity_type === q.type)
  if (q.status) items = items.filter(i => i.status === q.status)

  return paginate(items, q.page, q.pageSize)
}

export async function listAccounts(q: CRMQuery): Promise<PageResult<Account>> {
  assertOrgId(q.orgId)
  const supabase = createServerClient()
  let query = supabase
    .from('core_entities')
    .select('id, entity_name, smart_code, created_at, updated_at')
    .eq('organization_id', q.orgId)
    .eq('entity_type', 'account')

  if (q.q) query = query.ilike('entity_name', `%${q.q}%`)
  if (q.from) query = query.gte('created_at', q.from)
  if (q.to) query = query.lte('created_at', q.to)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  const ids = (data || []).map(r => r.id)
  const dyn = await loadDynamicMap(ids, q.orgId)

  let items: Account[] = (data || []).map(r => ({
    id: r.id,
    entity_name: r.entity_name,
    industry: dyn.get(r.id)?.industry,
    segment: dyn.get(r.id)?.segment,
    website: dyn.get(r.id)?.website,
    revenue: Number(dyn.get(r.id)?.revenue) || undefined,
    employees: Number(dyn.get(r.id)?.employees) || undefined,
    status: dyn.get(r.id)?.status || 'active',
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  }))

  return paginate(items, q.page, q.pageSize)
}

export async function pipelineSummary(q: CRMQuery): Promise<PipelineSummary> {
  const opps = await listOpportunities({ ...q, page: 1, pageSize: 10000 })
  const by = new Map<string, { stage: string; count: number; amount: number }>()
  for (const o of opps.items) {
    const k = o.stage || 'unknown'
    if (!by.has(k)) by.set(k, { stage: k, count: 0, amount: 0 })
    const row = by.get(k)!
    row.count += 1
    row.amount += o.amount || 0
  }
  const byStage = Array.from(by.values()).sort((a, b) => b.amount - a.amount)
  const totals = {
    count: opps.total,
    amount: byStage.reduce((s, r) => s + r.amount, 0),
  }
  return { byStage, totals }
}

export async function funnel(q: CRMQuery): Promise<Funnel> {
  const leads = await listLeads({ ...q, page: 1, pageSize: 10000 })
  const opps = await listOpportunities({ ...q, page: 1, pageSize: 10000 })

  const leadCount = leads.total
  const qualified = leads.items.filter(l => (l.stage || '').toLowerCase().includes('qualified')).length
  const oppCount = opps.total
  const won = opps.items.filter(o => (o.stage || '').toLowerCase().includes('won')).length

  const stages = [
    { name: 'Lead', count: leadCount },
    { name: 'Qualified', count: qualified, rate: leadCount ? Math.round((qualified / leadCount) * 100) : 0 },
    { name: 'Opportunity', count: oppCount, rate: qualified ? Math.round((oppCount / Math.max(qualified, 1)) * 100) : 0 },
    { name: 'Won', count: won, rate: oppCount ? Math.round((won / Math.max(oppCount, 1)) * 100) : 0 },
  ]
  const conversionRate = leadCount ? Math.round((won / leadCount) * 100) : 0
  return { stages, conversionRate }
}
