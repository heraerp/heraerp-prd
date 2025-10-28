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
  users?: Array<{ id: string; entity_name: string }> // USER entities for approved_by lookup
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

  const worksheet = XLSX.utils.aoa_to_sheet(summaryData)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 }, // Column A - Metric names
    { wch: 20 }  // Column B - Values
  ]

  return worksheet
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

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Staff Name
    { wch: 20 }, // Policy Name
    { wch: 15 }, // Accrual Method
    { wch: 18 }, // Annual Entitlement
    { wch: 18 }, // Current Entitlement
    { wch: 15 }, // Months Worked
    { wch: 12 }, // Used Days
    { wch: 14 }, // Pending Days
    { wch: 15 }, // Available Days
    { wch: 15 }  // Utilization (%)
  ]

  return worksheet
}

/**
 * Sheet 3: Leave Requests - All leave requests with full details
 */
function createRequestsSheet(data: LeaveReportData): XLSX.WorkSheet {
  // Create user lookup map (approved_by could be USER entity id OR supabase_uid)
  const userMap = new Map<string, string>()

  // Build map with both entity ID and supabase_uid as keys
  if (data.users && data.users.length > 0) {
    data.users.forEach(u => {
      // Map by entity ID
      userMap.set(u.id, u.entity_name)

      // Also map by supabase_uid if it exists in metadata
      const supabaseUid = (u as any).metadata?.supabase_uid
      if (supabaseUid) {
        userMap.set(supabaseUid, u.entity_name)
      }
    })
  }

  // 🔍 DEBUG: Log user map creation with supabase_uid support
  console.log('📊 [createRequestsSheet] User map with supabase_uid:', {
    usersProvided: data.users?.length || 0,
    userMapSize: userMap.size,
    userMapKeys: Array.from(userMap.keys()),
    userMapEntries: Array.from(userMap.entries()).map(([id, name]) => ({ id, name })),
    sampleRequest: data.requests?.[0],
    sampleUserMetadata: (data.users?.[0] as any)?.metadata,
    allUsers: data.users?.map(u => ({ id: u.id, name: u.entity_name, metadata: (u as any).metadata }))
  })

  const headers = [
    'Request Code',
    'Staff Name',
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

  const rows = data.requests.map(request => {
    // ✅ Use stored approver name (from metadata) - eliminates USER entity lookup
    // Fallback to lookup for backward compatibility with old records
    const approverName = request.approved_by_name ||
                        (request.approved_by ? (userMap.get(request.approved_by) || request.approved_by.substring(0, 8)) : '')

    // 🔍 DEBUG: Log approver name resolution
    if (request.approved_by) {
      console.log('🔍 [Approver Name Resolution]', {
        requestCode: request.transaction_code,
        approved_by: request.approved_by,
        approved_by_name: request.approved_by_name,
        usedStoredName: !!request.approved_by_name,
        resolvedName: approverName
      })
    }

    return [
      request.transaction_code,
      request.staff_name,
      request.leave_type,
      format(new Date(request.start_date), 'dd MMM yyyy'),
      format(new Date(request.end_date), 'dd MMM yyyy'),
      request.total_days,
      request.status.toUpperCase(),
      format(new Date(request.submitted_at), 'dd MMM yyyy HH:mm'),
      request.approved_at ? format(new Date(request.approved_at), 'dd MMM yyyy HH:mm') : '',
      approverName,
      request.rejected_at ? format(new Date(request.rejected_at), 'dd MMM yyyy HH:mm') : '',
      request.rejection_reason || '',
      request.reason || ''
    ]
  })

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Request Code
    { wch: 25 }, // Staff Name
    { wch: 12 }, // Leave Type
    { wch: 15 }, // Start Date
    { wch: 15 }, // End Date
    { wch: 12 }, // Total Days
    { wch: 12 }, // Status
    { wch: 20 }, // Submitted At
    { wch: 20 }, // Approved At
    { wch: 25 }, // Approved By
    { wch: 20 }, // Rejected At
    { wch: 30 }, // Rejection Reason
    { wch: 40 }  // Reason
  ]

  return worksheet
}

/**
 * Sheet 4: Analytics - Leave patterns and trends
 */
function createAnalyticsSheet(data: LeaveReportData): XLSX.WorkSheet {
  const balanceArray = Object.values(data.balances)

  // Top utilizers
  const topUtilizers = balanceArray
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

  const worksheet = XLSX.utils.aoa_to_sheet(analyticsData)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Staff Name / Month
    { wch: 18 }, // Utilization (%) / Request Count
    { wch: 15 }  // Used Days / Available Days / Total Days
  ]

  return worksheet
}

// ============================================================================
// PDF EXPORT - ENTERPRISE GRADE (HTML-based approach)
// ============================================================================

/**
 * Generate printer-friendly PDF report using browser print functionality
 * Optimized for A4 paper with proper page breaks and formatting
 */
