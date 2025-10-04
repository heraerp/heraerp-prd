'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Trash2, Archive } from 'lucide-react'
import type { AppointmentFormValues } from '@/hooks/useHeraAppointments'

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  charcoal: '#1A1A1A',
  charcoalLight: '#232323',
  bronze: '#8C7853',
  lightText: '#E0E0E0'
}

// Zod validation schema
const appointmentSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_id: z.string().optional(),
  stylist_name: z.string().optional(),
  stylist_id: z.string().optional(),
  start_time: z.string().min(1, 'Start time is required'),
  duration_minutes: z.number().min(15, 'Minimum 15 minutes').default(60),
  price: z.number().min(0).default(0),
  currency_code: z.string().default('AED'),
  notes: z.string().optional(),
  status: z.enum(['booked', 'checked_in', 'completed', 'cancelled', 'no_show']).default('booked')
})

type AppointmentSchemaType = z.infer<typeof appointmentSchema>

interface AppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: AppointmentFormValues) => Promise<void>
  onDelete?: (appointmentId: string) => Promise<void>
  onArchive?: (appointmentId: string) => Promise<void>
  appointment?:
    | {
        id: string
        entity_name?: string
        customer_name?: string
        customer_id?: string
        stylist_name?: string
        stylist_id?: string
        start_time?: string
        end_time?: string
        duration_minutes?: number
        price?: number
        currency_code?: string
        notes?: string
        status?: string
      }
    | undefined
  userRole?: 'owner' | 'manager' | 'receptionist' | 'staff'
  isLoading?: boolean
}

