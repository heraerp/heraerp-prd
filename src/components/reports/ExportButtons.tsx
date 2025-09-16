// ================================================================================
// REPORTS EXPORT BUTTONS
// Smart Code: HERA.UI.REPORTS.EXPORT.v1  
// CSV export and print functionality with accessibility
// ================================================================================

'use client'

import React from 'react'
import { Button } from '@/src/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/src/components/ui/dropdown-menu'
import { Badge } from '@/src/components/ui/badge'
import { 
  Download, 
  FileSpreadsheet, 
  Printer,
  FileText,
  ChevronDown,
  ExternalLink,
  Mail
} from 'lucide-react'
import { ExportFormat, PrintOptions } from '@/src/lib/schemas/reports'

interface ExportButtonsProps {
  reportType: 'daily_sales' | 'monthly_sales' | 'pnl' | 'balance_sheet'
  reportTitle: string
  reportPeriod: string
  data: any[]
  summary?: Record<string, any>
  currency?: string
  isLoading?: boolean
  onExport?: (format: ExportFormat) => void | Promise<void>
  onPrint?: (options?: PrintOptions) => void
  onEmail?: () => void
  className?: string
}

export function ExportButtons({
  reportType,
  reportTitle,
  reportPeriod,
  data,
  summary,
  currency = 'AED',
  isLoading = false,
  onExport,
  onPrint,
  onEmail,
  className
}: ExportButtonsProps) {
  
  const [isExporting, setIsExporting] = React.useState(false)
  const [exportingFormat, setExportingFormat] = React.useState<ExportFormat | null>(null)

  // Generate CSV content
  const generateCSV = () => {
    if (!data || data.length === 0) return ''
    
    let csvContent = ''
    
    // Add report header
    csvContent += `${reportTitle}\n`
    csvContent += `Period: ${reportPeriod}\n`
    csvContent += `Generated: ${new Date().toLocaleString()}\n`
    csvContent += `Currency: ${currency}\n\n`
    
    // Add summary if available
    if (summary) {
      csvContent += 'SUMMARY\n'
      Object.entries(summary).forEach(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        const formattedValue = typeof value === 'number' ? 
          (key.includes('percent') ? `${value.toFixed(1)}%` : value.toLocaleString()) : value
        csvContent += `${formattedKey},${formattedValue}\n`
      })
      csvContent += '\n'
    }
    
    // Add data headers based on report type
    let headers: string[] = []
    switch (reportType) {
      case 'daily_sales':
      case 'monthly_sales':
        headers = ['Date/Hour', 'Service Revenue', 'Product Revenue', 'VAT', 'Gross Total', 'Transactions', 'Avg Ticket']
        break
      case 'pnl':
        headers = ['Account Code', 'Account Name', 'Group', 'Amount', 'Percentage']
        break
      case 'balance_sheet':
        headers = ['Account Code', 'Account Name', 'Group', 'Amount', 'Percentage']
        break
    }
    
    csvContent += headers.join(',') + '\n'
    
    // Add data rows
    data.forEach(row => {
      const values: string[] = []
      
      switch (reportType) {
        case 'daily_sales':
          values.push(
            row.hour || row.date || '',
            row.service_net?.toString() || '0',
            row.product_net?.toString() || '0', 
            row.vat?.toString() || '0',
            row.gross?.toString() || '0',
            row.txn_count?.toString() || '0',
            row.avg_ticket?.toString() || '0'
          )
          break
        case 'monthly_sales':
          values.push(
            row.date || '',
            row.service_net?.toString() || '0',
            row.product_net?.toString() || '0',
            row.vat?.toString() || '0', 
            row.gross?.toString() || '0',
            row.txn_count?.toString() || '0',
            row.avg_ticket?.toString() || '0'
          )
          break
        case 'pnl':
        case 'balance_sheet':
          values.push(
            row.account_code || '',
            `"${row.account_name || ''}"`, // Quote names that might contain commas
            row.group || '',
            row.amount?.toString() || '0',
            row.percentage?.toString() || ''
          )
          break
      }
      
      csvContent += values.join(',') + '\n'
    })
    
    return csvContent
  }

  // Download CSV file
  const downloadCSV = () => {
    const csvContent = generateCSV()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    const filename = `${reportType}_${reportPeriod.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Handle export
  const handleExport = async (format: ExportFormat) => {
    if (isExporting) return
    
    setIsExporting(true)
    setExportingFormat(format)
    
    try {
      if (format === 'csv') {
        downloadCSV()
      } else if (onExport) {
        await onExport(format)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
      setExportingFormat(null)
    }
  }

  // Handle print
  const handlePrint = () => {
    if (onPrint) {
      onPrint({
        include_header: true,
        include_summary: true,
        include_details: true,
        page_orientation: reportType === 'balance_sheet' ? 'portrait' : 'landscape',
        font_size: 'normal'
      })
    } else {
      // Fallback to browser print
      window.print()
    }
  }

  const getRecordCount = () => {
    if (!data || data.length === 0) return 0
    return data.filter(row => !row.is_subtotal).length
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      
      {/* Record Count Badge */}
      <Badge variant="outline" className="text-gray-600 border-gray-300">
        {getRecordCount()} records
      </Badge>
      
      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            disabled={isLoading || isExporting || !data || data.length === 0}
            className="border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/50"
          >
            <Download className="h-3 w-3 mr-1" />
            Export
            {isExporting && exportingFormat ? (
              <Badge variant="secondary" className="ml-2 text-xs">
                {exportingFormat.toUpperCase()}...
              </Badge>
            ) : (
              <ChevronDown className="h-3 w-3 ml-1" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium">CSV</div>
              <div className="text-xs text-gray-500">Excel compatible</div>
            </div>
          </DropdownMenuItem>
          
          {onExport && (
            <>
              <DropdownMenuItem 
                onClick={() => handleExport('excel')}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">Excel</div>
                  <div className="text-xs text-gray-500">Native .xlsx format</div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-red-600" />
                <div>
                  <div className="font-medium">PDF</div>
                  <div className="text-xs text-gray-500">Print-ready format</div>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Print Button */}
      <Button 
        variant="outline" 
        size="sm"
        onClick={handlePrint}
        disabled={isLoading || !data || data.length === 0}
        className="border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/50"
      >
        <Printer className="h-3 w-3 mr-1" />
        Print
      </Button>
      
      {/* Email Button (if available) */}
      {onEmail && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={onEmail}
          disabled={isLoading || !data || data.length === 0}
          className="border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/50"
        >
          <Mail className="h-3 w-3 mr-1" />
          Email
        </Button>
      )}
      
      {/* Print Preview Link (for desktop) */}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => {
          // Open print preview in new window
          const printWindow = window.open('', '_blank')
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>${reportTitle} - ${reportPeriod}</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .summary { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    .amount { text-align: right; font-family: monospace; }
                    .footer { margin-top: 20px; font-size: 12px; color: #666; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h1>${reportTitle}</h1>
                    <p>Period: ${reportPeriod}</p>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                  </div>
                  <div class="content">
                    <p>Print preview will be implemented here...</p>
                  </div>
                  <div class="footer">
                    <p>Generated by HERA ERP System • All amounts in ${currency}</p>
                  </div>
                </body>
              </html>
            `)
            printWindow.document.close()
          }
        }}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        Preview
      </Button>
      
    </div>
  )
}

// Utility hook for managing export state
export function useReportExports(reportType: string) {
  const [isExporting, setIsExporting] = React.useState(false)
  const [lastExport, setLastExport] = React.useState<{
    format: ExportFormat
    timestamp: Date
    filename: string
  } | null>(null)

  const exportReport = React.useCallback(async (
    format: ExportFormat,
    data: any[],
    metadata: {
      title: string
      period: string
      currency: string
      summary?: Record<string, any>
    }
  ) => {
    setIsExporting(true)
    
    try {
      // Implementation would depend on backend API
      const response = await fetch('/api/v1/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          report_type: reportType,
          data,
          metadata
        })
      })
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await response.blob()
      const filename = `${reportType}_${metadata.period}_${new Date().toISOString().split('T')[0]}.${format}`
      
      // Download the file
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      
      setLastExport({
        format,
        timestamp: new Date(),
        filename
      })
      
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    } finally {
      setIsExporting(false)
    }
  }, [reportType])

  return {
    isExporting,
    lastExport,
    exportReport
  }
}