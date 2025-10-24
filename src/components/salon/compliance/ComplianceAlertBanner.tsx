'use client'

import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { ComplianceSummary, ComplianceIssue, getSeverityColor, getIssueIcon } from '@/lib/compliance/staff-compliance'

const COLORS = {
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0'
}

interface ComplianceAlertBannerProps {
  compliance: ComplianceSummary
  onStaffClick?: (staffId: string) => void
}

export function ComplianceAlertBanner({ compliance, onStaffClick }: ComplianceAlertBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  if (compliance.totalIssues === 0 || isDismissed) return null

  const criticalCount = compliance.critical
  const warningCount = compliance.warning

  return (
    <div
      className="mb-6 rounded-xl border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500"
      style={{
        backgroundColor: criticalCount > 0 ? '#DC262610' : '#F59E0B10',
        borderColor: criticalCount > 0 ? '#DC262640' : '#F59E0B40',
        boxShadow: `0 4px 12px ${criticalCount > 0 ? '#DC262620' : '#F59E0B20'}`
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: criticalCount > 0 ? '#DC262620' : '#F59E0B20',
              border: `1px solid ${criticalCount > 0 ? '#DC2626' : '#F59E0B'}`
            }}
          >
            <AlertTriangle
              className="w-5 h-5"
              style={{ color: criticalCount > 0 ? '#DC2626' : '#F59E0B' }}
            />
          </div>

          {/* Title & Summary */}
          <div className="flex-1">
            <h3
              className="text-base font-semibold mb-1"
              style={{ color: COLORS.champagne }}
            >
              {criticalCount > 0 ? 'Critical Compliance Issues' : 'Compliance Warnings'}
            </h3>
            <p className="text-sm" style={{ color: COLORS.lightText, opacity: 0.8 }}>
              {criticalCount > 0 && (
                <>
                  <strong style={{ color: '#DC2626' }}>{criticalCount} expired</strong>
                  {warningCount > 0 && ' • '}
                </>
              )}
              {warningCount > 0 && (
                <strong style={{ color: '#F59E0B' }}>{warningCount} expiring soon</strong>
              )}
              {' '}- Staff documents require attention
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: COLORS.charcoal,
                color: COLORS.gold,
                border: `1px solid ${COLORS.gold}40`
              }}
            >
              {isExpanded ? 'Hide' : 'View'} Details
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 inline-block ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 inline-block ml-1" />
              )}
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
              style={{
                backgroundColor: COLORS.charcoal,
                color: COLORS.bronze,
                border: `1px solid ${COLORS.bronze}40`
              }}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div
          className="border-t px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300"
          style={{
            backgroundColor: COLORS.charcoal + '40',
            borderColor: criticalCount > 0 ? '#DC262620' : '#F59E0B20'
          }}
        >
          <div className="mt-4 space-y-2">
            {compliance.issues.map((issue, index) => (
              <ComplianceIssueCard
                key={`${issue.staffId}-${issue.fieldName}-${index}`}
                issue={issue}
                onClick={() => onStaffClick?.(issue.staffId)}
              />
            ))}
          </div>

          {/* Footer Tip */}
          <div
            className="mt-4 p-3 rounded-lg text-xs"
            style={{
              backgroundColor: COLORS.charcoal,
              border: `1px solid ${COLORS.gold}40`,
              color: COLORS.bronze
            }}
          >
            💡 <strong>Tip:</strong> Click on any staff member to open their details and update their documents.
            Keeping documents up to date ensures compliance and avoids legal issues.
          </div>
        </div>
      )}
    </div>
  )
}

function ComplianceIssueCard({
  issue,
  onClick
}: {
  issue: ComplianceIssue
  onClick: () => void
}) {
  const severityColor = getSeverityColor(issue.severity)
  const icon = getIssueIcon(issue.issueType)

  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left"
      style={{
        backgroundColor: COLORS.charcoal,
        borderColor: severityColor + '40',
        borderLeft: `4px solid ${severityColor}`
      }}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className="font-semibold text-sm truncate"
              style={{ color: COLORS.champagne }}
            >
              {issue.staffName}
            </h4>
            <span
              className="px-2 py-0.5 rounded text-xs font-bold flex-shrink-0"
              style={{
                backgroundColor: severityColor + '20',
                color: severityColor
              }}
            >
              {issue.severity === 'critical' ? 'EXPIRED' : 'EXPIRING SOON'}
            </span>
          </div>
          <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.9 }}>
            {issue.message}
          </p>
        </div>

        {/* Days Remaining Badge */}
        <div
          className="flex-shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center"
          style={{
            backgroundColor: severityColor + '20',
            border: `2px solid ${severityColor}60`
          }}
        >
          <div className="text-2xl font-bold" style={{ color: severityColor }}>
            {issue.daysRemaining < 0 ? Math.abs(issue.daysRemaining) : issue.daysRemaining}
          </div>
          <div className="text-xs font-medium" style={{ color: severityColor, opacity: 0.8 }}>
            {issue.daysRemaining < 0 ? 'days ago' : 'days'}
          </div>
        </div>
      </div>
    </button>
  )
}
