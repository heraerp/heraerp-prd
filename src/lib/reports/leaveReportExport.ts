/**
 * 🏢 ENTERPRISE-GRADE LEAVE REPORT EXPORT UTILITIES
 *
 * Features:
 * - PDF Export with professional formatting
 * - Excel Export with multiple sheets (Summary + Details)
 * - Formatted headers, footers, and styling
 * - Company branding and logo support
 * - Date range filtering
 * - Comprehensive leave analytics
 */

import * as XLSX from 'xlsx'
import { LeaveRequest, LeaveBalance } from '@/hooks/useHeraLeave'
import { format } from 'date-fns'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LeaveReportFilters {
  startDate?: string
  endDate?: string
  staffIds?: string[]
  leaveTypes?: Array<'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'>
  status?: Array<'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'>
}

export interface LeaveReportData {
  balances: Record<string, LeaveBalance>
  requests: LeaveRequest[]
  staff: Array<{ id: string; entity_name: string }>
  filters: LeaveReportFilters
  organizationName?: string
  generatedAt: string
}

// ============================================================================
// EXCEL EXPORT - ENTERPRISE GRADE
// ============================================================================

/**
 * Generate comprehensive Excel report with multiple sheets
 *
 * Sheets:
 * 1. Summary - Overall statistics and KPIs
 * 2. Staff Balances - Detailed leave balances per staff
 * 3. Leave Requests - All leave requests with details
 * 4. Analytics - Leave patterns and trends
 */
export function exportLeaveReportToExcel(data: LeaveReportData): void {
  const workbook = XLSX.utils.book_new()

  // Sheet 1: Summary
  const summarySheet = createSummarySheet(data)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Sheet 2: Staff Balances
  const balancesSheet = createBalancesSheet(data)
  XLSX.utils.book_append_sheet(workbook, balancesSheet, 'Staff Balances')

  // Sheet 3: Leave Requests
  const requestsSheet = createRequestsSheet(data)
  XLSX.utils.book_append_sheet(workbook, requestsSheet, 'Leave Requests')

  // Sheet 4: Analytics
  const analyticsSheet = createAnalyticsSheet(data)
  XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics')

  // Generate filename with timestamp
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')
  const filename = `Leave-Report-${timestamp}.xlsx`

  // Download file
  XLSX.writeFile(workbook, filename)
}

/**
 * Sheet 1: Summary - Overall KPIs and statistics
 */
function createSummarySheet(data: LeaveReportData): XLSX.WorkSheet {
  const balanceArray = Object.values(data.balances)

  const totalEntitlement = balanceArray.reduce((sum, b) => sum + b.entitlement, 0)
  const totalUsed = balanceArray.reduce((sum, b) => sum + b.used_days, 0)
  const totalPending = balanceArray.reduce((sum, b) => sum + b.pending_days, 0)
  const totalAvailable = balanceArray.reduce((sum, b) => sum + b.available_days, 0)
  const avgUtilization = totalEntitlement > 0 ? (totalUsed / totalEntitlement) * 100 : 0

  const summaryData = [
    ['LEAVE MANAGEMENT REPORT'],
    [data.organizationName || 'Organization Name'],
    [`Generated: ${data.generatedAt}`],
    [],
    ['SUMMARY STATISTICS'],
    ['Metric', 'Value'],
    ['Total Staff', balanceArray.length],
    ['Total Entitlement (Days)', totalEntitlement.toFixed(1)],
    ['Total Used (Days)', totalUsed.toFixed(1)],
    ['Total Pending (Days)', totalPending.toFixed(1)],
    ['Total Available (Days)', totalAvailable.toFixed(1)],
    ['Average Utilization (%)', avgUtilization.toFixed(1)],
    [],
    ['LEAVE REQUEST BREAKDOWN'],
    ['Status', 'Count'],
    ['Draft', data.requests.filter(r => r.status === 'draft').length],
    ['Submitted', data.requests.filter(r => r.status === 'submitted').length],
    ['Approved', data.requests.filter(r => r.status === 'approved').length],
    ['Rejected', data.requests.filter(r => r.status === 'rejected').length],
    ['Cancelled', data.requests.filter(r => r.status === 'cancelled').length],
    [],
    ['LEAVE TYPE BREAKDOWN'],
    ['Type', 'Count', 'Total Days'],
    ['Annual Leave', data.requests.filter(r => r.leave_type === 'ANNUAL').length, data.requests.filter(r => r.leave_type === 'ANNUAL').reduce((sum, r) => sum + r.total_days, 0)],
    ['Sick Leave', data.requests.filter(r => r.leave_type === 'SICK').length, data.requests.filter(r => r.leave_type === 'SICK').reduce((sum, r) => sum + r.total_days, 0)],
    ['Unpaid Leave', data.requests.filter(r => r.leave_type === 'UNPAID').length, data.requests.filter(r => r.leave_type === 'UNPAID').reduce((sum, r) => sum + r.total_days, 0)],
    ['Other Leave', data.requests.filter(r => r.leave_type === 'OTHER').length, data.requests.filter(r => r.leave_type === 'OTHER').reduce((sum, r) => sum + r.total_days, 0)]
  ]

  return XLSX.utils.aoa_to_sheet(summaryData)
}

