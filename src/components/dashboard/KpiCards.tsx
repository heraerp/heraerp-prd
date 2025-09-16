'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Package, 
  MessageCircle,
  Calculator
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Skeleton } from '@/src/components/ui/skeleton'
import { cn } from '@/src/lib/utils'
import { salonClasses, salonTheme } from '@/src/lib/theme/salon-theme'
import { useUniversalReports } from '@/src/lib/hooks/useUniversalReports'
import { useAppointmentStats } from '@/src/lib/api/appointments'
import { useWhatsappMetrics } from '@/src/lib/api/whatsapp'
import { useInventoryApi } from '@/src/lib/api/inventory'
import { useOrgSettings } from '@/src/lib/api/orgSettings'

interface KpiCardsProps {
  organizationId: string
}

export function KpiCards({ organizationId }: KpiCardsProps) {
  const today = new Date().toISOString().split('T')[0]
  
  // Fetch sales data
  const { data: salesData, isLoading: salesLoading } = useUniversalReports({
    organizationId,
    reportType: 'daily_sales',
    dateRange: { start: today, end: today }
  })

  // Fetch appointment stats
  const { data: appointmentStats, isLoading: appointmentsLoading } = useAppointmentStats({
    organizationId,
    date: today
  })

  // Fetch WhatsApp metrics
  const { data: waMetrics, isLoading: waLoading } = useWhatsappMetrics({
    organizationId,
    period: '24h'
  })

  // Fetch low stock count
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryApi().listLowStock({
    organizationId
  })

  // Fetch VAT settings
  const { data: settings } = useOrgSettings(organizationId)
  const vatRate = settings?.sales_policy?.vat_rate || 0.05

  // Calculate KPIs
  const grossSales = salesData?.summary?.total_gross || 0
  const netRevenue = grossSales * (1 - vatRate)
  const transactionCount = salesData?.summary?.transaction_count || 0
  const avgTicket = transactionCount > 0 ? grossSales / transactionCount : 0
  
  const totalAppointments = appointmentStats?.total || 0
  const confirmedAppointments = appointmentStats?.confirmed || 0
  const inProgressAppointments = appointmentStats?.in_progress || 0
  
  const waSent = waMetrics?.sent || 0
  const waDelivered = waMetrics?.delivered || 0
  const deliveryRate = waSent > 0 ? (waDelivered / waSent * 100) : 0
  
  const lowStockCount = inventoryData?.items?.length || 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED'
    }).format(amount)
  }

  const kpis = [
    {
      title: "Today's Gross Sales",
      value: formatCurrency(grossSales),
      icon: DollarSign,
      color: 'from-purple-500 to-pink-500',
      loading: salesLoading,
      href: '/reports/sales/daily'
    },
    {
      title: "Today's Net Revenue",
      value: formatCurrency(netRevenue),
      icon: TrendingUp,
      color: 'from-pink-500 to-rose-500',
      loading: salesLoading,
      href: '/reports/finance/pnl'
    },
    {
      title: 'Appointments Today',
      value: totalAppointments,
      subtitle: `${confirmedAppointments} confirmed, ${inProgressAppointments} in progress`,
      icon: Calendar,
      color: 'from-purple-600 to-purple-500',
      loading: appointmentsLoading,
      href: '/appointments/calendar'
    },
    {
      title: 'Avg Ticket',
      value: formatCurrency(avgTicket),
      icon: Calculator,
      color: 'from-amber-500 to-orange-500',
      loading: salesLoading,
      href: '/reports/analytics'
    },
    {
      title: 'WA Delivery Rate',
      value: `${deliveryRate.toFixed(1)}%`,
      subtitle: `${waDelivered} of ${waSent} delivered`,
      icon: MessageCircle,
      color: 'from-emerald-500 to-emerald-600',
      loading: waLoading,
      href: '/whatsapp/analytics'
    },
    {
      title: 'Low Stock Items',
      value: lowStockCount,
      icon: Package,
      color: lowStockCount > 5 ? 'from-red-500 to-red-600' : 'from-amber-500 to-amber-600',
      loading: inventoryLoading,
      href: '/inventory/alerts'
    }
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        
        return (
          <Link
            key={index}
            href={kpi.href}
            className="group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-xl"
          >
            <Card className={cn(
              "relative overflow-hidden transition-all duration-300",
              "hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]",
              "group-focus:shadow-2xl group-focus:-translate-y-1 group-focus:scale-[1.02]",
              salonClasses.card,
              salonClasses.hoverGlow
            )}>
              <div className={cn(
                "absolute inset-0 opacity-20 bg-gradient-to-br",
                kpi.color
              )} />
              <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent dark:from-gray-900/50" />
              
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {kpi.title}
                </CardTitle>
                <div className={cn(
                  "p-2 rounded-lg bg-gradient-to-br",
                  kpi.color,
                  "bg-opacity-20"
                )}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              
              <CardContent>
                {kpi.loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-20" />
                    {kpi.subtitle && <Skeleton className="h-3 w-32" />}
                  </div>
                ) : (
                  <div className="relative z-10">
                    <div className={cn(
                      "text-2xl font-bold bg-gradient-to-br bg-clip-text text-transparent",
                      kpi.color
                    )}>
                      {kpi.value}
                    </div>
                    {kpi.subtitle && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {kpi.subtitle}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}