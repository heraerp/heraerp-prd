'use client'

import React from 'react'
import { AlertTriangle, Building2, UserX, Users, ShoppingBag, Calendar } from 'lucide-react'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface ValidationIssue {
  type: 'branch' | 'customer' | 'staff' | 'items' | 'appointment'
  message: string
  action?: string
}

interface ValidationWarningModalProps {
  open: boolean
  onClose: () => void
  issues: ValidationIssue[]
}

/**
 * SALON LUXE VALIDATION WARNING MODAL
 *
 * Enterprise-grade validation warnings with salon luxe theme.
 * Shows missing required details before payment processing.
 *
 * Features:
 * - Rose/red gradient for warning state
 * - Icon-based issue categorization
 * - Action hints for resolving issues
 * - Glassmorphism styling
 */
export function ValidationWarningModal({
  open,
  onClose,
  issues
}: ValidationWarningModalProps) {
  const getIssueIcon = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'branch':
        return <Building2 className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.danger.base }} />
      case 'customer':
        return <UserX className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.danger.base }} />
      case 'staff':
        return <Users className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.danger.base }} />
      case 'items':
        return <ShoppingBag className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.danger.base }} />
      case 'appointment':
        return <Calendar className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.danger.base }} />
      default:
        return <AlertTriangle className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.danger.base }} />
    }
  }

  return (
    <SalonLuxeModal
      open={open}
      onClose={onClose}
      title="Payment Requirements"
      description="Please complete the following to process payment"
      icon={<AlertTriangle className="w-6 h-6" />}
      size="md"
      footer={
        <SalonLuxeButton
          variant="danger"
          onClick={onClose}
          className="w-full"
        >
          Got it, I'll complete these
        </SalonLuxeButton>
      }
    >
      <div className="space-y-4 py-4">
        {/* Warning Header */}
        <div
          className="p-4 rounded-xl border"
          style={{
            background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.danger.lighter} 0%, ${SALON_LUXE_COLORS.danger.light} 100%)`,
            borderColor: SALON_LUXE_COLORS.danger.border,
            boxShadow: `0 4px 16px ${SALON_LUXE_COLORS.shadow.danger}`
          }}
        >
          <p className="text-sm font-medium" style={{ color: SALON_LUXE_COLORS.text.primary }}>
            {issues.length} {issues.length === 1 ? 'requirement' : 'requirements'} must be completed before processing payment
          </p>
        </div>

        {/* Issues List */}
        <div className="space-y-3">
          {issues.map((issue, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-lg border transition-all duration-300 cursor-pointer group"
              style={{
                backgroundColor: SALON_LUXE_COLORS.charcoal.base,
                borderColor: SALON_LUXE_COLORS.danger.borderLight,
                transitionProperty: 'all',
                transitionDuration: '300ms',
                transitionTimingFunction: 'ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = SALON_LUXE_COLORS.danger.border
                e.currentTarget.style.backgroundColor = SALON_LUXE_COLORS.danger.lighter
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = SALON_LUXE_COLORS.danger.borderLight
                e.currentTarget.style.backgroundColor = SALON_LUXE_COLORS.charcoal.base
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <div
                className="p-2 rounded-lg shrink-0"
                style={{
                  backgroundColor: SALON_LUXE_COLORS.danger.lighter,
                  border: `1px solid ${SALON_LUXE_COLORS.danger.borderLight}`
                }}
              >
                {getIssueIcon(issue.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-1" style={{ color: SALON_LUXE_COLORS.text.primary }}>
                  {issue.message}
                </p>
                {issue.action && (
                  <p className="text-xs" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                    💡 {issue.action}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise Policy Note */}
        <div
          className="p-3 rounded-lg border"
          style={{
            backgroundColor: `${SALON_LUXE_COLORS.plum.base}10`,
            borderColor: `${SALON_LUXE_COLORS.plum.base}30`
          }}
        >
          <p className="text-xs" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
            <span className="font-semibold" style={{ color: SALON_LUXE_COLORS.plum.base }}>
              Enterprise Policy:
            </span>{' '}
            Every sale must be linked to branch, staff, customer, and service/product for complete audit trails and business intelligence.
          </p>
        </div>
      </div>
    </SalonLuxeModal>
  )
}
