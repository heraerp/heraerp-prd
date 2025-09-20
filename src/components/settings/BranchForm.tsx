// ================================================================================
// BRANCH FORM - SETTINGS COMPONENT
// Smart Code: HERA.UI.SETTINGS.BRANCH_FORM.v1
// Production-ready branch creation/editing form with validation
// ================================================================================

'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Building, 
  Save, 
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Branch, SETTINGS_SMART_CODES } from '@/lib/schemas/settings'

interface BranchFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branch?: Branch | null
  organizationId: string
  onSubmit: (branch: Branch) => Promise<void>
  isSubmitting: boolean
}

const BUSINESS_TYPES = [
  { value: 'salon', label: 'Salon & Beauty', smartCode: 'HERA.SALON.BRANCH.CORE.v1' },
  { value: 'restaurant', label: 'Restaurant', smartCode: 'HERA.REST.BRANCH.CORE.v1' },
  { value: 'retail', label: 'Retail Store', smartCode: 'HERA.RETAIL.BRANCH.CORE.v1' },
  { value: 'healthcare', label: 'Healthcare', smartCode: 'HERA.HLTH.BRANCH.CORE.v1' },
  { value: 'generic', label: 'Other Business', smartCode: 'HERA.ORG.BRANCH.CORE.v1' }
]

const OPERATING_HOURS_PRESETS = {
  'business_hours': {
    monday: '09:00-17:00',
    tuesday: '09:00-17:00',
    wednesday: '09:00-17:00',
    thursday: '09:00-17:00',
    friday: '09:00-17:00',
    saturday: 'Closed',
    sunday: 'Closed'
  },
  'salon_hours': {
    monday: '10:00-20:00',
    tuesday: '10:00-20:00',
    wednesday: '10:00-20:00',
    thursday: '10:00-20:00',
    friday: '10:00-20:00',
    saturday: '09:00-18:00',
    sunday: '10:00-16:00'
  },
  'restaurant_hours': {
    monday: '11:00-22:00',
    tuesday: '11:00-22:00',
    wednesday: '11:00-22:00',
    thursday: '11:00-22:00',
    friday: '11:00-23:00',
    saturday: '11:00-23:00',
    sunday: '12:00-21:00'
  }
}

