'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useMemo } from 'react'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useHeraCustomers } from '@/hooks/useHeraCustomers'
import { useHeraServices } from '@/hooks/useHeraServicesV2'
import { useHeraProducts } from '@/hooks/useHeraProducts'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { usePosTicket } from '@/hooks/usePosTicket'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Scissors,
  Package,
  DollarSign,
  UserCheck,
  RefreshCw,
  Star,
  ShoppingBag,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ElementType
  iconColor: string
  iconBgColor: string
  gradient?: string
}

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  iconBgColor,
  gradient
}: StatCardProps) {
  const isPositive = change !== undefined ? change >= 0 : true

  return (
    <div
      className="relative p-6 rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group overflow-hidden"
      style={{
        background:
          gradient || `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.charcoal} 100%)`,
        border: `1px solid ${COLORS.gold}20`,
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Animated Background Shimmer */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${COLORS.gold}10 50%, transparent 100%)`,
          transform: 'translateX(-100%)',
          animation: 'shimmer 3s infinite'
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          {/* Icon */}
          <div
            className="p-3 rounded-xl transition-all duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${iconBgColor}40 0%, ${iconBgColor}20 100%)`,
              border: `1px solid ${iconColor}30`,
              boxShadow: `0 4px 12px ${iconColor}20`
            }}
          >
            <Icon className="w-6 h-6" style={{ color: iconColor }} />
          </div>

          {/* Change Indicator */}
          {change !== undefined && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-300"
              style={{
                backgroundColor: isPositive ? `${COLORS.emerald}20` : '#FF6B6B20',
                color: isPositive ? COLORS.emerald : '#FF6B6B',
                border: `1px solid ${isPositive ? COLORS.emerald : '#FF6B6B'}30`
              }}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Title */}
        <h3
          className="text-sm font-medium mb-2 transition-all duration-300"
          style={{ color: COLORS.bronze }}
        >
          {title}
        </h3>

        {/* Value */}
        <p
          className="text-3xl font-bold mb-1 transition-all duration-300 group-hover:text-shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          {value}
        </p>

        {/* Change Label */}
        {changeLabel && (
          <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.6 }}>
            {changeLabel}
          </p>
        )}
      </div>

      {/* Decorative Corner Accent */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10 transition-all duration-500 group-hover:scale-150 group-hover:opacity-20"
        style={{ background: iconColor }}
      />
    </div>
  )
}

