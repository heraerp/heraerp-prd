/**
 * Staff Compliance Utilities
 *
 * Handles detection of expiring documents and compliance issues
 */

export interface ComplianceIssue {
  staffId: string
  staffName: string
  issueType: 'visa_expiring' | 'insurance_expiring' | 'visa_expired' | 'insurance_expired'
  fieldName: 'visa_exp_date' | 'insurance_exp_date'
  expiryDate: string
  daysRemaining: number
  severity: 'critical' | 'warning' | 'info'
  message: string
}

export interface ComplianceSummary {
  totalIssues: number
  critical: number  // Expired
  warning: number   // Expiring within 30 days
  issues: ComplianceIssue[]
}

/**
 * Calculate days remaining until date
 */
function getDaysRemaining(dateString: string | null | undefined): number | null {
  if (!dateString) return null

  try {
    const expDate = new Date(dateString)
    const now = new Date()
    const diffTime = expDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch (e) {
    return null
  }
}

/**
 * Check if a document is expiring or expired
 */
function checkDocumentExpiry(
  staffId: string,
  staffName: string,
  fieldName: 'visa_exp_date' | 'insurance_exp_date',
  expiryDate: string | null | undefined,
  warningDays: number = 30
): ComplianceIssue | null {
  if (!expiryDate) return null

  const daysRemaining = getDaysRemaining(expiryDate)
  if (daysRemaining === null) return null

  const documentType = fieldName === 'visa_exp_date' ? 'Visa' : 'Insurance'

  // Expired (critical)
  if (daysRemaining < 0) {
    return {
      staffId,
      staffName,
      issueType: fieldName === 'visa_exp_date' ? 'visa_expired' : 'insurance_expired',
      fieldName,
      expiryDate,
      daysRemaining,
      severity: 'critical',
      message: `${documentType} EXPIRED ${Math.abs(daysRemaining)} days ago`
    }
  }

  // Expiring soon (warning)
  if (daysRemaining <= warningDays) {
    return {
      staffId,
      staffName,
      issueType: fieldName === 'visa_exp_date' ? 'visa_expiring' : 'insurance_expiring',
      fieldName,
      expiryDate,
      daysRemaining,
      severity: 'warning',
      message: `${documentType} expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
    }
  }

  return null
}

/**
 * Scan staff list for compliance issues
 *
 * @param staff - Array of staff members with visa_exp_date and insurance_exp_date
 * @param warningDays - Number of days before expiry to show warning (default: 30)
 * @returns Summary of all compliance issues
 */
export function scanStaffCompliance(
  staff: any[],
  warningDays: number = 30
): ComplianceSummary {
  const issues: ComplianceIssue[] = []

  staff.forEach(staffMember => {
    const staffName = staffMember.entity_name ||
                     `${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim() ||
                     'Unknown'

    // Check visa expiry
    const visaIssue = checkDocumentExpiry(
      staffMember.id,
      staffName,
      'visa_exp_date',
      staffMember.visa_exp_date,
      warningDays
    )
    if (visaIssue) issues.push(visaIssue)

    // Check insurance expiry
    const insuranceIssue = checkDocumentExpiry(
      staffMember.id,
      staffName,
      'insurance_exp_date',
      staffMember.insurance_exp_date,
      warningDays
    )
    if (insuranceIssue) issues.push(insuranceIssue)
  })

  // Sort by severity (critical first) then by days remaining
  issues.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1
    if (a.severity !== 'critical' && b.severity === 'critical') return 1
    return a.daysRemaining - b.daysRemaining
  })

  const critical = issues.filter(i => i.severity === 'critical').length
  const warning = issues.filter(i => i.severity === 'warning').length

  return {
    totalIssues: issues.length,
    critical,
    warning,
    issues
  }
}

/**
 * Get color for severity level
 */
export function getSeverityColor(severity: ComplianceIssue['severity']): string {
  switch (severity) {
    case 'critical':
      return '#DC2626' // red-600
    case 'warning':
      return '#F59E0B' // amber-500
    case 'info':
      return '#3B82F6' // blue-500
    default:
      return '#6B7280' // gray-500
  }
}

/**
 * Get icon for issue type
 */
export function getIssueIcon(issueType: ComplianceIssue['issueType']): string {
  if (issueType.includes('visa')) return '🛂'
  if (issueType.includes('insurance')) return '🏥'
  return '⚠️'
}
