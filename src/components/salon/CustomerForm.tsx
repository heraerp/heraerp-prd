import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Save, Loader2, User } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'

interface Customer {
  id: string
  entity_name: string
  entity_code?: string
  dynamic_fields?: {
    first_name?: { value: string }
    last_name?: { value: string }
    email?: { value: string }
    phone?: { value: string }
    mobile?: { value: string }
    date_of_birth?: { value: string }
    gender?: { value: string }
    address?: { value: string }
    city?: { value: string }
    state?: { value: string }
    postal_code?: { value: string }
    country?: { value: string }
    notes?: { value: string }
    preferred_stylist?: { value: string }
    source?: { value: string }
    status?: { value: string }
    tags?: { value: string }
  }
  created_at?: string
  updated_at?: string
}

interface CustomerFormProps {
  customer?: Customer | null
  initialData?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading: boolean
}

export function CustomerForm({ 
  customer, 
  initialData,
  onSubmit, 
  onCancel, 
  isLoading 
}: CustomerFormProps) {
  // Use customer prop or initialData
  const entityData = customer || initialData
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    notes: '',
    preferred_stylist: '',
    source: 'Walk-in',
    status: 'active',
    tags: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when customer changes
  useEffect(() => {
    if (entityData) {
      console.log('[CustomerForm] Populating form with entity data:', entityData)
      
      // Try to extract name from entity_name if first/last names are not available
      const entityName = entityData.entity_name || ''
      const nameParts = entityName.split(' ')
      const defaultFirstName = nameParts.length > 0 ? nameParts[0] : ''
      const defaultLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''
      
      setFormData({
        first_name: entityData.dynamic_fields?.first_name?.value || entityData.dynamic_fields?.name?.value?.split(' ')[0] || defaultFirstName || '',
        last_name: entityData.dynamic_fields?.last_name?.value || entityData.dynamic_fields?.name?.value?.split(' ').slice(1).join(' ') || defaultLastName || '',
        email: entityData.dynamic_fields?.email?.value || '',
        phone: entityData.dynamic_fields?.phone?.value || '',
        mobile: entityData.dynamic_fields?.mobile?.value || '',
        date_of_birth: entityData.dynamic_fields?.date_of_birth?.value || '',
        gender: entityData.dynamic_fields?.gender?.value || '',
        address: entityData.dynamic_fields?.address?.value || '',
        city: entityData.dynamic_fields?.city?.value || '',
        state: entityData.dynamic_fields?.state?.value || '',
        postal_code: entityData.dynamic_fields?.postal_code?.value || '',
        country: entityData.dynamic_fields?.country?.value || '',
        notes: entityData.dynamic_fields?.notes?.value || '',
        preferred_stylist: entityData.dynamic_fields?.preferred_stylist?.value || '',
        source: entityData.dynamic_fields?.source?.value || 'Walk-in',
        status: entityData.dynamic_fields?.status?.value || 'active',
        tags: entityData.dynamic_fields?.tags?.value || ''
      })
    } else {
      // Reset form for new customer
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        mobile: '',
        date_of_birth: '',
        gender: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        notes: '',
        preferred_stylist: '',
        source: 'Walk-in',
        status: 'active',
        tags: ''
      })
    }
  }, [entityData])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      // Combine first and last name for entity_name and name field
      const fullName = `${formData.first_name} ${formData.last_name}`.trim()
      
      // Prepare the data in the format expected by the CRUD page
      const submitData = {
        entity_name: fullName,
        name: fullName, // The dynamic field 'name' that stores the full name
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        mobile: formData.mobile,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        notes: formData.notes,
        preferred_stylist: formData.preferred_stylist,
        source: formData.source,
        status: formData.status,
        tags: formData.tags
      }
      
      console.log('[CustomerForm] Submitting data:', submitData)
      onSubmit(submitData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="space-y-6 pt-6 pb-4 flex-1 overflow-y-auto px-6">
        {/* Personal Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: LUXE_COLORS.champagne }}>
            <User className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
            Personal Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                First Name *
              </label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
              {errors.first_name && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.first_name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Last Name *
              </label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
              {errors.last_name && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.last_name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@example.com"
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
              {errors.email && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.email}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Mobile
              </label>
              <Input
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Date of Birth
              </label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Gender
              </label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger 
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent 
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <SelectItem value="female" style={{ color: LUXE_COLORS.lightText }}>Female</SelectItem>
                  <SelectItem value="male" style={{ color: LUXE_COLORS.lightText }}>Male</SelectItem>
                  <SelectItem value="other" style={{ color: LUXE_COLORS.lightText }}>Other</SelectItem>
                  <SelectItem value="prefer_not_to_say" style={{ color: LUXE_COLORS.lightText }}>Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: LUXE_COLORS.champagne }}>
            Address Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Street Address
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street"
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                City
              </label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="New York"
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                State/Province
              </label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="NY"
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Postal Code
              </label>
              <Input
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="10001"
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Country
              </label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="United States"
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>
          </div>
        </div>

        {/* Salon Preferences Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: LUXE_COLORS.champagne }}>
            Salon Preferences
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Customer Source
              </label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger 
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <SelectItem value="Walk-in" style={{ color: LUXE_COLORS.lightText }}>Walk-in</SelectItem>
                  <SelectItem value="Referral" style={{ color: LUXE_COLORS.lightText }}>Referral</SelectItem>
                  <SelectItem value="Online" style={{ color: LUXE_COLORS.lightText }}>Online</SelectItem>
                  <SelectItem value="Social Media" style={{ color: LUXE_COLORS.lightText }}>Social Media</SelectItem>
                  <SelectItem value="Advertisement" style={{ color: LUXE_COLORS.lightText }}>Advertisement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Status
              </label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger 
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <SelectItem value="active" style={{ color: LUXE_COLORS.emerald }}>Active</SelectItem>
                  <SelectItem value="inactive" style={{ color: LUXE_COLORS.gold }}>Inactive</SelectItem>
                  <SelectItem value="vip" style={{ color: LUXE_COLORS.purple }}>VIP</SelectItem>
                  <SelectItem value="blocked" style={{ color: LUXE_COLORS.ruby }}>Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                Notes
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Special preferences, allergies, or other notes..."
                className="resize-none focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className="flex justify-end space-x-4 pt-6 pb-6 px-6 border-t flex-shrink-0 -mx-6 -mb-6 mt-6"
        style={{
          backgroundColor: `${LUXE_COLORS.charcoal}50`,
          borderColor: `${LUXE_COLORS.gold}20`
        }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="h-11 px-6 transition-all hover:scale-[1.02]"
          style={{
            borderColor: `${LUXE_COLORS.bronze}50`,
            color: LUXE_COLORS.bronze,
            backgroundColor: 'transparent'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = `${LUXE_COLORS.bronze}10`
            e.currentTarget.style.borderColor = LUXE_COLORS.bronze
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor = `${LUXE_COLORS.bronze}50`
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
            color: LUXE_COLORS.black,
            border: 'none'
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{entityData ? 'Update Customer' : 'Create Customer'}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}