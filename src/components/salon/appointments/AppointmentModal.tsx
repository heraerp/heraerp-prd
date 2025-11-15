/**
 * ✨ ENTERPRISE: Appointment View/Edit Modal
 * Smart Code: HERA.SALON.APPOINTMENTS.MODAL.V1
 *
 * Features:
 * - View/Edit in single modal
 * - Time slot selection with conflict detection
 * - Service add/remove
 * - Branch/Customer/Stylist selection
 * - Luxe theme with soft animations
 * - Enterprise-grade UX
 */

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { format, addMinutes, parse } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/luxe-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  X,
  Check,
  Scissors,
  Building2,
  Save,
  Edit2,
  Plus,
  Trash2,
  Loader2,
  Phone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/hooks/useHeraAppointments'

// 🎯 ENTERPRISE: Duration formatter - converts minutes to hrs:min format
const formatDuration = (minutes: number): string => {
  if (!minutes || minutes === 0) return '0 min'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`
  return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ${mins} min`
}

// 🎨 Luxe Theme Colors
const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  rose: '#E8B4B8',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  ease: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
}

interface AppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  customers: any[]
  stylists: any[]
  services: any[]
  branches: any[]
  onSave: (data: any) => Promise<void>
  existingAppointments?: Appointment[]
  currencySymbol?: string
}

interface TimeSlot {
  start: string
  end: string
  hasConflict: boolean
}

