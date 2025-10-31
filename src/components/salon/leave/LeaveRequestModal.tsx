import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Calendar as CalendarIcon, AlertCircle, Info, CalendarDays } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, differenceInDays } from 'date-fns'
import { calculateWorkingDays } from '@/lib/playbook/hr_leave'
import type { LeaveRequest } from '@/schemas/hr_leave'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface LeaveRequestModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: LeaveRequest) => Promise<void>
  staff: any[]
  policies: any[]
  holidays: any[]
}

export function LeaveRequestModal({
  open,
  onClose,
  onSubmit,
  staff,
  policies,
  holidays
}: LeaveRequestModalProps) {
  const [loading, setLoading] = useState(false)
  const [staffId, setStaffId] = useState('')
  const [type, setType] = useState<'ANNUAL' | 'SICK' | 'UNPAID'>('ANNUAL')
  const [from, setFrom] = useState<Date | undefined>()
  const [to, setTo] = useState<Date | undefined>()
  const [halfDayStart, setHalfDayStart] = useState(false)
  const [halfDayEnd, setHalfDayEnd] = useState(false)
  const [notes, setNotes] = useState('')
  const [workingDays, setWorkingDays] = useState(0)
  const [noticeWarning, setNoticeWarning] = useState(false)

  // ✅ DEBUG: Log staff data received by modal
  useEffect(() => {
    if (staff && staff.length > 0) {
      console.log('[LeaveRequestModal] 🔍 Staff data received:', {
        count: staff.length,
        staff: staff.slice(0, 3).map(s => ({
          id: s.id,
          entity_name: s.entity_name,
          entity_code: s.entity_code,
          entity_type: s.entity_type
        }))
      })
    }
  }, [staff])

  // Calculate working days whenever dates change
  useEffect(() => {
    if (from && to) {
      const holidayDates = holidays && holidays.length > 0
        ? holidays.map(h => new Date(h.metadata?.date || h.date))
        : []
      const days = calculateWorkingDays(from, to, holidayDates, halfDayStart, halfDayEnd)
      setWorkingDays(days)

      // Check min notice days
      const policy = policies && policies.length > 0 ? policies[0] : null
      const minNoticeDays = policy?.metadata?.min_notice_days || 7
      const daysUntilStart = differenceInDays(from, new Date())
      setNoticeWarning(daysUntilStart < minNoticeDays)
    } else {
      setWorkingDays(0)
      setNoticeWarning(false)
    }
  }, [from, to, halfDayStart, halfDayEnd, holidays, policies])

  const handleSubmit = async () => {
    if (!staffId || !from || !to) return

    setLoading(true)
    try {
      // Get staff's branch and manager (for now, use the first staff member as manager - TODO: proper manager selection)
      const selectedStaff = staff && staff.length > 0 ? staff.find(s => s.id === staffId) : null
      const managerId = staff && staff.length > 0 ? staff[0].id : staffId // TODO: Add proper manager selection

      await onSubmit({
        staff_id: staffId,
        manager_id: managerId,
        leave_type: type,
        start_date: from.toISOString(),
        end_date: to.toISOString(),
        reason: notes || 'Leave request', // Use notes as reason, or default text
        notes: notes
      } as any)

      onClose()
      // Reset form
      setStaffId('')
      setFrom(undefined)
      setTo(undefined)
      setHalfDayStart(false)
      setHalfDayEnd(false)
      setNotes('')
    } catch (error) {
      console.error('Failed to submit request:', error)
    } finally {
      setLoading(false)
    }
  }

  // Keyboard shortcut for submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && open) {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, staffId, from, to])

  return (
    <SalonLuxeModal
      open={open}
      onClose={onClose}
      title="New Leave Request"
      description="Submit a leave request for approval. Working days exclude weekends and public holidays."
      icon={<CalendarDays className="w-6 h-6" />}
      size="lg"
      footer={
        <>
          <SalonLuxeButton
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </SalonLuxeButton>
          <SalonLuxeButton
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !staffId || !from || !to}
            loading={loading}
          >
            Submit Request
          </SalonLuxeButton>
        </>
      }
    >
      <div className="space-y-6 py-4">
        {/* Staff Selection */}
        <div className="space-y-2">
          <Label htmlFor="staff">Staff Member</Label>
          <Select value={staffId} onValueChange={setStaffId}>
            <SelectTrigger className="hera-select-trigger">
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              {staff && staff.length > 0 ? (
                staff.map(s => (
                  <SelectItem key={s.id} value={s.id} className="hera-select-item">
                    {s.entity_name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="loading" disabled className="hera-select-item">
                  Loading staff...
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Leave Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Leave Type</Label>
          <Select value={type} onValueChange={v => setType(v as any)}>
            <SelectTrigger className="hera-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              <SelectItem value="ANNUAL" className="hera-select-item">
                Annual Leave
              </SelectItem>
              <SelectItem value="SICK" className="hera-select-item">
                Sick Leave
              </SelectItem>
              <SelectItem value="UNPAID" className="hera-select-item">
                Unpaid Leave
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from">From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left outline-button">
                  <CalendarIcon size={16} className="mr-2" />
                  {from ? format(from, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" side="bottom" align="start">
                <Calendar
                  mode="single"
                  selected={from}
                  onSelect={setFrom}
                  disabled={date => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left outline-button">
                  <CalendarIcon size={16} className="mr-2" />
                  {to ? format(to, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" side="bottom" align="start">
                <Calendar
                  mode="single"
                  selected={to}
                  onSelect={setTo}
                  disabled={date => (from ? date < from : date < new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Half Day Options */}
        {from && to && (
          <div className="space-y-4 p-4 rounded-lg border-2" style={{
            backgroundColor: SALON_LUXE_COLORS.charcoal.base,
            borderColor: `${SALON_LUXE_COLORS.gold.base}40`
          }}>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="half-start" className="text-base font-medium cursor-pointer" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                Half day on start date
              </Label>
              <Switch
                id="half-start"
                checked={halfDayStart}
                onCheckedChange={setHalfDayStart}
                style={{
                  backgroundColor: halfDayStart ? SALON_LUXE_COLORS.gold.base : '#374151'
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="half-end" className="text-base font-medium cursor-pointer" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                Half day on end date
              </Label>
              <Switch
                id="half-end"
                checked={halfDayEnd}
                onCheckedChange={setHalfDayEnd}
                style={{
                  backgroundColor: halfDayEnd ? SALON_LUXE_COLORS.gold.base : '#374151'
                }}
              />
            </div>
          </div>
        )}

        {/* Working Days Preview */}
        {from && to && (
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: SALON_LUXE_COLORS.charcoal.darker,
              border: `1px solid ${SALON_LUXE_COLORS.gold.base}30`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info size={16} style={{ color: SALON_LUXE_COLORS.gold.base }} />
                <span className="text-sm">Working days</span>
              </div>
              <span className="text-2xl font-semibold" style={{ color: SALON_LUXE_COLORS.gold.base }}>
                {workingDays}
              </span>
            </div>
            {noticeWarning && (
              <div className="flex items-center gap-2 mt-3 text-sm" style={{ color: SALON_LUXE_COLORS.rose.base }}>
                <AlertCircle size={16} />
                Short notice: Less than required notice period
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Additional information..."
            className="resize-none"
            rows={3}
          />
        </div>

        {/* Keyboard Shortcut Hint */}
        <p className="text-xs text-center opacity-60">Press ⌘+Enter to submit</p>
      </div>

      {/* Calendar Date Visibility Styling */}
      <style jsx global>{`
        /* Calendar date picker - MUCH better contrast for selected dates */
        .salon-luxe-modal [role="gridcell"][data-selected="true"] button,
        .salon-luxe-modal .rdp-day_selected {
          background-color: rgba(140, 120, 83, 0.4) !important;
          color: #FFFFFF !important;
          font-weight: 700 !important;
          border: 2px solid ${SALON_LUXE_COLORS.gold.base} !important;
        }

        .salon-luxe-modal [role="gridcell"][data-selected="true"] button:hover,
        .salon-luxe-modal .rdp-day_selected:hover {
          background-color: rgba(140, 120, 83, 0.6) !important;
          color: #FFFFFF !important;
        }

        /* Calendar normal dates - white text for visibility */
        .salon-luxe-modal [role="gridcell"] button,
        .salon-luxe-modal .rdp-day {
          color: ${SALON_LUXE_COLORS.champagne.base} !important;
          font-weight: 500 !important;
        }

        /* Calendar today indicator - clear border */
        .salon-luxe-modal [role="gridcell"][data-today="true"] button,
        .salon-luxe-modal .rdp-day_today {
          border: 2px solid ${SALON_LUXE_COLORS.gold.base} !important;
          background-color: rgba(212, 175, 55, 0.1) !important;
          color: ${SALON_LUXE_COLORS.gold.base} !important;
          font-weight: 700 !important;
        }

        /* Calendar hover state - subtle highlight */
        .salon-luxe-modal [role="gridcell"] button:hover,
        .salon-luxe-modal .rdp-day:hover {
          background-color: rgba(212, 175, 55, 0.2) !important;
          color: #FFFFFF !important;
        }

        /* Calendar disabled dates - clearly dimmed */
        .salon-luxe-modal [role="gridcell"] button[disabled],
        .salon-luxe-modal .rdp-day[disabled] {
          opacity: 0.25 !important;
          color: rgba(224, 224, 224, 0.3) !important;
        }

        /* Calendar background - dark charcoal */
        .salon-luxe-modal [role="grid"],
        .salon-luxe-modal .rdp-months {
          background-color: ${SALON_LUXE_COLORS.charcoal.darker} !important;
          padding: 1rem !important;
        }

        /* Calendar header (month/year) - bright champagne */
        .salon-luxe-modal .rdp-caption,
        .salon-luxe-modal .rdp-caption_label {
          color: ${SALON_LUXE_COLORS.champagne.base} !important;
          font-weight: 600 !important;
          font-size: 0.95rem !important;
        }

        /* Calendar navigation buttons - gold with hover */
        .salon-luxe-modal .rdp-nav button,
        .salon-luxe-modal .rdp-nav_button {
          color: ${SALON_LUXE_COLORS.gold.base} !important;
        }

        .salon-luxe-modal .rdp-nav button:hover,
        .salon-luxe-modal .rdp-nav_button:hover {
          background-color: ${SALON_LUXE_COLORS.gold.base}20 !important;
        }

        /* Calendar weekday headers - secondary text */
        .salon-luxe-modal .rdp-head_cell,
        .salon-luxe-modal .rdp-head th {
          color: ${SALON_LUXE_COLORS.text.secondary} !important;
          font-weight: 600 !important;
          font-size: 0.85rem !important;
        }

        /* Popover content for calendar - dark with gold border */
        .salon-luxe-modal [role="dialog"],
        .salon-luxe-modal .rdp {
          background-color: ${SALON_LUXE_COLORS.charcoal.darker} !important;
          border: 1px solid ${SALON_LUXE_COLORS.gold.base}30 !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
          border-radius: 0.75rem !important;
        }

        /* Calendar cell spacing */
        .salon-luxe-modal .rdp-cell {
          padding: 2px !important;
        }

        /* Calendar day button sizing */
        .salon-luxe-modal .rdp-day {
          width: 2.5rem !important;
          height: 2.5rem !important;
          border-radius: 0.5rem !important;
          transition: all 0.2s ease !important;
        }
      `}</style>
    </SalonLuxeModal>
  )
}