/**
 * Sheet 2: Staff Balances - Detailed leave balances
 */
function createBalancesSheet(data: LeaveReportData): XLSX.WorkSheet {
  const balanceArray = Object.values(data.balances)

  const headers = [
    'Staff Name',
    'Policy Name',
    'Accrual Method',
    'Annual Entitlement',
    'Current Entitlement',
    'Months Worked',
    'Used Days',
    'Pending Days',
    'Available Days',
    'Utilization (%)'
  ]

  const rows = balanceArray.map(balance => {
    const utilization = balance.total_allocation > 0
      ? ((balance.used_days / balance.total_allocation) * 100).toFixed(1)
      : '0.0'

    return [
      balance.staff_name,
      balance.policy_name,
      balance.accrual_method,
      balance.annual_entitlement,
      balance.entitlement,
      balance.months_worked,
      balance.used_days,
      balance.pending_days,
      balance.available_days,
      utilization
    ]
  })

  return XLSX.utils.aoa_to_sheet([headers, ...rows])
}

/**
 * Sheet 3: Leave Requests - All leave requests with full details
 */
function createRequestsSheet(data: LeaveReportData): XLSX.WorkSheet {
  const headers = [
    'Request Code',
    'Staff Name',
    'Manager Name',
    'Leave Type',
    'Start Date',
    'End Date',
    'Total Days',
    'Status',
    'Submitted At',
    'Approved At',
    'Approved By',
    'Rejected At',
    'Rejection Reason',
    'Reason'
  ]

  const rows = data.requests.map(request => [
    request.transaction_code,
    request.staff_name,
    request.manager_name,
    request.leave_type,
    format(new Date(request.start_date), 'dd MMM yyyy'),
    format(new Date(request.end_date), 'dd MMM yyyy'),
    request.total_days,
    request.status.toUpperCase(),
    format(new Date(request.submitted_at), 'dd MMM yyyy HH:mm'),
    request.approved_at ? format(new Date(request.approved_at), 'dd MMM yyyy HH:mm') : '',
    request.approved_by || '',
    request.rejected_at ? format(new Date(request.rejected_at), 'dd MMM yyyy HH:mm') : '',
    request.rejection_reason || '',
    request.reason || ''
  ])

  return XLSX.utils.aoa_to_sheet([headers, ...rows])
}

/**
 * Sheet 4: Analytics - Leave patterns and trends
 */
function createAnalyticsSheet(data: LeaveReportData): XLSX.WorkSheet {
  const balanceArray = Object.values(data.balances)

  // Top utilizersconst topUtilizers = balanceArray
    .map(b => ({
      name: b.staff_name,
      utilization: b.total_allocation > 0 ? (b.used_days / b.total_allocation) * 100 : 0,
      usedDays: b.used_days
    }))
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 10)

  // Low utilizers (staff not taking leave)
  const lowUtilizers = balanceArray
    .map(b => ({
      name: b.staff_name,
      utilization: b.total_allocation > 0 ? (b.used_days / b.total_allocation) * 100 : 0,
      availableDays: b.available_days
    }))
    .sort((a, b) => a.utilization - b.utilization)
    .slice(0, 10)

  // Month-wise breakdown
  const monthWise = data.requests.reduce((acc, request) => {
    const month = format(new Date(request.start_date), 'MMM yyyy')
    if (!acc[month]) {
      acc[month] = { count: 0, totalDays: 0 }
    }
    acc[month].count++
    acc[month].totalDays += request.total_days
    return acc
  }, {} as Record<string, { count: number; totalDays: number }>)

  const analyticsData = [
    ['LEAVE ANALYTICS'],
    [],
    ['TOP 10 UTILIZERS'],
    ['Staff Name', 'Utilization (%)', 'Used Days'],
    ...topUtilizers.map(u => [u.name, u.utilization.toFixed(1), u.usedDays]),
    [],
    ['LOW UTILIZERS (Top 10)'],
    ['Staff Name', 'Utilization (%)', 'Available Days'],
    ...lowUtilizers.map(u => [u.name, u.utilization.toFixed(1), u.availableDays]),
    [],
    ['MONTH-WISE LEAVE REQUESTS'],
    ['Month', 'Request Count', 'Total Days'],
    ...Object.entries(monthWise).map(([month, data]) => [month, data.count, data.totalDays])
  ]

  return XLSX.utils.aoa_to_sheet(analyticsData)
}

