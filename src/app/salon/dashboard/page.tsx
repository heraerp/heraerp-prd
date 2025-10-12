'use client'

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useSalonSecurity } from '@/hooks/useSalonSecurity'
import { useSalonDashboard } from '@/hooks/useSalonDashboard'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Users,
  Scissors,
  Package,
  DollarSign,
  UserCheck,
  RefreshCw,
  Star,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { LUXE_COLORS } from '@/lib/constants/salon'

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

export default function SalonDashboard() {
  const { organizationId, organization, isLoading: orgLoading } = useSecuredSalonContext()
  const {
    role,
    user,
    isLoading: securityLoading,
    isAuthenticated
  } = useSalonSecurity()
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Use the new universal dashboard hook
  const {
    kpis,
    isLoading: dashboardLoading,
    refreshAll,
    formatCurrency
  } = useSalonDashboard({
    organizationId: organizationId || '',
    currency: 'AED'
  })

  const isLoading = orgLoading || securityLoading || dashboardLoading

  // Refresh all data
  const handleRefresh = async () => {
    await refreshAll()
    setLastRefresh(new Date())
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
      </div>
    )
  }

  // Auth check
  if (!isAuthenticated || !role) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <Card
          className="max-w-md w-full border-0"
          style={{ backgroundColor: LUXE_COLORS.charcoalLight }}
        >
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: LUXE_COLORS.gold }} />
            <h3 className="text-xl mb-2" style={{ color: LUXE_COLORS.gold }}>
              Authentication Required
            </h3>
            <p className="mb-6" style={{ color: LUXE_COLORS.bronze }}>
              {!isAuthenticated
                ? 'Please log in to access the dashboard.'
                : 'No role assigned. Please contact your administrator.'}
            </p>
            <Button
              onClick={() => router.push('/salon/auth')}
              className="w-full"
              style={{
                backgroundColor: LUXE_COLORS.gold,
                color: LUXE_COLORS.charcoal
              }}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.black }}>
      {/* Elegant gradient background overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 10% 20%, ${LUXE_COLORS.gold}06 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, ${LUXE_COLORS.plum}04 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, ${LUXE_COLORS.emerald}03 0%, transparent 50%)
          `,
          opacity: 0.4
        }}
      />

      {/* Premium Header from Unified Dashboard */}
      <div
        className="sticky top-0 z-30 mb-8"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`,
          border: `1px solid ${LUXE_COLORS.gold}20`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px ${LUXE_COLORS.gold}10`,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Organization Icon */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold}25 0%, ${LUXE_COLORS.gold}15 100%)`,
                  border: `1px solid ${LUXE_COLORS.gold}40`,
                  boxShadow: `0 0 20px ${LUXE_COLORS.gold}20`
                }}
              >
                <Scissors className="w-8 h-8" style={{ color: LUXE_COLORS.gold }} />
              </div>

              {/* Title and subtitle */}
              <div>
                <h1
                  className="text-4xl font-bold tracking-tight mb-1"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {organization?.name || 'Salon Dashboard'}
                </h1>
                <p
                  className="text-sm flex items-center gap-2"
                  style={{ color: LUXE_COLORS.bronze }}
                >
                  <span className="font-medium">
                    {role ? role.charAt(0).toUpperCase() + role.slice(1) : ''} Dashboard
                  </span>
                  <span>•</span>
                  <span>
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </p>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center gap-4">
              {/* User Info Card */}
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark}CC 0%, ${LUXE_COLORS.charcoal}CC 100%)`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div
                  className="p-2 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.gold}20 0%, ${LUXE_COLORS.gold}10 100%)`,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <Users className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: LUXE_COLORS.champagne }}>
                    {user?.user_metadata?.full_name ||
                      user?.email?.split('@')[0] ||
                      localStorage.getItem('salonUserName') ||
                      'Demo User'}
                  </div>
                  <div className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                    {user?.email || localStorage.getItem('salonUserEmail') || 'demo@hairtalkz.com'}
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                  border: `1px solid ${COLORS.gold}30`,
                  color: COLORS.champagne
                }}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Logout Button */}
              <Button
                onClick={async () => {
                  try {
                    const { supabase } = await import('@/lib/supabase/client')
                    await supabase.auth.signOut()
                    localStorage.removeItem('salonUserName')
                    localStorage.removeItem('salonUserEmail')
                    localStorage.removeItem('salonRole')
                    router.push('/salon/auth')
                  } catch (error) {
                    console.error('Logout error:', error)
                    router.push('/salon/auth')
                  }
                }}
                variant="outline"
                className="px-4 py-2.5 font-medium transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.ruby}20 0%, ${LUXE_COLORS.ruby}10 100%)`,
                  border: `1px solid ${LUXE_COLORS.ruby}40`,
                  color: LUXE_COLORS.ruby,
                  boxShadow: `0 0 0 1px ${LUXE_COLORS.ruby}20`
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content from Owner Dashboard */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Quick Insights Section */}
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
