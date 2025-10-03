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
import { Save, Loader2, User, Phone, Mail, Calendar, DollarSign, Shield, Star } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { format } from 'date-fns'

interface StaffMember {
  id: string
  entity_name: string
  entity_code?: string
  dynamic_fields?: {
    first_name?: { value: string }
    last_name?: { value: string }
    email?: { value: string }
    phone?: { value: string }
    role_title?: { value: string }
    status?: { value: string }
    hire_date?: { value: string }
    hourly_cost?: { value: number }
    display_rate?: { value: number }
    skills?: { value: any }
    bio?: { value: string }
    avatar_url?: { value: string }
  }
  relationships?: {
    role?: { to_entity: any }
    services?: { to_entity: any }[]
    location?: { to_entity: any }
    supervisor?: { to_entity: any }
  }
  created_at?: string
  updated_at?: string
}

interface StaffFormProps {
  staff?: StaffMember | null
  roles: any[]
  services: any[]
  locations: any[]
  existingStaff: any[]
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading: boolean
  canViewCosts: boolean
}

export function StaffForm({
  staff,
  roles,
  services,
  locations,
  existingStaff,
  onSubmit,
  onCancel,
  isLoading,
  canViewCosts
}: StaffFormProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'active',
    hire_date: format(new Date(), 'yyyy-MM-dd'),
    hourly_cost: 0,
    display_rate: 0,
    bio: '',
    avatar_url: '',
    role_id: '',
    role_title: '',
    service_ids: [] as string[],
    location_id: '',
    supervisor_id: '',
    skills: [] as string[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newSkill, setNewSkill] = useState('')

  // Update form data when staff changes
  useEffect(() => {
    if (staff) {
      console.log('[StaffForm] Populating form with staff data:', staff)

      setFormData({
        first_name: staff.dynamic_fields?.first_name?.value || '',
        last_name: staff.dynamic_fields?.last_name?.value || '',
        email: staff.dynamic_fields?.email?.value || '',
        phone: staff.dynamic_fields?.phone?.value || '',
        status: staff.dynamic_fields?.status?.value || 'active',
        hire_date: staff.dynamic_fields?.hire_date?.value || format(new Date(), 'yyyy-MM-dd'),
        hourly_cost: staff.dynamic_fields?.hourly_cost?.value || 0,
        display_rate: staff.dynamic_fields?.display_rate?.value || 0,
        bio: staff.dynamic_fields?.bio?.value || '',
        avatar_url: staff.dynamic_fields?.avatar_url?.value || '',
        role_id: staff.relationships?.role?.to_entity?.id || '',
        role_title: staff.dynamic_fields?.role_title?.value || '',
        service_ids: staff.relationships?.services?.map(r => r.to_entity.id) || [],
        location_id: staff.relationships?.location?.to_entity?.id || '',
        supervisor_id: staff.relationships?.supervisor?.to_entity?.id || '',
        skills: staff.dynamic_fields?.skills?.value || []
      })
    } else {
      // Reset form for new staff
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        status: 'active',
        hire_date: format(new Date(), 'yyyy-MM-dd'),
        hourly_cost: 0,
        display_rate: 0,
        bio: '',
        avatar_url: '',
        role_id: '',
        role_title: '',
        service_ids: [],
        location_id: '',
        supervisor_id: '',
        skills: []
      })
    }
  }, [staff])

  // Update role title when role is selected
  useEffect(() => {
    if (formData.role_id) {
      const selectedRole = roles.find(r => r.id === formData.role_id)
      if (selectedRole) {
        setFormData(prev => ({
          ...prev,
          role_title: selectedRole.dynamic_fields?.title?.value || selectedRole.entity_name
        }))
      }
    }
  }, [formData.role_id, roles])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="space-y-6 pt-6 pb-4 overflow-y-auto px-6">
        {/* Personal Information Section */}
        <div className="space-y-4">
          <h3
            className="text-lg font-semibold flex items-center gap-2"
            style={{ color: LUXE_COLORS.champagne }}
          >
            <User className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: LUXE_COLORS.champagne }}
              >
                First Name *
              </label>
              <Input
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
              {errors.first_name && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: LUXE_COLORS.champagne }}
              >
                Last Name *
              </label>
              <Input
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
              {errors.last_name && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.last_name}</p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: LUXE_COLORS.champagne }}
              >
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@salon.com"
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
              {errors.email && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: LUXE_COLORS.champagne }}
              >
                Phone
              </label>
              <Input
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
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

        {/* Employment Information Section */}
        <div className="space-y-4">
          <h3
            className="text-lg font-semibold flex items-center gap-2"
            style={{ color: LUXE_COLORS.champagne }}
          >
            <Shield className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
            Employment Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: LUXE_COLORS.champagne }}
              >
                Role
              </label>
              <Select
                value={formData.role_id}
                onValueChange={value => setFormData({ ...formData, role_id: value })}
              >
                <SelectTrigger
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  {roles.map(role => (
                    <SelectItem
                      key={role.id}
                      value={role.id}
                      style={{ color: LUXE_COLORS.lightText }}
                    >
                      {role.dynamic_fields?.title?.value || role.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: LUXE_COLORS.champagne }}
              >
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={value => setFormData({ ...formData, status: value })}
              >
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
                  <SelectItem value="active" style={{ color: LUXE_COLORS.emerald }}>
                    Active
                  </SelectItem>
                  <SelectItem value="inactive" style={{ color: LUXE_COLORS.bronze }}>
                    Inactive
                  </SelectItem>
                  <SelectItem value="on_leave" style={{ color: LUXE_COLORS.gold }}>
                    On Leave
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: LUXE_COLORS.champagne }}
              >
                Hire Date
              </label>
              <Input
                type="date"
                value={formData.hire_date}
                onChange={e => setFormData({ ...formData, hire_date: e.target.value })}
                className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: LUXE_COLORS.champagne }}
              >
                Location
              </label>
              <Select
                value={formData.location_id}
                onValueChange={value => setFormData({ ...formData, location_id: value })}
              >
                <SelectTrigger
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  {locations.map(location => (
                    <SelectItem
                      key={location.id}
                      value={location.id}
                      style={{ color: LUXE_COLORS.lightText }}
                    >
                      {location.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: LUXE_COLORS.champagne }}
              >
                Reports To
              </label>
              <Select
                value={formData.supervisor_id || 'none'}
                onValueChange={value =>
                  setFormData({ ...formData, supervisor_id: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger
                  className="h-11"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <SelectItem value="none" style={{ color: LUXE_COLORS.lightText }}>
                    None
                  </SelectItem>
                  {existingStaff
                    .filter(s => s.id !== staff?.id)
                    .map(member => (
                      <SelectItem
                        key={member.id}
                        value={member.id}
                        style={{ color: LUXE_COLORS.lightText }}
                      >
                        {member.entity_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Compensation Section (only visible to authorized users) */}
        {canViewCosts && (
          <div className="space-y-4">
            <h3
              className="text-lg font-semibold flex items-center gap-2"
              style={{ color: LUXE_COLORS.champagne }}
            >
              <DollarSign className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
              Compensation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: LUXE_COLORS.champagne }}
                >
                  Hourly Cost (Internal)
                </label>
                <Input
                  type="number"
                  value={formData.hourly_cost}
                  onChange={e =>
                    setFormData({ ...formData, hourly_cost: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="25.00"
                  step="0.01"
                  className="h-11 focus:ring-2 focus:ring-gold/50 transition-all"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoal}80`,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.lightText
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: LUXE_COLORS.champagne }}
                >
                  Display Rate (Customer-facing)
                </label>
                <Input
                  type="number"
                  value={formData.display_rate}
                  onChange={e =>
                    setFormData({ ...formData, display_rate: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="150.00"
                  step="0.01"
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
        )}

        {/* Services Section */}
        <div className="space-y-4">
          <h3
            className="text-lg font-semibold flex items-center gap-2"
            style={{ color: LUXE_COLORS.champagne }}
          >
            <Star className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
            Services
          </h3>

          <div className="space-y-2">
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: LUXE_COLORS.champagne }}
            >
              Services This Staff Can Perform
            </label>
            <div
              className="max-h-48 overflow-y-auto space-y-2 p-3 rounded-lg"
              style={{ backgroundColor: `${LUXE_COLORS.charcoal}50` }}
            >
              {services.map(service => (
                <label
                  key={service.id}
                  className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.service_ids.includes(service.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          service_ids: [...formData.service_ids, service.id]
                        })
                      } else {
                        setFormData({
                          ...formData,
                          service_ids: formData.service_ids.filter(id => id !== service.id)
                        })
                      }
                    }}
                    className="h-4 w-4 rounded text-gold focus:ring-gold"
                  />
                  <span style={{ color: LUXE_COLORS.lightText }}>{service.entity_name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Skills & Bio Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: LUXE_COLORS.champagne }}>
            Skills & Bio
          </h3>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: LUXE_COLORS.champagne }}
            >
              Skills
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
              <Button
                type="button"
                onClick={addSkill}
                disabled={!newSkill.trim()}
                style={{
                  backgroundColor: LUXE_COLORS.gold,
                  color: LUXE_COLORS.black
                }}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  style={{
                    backgroundColor: `${LUXE_COLORS.bronze}20`,
                    color: LUXE_COLORS.bronze,
                    border: `1px solid ${LUXE_COLORS.bronze}40`
                  }}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:opacity-70"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: LUXE_COLORS.champagne }}
            >
              Bio
            </label>
            <Textarea
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              placeholder="Professional biography..."
              className="resize-none focus:ring-2 focus:ring-gold/50 transition-all"
              style={{
                backgroundColor: `${LUXE_COLORS.charcoal}80`,
                border: `1px solid ${LUXE_COLORS.bronze}30`,
                color: LUXE_COLORS.lightText
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: LUXE_COLORS.champagne }}
            >
              Avatar URL
            </label>
            <Input
              value={formData.avatar_url}
              onChange={e => setFormData({ ...formData, avatar_url: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
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
              <span>{staff ? 'Update Staff Member' : 'Add Staff Member'}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