export function BranchForm({ open, onOpenChange, branch, organizationId, onSubmit, isSubmitting }: BranchFormProps) {
  const [selectedBusinessType, setSelectedBusinessType] = React.useState('')

  const form = useForm<Branch>({
    resolver: zodResolver(Branch),
    defaultValues: branch || {
      organization_id: organizationId,
      entity_type: 'branch',
      entity_code: '',
      entity_name: '',
      smart_code: 'HERA.ORG.BRANCH.CORE.v1',
      is_active: true,
      location: {
        address: '',
        city: '',
        country: 'UAE',
        postal_code: '',
        coordinates: { lat: 0, lng: 0 }
      },
      contact: {
        phone: '',
        email: '',
        manager: ''
      },
      operating_hours: {
        monday: '09:00-17:00',
        tuesday: '09:00-17:00',
        wednesday: '09:00-17:00',
        thursday: '09:00-17:00',
        friday: '09:00-17:00',
        saturday: 'Closed',
        sunday: 'Closed'
      }
    }
  })

  const isEditMode = Boolean(branch)

  // Reset form when branch changes
  React.useEffect(() => {
    if (open) {
      if (branch) {
        form.reset(branch)
        // Set business type based on smart code
        const businessType = BUSINESS_TYPES.find(bt => bt.smartCode === branch.smart_code)
        setSelectedBusinessType(businessType?.value || 'generic')
      } else {
        form.reset({
          organization_id: organizationId,
          entity_type: 'branch',
          entity_code: '',
          entity_name: '',
          smart_code: 'HERA.ORG.BRANCH.CORE.v1',
          is_active: true,
          location: {
            address: '',
            city: '',
            country: 'UAE',
            postal_code: '',
            coordinates: { lat: 0, lng: 0 }
          },
          contact: {
            phone: '',
            email: '',
            manager: ''
          },
          operating_hours: OPERATING_HOURS_PRESETS.business_hours
        })
        setSelectedBusinessType('')
      }
    }
  }, [branch, open, organizationId, form])

  const handleBusinessTypeChange = (businessType: string) => {
    setSelectedBusinessType(businessType)
    const businessTypeConfig = BUSINESS_TYPES.find(bt => bt.value === businessType)
    
    if (businessTypeConfig) {
      form.setValue('smart_code', businessTypeConfig.smartCode)
      
      // Set appropriate operating hours based on business type
      if (businessType === 'salon') {
        form.setValue('operating_hours', OPERATING_HOURS_PRESETS.salon_hours)
      } else if (businessType === 'restaurant') {
        form.setValue('operating_hours', OPERATING_HOURS_PRESETS.restaurant_hours)
      } else {
        form.setValue('operating_hours', OPERATING_HOURS_PRESETS.business_hours)
      }
    }
  }

  const generateBranchCode = () => {
    const name = form.watch('entity_name')
    if (name && !isEditMode) {
      const code = name.toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 15)
      form.setValue('entity_code', code)
    }
  }

  const handleSubmit = async (data: Branch) => {
    try {
      const branchData = {
        ...data,
        organization_id: organizationId,
        entity_type: 'branch' as const,
        updated_at: new Date().toISOString()
      }
      
      await onSubmit(branchData)
    } catch (error) {
      // Error handled by parent component
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-violet-600" />
            {isEditMode ? 'Edit Branch' : 'Create Branch'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? `Edit the branch details for "${branch?.entity_name}"`
              : 'Create a new branch location for your organization'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entity_name">Branch Name *</Label>
                  <Input
                    id="entity_name"
                    {...form.register('entity_name')}
                    placeholder="Marina Branch"
                    onBlur={generateBranchCode}
                  />
                  {form.formState.errors.entity_name && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.entity_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity_code">Branch Code *</Label>
                  <Input
                    id="entity_code"
                    {...form.register('entity_code')}
                    placeholder="MARINA_BRANCH"
                    className="font-mono"
                    disabled={isEditMode}
                  />
                  <p className="text-sm text-gray-500">
                    {isEditMode ? 'Branch code cannot be changed' : 'Uppercase letters, numbers, and underscores only'}
                  </p>
                  {form.formState.errors.entity_code && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.entity_code.message}
                    </p>
                  )}
                </div>
              </div>

              {!isEditMode && (
                <div className="space-y-2">
                  <Label htmlFor="business_type">Business Type</Label>
                  <Select
                    value={selectedBusinessType}
                    onValueChange={handleBusinessTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type for optimal configuration" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    This sets appropriate defaults for smart codes and operating hours
                  </p>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.watch('location.address') || ''}
                  onChange={(e) => form.setValue('location.address', e.target.value)}
                  placeholder="123 Business Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.watch('location.city') || ''}
                    onChange={(e) => form.setValue('location.city', e.target.value)}
                    placeholder="Dubai"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={form.watch('location.country') || 'UAE'}
                    onValueChange={(value) => form.setValue('location.country', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UAE">United Arab Emirates</SelectItem>
                      <SelectItem value="SA">Saudi Arabia</SelectItem>
                      <SelectItem value="KW">Kuwait</SelectItem>
                      <SelectItem value="QA">Qatar</SelectItem>
                      <SelectItem value="BH">Bahrain</SelectItem>
                      <SelectItem value="OM">Oman</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={form.watch('location.postal_code') || ''}
                    onChange={(e) => form.setValue('location.postal_code', e.target.value)}
                    placeholder="00000"
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={form.watch('contact.phone') || ''}
                    onChange={(e) => form.setValue('contact.phone', e.target.value)}
                    placeholder="+971-50-123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.watch('contact.email') || ''}
                    onChange={(e) => form.setValue('contact.email', e.target.value)}
                    placeholder="marina@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Manager
                  </Label>
                  <Input
                    id="manager"
                    value={form.watch('contact.manager') || ''}
                    onChange={(e) => form.setValue('contact.manager', e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid gap-3">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium capitalize">
                      {day}
                    </div>
                    <Input
                      value={form.watch(`operating_hours.${day}` as any) || ''}
                      onChange={(e) => form.setValue(`operating_hours.${day}` as any, e.target.value)}
                      placeholder="09:00-17:00 or Closed"
                      className="flex-1"
                    />
                  </div>
                ))}
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
                  {form.watch('smart_code')}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>

        </form>

        <Separator />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting || !form.watch('entity_name') || !form.watch('entity_code')}
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? 'Update Branch' : 'Create Branch'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}