export function AppointmentModal({
  open,
  onOpenChange,
  onSave,
  onDelete,
  onArchive,
  appointment,
  userRole = 'receptionist',
  isLoading = false
}: AppointmentModalProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isEditMode = !!appointment
  const canDelete = ['owner', 'manager'].includes(userRole)
  const canArchive = ['owner', 'manager', 'receptionist'].includes(userRole)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AppointmentSchemaType>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customer_name: appointment?.customer_name || '',
      customer_id: appointment?.customer_id || '',
      stylist_name: appointment?.stylist_name || '',
      stylist_id: appointment?.stylist_id || '',
      start_time: appointment?.start_time || '',
      duration_minutes: appointment?.duration_minutes || 60,
      price: appointment?.price || 0,
      currency_code: appointment?.currency_code || 'AED',
      notes: appointment?.notes || '',
      status: (appointment?.status as any) || 'booked'
    }
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      reset({
        customer_name: appointment?.customer_name || '',
        customer_id: appointment?.customer_id || '',
        stylist_name: appointment?.stylist_name || '',
        stylist_id: appointment?.stylist_id || '',
        start_time: appointment?.start_time
          ? new Date(appointment.start_time).toISOString().slice(0, 16)
          : '',
        duration_minutes: appointment?.duration_minutes || 60,
        price: appointment?.price || 0,
        currency_code: appointment?.currency_code || 'AED',
        notes: appointment?.notes || '',
        status: (appointment?.status as any) || 'booked'
      })
    }
  }, [open, appointment, reset])

  const onSubmit = async (data: AppointmentSchemaType) => {
    try {
      // Calculate end_time from start_time + duration
      const startDate = new Date(data.start_time)
      const endDate = new Date(startDate.getTime() + data.duration_minutes * 60000)

      const appointmentData: AppointmentFormValues = {
        customer_name: data.customer_name,
        customer_id: data.customer_id || `CUST-${Date.now()}`,
        stylist_name: data.stylist_name,
        stylist_id: data.stylist_id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_minutes: data.duration_minutes,
        price: data.price,
        currency_code: data.currency_code,
        notes: data.notes,
        status: data.status
      }

      await onSave(appointmentData)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save appointment:', error)
    }
  }

  const handleDelete = async () => {
    if (!appointment || !onDelete) return

    try {
      setIsDeleting(true)
      await onDelete(appointment.id)
      setDeleteConfirmOpen(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete appointment:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleArchive = async () => {
    if (!appointment || !onArchive) return

    try {
      await onArchive(appointment.id)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to archive appointment:', error)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.gold}`,
            color: COLORS.lightText
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: COLORS.champagne }} className="text-2xl font-bold">
              {isEditMode ? 'Edit Appointment' : 'New Appointment'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer_name" style={{ color: COLORS.champagne }}>
                  Customer Name *
                </Label>
                <Input
                  id="customer_name"
                  {...register('customer_name')}
                  placeholder="Enter customer name"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    border: `1px solid ${COLORS.gold}30`,
                    color: COLORS.champagne
                  }}
                />
                {errors.customer_name && (
                  <p className="text-sm text-red-400 mt-1">{errors.customer_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="stylist_name" style={{ color: COLORS.champagne }}>
                  Stylist Name
                </Label>
                <Input
                  id="stylist_name"
                  {...register('stylist_name')}
                  placeholder="Enter stylist name (optional)"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    border: `1px solid ${COLORS.gold}30`,
                    color: COLORS.champagne
                  }}
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time" style={{ color: COLORS.champagne }}>
                  Start Time *
                </Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  {...register('start_time')}
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    border: `1px solid ${COLORS.gold}30`,
                    color: COLORS.champagne
                  }}
                />
                {errors.start_time && (
                  <p className="text-sm text-red-400 mt-1">{errors.start_time.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="duration_minutes" style={{ color: COLORS.champagne }}>
                  Duration (minutes)
                </Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  {...register('duration_minutes', { valueAsNumber: true })}
                  placeholder="60"
                  min="15"
                  max="480"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    border: `1px solid ${COLORS.gold}30`,
                    color: COLORS.champagne
                  }}
                />
                {errors.duration_minutes && (
                  <p className="text-sm text-red-400 mt-1">{errors.duration_minutes.message}</p>
                )}
              </div>
            </div>

            {/* Price & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" style={{ color: COLORS.champagne }}>
                  Price (AED)
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="0.00"
                  min="0"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    border: `1px solid ${COLORS.gold}30`,
                    color: COLORS.champagne
                  }}
                />
              </div>

              <div>
                <Label htmlFor="status" style={{ color: COLORS.champagne }}>
                  Status
                </Label>
                <Select
                  value={watch('status')}
                  onValueChange={value => setValue('status', value as any)}
                >
                  <SelectTrigger
                    style={{
                      backgroundColor: COLORS.charcoalLight,
                      border: `1px solid ${COLORS.gold}30`,
                      color: COLORS.champagne
                    }}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="booked" className="hera-select-item">
                      Booked
                    </SelectItem>
                    <SelectItem value="checked_in" className="hera-select-item">
                      Checked In
                    </SelectItem>
                    <SelectItem value="completed" className="hera-select-item">
                      Completed
                    </SelectItem>
                    <SelectItem value="cancelled" className="hera-select-item">
                      Cancelled
                    </SelectItem>
                    <SelectItem value="no_show" className="hera-select-item">
                      No Show
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" style={{ color: COLORS.champagne }}>
                Notes
              </Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Special requests or notes"
                rows={3}
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${COLORS.gold}30`,
                  color: COLORS.champagne
                }}
              />
            </div>

            <DialogFooter className="flex gap-3">
              {/* Archive/Delete buttons for existing appointments */}
              {isEditMode && canArchive && appointment?.status !== 'archived' && (
                <Button
                  type="button"
                  onClick={handleArchive}
                  variant="outline"
                  style={{
                    backgroundColor: `${COLORS.bronze}20`,
                    borderColor: COLORS.bronze,
                    color: COLORS.bronze
                  }}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              )}

              {isEditMode && canDelete && appointment?.status === 'archived' && (
                <Button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  variant="outline"
                  style={{
                    backgroundColor: '#991B1B20',
                    borderColor: '#991B1B',
                    color: '#991B1B'
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                style={{
                  borderColor: COLORS.gold,
                  color: COLORS.champagne,
                  backgroundColor: 'transparent'
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black
                }}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{isEditMode ? 'Save Changes' : 'Create Appointment'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent
          className="max-w-md"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.gold}`,
            color: COLORS.lightText
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: COLORS.champagne }} className="text-xl font-bold">
              Delete Appointment?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p style={{ color: COLORS.lightText }}>
              Are you sure you want to permanently delete this appointment?
            </p>
            <p className="mt-3 text-sm" style={{ color: COLORS.bronze }}>
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeleting}
              style={{
                borderColor: COLORS.gold,
                color: COLORS.champagne,
                backgroundColor: 'transparent'
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                backgroundColor: '#991B1B',
                color: '#FFFFFF'
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
