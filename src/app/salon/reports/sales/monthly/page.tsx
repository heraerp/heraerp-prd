// ================================================================================
// SALON MONTHLY SALES REPORT PAGE - LUXE ENTERPRISE EDITION
// Smart Code: HERA.SALON.REPORTS.MONTHLY_SALES.v1
// GL-based monthly sales analysis with premium salon theme
// ================================================================================

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Sparkles,
  RefreshCw,
  Printer,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useSalonSecurity } from '@/hooks/useSalonSecurity'
import { useMonthlySalesReport } from '@/hooks/useSalonSalesReports'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BranchSelector } from '@/components/salon/reports/BranchSelector'
import { EnterpriseMonthYearPicker } from '@/components/salon/reports/EnterpriseMonthYearPicker'
import { SalesReportExportButtons } from '@/components/salon/reports/SalesReportExportButtons'

export default function MonthlySalesReportPage() {
  const { organizationId } = useSecuredSalonContext()
  const { isAuthenticated, role } = useSalonSecurity()
  const router = useRouter()

  // Initialize with current month
  const getCurrentMonth = () => {
    const now = new Date()
    return { month: now.getMonth() + 1, year: now.getFullYear() }
  }

  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentMonth())
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null) // null = "All Branches"

  const {
    summary,
    dailyData,
    dimensionalBreakdown,
    isLoading,
    error,
    refetch
  } = useMonthlySalesReport(selectedPeriod.month, selectedPeriod.year, selectedBranchId)

  // Auth check (matching dashboard pattern)
  if (!isAuthenticated || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: LUXE_COLORS.black }}>
        <Alert className="border-red-200 bg-red-50 max-w-md">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {!isAuthenticated
              ? 'Please log in to access reports.'
              : 'No role assigned. Please contact your administrator.'}
            <button
              onClick={() => router.push('/salon/auth')}
              className="ml-2 underline hover:no-underline"
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
        <Alert className="border-red-200 bg-red-50 max-w-md">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load monthly sales report: {String(error)}
            <button onClick={() => refetch()} className="ml-2 underline hover:no-underline">
              Retry
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // No organization context
  if (!organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: LUXE_COLORS.black }}>
        <Alert className="max-w-md">
          <AlertDescription>Please select an organization to view reports.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  const reportPeriod = `${monthNames[selectedPeriod.month - 1]} ${selectedPeriod.year}`

  // Navigation handlers
  const handlePreviousMonth = () => {
    setSelectedPeriod(prev => {
      if (prev.month === 1) {
        return { month: 12, year: prev.year - 1 }
      }
      return { month: prev.month - 1, year: prev.year }
    })
  }

  const handleNextMonth = () => {
    setSelectedPeriod(prev => {
      if (prev.month === 12) {
        return { month: 1, year: prev.year + 1 }
      }
      return { month: prev.month + 1, year: prev.year }
    })
  }

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
        {/* Premium Header - Sticky */}
        <div
          className="sticky top-0 z-50 border-b print:relative print:border-b-2 print:border-black"
          style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}F0 0%, ${LUXE_COLORS.charcoal}F0 100%)`,
          border: `1px solid ${LUXE_COLORS.gold}20`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/salon/reports')}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: `${LUXE_COLORS.gold}15`,
                  color: LUXE_COLORS.gold
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.gold}40 0%, ${LUXE_COLORS.goldDark}40 100%)`
                  }}
                >
                  <BarChart3 className="w-6 h-6" style={{ color: LUXE_COLORS.gold }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                    Monthly Sales Report
                  </h1>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                    Daily trends and performance analysis
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 print:hidden"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoalLight}`,
                  color: LUXE_COLORS.champagne,
                  border: `1px solid ${LUXE_COLORS.gold}30`
                }}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* ✅ HERA Professional Export Buttons (Excel + PDF) */}
              {summary && dailyData && (
                <div className="print:hidden">
                  <SalesReportExportButtons
                    reportType="monthly"
                    reportTitle="Monthly Sales Report"
                    reportPeriod={reportPeriod}
                    branchName={selectedBranchId ? 'Selected Branch' : 'All Branches'}
                    currency="AED"
                    summary={summary}
                    dailyData={dailyData}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* ✅ ENTERPRISE: Filter Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:hidden">
          {/* Month/Year Picker */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: LUXE_COLORS.bronze }}
            >
              Reporting Period
            </label>
            <EnterpriseMonthYearPicker
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              minYear={2020}
              maxYear={new Date().getFullYear()}
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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div
                className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
                style={{ borderColor: `${LUXE_COLORS.gold} transparent ${LUXE_COLORS.gold} transparent` }}
              />
              <p style={{ color: LUXE_COLORS.bronze }}>Loading monthly sales data...</p>
            </div>
          </div>
        ) : summary ? (
          <>
            {/* Main Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Revenue */}
              <div
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.emerald}20 0%, ${LUXE_COLORS.emeraldDark}20 100%)`,
                  border: `1px solid ${LUXE_COLORS.emerald}40`,
                  boxShadow: `0 8px 32px ${LUXE_COLORS.emerald}20`
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <Sparkles className="w-full h-full" style={{ color: LUXE_COLORS.emerald }} />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-medium mb-2" style={{ color: LUXE_COLORS.emeraldLight }}>
                    Total Revenue
                  </p>
                  <p className="text-3xl font-bold mb-1" style={{ color: LUXE_COLORS.champagne }}>
                    AED {summary.total_gross?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                    Net: AED {summary.total_net?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
              </div>

              {/* Total Transactions */}
              <div
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold}20 0%, ${LUXE_COLORS.goldDark}20 100%)`,
                  border: `1px solid ${LUXE_COLORS.gold}40`,
                  boxShadow: `0 8px 32px ${LUXE_COLORS.gold}20`
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <BarChart3 className="w-full h-full" style={{ color: LUXE_COLORS.gold }} />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-medium mb-2" style={{ color: LUXE_COLORS.goldLight }}>
                    Total Transactions
                  </p>
                  <p className="text-3xl font-bold mb-1" style={{ color: LUXE_COLORS.champagne }}>
                    {summary.transaction_count || 0}
                  </p>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                    Avg Ticket: AED {summary.average_ticket?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
              </div>

              {/* VAT Collected */}
              <div
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.plum}20 0%, ${LUXE_COLORS.purple}20 100%)`,
                  border: `1px solid ${LUXE_COLORS.plum}40`,
                  boxShadow: `0 8px 32px ${LUXE_COLORS.plum}20`
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <TrendingUp className="w-full h-full" style={{ color: LUXE_COLORS.plum }} />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-medium mb-2" style={{ color: LUXE_COLORS.plum }}>
                    VAT Collected
                  </p>
                  <p className="text-3xl font-bold mb-1" style={{ color: LUXE_COLORS.champagne }}>
                    AED {summary.total_vat?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                    5% VAT on services
                  </p>
                </div>
              </div>

              {/* Tips Collected */}
              <div
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.bronze}20 0%, ${LUXE_COLORS.bronzeLight}20 100%)`,
                  border: `1px solid ${LUXE_COLORS.bronze}40`,
                  boxShadow: `0 8px 32px ${LUXE_COLORS.bronze}20`
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <Sparkles className="w-full h-full" style={{ color: LUXE_COLORS.bronze }} />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-medium mb-2" style={{ color: LUXE_COLORS.bronzeLight }}>
                    Tips Collected
                  </p>
                  <p className="text-3xl font-bold mb-1" style={{ color: LUXE_COLORS.champagne }}>
                    AED {summary.total_tips?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                    Staff gratuity
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Monthly Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Daily Revenue */}
              <div
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: LUXE_COLORS.charcoal,
                  border: `1px solid ${LUXE_COLORS.sapphire}40`,
                  boxShadow: `0 4px 16px ${LUXE_COLORS.sapphire}10`
                }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: LUXE_COLORS.sapphireLight }}>
                  Average Daily Revenue
                </p>
                <p className="text-2xl font-bold mb-1" style={{ color: LUXE_COLORS.champagne }}>
                  AED {summary.average_daily?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </p>
                <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  Based on {summary.working_days || 0} working days
                </p>
              </div>

              {/* Working Days */}
              <div
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: LUXE_COLORS.charcoal,
                  border: `1px solid ${LUXE_COLORS.emerald}40`,
                  boxShadow: `0 4px 16px ${LUXE_COLORS.emerald}10`
                }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: LUXE_COLORS.emeraldLight }}>
                  Working Days
                </p>
                <p className="text-2xl font-bold mb-1" style={{ color: LUXE_COLORS.champagne }}>
                  {summary.working_days || 0}
                </p>
                <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  This month
                </p>
              </div>

              {/* Revenue Growth */}
              <div
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: LUXE_COLORS.charcoal,
                  border: `1px solid ${summary.growth_vs_previous !== undefined && summary.growth_vs_previous > 0 ? LUXE_COLORS.emerald : summary.growth_vs_previous !== undefined ? LUXE_COLORS.ruby : LUXE_COLORS.gold}40`,
                  boxShadow: `0 4px 16px ${summary.growth_vs_previous !== undefined && summary.growth_vs_previous > 0 ? LUXE_COLORS.emerald : summary.growth_vs_previous !== undefined ? LUXE_COLORS.ruby : LUXE_COLORS.gold}10`
                }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: summary.growth_vs_previous !== undefined && summary.growth_vs_previous > 0 ? LUXE_COLORS.emeraldLight : summary.growth_vs_previous !== undefined ? LUXE_COLORS.ruby : LUXE_COLORS.bronze }}>
                  Revenue Growth
                </p>
                <div className="flex items-center gap-2">
                  {summary.growth_vs_previous !== undefined ? (
                    summary.growth_vs_previous > 0 ? (
                      <TrendingUp className="w-6 h-6" style={{ color: LUXE_COLORS.emerald }} />
                    ) : (
                      <TrendingDown className="w-6 h-6" style={{ color: LUXE_COLORS.ruby }} />
                    )
                  ) : (
                    <BarChart3 className="w-6 h-6" style={{ color: LUXE_COLORS.bronze }} />
                  )}
                  <p className="text-2xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                    {summary.growth_vs_previous !== undefined ? (
                      <>
                        {summary.growth_vs_previous > 0 ? '+' : ''}
                        {summary.growth_vs_previous.toFixed(1)}%
                      </>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  {summary.growth_vs_previous !== undefined
                    ? 'vs previous month'
                    : 'No previous month data'}
                </p>
              </div>
            </div>

            {/* Daily Breakdown Table */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: LUXE_COLORS.charcoal,
                border: `1px solid ${LUXE_COLORS.gold}20`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div className="p-6 border-b" style={{ borderColor: `${LUXE_COLORS.gold}20` }}>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: LUXE_COLORS.champagne }}>
                  <Calendar className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
                  Daily Breakdown
                </h2>
                <p className="text-sm mt-1" style={{ color: LUXE_COLORS.bronze }}>
                  Day-by-day revenue breakdown for {reportPeriod}
                </p>
              </div>

              <div className="overflow-auto max-w-full">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: `${LUXE_COLORS.gold}15` }}>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: LUXE_COLORS.gold }}>
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.emerald }}>
                        Service Revenue
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.plum }}>
                        Product Revenue
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.bronze }}>
                        Tips
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.sapphire }}>
                        VAT
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: LUXE_COLORS.gold }}>
                        Gross Total
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                        Transactions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData && dailyData.length > 0 ? (
                      <>
                        {dailyData.map((day, index) => (
                          <tr
                            key={day.date}
                            className="transition-colors duration-150"
                            style={{
                              backgroundColor: index % 2 === 0 ? LUXE_COLORS.charcoalLight : LUXE_COLORS.charcoal,
                              borderBottom: `1px solid ${LUXE_COLORS.gold}10`
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = `${LUXE_COLORS.gold}08`
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor =
                                index % 2 === 0 ? LUXE_COLORS.charcoalLight : LUXE_COLORS.charcoal
                            }}
                          >
                            <td className="px-6 py-4">
                              <p className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                                {new Date(day.date + 'T00:00:00').toLocaleDateString('en-AE', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-right font-mono" style={{ color: LUXE_COLORS.emeraldLight }}>
                              {day.service_net?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </td>
                            <td className="px-6 py-4 text-right font-mono" style={{ color: LUXE_COLORS.plum }}>
                              {day.product_net?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </td>
                            <td className="px-6 py-4 text-right font-mono" style={{ color: LUXE_COLORS.bronzeLight }}>
                              {day.tips?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </td>
                            <td className="px-6 py-4 text-right font-mono" style={{ color: LUXE_COLORS.sapphireLight }}>
                              {day.vat?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </td>
                            <td className="px-6 py-4 text-right font-bold font-mono" style={{ color: LUXE_COLORS.goldLight }}>
                              {day.gross?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className="px-3 py-1 rounded-full text-sm font-semibold"
                                style={{
                                  backgroundColor: `${LUXE_COLORS.gold}20`,
                                  color: LUXE_COLORS.champagne
                                }}
                              >
                                {day.txn_count || 0}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        <tr
                          style={{
                            background: `linear-gradient(135deg, ${LUXE_COLORS.gold}20 0%, ${LUXE_COLORS.goldDark}20 100%)`,
                            borderTop: `2px solid ${LUXE_COLORS.gold}`
                          }}
                        >
                          <td className="px-6 py-4 font-bold" style={{ color: LUXE_COLORS.champagne }}>
                            TOTAL
                          </td>
                          <td className="px-6 py-4 text-right font-bold font-mono" style={{ color: LUXE_COLORS.emerald }}>
                            {summary.total_service?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="px-6 py-4 text-right font-bold font-mono" style={{ color: LUXE_COLORS.plum }}>
                            {summary.total_product?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="px-6 py-4 text-right font-bold font-mono" style={{ color: LUXE_COLORS.bronze }}>
                            {summary.total_tips?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="px-6 py-4 text-right font-bold font-mono" style={{ color: LUXE_COLORS.sapphire }}>
                            {summary.total_vat?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="px-6 py-4 text-right font-bold font-mono text-xl" style={{ color: LUXE_COLORS.gold }}>
                            {summary.total_gross?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="px-6 py-4 text-center font-bold" style={{ color: LUXE_COLORS.champagne }}>
                            {summary.transaction_count || 0}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Calendar className="w-12 h-12 opacity-30" style={{ color: LUXE_COLORS.bronze }} />
                            <p style={{ color: LUXE_COLORS.bronze }}>
                              No sales data available for {reportPeriod}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 mb-4 opacity-30" style={{ color: LUXE_COLORS.bronze }} />
            <p className="text-lg" style={{ color: LUXE_COLORS.bronze }}>
              No sales data available for {reportPeriod}
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
