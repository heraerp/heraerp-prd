/**
 * Staff Compliance Alerts Hook
 *
 * Monitors staff document expiration (visa, insurance) and provides alerts
 * for documents expiring within 30 days or already expired.
 *
 * Used for: Dashboard notifications, compliance monitoring
 */

import { useMemo } from 'react'
import { useHeraStaff, StaffMember } from './useHeraStaff'

export interface ComplianceAlert {
  id: string
  staffId: string
  staffName: string
  documentType: 'visa' | 'insurance'
  expiryDate: string
  daysRemaining: number
  severity: 'critical' | 'warning' | 'expired'
  message: string
}

export interface ComplianceStats {
  totalAlerts: number
  expiredCount: number
  warningCount: number
  criticalCount: number
  affectedStaffCount: number
}

/**
 * Calculate expiration status for a date
 */
function getExpirationInfo(expDate: string | undefined): {
  daysRemaining: number
  severity: 'expired' | 'critical' | 'warning' | 'valid'
  isAlert: boolean
} {
  if (!expDate) {
    return { daysRemaining: 999, severity: 'valid', isAlert: false }
  }

  const exp = new Date(expDate)
  const now = new Date()
  const diffTime = exp.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { daysRemaining: diffDays, severity: 'expired', isAlert: true }
  } else if (diffDays <= 7) {
    return { daysRemaining: diffDays, severity: 'critical', isAlert: true }
  } else if (diffDays <= 30) {
    return { daysRemaining: diffDays, severity: 'warning', isAlert: true }
  } else {
    return { daysRemaining: diffDays, severity: 'valid', isAlert: false }
  }
}

export interface UseStaffComplianceAlertsOptions {
  organizationId?: string
  includeArchived?: boolean
  filters?: {
    branch_id?: string
  }
}

export function useStaffComplianceAlerts(options?: UseStaffComplianceAlertsOptions) {
  // Fetch all active staff (or include archived if requested)
  const { staff, isLoading, error } = useHeraStaff({
    organizationId: options?.organizationId,
    includeArchived: options?.includeArchived || false,
    filters: {
      include_dynamic: true,
      include_relationships: false, // Don't need relationships for compliance check
      ...options?.filters
    }
  })

  // Generate compliance alerts from staff data
  const alerts = useMemo(() => {
    if (!staff) return []

    const complianceAlerts: ComplianceAlert[] = []

    staff.forEach((member: StaffMember) => {
      const staffName = member.entity_name || `${member.first_name || ''} ${member.last_name || ''}`.trim()

      // Check visa expiration
      if (member.visa_exp_date) {
        const visaInfo = getExpirationInfo(member.visa_exp_date)
        if (visaInfo.isAlert) {
          complianceAlerts.push({
            id: `${member.id}-visa`,
            staffId: member.id,
            staffName,
            documentType: 'visa',
            expiryDate: member.visa_exp_date,
            daysRemaining: visaInfo.daysRemaining,
            severity: visaInfo.severity,
            message: visaInfo.daysRemaining < 0
              ? `Visa expired ${Math.abs(visaInfo.daysRemaining)} days ago`
              : `Visa expires in ${visaInfo.daysRemaining} day${visaInfo.daysRemaining !== 1 ? 's' : ''}`
          })
        }
      }

      // Check insurance expiration
      if (member.insurance_exp_date) {
        const insuranceInfo = getExpirationInfo(member.insurance_exp_date)
        if (insuranceInfo.isAlert) {
          complianceAlerts.push({
            id: `${member.id}-insurance`,
            staffId: member.id,
            staffName,
            documentType: 'insurance',
            expiryDate: member.insurance_exp_date,
            daysRemaining: insuranceInfo.daysRemaining,
            severity: insuranceInfo.severity,
            message: insuranceInfo.daysRemaining < 0
              ? `Insurance expired ${Math.abs(insuranceInfo.daysRemaining)} days ago`
              : `Insurance expires in ${insuranceInfo.daysRemaining} day${insuranceInfo.daysRemaining !== 1 ? 's' : ''}`
          })
        }
      }
    })

    // Sort by severity (expired first, then critical, then warning) and days remaining
    return complianceAlerts.sort((a, b) => {
      const severityOrder = { expired: 0, critical: 1, warning: 2 }
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff

      // Within same severity, sort by days remaining (ascending - most urgent first)
      return a.daysRemaining - b.daysRemaining
    })
  }, [staff])

  // Calculate statistics
  const stats: ComplianceStats = useMemo(() => {
    const expiredCount = alerts.filter(a => a.severity === 'expired').length
    const criticalCount = alerts.filter(a => a.severity === 'critical').length
    const warningCount = alerts.filter(a => a.severity === 'warning').length

    // Count unique staff with alerts
    const affectedStaffIds = new Set(alerts.map(a => a.staffId))

    return {
      totalAlerts: alerts.length,
      expiredCount,
      criticalCount,
      warningCount,
      affectedStaffCount: affectedStaffIds.size
    }
  }, [alerts])

  // Filter functions for convenience
  const getExpiredAlerts = () => alerts.filter(a => a.severity === 'expired')
  const getCriticalAlerts = () => alerts.filter(a => a.severity === 'critical')
  const getWarningAlerts = () => alerts.filter(a => a.severity === 'warning')
  const getAlertsForStaff = (staffId: string) => alerts.filter(a => a.staffId === staffId)

  return {
    alerts,
    stats,
    isLoading,
    error,
    // Convenience filters
    expiredAlerts: getExpiredAlerts(),
    criticalAlerts: getCriticalAlerts(),
    warningAlerts: getWarningAlerts(),
    // Helper functions
    getAlertsForStaff,
    hasAlerts: alerts.length > 0,
    hasCriticalAlerts: stats.expiredCount > 0 || stats.criticalCount > 0
  }
}
