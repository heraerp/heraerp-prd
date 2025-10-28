/**
 * 🏢 DETAILED ANNUAL LEAVE REPORT - MATCHING ENTERPRISE FORMAT
 *
 * Generates a professional leave report similar to standard HR reports
 * with summary statistics and detailed leave breakdown by employee
 */

import * as XLSX from 'xlsx'
import { LeaveRequest, LeaveBalance } from '@/hooks/useHeraLeave'
import { format, isWithinInterval, parseISO } from 'date-fns'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DetailedReportFilters {
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  leaveType?: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER' | 'all'
  status?: 'approved' | 'rejected' | 'submitted' | 'draft' | 'cancelled' | 'all'
  policyId?: string
}

export interface DetailedReportData {
  organizationName: string
  policyName: string
  startDate: string
  endDate: string
  staff: Array<{ id: string; entity_name: string; department?: string }>
  requests: LeaveRequest[]
  balances: Record<string, LeaveBalance>
  filters: DetailedReportFilters
}

export interface EmployeeLeaveDetail {
  employeeName: string
  department: string
  leaveRequests: Array<{
    leaveType: string
    startDate: string
    endDate: string
    days: number
    status: string
  }>
  totalDaysTaken: number
  totalDaysPending: number
}

// ============================================================================
// EXCEL EXPORT - DETAILED ANNUAL LEAVE REPORT
// ============================================================================

/**
 * Generate detailed annual leave report matching the provided format
 */
export function exportDetailedLeaveReport(data: DetailedReportData): void {
  const workbook = XLSX.utils.book_new()

  // Create the detailed report sheet
  const reportSheet = createDetailedReportSheet(data)
  XLSX.utils.book_append_sheet(workbook, reportSheet, 'Annual Leave Report')

  // Generate filename with date range
  const startDateFormatted = format(parseISO(data.startDate), 'yyyy-MM-dd')
  const endDateFormatted = format(parseISO(data.endDate), 'yyyy-MM-dd')
  const filename = `Annual-Leave-Report-${startDateFormatted}-to-${endDateFormatted}.xlsx`

  // Download file
  XLSX.writeFile(workbook, filename)
}

/**
 * Create detailed report sheet matching the enterprise format
 */
