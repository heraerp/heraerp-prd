'use client'

import React, { useState } from 'react'
import { X, Calendar, Clock, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { formatDate } from '@/lib/date-utils'
import { differenceInBusinessDays, addDays, isWeekend } from 'date-fns'
import { useLeaveManagement } from '@/hooks/useLeaveManagement'

interface LeaveRequestFormProps {
  onClose: () => void
  organizationId?: string
}

export function LeaveRequestForm({ onClose, organizationId }: LeaveRequestFormProps) {
  const { organization, user } = useHERAAuth()
  const { submitLeaveRequest, loading } = useLeaveManagement({ organizationId })
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    partialDay: 'full',
    reason: '',
    coverageNotes: ''
  })

  const calculateBusinessDays = () => {
    if (!formData.startDate || !formData.endDate) return 0
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)

    let count = 0
    let current = new Date(start)

    while (current <= end) {
      if (!isWeekend(current)) {
        count++
      }
      current = addDays(current, 1)
    }

    if (formData.partialDay === 'half') {
      return count * 0.5
    }

    return count
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // For demo purposes, use one of the existing employees if no user
    // This is Sarah Johnson's ID from the salon demo data
    const employeeId = user?.id || '832cab27-eac3-4648-bdd5-aeb896813e32'

    const request = {
      employeeId,
      leaveType: formData.leaveType as any,
      startDate: formData.startDate,
      endDate: formData.endDate,
      partialDays:
        formData.partialDay !== 'full'
          ? {
              type: formData.partialDay as any
            }
          : undefined,
      reason: formData.reason,
      deductFromBalance: formData.leaveType !== 'unpaid',
      coverageNotes: formData.coverageNotes
    }

    const result = await submitLeaveRequest(request)

    if (result) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/50 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(31, 41, 55, 0.95) 0%, 
              rgba(17, 24, 39, 0.98) 100%
            )
          `,
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 4px 16px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold !text-gray-100 dark:!text-foreground">Request Time Off</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted-foreground/10 transition-colors"
            >
              <X className="h-5 w-5 !text-muted-foreground dark:!text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type */}
            <div>
              <Label htmlFor="leaveType" className="!text-gray-300">
                Leave Type
              </Label>
              <Select
                value={formData.leaveType}
                onValueChange={value => setFormData({ ...formData, leaveType: value })}
              >
                <SelectTrigger className="mt-2 bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50">
                  <SelectValue placeholder="Select leave type" className="!text-muted-foreground" />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem value="annual" className="hera-select-item">
                    Annual Leave
                  </SelectItem>
                  <SelectItem value="sick" className="hera-select-item">
                    Sick Leave
                  </SelectItem>
                  <SelectItem value="unpaid" className="hera-select-item">
                    Unpaid Leave
                  </SelectItem>
                  <SelectItem value="maternity" className="hera-select-item">
                    Maternity Leave
                  </SelectItem>
                  <SelectItem value="paternity" className="hera-select-item">
                    Paternity Leave
                  </SelectItem>
                  <SelectItem value="bereavement" className="hera-select-item">
                    Bereavement Leave
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="startDate" className="!text-gray-300">
                  Start Date
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="pl-10 bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50 [&::-webkit-calendar-picker-indicator]:invert"
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div>
                <Label htmlFor="endDate" className="!text-gray-300">
                  End Date
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate}
                    className="pl-10 bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50 [&::-webkit-calendar-picker-indicator]:invert"
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Partial Day Option */}
            <div>
              <Label htmlFor="partialDay" className="!text-gray-300">
                Day Type
              </Label>
              <Select
                value={formData.partialDay}
                onValueChange={value => setFormData({ ...formData, partialDay: value })}
              >
                <SelectTrigger className="mt-2 bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem value="full" className="hera-select-item">
                    Full Day(s)
                  </SelectItem>
                  <SelectItem value="half" className="hera-select-item">
                    Half Day(s)
                  </SelectItem>
                  <SelectItem value="am" className="hera-select-item">
                    Morning Only
                  </SelectItem>
                  <SelectItem value="pm" className="hera-select-item">
                    Afternoon Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Leave Summary */}
            {formData.startDate && formData.endDate && (
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-4 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Leave Summary</span>
                </div>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
                  You are requesting <strong>{calculateBusinessDays()}</strong> business days off
                  {formData.startDate && formData.endDate && (
                    <span className="block mt-1">
                      From {formatDate(new Date(formData.startDate), 'MMMM d, yyyy')} to{' '}
                      {formatDate(new Date(formData.endDate), 'MMMM d, yyyy')}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Reason */}
            <div>
              <Label htmlFor="reason" className="!text-gray-300">
                Reason
              </Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Please provide a reason for your leave request..."
                className="mt-2 min-h-[100px] bg-muted/50 border-border !text-foreground placeholder:!text-muted-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50"
                required
              />
            </div>

            {/* Coverage Notes */}
            <div>
              <Label htmlFor="coverageNotes" className="!text-gray-300">
                Coverage Arrangements (Optional)
              </Label>
              <Textarea
                id="coverageNotes"
                value={formData.coverageNotes}
                onChange={e => setFormData({ ...formData, coverageNotes: e.target.value })}
                placeholder="Any arrangements made for coverage during your absence..."
                className="mt-2 min-h-[80px] bg-muted/50 border-border !text-foreground placeholder:!text-muted-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 justify-end pt-4 border-t border-border dark:border-border">
              <Button type="button" variant="outline" onClick={onClose} className="min-w-[100px]">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[100px] bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-foreground"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
