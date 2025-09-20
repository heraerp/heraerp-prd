'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader, PageHeaderSearch } from '@/components/universal/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as DTitle,
  DialogDescription
} from '@/components/ui/dialog'
import {
  DollarSign,
  Calendar,
  Users,
  Activity,
  Crown,
  Star,
  Package,
  Scissors,
  Receipt,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
// Sidebar is provided by /salon layout; no local sidebar import

// --- Types ---
interface KPIData {
  revenueToday: number
  upcomingAppts: number
  avgTicket: number
  utilization: number
}
interface RevenuePoint {
  week: string
  revenue: number
}
interface BookingSvc {
  name: string
  value: number
}
interface Recent {
  id: string
  when: string
  client: string
  service: string
  total: number
  stylist: string
}
interface Stylist {
  id: string
  name: string
  revenue: number
  utilization: number
  rating: number
}
interface StockRow {
  sku: string
  name: string
  stock: number
  min: number
}
interface MemberTier {
  tier: string
  count: number
  arpu: number
}
interface NPS {
  score: number
  promoters: number
  passives: number
  detractors: number
}
interface TxnHeader {
  id: string
  organization_id: string
  smart_code: string
  transaction_date?: string
  created_at: string
  transaction_code: string
  transaction_type: string
  source_entity_id?: string
  target_entity_id?: string
  total_amount: number
  currency: string
  status: string
}
interface TxnLine {
  transaction_id: string
  line_no: number
  entity_id?: string
  description: string
  qty: number
  unit_price: number
  amount: number
  smart_code: string
}

// --- Design Tokens ---
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  espresso: '#3E2723',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#5A2A40',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

// --- Utilities ---
const fmtCurrency = (n: number, ccy = 'GBP') => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: ccy,
      maximumFractionDigits: 0
    }).format(n)
  } catch {
    return `£${Math.round(n).toLocaleString()}`
  }
}
const shortDate = (iso: string) => {
  if (!iso) return 'N/A'
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

const SectionTitle: React.FC<{
  title: string
  icon?: React.ReactNode
  right?: React.ReactNode
}> = ({ title, icon, right }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-lg md:text-xl font-semibold" style={{ color: COLORS.champagne }}>
        {title}
      </h3>
    </div>
    {right}
  </div>
)

// --- API Layer ---
const API_BASE_URL = '/api/v1'
async function fetchAPI(path: string, params: Record<string, any> = {}) {
  const queryString = new URLSearchParams(params).toString()
  const url = `${API_BASE_URL}${path}${queryString ? '?' + queryString : ''}`

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include'
  })

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json().catch(() => ({}))
  return data
}

// Empty data structure for initial state
const emptyData = {
  kpis: { revenueToday: 0, upcomingAppts: 0, avgTicket: 0, utilization: 0 } as KPIData,
  revenueSeries: [] as RevenuePoint[],
  bookingsByService: [] as BookingSvc[],
  recent: [] as Recent[],
  stylists: [] as Stylist[],
  inventory: [] as StockRow[],
  membership: [] as MemberTier[],
  nps: { score: 0, promoters: 0, passives: 0, detractors: 0 } as NPS,
  txns: [] as TxnHeader[],
  txnLines: {} as Record<string, TxnLine[]>
}

