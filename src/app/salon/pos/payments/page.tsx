'use client'

// Removed force-dynamic for better client-side navigation performance

import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useHeraSales } from '@/hooks/useHeraSales'
import { SimpleSalonGuard } from '@/components/salon/auth/SimpleSalonGuard'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { SalonLuxeKPICard } from '@/components/salon/shared/SalonLuxeKPICard'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  CreditCard,
  Search,
  Receipt,
  Calendar,
  DollarSign,
  User,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Download,
  X
} from 'lucide-react'
import { format } from 'date-fns'

// 🚀 LAZY LOADING: Split code for faster initial load
const SaleDetailsDialog = lazy(() =>
  import('@/components/salon/pos/SaleDetailsDialog').then(module => ({ default: module.SaleDetailsDialog }))
)

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#B794F4',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

function PaymentsContent() {
  const router = useRouter()
  const { organization } = useSecuredSalonContext()
  const organizationId = organization?.id
  const currency = organization?.currencySymbol || 'AED' // ✅ ENTERPRISE: Dynamic currency

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('today') // ✅ DEFAULT: Today
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)

  // Fetch sales data with branch filter
  const { sales, isLoading, refetch, SALE_STATUS_CONFIG, branches } = useHeraSales({
    organizationId: organizationId || '',
    filters: {
      branch_id: branchFilter !== 'all' ? branchFilter : undefined
    }
  })

  // ⚡ PERFORMANCE: Memoize filtered sales
  const filteredSales = useMemo(() => {
    if (!sales) return []

    return sales.filter(sale => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        sale.transaction_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter

      // Date filter
      let matchesDate = true
      if (dateFilter !== 'all' && sale.transaction_date) {
        const saleDate = new Date(sale.transaction_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        switch (dateFilter) {
          case 'today':
            matchesDate = saleDate.toDateString() === today.toDateString()
            break
          case 'week':
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 7)
            matchesDate = saleDate >= weekAgo
            break
          case 'month':
            const monthAgo = new Date(today)
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            matchesDate = saleDate >= monthAgo
            break
        }
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [sales, searchTerm, statusFilter, dateFilter])

  // ⚡ PERFORMANCE: Memoize stats
  const stats = useMemo(() => {
    const total = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaySales = filteredSales.filter(sale => {
      const saleDate = new Date(sale.transaction_date)
      return saleDate.toDateString() === today.toDateString()
    })

    const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0)

    return {
      totalSales: filteredSales.length,
      totalRevenue: total,
      todaySales: todaySales.length,
      todayRevenue: todayTotal,
      avgTransaction: filteredSales.length > 0 ? total / filteredSales.length : 0
    }
  }, [filteredSales])

  if (!organizationId) {
    return (
      <SalonLuxePage title="Payment History" description="Loading..." maxWidth="full" padding="lg">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gold/30 border-t-gold mx-auto mb-4" />
            <p className="text-sm" style={{ color: COLORS.bronze }}>
              Loading payment history...
            </p>
          </div>
        </div>
      </SalonLuxePage>
    )
  }

  return (
    <SalonLuxePage
      title="Payment History"
      description="View and manage all completed transactions"
      maxWidth="full"
      padding="lg"
      actions={
        <>
          {/* Back to POS */}
          <button
            onClick={() => router.push('/salon/pos')}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.charcoal,
              color: COLORS.gold,
              border: `1px solid ${COLORS.gold}40`
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to POS
          </button>
          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.emerald,
              color: COLORS.champagne,
              border: `1px solid ${COLORS.emerald}`
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {/* Export */}
          <button
            onClick={() => {/* TODO: Add export logic */}}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.gold,
              color: COLORS.black,
              border: `1px solid ${COLORS.gold}`
            }}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </>
      }
    >
      {/* 📱 PREMIUM MOBILE HEADER */}
      <PremiumMobileHeader
        title="Payments"
        subtitle={`${filteredSales.length} transactions`}
        showNotifications={false}
        shrinkOnScroll
        rightAction={
          <button
            onClick={() => refetch()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0F6F5C] active:scale-90 transition-transform duration-200 shadow-lg"
            aria-label="Refresh payments"
            style={{ boxShadow: '0 4px 12px rgba(15, 111, 92, 0.4)' }}
          >
            <RefreshCw className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="p-4 md:p-6 lg:p-8">

        {/* 📊 KPI CARDS - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
          <SalonLuxeKPICard
            title="Total Sales"
            value={stats.totalSales}
            icon={Receipt}
            color={COLORS.gold}
            description="All time"
            animationDelay={0}
          />
          <SalonLuxeKPICard
            title="Total Revenue"
            value={`${currency} ${stats.totalRevenue.toFixed(2)}`}
            icon={DollarSign}
            color={COLORS.emerald}
            description="All transactions"
            animationDelay={100}
          />
          <SalonLuxeKPICard
            title="Today Sales"
            value={stats.todaySales}
            icon={Calendar}
            color={COLORS.plum}
            description="Today"
            animationDelay={200}
          />
          <SalonLuxeKPICard
            title="Today Revenue"
            value={`${currency} ${stats.todayRevenue.toFixed(2)}`}
            icon={CreditCard}
            color={COLORS.bronze}
            description="Daily earnings"
            animationDelay={300}
          />
          <SalonLuxeKPICard
            title="Avg Transaction"
            value={`${currency} ${stats.avgTransaction.toFixed(2)}`}
            icon={Sparkles}
            color={COLORS.champagne}
            description="Per sale"
            animationDelay={400}
          />
        </div>

        {/* 📱 MOBILE QUICK ACTIONS */}
        <div className="md:hidden mb-6 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/salon/pos')}
              className="flex-1 min-h-[48px] rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              style={{
                backgroundColor: COLORS.charcoal,
                color: COLORS.gold,
                border: `1px solid ${COLORS.gold}40`
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to POS
            </button>
            <button
              onClick={() => refetch()}
              className="min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center"
              style={{
                backgroundColor: COLORS.emerald,
                color: COLORS.champagne
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 md:mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 md:min-w-[300px]">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: COLORS.bronze }}
              />
              <Input
                placeholder="Search by transaction code or customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  color: COLORS.champagne,
                  border: `1px solid ${COLORS.bronze}30`
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-bronze/20 transition-colors"
                  style={{ color: COLORS.bronze }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="transition-all duration-200"
                  style={{
                    backgroundColor: COLORS.charcoalLight + '80',
                    borderColor: COLORS.bronze + '40',
                    color: COLORS.champagne
                  }}
                >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem value="all" className="hera-select-item">All statuses</SelectItem>
                  {Object.entries(SALE_STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status} className="hera-select-item">
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="w-full md:w-48">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger
                  className="transition-all duration-200"
                  style={{
                    backgroundColor: COLORS.charcoalLight + '80',
                    borderColor: COLORS.bronze + '40',
                    color: COLORS.champagne
                  }}
                >
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem value="all" className="hera-select-item">All dates</SelectItem>
                  <SelectItem value="today" className="hera-select-item">Today</SelectItem>
                  <SelectItem value="week" className="hera-select-item">Last 7 days</SelectItem>
                  <SelectItem value="month" className="hera-select-item">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branch Filter */}
            <div className="w-full md:w-48">
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger
                  className="transition-all duration-200"
                  style={{
                    backgroundColor: COLORS.charcoalLight + '80',
                    borderColor: COLORS.bronze + '40',
                    color: COLORS.champagne
                  }}
                >
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem value="all" className="hera-select-item">All branches</SelectItem>
                  {branches?.map(branch => (
                    <SelectItem key={branch.id} value={branch.id} className="hera-select-item">
                      {branch.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Sales List */}
        {filteredSales.length === 0 ? (
          <div
            className="text-center py-20 rounded-xl"
            style={{
              background: 'rgba(245,230,200,0.03)',
              border: `1px solid ${COLORS.gold}10`
            }}
          >
            <Receipt
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: COLORS.bronze, opacity: 0.5 }}
            />
            <h3 className="text-xl font-medium mb-2" style={{ color: COLORS.champagne }}>
              No transactions found
            </h3>
            <p className="text-sm" style={{ color: COLORS.bronze }}>
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || branchFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No sales have been completed yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSales.map((sale, index) => {
              // ✅ FIX: Fallback to 'completed' if status not in config
              const statusConfig = SALE_STATUS_CONFIG[sale.status] || SALE_STATUS_CONFIG.completed
              const saleDate = new Date(sale.transaction_date)

              return (
                <div
                  key={sale.id}
                  className="rounded-xl p-4 md:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer border animate-in fade-in slide-in-from-bottom-2"
                  style={{
                    backgroundColor: COLORS.charcoal,
                    borderColor: `${COLORS.gold}25`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    animationDelay: `${index * 50}ms`
                  }}
                  onClick={() => setSelectedSaleId(sale.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 flex-1">
                      {/* Transaction Code */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Receipt className="w-4 h-4" style={{ color: COLORS.gold }} />
                          <span className="font-semibold" style={{ color: COLORS.champagne }}>
                            {sale.transaction_code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: COLORS.bronze }}>
                          <Calendar className="w-3 h-3" />
                          <span>{format(saleDate, 'MMM d, yyyy • h:mm a')}</span>
                        </div>
                      </div>

                      {/* Customer */}
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" style={{ color: COLORS.bronze }} />
                        <span style={{ color: COLORS.champagne }}>{sale.customer_name}</span>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center gap-2 font-bold text-lg" style={{ color: COLORS.gold }}>
                        <DollarSign className="w-5 h-5" />
                        <span>{currency} {sale.total_amount.toFixed(2)}</span>
                      </div>

                      {/* Status */}
                      <Badge
                        className="transition-all duration-300"
                        style={{
                          background: `${statusConfig.color}20`,
                          color: statusConfig.color,
                          border: `1px solid ${statusConfig.color}40`,
                          fontWeight: '500'
                        }}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* View Details Badge - Hidden on mobile (click card instead) */}
                    <Badge
                      className="hidden md:inline-flex transition-all duration-300 hover:scale-105"
                      style={{
                        backgroundColor: `${COLORS.gold}20`,
                        color: COLORS.gold,
                        border: `1px solid ${COLORS.gold}40`,
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      View Details →
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 📱 BOTTOM SPACING - Mobile scroll comfort */}
        <div className="h-20 md:h-0" />
      </div>

      {/* Sale Details Dialog - Lazy Loaded */}
      {selectedSaleId && organizationId && (
        <Suspense fallback={null}>
          <SaleDetailsDialog
            open={!!selectedSaleId}
            onClose={() => setSelectedSaleId(null)}
            saleId={selectedSaleId}
            organizationId={organizationId}
            currency={currency}
          />
        </Suspense>
      )}
    </SalonLuxePage>
  )
}

export default function PaymentsPage() {
  return (
    <SimpleSalonGuard requiredRoles={['owner', 'receptionist', 'admin']}>
      <PaymentsContent />
    </SimpleSalonGuard>
  )
}