function createDetailedReportSheet(data: DetailedReportData): XLSX.WorkSheet {
  // Filter requests by date range
  const filteredRequests = data.requests.filter(request => {
    // Skip requests with invalid dates
    if (!request.start_date || !request.end_date) {
      console.warn('[leaveReportDetailed] Skipping request with invalid dates:', request)
      return false
    }

    const requestStart = parseISO(request.start_date)
    const requestEnd = parseISO(request.end_date)
    const periodStart = parseISO(data.startDate)
    const periodEnd = parseISO(data.endDate)

    // Include if request overlaps with period
    return (
      isWithinInterval(requestStart, { start: periodStart, end: periodEnd }) ||
      isWithinInterval(requestEnd, { start: periodStart, end: periodEnd }) ||
      (requestStart <= periodStart && requestEnd >= periodEnd)
    )
  })

  // Apply additional filters
  let processedRequests = filteredRequests

  if (data.filters.leaveType && data.filters.leaveType !== 'all') {
    processedRequests = processedRequests.filter(r => r.leave_type === data.filters.leaveType)
  }

  if (data.filters.status && data.filters.status !== 'all') {
    processedRequests = processedRequests.filter(r => r.status === data.filters.status)
  }

  // Calculate summary statistics
  const totalEmployees = data.staff.length
  const totalLeaveTaken = processedRequests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.total_days, 0)
  const totalPending = processedRequests
    .filter(r => r.status === 'submitted')
    .reduce((sum, r) => sum + r.total_days, 0)
  const totalAvailable = Object.values(data.balances).reduce(
    (sum, b) => sum + b.available_days,
    0
  )
  const avgPerEmployee = totalEmployees > 0 ? totalLeaveTaken / totalEmployees : 0

  // Build employee details
  const employeeDetails: EmployeeLeaveDetail[] = data.staff.map(staffMember => {
    const staffRequests = processedRequests.filter(r => r.staff_id === staffMember.id)
    const balance = data.balances[staffMember.id]

    return {
      employeeName: staffMember.entity_name,
      department: staffMember.department || 'N/A',
      leaveRequests: staffRequests.map(r => ({
        leaveType: r.leave_type,
        startDate: r.start_date,
        endDate: r.end_date,
        days: r.total_days,
        status: r.status.toUpperCase()
      })),
      totalDaysTaken: staffRequests
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + r.total_days, 0),
      totalDaysPending: staffRequests
        .filter(r => r.status === 'submitted')
        .reduce((sum, r) => sum + r.total_days, 0)
    }
  })

  // Build report data array
  const reportData = [
    // Header
    [data.organizationName],
    [],
    ['ANNUAL LEAVE REPORT - DETAILED'],
    [],
    [`Report Period: ${format(parseISO(data.startDate), 'dd/MM/yyyy')} - ${format(parseISO(data.endDate), 'dd/MM/yyyy')}`],
    [`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`],
    [`Policy: ${data.policyName}`],
    [],
    // Summary Statistics
    ['SUMMARY STATISTICS'],
    [],
    ['Total Employees:', totalEmployees, '', 'Total Leave Taken:', `${totalLeaveTaken} days`, '', 'Average per Employee:', `${avgPerEmployee.toFixed(1)} days`],
    ['Total Available:', `${totalAvailable} days`, '', 'Total Pending:', `${totalPending} days`],
    [],
    [],
    // Detail Table Header
    ['Employee', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status'],
    []
  ]

  // Add employee details
  employeeDetails.forEach(employee => {
    if (employee.leaveRequests.length > 0) {
      // Add employee with their first request
      const firstRequest = employee.leaveRequests[0]
      reportData.push([
        employee.employeeName,
        employee.department,
        firstRequest.leaveType,
        format(parseISO(firstRequest.startDate), 'dd/MM/yyyy'),
        format(parseISO(firstRequest.endDate), 'dd/MM/yyyy'),
        firstRequest.days,
        firstRequest.status
      ])

      // Add additional requests for the same employee (empty name column)
      for (let i = 1; i < employee.leaveRequests.length; i++) {
        const request = employee.leaveRequests[i]
        reportData.push([
          '',
          '',
          request.leaveType,
          format(parseISO(request.startDate), 'dd/MM/yyyy'),
          format(parseISO(request.endDate), 'dd/MM/yyyy'),
          request.days,
          request.status
        ])
      }
    } else {
      // Employee with no leave taken
      reportData.push([
        employee.employeeName,
        employee.department,
        'No Leave Taken',
        '-',
        '-',
        0,
        '-'
      ])
    }

    // Add empty row between employees
    reportData.push([])
  })

  const worksheet = XLSX.utils.aoa_to_sheet(reportData)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Employee
    { wch: 15 }, // Department
    { wch: 12 }, // Leave Type
    { wch: 12 }, // Start Date
    { wch: 12 }, // End Date
    { wch: 8 },  // Days
    { wch: 12 }  // Status
  ]

  return worksheet
}

// ============================================================================
// PDF EXPORT - DETAILED ANNUAL LEAVE REPORT
// ============================================================================

/**
 * Generate detailed PDF report matching the enterprise format
 */
