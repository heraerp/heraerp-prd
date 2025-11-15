// ================================================================================
// ROLE GRANT FORM - SETTINGS COMPONENT
// Smart Code: HERA.UI.SETTINGS.ROLE_GRANT_FORM.V1
// Production-ready role grant creation/editing form with validation
// ================================================================================

'use client'

import React, { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Shield, Save, Mail, User, Clock, AlertCircle, Users, X, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RoleGrant, UserRole, DEFAULT_ROLE_PERMISSIONS } from '@/lib/schemas/settings'
import { z } from 'zod'

const RoleGrantFormSchema = z.object({
  user_email: z.string().email('Invalid email address'),
  user_name: z.string().min(1, 'User name is required'),
  roles: z
    .array(z.enum(['owner', 'manager', 'stylist', 'receptionist']))
    .min(1, 'At least one role must be selected'),
  is_active: z.boolean().default(true),
  notes: z.string().optional()
})

type RoleGrantFormData = z.infer<typeof RoleGrantFormSchema>

interface RoleGrantFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  grant?: RoleGrant | null
  organizationId: string
  onSubmit: (grant: RoleGrant) => Promise<void>
  isSubmitting: boolean
}

const ROLE_OPTIONS: {
  value: UserRole
  label: string
  description: string
  color: string
  icon: React.ElementType
}[] = [
  {
    value: 'owner',
    label: 'Owner',
    description: 'Full system access, can manage everything including other owners',
    color: 'border-red-300 bg-red-50 dark:bg-red-950/30 text-red-700',
    icon: Shield
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Can manage staff, view reports, and handle daily operations',
    color: 'border-purple-300 bg-purple-50 dark:bg-purple-950/30 text-purple-700',
    icon: Users
  },
  {
    value: 'stylist',
    label: 'Stylist',
    description: 'Can manage appointments, services, and customer interactions',
    color: 'border-blue-300 bg-blue-50 dark:bg-blue-950/30 text-blue-700',
    icon: Users
  },
  {
    value: 'receptionist',
    label: 'Receptionist',
    description: 'Front desk operations, appointments, and customer service',
    color: 'border-green-300 bg-green-50 dark:bg-green-950/30 text-green-700',
    icon: Users
  }
]