export function exportLeaveReportToPDF(data: LeaveReportData): void {
  const balanceArray = Object.values(data.balances)

  const totalEntitlement = balanceArray.reduce((sum, b) => sum + b.entitlement, 0)
  const totalUsed = balanceArray.reduce((sum, b) => sum + b.used_days, 0)
  const totalPending = balanceArray.reduce((sum, b) => sum + b.pending_days, 0)
  const totalAvailable = balanceArray.reduce((sum, b) => sum + b.available_days, 0)
  const avgUtilization = totalEntitlement > 0 ? (totalUsed / totalEntitlement) * 100 : 0

  // Create user lookup map for approver names
  const userMap = new Map(
    (data.users || []).map(u => [u.id, u.entity_name])
  )

  // Create HTML content for printer-friendly PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Leave Management Report - ${data.organizationName || 'HERA Organization'}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm 10mm;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          .no-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 10px;
          line-height: 1.4;
          color: #1a1a1a;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 25px;
          border-bottom: 2px solid #D4AF37;
          padding-bottom: 12px;
        }
        .header h1 {
          color: #1a1a1a;
          margin: 0 0 5px 0;
          font-size: 20px;
          font-weight: 700;
        }
        .header p {
          margin: 3px 0;
          color: #555;
          font-size: 9px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 25px;
        }
        .summary-card {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          background: #f8f8f8;
          text-align: center;
        }
        .summary-card h3 {
          margin: 0 0 8px 0;
          font-size: 9px;
          color: #666;
          text-transform: uppercase;
          font-weight: 600;
        }
        .summary-card .value {
          font-size: 20px;
          font-weight: bold;
          color: #1a1a1a;
        }
        .summary-card .unit {
          font-size: 8px;
          color: #999;
          margin-top: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 9px;
        }
        th {
          background: #1a1a1a;
          color: white;
          padding: 8px 6px;
          text-align: left;
          font-weight: 600;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        td {
          padding: 6px 6px;
          border-bottom: 1px solid #e5e5e5;
        }
        tr:nth-child(even) {
          background: #fafafa;
        }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 15px 0 10px 0;
          border-bottom: 2px solid #D4AF37;
          padding-bottom: 4px;
        }
        .subsection-title {
          font-size: 11px;
          font-weight: 600;
          color: #555;
          margin: 12px 0 8px 0;
          padding-left: 3px;
          border-left: 3px solid #D4AF37;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          color: #999;
          font-size: 8px;
          border-top: 1px solid #ddd;
          padding-top: 8px;
        }
        .analytics-section {
          margin-bottom: 20px;
        }
        .analytics-table {
          font-size: 9px;
        }
        .highlight {
          background: #fff9e6;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <!-- HEADER -->
      <div class="header no-break">
        <h1>LEAVE MANAGEMENT REPORT</h1>
        <p><strong>${data.organizationName || 'HERA Organization'}</strong></p>
        <p>Report Period: ${data.filters?.startDate ? format(new Date(data.filters.startDate), 'dd MMM yyyy') : 'All Time'} - ${data.filters?.endDate ? format(new Date(data.filters.endDate), 'dd MMM yyyy') : 'Present'}</p>
        <p>Generated: ${data.generatedAt}</p>
      </div>

      <!-- SUMMARY STATISTICS -->
      <div class="no-break">
        <h2 class="section-title">Summary Statistics</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Entitlement</h3>
            <div class="value">${totalEntitlement.toFixed(1)}</div>
            <div class="unit">days</div>
          </div>
          <div class="summary-card">
            <h3>Total Used</h3>
            <div class="value">${totalUsed.toFixed(1)}</div>
            <div class="unit">days</div>
          </div>
          <div class="summary-card">
            <h3>Total Pending</h3>
            <div class="value">${totalPending.toFixed(1)}</div>
            <div class="unit">days</div>
          </div>
          <div class="summary-card">
            <h3>Avg Utilization</h3>
            <div class="value">${avgUtilization.toFixed(1)}%</div>
            <div class="unit">of entitlement</div>
          </div>
        </div>
      </div>

      <!-- STAFF BALANCES TABLE -->
      <h2 class="section-title">Staff Leave Balances</h2>
      <table>
        <thead>
          <tr>
            <th>Staff Name</th>
            <th>Policy</th>
            <th>Method</th>
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
                <td style="font-size: 8px;">${balance.accrual_method === 'MONTHLY' ? 'Monthly' : 'Immediate'}</td>
                <td>${balance.entitlement.toFixed(1)}</td>
                <td>${balance.used_days.toFixed(1)}</td>
                <td>${balance.pending_days.toFixed(1)}</td>
                <td>${balance.available_days.toFixed(1)}</td>
                <td><strong>${utilization}%</strong></td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>

      <!-- PAGE BREAK -->
      <div class="page-break"></div>

      <!-- LEAVE REQUESTS TABLE -->
      <h2 class="section-title">Leave Requests Detail</h2>
      <table>
        <thead>
          <tr>
            <th>Request Code</th>
            <th>Staff Name</th>
            <th>Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Days</th>
            <th>Status</th>
            <th>Approved By</th>
          </tr>
        </thead>
        <tbody>
          ${data.requests.map(request => {
            // ✅ Use stored approver name (from metadata) - eliminates USER entity lookup
            const approverName = request.approved_by_name ||
                                (request.approved_by ? (userMap.get(request.approved_by) || request.approved_by.substring(0, 8)) : '-')
            return `
            <tr>
              <td style="font-size: 8px;">${request.transaction_code}</td>
              <td><strong>${request.staff_name}</strong></td>
              <td>${request.leave_type}</td>
              <td>${format(new Date(request.start_date), 'dd MMM yy')}</td>
              <td>${format(new Date(request.end_date), 'dd MMM yy')}</td>
              <td style="text-align: center;"><strong>${request.total_days}</strong></td>
              <td><span class="${request.status === 'approved' ? 'highlight' : ''}">${request.status.toUpperCase()}</span></td>
              <td style="font-size: 8px;">${approverName}</td>
            </tr>
            `
          }).join('')}
        </tbody>
      </table>

      <!-- FOOTER -->
      <div class="footer">
        <p>This report is confidential and intended for internal use only.</p>
        <p>Generated by HERA ERP System - Leave Management Module | ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
      </div>
    </body>
    </html>
  `

  // Open in new window and trigger print
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load, then print
    printWindow.onload = () => {
      // Small delay to ensure styles are loaded
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  } else {
    alert('Pop-up blocked. Please allow pop-ups for this site to print the report.')
  }
}
