/**
 * HERA Professional Sales Report Export Buttons
 * Supports Excel and PDF export with professional formatting
 * Smart Code: HERA.SALON.REPORTS.EXPORT.BUTTONS.v1
 */

'use client'

import React, { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import {
  exportDailySalesReportToExcel,
  exportDailySalesReportToPDF,
  exportMonthlySalesReportToExcel,
  exportMonthlySalesReportToPDF,
  downloadBlob,
  type SalesReportSummary,
  type DailySalesData,
  type MonthlySalesData
} from '@/lib/reports/sales-report-export'

// ================================================================================
// TYPES
// ================================================================================

interface DailyReportProps {
  reportType: 'daily'
  reportTitle: string
  reportPeriod: string
  reportDate: string
  branchName: string
  currency: string
  summary: SalesReportSummary
  hourlyData: DailySalesData[]
}

interface MonthlyReportProps {
  reportType: 'monthly'
  reportTitle: string
  reportPeriod: string
  branchName: string
  currency: string
  summary: SalesReportSummary
  dailyData: MonthlySalesData[]
}

type SalesReportExportButtonsProps = DailyReportProps | MonthlyReportProps

// ================================================================================
// COMPONENT
// ================================================================================

export function SalesReportExportButtons(props: SalesReportExportButtonsProps) {
  const [exporting, setExporting] = useState(false)
  const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null)

  // ===== EXCEL EXPORT =====
  const handleExportExcel = async () => {
    setExporting(true)
    setExportType('excel')

    try {
      let blob: Blob

      if (props.reportType === 'daily') {
        blob = await exportDailySalesReportToExcel(
          props.reportTitle,
          props.reportPeriod,
          props.reportDate,
          props.branchName,
          props.currency,
          props.summary,
          props.hourlyData
        )
      } else {
        blob = await exportMonthlySalesReportToExcel(
          props.reportTitle,
          props.reportPeriod,
          props.branchName,
          props.currency,
          props.summary,
          props.dailyData
        )
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${props.reportType}_sales_report_${timestamp}.xlsx`

      // Download
      downloadBlob(blob, filename)
    } catch (error) {
      console.error('❌ Excel export failed:', error)
      alert('Failed to export Excel report. Please try again.')
    } finally {
      setExporting(false)
      setExportType(null)
    }
  }

  // ===== PDF EXPORT =====
  const handleExportPDF = async () => {
    setExporting(true)
    setExportType('pdf')

    try {
      let blob: Blob

      if (props.reportType === 'daily') {
        blob = await exportDailySalesReportToPDF(
          props.reportTitle,
          props.reportPeriod,
          props.reportDate,
          props.branchName,
          props.currency,
          props.summary,
          props.hourlyData
        )
      } else {
        blob = await exportMonthlySalesReportToPDF(
          props.reportTitle,
          props.reportPeriod,
          props.branchName,
          props.currency,
          props.summary,
          props.dailyData
        )
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${props.reportType}_sales_report_${timestamp}.pdf`

      // Download
      downloadBlob(blob, filename)
    } catch (error) {
      console.error('❌ PDF export failed:', error)
      alert('Failed to export PDF report. Please try again.')
    } finally {
      setExporting(false)
      setExportType(null)
    }
  }

  // ===== RENDER =====
  return (
    <div className="flex items-center gap-2">
      {/* Excel Export Button */}
      <button
        onClick={handleExportExcel}
        disabled={exporting}
        className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: LUXE_COLORS.emerald,
          color: 'white',
          border: `1px solid ${LUXE_COLORS.emeraldDark}`
        }}
      >
        {exporting && exportType === 'excel' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        <span className="font-medium">Excel</span>
      </button>

      {/* PDF Export Button */}
      <button
        onClick={handleExportPDF}
        disabled={exporting}
        className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: LUXE_COLORS.ruby,
          color: 'white',
          border: `1px solid ${LUXE_COLORS.rubyDark}`
        }}
      >
        {exporting && exportType === 'pdf' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span className="font-medium">PDF</span>
      </button>
    </div>
  )
}
