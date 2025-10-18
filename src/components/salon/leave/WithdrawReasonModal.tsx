'use client'

import React, { useState } from 'react'
import { SalonLuxeModal } from '../shared/SalonLuxeModal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, Ban } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

const COLORS = {
  charcoal: SALON_LUXE_COLORS.charcoal.base,
  charcoalDark: SALON_LUXE_COLORS.charcoal.dark,
  gold: SALON_LUXE_COLORS.gold.base,
  goldDark: SALON_LUXE_COLORS.gold.dark,
  champagne: SALON_LUXE_COLORS.champagne.base,
  bronze: '#8C7853',
  amber: '#D97706',
  lightText: SALON_LUXE_COLORS.text.primary
}

interface WithdrawReasonModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void
  staffName: string
  loading?: boolean
}

export function WithdrawReasonModal({
  open,
  onClose,
  onConfirm,
  staffName,
  loading = false
}: WithdrawReasonModalProps) {
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    onConfirm(reason.trim() || undefined)
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <SalonLuxeModal
      open={open}
      onClose={handleClose}
      title="Withdraw Leave Request"
      size="md"
    >
      <div className="space-y-6">
        {/* Warning Banner */}
        <div
          className="p-4 rounded-xl border flex items-start gap-3"
          style={{
            backgroundColor: `${COLORS.amber}15`,
            borderColor: `${COLORS.amber}40`
          }}
        >
          <AlertCircle size={20} style={{ color: COLORS.amber, flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p className="font-semibold text-sm mb-1" style={{ color: COLORS.champagne }}>
              You are about to withdraw <span style={{ color: COLORS.amber }}>{staffName}'s</span> leave request
            </p>
            <p className="text-sm" style={{ color: COLORS.bronze }}>
              This action will cancel the leave request. You may optionally provide a reason.
            </p>
          </div>
        </div>

        {/* Withdrawal Reason Input (Optional) */}
        <div className="space-y-2">
          <Label
            htmlFor="withdrawal-reason"
            className="text-sm font-semibold"
            style={{ color: COLORS.champagne }}
          >
            Reason for Withdrawal (Optional)
          </Label>
          <Textarea
            id="withdrawal-reason"
            placeholder="e.g., Plans changed, found coverage, personal reasons..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="resize-none transition-all duration-200"
            style={{
              backgroundColor: COLORS.charcoalDark,
              borderColor: `${COLORS.bronze}60`,
              color: COLORS.champagne,
              fontSize: '14px'
            }}
            disabled={loading}
            autoFocus
          />
          <p className="text-xs" style={{ color: COLORS.bronze }}>
            {reason.length} / 500 characters
          </p>
        </div>

        {/* Quick Reason Templates */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold" style={{ color: COLORS.bronze }}>
            Quick Templates
          </Label>
          <div className="flex flex-wrap gap-2">
            {[
              'Plans changed',
              'Found coverage',
              'Personal reasons',
              'No longer needed',
              'Rescheduling'
            ].map((template) => (
              <button
                key={template}
                onClick={() => setReason(template)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: `${COLORS.bronze}20`,
                  color: COLORS.champagne,
                  border: `1px solid ${COLORS.bronze}40`,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                {template}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={loading}
            className="flex-1 transition-all duration-200 hover:scale-105"
            style={{
              borderColor: COLORS.bronze,
              color: COLORS.champagne,
              backgroundColor: 'transparent'
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              backgroundImage: loading
                ? `linear-gradient(90deg, ${COLORS.amber}80 0%, ${COLORS.amber}60 100%)`
                : `linear-gradient(90deg, ${COLORS.amber} 0%, #B45309 100%)`,
              color: '#FFFFFF',
              boxShadow: loading ? 'none' : `0 4px 15px ${COLORS.amber}40`,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Withdrawing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Ban size={16} />
                Withdraw Leave Request
              </div>
            )}
          </Button>
        </div>
      </div>
    </SalonLuxeModal>
  )
}
