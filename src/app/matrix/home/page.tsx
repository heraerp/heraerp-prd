"use client"

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useHera } from '@/lib/hooks/hera'
import { TrendingUp, Package, Wrench, CreditCard, Users, BarChart3, Settings } from 'lucide-react'

export default function MatrixHomePage() {
  const { client, auth } = useHera()
  const now = useMemo(() => new Date(), [])
  const from = new Date(now)
  from.setHours(0, 0, 0, 0)

  const [tiles, setTiles] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    const org = auth.organization_id || 'mock-org'
    client
      .analyticsTiles({ organization_id: org, from: from.toISOString(), to: now.toISOString() })
      .then(res => { if (mounted) setTiles(res) })
      .catch(e => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [auth.organization_id, client, from, now])

  const kpiIcons = {
    SalesToday: TrendingUp,
    OpenTickets: Wrench,
    LowStock: Package,
    CashSnapshot: CreditCard
  }

  const quickActions = [
    { label: 'New Sale', href: '/matrix/sales/pos', icon: TrendingUp, color: 'glass-warm' },
    { label: 'Manage Inventory', href: '/matrix/inventory/catalog', icon: Package, color: 'glass-sage' },
    { label: 'Service Intake', href: '/matrix/service/intake', icon: Wrench, color: 'glass-neutral' },
    { label: 'View Reports', href: '/matrix/analytics', icon: BarChart3, color: 'glass' },
    { label: 'Customer Management', href: '/matrix/crm', icon: Users, color: 'glass-warm' },
    { label: 'System Settings', href: '/matrix/admin', icon: Settings, color: 'glass-sage' }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="glass-card glass-warm">
        <h1 className="text-3xl font-bold text-[#45492D] mb-2">Welcome to Matrix IT World</h1>
        <p className="text-[#818865] text-lg">Enterprise-grade retail management at your fingertips</p>
      </div>

      {/* KPI Section */}
      <div>
        <h2 className="text-xl font-semibold text-[#45492D] mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#BB8D3F]" />
          Today's Performance
        </h2>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {loading && (
            <div className="glass-loading col-span-full p-4 text-center text-[#818865]">
              Loading KPIs…
            </div>
          )}
          {error && (
            <div className="glass status-error col-span-full p-4 text-center text-red-700">
              {error}
            </div>
          )}
          {(tiles?.tiles || [
            { key: 'SalesToday', value: 12500, currency: true },
            { key: 'OpenTickets', value: 8 },
            { key: 'LowStock', value: 3 },
            { key: 'CashSnapshot', value: 45200, currency: true }
          ]).map((t: any) => {
            const IconComponent = kpiIcons[t.key as keyof typeof kpiIcons] || BarChart3
            return (
              <div key={t.key} className="glass-kpi group cursor-pointer hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#BB8D3F]/20 to-[#8B4729]/20">
                    <IconComponent className="w-5 h-5 text-[#8B4729]" />
                  </div>
                  <div className="text-xs font-medium text-[#818865] uppercase tracking-wider">
                    {t.key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#45492D]">
                  {t.currency ? '₹' : ''}
                  {typeof t.value === 'number' ? t.value.toLocaleString() : String(t.value)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-[#45492D] mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#BB8D3F]" />
          Quick Actions
        </h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`glass-card ${action.color} group hover:scale-105 transition-all duration-300 no-underline`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-gradient-to-br from-[#BB8D3F]/30 to-[#8B4729]/20 group-hover:from-[#BB8D3F]/40 group-hover:to-[#8B4729]/30 transition-all">
                    <IconComponent className="w-6 h-6 text-[#45492D]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#45492D] group-hover:text-[#8B4729] transition-colors">
                      {action.label}
                    </div>
                    <div className="text-sm text-[#818865]">
                      Click to access
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
