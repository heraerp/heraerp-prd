'use client'

import React, { useState, useEffect } from 'react'
import { LeavePolicy, CreateLeaveRequestInput, LeaveBalance } from '@/hooks/useHeraLeave'
import { X, Calendar, User, FileText, AlertCircle, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import { z } from 'zod'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#9B59B6',
  rose: '#E8B4B8'
}

// Zod validation schema - ENTERPRISE GRADE (removed manager_id)
const leaveRequestSchema = z.object({
  staff_id: z.string().min(1, 'Staff member is required'),
  leave_type: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'OTHER'], {
    errorMap: () => ({ message: 'Please select a leave type' })
  }),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  notes: z.string().optional()
}).refine(
  data => {
    if (!data.start_date || !data.end_date) return true
    return new Date(data.start_date) <= new Date(data.end_date)
  },
  {
    message: 'End date must be after start date',
    path: ['end_date']
  }
)

interface LeaveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateLeaveRequestInput) => Promise<void>
  staff: Array<{ id: string; entity_name: string }>
  policies: LeavePolicy[]
  balances: Record<string, LeaveBalance>
  isLoading: boolean
  initialData?: any // ✅ NEW: Leave request data for edit mode (LeaveRequest type)
}

export function LeaveModal({
  open,
  onOpenChange,
  onSubmit,
  staff,
  policies,
  balances,
  isLoading,
  initialData // ✅ NEW: For edit mode
}: LeaveModalProps) {
  // ✅ Determine if we're in edit mode
  const isEditMode = !!initialData

  const [formData, setFormData] = useState<CreateLeaveRequestInput>({
    staff_id: initialData?.staff_id || '',
    manager_id: initialData?.manager_id || '', // Will be set programmatically (not in form)
    leave_type: initialData?.leave_type || 'ANNUAL',
    start_date: initialData?.start_date?.split('T')[0] || '', // Convert ISO to YYYY-MM-DD
    end_date: initialData?.end_date?.split('T')[0] || '',
    reason: initialData?.reason || '',
    notes: initialData?.notes || ''
  })

  // 🚨 ENTERPRISE ERROR LOGGING
  const logError = (context: string, error: any, additionalInfo?: any) => {
    const timestamp = new Date().toISOString()
    console.error('🚨 [LeaveModal Error]', {
      timestamp,
      context,
      error: {
        message: error?.message || String(error),
        stack: error?.stack
      },
      additionalInfo,
      staff: staff?.length || 0,
      policies: policies?.length || 0
    })
  }

  // 🔍 DEBUG: Log when staff data changes
  useEffect(() => {
    console.log('🔍 [LeaveModal] Staff data updated:', {
      staffCount: staff?.length || 0,
      staffLoaded: !!staff,
      staffSample: staff?.[0]
    })
  }, [staff])

  // ✅ React to initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        staff_id: initialData.staff_id || '',
        manager_id: initialData.manager_id || '',
        leave_type: initialData.leave_type || 'ANNUAL',
        start_date: initialData.start_date?.split('T')[0] || '',
        end_date: initialData.end_date?.split('T')[0] || '',
        reason: initialData.reason || '',
        notes: initialData.notes || ''
      })
    }
  }, [initialData])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedStaffBalance, setSelectedStaffBalance] = useState<LeaveBalance | null>(null)

  // Watch staff_id changes and update balance
  useEffect(() => {
    if (formData.staff_id && balances[formData.staff_id]) {
      setSelectedStaffBalance(balances[formData.staff_id])
    } else {
      setSelectedStaffBalance(null)
    }
  }, [formData.staff_id, balances])

  // Calculate days between dates
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1
  }

  const totalDays = calculateDays(formData.start_date, formData.end_date)

  // Handle form submission - ENTERPRISE GRADE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      // Validate with Zod
      const validatedData = leaveRequestSchema.parse(formData)

      // 🎯 ENTERPRISE: Auto-assign manager (first staff member for now)
      // In production, this should be based on organizational hierarchy
      const managerId = staff[0]?.id || formData.staff_id

      console.log('🔍 [LeaveModal] Submitting leave request:', {
        staff_id: validatedData.staff_id,
        manager_id: managerId,
        leave_type: validatedData.leave_type,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        total_days: totalDays
      })

      // Submit with manager_id
      await onSubmit({
        ...validatedData,
        manager_id: managerId
      })

      // Reset form
      setFormData({
        staff_id: '',
        manager_id: '',
        leave_type: 'ANNUAL',
        start_date: '',
        end_date: '',
        reason: '',
        notes: ''
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
        logError('Validation Error', error, { fieldErrors })
      } else {
        logError('Submit Error', error, { formData })
      }
    }
  }

  // Handle field change
  const handleChange = (field: keyof CreateLeaveRequestInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl animate-in slide-in-from-bottom-4 duration-500"
        style={{
          background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.black} 100%)`,
          border: `1px solid ${COLORS.gold}30`,
          boxShadow: `0 20px 60px ${COLORS.black}`
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-6 border-b backdrop-blur-sm"
          style={{
            borderColor: `${COLORS.gold}30`,
            background: `linear-gradient(135deg, ${COLORS.charcoal}CC 0%, ${COLORS.black}CC 100%)`
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${COLORS.gold}20` }}
            >
              <Calendar className="w-6 h-6" style={{ color: COLORS.gold }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
                {isEditMode ? 'Edit Leave Request' : 'Request Leave'}
              </h2>
              <p className="text-sm" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                {isEditMode ? 'Update leave request details' : 'Submit a new leave request'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ backgroundColor: `${COLORS.rose}20`, color: COLORS.rose }}
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Staff Member */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
              Staff Member <span style={{ color: COLORS.rose }}>*</span>
            </label>
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: COLORS.bronze }}
              />
              <select
                value={formData.staff_id}
                onChange={e => handleChange('staff_id', e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2"
                style={{
                  backgroundColor: COLORS.black,
                  borderColor: errors.staff_id ? COLORS.rose : `${COLORS.bronze}30`,
                  color: COLORS.champagne,
                  outline: 'none'
                }}
                disabled={isLoading}
              >
                <option value="">Select staff member</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.entity_name}
                  </option>
                ))}
              </select>
            </div>
            {errors.staff_id && (
              <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: COLORS.rose }}>
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.staff_id}
              </div>
            )}
          </div>

          {/* 🔍 DEBUG: Staff Loading Status */}
          {!staff || staff.length === 0 ? (
            <div
              className="rounded-xl p-4 animate-in fade-in duration-300"
              style={{
                backgroundColor: `${COLORS.bronze}20`,
                border: `1px solid ${COLORS.bronze}40`
              }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" style={{ color: COLORS.bronze }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                    Loading staff members...
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                    {staff === undefined ? 'Staff data is undefined' : 'No staff members found'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Leave Balance Display */}
          {selectedStaffBalance && (
            <div
              className="rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-500"
              style={{
                background: `linear-gradient(135deg, ${COLORS.emerald}15 0%, ${COLORS.gold}10 100%)`,
                border: `1px solid ${COLORS.gold}30`
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5" style={{ color: COLORS.gold }} />
                <h3 className="text-sm font-bold" style={{ color: COLORS.champagne }}>
                  Leave Balance for {selectedStaffBalance.staff_name}
                </h3>
              </div>

              {/* Balance Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {/* Total Entitlement */}
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: `${COLORS.gold}15`, border: `1px solid ${COLORS.gold}20` }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5" style={{ color: COLORS.gold }} />
                    <span className="text-xs font-medium" style={{ color: COLORS.bronze }}>
                      Entitlement
                    </span>
                  </div>
                  <div className="text-xl font-bold" style={{ color: COLORS.champagne }}>
                    {selectedStaffBalance.entitlement}
                  </div>
                  <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                    days
                  </div>
                </div>

                {/* Used Days */}
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: `${COLORS.plum}15`, border: `1px solid ${COLORS.plum}20` }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: COLORS.plum }} />
                    <span className="text-xs font-medium" style={{ color: COLORS.bronze }}>
                      Used
                    </span>
                  </div>
                  <div className="text-xl font-bold" style={{ color: COLORS.champagne }}>
                    {selectedStaffBalance.used_days}
                  </div>
                  <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                    days
                  </div>
                </div>

                {/* Pending Days */}
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: `${COLORS.bronze}15`, border: `1px solid ${COLORS.bronze}20` }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5" style={{ color: COLORS.bronze }} />
                    <span className="text-xs font-medium" style={{ color: COLORS.bronze }}>
                      Pending
                    </span>
                  </div>
                  <div className="text-xl font-bold" style={{ color: COLORS.champagne }}>
                    {selectedStaffBalance.pending_days}
                  </div>
                  <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                    days
                  </div>
                </div>

                {/* Available Days */}
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: `${COLORS.emerald}15`, border: `1px solid ${COLORS.emerald}20` }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: COLORS.emerald }} />
                    <span className="text-xs font-medium" style={{ color: COLORS.bronze }}>
                      Available
                    </span>
                  </div>
                  <div className="text-xl font-bold" style={{ color: COLORS.emerald }}>
                    {selectedStaffBalance.available_days}
                  </div>
                  <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                    days
                  </div>
                </div>
              </div>

              {/* Policy & Accrual Info */}
              <div className="flex flex-col md:flex-row gap-2 text-xs" style={{ color: COLORS.bronze }}>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Policy:</span>
                  <span style={{ color: COLORS.champagne }}>{selectedStaffBalance.policy_name}</span>
                </div>
                <div className="hidden md:block" style={{ color: COLORS.bronze, opacity: 0.5 }}>
                  •
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Accrual:</span>
                  <span style={{ color: COLORS.champagne }}>
                    {selectedStaffBalance.accrual_method === 'MONTHLY'
                      ? `${(selectedStaffBalance.annual_entitlement / 12).toFixed(1)} days/month`
                      : 'Immediate'}
                  </span>
                </div>
                <div className="hidden md:block" style={{ color: COLORS.bronze, opacity: 0.5 }}>
                  •
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Months Worked:</span>
                  <span style={{ color: COLORS.champagne }}>{selectedStaffBalance.months_worked}</span>
                </div>
              </div>

              {/* Insufficient Balance Warning */}
              {totalDays > 0 && totalDays > selectedStaffBalance.available_days && (
                <div
                  className="mt-4 p-3 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ backgroundColor: `${COLORS.rose}20`, border: `1px solid ${COLORS.rose}40` }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: COLORS.rose }} />
                  <div>
                    <p className="text-xs font-medium" style={{ color: COLORS.rose }}>
                      Insufficient Balance
                    </p>
                    <p className="text-xs mt-1" style={{ color: COLORS.rose, opacity: 0.8 }}>
                      Requesting {totalDays} days but only {selectedStaffBalance.available_days} days
                      available. This request may require special approval.
                    </p>
                  </div>
                </div>
              )}

              {/* Sufficient Balance Confirmation */}
              {totalDays > 0 && totalDays <= selectedStaffBalance.available_days && (
                <div
                  className="mt-4 p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{
                    backgroundColor: `${COLORS.emerald}20`,
                    border: `1px solid ${COLORS.emerald}40`
                  }}
                >
                  <CheckCircle className="w-4 h-4" style={{ color: COLORS.emerald }} />
                  <p className="text-xs font-medium" style={{ color: COLORS.emerald }}>
                    Sufficient balance available for this request
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
              Leave Type <span style={{ color: COLORS.rose }}>*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['ANNUAL', 'SICK', 'UNPAID', 'OTHER'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('leave_type', type)}
                  className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor:
                      formData.leave_type === type ? `${COLORS.gold}40` : `${COLORS.gold}10`,
                    color: formData.leave_type === type ? COLORS.champagne : COLORS.bronze,
                    border:
                      formData.leave_type === type
                        ? `2px solid ${COLORS.gold}`
                        : `1px solid ${COLORS.bronze}30`
                  }}
                  disabled={isLoading}
                >
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            {errors.leave_type && (
              <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: COLORS.rose }}>
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.leave_type}
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
                Start Date <span style={{ color: COLORS.rose }}>*</span>
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={e => handleChange('start_date', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2"
                style={{
                  backgroundColor: COLORS.black,
                  borderColor: errors.start_date ? COLORS.rose : `${COLORS.bronze}30`,
                  color: COLORS.champagne,
                  outline: 'none'
                }}
                disabled={isLoading}
              />
              {errors.start_date && (
                <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: COLORS.rose }}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.start_date}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
                End Date <span style={{ color: COLORS.rose }}>*</span>
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={e => handleChange('end_date', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2"
                style={{
                  backgroundColor: COLORS.black,
                  borderColor: errors.end_date ? COLORS.rose : `${COLORS.bronze}30`,
                  color: COLORS.champagne,
                  outline: 'none'
                }}
                disabled={isLoading}
              />
              {errors.end_date && (
                <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: COLORS.rose }}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.end_date}
                </div>
              )}
            </div>
          </div>

          {/* Total Days Display */}
          {totalDays > 0 && (
            <div
              className="p-4 rounded-xl flex items-center justify-between"
              style={{ backgroundColor: `${COLORS.gold}10`, border: `1px solid ${COLORS.gold}30` }}
            >
              <span className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                Total Days Requested
              </span>
              <span className="text-2xl font-bold" style={{ color: COLORS.gold }}>
                {totalDays} {totalDays === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
              Reason <span style={{ color: COLORS.rose }}>*</span>
            </label>
            <div className="relative">
              <FileText
                className="absolute left-4 top-4 w-5 h-5"
                style={{ color: COLORS.bronze }}
              />
              <textarea
                value={formData.reason}
                onChange={e => handleChange('reason', e.target.value)}
                placeholder="Please provide a reason for your leave request..."
                rows={4}
                className="w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2 resize-none"
                style={{
                  backgroundColor: COLORS.black,
                  borderColor: errors.reason ? COLORS.rose : `${COLORS.bronze}30`,
                  color: COLORS.champagne,
                  outline: 'none'
                }}
                disabled={isLoading}
              />
            </div>
            {errors.reason && (
              <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: COLORS.rose }}>
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.reason}
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder="Any additional information..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2 resize-none"
              style={{
                backgroundColor: COLORS.black,
                borderColor: `${COLORS.bronze}30`,
                color: COLORS.champagne,
                outline: 'none'
              }}
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full md:w-auto px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: `${COLORS.bronze}20`,
                color: COLORS.bronze,
                border: `1px solid ${COLORS.bronze}40`
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: COLORS.gold,
                color: COLORS.black
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div
                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: COLORS.black }}
                  />
                  {isEditMode ? 'Updating...' : 'Submitting...'}
                </span>
              ) : (
                isEditMode ? 'Update Request' : 'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
