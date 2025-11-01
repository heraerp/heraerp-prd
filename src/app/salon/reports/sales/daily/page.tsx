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
import { BranchSelector } from '@/components/salon/reports/BranchSelector'
import { EnterpriseDatePicker } from '@/components/salon/reports/EnterpriseDatePicker'
import { SalesReportExportButtons } from '@/components/salon/reports/SalesReportExportButtons'

export default function DailySalesReportPage() {
  const { organizationId, organization } = useSecuredSalonContext()
  const { isAuthenticated, role } = useSalonSecurity()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null) // null = "All Branches"
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ✅ PRODUCTION: Use real GL-based sales data with branch filtering
  const {
    summary,
    hourlyData,
    dimensionalBreakdown,
    isLoading,
    error,
    refetch
  } = useDailySalesReport(selectedDate, selectedBranchId)

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
              onClick={() => router.push('/salon/auth')}
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
    <>
      {/* ✅ Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 1cm;
          }
        }
      `}</style>

      <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.black }}>
        {/* Premium Header */}
        <div
          className="sticky top-0 z-30 border-b print:relative print:border-b-2 print:border-black"
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
              <Link href="/salon/reports" className="print:hidden">
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105 print:hidden"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.emerald}20 0%, ${LUXE_COLORS.emerald}10 100%)`,
                  border: `1px solid ${LUXE_COLORS.emerald}30`,
                  color: LUXE_COLORS.champagne
                }}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* ✅ HERA Professional Export Buttons (Excel + PDF) */}
              {summary && hourlyData && (
                <div className="print:hidden">
                  <SalesReportExportButtons
                    reportType="daily"
                    reportTitle="Daily Sales Report"
                    reportPeriod={reportPeriod}
                    reportDate={selectedDate.toLocaleDateString('en-AE')}
                    branchName={selectedBranchId ? 'Selected Branch' : 'All Branches'}
                    currency="AED"
                    summary={summary}
                    hourlyData={hourlyData}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* ✅ ENTERPRISE: Filter Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:hidden">
          {/* Date Picker */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: LUXE_COLORS.bronze }}
            >
              Report Date
            </label>
            <EnterpriseDatePicker
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              maxDate={new Date()} // Prevent future dates
            />
          </div>

          {/* Branch Selector */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: LUXE_COLORS.bronze }}
            >
              Branch Filter
            </label>
            <BranchSelector
              organizationId={organizationId}
              selectedBranchId={selectedBranchId}
              onBranchChange={setSelectedBranchId}
            />
          </div>
        </div>

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
          <div className="overflow-auto max-w-full">
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

        {/* VAT Detailed Breakdown */}
        {dimensionalBreakdown && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoal} 100%)`,
              border: `1px solid ${LUXE_COLORS.plum}30`,
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4)`
            }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b" style={{ borderColor: `${LUXE_COLORS.plum}20` }}>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: LUXE_COLORS.champagne }}>
                <Receipt className="w-5 h-5" style={{ color: LUXE_COLORS.plum }} />
                VAT Compliance Report
                <Badge
                  style={{
                    backgroundColor: `${LUXE_COLORS.emerald}20`,
                    color: LUXE_COLORS.emerald,
                    border: `1px solid ${LUXE_COLORS.emerald}30`,
                    fontSize: '0.75rem'
                  }}
                >
                  GL v2.0
                </Badge>
              </h2>
              <p className="text-sm mt-1" style={{ color: LUXE_COLORS.bronze }}>
                Detailed VAT breakdown by revenue type (5% UAE VAT)
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* VAT Collection Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Service VAT */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.emerald}10 0%, ${LUXE_COLORS.emerald}05 100%)`,
                    border: `1px solid ${LUXE_COLORS.emerald}20`
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" style={{ color: LUXE_COLORS.emerald }} />
                    <span className="text-sm font-medium" style={{ color: LUXE_COLORS.bronze }}>
                      VAT on Services
                    </span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                    AED {dimensionalBreakdown.service_vat.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs mt-1" style={{ color: LUXE_COLORS.emerald, opacity: 0.7 }}>
                    Net: AED {dimensionalBreakdown.service_net.toLocaleString('en-AE', { minimumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Product VAT */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.plum}10 0%, ${LUXE_COLORS.plum}05 100%)`,
                    border: `1px solid ${LUXE_COLORS.plum}20`
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-4 h-4" style={{ color: LUXE_COLORS.plum }} />
                    <span className="text-sm font-medium" style={{ color: LUXE_COLORS.bronze }}>
                      VAT on Products
                    </span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                    AED {dimensionalBreakdown.product_vat.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs mt-1" style={{ color: LUXE_COLORS.plum, opacity: 0.7 }}>
                    Net: AED {dimensionalBreakdown.product_net.toLocaleString('en-AE', { minimumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Total VAT */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.gold}15 0%, ${LUXE_COLORS.gold}05 100%)`,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
                    <span className="text-sm font-medium" style={{ color: LUXE_COLORS.bronze }}>
                      Total VAT Collected
                    </span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: LUXE_COLORS.gold }}>
                    AED {(dimensionalBreakdown.service_vat + dimensionalBreakdown.product_vat).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs mt-1" style={{ color: LUXE_COLORS.gold, opacity: 0.7 }}>
                    Payable to FTA
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown Table */}
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${LUXE_COLORS.plum}10` }}>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: LUXE_COLORS.plum }}>
                        Revenue Type
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.plum }}>
                        Gross Amount
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.plum }}>
                        Discount
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.plum }}>
                        Net Amount
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.plum }}>
                        VAT @ 5%
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.plum }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Service Revenue */}
                    <tr style={{ borderBottom: `1px solid ${LUXE_COLORS.plum}05` }}>
                      <td className="px-4 py-3 font-medium" style={{ color: LUXE_COLORS.champagne }}>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" style={{ color: LUXE_COLORS.emerald }} />
                          Services
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: LUXE_COLORS.champagne }}>
                        AED {dimensionalBreakdown.service_gross.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: LUXE_COLORS.ruby, opacity: 0.7 }}>
                        -{dimensionalBreakdown.service_discount.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: LUXE_COLORS.emerald }}>
                        AED {dimensionalBreakdown.service_net.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: LUXE_COLORS.plum }}>
                        AED {dimensionalBreakdown.service_vat.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: LUXE_COLORS.champagne }}>
                        AED {(dimensionalBreakdown.service_net + dimensionalBreakdown.service_vat).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* Product Revenue */}
                    <tr style={{ borderBottom: `1px solid ${LUXE_COLORS.plum}05` }}>
                      <td className="px-4 py-3 font-medium" style={{ color: LUXE_COLORS.champagne }}>
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4" style={{ color: LUXE_COLORS.plum }} />
                          Products
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: LUXE_COLORS.champagne }}>
                        AED {dimensionalBreakdown.product_gross.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: LUXE_COLORS.ruby, opacity: 0.7 }}>
                        -{dimensionalBreakdown.product_discount.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: LUXE_COLORS.plum }}>
                        AED {dimensionalBreakdown.product_net.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: LUXE_COLORS.plum }}>
                        AED {dimensionalBreakdown.product_vat.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: LUXE_COLORS.champagne }}>
                        AED {(dimensionalBreakdown.product_net + dimensionalBreakdown.product_vat).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* Totals */}
                    <tr
                      style={{
                        borderTop: `2px solid ${LUXE_COLORS.plum}30`,
                        background: `linear-gradient(135deg, ${LUXE_COLORS.gold}10 0%, ${LUXE_COLORS.gold}05 100%)`
                      }}
                    >
                      <td className="px-4 py-4 font-bold" style={{ color: LUXE_COLORS.gold }}>
                        TOTAL
                      </td>
                      <td className="px-4 py-4 text-right font-bold" style={{ color: LUXE_COLORS.champagne }}>
                        AED {(dimensionalBreakdown.service_gross + dimensionalBreakdown.product_gross).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right font-bold" style={{ color: LUXE_COLORS.ruby }}>
                        -{(dimensionalBreakdown.service_discount + dimensionalBreakdown.product_discount).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right font-bold" style={{ color: LUXE_COLORS.emerald }}>
                        AED {(dimensionalBreakdown.service_net + dimensionalBreakdown.product_net).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right font-bold" style={{ color: LUXE_COLORS.plum }}>
                        AED {(dimensionalBreakdown.service_vat + dimensionalBreakdown.product_vat).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-lg" style={{ color: LUXE_COLORS.gold }}>
                        AED {summary?.total_gross.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Compliance Note */}
              <div
                className="flex items-start gap-3 p-4 rounded-lg"
                style={{
                  background: `${LUXE_COLORS.plum}10`,
                  border: `1px solid ${LUXE_COLORS.plum}20`
                }}
              >
                <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: LUXE_COLORS.plum }} />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: LUXE_COLORS.champagne }}>
                    UAE VAT Compliance Note
                  </p>
                  <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                    This report shows VAT collected at the standard 5% rate on taxable supplies. Ensure all amounts are reported to the Federal Tax Authority (FTA) in your periodic VAT return.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GL v1.0 Notice (when dimensional breakdown is not available) */}
        {!dimensionalBreakdown && summary && summary.total_gross > 0 && (
          <div
            className="rounded-2xl p-6"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.orange}10 0%, ${LUXE_COLORS.orange}05 100%)`,
              border: `1px solid ${LUXE_COLORS.orange}30`
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: LUXE_COLORS.orange }} />
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: LUXE_COLORS.champagne }}>
                  Enhanced VAT Reporting Available
                </p>
                <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  Your transactions are using GL v1.0. To see detailed VAT breakdown by service and product, transactions must be posted using GL v2.0 engine with enhanced metadata.
                </p>
              </div>
            </div>
          </div>
        )}

          {/* Bottom Spacing */}
          <div className="h-8" />
        </div>
      </div>
    </>
  )
}
