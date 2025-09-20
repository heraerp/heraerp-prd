'use client'

import React, { useState } from 'react'
import {
  FileText,
  Download,
  Users,
  Calendar,
  TrendingUp,
  BarChart3,
  Printer,
  Mail
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

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(31, 41, 55, 0.85) 0%, 
              rgba(17, 24, 39, 0.9) 100%
            )
          `,
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 4px 16px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold !text-gray-100 dark:!text-foreground">
                Annual Leave Report Generator
              </h3>
              <p className="text-sm !text-muted-foreground dark:!text-muted-foreground mt-1">
                Generate comprehensive leave reports for your organization
              </p>
            </div>
            <FileText className="h-8 w-8 text-indigo-400" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Fiscal Year Range */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="fiscalYearStart" className="!text-gray-300">
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
                  className="mt-2 bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50 [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>

              <div>
                <Label htmlFor="fiscalYearEnd" className="!text-gray-300">
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
                  className="mt-2 bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50 [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>

            {/* Report Options */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="groupBy" className="!text-gray-300">
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
                  <SelectTrigger className="mt-2 bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50">
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
                <Label htmlFor="format" className="!text-gray-300">
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
                  <SelectTrigger className="mt-2 bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50">
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reportOptions.includeForecasts}
                onChange={e =>
                  setReportOptions({
                    ...reportOptions,
                    includeForecasts: e.target.checked
                  })
                }
                className="rounded border-border bg-muted/50 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
              />
              <span className="text-sm !text-gray-300">Include Leave Forecasts</span>
            </label>
          </div>

          {/* Generate Button */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-foreground"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {generatedReport && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(31, 41, 55, 0.85) 0%, 
                rgba(17, 24, 39, 0.9) 100%
              )
            `,
            backdropFilter: 'blur(20px) saturate(120%)',
            WebkitBackdropFilter: 'blur(20px) saturate(120%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.5),
              0 4px 16px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.05)
            `
          }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold !text-gray-100 dark:!text-foreground">
                Report Preview
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport('pdf')}
                  className="backdrop-blur-xl bg-background/30 dark:bg-background/30"
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport('csv')}
                  className="backdrop-blur-xl bg-background/30 dark:bg-background/30"
                >
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport('excel')}
                  className="backdrop-blur-xl bg-background/30 dark:bg-background/30"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="backdrop-blur-xl bg-background/30 dark:bg-background/30"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="backdrop-blur-xl bg-background/30 dark:bg-background/30"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30">
                <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold !text-gray-100 dark:!text-foreground">
                  {generatedReport.summary?.total_employees || 0}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">Total Leave Taken</p>
                <p className="text-2xl font-bold !text-gray-100 dark:!text-foreground">
                  {generatedReport.summary?.total_leave_taken || 0} days
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">Average per Employee</p>
                <p className="text-2xl font-bold !text-gray-100 dark:!text-foreground">
                  {generatedReport.summary?.total_employees
                    ? Math.round(
                        generatedReport.summary.total_leave_taken /
                          generatedReport.summary.total_employees
                      )
                    : 0}{' '}
                  days
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
                <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">Report Period</p>
                <p className="text-sm font-bold !text-gray-100 dark:!text-foreground">
                  {formatDate(new Date(reportOptions.fiscalYearStart), 'MMM yyyy')} -{' '}
                  {formatDate(new Date(reportOptions.fiscalYearEnd), 'MMM yyyy')}
                </p>
              </div>
            </div>

            {/* Report Table Preview */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium !text-muted-foreground dark:!text-muted-foreground uppercase tracking-wider">
                      {reportOptions.groupBy === 'employee'
                        ? 'Employee'
                        : reportOptions.groupBy === 'department'
                          ? 'Department'
                          : 'Leave Type'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium !text-muted-foreground dark:!text-muted-foreground uppercase tracking-wider">
                      Opening Balance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium !text-muted-foreground dark:!text-muted-foreground uppercase tracking-wider">
                      Accrued
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium !text-muted-foreground dark:!text-muted-foreground uppercase tracking-wider">
                      Used
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium !text-muted-foreground dark:!text-muted-foreground uppercase tracking-wider">
                      Adjustments
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium !text-muted-foreground dark:!text-muted-foreground uppercase tracking-wider">
                      Closing Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {/* Sample data rows */}
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm !text-gray-100 dark:!text-foreground">
                      Sarah Johnson - Senior Stylist
                    </td>
                    <td className="px-4 py-3 text-sm !text-muted-foreground dark:!text-muted-foreground">5</td>
                    <td className="px-4 py-3 text-sm !text-muted-foreground dark:!text-muted-foreground">21</td>
                    <td className="px-4 py-3 text-sm !text-muted-foreground dark:!text-muted-foreground">15</td>
                    <td className="px-4 py-3 text-sm !text-muted-foreground dark:!text-muted-foreground">0</td>
                    <td className="px-4 py-3 text-sm font-medium !text-gray-100 dark:!text-foreground">
                      11
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm !text-gray-100 dark:!text-foreground">
                      Michael Chen - Colorist
                    </td>
                    <td className="px-4 py-3 text-sm !text-muted-foreground dark:!text-muted-foreground">3</td>
                    <td className="px-4 py-3 text-sm !text-muted-foreground dark:!text-muted-foreground">21</td>
                    <td className="px-4 py-3 text-sm !text-muted-foreground dark:!text-muted-foreground">12</td>
                    <td className="px-4 py-3 text-sm !text-muted-foreground dark:!text-muted-foreground">0</td>
                    <td className="px-4 py-3 text-sm font-medium !text-gray-100 dark:!text-foreground">
                      12
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Report Footer */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs !text-muted-foreground dark:!text-muted-foreground">
                Report generated on {formatDate(new Date(), "MMMM d, yyyy 'at' h:mm a")}
                {' • '}
                HERA Leave Management System v1.0
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
