'use client'

import React, { useEffect, useState } from 'react'
import { X, Settings, AlertCircle, Zap } from 'lucide-react'
import { z } from 'zod'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  rose: '#E8B4B8'
}

// Zod validation schema
const policySchema = z.object({
  policy_name: z.string().min(3, 'Policy name must be at least 3 characters'),
  leave_type: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'OTHER']),
  annual_entitlement: z.number().min(1).max(365),
  accrual_method: z.enum(['IMMEDIATE', 'MONTHLY']),
  applies_to: z.enum(['FULL_TIME', 'PART_TIME', 'ALL']),
  min_notice_days: z.number().min(0),
  max_consecutive_days: z.number().min(1),
  min_leave_days: z.number().min(0.5),
  active: z.boolean()
})

type PolicyFormData = z.infer<typeof policySchema>

interface PolicyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: PolicyFormData) => Promise<void>
  isLoading?: boolean
  initialData?: any // LeavePolicy data for edit mode
}

export function PolicyModal({ open, onOpenChange, onSubmit, isLoading = false, initialData }: PolicyModalProps) {
  // Determine if we're in edit mode
  const isEditMode = !!initialData

  const [formData, setFormData] = useState<PolicyFormData>({
    policy_name: initialData?.entity_name || '',
    leave_type: initialData?.leave_type || 'ANNUAL',
    annual_entitlement: initialData?.annual_entitlement || 30,
    accrual_method: initialData?.accrual_method || 'MONTHLY',
    applies_to: initialData?.applies_to || 'ALL',
    min_notice_days: initialData?.min_notice_days || 7,
    max_consecutive_days: initialData?.max_consecutive_days || 15,
    min_leave_days: initialData?.min_leave_days || 0.5,
    active: initialData?.active !== undefined ? initialData.active : true
  })

  // Update form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        policy_name: initialData.entity_name || '',
        leave_type: initialData.leave_type || 'ANNUAL',
        annual_entitlement: initialData.annual_entitlement || 30,
        accrual_method: initialData.accrual_method || 'MONTHLY',
        applies_to: initialData.applies_to || 'ALL',
        min_notice_days: initialData.min_notice_days || 7,
        max_consecutive_days: initialData.max_consecutive_days || 15,
        min_leave_days: initialData.min_leave_days || 0.5,
        active: initialData.active !== undefined ? initialData.active : true
      })
    }
  }, [initialData])

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      // Validate with Zod
      const validatedData = policySchema.parse(formData)

      // Submit if handler provided
      if (onSubmit) {
        await onSubmit(validatedData)
      }

      // Reset form
      setFormData({
        policy_name: '',
        leave_type: 'ANNUAL',
        annual_entitlement: 30,
        accrual_method: 'MONTHLY',
        applies_to: 'ALL',
        min_notice_days: 7,
        max_consecutive_days: 15,
        min_leave_days: 0.5,
        active: true
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
      }
    }
  }

  // Handle field change
  const handleChange = (field: keyof PolicyFormData, value: any) => {
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

  // Quick setup: Create default policy
  const handleQuickSetup = () => {
    setFormData({
      policy_name: 'Organization Annual Leave Policy',
      leave_type: 'ANNUAL',
      annual_entitlement: 30,
      accrual_method: 'MONTHLY',
      applies_to: 'ALL',
      min_notice_days: 7,
      max_consecutive_days: 15,
      min_leave_days: 0.5,
      active: true
    })
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl animate-in slide-in-from-bottom-4 duration-500"
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
              <Settings className="w-6 h-6" style={{ color: COLORS.gold }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
                {isEditMode ? 'Edit Leave Policy' : 'Create Leave Policy'}
              </h2>
              <p className="text-sm" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                {isEditMode ? 'Update leave entitlements and rules' : 'Configure leave entitlements and rules'}
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

        {/* Quick Setup Button - Only show in create mode */}
        {!isEditMode && (
          <div className="p-6 border-b" style={{ borderColor: `${COLORS.gold}20` }}>
            <button
              type="button"
              onClick={handleQuickSetup}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                border: `1px solid ${COLORS.gold}40`,
                color: COLORS.gold
              }}
              disabled={isLoading}
            >
              <Zap className="w-4 h-4" />
              Quick Setup: Create Default Policy (30 days, Monthly Accrual)
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Policy Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
              Policy Name <span style={{ color: COLORS.rose }}>*</span>
            </label>
            <input
              type="text"
              value={formData.policy_name}
              onChange={e => handleChange('policy_name', e.target.value)}
              placeholder="e.g., Full-Time Annual Leave Policy"
              className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2"
              style={{
                backgroundColor: COLORS.black,
                borderColor: errors.policy_name ? COLORS.rose : `${COLORS.bronze}30`,
                color: COLORS.champagne,
                outline: 'none'
              }}
              disabled={isLoading}
            />
            {errors.policy_name && (
              <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: COLORS.rose }}>
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.policy_name}
              </div>
            )}
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
              Leave Type <span style={{ color: COLORS.rose }}>*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['ANNUAL', 'SICK', 'UNPAID', 'OTHER'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('leave_type', type)}
                  className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: formData.leave_type === type ? `${COLORS.gold}40` : `${COLORS.gold}10`,
                    color: formData.leave_type === type ? COLORS.champagne : COLORS.bronze,
                    border: formData.leave_type === type ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.bronze}30`
                  }}
                  disabled={isLoading}
                >
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Annual Entitlement & Accrual Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
                Annual Entitlement (days) <span style={{ color: COLORS.rose }}>*</span>
              </label>
              <input
                type="number"
                value={formData.annual_entitlement}
                onChange={e => handleChange('annual_entitlement', parseInt(e.target.value) || 0)}
                min="1"
                max="365"
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2"
                style={{
                  backgroundColor: COLORS.black,
                  borderColor: errors.annual_entitlement ? COLORS.rose : `${COLORS.bronze}30`,
                  color: COLORS.champagne,
                  outline: 'none'
                }}
                disabled={isLoading}
              />
              {errors.annual_entitlement && (
                <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: COLORS.rose }}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.annual_entitlement}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
                Accrual Method <span style={{ color: COLORS.rose }}>*</span>
              </label>
              <select
                value={formData.accrual_method}
                onChange={e => handleChange('accrual_method', e.target.value as 'IMMEDIATE' | 'MONTHLY')}
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2"
                style={{
                  backgroundColor: COLORS.black,
                  borderColor: `${COLORS.bronze}30`,
                  color: COLORS.champagne,
                  outline: 'none'
                }}
                disabled={isLoading}
              >
                <option value="MONTHLY">Monthly (Prorated)</option>
                <option value="IMMEDIATE">Immediate (Full entitlement)</option>
              </select>
              <div className="text-xs mt-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                {formData.accrual_method === 'MONTHLY'
                  ? `Staff accrue ${(formData.annual_entitlement / 12).toFixed(1)} days per month`
                  : 'Staff get full entitlement on joining'}
              </div>
            </div>
          </div>

          {/* Applies To */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
              Applies To <span style={{ color: COLORS.rose }}>*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['ALL', 'FULL_TIME', 'PART_TIME'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('applies_to', type)}
                  className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: formData.applies_to === type ? `${COLORS.gold}40` : `${COLORS.gold}10`,
                    color: formData.applies_to === type ? COLORS.champagne : COLORS.bronze,
                    border: formData.applies_to === type ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.bronze}30`
                  }}
                  disabled={isLoading}
                >
                  {type === 'ALL' ? 'All Staff' : type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join('-')}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Rules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
                Min Notice Days
              </label>
              <input
                type="number"
                value={formData.min_notice_days}
                onChange={e => handleChange('min_notice_days', parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2"
                style={{
                  backgroundColor: COLORS.black,
                  borderColor: `${COLORS.bronze}30`,
                  color: COLORS.champagne,
                  outline: 'none'
                }}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
                Max Consecutive Days
              </label>
              <input
                type="number"
                value={formData.max_consecutive_days}
                onChange={e => handleChange('max_consecutive_days', parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2"
                style={{
                  backgroundColor: COLORS.black,
                  borderColor: `${COLORS.bronze}30`,
                  color: COLORS.champagne,
                  outline: 'none'
                }}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
                Min Leave Days
              </label>
              <select
                value={formData.min_leave_days}
                onChange={e => handleChange('min_leave_days', parseFloat(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 focus:ring-2"
                style={{
                  backgroundColor: COLORS.black,
                  borderColor: `${COLORS.bronze}30`,
                  color: COLORS.champagne,
                  outline: 'none'
                }}
                disabled={isLoading}
              >
                <option value="0.5">0.5 (Half day)</option>
                <option value="1">1 (Full day)</option>
              </select>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={e => handleChange('active', e.target.checked)}
              className="w-5 h-5 rounded"
              style={{ accentColor: COLORS.gold }}
              disabled={isLoading}
            />
            <label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
              Policy is active
            </label>
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
              disabled={isLoading || !onSubmit}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div
                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: COLORS.black }}
                  />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                isEditMode ? 'Update Policy' : 'Create Policy'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
