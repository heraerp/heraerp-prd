'use client'

import React, { useState, useEffect } from 'react'
import { SalonLuxeModal } from '../shared/SalonLuxeModal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, XCircle } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

const COLORS = {
  charcoal: SALON_LUXE_COLORS.charcoal.base,
  charcoalDark: SALON_LUXE_COLORS.charcoal.dark,
  gold: SALON_LUXE_COLORS.gold.base,
  goldDark: SALON_LUXE_COLORS.gold.dark,
  champagne: SALON_LUXE_COLORS.champagne.base,
  bronze: '#8C7853',
  rose: SALON_LUXE_COLORS.rose.base,
  lightText: SALON_LUXE_COLORS.text.primary
}

interface RejectReasonModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  staffName: string
  loading?: boolean
}

export function RejectReasonModal({
  open,
  onClose,
  onConfirm,
  staffName,
  loading = false
}: RejectReasonModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }
    if (reason.trim().length < 10) {
      setError('Please provide a more detailed reason (at least 10 characters)')
      return
    }
    onConfirm(reason.trim())
    setReason('')
    setError('')
  }

  const handleClose = () => {
    setReason('')
    setError('')
    onClose()
  }

  return (
    <SalonLuxeModal
      open={open}
      onClose={handleClose}
      title="Reject Leave Request"
      size="md"
    >
      <div className="space-y-6">
        {/* Warning Banner */}
        <div
          className="p-4 rounded-xl border flex items-start gap-3"
          style={{
            backgroundColor: `${COLORS.rose}15`,
            borderColor: `${COLORS.rose}40`
          }}
        >
          <AlertCircle size={20} style={{ color: COLORS.rose, flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p className="font-semibold text-sm mb-1" style={{ color: COLORS.champagne }}>
              You are about to reject <span style={{ color: COLORS.rose }}>{staffName}'s</span> leave request
            </p>
            <p className="text-sm" style={{ color: COLORS.bronze }}>
              Please provide a clear reason for the rejection. This will be communicated to the staff member.
            </p>
          </div>
        </div>

        {/* Rejection Reason Input */}
        <div className="space-y-2">
          <Label
            htmlFor="rejection-reason"
            className="text-sm font-semibold"
            style={{ color: COLORS.champagne }}
          >
            Reason for Rejection *
          </Label>
          <Textarea
            id="rejection-reason"
            placeholder="e.g., Insufficient staffing during requested period, conflicts with peak business hours, already approved leave for multiple team members..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (error) setError('')
            }}
            rows={6}
            className="resize-none transition-all duration-200"
            style={{
              backgroundColor: COLORS.charcoalDark,
              borderColor: error ? COLORS.rose : `${COLORS.bronze}60`,
              color: COLORS.champagne,
              fontSize: '14px'
            }}
            disabled={loading}
            autoFocus
          />
          {error && (
            <p className="text-xs flex items-center gap-1" style={{ color: COLORS.rose }}>
              <AlertCircle size={12} />
              {error}
            </p>
          )}
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
              'Insufficient staffing coverage',
              'Peak business period',
              'Multiple team members on leave',
              'Short notice period',
              'Exceeds available balance'
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
            disabled={loading || !reason.trim()}
            className="flex-1 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              backgroundImage: loading
                ? `linear-gradient(90deg, ${COLORS.rose}80 0%, ${COLORS.rose}60 100%)`
                : `linear-gradient(90deg, ${COLORS.rose} 0%, #C53030 100%)`,
              color: '#FFFFFF',
              boxShadow: loading ? 'none' : `0 4px 15px ${COLORS.rose}40`,
              cursor: loading || !reason.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !reason.trim() ? 0.6 : 1
            }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Rejecting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle size={16} />
                Reject Leave Request
              </div>
            )}
          </Button>
        </div>
      </div>
    </SalonLuxeModal>
  )
}
