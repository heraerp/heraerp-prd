import type { CRMQuery, PageResult, Lead, Opportunity, Activity, PipelineSummary, Funnel } from '@/lib/playbook/crm/types'

const base = '/api/playbook/crm'

function toParams(q: Record<string, any>): string {
  const sp = new URLSearchParams()
  Object.entries(q).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    if (Array.isArray(v)) v.forEach(x => sp.append(k, String(x)))
    else sp.set(k, String(v))
  })
  return sp.toString()
}

export const playbookCrmApi = {
  async leads(q: CRMQuery): Promise<PageResult<Lead>> {
    const res = await fetch(`${base}/leads?${toParams(q)}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load leads')
    return res.json()
  },
  async opportunities(q: CRMQuery): Promise<PageResult<Opportunity>> {
    const res = await fetch(`${base}/opportunities?${toParams(q)}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load opportunities')
    return res.json()
  },
  async activities(q: CRMQuery): Promise<PageResult<Activity>> {
    const res = await fetch(`${base}/activities?${toParams(q)}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load activities')
    return res.json()
  },
  async pipeline(q: CRMQuery): Promise<PipelineSummary> {
    const res = await fetch(`${base}/pipeline/summary?${toParams(q)}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load pipeline summary')
    return res.json()
  },
  async funnel(q: CRMQuery): Promise<Funnel> {
    const res = await fetch(`${base}/funnel?${toParams(q)}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load funnel')
    return res.json()
  },
}
