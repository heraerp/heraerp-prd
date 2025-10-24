'use client'

import React, { useState, useRef } from 'react'
import {
  FileText,
  Download,
  Users,
  Calendar,
  TrendingUp,
  BarChart3,
  Printer,
  Mail,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/date-utils'
import { useLeaveManagement } from '@/hooks/useLeaveManagement'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface ReportOptions {
  fiscalYearStart: string
  fiscalYearEnd: string
  groupBy: 'employee' | 'department' | 'leave_type'
  format: 'summary' | 'detailed'
  includeForecasts: boolean
}

interface AnnualLeaveReportProps {
  organizationId?: string
}

export function AnnualLeaveReport({ organizationId }: AnnualLeaveReportProps) {
  const { generateAnnualReport, loading } = useLeaveManagement({ organizationId })
  const configCardRef = useRef<HTMLDivElement>(null)
  const reportCardRef = useRef<HTMLDivElement>(null)

  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    fiscalYearStart: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    fiscalYearEnd: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    groupBy: 'employee',
    format: 'summary',
    includeForecasts: false
  })

  const [generatedReport, setGeneratedReport] = useState<any>(null)

  const handleGenerateReport = async () => {
    const report = await generateAnnualReport(
      reportOptions.fiscalYearStart,
      reportOptions.fiscalYearEnd,
      {
        groupBy: reportOptions.groupBy,
        format: reportOptions.format,
        includeForecasts: reportOptions.includeForecasts
      }
    )

    if (report) {
      setGeneratedReport(report)
    }
  }

  const exportReport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting report as ${format}`)
    // Implementation would handle actual export
  }

  // Mouse movement handler for 3D tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -2
    const rotateY = ((x - centerX) / centerX) * 2

    ref.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`
  }

  const handleMouseLeave = (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return
    ref.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
  }

  return (
    <div className="space-y-6">
      {/* Report Configuration Card */}
      <div
        ref={configCardRef}
        onMouseMove={(e) => handleMouseMove(e, configCardRef)}
        onMouseLeave={() => handleMouseLeave(configCardRef)}
        className="rounded-2xl overflow-hidden relative group"
        style={{
          background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.charcoal.base} 0%, ${SALON_LUXE_COLORS.charcoal.dark} 100%)`,
          border: `1px solid ${SALON_LUXE_COLORS.border.base}`,
          boxShadow: `
            0 20px 40px rgba(0, 0, 0, 0.5),
            0 0 0 1px ${SALON_LUXE_COLORS.gold.base}20,
            inset 0 1px 0 rgba(212, 175, 55, 0.1)
          `,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Animated gradient overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${SALON_LUXE_COLORS.gold.base}15 0%, transparent 70%)`,
            transition: 'opacity 0.5s ease'
          }}
        />

        <div className="p-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold tracking-tight" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                Annual Leave Report Generator
              </h3>
              <p className="text-sm mt-2" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                Generate comprehensive leave reports for your organization
              </p>
            </div>
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
              style={{
                background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base}30 0%, ${SALON_LUXE_COLORS.gold.base}10 100%)`,
                border: `2px solid ${SALON_LUXE_COLORS.gold.base}50`,
                boxShadow: `0 8px 16px ${SALON_LUXE_COLORS.gold.base}20`
              }}
            >
              <FileText className="h-8 w-8" style={{ color: SALON_LUXE_COLORS.gold.base }} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Fiscal Year Range */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="fiscalYearStart" style={{ color: SALON_LUXE_COLORS.champagne.light }}>
                  Fiscal Year Start
                </Label>
                <Input
                  id="fiscalYearStart"
                  type="date"
                  value={reportOptions.fiscalYearStart}
                  onChange={e =>
                    setReportOptions({
                      ...reportOptions,
                      fiscalYearStart: e.target.value
                    })
                  }
                  className="mt-2 rounded-lg transition-all duration-200 [&::-webkit-calendar-picker-indicator]:invert"
                  style={{
                    backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
                    borderColor: SALON_LUXE_COLORS.border.light,
                    color: SALON_LUXE_COLORS.text.primary
                  }}
                />
              </div>

              <div>
                <Label htmlFor="fiscalYearEnd" style={{ color: SALON_LUXE_COLORS.champagne.light }}>
                  Fiscal Year End
                </Label>
                <Input
                  id="fiscalYearEnd"
                  type="date"
                  value={reportOptions.fiscalYearEnd}
                  onChange={e =>
                    setReportOptions({
                      ...reportOptions,
                      fiscalYearEnd: e.target.value
                    })
                  }
                  min={reportOptions.fiscalYearStart}
                  className="mt-2 rounded-lg transition-all duration-200 [&::-webkit-calendar-picker-indicator]:invert"
                  style={{
                    backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
                    borderColor: SALON_LUXE_COLORS.border.light,
                    color: SALON_LUXE_COLORS.text.primary
                  }}
                />
              </div>
            </div>

            {/* Report Options */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="groupBy" style={{ color: SALON_LUXE_COLORS.champagne.light }}>
                  Group By
                </Label>
                <Select
                  value={reportOptions.groupBy}
                  onValueChange={(value: any) =>
                    setReportOptions({
                      ...reportOptions,
                      groupBy: value
                    })
                  }
                >
                  <SelectTrigger
                    className="mt-2 rounded-lg hera-select-trigger transition-all duration-200"
                    style={{
                      backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
                      borderColor: SALON_LUXE_COLORS.border.light,
                      color: SALON_LUXE_COLORS.text.primary
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="employee" className="hera-select-item">
                      Employee
                    </SelectItem>
                    <SelectItem value="department" className="hera-select-item">
                      Department
                    </SelectItem>
                    <SelectItem value="leave_type" className="hera-select-item">
                      Leave Type
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="format" style={{ color: SALON_LUXE_COLORS.champagne.light }}>
                  Report Format
                </Label>
                <Select
                  value={reportOptions.format}
                  onValueChange={(value: any) =>
                    setReportOptions({
                      ...reportOptions,
                      format: value
                    })
                  }
                >
                  <SelectTrigger
                    className="mt-2 rounded-lg hera-select-trigger transition-all duration-200"
                    style={{
                      backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
                      borderColor: SALON_LUXE_COLORS.border.light,
                      color: SALON_LUXE_COLORS.text.primary
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="summary" className="hera-select-item">
                      Summary
                    </SelectItem>
                    <SelectItem value="detailed" className="hera-select-item">
                      Detailed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="mt-6 flex items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer group/checkbox">
              <input
                type="checkbox"
                checked={reportOptions.includeForecasts}
                onChange={e =>
                  setReportOptions({
                    ...reportOptions,
                    includeForecasts: e.target.checked
                  })
                }
                className="rounded transition-all duration-200"
                style={{
                  accentColor: SALON_LUXE_COLORS.gold.base
                }}
              />
              <span
                className="text-sm transition-colors duration-200 group-hover/checkbox:opacity-100"
                style={{ color: SALON_LUXE_COLORS.champagne.light, opacity: 0.9 }}
              >
                Include Leave Forecasts
              </span>
            </label>
          </div>

          {/* Generate Button */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              className="px-8 py-6 rounded-xl font-bold text-base shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 group/button"
              style={{
                background: loading
                  ? `linear-gradient(135deg, #8C785360 0%, #8C785340 100%)`
                  : `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base} 0%, ${SALON_LUXE_COLORS.gold.dark} 100%)`,
                color: loading ? SALON_LUXE_COLORS.charcoal.dark : SALON_LUXE_COLORS.text.onGold,
                border: 'none',
                boxShadow: loading
                  ? 'none'
                  : `0 8px 24px ${SALON_LUXE_COLORS.gold.base}40`,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <div
                    className="animate-spin rounded-full h-5 w-5 border-2 mr-3"
                    style={{
                      borderColor: `${SALON_LUXE_COLORS.charcoal.dark}40`,
                      borderTopColor: SALON_LUXE_COLORS.charcoal.dark
                    }}
                  />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-5 w-5 mr-3 transition-transform duration-300 group-hover/button:scale-110" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Report Preview Card */}
      {generatedReport && (
        <div
          ref={reportCardRef}
          onMouseMove={(e) => handleMouseMove(e, reportCardRef)}
          onMouseLeave={() => handleMouseLeave(reportCardRef)}
          className="rounded-2xl overflow-hidden relative group"
          style={{
            background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.charcoal.base} 0%, ${SALON_LUXE_COLORS.charcoal.dark} 100%)`,
            border: `1px solid ${SALON_LUXE_COLORS.border.base}`,
            boxShadow: `
              0 20px 40px rgba(0, 0, 0, 0.5),
              0 0 0 1px ${SALON_LUXE_COLORS.gold.base}20,
              inset 0 1px 0 rgba(212, 175, 55, 0.1)
            `,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transformStyle: 'preserve-3d',
            animation: 'slideInUp 0.5s ease-out'
          }}
        >
          {/* Animated gradient overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${SALON_LUXE_COLORS.gold.base}15 0%, transparent 70%)`,
              transition: 'opacity 0.5s ease'
            }}
          />

          <div className="p-8 relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.emerald.base}30 0%, ${SALON_LUXE_COLORS.emerald.base}10 100%)`,
                    border: `2px solid ${SALON_LUXE_COLORS.emerald.base}50`,
                    boxShadow: `0 8px 16px ${SALON_LUXE_COLORS.emerald.base}20`
                  }}
                >
                  <Sparkles className="h-7 w-7" style={{ color: SALON_LUXE_COLORS.emerald.base }} />
                </div>
                <h3 className="text-2xl font-bold tracking-tight" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                  Report Preview
                </h3>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport('pdf')}
                  className="rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  style={{
                    backgroundColor: SALON_LUXE_COLORS.charcoal.light,
                    borderColor: SALON_LUXE_COLORS.border.light,
                    color: SALON_LUXE_COLORS.text.primary
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport('csv')}
                  className="rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  style={{
                    backgroundColor: SALON_LUXE_COLORS.charcoal.light,
                    borderColor: SALON_LUXE_COLORS.border.light,
                    color: SALON_LUXE_COLORS.text.primary
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport('excel')}
                  className="rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  style={{
                    backgroundColor: SALON_LUXE_COLORS.charcoal.light,
                    borderColor: SALON_LUXE_COLORS.border.light,
                    color: SALON_LUXE_COLORS.text.primary
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  style={{
                    backgroundColor: SALON_LUXE_COLORS.charcoal.light,
                    borderColor: SALON_LUXE_COLORS.border.light,
                    color: SALON_LUXE_COLORS.text.primary
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  style={{
                    backgroundColor: SALON_LUXE_COLORS.charcoal.light,
                    borderColor: SALON_LUXE_COLORS.border.light,
                    color: SALON_LUXE_COLORS.text.primary
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              {[
                {
                  label: 'Total Employees',
                  value: generatedReport.summary?.total_employees || 0,
                  suffix: '',
                  gradient: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base}20 0%, ${SALON_LUXE_COLORS.gold.base}10 100%)`,
                  border: SALON_LUXE_COLORS.gold.base,
                  icon: Users
                },
                {
                  label: 'Total Leave Taken',
                  value: generatedReport.summary?.total_leave_taken || 0,
                  suffix: ' days',
                  gradient: `linear-gradient(135deg, ${SALON_LUXE_COLORS.emerald.base}20 0%, ${SALON_LUXE_COLORS.emerald.base}10 100%)`,
                  border: SALON_LUXE_COLORS.emerald.base,
                  icon: Calendar
                },
                {
                  label: 'Average per Employee',
                  value: generatedReport.summary?.total_employees
                    ? Math.round(generatedReport.summary.total_leave_taken / generatedReport.summary.total_employees)
                    : 0,
                  suffix: ' days',
                  gradient: `linear-gradient(135deg, ${SALON_LUXE_COLORS.plum.base}20 0%, ${SALON_LUXE_COLORS.plum.base}10 100%)`,
                  border: SALON_LUXE_COLORS.plum.base,
                  icon: TrendingUp
                },
                {
                  label: 'Report Period',
                  value: `${formatDate(new Date(reportOptions.fiscalYearStart), 'MMM yyyy')} - ${formatDate(new Date(reportOptions.fiscalYearEnd), 'MMM yyyy')}`,
                  suffix: '',
                  gradient: `linear-gradient(135deg, ${SALON_LUXE_COLORS.rose.base}20 0%, ${SALON_LUXE_COLORS.rose.base}10 100())`,
                  border: SALON_LUXE_COLORS.rose.base,
                  icon: FileText
                }
              ].map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div
                    key={index}
                    className="p-5 rounded-xl group/stat transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    style={{
                      background: stat.gradient,
                      border: `1px solid ${stat.border}30`,
                      boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2)`
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                        {stat.label}
                      </p>
                      <Icon
                        className="h-5 w-5 transition-transform duration-300 group-hover/stat:scale-110 group-hover/stat:rotate-3"
                        style={{ color: stat.border }}
                      />
                    </div>
                    <p className="text-2xl font-bold" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                      {stat.value}{stat.suffix}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Report Table Preview */}
            <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${SALON_LUXE_COLORS.border.light}` }}>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: SALON_LUXE_COLORS.charcoal.dark, borderBottom: `1px solid ${SALON_LUXE_COLORS.border.light}` }}>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: SALON_LUXE_COLORS.gold.base }}>
                      {reportOptions.groupBy === 'employee' ? 'Employee' : reportOptions.groupBy === 'department' ? 'Department' : 'Leave Type'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: SALON_LUXE_COLORS.gold.base }}>
                      Opening Balance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: SALON_LUXE_COLORS.gold.base }}>
                      Accrued
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: SALON_LUXE_COLORS.gold.base }}>
                      Used
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: SALON_LUXE_COLORS.gold.base }}>
                      Adjustments
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: SALON_LUXE_COLORS.gold.base }}>
                      Closing Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Sarah Johnson - Senior Stylist', opening: 5, accrued: 21, used: 15, adjustments: 0, closing: 11 },
                    { name: 'Michael Chen - Colorist', opening: 3, accrued: 21, used: 12, adjustments: 0, closing: 12 }
                  ].map((row, index) => (
                    <tr
                      key={index}
                      className="transition-all duration-200 hover:scale-[1.01]"
                      style={{
                        backgroundColor: index % 2 === 0 ? SALON_LUXE_COLORS.charcoal.dark : SALON_LUXE_COLORS.charcoal.base,
                        borderBottom: `1px solid ${SALON_LUXE_COLORS.border.lighter}`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = SALON_LUXE_COLORS.charcoal.light
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? SALON_LUXE_COLORS.charcoal.dark : SALON_LUXE_COLORS.charcoal.base
                      }}
                    >
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                        {row.name}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                        {row.opening}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                        {row.accrued}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                        {row.used}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                        {row.adjustments}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: SALON_LUXE_COLORS.gold.base }}>
                        {row.closing}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Report Footer */}
            <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${SALON_LUXE_COLORS.border.light}` }}>
              <p className="text-xs" style={{ color: SALON_LUXE_COLORS.text.tertiary }}>
                Report generated on {formatDate(new Date(), "MMMM d, yyyy 'at' h:mm a")}
                {' • '}
                HERA Leave Management System v1.0
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Slide in animation */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
