// CRM Playbook Types

export interface Lead {
  id: string
  entity_name: string
  owner_id?: string
  stage?: string
  source?: string
  amount?: number
  created_at: string
  updated_at: string
}

export interface Opportunity {
  id: string
  entity_name: string
  amount: number
  currency?: string
  stage: string
  probability?: number
  close_date?: string
  owner_id?: string
  account_id?: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  activity_type: 'call' | 'email' | 'meeting' | 'task'
  subject: string
  assigned_to?: string
  due_at?: string
  status: 'completed' | 'pending' | 'overdue'
  account_id?: string
  contact_id?: string
  created_at: string
}

export interface Account {
  id: string
  entity_name: string
  industry?: string
  segment?: string
  website?: string
  revenue?: number
  employees?: number
  status?: string
  created_at: string
  updated_at: string
}

export interface PipelineSummary {
  byStage: { stage: string; count: number; amount: number }[]
  totals: { count: number; amount: number }
}

export interface FunnelStage { name: string; count: number; rate?: number }
export interface Funnel { stages: FunnelStage[]; conversionRate: number }

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface CRMQuery {
  orgId: string
  owner?: string | string[]
  stage?: string | string[]
  type?: string
  status?: string
  from?: string
  to?: string
  q?: string
  page?: number
  pageSize?: number
}