export default function OwnerDashboard() {
  const { organizationId, organization, currency, isLoading: orgLoading } = useSecuredSalonContext()
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Fetch data using universal entity hooks
  const {
    customers,
    allCustomers,
    isLoading: customersLoading,
    refetch: refetchCustomers
  } = useHeraCustomers({
    organizationId,
    includeArchived: false
  })

  const {
    services,
    isLoading: servicesLoading,
    refetch: refetchServices
  } = useHeraServices({
    organizationId,
    filters: {}
  })

  const {
    products,
    isLoading: productsLoading,
    refetch: refetchProducts
  } = useHeraProducts({
    organizationId,
    includeArchived: false,
    searchQuery: '',
    categoryFilter: ''
  })

  const {
    staff,
    isLoading: staffLoading,
    refetch: refetchStaff
  } = useHeraStaff({
    organizationId,
    includeArchived: false
  })

  const {
    tickets,
    isLoading: ticketsLoading,
    refetch: refetchTickets
  } = usePosTicket({
    organizationId,
    filters: {}
  })

  // Calculate KPIs
  const kpis = useMemo(() => {
    // VIP Customers count
    const vipCustomers = allCustomers?.filter(c => c.vip)?.length || 0

    // Total revenue from tickets
    const totalRevenue =
      tickets?.reduce((sum, ticket) => {
        return sum + (ticket.total_amount || 0)
      }, 0) || 0

    // Active services count
    const activeServices = services?.filter(s => s.status === 'active')?.length || 0

    // Low stock products
    const lowStockProducts =
      products?.filter(p => {
        const stockQty = p.stock_quantity || p.stock_level || p.qty_on_hand || 0
        const reorderLevel = p.reorder_level || 0
        return stockQty > 0 && stockQty <= reorderLevel
      })?.length || 0

    // Total inventory value
    const inventoryValue =
      products?.reduce((sum, product) => {
        const costPrice = product.price_cost || product.cost_price || product.price || 0
        const stockQty = product.stock_quantity || product.stock_level || product.qty_on_hand || 0
        const productValue = costPrice && stockQty ? costPrice * stockQty : 0
        return sum + productValue
      }, 0) || 0

    // Active staff count
    const activeStaff = staff?.filter(s => s.status === 'active')?.length || 0

    return {
      totalCustomers: customers?.length || 0,
      vipCustomers,
      totalRevenue,
      activeServices,
      totalProducts: products?.length || 0,
      lowStockProducts,
      inventoryValue,
      activeStaff
    }
  }, [customers, allCustomers, services, products, staff, tickets])

  const isLoading =
    orgLoading ||
    customersLoading ||
    servicesLoading ||
    productsLoading ||
    staffLoading ||
    ticketsLoading

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency || 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Refresh all data
  const handleRefresh = async () => {
    await Promise.all([
      refetchCustomers(),
      refetchServices(),
      refetchProducts(),
      refetchStaff(),
      refetchTickets()
    ])
    setLastRefresh(new Date())
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.black }}>
      {/* Premium Header with Gradient */}
      <div
        className="sticky top-0 z-30"
        style={{
          background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.charcoal} 100%)`,
          borderBottom: `1px solid ${COLORS.gold}20`,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Title Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}10 100%)`,
                    border: `1px solid ${COLORS.gold}40`,
                    boxShadow: `0 4px 12px ${COLORS.gold}20`
                  }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: COLORS.gold }} />
                </div>
                <h1
                  className="text-3xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Owner Dashboard
                </h1>
              </div>
              <p className="text-sm" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                {organization?.name || 'Hair Talkz Salon'} •{' '}
                {new Date().toLocaleDateString('en-AE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                border: `1px solid ${COLORS.gold}30`,
                color: COLORS.champagne
              }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                Last updated:{' '}
                {lastRefresh.toLocaleTimeString('en-AE', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Primary KPIs - 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Revenue */}
          <StatCard
            title="Total Revenue"
            value={formatCurrency(kpis.totalRevenue)}
            change={12.5}
            changeLabel="vs last month"
            icon={DollarSign}
            iconColor={COLORS.gold}
            iconBgColor={COLORS.gold}
            gradient={`linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.gold}15 100%)`}
          />

          {/* Total Customers */}
          <StatCard
            title="Total Customers"
            value={kpis.totalCustomers}
            change={8.2}
            changeLabel={`${kpis.vipCustomers} VIP members`}
            icon={Users}
            iconColor={COLORS.emerald}
            iconBgColor={COLORS.emerald}
            gradient={`linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.emerald}15 100%)`}
          />

          {/* Active Staff */}
          <StatCard
            title="Active Staff"
            value={kpis.activeStaff}
            icon={UserCheck}
            iconColor={COLORS.bronze}
            iconBgColor={COLORS.bronze}
          />
        </div>

        {/* Secondary KPIs - 4 Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Services */}
          <StatCard
            title="Active Services"
            value={kpis.activeServices}
            icon={Scissors}
            iconColor={COLORS.gold}
            iconBgColor={COLORS.gold}
          />

          {/* Total Products */}
          <StatCard
            title="Total Products"
            value={kpis.totalProducts}
            icon={ShoppingBag}
            iconColor={COLORS.emerald}
            iconBgColor={COLORS.emerald}
          />

          {/* Inventory Value */}
          <StatCard
            title="Inventory Value"
            value={formatCurrency(kpis.inventoryValue)}
            icon={Package}
            iconColor={COLORS.bronze}
            iconBgColor={COLORS.bronze}
          />

          {/* Low Stock Alert */}
          <StatCard
            title="Low Stock Items"
            value={kpis.lowStockProducts}
            icon={Package}
            iconColor={kpis.lowStockProducts > 0 ? '#FF6B6B' : COLORS.emerald}
            iconBgColor={kpis.lowStockProducts > 0 ? '#FF6B6B' : COLORS.emerald}
            gradient={
              kpis.lowStockProducts > 0
                ? `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, #FF6B6B15 100%)`
                : undefined
            }
          />
        </div>

        {/* Quick Actions Section */}
        <div
          className="p-8 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.charcoal} 100%)`,
            border: `1px solid ${COLORS.gold}20`,
            backdropFilter: 'blur(10px)'
          }}
        >
          <h2
            className="text-xl font-semibold mb-6 flex items-center gap-3"
            style={{ color: COLORS.champagne }}
          >
            <div
              className="w-1 h-8 rounded-full"
              style={{
                background: `linear-gradient(180deg, ${COLORS.gold} 0%, ${COLORS.bronze} 100%)`
              }}
            />
            Quick Insights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* VIP Customers Insight */}
            <div
              className="p-6 rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}10 0%, transparent 100%)`,
                border: `1px solid ${COLORS.gold}30`
              }}
            >
              <Star className="w-8 h-8 mb-3" style={{ color: COLORS.gold }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.champagne }}>
                VIP Customers
              </h3>
              <p className="text-3xl font-bold mb-2" style={{ color: COLORS.gold }}>
                {kpis.vipCustomers}
              </p>
              <p className="text-sm" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                {((kpis.vipCustomers / Math.max(kpis.totalCustomers, 1)) * 100).toFixed(1)}% of
                total customers
              </p>
            </div>

            {/* Services Performance */}
            <div
              className="p-6 rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${COLORS.emerald}10 0%, transparent 100%)`,
                border: `1px solid ${COLORS.emerald}30`
              }}
            >
              <Scissors className="w-8 h-8 mb-3" style={{ color: COLORS.emerald }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.champagne }}>
                Service Catalog
              </h3>
              <p className="text-3xl font-bold mb-2" style={{ color: COLORS.emerald }}>
                {kpis.activeServices}
              </p>
              <p className="text-sm" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                Active services available
              </p>
            </div>

            {/* Stock Health */}
            <div
              className="p-6 rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background:
                  kpis.lowStockProducts > 0
                    ? `linear-gradient(135deg, #FF6B6B10 0%, transparent 100%)`
                    : `linear-gradient(135deg, ${COLORS.emerald}10 0%, transparent 100%)`,
                border: `1px solid ${kpis.lowStockProducts > 0 ? '#FF6B6B30' : `${COLORS.emerald}30`}`
              }}
            >
              <Package
                className="w-8 h-8 mb-3"
                style={{ color: kpis.lowStockProducts > 0 ? '#FF6B6B' : COLORS.emerald }}
              />
              <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.champagne }}>
                Stock Health
              </h3>
              <p
                className="text-3xl font-bold mb-2"
                style={{ color: kpis.lowStockProducts > 0 ? '#FF6B6B' : COLORS.emerald }}
              >
                {kpis.lowStockProducts === 0 ? 'Healthy' : `${kpis.lowStockProducts} Alerts`}
              </p>
              <p className="text-sm" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                {kpis.lowStockProducts === 0 ? 'All products in stock' : 'Items need reordering'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  )
}
