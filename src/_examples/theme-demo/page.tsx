// app/examples/theme-demo/page.tsx - Complete theme system demo
'use client'
import React from 'react'
import {
  HeraProvider,
  HeraThemeProvider,
  ThemePicker,
  DataTable,
  FilterBar,
  ObjectHeader,
  CardKpi,
  useEntities,
  useTransactions
} from '@/ui'
import { HiShoppingBag, HiUsers, HiCurrencyDollar, HiTrendingUp } from 'react-icons/hi'

// Demo component showing all UI elements with theme
function ThemedDashboard() {
  const [filters, setFilters] = useState<Record<string, any>>({})
  const { data: entities } = useEntities({ entity_type: 'customer' })
  const { data: transactions } = useTransactions({ transaction_type: 'sale' })

  const stats = [
    { label: 'Total Customers', value: entities?.length || 0, icon: HiUsers, trend: '+12%' },
    { label: 'Total Sales', value: transactions?.length || 0, icon: HiShoppingBag, trend: '+8%' },
    { label: 'Revenue', value: '$45,231', icon: HiCurrencyDollar, trend: '+23%' },
    { label: 'Growth', value: '15.3%', icon: HiTrendingUp, trend: '+5%' }
  ]

  return (
    <div className="min-h-screen bg-[color:rgb(var(--hera-bg)/1)] text-[color:rgb(var(--hera-text)/1)]">
      <ObjectHeader
        title="Theme Demo Dashboard"
        subtitle="Showcasing all HERA UI components with dynamic theming"
        actions={[
          { label: 'Refresh', onClick: () => window.location.reload() },
          { label: 'Export', onClick: () => console.log('Export') }
        ]}
      />

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Theme Picker Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Theme Customization</h2>
          <p className="text-[color:rgb(var(--hera-muted)/1)]">
            Customize your organization's theme in real-time
          </p>
          <ThemePicker />
        </section>

        {/* Stats Grid */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Key Metrics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <CardKpi key={i} {...stat} />
            ))}
          </div>
        </section>

        {/* Filter Bar Demo */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Filter Controls</h2>
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: [
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' }
                ]
              },
              {
                key: 'date_range',
                label: 'Date Range',
                type: 'select',
                options: [
                  { label: 'Last 7 days', value: '7d' },
                  { label: 'Last 30 days', value: '30d' },
                  { label: 'Last 90 days', value: '90d' }
                ]
              }
            ]}
            value={filters}
            onChange={setFilters}
          />
        </section>

        {/* Data Table Demo */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Customer Data</h2>
          <DataTable
            data={entities || []}
            columns={[
              { key: 'entity_code', label: 'Code' },
              { key: 'entity_name', label: 'Name' },
              { key: 'entity_type', label: 'Type' },
              { key: 'classification', label: 'Classification' }
            ]}
            onRowClick={row => console.log('Clicked:', row)}
            actions={[
              { label: 'Edit', onClick: row => console.log('Edit:', row) },
              { label: 'Delete', onClick: row => console.log('Delete:', row), variant: 'danger' }
            ]}
          />
        </section>

        {/* Theme Elements Preview */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Theme Elements</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-6 rounded-[var(--hera-radius)] bg-[color:rgb(var(--hera-surface)/1)] border border-white/10">
              <h3 className="font-semibold mb-2">Surface Card</h3>
              <p className="text-[color:rgb(var(--hera-muted)/1)] mb-4">
                This card uses the surface background color with subtle border.
              </p>
              <button className="px-4 py-2 rounded-[var(--hera-radius)] bg-[color:rgb(var(--hera-primary)/1)] text-black font-medium">
                Primary Action
              </button>
            </div>

            <div className="p-6 rounded-[var(--hera-radius)] bg-[color:rgb(var(--hera-primary)/0.1)] border-2 border-[color:rgb(var(--hera-primary)/1)]">
              <h3 className="font-semibold mb-2">Primary Accent</h3>
              <p className="text-[color:rgb(var(--hera-muted)/1)] mb-4">
                This card highlights the primary theme color.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-[color:rgb(var(--hera-success)/1)] text-white text-sm">
                  Success
                </span>
                <span className="px-3 py-1 rounded-full bg-[color:rgb(var(--hera-warning)/1)] text-black text-sm">
                  Warning
                </span>
                <span className="px-3 py-1 rounded-full bg-[color:rgb(var(--hera-danger)/1)] text-white text-sm">
                  Danger
                </span>
              </div>
            </div>

            <div className="p-6 rounded-[var(--hera-radius)] backdrop-blur-xl bg-white/5 border border-white/10">
              <h3 className="font-semibold mb-2">Glassmorphism</h3>
              <p className="text-[color:rgb(var(--hera-muted)/1)] mb-4">
                Modern glass effect with backdrop blur.
              </p>
              <div className="space-y-2">
                <p className="font-[family-name:var(--hera-font-sans)] text-sm">Sans-serif text</p>
                <p className="font-[family-name:var(--hera-font-mono)] text-sm">Monospace text</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function ThemeDemoPage() {
  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || 'demo-org-id'

  return (
    <HeraProvider orgId={orgId}>
      <HeraThemeProvider orgId={orgId}>
        <ThemedDashboard />
      </HeraThemeProvider>
    </HeraProvider>
  )
}