export function RoleGrantForm({
  open,
  onOpenChange,
  grant,
  organizationId,
  onSubmit,
  isSubmitting
}: RoleGrantFormProps) {
  const form = useForm<RoleGrantFormData>({
    resolver: zodResolver(RoleGrantFormSchema),
    defaultValues: grant
      ? {
          user_email: grant.user_email,
          user_name: grant.user_name || '',
          roles: grant.roles,
          is_active: grant.is_active ?? true,
          notes: grant.notes || ''
        }
      : {
          user_email: '',
          user_name: '',
          roles: [],
          is_active: true,
          notes: ''
        }
  })

  const isEditMode = Boolean(grant)
  const selectedRoles = form.watch('roles')

  // Reset form when grant changes
  React.useEffect(() => {
    if (open) {
      if (grant) {
        form.reset({
          user_email: grant.user_email,
          user_name: grant.user_name || '',
          roles: grant.roles,
          is_active: grant.is_active ?? true,
          notes: grant.notes || ''
        })
      } else {
        form.reset({
          user_email: '',
          user_name: '',
          roles: [],
          is_active: true,
          notes: ''
        })
      }
    }
  }, [grant, open, form])

  const handleRoleToggle = (role: UserRole) => {
    const currentRoles = form.getValues('roles')
    if (currentRoles.includes(role)) {
      form.setValue(
        'roles',
        currentRoles.filter(r => r !== role)
      )
    } else {
      form.setValue('roles', [...currentRoles, role])
    }
  }

  const getPermissionSummary = () => {
    if (selectedRoles.length === 0) return []

    // Merge permissions from all selected roles
    let mergedPermissions = { ...DEFAULT_ROLE_PERMISSIONS.stylist }

    for (const role of selectedRoles) {
      const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role]
      Object.keys(rolePermissions).forEach(permission => {
        if (rolePermissions[permission as keyof typeof rolePermissions]) {
          mergedPermissions[permission as keyof typeof mergedPermissions] = true
        }
      })
    }

    // Convert to readable format
    const permissionLabels: Record<string, string> = {
      manage_appointments: 'Manage Appointments',
      manage_customers: 'Manage Customers',
      manage_inventory: 'Manage Inventory',
      manage_staff: 'Manage Staff',
      view_reports: 'View Reports',
      manage_settings: 'Manage Settings',
      manage_finances: 'Manage Finances',
      manage_users: 'Manage Users',
      full_access: 'Full System Access'
    }

    return Object.entries(mergedPermissions)
      .filter(([_, value]) => value)
      .map(([key, _]) => permissionLabels[key] || key)
  }

  const handleSubmit = async (data: RoleGrantFormData) => {
    try {
      const grantData: RoleGrant = {
        user_email: data.user_email,
        user_name: data.user_name,
        roles: data.roles,
        is_active: data.is_active,
        notes: data.notes,
        granted_at: grant?.granted_at || new Date().toISOString(),
        granted_by: grant?.granted_by || 'current_user' // TODO: Get from auth context
      }

      await onSubmit(grantData)
    } catch (error) {
      // Error handled by parent component
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  const permissionSummary = getPermissionSummary()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            {isEditMode ? 'Edit User Roles' : 'Grant User Roles'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Modify roles for "${grant?.user_email}"`
              : 'Grant roles and permissions to a new user'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user_email">Email Address *</Label>
                  <Input
                    id="user_email"
                    type="email"
                    {...form.register('user_email')}
                    placeholder="user@company.com"
                    disabled={isEditMode}
                  />
                  <p className="text-sm ink-muted">
                    {isEditMode ? 'Email address cannot be changed' : "User's login email address"}
                  </p>
                  {form.formState.errors.user_email && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.user_email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_name">Full Name *</Label>
                  <Input id="user_name" {...form.register('user_name')} placeholder="John Smith" />
                  {form.formState.errors.user_name && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.user_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Additional notes about this user..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Role Selection</CardTitle>
              <p className="text-sm dark:ink-muted">
                Select one or more roles. Permissions are cumulative.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {ROLE_OPTIONS.map(role => {
                  const isSelected = selectedRoles.includes(role.value)
                  return (
                    <div
                      key={role.value}
                      className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? `${role.color} border-2`
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      }`}
                      onClick={() => handleRoleToggle(role.value)}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected ? role.color : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        <role.icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-medium ink dark:text-gray-100">{role.label}</div>
                          <div
                            className={`w-5 h-5 rounded border-2 ${
                              isSelected
                                ? 'bg-current border-current'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm dark:ink-muted mt-1">{role.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {form.formState.errors.roles && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {form.formState.errors.roles.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Permission Summary */}
          {permissionSummary.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Permission Summary</CardTitle>
                <p className="text-sm dark:ink-muted">Combined permissions from selected roles</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {permissionSummary.map(permission => (
                    <Badge
                      key={permission}
                      variant="outline"
                      className="text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
                    >
                      {permission}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Control */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Grant Status</Label>
                  <p className="text-sm ink-muted">
                    {form.watch('is_active')
                      ? 'User will have active access'
                      : 'User access will be revoked'}
                  </p>
                </div>
                <Switch
                  checked={form.watch('is_active')}
                  onCheckedChange={checked => form.setValue('is_active', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Smart Code Display (Audit Slot) */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-blue-800 dark:text-blue-200">
                  Smart Code (for audit trail):
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  HERA.ORG.SETTINGS.ROLE_GRANTS.V1
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        </form>

        <Separator />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting || selectedRoles.length === 0}
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? 'Update Grant' : 'Create Grant'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
