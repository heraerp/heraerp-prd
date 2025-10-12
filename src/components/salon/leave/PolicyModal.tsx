import React, { useState, useEffect } from 'react'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Calendar } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
import { useLeavePlaybook } from '@/hooks/useLeavePlaybook'

interface PolicyModalProps {
  open: boolean
  onClose: () => void
  policy: any | null
}

export function PolicyModal({ open, onClose, policy }: PolicyModalProps) {
  const [annualLeave, setAnnualLeave] = useState(30)
  const [carryOverCap, setCarryOverCap] = useState(5)
  const [minNoticeDays, setMinNoticeDays] = useState(7)
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState(15)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createPolicy, updatePolicy } = useLeavePlaybook()

  useEffect(() => {
    if (policy) {
      setAnnualLeave(policy.metadata?.annual_entitlement || 30)
      setCarryOverCap(policy.metadata?.carry_over_cap || 5)
      setMinNoticeDays(policy.metadata?.min_notice_days || 7)
      setMaxConsecutiveDays(policy.metadata?.max_consecutive_days || 15)
    } else {
      setAnnualLeave(30)
      setCarryOverCap(5)
      setMinNoticeDays(7)
      setMaxConsecutiveDays(15)
    }
  }, [policy])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      if (policy) {
        // Update existing policy
        await updatePolicy({
          policyId: policy.id,
          data: {
            annual_entitlement: annualLeave,
            carry_over_cap: carryOverCap,
            min_notice_days: minNoticeDays,
            max_consecutive_days: maxConsecutiveDays,
          },
        })
      } else {
        // Create new policy
        await createPolicy({
          entity_name: 'Standard Annual Leave',
          leave_type: 'ANNUAL',
          annual_entitlement: annualLeave,
          carry_over_cap: carryOverCap,
          min_notice_days: minNoticeDays,
          max_consecutive_days: maxConsecutiveDays,
          min_leave_days: 0.5,
          accrual_method: 'IMMEDIATE',
          probation_period_months: 3,
          applies_to: 'ALL',
          effective_from: new Date().toISOString(),
          description: 'Standard annual leave policy',
        })
      }
      onClose()
    } catch (error) {
      console.error('Failed to save policy:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SalonLuxeModal
      open={open}
      onClose={onClose}
      title={policy ? 'Edit Leave Policy' : 'Create Leave Policy'}
      description="Set the annual leave entitlement for staff members"
      icon={<Calendar className="w-6 h-6" />}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="outline-button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : policy ? 'Update Policy' : 'Create Policy'}
          </Button>
        </>
      }
    >
      <div className="space-y-6 py-6">
        {/* Annual Leave Field */}
        <div className="space-y-3">
          <Label
            htmlFor="annual-leave"
            className="text-base font-semibold"
            style={{ color: SALON_LUXE_COLORS.champagne.base }}
          >
            Annual Leave Days
          </Label>
          <Input
            id="annual-leave"
            type="number"
            min="0"
            max="365"
            value={annualLeave}
            onChange={e => setAnnualLeave(parseInt(e.target.value) || 0)}
            className="text-lg font-semibold"
            placeholder="e.g., 30"
          />
          <p className="text-sm opacity-70" style={{ color: SALON_LUXE_COLORS.text.primary }}>
            Number of paid leave days staff members are entitled to per year
          </p>
        </div>

        {/* Carry Over Cap */}
        <div className="space-y-3">
          <Label
            htmlFor="carry-over"
            className="text-base font-semibold"
            style={{ color: SALON_LUXE_COLORS.champagne.base }}
          >
            Carry Over Cap (Days)
          </Label>
          <Input
            id="carry-over"
            type="number"
            min="0"
            max="30"
            value={carryOverCap}
            onChange={e => setCarryOverCap(parseInt(e.target.value) || 0)}
            className="text-lg font-semibold"
            placeholder="e.g., 5"
          />
          <p className="text-sm opacity-70" style={{ color: SALON_LUXE_COLORS.text.primary }}>
            Maximum days that can be carried over to next year
          </p>
        </div>

        {/* Min Notice Days */}
        <div className="space-y-3">
          <Label
            htmlFor="min-notice"
            className="text-base font-semibold"
            style={{ color: SALON_LUXE_COLORS.champagne.base }}
          >
            Minimum Notice (Days)
          </Label>
          <Input
            id="min-notice"
            type="number"
            min="0"
            max="90"
            value={minNoticeDays}
            onChange={e => setMinNoticeDays(parseInt(e.target.value) || 0)}
            className="text-lg font-semibold"
            placeholder="e.g., 7"
          />
          <p className="text-sm opacity-70" style={{ color: SALON_LUXE_COLORS.text.primary }}>
            Minimum days in advance staff must request leave
          </p>
        </div>

        {/* Max Consecutive Days */}
        <div className="space-y-3">
          <Label
            htmlFor="max-consecutive"
            className="text-base font-semibold"
            style={{ color: SALON_LUXE_COLORS.champagne.base }}
          >
            Max Consecutive Days
          </Label>
          <Input
            id="max-consecutive"
            type="number"
            min="1"
            max="365"
            value={maxConsecutiveDays}
            onChange={e => setMaxConsecutiveDays(parseInt(e.target.value) || 0)}
            className="text-lg font-semibold"
            placeholder="e.g., 15"
          />
          <p className="text-sm opacity-70" style={{ color: SALON_LUXE_COLORS.text.primary }}>
            Maximum consecutive days staff can take at once
          </p>
        </div>

        {/* Info Section */}
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: SALON_LUXE_COLORS.charcoal.darker,
            borderColor: SALON_LUXE_COLORS.gold.base + '30'
          }}
        >
          <div className="flex items-start gap-3">
            <Calendar
              className="w-5 h-5 mt-0.5"
              style={{ color: SALON_LUXE_COLORS.gold.base }}
            />
            <div className="space-y-2 text-sm" style={{ color: SALON_LUXE_COLORS.text.primary }}>
              <p className="font-semibold" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                Policy Summary
              </p>
              <ul className="opacity-80 space-y-1">
                <li>• <strong>{annualLeave} days</strong> annual leave entitlement</li>
                <li>• Up to <strong>{carryOverCap} days</strong> can be carried over</li>
                <li>• <strong>{minNoticeDays} days</strong> minimum notice required</li>
                <li>• Maximum <strong>{maxConsecutiveDays} days</strong> consecutive leave</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SalonLuxeModal>
  )
}
