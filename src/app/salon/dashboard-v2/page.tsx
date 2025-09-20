// ================================================================================
// HERA SALON - DASHBOARD PAGE V2 (Charcoal Gold UI Kit)
// Smart Code: HERA.PAGES.SALON.DASHBOARD.V2
// Premium salon dashboard with enhanced UI
// ================================================================================

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  AlertCircle,
  TrendingUp,
  Clock,
  Award,
  ShoppingBag,
  BarChart3,
  Heart,
  Zap
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MouseGlow } from '@/components/salon/MouseGlow'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

// --- KPI Card Component ---
function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  description,
  iconBg
}: {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: { value: string; isPositive: boolean }
  description?: string
  iconBg: string
}) {
  return (
    <div className="glass-card p-6 group hover:scale-[1.02] transition-all">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-semibold text-text-100 tabular-nums">{value}</p>
          {trend && (
            <p className="text-sm text-text-300 flex items-center gap-1">
              <TrendingUp
                className={`w-4 h-4 ${trend.isPositive ? 'text-gold-500' : 'text-red-400'}`}
              />
              <span className={trend.isPositive ? 'text-gold-500' : 'text-red-400'}>
                {trend.value}
              </span>
              <span>vs last period</span>
            </p>
          )}
          {description && <p className="text-xs text-text-500 mt-1">{description}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-gold-500" />
        </div>
      </div>
    </div>
  )
}

// --- Section Header Component ---
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-text-100">{title}</h2>
      {subtitle && <p className="text-sm text-text-500 mt-1">{subtitle}</p>}
    </div>
  )
}

