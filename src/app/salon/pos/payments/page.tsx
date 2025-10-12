'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useHeraSales } from '@/hooks/useHeraSales'
import { SimpleSalonGuard } from '@/components/salon/auth/SimpleSalonGuard'
import { SaleDetailsDialog } from '@/components/salon/pos/SaleDetailsDialog'
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
  Filter
} from 'lucide-react'
import { format } from 'date-fns'

// Luxury salon color palette
const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#B794F4',
  rose: '#E8B4B8',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  ease: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
}

function PaymentsContent() {
  const router = useRouter()
  const { organization } = useSecuredSalonContext()
  const organizationId = organization?.id
  const currency = organization?.currencySymbol || 'AED' // ✅ ENTERPRISE: Dynamic currency

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)

  // Fetch sales data
  const { sales, isLoading, refetch, SALE_STATUS_CONFIG } = useHeraSales({
    organizationId: organizationId || ''
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.black }}
      >
        <div
          className="text-center p-10 rounded-2xl"
          style={{
            backgroundColor: LUXE_COLORS.charcoal,
            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.1)',
            border: `1px solid ${LUXE_COLORS.gold}20`
          }}
        >
          <Sparkles className="w-16 h-16 mx-auto mb-4" style={{ color: LUXE_COLORS.gold }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: LUXE_COLORS.champagne }}>
            Loading Payment History
          </h2>
          <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Please wait while we fetch your transactions...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: LUXE_COLORS.black }}>
      {/* Enhanced gradient background with animation */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 10% 20%, ${LUXE_COLORS.gold}08 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 90% 80%, ${LUXE_COLORS.plum}06 0%, transparent 50%),
            radial-gradient(ellipse 90% 70% at 50% 50%, ${LUXE_COLORS.emerald}04 0%, transparent 60%)
          `,
          opacity: 0.7,
          animation: 'gradient 8s ease-in-out infinite'
        }}
      />

      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            opacity: 0.7;
          }
          50% {
            opacity: 0.85;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>

      {/* Main Container */}
      <div
        className="rounded-2xl p-8 backdrop-blur-xl relative"
        style={{
          background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
          border: `1px solid ${LUXE_COLORS.gold}15`,
          boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.1)',
          animation: 'slideUp 0.5s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/salon/pos')}
                className="transition-all duration-300"
                style={{
                  color: LUXE_COLORS.gold,
                  border: `1px solid ${LUXE_COLORS.gold}30`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${LUXE_COLORS.gold}20`
                  e.currentTarget.style.transform = 'translateX(-4px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to POS
              </Button>
            </div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em'
              }}
            >
              Payment History
            </h1>
            <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              View and manage all completed transactions
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.emerald}20 0%, ${LUXE_COLORS.emerald}10 100%)`,
                color: LUXE_COLORS.emerald,
                border: `1px solid ${LUXE_COLORS.emerald}40`
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(15,111,92,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.gold}20 0%, ${LUXE_COLORS.gold}10 100%)`,
                color: LUXE_COLORS.gold,
                border: `1px solid ${LUXE_COLORS.gold}40`
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(212,175,55,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {[
            {
              title: 'Total Sales',
              value: stats.totalSales,
              desc: 'All time',
              icon: Receipt,
              color: LUXE_COLORS.gold
            },
            {
              title: 'Total Revenue',
              value: `${currency} ${stats.totalRevenue.toFixed(2)}`,
              desc: 'All transactions',
              icon: DollarSign,
              color: LUXE_COLORS.emerald
            },
            {
              title: 'Today Sales',
              value: stats.todaySales,
              desc: 'Today',
              icon: Calendar,
              color: LUXE_COLORS.plum
            },
            {
              title: 'Today Revenue',
              value: `${currency} ${stats.todayRevenue.toFixed(2)}`,
              desc: 'Daily earnings',
              icon: CreditCard,
              color: LUXE_COLORS.bronze
            },
            {
              title: 'Avg Transaction',
              value: `${currency} ${stats.avgTransaction.toFixed(2)}`,
              desc: 'Per sale',
              icon: Sparkles,
              color: LUXE_COLORS.champagne
            }
          ].map((stat, index) => (
            <div
              key={index}
              className="rounded-xl p-6 transition-all duration-500 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                border: `1px solid ${stat.color}20`,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transitionTimingFunction: LUXE_COLORS.spring,
                animation: `fadeIn 0.6s ease-out ${index * 0.1}s backwards`
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.2)'
                e.currentTarget.style.borderColor = `${stat.color}50`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                e.currentTarget.style.borderColor = `${stat.color}20`
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium" style={{ color: LUXE_COLORS.bronze }}>
                  {stat.title}
                </p>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: LUXE_COLORS.champagne }}>
                {stat.value}
              </div>
              <p className="text-xs" style={{ color: LUXE_COLORS.bronze, opacity: 0.7 }}>
                {stat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: LUXE_COLORS.bronze }}
              />
              <Input
                placeholder="Search by transaction code or customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-6 border-0"
                style={{
                  background: 'rgba(245,230,200,0.05)',
                  border: `1px solid ${LUXE_COLORS.gold}20`,
                  color: LUXE_COLORS.champagne,
                  borderRadius: '0.75rem',
                  transition: `all 0.3s ${LUXE_COLORS.smooth}`
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}50`
                  e.currentTarget.style.background = 'rgba(245,230,200,0.08)'
                  e.currentTarget.style.boxShadow = `0 0 0 4px ${LUXE_COLORS.gold}10`
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}20`
                  e.currentTarget.style.background = 'rgba(245,230,200,0.05)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Status Filter */}
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="border-0 py-6"
                  style={{
                    background: 'rgba(245,230,200,0.05)',
                    border: `1px solid ${LUXE_COLORS.gold}20`,
                    color: LUXE_COLORS.champagne,
                    borderRadius: '0.75rem'
                  }}
                >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(SALE_STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="w-48">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger
                  className="border-0 py-6"
                  style={{
                    background: 'rgba(245,230,200,0.05)',
                    border: `1px solid ${LUXE_COLORS.gold}20`,
                    color: LUXE_COLORS.champagne,
                    borderRadius: '0.75rem'
                  }}
                >
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
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
              border: `1px solid ${LUXE_COLORS.gold}10`
            }}
          >
            <Receipt
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: LUXE_COLORS.bronze, opacity: 0.5 }}
            />
            <h3 className="text-xl font-medium mb-2" style={{ color: LUXE_COLORS.champagne }}>
              No transactions found
            </h3>
            <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
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
                  className="rounded-xl p-6 transition-all duration-500 cursor-pointer relative overflow-hidden group"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(245,230,200,0.08) 0%, rgba(212,175,55,0.05) 50%, rgba(184,134,11,0.03) 100%)',
                    border: `1px solid ${LUXE_COLORS.gold}25`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    transitionTimingFunction: LUXE_COLORS.spring,
                    backdropFilter: 'blur(8px)',
                    animation: `fadeIn 0.4s ease-out ${index * 0.05}s backwards`
                  }}
                  onMouseMove={e => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    e.currentTarget.style.background = `
                      radial-gradient(circle at ${x}% ${y}%,
                        rgba(212,175,55,0.15) 0%,
                        rgba(212,175,55,0.08) 30%,
                        rgba(245,230,200,0.05) 60%,
                        rgba(184,134,11,0.03) 100%
                      )
                    `
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateX(6px)'
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(212,175,55,0.25)'
                    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}60`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
                    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}25`
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, rgba(245,230,200,0.08) 0%, rgba(212,175,55,0.05) 50%, rgba(184,134,11,0.03) 100%)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1">
                      {/* Transaction Code */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Receipt className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
                          <span className="font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                            {sale.transaction_code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: LUXE_COLORS.bronze }}>
                          <Calendar className="w-3 h-3" />
                          <span>{format(saleDate, 'MMM d, yyyy • h:mm a')}</span>
                        </div>
                      </div>

                      {/* Customer */}
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" style={{ color: LUXE_COLORS.bronze }} />
                        <span style={{ color: LUXE_COLORS.champagne }}>{sale.customer_name}</span>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center gap-2 font-bold text-lg" style={{ color: LUXE_COLORS.gold }}>
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

                    {/* View Details Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSaleId(sale.id)}
                      className="group-hover:scale-105 transition-all duration-300"
                      style={{
                        color: LUXE_COLORS.gold,
                        border: `1px solid ${LUXE_COLORS.gold}30`,
                        background: `${LUXE_COLORS.gold}10`,
                        opacity: 0.7
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.opacity = '1'
                        e.currentTarget.style.background = `${LUXE_COLORS.gold}20`
                        e.currentTarget.style.transform = 'scale(1.05)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.opacity = '0.7'
                        e.currentTarget.style.background = `${LUXE_COLORS.gold}10`
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sale Details Dialog */}
      {selectedSaleId && organizationId && (
        <SaleDetailsDialog
          open={!!selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
          saleId={selectedSaleId}
          organizationId={organizationId}
          currency={currency}
        />
      )}
    </div>
  )
}

export default function PaymentsPage() {
  return (
    <SimpleSalonGuard requiredRoles={['owner', 'receptionist', 'admin']}>
      <PaymentsContent />
    </SimpleSalonGuard>
  )
}
