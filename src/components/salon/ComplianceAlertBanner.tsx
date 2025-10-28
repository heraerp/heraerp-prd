'use client'

import { AlertTriangle, FileText, Calendar, ChevronRight, X } from 'lucide-react'
import { useStaffComplianceAlerts } from '@/hooks/useStaffComplianceAlerts'
import { useState } from 'react'
import Link from 'next/link'

interface ComplianceAlertBannerProps {
  organizationId: string
  onViewDetails?: () => void
}

/**
 * COMPLIANCE ALERT BANNER COMPONENT
 *
 * Displays critical alerts for staff document expiration on the dashboard.
 * Shows a summary of expired/expiring documents with action button.
 *
 * Features:
 * - Real-time monitoring of visa and insurance expiration
 * - Color-coded severity (red for expired, amber for expiring soon)
 * - Dismissible for current session
 * - Quick navigation to staff management
 *
 * @example
 * <ComplianceAlertBanner organizationId={org.id} />
 */
export function ComplianceAlertBanner({ organizationId, onViewDetails }: ComplianceAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const { alerts, stats, isLoading, hasCriticalAlerts } = useStaffComplianceAlerts({
    organizationId,
    includeArchived: false // Only show alerts for active staff
  })

  // Don't show banner if loading, no alerts, or dismissed
  if (isLoading || !hasCriticalAlerts || dismissed) return null

  // Determine banner color based on severity
  const hasExpired = stats.expiredCount > 0
  const backgroundColor = hasExpired ? '#DC262620' : '#F59E0B20'
  const borderColor = hasExpired ? '#DC2626' : '#F59E0B'
  const textColor = hasExpired ? '#DC2626' : '#F59E0B'
  const iconColor = hasExpired ? '#DC2626' : '#F59E0B'

  return (
    <div
      className="relative rounded-xl border-2 p-5 mb-6 animate-in fade-in slide-in-from-top-2"
      style={{
        backgroundColor,
        borderColor,
        boxShadow: `0 4px 12px ${borderColor}20`
      }}
    >
      {/* Dismiss Button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:scale-110 transition-transform"
        style={{
          backgroundColor: `${borderColor}20`,
          color: textColor
        }}
        aria-label="Dismiss alert"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4 pr-8">
        {/* Alert Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${borderColor}30`,
            border: `2px solid ${borderColor}`,
            boxShadow: `0 4px 12px ${borderColor}30`
          }}
        >
          <AlertTriangle className="h-6 w-6" style={{ color: iconColor }} />
        </div>

        {/* Alert Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3
              className="text-lg font-bold tracking-tight"
              style={{ color: textColor }}
            >
              {hasExpired ? '🚨 Critical: Staff Documents Expired' : '⚠️ Warning: Documents Expiring Soon'}
            </h3>
          </div>

          <p className="text-sm mb-3" style={{ color: '#E0E0E0', opacity: 0.9 }}>
            {hasExpired ? (
              <>
                <strong>{stats.expiredCount}</strong> staff document{stats.expiredCount !== 1 ? 's have' : ' has'}{' '}
                expired and require immediate renewal.
                {stats.criticalCount > 0 && (
                  <> Additionally, <strong>{stats.criticalCount}</strong> document{stats.criticalCount !== 1 ? 's' : ''}{' '}
                  expire{stats.criticalCount !== 1 ? '' : 's'} within 7 days.</>
                )}
              </>
            ) : (
              <>
                <strong>{stats.criticalCount}</strong> staff document{stats.criticalCount !== 1 ? 's' : ''}{' '}
                expire{stats.criticalCount !== 1 ? '' : 's'} within 7 days.
                {stats.warningCount > 0 && (
                  <> <strong>{stats.warningCount}</strong> more expire{stats.warningCount !== 1 ? '' : 's'} within 30 days.</>
                )}
              </>
            )}
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mb-4">
            {stats.expiredCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#DC2626' }}
                />
                <span style={{ color: '#E0E0E0' }}>
                  <strong style={{ color: '#DC2626' }}>{stats.expiredCount}</strong> Expired
                </span>
              </div>
            )}
            {stats.criticalCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#F59E0B' }}
                />
                <span style={{ color: '#E0E0E0' }}>
                  <strong style={{ color: '#F59E0B' }}>{stats.criticalCount}</strong> Critical (≤7 days)
                </span>
              </div>
            )}
            {stats.warningCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#F59E0B' }}
                />
                <span style={{ color: '#E0E0E0' }}>
                  <strong style={{ color: '#F59E0B' }}>{stats.warningCount}</strong> Warning (≤30 days)
                </span>
              </div>
            )}
          </div>

          {/* Show first few alerts */}
          {alerts.slice(0, 3).length > 0 && (
            <div className="space-y-2 mb-4">
              {alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 p-2 rounded-lg"
                  style={{
                    backgroundColor: '#1A1A1A80',
                    border: `1px solid ${borderColor}40`
                  }}
                >
                  {alert.documentType === 'visa' ? (
                    <FileText className="h-4 w-4 flex-shrink-0" style={{ color: iconColor }} />
                  ) : (
                    <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: iconColor }} />
                  )}
                  <span className="text-sm flex-1" style={{ color: '#E0E0E0' }}>
                    <strong style={{ color: '#F5E6C8' }}>{alert.staffName}</strong> -{' '}
                    {alert.message}
                  </span>
                </div>
              ))}
              {alerts.length > 3 && (
                <p className="text-xs text-center" style={{ color: '#E0E0E0', opacity: 0.7 }}>
                  +{alerts.length - 3} more alert{alerts.length - 3 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Action Button */}
          <Link href="/salon/staffs">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: borderColor,
                color: hasExpired ? '#FFFFFF' : '#000000',
                boxShadow: `0 4px 12px ${borderColor}40`
              }}
              onClick={onViewDetails}
            >
              <FileText className="h-4 w-4" />
              View Staff & Renew Documents
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
