'use client'

/**
 * ✨ BUSINESS HOURS SECTION v2.0 - Enterprise Grade
 *
 * UPGRADED FEATURES:
 * - ✅ View/Edit mode toggle (matches Organization Settings UX)
 * - ✅ Edit button with Cancel/Save workflow
 * - ✅ Clean read-only display by default
 * - ✅ Enterprise-grade layout and spacing
 * - ✅ SalonLuxeButton components
 * - ✅ Improved visual hierarchy and alignment
 * - ✅ Branch-specific business hours configuration
 * - ✅ 7-day weekly schedule with time pickers
 * - ✅ HERA DNA compliant (smart codes + dynamic data)
 * - ✅ Actor-stamped mutations via entityCRUD
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Clock, Save, Building2, Edit, X, Sparkles } from 'lucide-react'
import { SALON_LUXE_COLORS as LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { BranchSelector } from '@/components/salon/BranchSelector'
import { entityCRUD } from '@/lib/universal-api-v2-client'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

interface DayHours {
  open: string
  close: string
  is_open: boolean
}

interface BusinessHoursData {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
}

const DEFAULT_HOURS: BusinessHoursData = {
  monday: { open: '09:00', close: '20:00', is_open: true },
  tuesday: { open: '09:00', close: '20:00', is_open: true },
  wednesday: { open: '09:00', close: '20:00', is_open: true },
  thursday: { open: '09:00', close: '20:00', is_open: true },
  friday: { open: '09:00', close: '20:00', is_open: true },
  saturday: { open: '09:00', close: '20:00', is_open: true },
  sunday: { open: '09:00', close: '20:00', is_open: true } // ✅ All days open by default - salons can customize
}

export function BusinessHoursSection({ onSuccess, onError }: {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}) {
  const context = useSecuredSalonContext()
  const { user } = useHERAAuth()
  const [hours, setHours] = useState<BusinessHoursData>(DEFAULT_HOURS)
  const [originalHours, setOriginalHours] = useState<BusinessHoursData>(DEFAULT_HOURS)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const selectedBranch = context?.selectedBranch
  const selectedBranchId = context?.selectedBranchId
  const organizationId = context?.organizationId

  // Load business hours from branch dynamic fields
  useEffect(() => {
    console.log('[BusinessHours] Loading hours for branch:', {
      branchId: selectedBranchId,
      branchName: selectedBranch?.entity_name,
      hasBusinessHours: !!selectedBranch?.business_hours,
      businessHours: selectedBranch?.business_hours,
      hasOpeningTime: !!selectedBranch?.opening_time,
      hasClosingTime: !!selectedBranch?.closing_time,
      opening_time: selectedBranch?.opening_time,
      closing_time: selectedBranch?.closing_time
    })

    if (selectedBranch?.business_hours) {
      // ✅ NEW FORMAT: Use business_hours JSON object (7-day schedule)
      try {
        const loadedHours = typeof selectedBranch.business_hours === 'string'
          ? JSON.parse(selectedBranch.business_hours)
          : selectedBranch.business_hours
        console.log('[BusinessHours] Loaded hours from business_hours field:', loadedHours)
        const mergedHours = { ...DEFAULT_HOURS, ...loadedHours }
        setHours(mergedHours)
        setOriginalHours(mergedHours)
      } catch (error) {
        console.error('[BusinessHours] Failed to parse business hours:', error)
        setHours(DEFAULT_HOURS)
        setOriginalHours(DEFAULT_HOURS)
      }
    } else if (selectedBranch?.opening_time && selectedBranch?.closing_time) {
      // ✅ LEGACY FORMAT: Convert old opening_time/closing_time to new format
      console.log('[BusinessHours] Converting legacy opening/closing times to business_hours format')
      const legacyHours: BusinessHoursData = {
        monday: { open: selectedBranch.opening_time, close: selectedBranch.closing_time, is_open: true },
        tuesday: { open: selectedBranch.opening_time, close: selectedBranch.closing_time, is_open: true },
        wednesday: { open: selectedBranch.opening_time, close: selectedBranch.closing_time, is_open: true },
        thursday: { open: selectedBranch.opening_time, close: selectedBranch.closing_time, is_open: true },
        friday: { open: selectedBranch.opening_time, close: selectedBranch.closing_time, is_open: true },
        saturday: { open: selectedBranch.opening_time, close: selectedBranch.closing_time, is_open: true },
        sunday: { open: selectedBranch.opening_time, close: selectedBranch.closing_time, is_open: true } // ✅ All days open for legacy
      }
      setHours(legacyHours)
      setOriginalHours(legacyHours)
    } else {
      console.log('[BusinessHours] No business hours found, using defaults')
      setHours(DEFAULT_HOURS)
      setOriginalHours(DEFAULT_HOURS)
    }

    // Reset edit mode when branch changes
    setIsEditing(false)
  }, [selectedBranch, selectedBranchId])

  const handleDayToggle = (day: keyof BusinessHoursData, enabled: boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], is_open: enabled }
    }))
  }

  const handleTimeChange = (day: keyof BusinessHoursData, field: 'open' | 'close', value: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
  }

  const handleCancelEdit = () => {
    setHours(originalHours)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!selectedBranchId || !organizationId || !user?.id) {
      console.error('[BusinessHours] Missing required info:', { selectedBranchId, organizationId, userId: user?.id })
      onError?.('Missing required information')
      return
    }

    if (selectedBranchId === 'all') {
      onError?.('Please select a specific branch to configure hours')
      return
    }

    setIsSaving(true)

    try {
      console.log('[BusinessHours] Saving hours:', {
        branchId: selectedBranchId,
        organizationId,
        actorUserId: user.id,
        hours
      })

      // Save business hours to branch entity via entityCRUD
      const payload = {
        action: 'UPDATE',
        actor_user_id: user.id,
        organization_id: organizationId,
        entity: {
          entity_id: selectedBranchId,
          entity_type: 'BRANCH'
        },
        dynamic: {
          business_hours: {
            field_type: 'json',
            field_value_json: hours,
            smart_code: 'HERA.SALON.BRANCH.FIELD.BUSINESS_HOURS.v1'
          }
        }
      }

      console.log('[BusinessHours] EntityCRUD payload:', payload)

      const result = await entityCRUD(payload)

      console.log('[BusinessHours] Save result:', result)

      setOriginalHours(hours)
      setIsEditing(false)
      onSuccess?.('Business hours updated successfully')

      // Reload branches to get updated data
      if (context?.loadBranches) {
        await context.loadBranches(organizationId)
      }
    } catch (error) {
      console.error('[BusinessHours] Failed to save business hours:', error)
      onError?.('Failed to save business hours')
    } finally {
      setIsSaving(false)
    }
  }

  // Show message when no branch selected or "All Locations" selected
  if (!selectedBranchId || selectedBranchId === 'all') {
    return (
      <Card
        className="border-0 shadow-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
          border: `1px solid ${LUXE_COLORS.border.light}`,
          borderRadius: '16px'
        }}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.gold.base}20 0%, ${LUXE_COLORS.gold.base}30 100%)`,
                border: `1px solid ${LUXE_COLORS.gold.base}40`
              }}
            >
              <Clock className="w-6 h-6" style={{ color: LUXE_COLORS.gold.base }} />
            </div>
            <div>
              <CardTitle className="text-xl" style={{ color: LUXE_COLORS.champagne.base }}>
                Business Hours
              </CardTitle>
              <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                Set operating hours for each branch
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label style={{ color: LUXE_COLORS.champagne.base }} className="mb-2 block text-sm font-medium">
              Select Branch
            </Label>
            <BranchSelector variant="default" />
          </div>
          <div
            className="p-8 rounded-xl text-center"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.gold.base}15 0%, ${LUXE_COLORS.gold.base}05 100%)`,
              border: `1px solid ${LUXE_COLORS.gold.base}30`
            }}
          >
            <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: LUXE_COLORS.gold.base }} />
            <p style={{ color: LUXE_COLORS.champagne.base }} className="font-medium mb-1">
              Select a Branch
            </p>
            <p style={{ color: LUXE_COLORS.text.secondary }} className="text-sm">
              Choose a specific branch to configure its operating hours
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="border-0 shadow-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
        border: `1px solid ${LUXE_COLORS.border.light}`,
        borderRadius: '16px'
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.gold.base}20 0%, ${LUXE_COLORS.gold.base}30 100%)`,
                border: `1px solid ${LUXE_COLORS.gold.base}40`
              }}
            >
              <Clock className="w-6 h-6" style={{ color: LUXE_COLORS.gold.base }} />
            </div>
            <div>
              <CardTitle className="text-xl" style={{ color: LUXE_COLORS.champagne.base }}>
                Business Hours
              </CardTitle>
              <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                Operating hours for {selectedBranch?.entity_name || 'this branch'}
              </CardDescription>
            </div>
          </div>
          {/* Edit Button */}
          {!isEditing && (
            <SalonLuxeButton
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="md"
              icon={<Edit className="h-5 w-5" />}
            >
              Edit
            </SalonLuxeButton>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Branch Selector */}
        <div>
          <Label style={{ color: LUXE_COLORS.text.secondary }} className="mb-2 block text-sm font-medium">
            Branch
          </Label>
          <BranchSelector variant="default" />
        </div>

        {/* Days of Week */}
        <div className="space-y-3">
          {DAYS.map(day => (
            <div
              key={day}
              className="rounded-xl p-4 transition-all duration-200"
              style={{
                background: hours[day].is_open
                  ? `linear-gradient(135deg, ${LUXE_COLORS.emerald.base}10 0%, ${LUXE_COLORS.emerald.base}05 100%)`
                  : `linear-gradient(135deg, ${LUXE_COLORS.charcoal.dark} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                border: `1px solid ${hours[day].is_open ? LUXE_COLORS.emerald.base + '30' : LUXE_COLORS.border.light}`
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Day Label and Toggle */}
                <div className="flex items-center gap-4 min-w-[160px]">
                  {isEditing ? (
                    <button
                      onClick={() => handleDayToggle(day, !hours[day].is_open)}
                      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        backgroundColor: hours[day].is_open ? LUXE_COLORS.emerald.base : LUXE_COLORS.border.light,
                        borderColor: hours[day].is_open ? LUXE_COLORS.emerald.base : LUXE_COLORS.border.light
                      }}
                      role="switch"
                      aria-checked={hours[day].is_open}
                    >
                      <span
                        className="inline-block h-5 w-5 transform rounded-full shadow-lg transition duration-200 ease-in-out"
                        style={{
                          backgroundColor: LUXE_COLORS.champagne.base,
                          transform: hours[day].is_open ? 'translateX(20px)' : 'translateX(0)'
                        }}
                      />
                    </button>
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: hours[day].is_open ? LUXE_COLORS.emerald.base : LUXE_COLORS.charcoal.dark,
                        border: `2px solid ${hours[day].is_open ? LUXE_COLORS.emerald.base : LUXE_COLORS.border.light}`
                      }}
                    >
                      {hours[day].is_open && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LUXE_COLORS.charcoal.dark }} />
                      )}
                    </div>
                  )}
                  <span
                    className="font-medium text-base"
                    style={{
                      color: hours[day].is_open ? LUXE_COLORS.champagne.base : LUXE_COLORS.text.secondary
                    }}
                  >
                    {DAY_LABELS[day]}
                  </span>
                </div>

                {/* Time Display/Input */}
                {hours[day].is_open ? (
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <>
                        <input
                          type="time"
                          value={hours[day].open}
                          onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                          className="px-4 py-2 rounded-lg min-h-[44px] text-sm font-medium"
                          style={{
                            background: LUXE_COLORS.charcoal.dark,
                            color: LUXE_COLORS.champagne.base,
                            border: `1px solid ${LUXE_COLORS.border.base}`
                          }}
                        />
                        <span className="text-sm font-medium" style={{ color: LUXE_COLORS.text.secondary }}>to</span>
                        <input
                          type="time"
                          value={hours[day].close}
                          onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                          className="px-4 py-2 rounded-lg min-h-[44px] text-sm font-medium"
                          style={{
                            background: LUXE_COLORS.charcoal.dark,
                            color: LUXE_COLORS.champagne.base,
                            border: `1px solid ${LUXE_COLORS.border.base}`
                          }}
                        />
                      </>
                    ) : (
                      <span className="text-base font-medium" style={{ color: LUXE_COLORS.champagne.base }}>
                        {hours[day].open} - {hours[day].close}
                      </span>
                    )}
                  </div>
                ) : (
                  <span
                    className="text-sm italic"
                    style={{ color: LUXE_COLORS.text.secondary }}
                  >
                    Closed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ✅ Conditional footer: Show Save/Cancel only when editing */}
        {isEditing && (
          <div className="flex justify-end gap-3 pt-6 border-t" style={{ borderColor: LUXE_COLORS.border.light }}>
            <SalonLuxeButton
              onClick={handleCancelEdit}
              variant="outline"
              size="md"
              icon={<X className="h-4 w-4" />}
            >
              Cancel
            </SalonLuxeButton>
            <SalonLuxeButton
              onClick={handleSave}
              loading={isSaving}
              variant="primary"
              size="md"
              icon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </SalonLuxeButton>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
