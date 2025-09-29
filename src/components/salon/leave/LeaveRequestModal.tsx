import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
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
import { Calendar as CalendarIcon, AlertCircle, Info } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, differenceInDays, isWeekend, eachDayOfInterval } from 'date-fns'
import { calculateWorkingDays } from '@/lib/playbook/hr_leave'
import type { LeaveRequest } from '@/schemas/hr_leave'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  rose: '#E8B4B8',
  lightText: '#E0E0E0'
}

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

  // Calculate working days whenever dates change
  useEffect(() => {
    if (from && to) {
      const holidayDates = holidays.map(h => new Date(h.metadata.date))
      const days = calculateWorkingDays(from, to, holidayDates, halfDayStart, halfDayEnd)
      setWorkingDays(days)

      // Check min notice days
      const policy = policies[0] // TODO: Get policy for staff
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
      // Get staff's branch
      const selectedStaff = staff.find(s => s.id === staffId)
      const branchId = selectedStaff?.metadata?.branch_id || 'branch-1'

      await onSubmit({
        staff_id: staffId,
        branch_id: branchId,
        type,
        from,
        to,
        half_day_start: halfDayStart,
        half_day_end: halfDayEnd,
        notes
      })

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] flex flex-col"
        style={{
          backgroundColor: COLORS.charcoal,
          color: COLORS.champagne,
          border: `1px solid ${COLORS.black}`
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle style={{ color: COLORS.champagne }}>New Leave Request</DialogTitle>
          <DialogDescription style={{ color: COLORS.bronze }}>
            Submit a leave request for approval. Working days exclude weekends and public holidays.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Staff Selection */}
          <div className="space-y-2">
            <Label htmlFor="staff" style={{ color: COLORS.champagne }}>
              Staff Member
            </Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger
                className="bg-transparent border"
                style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
              >
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                {staff.map(s => (
                  <SelectItem key={s.id} value={s.id} className="hera-select-item">
                    {s.entity_name} ({s.entity_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Leave Type */}
          <div className="space-y-2">
            <Label htmlFor="type" style={{ color: COLORS.champagne }}>
              Leave Type
            </Label>
            <Select value={type} onValueChange={v => setType(v as any)}>
              <SelectTrigger
                className="bg-transparent border"
                style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
              >
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
              <Label htmlFor="from" style={{ color: COLORS.champagne }}>
                From Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left bg-transparent border"
                    style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                  >
                    <CalendarIcon size={16} className="mr-2" />
                    {from ? format(from, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 z-50"
                  style={{ backgroundColor: COLORS.charcoal, border: `1px solid ${COLORS.bronze}` }}
                  side="bottom"
                  align="start"
                >
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
              <Label htmlFor="to" style={{ color: COLORS.champagne }}>
                To Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left bg-transparent border"
                    style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                  >
                    <CalendarIcon size={16} className="mr-2" />
                    {to ? format(to, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 z-50"
                  style={{ backgroundColor: COLORS.charcoal, border: `1px solid ${COLORS.bronze}` }}
                  side="bottom"
                  align="start"
                >
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="half-start" style={{ color: COLORS.champagne }}>
                  Half day on start date
                </Label>
                <Switch id="half-start" checked={halfDayStart} onCheckedChange={setHalfDayStart} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="half-end" style={{ color: COLORS.champagne }}>
                  Half day on end date
                </Label>
                <Switch id="half-end" checked={halfDayEnd} onCheckedChange={setHalfDayEnd} />
              </div>
            </div>
          )}

          {/* Working Days Preview */}
          {from && to && (
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: '#141414', border: `1px solid ${COLORS.black}` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info size={16} color={COLORS.bronze} />
                  <span className="text-sm" style={{ color: COLORS.champagne }}>
                    Working days
                  </span>
                </div>
                <span className="text-2xl font-semibold" style={{ color: COLORS.gold }}>
                  {workingDays}
                </span>
              </div>
              {noticeWarning && (
                <div
                  className="flex items-center gap-2 mt-3 text-sm"
                  style={{ color: COLORS.rose }}
                >
                  <AlertCircle size={16} />
                  Short notice: Less than required notice period
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" style={{ color: COLORS.champagne }}>
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional information..."
              className="bg-transparent border resize-none"
              style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4" style={{ borderColor: COLORS.black }}>
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !staffId || !from || !to}
                className="border-0"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black
                }}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
            <p className="text-xs text-center">Press ⌘+Enter to submit</p>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
