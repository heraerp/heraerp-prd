// ================================================================================
// SALON DAILY SALES REPORT PAGE - ENTERPRISE LUXE THEME
// Smart Code: HERA.SALON.REPORTS.DAILY_SALES.v1
// GL-based daily sales analysis with premium salon styling
// ================================================================================

'use client'

import React, { useState } from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useSalonSecurity } from '@/hooks/useSalonSecurity'
import { useRouter } from 'next/navigation'
import { useDailySalesReport } from '@/hooks/useSalonSalesReports'
import {
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Receipt,
  Sparkles,
  ChevronLeft,
  Download,
  Printer,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { LUXE_COLORS } from '@/lib/constants/salon'

export default function DailySalesReportPage() {
  const { organizationId, organization } = useSecuredSalonContext()
  const { isAuthenticated, role } = useSalonSecurity()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ✅ PRODUCTION: Use real GL-based sales data
  const {
    summary,
    hourlyData,
    isLoading,
    error,
    refetch
  } = useDailySalesReport(selectedDate)

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setTimeout(() => setIsRefreshing(false), 800)
    }
  }

  // Auth check
  if (!isAuthenticated || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: LUXE_COLORS.black }}>
        <Alert className="max-w-md" style={{ backgroundColor: LUXE_COLORS.charcoalLight, border: `1px solid ${LUXE_COLORS.ruby}40` }}>
          <AlertCircle className="h-4 w-4" style={{ color: LUXE_COLORS.ruby }} />
          <AlertDescription style={{ color: LUXE_COLORS.champagne }}>
            {!isAuthenticated ? 'Please log in to access reports.' : 'No role assigned.'}
            <button
              onClick={() => router.push('/salon-access')}
              className="ml-2 underline hover:no-underline"
              style={{ color: LUXE_COLORS.gold }}
            >
              Go to Login
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: LUXE_COLORS.black }}>
        <Alert className="max-w-md" style={{ backgroundColor: LUXE_COLORS.charcoalLight, border: `1px solid ${LUXE_COLORS.ruby}40` }}>
          <AlertCircle className="h-4 w-4" style={{ color: LUXE_COLORS.ruby }} />
          <AlertDescription style={{ color: LUXE_COLORS.champagne }}>
            Failed to load report: {String(error)}
            <button onClick={handleRefresh} className="ml-2 underline hover:no-underline" style={{ color: LUXE_COLORS.gold }}>
              Retry
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const reportPeriod = selectedDate.toLocaleDateString('en-AE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.black }}>
      {/* Premium Header */}
      <div
        className="sticky top-0 z-30 border-b"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}F0 0%, ${LUXE_COLORS.charcoal}F0 100%)`,
          border: `1px solid ${LUXE_COLORS.gold}20`,
          backdropFilter: 'blur(20px)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Back button + Title */}
            <div className="flex items-center gap-4">
              <Link href="/salon/reports">
                <button
                  className="p-2 rounded-lg transition-all hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.gold}20 0%, ${LUXE_COLORS.gold}10 100%)`,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <ChevronLeft className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
                </button>
              </Link>

              <div>
                <h1
                  className="text-3xl font-bold flex items-center gap-3"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  <Calendar className="w-8 h-8" style={{ color: LUXE_COLORS.gold }} />
                  Daily Sales Report
                  <Sparkles className="w-6 h-6 animate-pulse" style={{ color: LUXE_COLORS.gold }} />
                </h1>
                <p className="text-sm mt-1" style={{ color: LUXE_COLORS.bronze }}>
                  {reportPeriod} • {organization?.entity_name || 'Salon'}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.emerald}20 0%, ${LUXE_COLORS.emerald}10 100%)`,
                  border: `1px solid ${LUXE_COLORS.emerald}30`,
                  color: LUXE_COLORS.champagne
                }}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.bronze}20 0%, ${LUXE_COLORS.bronze}10 100%)`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.champagne
                }}
              >
                <Printer className="w-4 h-4" />
                Print
              </button>

              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold}50 0%, ${LUXE_COLORS.gold}30 100%)`,
                  border: `1px solid ${LUXE_COLORS.gold}60`,
                  color: LUXE_COLORS.black
                }}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div
            className="rounded-2xl p-6 transition-all hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.emerald}15 0%, ${LUXE_COLORS.emerald}05 100%)`,
              border: `1px solid ${LUXE_COLORS.emerald}30`,
              boxShadow: `0 8px 32px ${LUXE_COLORS.emerald}10`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8" style={{ color: LUXE_COLORS.emerald }} />
              <ArrowUpCircle className="w-5 h-5" style={{ color: LUXE_COLORS.emerald, opacity: 0.5 }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: LUXE_COLORS.champagne }}>
              AED {summary?.total_gross.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              Total Gross Revenue
            </div>
            <div className="mt-2 text-xs" style={{ color: LUXE_COLORS.emerald }}>
              Net: AED {summary?.total_net.toLocaleString('en-AE', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>

          {/* Transactions */}
          <div
            className="rounded-2xl p-6 transition-all hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.gold}15 0%, ${LUXE_COLORS.gold}05 100%)`,
              border: `1px solid ${LUXE_COLORS.gold}30`,
              boxShadow: `0 8px 32px ${LUXE_COLORS.gold}10`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <Receipt className="w-8 h-8" style={{ color: LUXE_COLORS.gold }} />
              <TrendingUp className="w-5 h-5" style={{ color: LUXE_COLORS.gold, opacity: 0.5 }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: LUXE_COLORS.champagne }}>
              {summary?.transaction_count || 0}
            </div>
            <div className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              Total Transactions
            </div>
            <div className="mt-2 text-xs" style={{ color: LUXE_COLORS.gold }}>
              Avg: AED {summary?.average_ticket.toLocaleString('en-AE', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>

          {/* VAT Collected */}
          <div
            className="rounded-2xl p-6 transition-all hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.plum}15 0%, ${LUXE_COLORS.plum}05 100%)`,
              border: `1px solid ${LUXE_COLORS.plum}30`,
              boxShadow: `0 8px 32px ${LUXE_COLORS.plum}10`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag className="w-8 h-8" style={{ color: LUXE_COLORS.plum }} />
              <Receipt className="w-5 h-5" style={{ color: LUXE_COLORS.plum, opacity: 0.5 }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: LUXE_COLORS.champagne }}>
              AED {summary?.total_vat.toLocaleString('en-AE', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              VAT Collected (5%)
            </div>
            <div className="mt-2 text-xs" style={{ color: LUXE_COLORS.plum }}>
              Service: {summary?.service_mix_percent.toFixed(1) || 0}%
            </div>
          </div>

          {/* Tips */}
          <div
            className="rounded-2xl p-6 transition-all hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.bronze}15 0%, ${LUXE_COLORS.bronze}05 100%)`,
              border: `1px solid ${LUXE_COLORS.bronze}30`,
              boxShadow: `0 8px 32px ${LUXE_COLORS.bronze}10`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <Sparkles className="w-8 h-8" style={{ color: LUXE_COLORS.bronze }} />
              <ArrowUpCircle className="w-5 h-5" style={{ color: LUXE_COLORS.bronze, opacity: 0.5 }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: LUXE_COLORS.champagne }}>
              AED {summary?.total_tips.toLocaleString('en-AE', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              Tips Collected
            </div>
            <div className="mt-2 text-xs" style={{ color: LUXE_COLORS.bronze }}>
              Staff gratuity
            </div>
          </div>
        </div>

        {/* Hourly Breakdown Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoal} 100%)`,
            border: `1px solid ${LUXE_COLORS.gold}20`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4)`
          }}
        >
          {/* Table Header */}
          <div className="px-6 py-4 border-b" style={{ borderColor: `${LUXE_COLORS.gold}20` }}>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: LUXE_COLORS.champagne }}>
              <Calendar className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
              Hourly Sales Breakdown
            </h2>
            <p className="text-sm mt-1" style={{ color: LUXE_COLORS.bronze }}>
              Detailed revenue analysis by hour
            </p>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-8 h-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
                <span className="ml-3 text-lg" style={{ color: LUXE_COLORS.champagne }}>
                  Loading sales data...
                </span>
              </div>
            ) : hourlyData && hourlyData.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${LUXE_COLORS.gold}10` }}>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: LUXE_COLORS.gold }}>
                      Hour
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.gold }}>
                      Service Revenue
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.gold }}>
                      Product Revenue
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.gold }}>
                      Tips
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.gold }}>
                      VAT
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.gold }}>
                      Gross Total
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: LUXE_COLORS.gold }}>
                      Transactions
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.gold }}>
                      Avg Ticket
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hourlyData.map((row, index) => (
                    <tr
                      key={row.hour || index}
                      className="transition-all hover:scale-[1.005]"
                      style={{
                        borderBottom: `1px solid ${LUXE_COLORS.gold}05`,
                        background: index % 2 === 0 ? `${LUXE_COLORS.charcoalLight}40` : 'transparent'
                      }}
                    >
                      <td className="px-6 py-4 font-medium" style={{ color: LUXE_COLORS.champagne }}>
                        {row.hour}
                      </td>
                      <td className="px-6 py-4 text-right" style={{ color: LUXE_COLORS.emerald }}>
                        AED {row.service_net.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right" style={{ color: LUXE_COLORS.plum }}>
                        AED {row.product_net.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right" style={{ color: LUXE_COLORS.bronze }}>
                        AED {row.tips.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right" style={{ color: LUXE_COLORS.champagne, opacity: 0.7 }}>
                        AED {row.vat.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-bold" style={{ color: LUXE_COLORS.gold }}>
                        AED {row.gross.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          style={{
                            backgroundColor: `${LUXE_COLORS.gold}20`,
                            color: LUXE_COLORS.gold,
                            border: `1px solid ${LUXE_COLORS.gold}30`
                          }}
                        >
                          {row.txn_count}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right" style={{ color: LUXE_COLORS.champagne }}>
                        AED {row.avg_ticket.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  <tr
                    style={{
                      borderTop: `2px solid ${LUXE_COLORS.gold}30`,
                      background: `linear-gradient(135deg, ${LUXE_COLORS.gold}10 0%, ${LUXE_COLORS.gold}05 100%)`
                    }}
                  >
                    <td className="px-6 py-4 font-bold" style={{ color: LUXE_COLORS.gold }}>
                      TOTAL
                    </td>
                    <td className="px-6 py-4 text-right font-bold" style={{ color: LUXE_COLORS.emerald }}>
                      AED {summary?.total_service.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold" style={{ color: LUXE_COLORS.plum }}>
                      AED {summary?.total_product.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold" style={{ color: LUXE_COLORS.bronze }}>
                      AED {summary?.total_tips.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold" style={{ color: LUXE_COLORS.champagne }}>
                      AED {summary?.total_vat.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-xl" style={{ color: LUXE_COLORS.gold }}>
                      AED {summary?.total_gross.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        style={{
                          backgroundColor: `${LUXE_COLORS.gold}30`,
                          color: LUXE_COLORS.gold,
                          border: `1px solid ${LUXE_COLORS.gold}50`,
                          fontSize: '0.875rem'
                        }}
                      >
                        {summary?.transaction_count}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-bold" style={{ color: LUXE_COLORS.gold }}>
                      AED {summary?.average_ticket.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Calendar className="w-16 h-16 mb-4" style={{ color: LUXE_COLORS.bronze, opacity: 0.3 }} />
                <p className="text-lg mb-2" style={{ color: LUXE_COLORS.champagne }}>
                  No sales data for {reportPeriod}
                </p>
                <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                  Sales will appear here once transactions are recorded
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="h-8" />
      </div>
    </div>
  )
}
