'use client'

/**
 * ✨ BUSINESS HOURS SECTION - Branch-Aware
 *
 * FEATURES:
 * - Branch-specific business hours configuration
 * - 7-day weekly schedule with time pickers
 * - Toggle switches for closed days
 * - HERA DNA compliant (smart codes + dynamic data)
 * - Mobile-first responsive design
 * - Actor-stamped mutations via entityCRUD
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Clock, Save, Loader2, Building2 } from 'lucide-react'
import { SALON_LUXE_COLORS as LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
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
  sunday: { open: '10:00', close: '18:00', is_open: false }
}

export function BusinessHoursSection({ onSuccess, onError }: {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}) {
  const context = useSecuredSalonContext()
  const { user } = useHERAAuth()
  const [hours, setHours] = useState<BusinessHoursData>(DEFAULT_HOURS)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

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
      fullBranch: selectedBranch
    })

    if (selectedBranch?.business_hours) {
      try {
        const loadedHours = typeof selectedBranch.business_hours === 'string'
          ? JSON.parse(selectedBranch.business_hours)
          : selectedBranch.business_hours
        console.log('[BusinessHours] Loaded hours:', loadedHours)
        setHours({ ...DEFAULT_HOURS, ...loadedHours })
        setHasChanges(false)
      } catch (error) {
        console.error('[BusinessHours] Failed to parse business hours:', error)
        setHours(DEFAULT_HOURS)
      }
    } else {
      console.log('[BusinessHours] No business hours found, using defaults')
      setHours(DEFAULT_HOURS)
      setHasChanges(false)
    }
  }, [selectedBranch, selectedBranchId])

  const handleDayToggle = (day: keyof BusinessHoursData, enabled: boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], is_open: enabled }
    }))
    setHasChanges(true)
  }

  const handleTimeChange = (day: keyof BusinessHoursData, field: 'open' | 'close', value: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
    setHasChanges(true)
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

      setHasChanges(false)
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
        className="border-0 shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
          border: `1px solid ${LUXE_COLORS.border.light}`
        }}
      >
        <CardHeader>
          <CardTitle style={{ color: LUXE_COLORS.champagne.base }}>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: LUXE_COLORS.gold.base }} />
              Business Hours
            </div>
          </CardTitle>
          <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
            Set operating hours for each branch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label style={{ color: LUXE_COLORS.champagne.base }} className="mb-2 block">
              Select Branch
            </Label>
            <BranchSelector variant="default" />
          </div>
          <div
            className="p-6 rounded-xl text-center"
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
      className="border-0 shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
        border: `1px solid ${LUXE_COLORS.border.light}`
      }}
    >
      <CardHeader>
        <CardTitle style={{ color: LUXE_COLORS.champagne.base }}>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" style={{ color: LUXE_COLORS.gold.base }} />
            Business Hours
          </div>
        </CardTitle>
        <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
          Set operating hours for {selectedBranch?.entity_name || 'this branch'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Branch Selector */}
        <div className="mb-6">
          <Label style={{ color: LUXE_COLORS.champagne.base }} className="mb-2 block">
            Branch
          </Label>
          <BranchSelector variant="default" />
        </div>

        {/* Days of Week */}
        <div className="space-y-3 mb-6">
          {DAYS.map(day => (
            <div
              key={day}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl transition-all duration-200"
              style={{
                background: hours[day].is_open
                  ? `linear-gradient(135deg, ${LUXE_COLORS.emerald.base}10 0%, ${LUXE_COLORS.emerald.base}05 100%)`
                  : `linear-gradient(135deg, ${LUXE_COLORS.charcoal.dark} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                border: `1px solid ${hours[day].is_open ? LUXE_COLORS.emerald.base + '30' : LUXE_COLORS.border.light}`
              }}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-3 min-w-[120px]">
                  <Switch
                    checked={hours[day].is_open}
                    onCheckedChange={(checked) => handleDayToggle(day, checked)}
                  />
                  <span
                    className="font-medium"
                    style={{
                      color: hours[day].is_open ? LUXE_COLORS.champagne.base : LUXE_COLORS.text.secondary
                    }}
                  >
                    {DAY_LABELS[day]}
                  </span>
                </div>

                {hours[day].is_open ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="time"
                      value={hours[day].open}
                      onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                      className="px-3 py-2 rounded-lg min-h-[44px] text-sm"
                      style={{
                        background: LUXE_COLORS.charcoal.dark,
                        color: LUXE_COLORS.champagne.base,
                        border: `1px solid ${LUXE_COLORS.border.light}`
                      }}
                    />
                    <span style={{ color: LUXE_COLORS.text.secondary }}>to</span>
                    <input
                      type="time"
                      value={hours[day].close}
                      onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                      className="px-3 py-2 rounded-lg min-h-[44px] text-sm"
                      style={{
                        background: LUXE_COLORS.charcoal.dark,
                        color: LUXE_COLORS.champagne.base,
                        border: `1px solid ${LUXE_COLORS.border.light}`
                      }}
                    />
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

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="w-full min-h-[48px] font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: hasChanges ? LUXE_COLORS.gold.base : LUXE_COLORS.charcoal.dark,
            color: hasChanges ? LUXE_COLORS.charcoal.dark : LUXE_COLORS.text.secondary
          }}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {hasChanges ? 'Save Business Hours' : 'No Changes'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
