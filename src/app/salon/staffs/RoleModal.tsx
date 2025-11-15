'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Loader2, Trash2 } from 'lucide-react'
import { type RoleFormValues } from '@/hooks/useHeraRoles'

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  charcoal: '#1A1A1A',
  lightText: '#E0E0E0'
}

// Zod validation schema
const roleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(2, 'Title must be at least 2 characters')
    .max(50, 'Title must not exceed 50 characters'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
  permissions: z.array(z.string()).optional().default([]),
  status: z.enum(['active', 'inactive']).default('active'),
  rank: z
    .number()
    .int()
    .min(1, 'Rank must be at least 1')
    .max(10, 'Rank must not exceed 10')
    .optional()
})

type RoleSchemaType = z.infer<typeof roleSchema>

interface RoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: RoleFormValues) => Promise<void>
  onDelete?: (roleId: string) => Promise<void>
  role?: {
    id: string
    title?: string
    description?: string
    permissions?: string[]
    status?: string
    rank?: number
  }
  userRole?: 'owner' | 'manager' | 'receptionist' | 'staff'
  isLoading?: boolean
}

export function RoleModal({
  open,
  onOpenChange,
  onSave,
  onDelete,
  role,
  userRole = 'staff',
  isLoading = false
}: RoleModalProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isEditMode = !!role
  const canDelete = userRole === 'owner'

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RoleSchemaType>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      title: role?.title || '',
      description: role?.description || '',
      permissions: role?.permissions || [],
      status: (role?.status as 'active' | 'inactive') || 'active',
      rank: role?.rank || 5
    }
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      reset({
        title: role?.title || '',
        description: role?.description || '',
        permissions: role?.permissions || [],
        status: (role?.status as 'active' | 'inactive') || 'active',
        rank: role?.rank || 5
      })
    }
  }, [open, role, reset])

  const onSubmit = async (data: RoleSchemaType) => {
    try {
      await onSave(data)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save role:', error)
    }
  }

  const handleDelete = async () => {
    if (!role || !onDelete || !canDelete) return

    setIsDeleting(true)
    try {
      await onDelete(role.id)
      setDeleteConfirmOpen(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete role:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const statusValue = watch('status')

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
              {isEditMode ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update role information, permissions, and hierarchy settings'
                : 'Define a new role with specific permissions and responsibilities'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title Field (Required) */}
            <div className="space-y-2">
              <Label htmlFor="title" style={{ color: COLORS.champagne }}>
                Title <span style={{ color: COLORS.gold }}>*</span>
              </Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g., Senior Stylist"
                className="border-[#D4AF37] focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                style={{
                  backgroundColor: COLORS.black,
                  color: COLORS.lightText,
                  borderColor: COLORS.gold
                }}
              />
              {errors.title && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{errors.title.message}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description" style={{ color: COLORS.champagne }}>
                Description
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Role description and responsibilities"
                rows={3}
                className="border-[#D4AF37] focus:border-[#D4AF37] focus:ring-[#D4AF37] resize-none"
                style={{
                  backgroundColor: COLORS.black,
                  color: COLORS.lightText,
                  borderColor: COLORS.gold
                }}
              />
              {errors.description && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{errors.description.message}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Status Field */}
            <div className="space-y-2">
              <Label htmlFor="status" style={{ color: COLORS.champagne }}>
                Status
              </Label>
              <Select
                value={statusValue}
                onValueChange={(value: 'active' | 'inactive') => setValue('status', value)}
              >
                <SelectTrigger
                  className="border-[#D4AF37] focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                  style={{
                    backgroundColor: COLORS.black,
                    color: COLORS.lightText,
                    borderColor: COLORS.gold
                  }}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem value="active" className="hera-select-item">
                    Active
                  </SelectItem>
                  <SelectItem value="inactive" className="hera-select-item">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rank Field */}
            <div className="space-y-2">
              <Label htmlFor="rank" style={{ color: COLORS.champagne }}>
                Rank (1-10)
              </Label>
              <Input
                id="rank"
                type="number"
                min="1"
                max="10"
                {...register('rank', { valueAsNumber: true })}
                placeholder="5"
                className="border-[#D4AF37] focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                style={{
                  backgroundColor: COLORS.black,
                  color: COLORS.lightText,
                  borderColor: COLORS.gold
                }}
              />
              {errors.rank && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{errors.rank.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="flex justify-between gap-2">
              <div className="flex gap-2">
                {isEditMode && canDelete && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={isSubmitting || isLoading}
                    style={{
                      backgroundColor: '#991B1B',
                      color: '#FFFFFF'
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting || isLoading}
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
                    backgroundColor: COLORS.gold,
                    color: COLORS.black
                  }}
                  className="hover:opacity-90"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{isEditMode ? 'Update Role' : 'Create Role'}</>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enterprise Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent
          className="max-w-lg"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `2px solid #991B1B`,
            color: COLORS.lightText
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="text-2xl font-bold flex items-center gap-3"
              style={{ color: '#FEE2E2' }}
            >
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: '#991B1B20',
                  border: '2px solid #991B1B'
                }}
              >
                <Trash2 className="h-6 w-6" style={{ color: '#991B1B' }} />
              </div>
              Permanent Deletion Warning
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div
              className="p-4 rounded-lg border-l-4"
              style={{
                backgroundColor: '#991B1B10',
                borderColor: '#991B1B'
              }}
            >
              <p className="font-semibold mb-2" style={{ color: COLORS.champagne }}>
                You are about to permanently delete:
              </p>
              <p className="text-lg font-bold" style={{ color: COLORS.gold }}>
                &ldquo;{role?.title || role?.id}&rdquo;
              </p>
            </div>

            <div className="space-y-2" style={{ color: COLORS.lightText }}>
              <p className="font-semibold" style={{ color: '#FEE2E2' }}>
                ⚠️ This action is irreversible and will:
              </p>
              <ul
                className="list-disc list-inside space-y-1 ml-4"
                style={{ color: COLORS.lightText }}
              >
                <li>Permanently remove this role from the system</li>
                <li>Cannot be recovered after deletion</li>
                <li>May affect staff members assigned to this role</li>
              </ul>
            </div>

            <div
              className="p-3 rounded-lg text-sm"
              style={{
                backgroundColor: COLORS.black,
                border: `1px solid ${COLORS.gold}40`
              }}
            >
              <p style={{ color: COLORS.bronze }}>
                💡 <strong>Tip:</strong> Consider archiving instead if you might need this role in
                the future.
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeleting}
              className="flex-1"
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
              className="flex-1"
              style={{
                backgroundColor: '#991B1B',
                color: '#FFFFFF',
                border: '2px solid #7F1D1D'
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
                  Yes, Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
