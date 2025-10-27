'use client'

import React, { useState, useEffect, useRef } from 'react'
import { LeavePolicy, CreateLeaveRequestInput, LeaveBalance } from '@/hooks/useHeraLeave'
import { Calendar, User, FileText, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { z } from 'zod'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { ValidationSummary, FieldWithError, CharacterCounter, QuickTemplates, Template } from '@/components/salon/shared/forms'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

// 🎯 ENTERPRISE: Quick reason templates for auto-fill
const REASON_TEMPLATES: Template[] = [
  { label: 'Annual Holiday', value: 'Annual leave for personal vacation and rest.' },
  { label: 'Family Event', value: 'Family commitment requiring time off work.' },
  { label: 'Medical Appointment', value: 'Scheduled medical appointment or health-related matter.' },
  { label: 'Personal Day', value: 'Personal matters requiring attention during work hours.' },
  { label: 'Emergency', value: 'Urgent personal or family emergency requiring immediate attention.' },
  { label: 'Mental Health', value: 'Mental health and wellbeing rest day.' }
]

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
  initialData?: any // For edit mode
}

export function LeaveModal({
  open,
  onOpenChange,
  onSubmit,
  staff,
  policies,
  balances,
  isLoading,
  initialData
}: LeaveModalProps) {
  // ✅ Determine if we're in edit mode
  const isEditMode = !!initialData

  const [formData, setFormData] = useState<CreateLeaveRequestInput>({
    staff_id: initialData?.staff_id || '',
    manager_id: initialData?.manager_id || '',
    leave_type: initialData?.leave_type || 'ANNUAL',
    start_date: initialData?.start_date?.split('T')[0] || '',
    end_date: initialData?.end_date?.split('T')[0] || '',
    reason: initialData?.reason || '',
    notes: initialData?.notes || ''
  })


  // ✅ React to modal open/close - reset form when modal opens
  useEffect(() => {
    if (open) {
      console.log('🔍 [LeaveModal] Modal opened:', {
        hasInitialData: !!initialData,
        isEditMode,
        initialData
      })

      if (initialData) {
        // Edit mode - populate form with initial data
        const updatedFormData = {
          staff_id: initialData.staff_id || '',
          manager_id: initialData.manager_id || '',
          leave_type: initialData.leave_type || 'ANNUAL',
          start_date: initialData.start_date?.split('T')[0] || '',
          end_date: initialData.end_date?.split('T')[0] || '',
          reason: initialData.reason || '',
          notes: initialData.notes || ''
        }

        console.log('🔍 [LeaveModal] Setting form data (EDIT):', updatedFormData)
        setFormData(updatedFormData)
      } else {
        // Create mode - reset to empty form
        console.log('🔍 [LeaveModal] Resetting form data (CREATE)')
        setFormData({
          staff_id: '',
          manager_id: '',
          leave_type: 'ANNUAL',
          start_date: '',
          end_date: '',
          reason: '',
          notes: ''
        })
      }

      // Clear errors when opening modal
      setErrors({})
      setSubmissionError(null)
    }
  }, [open, initialData, isEditMode])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedStaffBalance, setSelectedStaffBalance] = useState<LeaveBalance | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 🎯 ENTERPRISE: Refs for scrolling to error fields
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const staffRef = useRef<HTMLDivElement>(null)
  const leaveTypeRef = useRef<HTMLDivElement>(null)
  const startDateRef = useRef<HTMLDivElement>(null)
  const endDateRef = useRef<HTMLDivElement>(null)
  const reasonRef = useRef<HTMLDivElement>(null)

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

  // 🎯 ENTERPRISE: Scroll to first error field
  const scrollToError = (fieldName: string) => {
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {
      staff_id: staffRef,
      leave_type: leaveTypeRef,
      start_date: startDateRef,
      end_date: endDateRef,
      reason: reasonRef
    }

    const ref = refMap[fieldName]
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Add shake animation
      ref.current.classList.add('animate-shake')
      setTimeout(() => {
        ref.current?.classList.remove('animate-shake')
      }, 500)
    } else if (errorSummaryRef.current) {
      errorSummaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Handle form submission - ENTERPRISE GRADE WITH COMPREHENSIVE ERROR HANDLING
  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'submitted' = 'submitted') => {
    e.preventDefault()

    // 🎯 STEP 1: Clear all previous errors
    setErrors({})
    setSubmissionError(null)

    // 🎯 STEP 2: Prevent double submission
    if (isSubmitting) {
      console.log('🛑 [LeaveModal] Submission already in progress, ignoring duplicate submit')
      return
    }

    try {
      // 🎯 STEP 3: Client-side validation with Zod (conditional for draft)
      console.log(`🔍 [LeaveModal] Starting validation (${status})...`, formData)

      let validatedData
      if (status === 'draft') {
        // For drafts, only validate required fields (reason is optional)
        const draftSchema = leaveRequestSchema.extend({
          reason: z.string().optional() // Make reason optional for drafts
        })
        validatedData = draftSchema.parse(formData)
      } else {
        // For submissions, validate all fields including reason minimum length
        validatedData = leaveRequestSchema.parse(formData)
      }

      console.log('✅ [LeaveModal] Validation passed:', validatedData)

      // 🎯 STEP 4: Mark as submitting to prevent double-clicks
      setIsSubmitting(true)

      // 🎯 ENTERPRISE: Auto-assign manager (first staff member for now)
      const managerId = staff[0]?.id || formData.staff_id

      // 🎯 STEP 5: Submit to API with comprehensive error handling
      try {
        console.log(`📤 [LeaveModal] Submitting to API as ${status}...`)
        await onSubmit({
          ...validatedData,
          manager_id: managerId,
          status // ✅ Pass status to API (draft or submitted)
        })

        console.log('✅ [LeaveModal] Submission successful!')

        // 🎯 STEP 6: Reset form on success
        setFormData({
          staff_id: '',
          manager_id: '',
          leave_type: 'ANNUAL',
          start_date: '',
          end_date: '',
          reason: '',
          notes: ''
        })

        // Close modal on success (optional - let parent component decide)
        // onOpenChange(false)

      } catch (submissionError: any) {
        // 🚨 STEP 7: Handle API submission errors (SILENT)
        let userFriendlyMessage = 'An unexpected error occurred while submitting your leave request. Please try again.'

        // Parse different error types
        if (submissionError?.message) {
          if (submissionError.message.includes('network')) {
            userFriendlyMessage = 'Network error: Please check your internet connection and try again.'
          } else if (submissionError.message.includes('timeout')) {
            userFriendlyMessage = 'Request timeout: The server took too long to respond. Please try again.'
          } else if (submissionError.message.includes('unauthorized') || submissionError.message.includes('401')) {
            userFriendlyMessage = 'Authentication error: Please log out and log back in.'
          } else if (submissionError.message.includes('forbidden') || submissionError.message.includes('403')) {
            userFriendlyMessage = 'Permission denied: You do not have permission to create leave requests.'
          } else if (submissionError.message.includes('duplicate')) {
            userFriendlyMessage = 'Duplicate request: A similar leave request already exists.'
          } else {
            // Use the actual error message if it's user-friendly
            userFriendlyMessage = submissionError.message
          }
        }

        setSubmissionError(userFriendlyMessage)

        // Scroll to top to show submission error
        if (errorSummaryRef.current) {
          errorSummaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }

    } catch (error) {
      // 🚨 STEP 8: Handle validation errors (SILENT - no console.error)
      if (error instanceof z.ZodError) {
        // ✅ SILENT: Just collect field errors and display in UI
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)

        // 🎯 ENTERPRISE: Scroll to first error field
        const firstErrorField = Object.keys(fieldErrors)[0]
        if (firstErrorField) {
          setTimeout(() => scrollToError(firstErrorField), 100)
        }
      } else {
        // 🚨 STEP 9: Handle unexpected errors (log but don't throw)
        console.warn('⚠️ [LeaveModal] Unexpected error:', error)
        setSubmissionError('An unexpected error occurred. Please try again.')
      }
    } finally {
      // 🎯 STEP 10: Always reset submitting state
      setIsSubmitting(false)
    }
  }

  // 🎯 ENTERPRISE: Handler for saving as draft
  const handleSaveAsDraft = (e: React.FormEvent) => {
    handleSubmit(e, 'draft')
  }

  // 🎯 ENTERPRISE: Handler for submitting (default)
  const handleSubmitForApproval = (e: React.FormEvent) => {
    handleSubmit(e, 'submitted')
  }

  // Handle field change
  const handleChange = (field: keyof CreateLeaveRequestInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear validation error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Clear submission error when user starts editing
    if (submissionError) {
      setSubmissionError(null)
    }
  }

  return (
    <SalonLuxeModal
      open={open}
      onClose={() => onOpenChange(false)}
      title={isEditMode ? 'Edit Leave Request' : 'Request Leave'}
      description={isEditMode ? 'Update leave request details' : 'Submit a new leave request'}
      icon={<Calendar className="w-6 h-6" />}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="outline-button px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </button>

          {/* 🎯 ENTERPRISE: Save as Draft button - ONLY in CREATE mode */}
          {!isEditMode && (
            <button
              type="button"
              onClick={handleSaveAsDraft}
              className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                backgroundColor: `${SALON_LUXE_COLORS.bronze}30`,
                color: SALON_LUXE_COLORS.champagne.base,
                border: `1px solid ${SALON_LUXE_COLORS.bronze}60`
              }}
              disabled={isSubmitting || isLoading}
            >
              {(isSubmitting || isLoading) ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Save as Draft</span>
                </>
              )}
            </button>
          )}

          {/* 🎯 ENTERPRISE: Submit button */}
          <button
            type="button"
            onClick={handleSubmitForApproval}
            className="primary-button px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || isLoading}
          >
            {(isSubmitting || isLoading) ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                {isEditMode ? 'Updating...' : 'Submitting...'}
              </span>
            ) : (
              isEditMode ? 'Update Request' : 'Submit Request'
            )}
          </button>
        </>
      }
    >
      <form id="leave-request-form" onSubmit={handleSubmitForApproval} className="space-y-6 pt-4">
        {/* 🚨 ENTERPRISE: Submission Error Banner */}
        {submissionError && (
          <div
            ref={errorSummaryRef}
            className="p-4 rounded-xl border-2 animate-in fade-in slide-in-from-top-2 duration-500"
            style={{
              backgroundColor: `${SALON_LUXE_COLORS.rose}15`,
              borderColor: SALON_LUXE_COLORS.rose
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: SALON_LUXE_COLORS.rose }}
              />
              <div className="flex-1">
                <h3 className="text-sm font-bold mb-1" style={{ color: SALON_LUXE_COLORS.rose }}>
                  Submission Failed
                </h3>
                <p className="text-xs" style={{ color: SALON_LUXE_COLORS.rose, opacity: 0.9 }}>
                  {submissionError}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmissionError(null)}
                  className="mt-2 text-xs font-medium hover:underline"
                  style={{ color: SALON_LUXE_COLORS.rose }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🚨 ENTERPRISE: Validation Summary Banner */}
        {!submissionError && Object.keys(errors).length > 0 && (
          <div ref={errorSummaryRef}>
            <ValidationSummary errors={errors} onErrorClick={scrollToError} />
          </div>
        )}

        {/* Staff Member */}
        <FieldWithError
          ref={staffRef}
          label="Staff Member"
          error={errors.staff_id}
          required
        >
          <div className="relative">
            <User
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: SALON_LUXE_COLORS.bronze }}
            />
            <select
              value={formData.staff_id}
              onChange={e => handleChange('staff_id', e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2"
              style={{
                backgroundColor: SALON_LUXE_COLORS.charcoal.darker,
                borderColor: errors.staff_id ? SALON_LUXE_COLORS.rose : `${SALON_LUXE_COLORS.bronze}30`,
                color: SALON_LUXE_COLORS.champagne.base,
                outline: 'none'
              }}
              disabled={isSubmitting || isLoading}
            >
              <option value="">Select staff member</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.entity_name}
                </option>
              ))}
            </select>
          </div>
        </FieldWithError>

        {/* 🔍 DEBUG: Staff Loading Status */}
        {!staff || staff.length === 0 ? (
          <div
            className="rounded-xl p-4 animate-in fade-in duration-300"
            style={{
              backgroundColor: `${SALON_LUXE_COLORS.bronze}20`,
              border: `1px solid ${SALON_LUXE_COLORS.bronze}40`
            }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.bronze }} />
              <div>
                <p className="text-sm font-medium" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                  Loading staff members...
                </p>
                <p className="text-xs mt-1" style={{ color: SALON_LUXE_COLORS.bronze, opacity: 0.7 }}>
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
              background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.emerald}15 0%, ${SALON_LUXE_COLORS.gold.base}10 100%)`,
              border: `1px solid ${SALON_LUXE_COLORS.gold.base}30`
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.gold.base }} />
              <h3 className="text-sm font-bold" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                Leave Balance for {selectedStaffBalance.staff_name}
              </h3>
            </div>

            {/* Balance Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {/* Total Entitlement */}
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: `${SALON_LUXE_COLORS.gold.base}15`, border: `1px solid ${SALON_LUXE_COLORS.gold.base}20` }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5" style={{ color: SALON_LUXE_COLORS.gold.base }} />
                  <span className="text-xs font-medium" style={{ color: SALON_LUXE_COLORS.bronze }}>
                    Entitlement
                  </span>
                </div>
                <div className="text-xl font-bold" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                  {selectedStaffBalance.entitlement}
                </div>
                <div className="text-xs" style={{ color: SALON_LUXE_COLORS.bronze, opacity: 0.7 }}>
                  days
                </div>
              </div>

              {/* Used Days */}
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: `${SALON_LUXE_COLORS.plum}15`, border: `1px solid ${SALON_LUXE_COLORS.plum}20` }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: SALON_LUXE_COLORS.plum }} />
                  <span className="text-xs font-medium" style={{ color: SALON_LUXE_COLORS.bronze }}>
                    Used
                  </span>
                </div>
                <div className="text-xl font-bold" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                  {selectedStaffBalance.used_days}
                </div>
                <div className="text-xs" style={{ color: SALON_LUXE_COLORS.bronze, opacity: 0.7 }}>
                  days
                </div>
              </div>

              {/* Pending Days */}
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: `${SALON_LUXE_COLORS.bronze}15`, border: `1px solid ${SALON_LUXE_COLORS.bronze}20` }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5" style={{ color: SALON_LUXE_COLORS.bronze }} />
                  <span className="text-xs font-medium" style={{ color: SALON_LUXE_COLORS.bronze }}>
                    Pending
                  </span>
                </div>
                <div className="text-xl font-bold" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                  {selectedStaffBalance.pending_days}
                </div>
                <div className="text-xs" style={{ color: SALON_LUXE_COLORS.bronze, opacity: 0.7 }}>
                  days
                </div>
              </div>

              {/* Available Days */}
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: `${SALON_LUXE_COLORS.emerald}15`, border: `1px solid ${SALON_LUXE_COLORS.emerald}20` }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: SALON_LUXE_COLORS.emerald }} />
                  <span className="text-xs font-medium" style={{ color: SALON_LUXE_COLORS.bronze }}>
                    Available
                  </span>
                </div>
                <div className="text-xl font-bold" style={{ color: SALON_LUXE_COLORS.emerald }}>
                  {selectedStaffBalance.available_days}
                </div>
                <div className="text-xs" style={{ color: SALON_LUXE_COLORS.bronze, opacity: 0.7 }}>
                  days
                </div>
              </div>
            </div>

            {/* Policy & Accrual Info */}
            <div className="flex flex-col md:flex-row gap-2 text-xs" style={{ color: SALON_LUXE_COLORS.bronze }}>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Policy:</span>
                <span style={{ color: SALON_LUXE_COLORS.champagne.base }}>{selectedStaffBalance.policy_name}</span>
              </div>
              <div className="hidden md:block" style={{ color: SALON_LUXE_COLORS.bronze, opacity: 0.5 }}>
                •
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Accrual:</span>
                <span style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                  {selectedStaffBalance.accrual_method === 'MONTHLY'
                    ? `${(selectedStaffBalance.annual_entitlement / 12).toFixed(1)} days/month`
                    : 'Immediate'}
                </span>
              </div>
              <div className="hidden md:block" style={{ color: SALON_LUXE_COLORS.bronze, opacity: 0.5 }}>
                •
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Months Worked:</span>
                <span style={{ color: SALON_LUXE_COLORS.champagne.base }}>{selectedStaffBalance.months_worked}</span>
              </div>
            </div>

            {/* Insufficient Balance Warning */}
            {totalDays > 0 && totalDays > selectedStaffBalance.available_days && (
              <div
                className="mt-4 p-3 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ backgroundColor: `${SALON_LUXE_COLORS.rose}20`, border: `1px solid ${SALON_LUXE_COLORS.rose}40` }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: SALON_LUXE_COLORS.rose }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: SALON_LUXE_COLORS.rose }}>
                    Insufficient Balance
                  </p>
                  <p className="text-xs mt-1" style={{ color: SALON_LUXE_COLORS.rose, opacity: 0.8 }}>
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
                  backgroundColor: `${SALON_LUXE_COLORS.emerald}20`,
                  border: `1px solid ${SALON_LUXE_COLORS.emerald}40`
                }}
              >
                <CheckCircle className="w-4 h-4" style={{ color: SALON_LUXE_COLORS.emerald }} />
                <p className="text-xs font-medium" style={{ color: SALON_LUXE_COLORS.emerald }}>
                  Sufficient balance available for this request
                </p>
              </div>
            )}
          </div>
        )}

        {/* Leave Type */}
        <FieldWithError
          ref={leaveTypeRef}
          label="Leave Type"
          error={errors.leave_type}
          required
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['ANNUAL', 'SICK', 'UNPAID', 'OTHER'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleChange('leave_type', type)}
                className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor:
                    formData.leave_type === type ? `${SALON_LUXE_COLORS.gold.base}40` : `${SALON_LUXE_COLORS.gold.base}10`,
                  color: formData.leave_type === type ? SALON_LUXE_COLORS.champagne.base : SALON_LUXE_COLORS.bronze,
                  border:
                    formData.leave_type === type
                      ? `2px solid ${SALON_LUXE_COLORS.gold.base}`
                      : `1px solid ${SALON_LUXE_COLORS.bronze}30`
                }}
                disabled={isSubmitting || isLoading}
              >
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </FieldWithError>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldWithError
            ref={startDateRef}
            label="Start Date"
            error={errors.start_date}
            required
          >
            <input
              type="date"
              value={formData.start_date}
              onChange={e => handleChange('start_date', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2"
              style={{
                backgroundColor: SALON_LUXE_COLORS.charcoal.darker,
                borderColor: errors.start_date ? SALON_LUXE_COLORS.rose : `${SALON_LUXE_COLORS.bronze}30`,
                color: SALON_LUXE_COLORS.champagne.base,
                outline: 'none'
              }}
              disabled={isSubmitting || isLoading}
            />
          </FieldWithError>

          <FieldWithError
            ref={endDateRef}
            label="End Date"
            error={errors.end_date}
            required
          >
            <input
              type="date"
              value={formData.end_date}
              onChange={e => handleChange('end_date', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2"
              style={{
                backgroundColor: SALON_LUXE_COLORS.charcoal.darker,
                borderColor: errors.end_date ? SALON_LUXE_COLORS.rose : `${SALON_LUXE_COLORS.bronze}30`,
                color: SALON_LUXE_COLORS.champagne.base,
                outline: 'none'
              }}
              disabled={isSubmitting || isLoading}
            />
          </FieldWithError>
        </div>

        {/* Total Days Display */}
        {totalDays > 0 && (
          <div
            className="p-4 rounded-xl flex items-center justify-between"
            style={{ backgroundColor: `${SALON_LUXE_COLORS.gold.base}10`, border: `1px solid ${SALON_LUXE_COLORS.gold.base}30` }}
          >
            <span className="text-sm font-medium" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
              Total Days Requested
            </span>
            <span className="text-2xl font-bold" style={{ color: SALON_LUXE_COLORS.gold.base }}>
              {totalDays} {totalDays === 1 ? 'day' : 'days'}
            </span>
          </div>
        )}

        {/* Reason */}
        <FieldWithError
          ref={reasonRef}
          label="Reason"
          error={errors.reason}
          required
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
              {/* Label already handled by FieldWithError */}
            </span>
            <QuickTemplates
              templates={REASON_TEMPLATES}
              onSelect={(template) => handleChange('reason', template.value)}
              buttonLabel="Quick Reasons"
              columns={3}
            />
          </div>

          <div className="relative">
            <FileText
              className="absolute left-4 top-4 w-5 h-5"
              style={{ color: SALON_LUXE_COLORS.bronze }}
            />
            <textarea
              value={formData.reason}
              onChange={e => handleChange('reason', e.target.value)}
              placeholder="Please provide a reason for your leave request..."
              rows={4}
              className="w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2 resize-none"
              style={{
                backgroundColor: SALON_LUXE_COLORS.charcoal.darker,
                borderColor: errors.reason ? SALON_LUXE_COLORS.rose : `${SALON_LUXE_COLORS.bronze}30`,
                color: SALON_LUXE_COLORS.champagne.base,
                outline: 'none'
              }}
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Character counter */}
          <div className="flex items-center justify-end mt-2">
            <CharacterCounter current={formData.reason.length} min={10} showCheck />
          </div>
        </FieldWithError>

        {/* Additional Notes */}
        <FieldWithError label="Additional Notes" hint="Optional - any extra information">
          <textarea
            value={formData.notes}
            onChange={e => handleChange('notes', e.target.value)}
            placeholder="Any additional information..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2 resize-none"
            style={{
              backgroundColor: SALON_LUXE_COLORS.charcoal.darker,
              borderColor: `${SALON_LUXE_COLORS.bronze}30`,
              color: SALON_LUXE_COLORS.champagne.base,
              outline: 'none'
            }}
            disabled={isSubmitting || isLoading}
          />
        </FieldWithError>
      </form>
    </SalonLuxeModal>
  )
}