export function exportDetailedLeaveReportPDF(data: DetailedReportData): void {
  // Filter requests by date range
  const filteredRequests = data.requests.filter(request => {
    // Skip requests with invalid dates
    if (!request.start_date || !request.end_date) {
      console.warn('[leaveReportDetailed] PDF: Skipping request with invalid dates:', request)
      return false
    }

    const requestStart = parseISO(request.start_date)
    const requestEnd = parseISO(request.end_date)
    const periodStart = parseISO(data.startDate)
    const periodEnd = parseISO(data.endDate)

    return (
      isWithinInterval(requestStart, { start: periodStart, end: periodEnd }) ||
      isWithinInterval(requestEnd, { start: periodStart, end: periodEnd }) ||
      (requestStart <= periodStart && requestEnd >= periodEnd)
    )
  })

  // Apply additional filters
  let processedRequests = filteredRequests

  if (data.filters.leaveType && data.filters.leaveType !== 'all') {
    processedRequests = processedRequests.filter(r => r.leave_type === data.filters.leaveType)
  }

  if (data.filters.status && data.filters.status !== 'all') {
    processedRequests = processedRequests.filter(r => r.status === data.filters.status)
  }

  // Calculate summary statistics
  const totalEmployees = data.staff.length
  const totalLeaveTaken = processedRequests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.total_days, 0)
  const totalPending = processedRequests
    .filter(r => r.status === 'submitted')
    .reduce((sum, r) => sum + r.total_days, 0)
  const totalAvailable = Object.values(data.balances).reduce(
    (sum, b) => sum + b.available_days,
    0
  )
  const avgPerEmployee = totalEmployees > 0 ? (totalLeaveTaken / totalEmployees).toFixed(1) : '0'

  // Build employee details
  const employeeDetails: EmployeeLeaveDetail[] = data.staff.map(staffMember => {
    const staffRequests = processedRequests.filter(r => r.staff_id === staffMember.id)

    return {
      employeeName: staffMember.entity_name,
      department: staffMember.department || 'N/A',
      leaveRequests: staffRequests.map(r => ({
        leaveType: r.leave_type,
        startDate: r.start_date,
        endDate: r.end_date,
        days: r.total_days,
        status: r.status.toUpperCase()
      })),
      totalDaysTaken: staffRequests
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + r.total_days, 0),
      totalDaysPending: staffRequests
        .filter(r => r.status === 'submitted')
        .reduce((sum, r) => sum + r.total_days, 0)
    }
  })

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Annual Leave Report - Detailed</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          .page-break { page-break-before: always; }
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #000;
        }
        .header {
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 18px;
          margin: 0 0 10px 0;
          text-align: center;
          border-bottom: 3px solid #000;
          padding-bottom: 10px;
        }
        .org-name {
          font-size: 14px;
          margin-bottom: 5px;
        }
        .report-info {
          font-size: 10px;
          margin: 3px 0;
        }
        .summary-box {
          border: 2px solid #000;
          padding: 15px;
          margin: 20px 0;
        }
        .summary-title {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 10px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
        }
        .summary-label {
          font-weight: normal;
        }
        .summary-value {
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #f0f0f0;
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          font-weight: bold;
          font-size: 10px;
        }
        td {
          border: 1px solid #000;
          padding: 6px 8px;
          font-size: 10px;
        }
        .employee-name {
          font-weight: bold;
        }
        .no-leave {
          font-style: italic;
          color: #666;
        }
        tr.employee-row td {
          border-top: 2px solid #000;
        }
      </style>
    </head>
    <body>
      <!-- HEADER -->
      <div class="header">
        <div class="org-name">${data.organizationName}</div>
        <h1>ANNUAL LEAVE REPORT - DETAILED</h1>
        <div class="report-info">Report Period: ${format(parseISO(data.startDate), 'dd/MM/yyyy')} - ${format(parseISO(data.endDate), 'dd/MM/yyyy')}</div>
        <div class="report-info">Generated: ${format(new Date(), 'MMMM dd, yyyy')}</div>
        <div class="report-info">Policy: ${data.policyName}</div>
      </div>

      <!-- SUMMARY STATISTICS -->
      <div class="summary-box">
        <div class="summary-title">SUMMARY STATISTICS</div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Total Employees:</span>
            <span class="summary-value">${totalEmployees}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Leave Taken:</span>
            <span class="summary-value">${totalLeaveTaken} days</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Average per Employee:</span>
            <span class="summary-value">${avgPerEmployee} days</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Available:</span>
            <span class="summary-value">${totalAvailable} days</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Pending:</span>
            <span class="summary-value">${totalPending} days</span>
          </div>
        </div>
      </div>

      <!-- DETAIL TABLE -->
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th>Leave Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Days</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${employeeDetails.map(employee => {
            if (employee.leaveRequests.length > 0) {
              return employee.leaveRequests.map((request, index) => `
                <tr ${index === 0 ? 'class="employee-row"' : ''}>
                  <td ${index === 0 ? 'class="employee-name"' : ''}>${index === 0 ? employee.employeeName : ''}</td>
                  <td>${index === 0 ? employee.department : ''}</td>
                  <td>${request.leaveType}</td>
                  <td>${format(parseISO(request.startDate), 'dd/MM/yyyy')}</td>
                  <td>${format(parseISO(request.endDate), 'dd/MM/yyyy')}</td>
                  <td>${request.days}</td>
                  <td>${request.status}</td>
                </tr>
              `).join('')
            } else {
              return `
                <tr class="employee-row">
                  <td class="employee-name">${employee.employeeName}</td>
                  <td>${employee.department}</td>
                  <td class="no-leave">No Leave Taken</td>
                  <td>-</td>
                  <td>-</td>
                  <td>0</td>
                  <td>-</td>
                </tr>
              `
            }
          }).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  // Open in new window and trigger print
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}
