/**
 * HERA Professional Sales Report Export Utilities
 * Supports Excel (.xlsx) and Professional PDF formats
 * Smart Code: HERA.SALON.REPORTS.EXPORT.v1
 */

import * as XLSX from 'xlsx'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// ================================================================================
// TYPES
// ================================================================================

export interface SalesReportSummary {
  total_gross?: number
  total_net?: number
  total_vat?: number
  total_tips?: number
  service_revenue?: number
  product_revenue?: number
  total_transactions?: number
  average_ticket?: number
  average_daily?: number
  working_days?: number
  growth_vs_previous?: number
}

export interface DailySalesData {
  date?: string
  hour?: string
  service_revenue?: number
  product_revenue?: number
  tips?: number
  vat?: number
  gross_total?: number
  net_total?: number
  transaction_count?: number
}

export interface MonthlySalesData {
  date: string
  service_revenue?: number
  product_revenue?: number
  tips?: number
  vat?: number
  gross_total?: number
  transaction_count?: number
}

// ================================================================================
// EXCEL EXPORT (DAILY SALES REPORT)
// ================================================================================

export async function exportDailySalesReportToExcel(
  reportTitle: string,
  reportPeriod: string,
  reportDate: string,
  branchName: string,
  currency: string,
  summary: SalesReportSummary,
  hourlyData: DailySalesData[]
): Promise<Blob> {
  // Create a new workbook
  const wb = XLSX.utils.book_new()

  // ===== SUMMARY SHEET =====
  const summaryData: any[][] = [
    ['DAILY SALES REPORT - SUMMARY'],
    [''],
    ['Report Period:', reportPeriod],
    ['Report Date:', reportDate],
    ['Branch:', branchName],
    ['Currency:', currency],
    ['Generated:', new Date().toLocaleString()],
    [''],
    ['FINANCIAL SUMMARY'],
    ['Total Gross Revenue:', summary.total_gross || 0],
    ['Total Net Revenue:', summary.total_net || 0],
    ['Service Revenue:', summary.service_revenue || 0],
    ['Product Revenue:', summary.product_revenue || 0],
    ['Total VAT:', summary.total_vat || 0],
    ['Total Tips:', summary.total_tips || 0],
    [''],
    ['TRANSACTION SUMMARY'],
    ['Total Transactions:', summary.total_transactions || 0],
    ['Average Ticket Size:', summary.average_ticket || 0],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)

  // Set column widths for summary sheet
  summarySheet['!cols'] = [
    { wch: 25 }, // Column A
    { wch: 20 }  // Column B
  ]

  // ===== HOURLY BREAKDOWN SHEET =====
  const hourlyHeaders = [
    'Hour',
    'Service Revenue',
    'Product Revenue',
    'Tips',
    'VAT',
    'Gross Total',
    'Net Total',
    'Transactions'
  ]

  const hourlyRows = hourlyData.map(row => [
    row.hour || '',
    row.service_revenue || 0,
    row.product_revenue || 0,
    row.tips || 0,
    row.vat || 0,
    row.gross_total || 0,
    row.net_total || 0,
    row.transaction_count || 0
  ])

  // Add totals row
  hourlyRows.push([
    'TOTAL',
    summary.service_revenue || 0,
    summary.product_revenue || 0,
    summary.total_tips || 0,
    summary.total_vat || 0,
    summary.total_gross || 0,
    summary.total_net || 0,
    summary.total_transactions || 0
  ])

  const hourlySheet = XLSX.utils.aoa_to_sheet([hourlyHeaders, ...hourlyRows])

  // Set column widths for hourly sheet
  hourlySheet['!cols'] = [
    { wch: 15 }, // Hour
    { wch: 18 }, // Service Revenue
    { wch: 18 }, // Product Revenue
    { wch: 12 }, // Tips
    { wch: 12 }, // VAT
    { wch: 15 }, // Gross Total
    { wch: 15 }, // Net Total
    { wch: 15 }  // Transactions
  ]

  // Add sheets to workbook
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')
  XLSX.utils.book_append_sheet(wb, hourlySheet, 'Hourly Breakdown')

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

// ================================================================================
// EXCEL EXPORT (MONTHLY SALES REPORT)
// ================================================================================

export async function exportMonthlySalesReportToExcel(
  reportTitle: string,
  reportPeriod: string,
  branchName: string,
  currency: string,
  summary: SalesReportSummary,
  dailyData: MonthlySalesData[]
): Promise<Blob> {
  // Create a new workbook
  const wb = XLSX.utils.book_new()

  // ===== SUMMARY SHEET =====
  const summaryData: any[][] = [
    ['MONTHLY SALES REPORT - SUMMARY'],
    [''],
    ['Report Period:', reportPeriod],
    ['Branch:', branchName],
    ['Currency:', currency],
    ['Generated:', new Date().toLocaleString()],
    [''],
    ['FINANCIAL SUMMARY'],
    ['Total Gross Revenue:', summary.total_gross || 0],
    ['Total Net Revenue:', summary.total_net || 0],
    ['Service Revenue:', summary.service_revenue || 0],
    ['Product Revenue:', summary.product_revenue || 0],
    ['Total VAT:', summary.total_vat || 0],
    ['Total Tips:', summary.total_tips || 0],
    [''],
    ['TRANSACTION SUMMARY'],
    ['Total Transactions:', summary.total_transactions || 0],
    ['Average Ticket Size:', summary.average_ticket || 0],
    ['Average Daily Revenue:', summary.average_daily || 0],
    ['Working Days:', summary.working_days || 0],
    [''],
    ['PERFORMANCE'],
    ['Revenue Growth vs Previous Month:', (summary.growth_vs_previous || 0) + '%'],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)

  // Set column widths for summary sheet
  summarySheet['!cols'] = [
    { wch: 30 }, // Column A
    { wch: 20 }  // Column B
  ]

  // ===== DAILY BREAKDOWN SHEET =====
  const dailyHeaders = [
    'Date',
    'Service Revenue',
    'Product Revenue',
    'Tips',
    'VAT',
    'Gross Total',
    'Transactions'
  ]

  const dailyRows = dailyData.map(row => [
    row.date || '',
    row.service_revenue || 0,
    row.product_revenue || 0,
    row.tips || 0,
    row.vat || 0,
    row.gross_total || 0,
    row.transaction_count || 0
  ])

  // Add totals row
  dailyRows.push([
    'TOTAL',
    summary.service_revenue || 0,
    summary.product_revenue || 0,
    summary.total_tips || 0,
    summary.total_vat || 0,
    summary.total_gross || 0,
    summary.total_transactions || 0
  ])

  const dailySheet = XLSX.utils.aoa_to_sheet([dailyHeaders, ...dailyRows])

  // Set column widths for daily sheet
  dailySheet['!cols'] = [
    { wch: 15 }, // Date
    { wch: 18 }, // Service Revenue
    { wch: 18 }, // Product Revenue
    { wch: 12 }, // Tips
    { wch: 12 }, // VAT
    { wch: 15 }, // Gross Total
    { wch: 15 }  // Transactions
  ]

  // Add sheets to workbook
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')
  XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily Breakdown')

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

// ================================================================================
// PROFESSIONAL PDF EXPORT (DAILY SALES REPORT)
// ================================================================================

export async function exportDailySalesReportToPDF(
  reportTitle: string,
  reportPeriod: string,
  reportDate: string,
  branchName: string,
  currency: string,
  summary: SalesReportSummary,
  hourlyData: DailySalesData[]
): Promise<Blob> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { width, height } = page.getSize()

  // Load fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  let yPosition = height - 50

  // ===== HEADER =====
  page.drawText('DAILY SALES REPORT', {
    x: 50,
    y: yPosition,
    size: 20,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1)
  })
  yPosition -= 30

  // ===== REPORT INFO =====
  const infoLines = [
    `Report Period: ${reportPeriod}`,
    `Report Date: ${reportDate}`,
    `Branch: ${branchName}`,
    `Currency: ${currency}`,
    `Generated: ${new Date().toLocaleString()}`
  ]

  infoLines.forEach(line => {
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3)
    })
    yPosition -= 15
  })

  yPosition -= 10

  // ===== SUMMARY SECTION =====
  page.drawText('FINANCIAL SUMMARY', {
    x: 50,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1)
  })
  yPosition -= 20

  const summaryLines = [
    { label: 'Total Gross Revenue:', value: `${currency} ${(summary.total_gross || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
    { label: 'Total Net Revenue:', value: `${currency} ${(summary.total_net || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
    { label: 'Service Revenue:', value: `${currency} ${(summary.service_revenue || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
    { label: 'Product Revenue:', value: `${currency} ${(summary.product_revenue || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
    { label: 'Total VAT:', value: `${currency} ${(summary.total_vat || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
    { label: 'Total Tips:', value: `${currency} ${(summary.total_tips || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
  ]

  summaryLines.forEach(item => {
    page.drawText(item.label, {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2)
    })
    page.drawText(item.value, {
      x: 250,
      y: yPosition,
      size: 10,
      font: fontRegular,
      color: rgb(0.1, 0.1, 0.1)
    })
    yPosition -= 15
  })

  yPosition -= 10

  // ===== TRANSACTION SUMMARY =====
  page.drawText('TRANSACTION SUMMARY', {
    x: 50,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1)
  })
  yPosition -= 20

  const transactionLines = [
    { label: 'Total Transactions:', value: `${summary.total_transactions || 0}` },
    { label: 'Average Ticket Size:', value: `${currency} ${(summary.average_ticket || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
  ]

  transactionLines.forEach(item => {
    page.drawText(item.label, {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2)
    })
    page.drawText(item.value, {
      x: 250,
      y: yPosition,
      size: 10,
      font: fontRegular,
      color: rgb(0.1, 0.1, 0.1)
    })
    yPosition -= 15
  })

  yPosition -= 20

  // ===== FOOTER NOTE =====
  page.drawText('Note: For detailed hourly breakdown, please refer to the Excel export.', {
    x: 50,
    y: yPosition,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5)
  })

  // ===== PAGE FOOTER =====
  page.drawText(`Page 1 | Generated by HERA ERP | ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: 30,
    size: 8,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5)
  })

  // Save the PDF
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes.buffer], { type: 'application/pdf' })
}

// ================================================================================
// PROFESSIONAL PDF EXPORT (MONTHLY SALES REPORT)
// ================================================================================

export async function exportMonthlySalesReportToPDF(
  reportTitle: string,
  reportPeriod: string,
  branchName: string,
  currency: string,
  summary: SalesReportSummary,
  dailyData: MonthlySalesData[]
): Promise<Blob> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { width, height } = page.getSize()

  // Load fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  let yPosition = height - 50

  // ===== HEADER =====
  page.drawText('MONTHLY SALES REPORT', {
    x: 50,
    y: yPosition,
    size: 20,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1)
  })
  yPosition -= 30

  // ===== REPORT INFO =====
  const infoLines = [
    `Report Period: ${reportPeriod}`,
    `Branch: ${branchName}`,
    `Currency: ${currency}`,
    `Generated: ${new Date().toLocaleString()}`
  ]

  infoLines.forEach(line => {
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3)
    })
    yPosition -= 15
  })

  yPosition -= 10

  // ===== SUMMARY SECTION =====
  page.drawText('FINANCIAL SUMMARY', {
    x: 50,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1)
  })
  yPosition -= 20

  const summaryLines = [
    { label: 'Total Gross Revenue:', value: `${currency} ${(summary.total_gross || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
    { label: 'Total Net Revenue:', value: `${currency} ${(summary.total_net || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
    { label: 'Service Revenue:', value: `${currency} ${(summary.service_revenue || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
    { label: 'Product Revenue:', value: `${currency} ${(summary.product_revenue || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
    { label: 'Total VAT:', value: `${currency} ${(summary.total_vat || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
    { label: 'Total Tips:', value: `${currency} ${(summary.total_tips || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
  ]

  summaryLines.forEach(item => {
    page.drawText(item.label, {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2)
    })
    page.drawText(item.value, {
      x: 250,
      y: yPosition,
      size: 10,
      font: fontRegular,
      color: rgb(0.1, 0.1, 0.1)
    })
    yPosition -= 15
  })

  yPosition -= 10

  // ===== TRANSACTION SUMMARY =====
  page.drawText('TRANSACTION SUMMARY', {
    x: 50,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1)
  })
  yPosition -= 20

  const transactionLines = [
    { label: 'Total Transactions:', value: `${summary.total_transactions || 0}` },
    { label: 'Average Ticket Size:', value: `${currency} ${(summary.average_ticket || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
    { label: 'Average Daily Revenue:', value: `${currency} ${(summary.average_daily || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}` },
    { label: 'Working Days:', value: `${summary.working_days || 0}` },
  ]

  transactionLines.forEach(item => {
    page.drawText(item.label, {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2)
    })
    page.drawText(item.value, {
      x: 250,
      y: yPosition,
      size: 10,
      font: fontRegular,
      color: rgb(0.1, 0.1, 0.1)
    })
    yPosition -= 15
  })

  yPosition -= 10

  // ===== PERFORMANCE =====
  page.drawText('PERFORMANCE ANALYSIS', {
    x: 50,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1)
  })
  yPosition -= 20

  page.drawText('Revenue Growth vs Previous Month:', {
    x: 50,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2)
  })

  const growthValue = summary.growth_vs_previous || 0
  const growthText = `${growthValue > 0 ? '+' : ''}${growthValue.toFixed(1)}%`
  const growthColor = growthValue > 0 ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0)

  page.drawText(growthText, {
    x: 250,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: growthColor
  })
  yPosition -= 30

  // ===== FOOTER NOTE =====
  page.drawText('Note: For detailed daily breakdown, please refer to the Excel export.', {
    x: 50,
    y: yPosition,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5)
  })

  // ===== PAGE FOOTER =====
  page.drawText(`Page 1 | Generated by HERA ERP | ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: 30,
    size: 8,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5)
  })

  // Save the PDF
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes.buffer], { type: 'application/pdf' })
}

// ================================================================================
// DOWNLOAD HELPER
// ================================================================================

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
