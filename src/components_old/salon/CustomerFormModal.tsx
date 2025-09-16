'use client'

import React, { useState, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModalPortal } from '@/components/ui/modal-portal'
import {
  X,
  Save,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Palette,
  Tag,
  Bell,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomerFormData {
  // Basic Information
  entity_name: string
  email: string
  phone: string
  whatsapp?: string
  address?: string

  // Personal Information
  dob?: string
  gender?: string

  // Preferences
  hair_type?: string
  skin_type?: string
  color_formula?: string
  preferred_staff?: string
  preferred_location?: string

  // Consents
  marketing_consent?: boolean
  sms_consent?: boolean
  whatsapp_consent?: boolean

  // Tags
  tags?: string[]

  // Notes
  notes?: string
}

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CustomerFormData) => Promise<void>
  initialData?: Partial<CustomerFormData>
  mode?: 'create' | 'edit'
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create'
}) => {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({})

  // Consistent input styling
  const inputClassName =
    'bg-muted/50 dark:bg-background/50 border-border dark:border-border focus:bg-background dark:focus:bg-background transition-colors'
  const selectClassName =
    'bg-muted/50 dark:bg-background/50 border-border dark:border-border focus:bg-background dark:focus:bg-background'

  const [formData, setFormData] = useState<CustomerFormData>({
    entity_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    dob: '',
    gender: '',
    hair_type: '',
    skin_type: '',
    color_formula: '',
    preferred_staff: '',
    preferred_location: '',
    marketing_consent: false,
    sms_consent: false,
    whatsapp_consent: false,
    tags: [],
    notes: ''
  })

  // Salon-specific options
  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say']
  const hairTypes = ['Straight', 'Wavy', 'Curly', 'Coily', 'Fine', 'Medium', 'Thick']
  const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive']
  const staffMembers = ['Rocky', 'Vinay', 'Maya', 'Sophia', 'Fatima', 'Aisha']
  const locations = ['Park Regis', 'Mercure Gold']
  const availableTags = [
    'VIP',
    'Regular',
    'New',
    'Color Client',
    'Treatment Lover',
    'Product Enthusiast',
    'Bridal',
    'Birthday Month'
  ]

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  if (!mounted || !isOpen) return null

  const handleInputChange = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerFormData, string>> = {}

    // Required fields
    if (!formData.entity_name.trim()) {
      newErrors.entity_name = 'Customer name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+?\d[\d\s-]+$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number'
    }

    // Optional field validations
    if (formData.whatsapp && !/^\+?\d[\d\s-]+$/.test(formData.whatsapp.replace(/\s/g, ''))) {
      newErrors.whatsapp = 'Invalid WhatsApp number'
    }

    if (formData.dob && new Date(formData.dob) > new Date()) {
      newErrors.dob = 'Date of birth cannot be in the future'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      // Switch to tab with first error
      if (errors.entity_name || errors.email || errors.phone || errors.whatsapp || errors.address) {
        setActiveTab('basic')
      } else if (errors.dob || errors.gender) {
        setActiveTab('personal')
      }
      return
    }

    setIsSubmitting(true)
    try {
      // Clean up data before submission - convert "none" to empty string
      const cleanedData = {
        ...formData,
        preferred_staff: formData.preferred_staff === 'none' ? '' : formData.preferred_staff,
        preferred_location:
          formData.preferred_location === 'none' ? '' : formData.preferred_location
      }
      await onSubmit(cleanedData)
      onClose()
    } catch (error) {
      console.error('Error submitting customer:', error)
      // Handle error - you might want to show a toast or alert
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...(prev.tags || []), tag]
    }))
  }

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-background/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-background dark:bg-muted rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-border dark:border-border bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-100 dark:text-foreground">
                  {mode === 'create' ? 'Add New Customer' : 'Pencil Customer'}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                  Fill in the customer information below
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-muted dark:hover:bg-muted-foreground/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-12 px-6">
                  <TabsTrigger value="basic" className="gap-2">
                    <User className="w-4 h-4" />
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Personal
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="gap-2">
                    <Palette className="w-4 h-4" />
                    Preferences
                  </TabsTrigger>
                  <TabsTrigger value="marketing" className="gap-2">
                    <Bell className="w-4 h-4" />
                    Marketing
                  </TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="p-6 space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="entity_name">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="entity_name"
                        value={formData.entity_name}
                        onChange={e => handleInputChange('entity_name', e.target.value)}
                        placeholder="John Doe"
                        className={cn(inputClassName, errors.entity_name && 'border-red-500')}
                      />
                      {errors.entity_name && (
                        <p className="text-sm text-red-500 mt-1">{errors.entity_name}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={e => handleInputChange('email', e.target.value)}
                            placeholder="john@example.com"
                            className={cn(
                              'pl-10',
                              inputClassName,
                              errors.email && 'border-red-500'
                            )}
                          />
                        </div>
                        {errors.email && (
                          <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone">
                          Phone <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={e => handleInputChange('phone', e.target.value)}
                            placeholder="+971 50 123 4567"
                            className={cn(
                              'pl-10',
                              inputClassName,
                              errors.phone && 'border-red-500'
                            )}
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="whatsapp"
                          value={formData.whatsapp}
                          onChange={e => handleInputChange('whatsapp', e.target.value)}
                          placeholder="+971 50 123 4567"
                          className={cn(
                            'pl-10',
                            inputClassName,
                            errors.whatsapp && 'border-red-500'
                          )}
                        />
                      </div>
                      {errors.whatsapp && (
                        <p className="text-sm text-red-500 mt-1">{errors.whatsapp}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={e => handleInputChange('address', e.target.value)}
                          placeholder="123 Main Street, Dubai Marina, Dubai"
                          className={cn('pl-10 min-h-[80px]', inputClassName)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Personal Information Tab */}
                <TabsContent value="personal" className="p-6 space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={formData.dob}
                          onChange={e => handleInputChange('dob', e.target.value)}
                          className={cn(inputClassName, errors.dob && 'border-red-500')}
                        />
                        {errors.dob && <p className="text-sm text-red-500 mt-1">{errors.dob}</p>}
                      </div>

                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={value => handleInputChange('gender', value)}
                        >
                          <SelectTrigger id="gender" className={selectClassName}>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {genderOptions.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hair_type">Hair Type</Label>
                        <Select
                          value={formData.hair_type}
                          onValueChange={value => handleInputChange('hair_type', value)}
                        >
                          <SelectTrigger id="hair_type" className={selectClassName}>
                            <SelectValue placeholder="Select hair type" />
                          </SelectTrigger>
                          <SelectContent>
                            {hairTypes.map(type => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="skin_type">Skin Type</Label>
                        <Select
                          value={formData.skin_type}
                          onValueChange={value => handleInputChange('skin_type', value)}
                        >
                          <SelectTrigger id="skin_type" className={selectClassName}>
                            <SelectValue placeholder="Select skin type" />
                          </SelectTrigger>
                          <SelectContent>
                            {skinTypes.map(type => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="color_formula">Color Formula</Label>
                      <Input
                        id="color_formula"
                        value={formData.color_formula}
                        onChange={e => handleInputChange('color_formula', e.target.value)}
                        placeholder="e.g., Formula #123"
                        className={inputClassName}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences" className="p-6 space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="preferred_staff">Preferred Staff</Label>
                        <Select
                          value={formData.preferred_staff}
                          onValueChange={value => handleInputChange('preferred_staff', value)}
                        >
                          <SelectTrigger id="preferred_staff" className={selectClassName}>
                            <SelectValue placeholder="Select staff member" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No preference</SelectItem>
                            {staffMembers.map(staff => (
                              <SelectItem key={staff} value={staff}>
                                {staff}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="preferred_location">Preferred Location</Label>
                        <Select
                          value={formData.preferred_location}
                          onValueChange={value => handleInputChange('preferred_location', value)}
                        >
                          <SelectTrigger id="preferred_location" className={selectClassName}>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No preference</SelectItem>
                            {locations.map(location => (
                              <SelectItem key={location} value={location}>
                                {location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {availableTags.map(tag => (
                          <Button
                            key={tag}
                            type="button"
                            variant={formData.tags?.includes(tag) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleTagToggle(tag)}
                            className="gap-1"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={e => handleInputChange('notes', e.target.value)}
                        placeholder="Any special notes about this customer..."
                        rows={4}
                        className={inputClassName}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Marketing Tab */}
                <TabsContent value="marketing" className="p-6 space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-3">Communication Preferences</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="marketing_consent"
                            checked={formData.marketing_consent}
                            onCheckedChange={checked =>
                              handleInputChange('marketing_consent', checked)
                            }
                            className="border-border dark:border-border"
                          />
                          <Label
                            htmlFor="marketing_consent"
                            className="cursor-pointer text-sm font-normal"
                          >
                            Email marketing communications
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sms_consent"
                            checked={formData.sms_consent}
                            onCheckedChange={checked => handleInputChange('sms_consent', checked)}
                            className="border-border dark:border-border"
                          />
                          <Label
                            htmlFor="sms_consent"
                            className="cursor-pointer text-sm font-normal"
                          >
                            SMS notifications and offers
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="whatsapp_consent"
                            checked={formData.whatsapp_consent}
                            onCheckedChange={checked =>
                              handleInputChange('whatsapp_consent', checked)
                            }
                            className="border-border dark:border-border"
                          />
                          <Label
                            htmlFor="whatsapp_consent"
                            className="cursor-pointer text-sm font-normal"
                          >
                            WhatsApp messages and updates
                          </Label>
                        </div>
                      </div>
                    </div>

                    <Alert className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <AlertCircle className="h-4 w-4 text-primary dark:text-blue-400" />
                      <AlertDescription className="text-blue-700 dark:text-blue-300">
                        Marketing consents can be updated by the customer at any time. We'll respect
                        their preferences for all communications.
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="border-t border-border dark:border-border bg-muted dark:bg-background p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  <span className="text-red-500">*</span> indicates required fields
                </p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-foreground"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting
                      ? 'Saving...'
                      : mode === 'create'
                        ? 'Add Customer'
                        : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}
