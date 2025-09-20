'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-states'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Users,
  Briefcase,
  Target,
  Activity,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  DollarSign
} from 'lucide-react'
import { StatCardDNA } from '@/lib/dna/components/ui/stat-card-dna'
import { playbookCrmApi } from '@/lib/api/playbook-crm'
import { legacyCrmApi } from '@/lib/api/legacy-crm'
import { flags } from '@/lib/flags'
import { listOwners, listStages } from '@/lib/playbook/crm/lookups'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function CRMDashboard() {

  const { user, currentOrganization, isAuthenticated, isLoading: authLoading } = useMultiOrgAuth()
  const [stats, setStats] = useState<any>(null)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [topOpportunities, setTopOpportunities] = useState<any[]>([])
  const [pipeline, setPipeline] = useState<{ byStage: { stage: string; count: number; amount: number }[]; totals: { count: number; amount: number } } | null>(null)
  const [funnel, setFunnel] = useState<{ stages: { name: string; count: number; rate?: number }[]; conversionRate: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [stage, setStage] = useState<string[]>([])
  const [owner, setOwner] = useState<string[]>([])
  const [q, setQ] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [oppsPage, setOppsPage] = useState<{ items: any[]; page: number; pageSize: number; total: number } | null>(null)
  const [ownerOpts, setOwnerOpts] = useState<{ id: string; name: string }[]>([])
  const [stageOpts, setStageOpts] = useState<{ id: string; name: string }[]>([])
  const searchParams = useSearchParams()
  const router = useRouter()

  // initialize filters from URL once
  useEffect(() => {
    const spFrom = searchParams.get('from') || ''
    const spTo = searchParams.get('to') || ''
    const spStage = searchParams.get('stage') || ''
    const ownerAll = searchParams.getAll('owner')
    const spQ = searchParams.get('q') || ''
    setFrom(spFrom)
    setTo(spTo)
    setStage(spStage ? [spStage] : [])
    setOwner(ownerAll.length ? ownerAll : [])
    setQ(spQ)
    const spPage = Number(searchParams.get('page') || '1')
    const spPageSize = Number(searchParams.get('pageSize') || '10')
    setPage(Number.isFinite(spPage) && spPage > 0 ? spPage : 1)
    setPageSize(Number.isFinite(spPageSize) && spPageSize > 0 ? spPageSize : 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (currentOrganization && isAuthenticated) {
      loadCRMData()
    }
  }, [currentOrganization, isAuthenticated])

  useEffect(() => {
    if (!currentOrganization?.id) return
    ;(async () => {
      const [owners, stages] = await Promise.all([
        listOwners(currentOrganization.id!),
        listStages(currentOrganization.id!),
      ])
      setOwnerOpts(owners)
      setStageOpts(stages)
    })()
  }, [currentOrganization?.id])

  const loadCRMData = async () => {
    if (!currentOrganization?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const orgId = currentOrganization.id
      const common = { orgId, from: from || undefined, to: to || undefined, owner: owner || undefined, q: q || undefined, stage }
      const api = flags['crm.playbook.enabled'] ? playbookCrmApi : legacyCrmApi
      const [leads, opps, acts, pipe, fnl] = await Promise.all([
        (api as any).leads?.({ ...common, page: 1, pageSize: 5 }) ?? { items: [], page: 1, pageSize: 5, total: 0 },
        api.opportunities({ ...common, page, pageSize }),
        (api as any).activities?.({ ...common, page: 1, pageSize: 5 }) ?? { items: [], page: 1, pageSize: 5, total: 0 },
        playbookCrmApi.pipeline({ ...common }),
        playbookCrmApi.funnel({ ...common }),
      ])

      if (flags['crm.playbook.shadow']) {
        ;(async () => {
          try {
            const [legacyOpps, pbOpps] = await Promise.allSettled([
              legacyCrmApi.opportunities({ ...common }),
              playbookCrmApi.opportunities({ ...common }),
            ])
            console.debug('[CRM shadow] opps', {
              legacy: legacyOpps.status === 'fulfilled' ? legacyOpps.value.total : 'err',
              playbook: pbOpps.status === 'fulfilled' ? pbOpps.value.total : 'err',
            })
          } catch {}
        })()
      }
      setPipeline(pipe)
      setFunnel(fnl)
      setStats({
        totalLeads: leads.total,
        totalOpportunities: opps.total,
        totalActivities: acts.total,
        pipelineValue: pipe?.totals?.amount || 0,
        conversionRate: fnl?.conversionRate || 0,
      })
      setRecentActivities(
        acts.items.map((a: any) => ({
          id: a.id,
          type: a.activity_type,
          subject: a.subject,
          date: new Date(a.created_at).toLocaleDateString(),
          assignedTo: a.assigned_to || 'Unassigned',
        }))
      )
      setOppsPage(opps)
      setTopOpportunities(
        (opps.items || [])
          .filter((o: any) => (o.amount || 0) > 0)
          .sort((a: any, b: any) => (b.amount || 0) - (a.amount || 0))
          .slice(0, 5)
          .map((o: any) => ({
            id: o.id,
            name: o.entity_name,
            amount: o.amount || 0,
            stage: o.stage || 'qualification',
            probability: o.probability || 0,
            closeDate: o.close_date ? new Date(o.close_date).toLocaleDateString() : 'TBD',
            owner_id: o.owner_id || o.ownerId
          }))
      )
    } catch (error: any) {
      console.error('Error loading CRM data:', error)
      setError(error.message || 'Failed to load CRM data')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle loading states
  if (authLoading || !isAuthenticated) {
    return <LoadingSpinner />
  }

  if (!currentOrganization) {
    return (
      <Alert className="m-8">
        <AlertDescription>Please select an organization to continue.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="p-8">
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-7 gap-3">
        <input type="date" className="border rounded px-3 py-2 bg-background/5" value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="border rounded px-3 py-2 bg-background/5" value={to} onChange={e => setTo(e.target.value)} />
        <Select
          value={''}
          onValueChange={(v) => {
            if (!v) return
            setStage((prev) => (prev.includes(v) ? prev : [...prev, v]))
          }}
        >
          <SelectTrigger className="bg-background/5"><SelectValue placeholder="All stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {stageOpts.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Selected Stage Chips */}
        <div className="col-span-1 md:col-span-6 flex flex-wrap gap-2 -mt-2">
          {stage.map((s) => {
            const name = stageOpts.find((opt) => opt.id === s)?.name || s
            return (
              <button
                key={s}
                onClick={() => setStage((prev) => prev.filter((x) => x !== s))}
                className="px-2 py-0.5 text-xs rounded-full border border-border/40 bg-background/10"
                title={`Remove stage ${name}`}
              >
                {name} ×
              </button>
            )
          })}
        </div>
        <Select value={''} onValueChange={(v) => { if (v) setOwner(prev => (prev.includes(v) ? prev : [...prev, v])) }}>
          <SelectTrigger className="bg-background/5"><SelectValue placeholder="Any owner" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            {ownerOpts.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Owner Chips */}
        <div className="col-span-1 md:col-span-6 flex flex-wrap gap-2 -mt-2">
          {owner.map((o) => {
            const name = ownerOpts.find((opt) => opt.id === o)?.name || o
            return (
              <button
                key={o}
                onClick={() => setOwner((prev) => prev.filter((x) => x !== o))}
                className="px-2 py-0.5 text-xs rounded-full border border-border/40 bg-background/10"
                aria-label={`Remove owner ${name}`}
                title={`Remove owner ${name}`}
              >
                {name} ×
              </button>
            )
          })}
        </div>
        <input type="text" placeholder="Search" className="border rounded px-3 py-2 bg-background/5" value={q} onChange={e => setQ(e.target.value)} />

        {/* Page Size */}
        <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
          <SelectTrigger className="bg-background/5"><SelectValue placeholder="Page Size" /></SelectTrigger>
          <SelectContent>
            {[10, 20, 50].map(sz => (
              <SelectItem key={sz} value={String(sz)}>{sz} / page</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button onClick={() => {
          const params = new URLSearchParams()
          if (from) params.set('from', from)
          if (to) params.set('to', to)
          stage.forEach(s => params.append('stage', s))
          owner.forEach(o => params.append('owner', o))
          if (q) params.set('q', q)
          params.set('page', String(page))
          params.set('pageSize', String(pageSize))
          const qs = params.toString()
          router.replace(qs ? `/crm?${qs}` : '/crm')
          loadCRMData()
        }}>Apply</Button>
          <Button variant="outline" onClick={() => {
            setFrom(''); setTo(''); setStage([]); setOwner(''); setQ(''); setPage(1); setPageSize(10)
            router.replace('/crm')
            setTimeout(() => loadCRMData(), 0)
          }}>Clear</Button>
        </div>
      </div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 dark:text-foreground">CRM Dashboard</h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Manage your customer relationships and sales pipeline
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {flags['crm.playbook.shadow'] && (
            <span className="px-2 py-1 text-xs rounded-full border bg-amber-50 text-amber-800" title="Shadow mode: comparing Playbook vs legacy reads">
              Shadow Mode
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-4">
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Lead
        </Button>
        <Button variant="outline">
          <Briefcase className="w-4 h-4 mr-2" />
          New Opportunity
        </Button>
        <Button variant="outline">
          <Users className="w-4 h-4 mr-2" />
          New Contact
        </Button>
        <Button variant="outline">
          <Activity className="w-4 h-4 mr-2" />
          New Activity
        </Button>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCardDNA title="Total Leads" value={stats?.totalLeads || 0} icon={Users} change="filtered" changeType="positive" iconGradient="from-blue-500 to-purple-500" />
            <StatCardDNA title="Opportunities" value={stats?.totalOpportunities || 0} icon={Target} change="filtered" changeType="positive" iconGradient="from-green-500 to-emerald-500" />
            <StatCardDNA title="Pipeline Value" value={`${(stats?.pipelineValue || 0).toLocaleString()}`} icon={DollarSign} change="sum" changeType="neutral" iconGradient="from-amber-500 to-orange-500" />
            <StatCardDNA title="Conversion Rate" value={`${stats?.conversionRate || 0}%`} icon={TrendingUp} change="funnel" changeType="positive" iconGradient="from-purple-500 to-pink-500" />
          </div>

          {pipeline && (
            <Card className="p-4 mb-8">
              <h3 className="text-lg font-semibold mb-2">Pipeline by Stage</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipeline.byStage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <ReTooltip />
                    <Bar dataKey="amount" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Opportunities List with Pagination */}
          {oppsPage && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 !text-gray-100 dark:!text-gray-100">Opportunities</h2>
              {/* Active owner filters (quick remove) */}
              {owner.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {owner.map((o) => {
                    const name = ownerOpts.find(opt => opt.id === o)?.name || o
                    
return (
                      <button
                        key={o}
                        onClick={() => {
                          const next = owner.filter(x => x !== o)
                          setOwner(next)
                          const params = new URLSearchParams(searchParams.toString())
                          params.delete('owner')
                          next.forEach(v => params.append('owner', v))
                          router.replace(`/crm?${params.toString()}`)
                          loadCRMData()
                        }}
                        className="px-2 py-0.5 text-xs rounded-full border border-border/40 bg-background/10"
                        title={`Remove owner ${name}`}
                      >
                        {name} ×
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="py-2">Name</th>
                      <th>Stage</th>
                      <th>Owner</th>
                      <th className="text-right">Amount</th>
                      <th>Close Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oppsPage.items.map((o: any) => (
                      <tr key={o.id} className="border-t">
                        <td className="py-2">{o.entity_name}</td>
                        <td>{o.stage || '-'}</td>
                        <td>{ownerOpts.find(opt => opt.id === (o.owner_id || o.ownerId))?.name || '-'}</td>
                        <td className="text-right">${(o.amount || 0).toLocaleString()}</td>
                        <td>{o.close_date ? new Date(o.close_date).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <Button variant="outline" size="sm" onClick={() => {
                  const next = Math.max(1, page - 1)
                  setPage(next)
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', String(next))
                  params.set('pageSize', String(pageSize))
                  router.replace(`/crm?${params.toString()}`)
                  loadCRMData()
                }}>Prev</Button>
                <span className="text-xs">
                  Page {page} of {Math.max(1, Math.ceil((oppsPage.total || 0) / pageSize))}
                </span>
                <Button variant="outline" size="sm" onClick={() => {
                  const totalPages = Math.max(1, Math.ceil((oppsPage.total || 0) / pageSize))
                  const next = Math.min(totalPages, page + 1)
                  setPage(next)
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', String(next))
                  params.set('pageSize', String(pageSize))
                  router.replace(`/crm?${params.toString()}`)
                  loadCRMData()
                }}>Next</Button>
              </div>
            </Card>
          )}

          {/* Recent Activities and Top Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activities */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 !text-gray-100 dark:!text-gray-100">
                Recent Activities
              </h2>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <p className="text-muted-foreground">No recent activities</p>
                ) : (
                  recentActivities.map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 pb-3 border-b last:border-0"
                    >
                      {activity.type === 'call' ? (
                        <Phone className="w-5 h-5 text-primary mt-0.5" />
                      ) : activity.type === 'email' ? (
                        <Mail className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-100 dark:text-foreground">
                          {activity.subject}
                        </p>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                          {activity.date} • {activity.assignedTo}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Top Opportunities */
            }
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 !text-gray-100 dark:!text-gray-100">
                Top Opportunities
              </h2>
              <div className="space-y-4">
                {topOpportunities.length === 0 ? (
                  <p className="text-muted-foreground">No opportunities yet</p>
                ) : (
                  topOpportunities.map(opp => (
                    <div key={opp.id} className="pb-3 border-b last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-100 dark:text-foreground">{opp.name}</p>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            {opp.stage} • {opp.probability}% • Close: {opp.closeDate}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Owner: {ownerOpts.find(o => o.id === (opp as any).owner_id)?.name || '-'}
                          </p>
                        </div>
                        <p className="font-semibold text-green-600">
                          ${opp.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )

}

export default function CRMPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto">Loading...</div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <CRMDashboard />
    </Suspense>
  )
}