// ============================================================================
// PDF EXPORT - ENTERPRISE GRADE (HTML-based approach)
// ============================================================================

/**
 * Generate PDF report using browser print functionality
 * This provides better compatibility than jsPDF for complex layouts
 */
export function exportLeaveReportToPDF(data: LeaveReportData): void {
  const balanceArray = Object.values(data.balances)

  const totalEntitlement = balanceArray.reduce((sum, b) => sum + b.entitlement, 0)
  const totalUsed = balanceArray.reduce((sum, b) => sum + b.used_days, 0)
  const totalPending = balanceArray.reduce((sum, b) => sum + b.pending_days, 0)
  const totalAvailable = balanceArray.reduce((sum, b) => sum + b.available_days, 0)
  const avgUtilization = totalEntitlement > 0 ? (totalUsed / totalEntitlement) * 100 : 0

  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Leave Management Report</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          .page-break { page-break-before: always; }
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #D4AF37;
          padding-bottom: 15px;
        }
        .header h1 {
          color: #D4AF37;
          margin: 0 0 5px 0;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .summary-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          background: #f9f9f9;
        }
        .summary-card h3 {
          margin: 0 0 10px 0;
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
        }
        .summary-card .value {
          font-size: 28px;
          font-weight: bold;
          color: #D4AF37;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #D4AF37;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: bold;
          font-size: 10px;
          text-transform: uppercase;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #eee;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #D4AF37;
          margin: 20px 0 15px 0;
          border-bottom: 2px solid #D4AF37;
          padding-bottom: 5px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #999;
          font-size: 9px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <!-- HEADER -->
      <div class="header">
        <h1>LEAVE MANAGEMENT REPORT</h1>
        <p><strong>${data.organizationName || 'Organization'}</strong></p>
        <p>Generated: ${data.generatedAt}</p>
      </div>

      <!-- SUMMARY STATISTICS -->
      <h2 class="section-title">Summary Statistics</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Entitlement</h3>
          <div class="value">${totalEntitlement.toFixed(1)}</div>
          <p>days</p>
        </div>
        <div class="summary-card">
          <h3>Total Used</h3>
          <div class="value">${totalUsed.toFixed(1)}</div>
          <p>days</p>
        </div>
        <div class="summary-card">
          <h3>Total Pending</h3>
          <div class="value">${totalPending.toFixed(1)}</div>
          <p>days</p>
        </div>
        <div class="summary-card">
          <h3>Avg Utilization</h3>
          <div class="value">${avgUtilization.toFixed(1)}%</div>
          <p>of entitlement</p>
        </div>
      </div>

      <!-- STAFF BALANCES TABLE -->
      <h2 class="section-title">Staff Leave Balances</h2>
      <table>
        <thead>
          <tr>
            <th>Staff Name</th>
            <th>Policy</th>
            <th>Entitlement</th>
            <th>Used</th>
            <th>Pending</th>
            <th>Available</th>
            <th>Utilization</th>
          </tr>
        </thead>
        <tbody>
          ${balanceArray.map(balance => {
            const utilization = balance.total_allocation > 0
              ? ((balance.used_days / balance.total_allocation) * 100).toFixed(1)
              : '0.0'
            return `
              <tr>
                <td><strong>${balance.staff_name}</strong></td>
                <td>${balance.policy_name}</td>
                <td>${balance.entitlement}</td>
                <td>${balance.used_days}</td>
                <td>${balance.pending_days}</td>
                <td>${balance.available_days}</td>
                <td>${utilization}%</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>

      <!-- PAGE BREAK -->
      <div class="page-break"></div>

      <!-- LEAVE REQUESTS TABLE -->
      <h2 class="section-title">Leave Requests</h2>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Staff</th>
            <th>Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Days</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.requests.slice(0, 50).map(request => `
            <tr>
              <td>${request.transaction_code}</td>
              <td>${request.staff_name}</td>
              <td>${request.leave_type}</td>
              <td>${format(new Date(request.start_date), 'dd MMM yyyy')}</td>
              <td>${format(new Date(request.end_date), 'dd MMM yyyy')}</td>
              <td>${request.total_days}</td>
              <td><strong>${request.status.toUpperCase()}</strong></td>
            </tr>
          `).join('')}
          ${data.requests.length > 50 ? `
            <tr>
              <td colspan="7" style="text-align: center; font-style: italic; color: #999;">
                Showing first 50 requests. Download Excel for complete list.
              </td>
            </tr>
          ` : ''}
        </tbody>
      </table>

      <!-- FOOTER -->
      <div class="footer">
        <p>This report is confidential and intended for internal use only.</p>
        <p>Generated by HERA ERP System - Leave Management Module</p>
      </div>
    </body>
    </html>
  `

  // Open in new window and trigger print
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}
