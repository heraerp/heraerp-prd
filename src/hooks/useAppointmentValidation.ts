// ================================================================================
// APPOINTMENT VALIDATION HOOK
// Smart Code: HERA.HOOKS.SALON.APPOINTMENTS.VALIDATION.v1
// Real-time validation tracking for appointment booking
// ================================================================================

import { useMemo } from 'react'

export interface ValidationField {
  id: string
  label: string
  isComplete: boolean
  hint?: string
  value?: string
}

export interface ValidationResult {
  isValid: boolean
  completedCount: number
  totalCount: number
  progress: number // 0-100
  fields: ValidationField[]
  missingFields: ValidationField[]
}

interface UseAppointmentValidationProps {
  hasMultipleBranches: boolean
  branchId?: string | null
  branchName?: string
  selectedCustomer: any
  selectedStylist: any
  selectedTime: string
  selectedDate: string
  cart: any[]
  checkStaffAvailability?: (staffId: string, date: string, period: string) => {
    isAvailable: boolean
    leaveStatus?: any
  }
}

export function useAppointmentValidation({
  hasMultipleBranches,
  branchId,
  branchName,
  selectedCustomer,
  selectedStylist,
  selectedTime,
  selectedDate,
  cart,
  checkStaffAvailability
}: UseAppointmentValidationProps): ValidationResult {
  return useMemo(() => {
    const fields: ValidationField[] = []

    // 1. Branch Location (conditional)
    if (hasMultipleBranches) {
      fields.push({
        id: 'branch',
        label: 'Branch Location',
        isComplete: !!branchId,
        hint: branchId ? undefined : 'Select a branch to continue',
        value: branchName || (branchId ? 'Branch selected' : undefined)
      })
    }

    // 2. Customer Selection
    fields.push({
      id: 'customer',
      label: 'Customer',
      isComplete: !!selectedCustomer,
      hint: selectedCustomer ? undefined : 'Select or create a customer',
      value: selectedCustomer?.entity_name
    })

    // 3. Stylist Selection with Availability Check
    const staffAvailability = checkStaffAvailability && selectedStylist
      ? checkStaffAvailability(selectedStylist.id, selectedDate, 'full_day')
      : { isAvailable: true }

    fields.push({
      id: 'stylist',
      label: 'Stylist',
      isComplete: !!selectedStylist && staffAvailability.isAvailable,
      hint: !selectedStylist
        ? 'Select a stylist'
        : !staffAvailability.isAvailable
          ? `${selectedStylist.entity_name} is on leave - select another stylist`
          : undefined,
      value: selectedStylist?.entity_name
    })

    // 4. Appointment Time
    fields.push({
      id: 'time',
      label: 'Appointment Time',
      isComplete: !!selectedTime,
      hint: selectedTime ? undefined : 'Select date and time slot',
      value: selectedTime ? `${selectedDate} at ${selectedTime}` : undefined
    })

    // 5. Services in Cart
    const serviceCount = cart.length
    const serviceSummary = cart
      .map(item => `${item.service.entity_name}${item.quantity > 1 ? ` (×${item.quantity})` : ''}`)
      .join(', ')

    fields.push({
      id: 'services',
      label: 'Services',
      isComplete: serviceCount > 0,
      hint: serviceCount === 0 ? 'Add at least one service' : undefined,
      value: serviceCount > 0 ? `${serviceCount} service(s): ${serviceSummary}` : undefined
    })

    // Calculate completion metrics
    const completedCount = fields.filter(f => f.isComplete).length
    const totalCount = fields.length
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    const isValid = completedCount === totalCount
    const missingFields = fields.filter(f => !f.isComplete)

    return {
      isValid,
      completedCount,
      totalCount,
      progress,
      fields,
      missingFields
    }
  }, [
    hasMultipleBranches,
    branchId,
    branchName,
    selectedCustomer,
    selectedStylist,
    selectedTime,
    selectedDate,
    cart,
    checkStaffAvailability
  ])
}