export function AppointmentModal({
  open,
  onOpenChange,
  appointment,
  customers,
  stylists,
  services,
  branches,
  onSave,
  existingAppointments = [],
  currencySymbol = 'AED'
}: AppointmentModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedStylist, setSelectedStylist] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState(60)
  const [price, setPrice] = useState(0)
  const [catalogTotal, setCatalogTotal] = useState(0) // Track original catalog price for comparison

  // Initialize form when appointment changes
  useEffect(() => {
    if (appointment && open) {
      setSelectedCustomer(appointment.customer_id || '')
      setSelectedStylist(appointment.stylist_id || '')
      setSelectedBranch(appointment.branch_id || '')
      setSelectedDate(
        appointment.start_time ? format(new Date(appointment.start_time), 'yyyy-MM-dd') : ''
      )
      setSelectedTime(
        appointment.start_time ? format(new Date(appointment.start_time), 'HH:mm') : ''
      )
      setNotes(appointment.notes || '')
      setDuration(appointment.duration_minutes || 60)
      setPrice(appointment.price || 0)

      // ✨ ENTERPRISE: Extract service IDs from metadata - handle ALL possible formats
      let serviceIds: string[] = []
      const metadata = appointment.metadata || {}

      // Option 1: metadata.service_ids (array)
      if (Array.isArray(metadata.service_ids)) {
        serviceIds = metadata.service_ids.filter(Boolean)
      }
      // Option 2: metadata.service_ids (string - JSON or comma-separated)
      else if (typeof metadata.service_ids === 'string' && metadata.service_ids.trim()) {
        try {
          const parsed = JSON.parse(metadata.service_ids)
          serviceIds = Array.isArray(parsed) ? parsed : [parsed]
        } catch {
          serviceIds = metadata.service_ids
            .split(',')
            .map((id: string) => id.trim())
            .filter(Boolean)
        }
      }
      // Option 3: metadata.services (array of objects with id property)
      else if (Array.isArray(metadata.services) && metadata.services.length > 0) {
        serviceIds = metadata.services.map((s: any) => s?.id || s).filter(Boolean)
      }
      // Option 4: metadata.service_id (singular)
      else if (metadata.service_id) {
        serviceIds = [metadata.service_id]
      }
      // Option 5: Check appointment.service_ids directly (not in metadata)
      else if ((appointment as any).service_ids) {
        const directIds = (appointment as any).service_ids
        serviceIds = Array.isArray(directIds) ? directIds : [directIds]
      }

      setSelectedServices(serviceIds)
      setIsEditing(false)
    }
  }, [appointment, open, services])

  // 🕐 ENTERPRISE: Generate time slots - EXACT COPY from /new page
  const generateTimeSlots = useCallback((): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const now = new Date()
    const selectedDateObj = selectedDate ? new Date(selectedDate) : new Date()
    const isToday = selectedDateObj.toDateString() === now.toDateString()

    // Working hours: 9:00 AM to 9:00 PM
    const startHour = 9
    const endHour = 21

    // Start from current hour if today, otherwise from opening time
    let currentHour = isToday ? Math.max(now.getHours(), startHour) : startHour
    let currentMinute = isToday ? (now.getMinutes() < 30 ? 30 : 0) : 0

    // If today and current minute is 30+, start from next hour
    if (isToday && now.getMinutes() >= 30 && currentMinute === 0) {
      currentHour += 1
    }

    // Generate 30-minute slots
    while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
      const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

      // Calculate end time (30 minutes later)
      let endMinute = currentMinute + 30
      let endHour = currentHour
      if (endMinute >= 60) {
        endMinute = 0
        endHour += 1
      }
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`

      slots.push({
        start: startTime,
        end: endTime,
        hasConflict: false
      })

      // Move to next slot
      currentMinute += 30
      if (currentMinute >= 60) {
        currentMinute = 0
        currentHour += 1
      }
    }

    return slots
  }, [selectedDate])

  // 🔍 ENTERPRISE: Check for time slot conflicts - EXACT COPY from /new page
  const checkTimeSlotConflict = useCallback(
    (slotStart: string) => {
      if (!selectedStylist || !existingAppointments || existingAppointments.length === 0) {
        return { hasConflict: false, conflictingAppointment: null }
      }

      // Parse slot start time
      const [hours, minutes] = slotStart.split(':').map(Number)
      const slotDateTime = new Date(selectedDate)
      slotDateTime.setHours(hours, minutes, 0, 0)

      // Calculate slot end time (30 minutes later)
      const slotEndTime = new Date(slotDateTime)
      slotEndTime.setMinutes(slotEndTime.getMinutes() + 30)

      // ✨ ENTERPRISE: Only these statuses block time slots
      const BLOCKING_STATUSES = [
        'booked', // Confirmed appointment
        'checked_in', // Customer has arrived
        'in_progress', // Service is happening
        'payment_pending' // Service done, awaiting payment
      ]

      // Check for conflicts with existing appointments for this stylist
      const conflict = existingAppointments.find(apt => {
        // Skip current appointment when editing
        if (appointment && apt.id === appointment.id) return false

        // Only check appointments for the selected stylist
        if (apt.stylist_id !== selectedStylist) return false

        // 🧬 ENTERPRISE: Only block time slots for confirmed/active appointments
        if (!BLOCKING_STATUSES.includes(apt.status)) {
          return false
        }

        // Parse appointment times
        const aptStart = new Date(apt.start_time)
        const aptEnd = new Date(apt.end_time)

        // Check for overlap: slot overlaps if it starts before appointment ends AND ends after appointment starts
        const overlaps = slotDateTime < aptEnd && slotEndTime > aptStart

        return overlaps
      })

      return {
        hasConflict: !!conflict,
        conflictingAppointment: conflict || null
      }
    },
    [selectedStylist, existingAppointments, selectedDate, appointment]
  )

  // Generate available time slots
  const timeSlots = useMemo(() => generateTimeSlots(), [generateTimeSlots])

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !selectedStylist) return timeSlots

    const today = format(new Date(), 'yyyy-MM-dd')
    const isToday = selectedDate === today
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    return timeSlots
      .filter(slot => {
        // If selected date is today, only show future time slots
        if (isToday) {
          const [slotHour, slotMinute] = slot.start.split(':').map(Number)
          // Add 30 minute buffer for booking
          if (
            slotHour < currentHour ||
            (slotHour === currentHour && slotMinute <= currentMinute + 30)
          ) {
            return false
          }
        }
        return true
      })
      .map(slot => ({
        ...slot,
        ...checkTimeSlotConflict(slot.start)
      }))
  }, [timeSlots, selectedDate, selectedStylist, checkTimeSlotConflict])

  // Calculate total price and duration from selected services
  useEffect(() => {
    if (selectedServices.length > 0) {
      // 🔥 FIX: When viewing (not editing), use custom prices from appointment metadata
      const customPrices = appointment?.metadata?.service_prices || []
      const useCustomPrices = !isEditing && customPrices.length > 0

      let total = 0
      let catalogTotalCalc = 0

      selectedServices.forEach((serviceId, index) => {
        const service = services.find(s => s.id === serviceId)
        if (!service) return

        const catalogPrice = service.price_market || service.dynamic_fields?.price_market?.value || 0
        catalogTotalCalc += catalogPrice

        let servicePrice
        if (useCustomPrices && customPrices[index] !== undefined && customPrices[index] !== null) {
          // Use custom price from appointment metadata
          servicePrice = customPrices[index]
        } else {
          // Use catalog price
          servicePrice = catalogPrice
        }

        total += servicePrice
      })

      const totalDuration = selectedServices.reduce((sum, serviceId) => {
        const service = services.find(s => s.id === serviceId)
        if (!service) return sum

        const serviceDuration =
          service.duration_min || service.dynamic_fields?.duration_min?.value || 30
        return sum + serviceDuration
      }, 0)

      setPrice(total)
      setCatalogTotal(catalogTotalCalc)
      setDuration(totalDuration)
    }
  }, [selectedServices, services, isEditing, appointment?.metadata?.service_prices])

  // ✅ FIX: Clear selected time ONLY when stylist or date ACTUALLY changes (not when entering edit mode)
  useEffect(() => {
    if (isEditing && appointment) {
      // Only clear time if stylist or date changed from original
      const originalStylist = appointment.stylist_id
      const originalDate = appointment.start_time ? format(new Date(appointment.start_time), 'yyyy-MM-dd') : ''

      if (selectedStylist !== originalStylist || selectedDate !== originalDate) {
        setSelectedTime('')
      }
    }
  }, [selectedStylist, selectedDate, isEditing, appointment])

  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true)

      const startDateTime = new Date(`${selectedDate}T${selectedTime}`)
      const endDateTime = addMinutes(startDateTime, duration)

      await onSave({
        customer_id: selectedCustomer,
        stylist_id: selectedStylist || null,
        branch_id: selectedBranch || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration_minutes: duration,
        price,
        notes: notes.trim() || null,
        service_ids: selectedServices
      })

      setIsEditing(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle service toggle
  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    )
  }

  if (!appointment) return null

  // ✅ CRITICAL FIX: Handle both entity_name and name fields for branches
  const customerName =
    customers.find(c => c.id === appointment.customer_id)?.entity_name || 'Unknown'
  const customerPhone =
    customers.find(c => c.id === appointment.customer_id)?.phone ||
    customers.find(c => c.id === appointment.customer_id)?.dynamic_fields?.phone?.value ||
    null
  const stylistName =
    stylists.find(s => s.id === appointment.stylist_id)?.entity_name || 'Unassigned'
  const branchName =
    branches.find(b => b.id === appointment.branch_id)?.entity_name ||
    branches.find(b => b.id === appointment.branch_id)?.name ||
    'Main Branch'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl p-0 border-0"
        style={{
          background: 'linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.2)'
        }}
      >
        <DialogHeader
          className="p-6 pb-4 flex flex-row items-center justify-between"
          style={{ borderBottom: `1px solid ${LUXE_COLORS.gold}15` }}
        >
          <div className="flex-1">
            <DialogTitle
              className="text-2xl flex items-center gap-3"
              style={{ color: LUXE_COLORS.champagne }}
            >
              <Calendar className="w-6 h-6" style={{ color: LUXE_COLORS.gold }} />
              Appointment Details
            </DialogTitle>
            <p className="text-sm mt-1" style={{ color: LUXE_COLORS.bronze }}>
              {appointment.transaction_code}
            </p>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Customer Selection */}
                <div>
                  <Label className="text-sm mb-2" style={{ color: LUXE_COLORS.champagne }}>
                    Customer
                  </Label>
                  {isEditing ? (
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger
                        style={{
                          background: 'rgba(245,230,200,0.05)',
                          border: `1px solid ${LUXE_COLORS.gold}20`,
                          color: LUXE_COLORS.champagne
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="hera-select-content">
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.entity_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        background: 'rgba(212,175,55,0.1)',
                        border: `1px solid ${LUXE_COLORS.gold}20`,
                        color: LUXE_COLORS.champagne
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
                        <span>{customerName}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Phone Number */}
                {customerPhone && (
                  <div>
                    <Label className="text-sm mb-2" style={{ color: LUXE_COLORS.champagne }}>
                      Phone Number
                    </Label>
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        background: 'rgba(212,175,55,0.1)',
                        border: `1px solid ${LUXE_COLORS.gold}20`,
                        color: LUXE_COLORS.champagne
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
                        <a
                          href={`tel:${customerPhone}`}
                          className="hover:text-gold transition-colors"
                          style={{ color: LUXE_COLORS.champagne }}
                        >
                          {customerPhone}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stylist Selection */}
                <div>
                  <Label className="text-sm mb-2" style={{ color: LUXE_COLORS.champagne }}>
                    Stylist
                  </Label>
                  {isEditing ? (
                    <Select value={selectedStylist} onValueChange={setSelectedStylist}>
                      <SelectTrigger
                        style={{
                          background: 'rgba(245,230,200,0.05)',
                          border: `1px solid ${LUXE_COLORS.gold}20`,
                          color: LUXE_COLORS.champagne
                        }}
                      >
                        <SelectValue placeholder="Select stylist" />
                      </SelectTrigger>
                      <SelectContent className="hera-select-content">
                        {stylists.map(stylist => (
                          <SelectItem key={stylist.id} value={stylist.id}>
                            {stylist.entity_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        background: 'rgba(15,111,92,0.1)',
                        border: `1px solid ${LUXE_COLORS.emerald}20`,
                        color: LUXE_COLORS.champagne
                      }}
                    >
                      {stylistName}
                    </div>
                  )}
                </div>

                {/* Branch Selection - Always show */}
                <div>
                  <Label className="text-sm mb-2" style={{ color: LUXE_COLORS.champagne }}>
                    Branch
                  </Label>
                  {isEditing ? (
                    branches.length > 0 ? (
                      <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger
                          style={{
                            background: 'rgba(245,230,200,0.05)',
                            border: `1px solid ${LUXE_COLORS.gold}20`,
                            color: LUXE_COLORS.champagne
                          }}
                        >
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          {branches.map(branch => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {/* ✅ CRITICAL FIX: Handle both entity_name and name fields */}
                              {branch.entity_name || branch.name || 'Unnamed Branch'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div
                        className="p-3 rounded-lg text-sm"
                        style={{
                          background: 'rgba(212,175,55,0.1)',
                          border: `1px solid ${LUXE_COLORS.gold}20`,
                          color: LUXE_COLORS.bronze
                        }}
                      >
                        No branches available
                      </div>
                    )
                  ) : (
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(140,120,83,0.15) 0%, rgba(140,120,83,0.08) 100%)',
                        border: `1px solid ${LUXE_COLORS.bronze}30`,
                        color: LUXE_COLORS.champagne,
                        boxShadow: '0 2px 8px rgba(140,120,83,0.1)'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" style={{ color: LUXE_COLORS.bronze }} />
                        <span className="font-medium">{branchName}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Selection */}
                <div>
                  <Label
                    className="text-sm mb-2 font-medium"
                    style={{ color: LUXE_COLORS.champagne }}
                  >
                    Date {isEditing && <span style={{ color: LUXE_COLORS.gold }}>*</span>}
                  </Label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-offset-0"
                      style={{
                        background: 'rgba(245,230,200,0.1)',
                        border: `1px solid ${LUXE_COLORS.gold}40`,
                        color: LUXE_COLORS.champagne,
                        fontSize: '0.95rem',
                        fontWeight: '500'
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = LUXE_COLORS.gold
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${LUXE_COLORS.gold}20`
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}40`
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                  ) : (
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        color: LUXE_COLORS.champagne
                      }}
                    >
                      {appointment.start_time &&
                        format(new Date(appointment.start_time), 'EEEE, MMMM d, yyyy')}
                    </div>
                  )}
                </div>

                {/* Time Selection */}
                <div>
                  <Label
                    className="text-sm mb-2 font-medium flex items-center justify-between"
                    style={{ color: LUXE_COLORS.champagne }}
                  >
                    <span>
                      Time {isEditing && <span style={{ color: LUXE_COLORS.gold }}>*</span>}
                      {isEditing && duration > 0 && (
                        <span
                          className="text-xs ml-2 font-normal"
                          style={{ color: LUXE_COLORS.bronze }}
                        >
                          (Duration: {formatDuration(duration)})
                        </span>
                      )}
                    </span>
                    {isEditing && selectedStylist && (
                      <span
                        className="text-[10px] font-normal"
                        style={{ color: LUXE_COLORS.bronze, opacity: 0.8 }}
                      >
                        ✨ Draft appointments don't block slots
                      </span>
                    )}
                  </Label>
                  {isEditing ? (
                    selectedStylist && selectedDate ? (
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger
                          className="h-12"
                          style={{
                            background: 'rgba(245,230,200,0.1)',
                            border: `1px solid ${LUXE_COLORS.gold}40`,
                            color: LUXE_COLORS.champagne,
                            fontSize: '0.95rem',
                            fontWeight: '500'
                          }}
                        >
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content max-h-[300px]">
                          {availableTimeSlots.map(slot => {
                            const [hours, minutes] = slot.start.split(':').map(Number)
                            const period = hours >= 12 ? 'PM' : 'AM'
                            const displayHours = hours % 12 || 12
                            const displayTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`

                            // Get conflict details for tooltip
                            const conflictInfo =
                              slot.hasConflict && slot.conflictingAppointment
                                ? `${slot.conflictingAppointment.customer_name} (${slot.conflictingAppointment.status})`
                                : ''

                            return (
                              <SelectItem
                                key={slot.start}
                                value={slot.start}
                                disabled={slot.hasConflict}
                                className={cn(slot.hasConflict && 'opacity-50 cursor-not-allowed')}
                                title={conflictInfo}
                              >
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span>{displayTime}</span>
                                  {slot.hasConflict && (
                                    <div className="flex items-center gap-1">
                                      <Badge
                                        variant="destructive"
                                        className="text-[10px] px-1.5 py-0"
                                        style={{
                                          background: 'rgba(239, 68, 68, 0.2)',
                                          color: '#F87171',
                                          border: '1px solid rgba(239, 68, 68, 0.3)'
                                        }}
                                      >
                                        {slot.conflictingAppointment?.status || 'Booked'}
                                      </Badge>
                                      {slot.conflictingAppointment?.customer_name && (
                                        <span className="text-[10px] text-gray-500 truncate max-w-[100px]">
                                          {slot.conflictingAppointment.customer_name}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    ) : !selectedStylist ? (
                      <div
                        className="p-3 rounded-lg text-sm text-center"
                        style={{
                          background: 'rgba(212,175,55,0.1)',
                          border: `1px solid ${LUXE_COLORS.gold}20`,
                          color: LUXE_COLORS.bronze
                        }}
                      >
                        <Clock className="w-4 h-4 mx-auto mb-2" />
                        <p className="font-medium">Select stylist first</p>
                        <p className="text-xs mt-1" style={{ opacity: 0.7 }}>
                          Stylist selection required to check availability
                        </p>
                      </div>
                    ) : !selectedDate ? (
                      <div
                        className="p-3 rounded-lg text-sm text-center"
                        style={{
                          background: 'rgba(212,175,55,0.1)',
                          border: `1px solid ${LUXE_COLORS.gold}20`,
                          color: LUXE_COLORS.bronze
                        }}
                      >
                        <Calendar className="w-4 h-4 mx-auto mb-2" />
                        <p className="font-medium">Select date first</p>
                        <p className="text-xs mt-1" style={{ opacity: 0.7 }}>
                          Date selection required to show available time slots
                        </p>
                      </div>
                    ) : null
                  ) : (
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        color: LUXE_COLORS.champagne
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" style={{ color: '#3B82F6' }} />
                        <span>
                          {appointment.start_time &&
                            format(new Date(appointment.start_time), 'h:mm a')}
                          {' - '}
                          {appointment.end_time && format(new Date(appointment.end_time), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Services */}
              <div className="space-y-4">
                <Label
                  className="text-sm flex items-center justify-between"
                  style={{ color: LUXE_COLORS.champagne }}
                >
                  <span>Services</span>
                  {isEditing && (
                    <span className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                      Click to add/remove
                    </span>
                  )}
                </Label>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {!isEditing && selectedServices.length === 0 ? (
                      <div
                        className="p-6 rounded-lg text-center"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.05) 100%)',
                          border: `1px solid ${LUXE_COLORS.gold}20`,
                          color: LUXE_COLORS.bronze
                        }}
                      >
                        <Scissors
                          className="w-8 h-8 mx-auto mb-2"
                          style={{ color: LUXE_COLORS.gold }}
                        />
                        <p className="text-sm">No services selected for this appointment</p>
                        <p className="text-xs mt-2" style={{ opacity: 0.7 }}>
                          Click "Edit Appointment" to add services
                        </p>
                      </div>
                    ) : !services || services.length === 0 ? (
                      <div
                        className="p-6 rounded-lg text-center"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(232,180,184,0.1) 0%, rgba(232,180,184,0.05) 100%)',
                          border: `1px solid ${LUXE_COLORS.rose}20`,
                          color: LUXE_COLORS.bronze
                        }}
                      >
                        <Scissors
                          className="w-8 h-8 mx-auto mb-2"
                          style={{ color: LUXE_COLORS.rose }}
                        />
                        <p className="text-sm font-medium">⚠️ No services available</p>
                        <p className="text-xs mt-2" style={{ opacity: 0.7 }}>
                          Services data failed to load. Please check your connection and try again.
                        </p>
                      </div>
                    ) : (
                      services
                        .filter(service => {
                          if (isEditing) return true
                          // Flexible ID matching - handle both string and number comparisons
                          return selectedServices.some(
                            selectedId => String(selectedId) === String(service.id)
                          )
                        })
                        .map((service, serviceIndex) => {
                          // Flexible selection check
                          const isSelected = selectedServices.some(
                            selectedId => String(selectedId) === String(service.id)
                          )

                          // 🔥 FIX: Use custom price from metadata if available, otherwise use catalog price
                          const customPrices = appointment?.metadata?.service_prices || []
                          const selectedServiceIndex = selectedServices.findIndex(
                            selectedId => String(selectedId) === String(service.id)
                          )
                          const catalogPrice = service.price_market || service.dynamic_fields?.price_market?.value || 0

                          // Use custom price from appointment metadata if it exists for this service
                          const servicePrice = (selectedServiceIndex >= 0 && customPrices[selectedServiceIndex] !== undefined && customPrices[selectedServiceIndex] !== null)
                            ? customPrices[selectedServiceIndex]
                            : catalogPrice

                          const serviceDuration =
                            service.duration_min ||
                            service.dynamic_fields?.duration_min?.value ||
                            30

                          return (
                            <div
                              key={service.id}
                              onClick={() => isEditing && toggleService(service.id)}
                              className={cn(
                                'p-4 rounded-lg transition-all duration-300 cursor-pointer',
                                isEditing && 'hover:scale-102'
                              )}
                              style={{
                                background: isSelected
                                  ? 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.1) 100%)'
                                  : 'rgba(245,230,200,0.05)',
                                border: `1px solid ${isSelected ? LUXE_COLORS.gold : 'rgba(245,230,200,0.1)'}40`,
                                pointerEvents: isEditing ? 'auto' : 'none',
                                boxShadow: isSelected ? '0 4px 12px rgba(212,175,55,0.15)' : 'none'
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {isSelected && (
                                      <Check
                                        className="w-4 h-4"
                                        style={{ color: LUXE_COLORS.gold }}
                                      />
                                    )}
                                    <span
                                      className="font-medium"
                                      style={{ color: LUXE_COLORS.champagne }}
                                    >
                                      {service.entity_name}
                                    </span>
                                  </div>
                                  <div
                                    className="flex items-center gap-3 text-sm"
                                    style={{ color: LUXE_COLORS.bronze }}
                                  >
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDuration(serviceDuration)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="font-semibold"
                                        style={{ color: servicePrice !== catalogPrice ? LUXE_COLORS.gold : LUXE_COLORS.bronze }}
                                      >
                                        {currencySymbol} {servicePrice.toFixed(2)}
                                      </span>
                                      {!isEditing && servicePrice !== catalogPrice && (
                                        <span
                                          className="text-xs line-through opacity-60"
                                          style={{ color: LUXE_COLORS.bronze }}
                                          title="Original catalog price"
                                        >
                                          {currencySymbol} {catalogPrice.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {isEditing && isSelected && (
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{
                                      background: LUXE_COLORS.gold,
                                      color: LUXE_COLORS.black
                                    }}
                                  >
                                    <Check className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-sm mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Notes
              </Label>
              {isEditing ? (
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special requests..."
                  style={{
                    background: 'rgba(245,230,200,0.05)',
                    border: `1px solid ${LUXE_COLORS.gold}20`,
                    color: LUXE_COLORS.champagne
                  }}
                />
              ) : (
                <div
                  className="p-3 rounded-lg min-h-[60px]"
                  style={{
                    background: 'rgba(140,120,83,0.1)',
                    border: `1px solid ${LUXE_COLORS.bronze}20`,
                    color: LUXE_COLORS.champagne
                  }}
                >
                  {notes || (
                    <span style={{ color: LUXE_COLORS.bronze, opacity: 0.5 }}>No notes</span>
                  )}
                </div>
              )}
            </div>

            {/* Total */}
            <div
              className="p-4 rounded-lg"
              style={{
                background: `linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(184,134,11,0.10) 100%)`,
                border: `1px solid ${LUXE_COLORS.gold}30`
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium" style={{ color: LUXE_COLORS.champagne }}>
                  Total
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold" style={{ color: LUXE_COLORS.gold }}>
                    {currencySymbol} {price.toFixed(2)}
                  </span>
                  {!isEditing && price !== catalogTotal && catalogTotal > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs line-through opacity-60"
                        style={{ color: LUXE_COLORS.bronze }}
                        title="Original catalog total"
                      >
                        {currencySymbol} {catalogTotal.toFixed(2)}
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{
                          background: price < catalogTotal ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: price < catalogTotal ? '#22c55e' : '#ef4444'
                        }}
                      >
                        {price < catalogTotal ? '-' : '+'}{currencySymbol} {Math.abs(catalogTotal - price).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm mt-1" style={{ color: LUXE_COLORS.bronze }}>
                Duration: {formatDuration(duration)} • {selectedServices.length} service(s)
              </div>
            </div>
          </div>

        {/* ✅ FOOTER WITH SAVE BUTTON - ALWAYS VISIBLE */}
        <div
          className="p-6 pt-4"
          style={{
            borderTop: `1px solid ${LUXE_COLORS.gold}20`,
            background: 'linear-gradient(to top, rgba(212,175,55,0.08) 0%, transparent 100%)'
          }}
        >
          {isEditing ? (
            <Button
              onClick={handleSave}
              disabled={
                isSaving ||
                !selectedCustomer ||
                !selectedDate ||
                !selectedTime ||
                selectedServices.length === 0
              }
              className="w-full transition-all duration-500"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.gold}10 0%, ${LUXE_COLORS.goldDark}15 100%)`,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `2px solid ${LUXE_COLORS.gold}60`,
                borderRadius: '16px',
                color: LUXE_COLORS.champagne,
                fontWeight: '700',
                padding: '1.25rem 2rem',
                fontSize: '1.05rem',
                letterSpacing: '0.02em',
                boxShadow: `0 8px 32px ${LUXE_COLORS.gold}35, inset 0 1px 0 rgba(255,255,255,0.15)`,
                minHeight: '60px',
                position: 'relative',
                overflow: 'hidden',
                transitionTimingFunction: LUXE_COLORS.spring
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${LUXE_COLORS.gold}25 0%, ${LUXE_COLORS.goldDark}30 100%)`
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                e.currentTarget.style.boxShadow = `0 16px 48px ${LUXE_COLORS.gold}50, inset 0 1px 0 rgba(255,255,255,0.25)`
                e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}90`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${LUXE_COLORS.gold}10 0%, ${LUXE_COLORS.goldDark}15 100%)`
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = `0 8px 32px ${LUXE_COLORS.gold}35, inset 0 1px 0 rgba(255,255,255,0.15)`
                e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}60`
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="w-full transition-all duration-300 font-medium"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.gold}20 0%, ${LUXE_COLORS.gold}15 100%)`,
                color: LUXE_COLORS.gold,
                border: `1px solid ${LUXE_COLORS.gold}40`,
                transitionTimingFunction: LUXE_COLORS.spring,
                fontSize: '1rem',
                padding: '1rem 1.5rem',
                boxShadow: `0 2px 8px ${LUXE_COLORS.gold}10`,
                minHeight: '56px',
                fontWeight: '600'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${LUXE_COLORS.gold}35 0%, ${LUXE_COLORS.gold}25 100%)`
                e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}70`
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = `0 6px 16px ${LUXE_COLORS.gold}25`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${LUXE_COLORS.gold}20 0%, ${LUXE_COLORS.gold}15 100%)`
                e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}40`
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = `0 2px 8px ${LUXE_COLORS.gold}10`
              }}
            >
              <Edit2 className="w-5 h-5 mr-2" />
              Edit Appointment
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
