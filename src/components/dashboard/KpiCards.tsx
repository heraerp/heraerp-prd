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
      color: 'from-violet-500 to-violet-600',
      loading: salesLoading,
      href: '/reports/sales/daily'
    },
    {
      title: "Today's Net Revenue",
      value: formatCurrency(netRevenue),
      icon: TrendingUp,
      color: 'from-pink-500 to-pink-600',
      loading: salesLoading,
      href: '/reports/finance/pnl'
    },
    {
      title: 'Appointments Today',
      value: totalAppointments,
      subtitle: `${confirmedAppointments} confirmed, ${inProgressAppointments} in progress`,
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      loading: appointmentsLoading,
      href: '/appointments/calendar'
    },
    {
      title: 'Avg Ticket',
      value: formatCurrency(avgTicket),
      icon: Calculator,
      color: 'from-indigo-500 to-indigo-600',
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
            className="group focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded-xl"
          >
            <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 group-focus:shadow-lg group-focus:-translate-y-1">
              <div className={cn(
                "absolute inset-0 opacity-10 bg-gradient-to-br",
                kpi.color
              )} />
              
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <Icon className={cn(
                  "h-4 w-4 bg-gradient-to-br bg-clip-text",
                  kpi.color
                )} />
              </CardHeader>
              
              <CardContent>
                {kpi.loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-20" />
                    {kpi.subtitle && <Skeleton className="h-3 w-32" />}
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "text-2xl font-bold bg-gradient-to-br bg-clip-text text-transparent",
                      kpi.color
                    )}>
                      {kpi.value}
                    </div>
                    {kpi.subtitle && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {kpi.subtitle}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}