'use client'
import React from 'react'
import { useList } from '@/lib/ui-binder'
import { FilterBar } from '@/components/uikit/FilterBar'
import { JewelryDataTable } from '@/components/jewelry/JewelryDataTable'
import { getEffectiveGoldRate } from '@/lib/jewelry/rates'
import { useOrgId } from '@/lib/runtime/useOrgId'
import { motion } from 'framer-motion'
import { Gem, Sparkles, TrendingUp, Package } from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

export default function JewelryWorklistPage() {
  const orgId = useOrgId()
  const [query, setQuery] = React.useState({ search:'', filter:'', order:'entity_name asc', pageSize:20, page:0 })
  const { data, isLoading } = useList(orgId, {
    entityType: 'item',
    smartCodePrefix: 'HERA.JEWELRY.ENTITY.ITEM',
    search: query.search,
    limit: query.pageSize,
    offset: query.page * query.pageSize,
    orderBy: query.order
  })

  const [goldRate, setGoldRate] = React.useState<number | null>(null)
  React.useEffect(() => { (async()=>{
    const r = await getEffectiveGoldRate(orgId, new Date().toISOString(), 22)
    setGoldRate(r?.rate_per_gram || null)
  })() }, [orgId])

  const rows = (data ?? []).map((e: any) => {
    const dd:any = e.dynamic_data ?? {}
    const priceEstimate = goldRate ? (dd.net_weight ?? 0) * goldRate : null
    return {
      id: e.id,
      name: e.entity_name,
      sku: e.metadata?.sku ?? '',
      purity: dd.purity_karat ?? '',
      net_weight: dd.net_weight ?? '',
      price_estimate: priceEstimate ? priceEstimate.toFixed(2) : '—'
    }
  })

  const columns = [
    { key:'name', label:'Item', sortable: true },
    { key:'sku', label:'SKU' },
    { key:'purity', label:'Purity (K)' },
    { key:'net_weight', label:'Net (g)' },
    { key:'price_estimate', label:'Est. Price' },
  ]

  // Calculate summary statistics
  const totalItems = rows.length
  const totalWeight = rows.reduce((sum, row) => sum + (parseFloat(row.net_weight) || 0), 0)
  const totalValue = rows.reduce((sum, row) => {
    const estimate = parseFloat(row.price_estimate.replace(/[^0-9.]/g, '')) || 0
    return sum + estimate
  }, 0)
  const avgPurity = rows.length > 0 
    ? rows.reduce((sum, row) => sum + (parseFloat(row.purity) || 0), 0) / rows.length 
    : 0

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      {/* Glassmorphism Backdrop */}
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          {/* Page Header with Animation */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
              <Gem className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              Luxury Jewelry Collection
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Exquisite pieces crafted with precision and passion
            </p>
          </motion.div>

          {/* Summary Cards with Glassmorphism */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="jewelry-glass-card jewelry-float p-6 text-center">
              <Package className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{totalItems}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Total Items</p>
            </div>
            
            <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.1s' }}>
              <TrendingUp className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{totalWeight.toFixed(1)}g</h3>
              <p className="jewelry-text-muted text-sm font-medium">Total Weight</p>
            </div>
            
            <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.2s' }}>
              <Sparkles className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">${totalValue.toLocaleString()}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Est. Value</p>
            </div>
            
            <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.3s' }}>
              <Gem className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{avgPurity.toFixed(1)}K</h3>
              <p className="jewelry-text-muted text-sm font-medium">Avg. Purity</p>
            </div>
          </motion.div>

          {/* Gold Rate Display */}
          {goldRate && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="jewelry-glass-panel-strong text-center jewelry-pulse-glow"
            >
              <div className="flex items-center justify-center space-x-3">
                <Sparkles className="jewelry-icon-gold" size={24} />
                <span className="jewelry-text-luxury text-lg">
                  Current Gold Rate: <span className="font-bold">${goldRate.toFixed(2)}/gram</span>
                </span>
                <Sparkles className="jewelry-icon-gold" size={24} />
              </div>
            </motion.div>
          )}

          {/* Filter Bar with Glassmorphism */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="jewelry-glass-panel"
          >
            <FilterBar 
              onFilterChange={setQuery}
              searchPlaceholder="Search luxury jewelry items..."
              className="bg-transparent border-none shadow-none"
            />
          </motion.div>

          {/* Data Table with Glassmorphism */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="jewelry-glass-panel jewelry-shimmer"
          >
            <JewelryDataTable
              columns={columns}
              data={rows}
              loading={isLoading}
              pagination={{
                page: query.page + 1,
                pageSize: query.pageSize,
                total: data?.length || 0,
                onPageChange: (page) => setQuery(q => ({ ...q, page: page - 1 }))
              }}
              sorting={{
                column: query.order.split(' ')[0],
                direction: query.order.includes('desc') ? 'desc' : 'asc',
                onSort: (column, direction) => setQuery(q => ({ ...q, order: `${column} ${direction}` }))
              }}
              onRowClick={(r) => window.location.assign(`/jewelry/record/${r.id}`)}
              emptyMessage="No luxury jewelry items found"
              className="jewelry-table"
            />
          </motion.div>

          {/* Footer with Branding */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center mt-12 mb-6"
          >
            <p className="text-jewelry-platinum-500 text-sm">
              Powered by <span className="jewelry-text-luxury font-semibold">HERA Luxury Management System</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}