// --- Small UI bits ---
function KPI({
  label,
  value,
  icon,
  hint
}: {
  label: string
  value: string
  icon: React.ReactNode
  hint?: string
}) {
  return (
    <Card
      className="bg-transparent border-0 shadow-none"
      style={{ backgroundColor: COLORS.charcoal, borderRadius: '1rem' }}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <span className="text-sm" style={{ color: COLORS.bronze }}>
          {label}
        </span>
        <div className="opacity-80">{icon}</div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold" style={{ color: COLORS.champagne }}>
          {value}
        </div>
        {hint && (
          <div className="text-xs mt-1" style={{ color: COLORS.lightText, opacity: 0.6 }}>
            {hint}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function GradientButton({ children, className = '', ...props }: any) {
  return (
    <Button
      {...props}
      className={`border-0 font-semibold tracking-wide uppercase ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
        color: COLORS.black,
        borderRadius: '9999px',
        boxShadow: '0 6px 20px rgba(212,175,55,0.25)'
      }}
    >
      {children}
    </Button>
  )
}

function SoftCard({ children, className = '' }: any) {
  return (
    <div
      className={`p-4 md:p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${className}`}
      style={{ backgroundColor: COLORS.charcoal, border: `1px solid ${COLORS.black}` }}
    >
      {children}
    </div>
  )
}

// --- Main Component ---
export default function SalonOwnerDashboard() {
  const { organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [range, setRange] = useState<string>('today')
  const [query, setQuery] = useState<string>('')
  const [data, setData] = useState<any>(emptyData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Drill-down modal
  const [openTxn, setOpenTxn] = useState<TxnHeader | null>(null)
  const [openTxnLines, setOpenTxnLines] = useState<TxnLine[] | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!organization?.id) return

      setLoading(true)
      setError(null)

      try {
        const [kpis, rev, recent, styl, inv, mship, nps, txns] = await Promise.all([
          fetchAPI('/salon/analytics/kpis', { range, organization_id: organization.id }),
          fetchAPI('/salon/analytics/revenue/weekly', {
            weeks: 12,
            organization_id: organization.id
          }),
          fetchAPI('/salon/bookings/recent', { limit: 5, organization_id: organization.id }),
          fetchAPI('/salon/staff/performance', {
            range,
            limit: 5,
            organization_id: organization.id
          }),
          fetchAPI('/salon/inventory/low-stock', { limit: 3, organization_id: organization.id }),
          fetchAPI('/salon/memberships/tiers', { organization_id: organization.id }),
          fetchAPI('/salon/feedback/nps', { range, organization_id: organization.id }),
          fetchAPI('/universal', {
            action: 'read',
            table: 'universal_transactions',
            limit: 10,
            organization_id: organization.id
          })
        ])

        if (!cancelled) {
          setData({
            kpis: kpis?.data
              ? {
                  revenueToday: kpis.data.revenueToday?.value || 0,
                  upcomingAppts: kpis.data.upcomingAppts?.value || 0,
                  avgTicket: kpis.data.avgTicket?.value || 0,
                  utilization: kpis.data.utilization?.value || 0
                }
              : emptyData.kpis,
            revenueSeries: rev?.data?.labels
              ? rev.data.labels.map((week: string, index: number) => ({
                  week,
                  revenue: rev.data.datasets[0]?.data[index] || 0
                }))
              : emptyData.revenueSeries,
            bookingsByService: recent?.data
              ? (() => {
                  // Group bookings by service and count them
                  const serviceCount: Record<string, number> = {}
                  recent.data.forEach((booking: any) => {
                    const service = booking.serviceName || 'Unknown'
                    serviceCount[service] = (serviceCount[service] || 0) + 1
                  })
                  // Convert to chart format
                  return Object.entries(serviceCount).map(([name, value]) => ({ name, value }))
                })()
              : emptyData.bookingsByService,
            recent: recent?.data
              ? recent.data.map((booking: any) => ({
                  id: booking.id,
                  when: new Date(booking.date).toLocaleDateString(),
                  client: booking.customerName,
                  service: booking.serviceName,
                  total: booking.price,
                  stylist: booking.staffName
                }))
              : emptyData.recent,
            stylists: styl?.data ? styl.data.slice(0, 5) : emptyData.stylists,
            inventory: inv?.data || emptyData.inventory,
            membership: mship?.data || emptyData.membership,
            nps: nps?.data
              ? {
                  score: nps.data.npsScore || 0,
                  promoters: nps.data.breakdown?.promoters || 0,
                  passives: nps.data.breakdown?.passives || 0,
                  detractors: nps.data.breakdown?.detractors || 0
                }
              : emptyData.nps,
            txns: txns?.data || emptyData.txns
          })
        }
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load dashboard data')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [range, organization?.id])

  const headerGradient = { backgroundColor: COLORS.charcoal } as React.CSSProperties
  const chartStroke = COLORS.gold
  const barFill = COLORS.plum

  async function openTxnDrilldown(txn: TxnHeader) {
    setOpenTxn(txn)
    try {
      const lines = await fetchAPI(`/universal/transaction_lines`, { transaction_id: txn.id })
      setOpenTxnLines(lines?.items || [])
    } catch (e) {
      console.error('Failed to load transaction details:', e)
      setOpenTxnLines([])
    }
  }

  // Auth checks
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access the dashboard.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No organization context found. Please select an organization.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--hera-black)' }}>
        {/* Main content wrapper with charcoal background for depth */}
        <div className="relative" style={{ minHeight: '100vh' }}>
          {/* Subtle gradient overlay for depth */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 20% 80%, ${COLORS.gold}08 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, ${COLORS.bronze}05 0%, transparent 50%),
                             radial-gradient(circle at 40% 40%, ${COLORS.plum}03 0%, transparent 50%)`
            }}
          />

          {/* Content container */}
          <div
            className="container mx-auto px-6 py-8 relative"
            style={{
              backgroundColor: COLORS.charcoal,
              minHeight: '100vh',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)'
            }}
          >
            <PageHeader
              title="Owner Dashboard"
              breadcrumbs={[
                { label: 'HERA' },
                { label: 'SALON OS' },
                { label: 'Dashboard', isActive: true }
              ]}
              actions={
                <>
                  <div
                    className="text-sm px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: COLORS.espresso + '40',
                      color: COLORS.champagne,
                      border: `1px solid ${COLORS.bronze}33`
                    }}
                  >
                    {organization.name}
                  </div>
                  <PageHeaderSearch
                    value={query}
                    onChange={setQuery}
                    placeholder="Search clients, bookings, SKUs…"
                  />
                </>
              }
            />

            {/* Content */}
            <div className="grid grid-cols-1 gap-6">
              {/* Filters */}
              <SoftCard>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <Tabs value={range} onValueChange={setRange} className="w-full md:w-auto">
                    <TabsList
                      className="bg-transparent p-1 rounded-full border"
                      style={{ borderColor: COLORS.bronze }}
                    >
                      {[
                        { id: 'today', label: 'Today' },
                        { id: '7d', label: 'Last 7D' },
                        { id: '30d', label: 'Last 30D' },
                        { id: 'qtd', label: 'Quarter' },
                        { id: 'ytd', label: 'YTD' }
                      ].map(t => (
                        <TabsTrigger
                          key={t.id}
                          value={t.id}
                          className="rounded-full data-[state=active]:text-black"
                        >
                          <span
                            className="px-3 py-1.5 rounded-full"
                            style={{
                              background:
                                range === t.id
                                  ? `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                                  : 'transparent',
                              color: COLORS.champagne
                            }}
                          >
                            {t.label}
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <div className="text-xs opacity-70">
                    {loading ? 'Refreshing…' : 'Last updated: just now'}
                  </div>
                </div>
              </SoftCard>

              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI
                  label="Revenue"
                  value={loading ? 'Loading...' : fmtCurrency(data.kpis.revenueToday)}
                  icon={<DollarSign size={18} color={COLORS.gold} />}
                />
                <KPI
                  label="Upcoming"
                  value={loading ? 'Loading...' : `${data.kpis.upcomingAppts}`}
                  icon={<Calendar size={18} color={COLORS.gold} />}
                />
                <KPI
                  label="Avg Ticket"
                  value={loading ? 'Loading...' : fmtCurrency(data.kpis.avgTicket)}
                  icon={<Users size={18} color={COLORS.gold} />}
                />
                <KPI
                  label="Utilization"
                  value={loading ? 'Loading...' : `${data.kpis.utilization}%`}
                  icon={<Activity size={18} color={COLORS.gold} />}
                />
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SoftCard className="lg:col-span-2">
                  <SectionTitle
                    title="Revenue – Last 12 Weeks"
                    icon={<DollarSign size={18} color={COLORS.gold} />}
                    right={
                      <Badge style={{ backgroundColor: COLORS.emerald, color: 'white' }}>
                        AI insight
                      </Badge>
                    }
                  />
                  <div className="h-64">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={data.revenueSeries}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                          <XAxis
                            dataKey="week"
                            stroke={COLORS.lightText}
                            tick={{ fill: COLORS.lightText, fontSize: 12 }}
                          />
                          <YAxis
                            stroke={COLORS.lightText}
                            tick={{ fill: COLORS.lightText, fontSize: 12 }}
                          />
                          <ReTooltip
                            contentStyle={{
                              background: COLORS.charcoal,
                              border: `1px solid ${COLORS.black}`,
                              color: COLORS.champagne
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke={chartStroke}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="mt-3 text-sm" style={{ color: COLORS.champagne }}>
                    Suggestion:{' '}
                    <span style={{ color: COLORS.emerald }}>Launch midweek color promo</span> – last
                    4 Wednesdays under-index vs avg by 12%.
                  </div>
                </SoftCard>

                <SoftCard>
                  <SectionTitle
                    title="Bookings by Service"
                    icon={<Calendar size={18} color={COLORS.gold} />}
                  />
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.bookingsByService}>
                        <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          stroke={COLORS.lightText}
                          tick={{ fill: COLORS.lightText }}
                        />
                        <YAxis stroke={COLORS.lightText} tick={{ fill: COLORS.lightText }} />
                        <ReTooltip
                          contentStyle={{
                            background: COLORS.charcoal,
                            border: `1px solid ${COLORS.black}`,
                            color: COLORS.champagne
                          }}
                        />
                        <Bar dataKey="value" fill={barFill} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 text-xs" style={{ color: COLORS.lightText }}>
                    Top driver:{' '}
                    <span style={{ color: COLORS.champagne, fontWeight: 600 }}>Cut</span> ·
                    Opportunity: Upsell treatment with Color.
                  </div>
                </SoftCard>
              </div>

              {/* Recent & Staff */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SoftCard className="lg:col-span-2">
                  <SectionTitle
                    title="Recent Bookings"
                    icon={<Calendar size={18} color={COLORS.gold} />}
                    right={
                      <Badge style={{ backgroundColor: COLORS.champagne, color: COLORS.black }}>
                        Latest 5
                      </Badge>
                    }
                  />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left" style={{ color: COLORS.bronze }}>
                          <th className="py-2">Time</th>
                          <th>Client</th>
                          <th>Service</th>
                          <th>Stylist</th>
                          <th className="text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500 mx-auto" />
                            </td>
                          </tr>
                        ) : data.recent.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4 opacity-70">
                              No recent bookings found
                            </td>
                          </tr>
                        ) : (
                          data.recent.map((r: any) => (
                            <tr key={r.id} className="border-t" style={{ borderColor: '#1f1f1f' }}>
                              <td className="py-2" style={{ color: COLORS.champagne }}>
                                {r.when}
                              </td>
                              <td>{r.client}</td>
                              <td className="opacity-90">{r.service}</td>
                              <td>
                                <Badge
                                  variant="outline"
                                  style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                                >
                                  {r.stylist}
                                </Badge>
                              </td>
                              <td className="text-right" style={{ color: COLORS.champagne }}>
                                {fmtCurrency(r.total)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </SoftCard>

                <SoftCard>
                  <SectionTitle
                    title="Top Stylists"
                    icon={<Users size={18} color={COLORS.gold} />}
                  />
                  <div className="space-y-4">
                    {loading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500" />
                      </div>
                    ) : data.stylists.length === 0 ? (
                      <p className="text-center py-4 opacity-70">No stylist data available</p>
                    ) : (
                      data.stylists.map((s: Stylist) => (
                        <div
                          key={s.id}
                          className="p-3 rounded-xl"
                          style={{
                            backgroundColor: '#141414',
                            border: `1px solid ${COLORS.black}`
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback
                                  style={{ backgroundColor: COLORS.bronze, color: COLORS.black }}
                                >
                                  {s.name.slice(0, 1).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium" style={{ color: COLORS.champagne }}>
                                  {s.name}
                                </div>
                                <div className="text-xs opacity-70">
                                  Util {s.utilization}% · Rating {s.rating.toFixed(1)}
                                  <Star size={12} className="inline ml-1" color={COLORS.gold} />
                                </div>
                              </div>
                            </div>
                            <div className="text-sm" style={{ color: COLORS.emerald }}>
                              {fmtCurrency(s.revenue)}
                            </div>
                          </div>
                          <div className="mt-2">
                            <Progress value={Math.min(100, s.utilization)} className="h-2" />
                            <div className="text-xs mt-1 opacity-70">
                              Revenue {fmtCurrency(s.revenue)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </SoftCard>
              </div>

              {/* Membership & Inventory & NPS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SoftCard>
                  <SectionTitle
                    title="Memberships"
                    icon={<Receipt size={18} color={COLORS.gold} />}
                    right={
                      <Badge style={{ backgroundColor: COLORS.emerald, color: 'white' }}>
                        Emerald Focus
                      </Badge>
                    }
                  />
                  <div className="grid grid-cols-3 gap-3">
                    {data.membership.map((m: MemberTier) => (
                      <div
                        key={m.tier}
                        className="p-4 rounded-xl text-center"
                        style={{ backgroundColor: '#141414', border: `1px solid ${COLORS.black}` }}
                      >
                        <div
                          className="text-xs uppercase tracking-wide"
                          style={{
                            color:
                              m.tier === 'Emerald'
                                ? COLORS.emerald
                                : m.tier === 'Gold'
                                  ? COLORS.gold
                                  : COLORS.rose
                          }}
                        >
                          {m.tier}
                        </div>
                        <div className="text-2xl font-semibold" style={{ color: COLORS.champagne }}>
                          {m.count}
                        </div>
                        <div className="text-xs opacity-70">ARPU {fmtCurrency(m.arpu)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs mt-3 opacity-80">
                    Tip: Highlight <span style={{ color: COLORS.emerald }}>Emerald</span> perks at
                    checkout to lift conversion.
                  </div>
                </SoftCard>

                <SoftCard>
                  <SectionTitle
                    title="Low Stock Alerts"
                    icon={<Package size={18} color={COLORS.gold} />}
                    right={
                      <Badge style={{ backgroundColor: COLORS.rose, color: 'white' }}>
                        Critical
                      </Badge>
                    }
                  />
                  <div className="space-y-3">
                    {loading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500" />
                      </div>
                    ) : data.inventory.length === 0 ? (
                      <p className="text-center py-4 opacity-70">All items in stock</p>
                    ) : (
                      data.inventory.map((p: StockRow) => {
                        const deficit = Math.max(0, p.min - p.stock)
                        const danger = p.stock < p.min
                        return (
                          <div
                            key={p.sku}
                            className="p-3 rounded-xl flex items-center justify-between"
                            style={{
                              backgroundColor: '#141414',
                              border: `1px solid ${COLORS.black}`
                            }}
                          >
                            <div>
                              <div className="font-medium" style={{ color: COLORS.champagne }}>
                                {p.name}
                              </div>
                              <div className="text-xs opacity-70">SKU {p.sku}</div>
                            </div>
                            <div className="text-right">
                              <div
                                className="text-sm"
                                style={{ color: danger ? COLORS.rose : COLORS.champagne }}
                              >
                                Stock {p.stock}
                              </div>
                              <div className="text-xs opacity-70">
                                Min {p.min}
                                {danger ? ` · Order ${deficit}` : ''}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </SoftCard>

                <SoftCard>
                  <SectionTitle
                    title="Client Sentiment (NPS)"
                    icon={<Star size={18} color={COLORS.gold} />}
                  />
                  <div className="flex items-center justify-center h-40">
                    <div
                      className="relative h-32 w-32 rounded-full flex items-center justify-center"
                      style={{
                        background: `conic-gradient(${COLORS.emerald} ${Math.max(0, data.nps.score)}%, ${COLORS.rose} 0)`
                      }}
                    >
                      <div
                        className="absolute inset-2 rounded-full"
                        style={{ backgroundColor: COLORS.charcoal }}
                      />
                      <div
                        className="relative text-3xl font-semibold"
                        style={{ color: COLORS.champagne }}
                      >
                        {data.nps.score}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 text-center text-xs mt-3">
                    <div>
                      <div style={{ color: COLORS.emerald }}>Promoters</div>
                      <div>{data.nps.promoters}%</div>
                    </div>
                    <div>
                      <div style={{ color: COLORS.champagne }}>Passives</div>
                      <div>{data.nps.passives}%</div>
                    </div>
                    <div>
                      <div style={{ color: COLORS.rose }}>Detractors</div>
                      <div>{data.nps.detractors}%</div>
                    </div>
                  </div>
                </SoftCard>
              </div>

              {/* Universal Transactions (drill-down) */}
              <SoftCard>
                <SectionTitle
                  title="Recent Transactions"
                  icon={<Receipt size={18} color={COLORS.gold} />}
                  right={
                    <div className="text-xs" style={{ color: COLORS.bronze }}>
                      Last 10 • Smart Code routed
                    </div>
                  }
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left" style={{ color: COLORS.bronze }}>
                        <th className="py-2">Date</th>
                        <th>Type</th>
                        <th>Reference</th>
                        <th>Status</th>
                        <th className="text-right">Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500 mx-auto" />
                          </td>
                        </tr>
                      ) : data.txns.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 opacity-70">
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        (data.txns as TxnHeader[]).map(t => (
                          <tr key={t.id} className="border-t" style={{ borderColor: '#1f1f1f' }}>
                            <td className="py-2" style={{ color: COLORS.champagne }}>
                              {shortDate(t.transaction_date || t.created_at)}
                            </td>
                            <td className="capitalize">{t.transaction_type}</td>
                            <td className="font-mono text-xs">{t.transaction_code}</td>
                            <td>
                              <Badge
                                variant="outline"
                                style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                              >
                                {t.status || 'active'}
                              </Badge>
                            </td>
                            <td className="text-right" style={{ color: COLORS.champagne }}>
                              {fmtCurrency(t.total_amount, t.currency || 'GBP')}
                            </td>
                            <td className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border"
                                style={{
                                  borderColor: COLORS.bronze,
                                  background: 'transparent',
                                  color: COLORS.champagne
                                }}
                                onClick={() => openTxnDrilldown(t)}
                              >
                                Details <ChevronRight size={14} className="ml-1" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SoftCard>

              {/* Footer CTA */}
              <div className="flex items-center justify-between py-4">
                <div className="text-xs opacity-70">
                  Smart Code:{' '}
                  <span style={{ color: COLORS.bronze }}>HERA.SALON.DASHBOARD.OWNER.V1</span>
                </div>
                <div className="flex gap-2">
                  <GradientButton>New Booking</GradientButton>
                  <Button
                    variant="outline"
                    className="border"
                    style={{
                      borderColor: COLORS.bronze,
                      color: COLORS.champagne,
                      backgroundColor: 'transparent'
                    }}
                  >
                    Export Report
                  </Button>
                </div>
              </div>
            </div>

            {/* Drill-down Dialog */}
            <Dialog
              open={!!openTxn}
              onOpenChange={v => {
                if (!v) {
                  setOpenTxn(null)
                  setOpenTxnLines(null)
                }
              }}
            >
              <DialogContent
                className="sm:max-w-2xl z-50"
                style={{
                  backgroundColor: COLORS.charcoal,
                  color: COLORS.champagne,
                  border: `1px solid ${COLORS.black}`
                }}
              >
                <DialogHeader>
                  <DTitle className="text-base" style={{ color: COLORS.champagne }}>
                    Transaction {openTxn?.transaction_code}
                  </DTitle>
                  <DialogDescription className="text-xs" style={{ color: COLORS.bronze }}>
                    {openTxn?.smart_code} •{' '}
                    {openTxn && shortDate(openTxn.transaction_date || openTxn.created_at)}
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left" style={{ color: COLORS.bronze }}>
                        <th>Line</th>
                        <th>Description</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Unit</th>
                        <th className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(openTxnLines || []).map(l => (
                        <tr key={l.line_no} className="border-t" style={{ borderColor: '#1f1f1f' }}>
                          <td className="py-2">{l.line_no}</td>
                          <td>{l.description}</td>
                          <td className="text-right">{l.qty}</td>
                          <td className="text-right">{fmtCurrency(l.unit_price)}</td>
                          <td className="text-right" style={{ color: COLORS.champagne }}>
                            {fmtCurrency(l.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {openTxn && (
                  <div className="flex items-center justify-between text-xs mt-3">
                    <div>
                      Org: <span className="font-mono">{openTxn.organization_id}</span>
                    </div>
                    <div>
                      Total:{' '}
                      <span style={{ color: COLORS.champagne }}>
                        {fmtCurrency(openTxn.total_amount, openTxn.currency)}
                      </span>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