// --- Staff Performance Card ---
function StaffCard({ staff }: { staff: any }) {
  return (
    <div className="glass-card p-4 hover:scale-[1.01] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center font-semibold text-charcoal-900">
            {staff.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-text-100">{staff.name}</p>
            <p className="text-xs text-text-500 flex items-center gap-2 mt-0.5">
              <Activity className="w-3 h-3" /> {staff.utilization}% utilized
              <Star className="w-3 h-3" /> {staff.rating.toFixed(1)}
            </p>
          </div>
        </div>
        <p className="text-lg font-semibold text-gold-400">£{staff.revenue.toLocaleString()}</p>
      </div>
      <div className="w-full bg-charcoal-700 rounded-full h-2">
        <div
          className="h-2 bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all"
          style={{ width: `${Math.min(100, staff.utilization)}%` }}
        />
      </div>
    </div>
  )
}

// --- Recent Booking Row ---
function BookingRow({ booking, onClick }: { booking: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full glass-card p-4 text-left hover:-translate-y-0.5 hover:shadow-xl transition-all group focus:outline-none focus:ring-2 focus:ring-gold-500"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <p className="font-medium text-text-100">{booking.client}</p>
            <span className="text-xs px-2 py-0.5 bg-gold-500/10 text-gold-400 rounded">
              {booking.service}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {booking.when}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {booking.stylist}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-text-100 tabular-nums">
            £{booking.total.toFixed(0)}
          </p>
        </div>
      </div>
    </button>
  )
}

// --- Empty Data ---
const emptyData = {
  kpis: { revenueToday: 0, upcomingAppts: 0, avgTicket: 0, utilization: 0 },
  revenueSeries: [] as any[],
  bookingsByService: [] as any[],
  recent: [] as any[],
  stylists: [] as any[],
  inventory: [] as any[],
  membership: [] as any[],
  nps: { score: 0, promoters: 0, passives: 0, detractors: 0 },
  txns: [] as any[]
}

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

export default function SalonDashboardV2Page() {
  const router = useRouter()
  const { organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [range, setRange] = useState('today')
  const [data, setData] = useState<any>(emptyData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!organization?.id) return

      setLoading(true)
      setError(null)

      try {
        const [kpis, rev, recent, styl, inv, mship, nps] = await Promise.all([
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
          fetchAPI('/salon/feedback/nps', { range, organization_id: organization.id })
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
                  const serviceCount: Record<string, number> = {}
                  recent.data.forEach((booking: any) => {
                    const service = booking.serviceName || 'Unknown'
                    serviceCount[service] = (serviceCount[service] || 0) + 1
                  })
                  return Object.entries(serviceCount).map(([name, value]) => ({ name, value }))
                })()
              : emptyData.bookingsByService,
            recent: recent?.data
              ? recent.data.map((booking: any) => ({
                  id: booking.id,
                  when: format(new Date(booking.date), 'MMM d, h:mm a'),
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
              : emptyData.nps
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

  // Auth checks
  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh text-text-100 bg-charcoal-900 flex items-center justify-center">
        <Alert className="max-w-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access the dashboard.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-dvh text-text-100 bg-charcoal-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-dvh text-text-100 bg-charcoal-900 flex items-center justify-center">
        <Alert className="max-w-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No organization context found. Please select an organization.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Chart colors
  const CHART_COLORS = ['#D4AF37', '#E3C75F', '#F0D584', '#8C7853', '#5A2A40']

  return (
    <div className="min-h-dvh text-text-100 bg-charcoal-900">
      <MouseGlow />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <div className="text-gold-400 uppercase tracking-[0.12em] text-xs font-semibold mb-2">
              Salon Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-100">Dashboard</h1>
            <p className="text-text-500 mt-2">Welcome back, {organization.name}</p>
          </div>
          <div className="flex gap-2">
            {['today', '7d', '30d', 'ytd'].map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  range === r
                    ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-charcoal-900 shadow-[0_8px_30px_rgba(212,175,55,0.35)]'
                    : 'bg-white/5 text-text-300 hover:bg-white/10'
                }`}
              >
                {r === 'today' ? 'Today' : r === '7d' ? 'Week' : r === '30d' ? 'Month' : 'Year'}
              </button>
            ))}
          </div>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            icon={DollarSign}
            label="Revenue"
            value={loading ? '...' : `£${data.kpis.revenueToday.toLocaleString()}`}
            trend={{ value: '+15%', isPositive: true }}
            description="Total sales today"
            iconBg="bg-gold-500/10"
          />
          <KpiCard
            icon={Calendar}
            label="Appointments"
            value={loading ? '...' : data.kpis.upcomingAppts}
            trend={{ value: '+8%', isPositive: true }}
            description="Upcoming today"
            iconBg="bg-emerald-500/10"
          />
          <KpiCard
            icon={ShoppingBag}
            label="Average Ticket"
            value={loading ? '...' : `£${data.kpis.avgTicket}`}
            trend={{ value: '-5%', isPositive: false }}
            description="Per appointment"
            iconBg="bg-blue-500/10"
          />
          <KpiCard
            icon={Activity}
            label="Utilization"
            value={loading ? '...' : `${data.kpis.utilization}%`}
            trend={{ value: '+12%', isPositive: true }}
            description="Staff capacity"
            iconBg="bg-purple-500/10"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <SectionHeader title="Revenue Trend" subtitle="Last 12 weeks performance" />
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gold-500/10 text-gold-400 rounded-md">
                <Zap className="w-3 h-3" />
                AI Insights
              </span>
            </div>
            <div className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-gold-500 border-t-transparent" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252932" />
                    <XAxis
                      dataKey="week"
                      stroke="#9AA3AE"
                      tick={{ fill: '#9AA3AE', fontSize: 12 }}
                    />
                    <YAxis stroke="#9AA3AE" tick={{ fill: '#9AA3AE', fontSize: 12 }} />
                    <ReTooltip
                      contentStyle={{
                        backgroundColor: '#14161A',
                        border: '1px solid rgba(212,175,55,0.3)',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#D4AF37"
                      strokeWidth={3}
                      dot={{ fill: '#D4AF37', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 p-4 bg-gold-500/10 rounded-lg">
              <p className="text-sm text-gold-400">
                <strong>Insight:</strong> Wednesday afternoons show 23% lower bookings. Consider a
                midweek promotion to boost revenue.
              </p>
            </div>
          </div>

          {/* Service Distribution */}
          <div className="glass-card p-6">
            <SectionHeader title="Top Services" subtitle="Booking distribution" />
            <div className="h-64 flex items-center justify-center">
              {loading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gold-500 border-t-transparent" />
              ) : data.bookingsByService.length > 0 ? (
                <PieChart width={200} height={200}>
                  <Pie
                    data={data.bookingsByService}
                    cx={100}
                    cy={100}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.bookingsByService.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ReTooltip />
                </PieChart>
              ) : (
                <p className="text-text-500">No data available</p>
              )}
            </div>
            {!loading && data.bookingsByService.length > 0 && (
              <div className="space-y-2 mt-4">
                {data.bookingsByService.map((service: any, idx: number) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span className="text-sm text-text-300">{service.name}</span>
                    </div>
                    <span className="text-sm font-medium text-text-100">{service.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Bookings & Top Staff */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Bookings */}
          <div className="lg:col-span-2 space-y-4">
            <SectionHeader title="Recent Bookings" subtitle="Latest customer appointments" />
            {loading ? (
              <div className="glass-card p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gold-500 border-t-transparent" />
              </div>
            ) : data.recent.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-text-500">No recent bookings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recent.map((booking: any) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    onClick={() => router.push(`/salon/appointments/${booking.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Top Staff */}
          <div className="space-y-4">
            <SectionHeader title="Top Performers" subtitle="Staff leaderboard" />
            {loading ? (
              <div className="glass-card p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gold-500 border-t-transparent" />
              </div>
            ) : data.stylists.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-text-500">No staff data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.stylists.map((staff: any, idx: number) => (
                  <StaffCard key={staff.id} staff={staff} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row - Inventory, Membership, NPS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Low Stock Alert */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-100">Low Stock Alerts</h3>
              <Badge className="bg-red-500/10 text-red-400 border-red-500/30">Critical</Badge>
            </div>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-4 border-gold-500 border-t-transparent" />
              </div>
            ) : data.inventory.length === 0 ? (
              <p className="text-text-500 text-center py-4">All items in stock</p>
            ) : (
              <div className="space-y-3">
                {data.inventory.map((item: any) => (
                  <div
                    key={item.sku}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-text-100">{item.name}</p>
                      <p className="text-xs text-text-500">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${item.stock < item.min ? 'text-red-400' : 'text-text-100'}`}
                      >
                        {item.stock} left
                      </p>
                      <p className="text-xs text-text-500">Min: {item.min}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Membership Tiers */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-100">Membership Tiers</h3>
              <Award className="w-5 h-5 text-gold-500" />
            </div>
            <div className="space-y-3">
              {data.membership.map((tier: any) => (
                <div
                  key={tier.tier}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Crown
                      className="w-4 h-4"
                      style={{
                        color:
                          tier.tier === 'Emerald'
                            ? '#0F6F5C'
                            : tier.tier === 'Gold'
                              ? '#D4AF37'
                              : '#E8B4B8'
                      }}
                    />
                    <span className="font-medium text-text-100">{tier.tier}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text-100">{tier.count}</p>
                    <p className="text-xs text-text-500">£{tier.arpu} ARPU</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NPS Score */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-100">Client Satisfaction</h3>
              <Heart className="w-5 h-5 text-gold-500" />
            </div>
            <div className="flex items-center justify-center h-32">
              <div className="relative">
                <div className="text-5xl font-bold text-gold-400">{data.nps.score}</div>
                <div className="text-xs text-text-500 text-center mt-1">NPS Score</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs mt-4">
              <div>
                <div className="font-medium text-emerald-400">{data.nps.promoters}%</div>
                <div className="text-text-500">Promoters</div>
              </div>
              <div>
                <div className="font-medium text-yellow-400">{data.nps.passives}%</div>
                <div className="text-text-500">Passives</div>
              </div>
              <div>
                <div className="font-medium text-red-400">{data.nps.detractors}%</div>
                <div className="text-text-500">Detractors</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between p-6 glass-card">
          <div>
            <p className="font-medium text-text-100">Quick Actions</p>
            <p className="text-sm text-text-500 mt-1">Common tasks and operations</p>
          </div>
          <div className="flex gap-2">
            <button className="gold-btn" onClick={() => router.push('/salon/appointments/new')}>
              <Calendar className="w-4 h-4" />
              New Booking
            </button>
            <button className="ghost-btn" onClick={() => router.push('/salon/customers/new')}>
              <Users className="w-4 h-4" />
              Add Customer
            </button>
            <button className="ghost-btn">
              <Receipt className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
