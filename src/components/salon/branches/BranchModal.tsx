'use client'

import React, { useEffect, useState } from 'react'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
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
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  Globe,
  Loader2,
  Navigation,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react'
import type { BranchEntity } from '@/hooks/useHeraBranches'
import { geocodingService } from '@/lib/services/geocoding-service'

// Match EXACTLY the colors from page.tsx
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#B794F4',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  error: '#DC6B6B',
  // Animation timing functions - match page.tsx exactly
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  ease: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
}

export interface BranchFormValues {
  name: string
  code?: string
  description?: string
  address?: string
  city?: string
  phone?: string
  email?: string
  manager_name?: string
  opening_time?: string
  closing_time?: string
  timezone?: string
  gps_latitude?: number
  gps_longitude?: number
  gps_accuracy?: number
  status?: string
}

interface BranchModalProps {
  open: boolean
  onClose: () => void
  branch?: BranchEntity | null
  onSave: (data: BranchFormValues) => Promise<void>
}

export function BranchModal({ open, onClose, branch, onSave }: BranchModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [geocodingMessage, setGeocodingMessage] = useState('')
  const [formData, setFormData] = useState<BranchFormValues>({
    name: '',
    code: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    manager_name: '',
    opening_time: '09:00',
    closing_time: '18:00',
    timezone: 'Asia/Dubai',
    gps_latitude: undefined,
    gps_longitude: undefined,
    gps_accuracy: undefined,
    status: 'active'
  })

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.entity_name || '',
        code: branch.entity_code || '',
        description: branch.entity_description || '',
        address: branch.address || '',
        city: branch.city || '',
        phone: branch.phone || '',
        email: branch.email || '',
        manager_name: branch.manager_name || '',
        opening_time: branch.opening_time || '09:00',
        closing_time: branch.closing_time || '18:00',
        timezone: branch.timezone || 'Asia/Dubai',
        gps_latitude: branch.gps_latitude,
        gps_longitude: branch.gps_longitude,
        gps_accuracy: branch.gps_accuracy,
        status: branch.status === 'archived' ? 'inactive' : 'active'
      })
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        manager_name: '',
        opening_time: '09:00',
        closing_time: '18:00',
        timezone: 'Asia/Dubai',
        gps_latitude: undefined,
        gps_longitude: undefined,
        gps_accuracy: undefined,
        status: 'active'
      })
    }
    setGeocodingStatus('idle')
    setGeocodingMessage('')
  }, [branch, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Branch save error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: keyof BranchFormValues, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 🎯 ENTERPRISE FEATURE: Auto-geocode with proper error handling
  const handleGeocodeFromAddress = async () => {
    // Validation - user-friendly messages, no exceptions
    if (!formData.address && !formData.city) {
      setGeocodingStatus('error')
      setGeocodingMessage('Please enter at least a street address or city to find GPS coordinates.')
      setTimeout(() => setGeocodingStatus('idle'), 4000)
      return
    }

    setIsGeocoding(true)
    setGeocodingStatus('idle')
    setGeocodingMessage('')

    try {
      console.log('[BranchModal] Starting geocoding...', {
        address: formData.address,
        city: formData.city
      })

      // Build full address with both street and city
      const addressParts = []
      if (formData.address) addressParts.push(formData.address)
      if (formData.city) addressParts.push(formData.city)
      addressParts.push('UAE') // Add country for better results

      const fullAddress = addressParts.join(', ')
      console.log('[BranchModal] Full address:', fullAddress)

      const result = await geocodingService.geocodeAddress(fullAddress)

      console.log('[BranchModal] Geocoding SUCCESS:', {
        latitude: result.latitude,
        longitude: result.longitude,
        displayName: result.displayName
      })

      // Update form with coordinates
      setFormData(prev => ({
        ...prev,
        gps_latitude: parseFloat(result.latitude.toFixed(6)),
        gps_longitude: parseFloat(result.longitude.toFixed(6)),
        gps_accuracy: result.accuracy
      }))

      // Show success message
      setGeocodingStatus('success')
      setGeocodingMessage(`✓ Location found: ${result.displayName || 'Coordinates updated successfully'}`)
      setTimeout(() => setGeocodingStatus('idle'), 6000)

    } catch (error: any) {
      // Enterprise-grade error handling - user-friendly messages only
      console.error('[BranchModal] Geocoding error details:', {
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        errorCode: error?.code,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      })

      setGeocodingStatus('error')

      // Provide helpful, actionable error messages based on error type
      if (error?.code === 'NO_RESULTS') {
        setGeocodingMessage(
          `Address not found. Please check: "${formData.address || formData.city}". Try entering a more specific address (e.g., "Sheikh Zayed Road, Dubai").`
        )
      } else if (error?.code === 'INVALID_ADDRESS') {
        setGeocodingMessage(
          'Please enter a valid address format. Include street name and city for best results.'
        )
      } else if (error?.code === 'API_ERROR') {
        setGeocodingMessage(
          'Geocoding service temporarily unavailable. You can manually enter GPS coordinates below or try again later.'
        )
      } else if (error?.code === 'NETWORK_ERROR') {
        setGeocodingMessage(
          'Network connection issue. Please check your internet connection and try again.'
        )
      } else {
        setGeocodingMessage(
          `Unable to find location for "${formData.address || formData.city}". Please try a more specific address or enter GPS coordinates manually below.`
        )
      }

      setTimeout(() => setGeocodingStatus('idle'), 6000)
    } finally {
      setIsGeocoding(false)
    }
  }

  const getMapUrl = () => {
    if (!formData.gps_latitude || !formData.gps_longitude) return null
    return `https://www.google.com/maps?q=${formData.gps_latitude},${formData.gps_longitude}`
  }

  const canGeocode = (formData.address && formData.address.trim().length > 0) ||
                     (formData.city && formData.city.trim().length > 0)

  return (
    <SalonLuxeModal
      open={open}
      onClose={onClose}
      title={branch ? 'Edit Branch' : 'Create New Branch'}
      description={branch ? 'Update branch location details' : 'Add a new luxury salon location'}
      icon={<Building2 className="w-6 h-6" />}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Information */}
          <div
            className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg"
            style={{
              backgroundColor: `${COLORS.charcoalLight}95 !important`,
              border: `1px solid ${COLORS.bronze}33 !important`,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              transition: `all 0.3s ${COLORS.ease}`
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: COLORS.gold }}>
              <Sparkles className="w-4 h-4" />
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                  Branch Name *
                </Label>
                <Input
                  value={formData.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="Downtown Salon"
                  required
                  className="transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.bronze}60 !important`,
                    color: `${COLORS.champagne} !important`,
                    borderRadius: '0.5rem !important',
                    padding: '0.75rem !important'
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                  Branch Code
                </Label>
                <Input
                  value={formData.code}
                  onChange={e => updateField('code', e.target.value)}
                  placeholder="BR-DXB-001"
                  className="transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.bronze}60 !important`,
                    color: `${COLORS.champagne} !important`,
                    borderRadius: '0.5rem !important',
                    padding: '0.75rem !important'
                  }}
                />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <Label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                Description
              </Label>
              <Textarea
                value={formData.description}
                onChange={e => updateField('description', e.target.value)}
                placeholder="Premium location with luxury amenities..."
                rows={2}
                className="resize-none transition-all duration-300 ease-out"
                style={{
                  backgroundColor: `${COLORS.charcoalDark} !important`,
                  borderColor: `${COLORS.bronze}60 !important`,
                  color: `${COLORS.champagne} !important`,
                  borderRadius: '0.75rem !important',
                  padding: '0.75rem !important'
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                Status
              </Label>
              <Select value={formData.status} onValueChange={value => updateField('status', value)}>
                <SelectTrigger
                  className="transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.bronze}60 !important`,
                    color: `${COLORS.champagne} !important`,
                    borderRadius: '0.5rem !important',
                    padding: '0.75rem !important'
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className="hera-select-content"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.gold}40 !important`,
                    border: `1px solid ${COLORS.gold}40 !important`,
                    boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px ${COLORS.gold}20 !important`,
                    borderRadius: '0.5rem !important'
                  }}
                >
                  <SelectItem
                    value="active"
                    className="hera-select-item"
                    style={{
                      backgroundColor: 'transparent !important',
                      color: `${COLORS.champagne} !important`
                    }}
                  >
                    Active
                  </SelectItem>
                  <SelectItem
                    value="inactive"
                    className="hera-select-item"
                    style={{
                      backgroundColor: 'transparent !important',
                      color: `${COLORS.champagne} !important`
                    }}
                  >
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location & GPS */}
          <div
            className="p-6 rounded-xl transition-all duration-300 hover:shadow-xl"
            style={{
              backgroundColor: `${COLORS.charcoalLight}95 !important`,
              border: `1px solid ${COLORS.gold}33 !important`,
              boxShadow: '0 6px 20px rgba(212, 175, 55, 0.2), 0 0 0 1px rgba(212, 175, 55, 0.1)',
              backdropFilter: 'blur(20px)',
              transition: `all 0.3s ${COLORS.ease}`
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: COLORS.gold }}>
              <MapPin className="w-4 h-4" />
              Location & GPS Coordinates
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                  Street Address
                </Label>
                <Input
                  value={formData.address}
                  onChange={e => updateField('address', e.target.value)}
                  placeholder="Sheikh Zayed Road"
                  className="transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.bronze}60 !important`,
                    color: `${COLORS.champagne} !important`,
                    borderRadius: '0.5rem !important',
                    padding: '0.75rem !important'
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                  City
                </Label>
                <Input
                  value={formData.city}
                  onChange={e => updateField('city', e.target.value)}
                  placeholder="Dubai"
                  className="transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.bronze}60 !important`,
                    color: `${COLORS.champagne} !important`,
                    borderRadius: '0.5rem !important',
                    padding: '0.75rem !important'
                  }}
                />
              </div>
            </div>

            {/* GPS Section */}
            <div
              className="p-5 rounded-xl space-y-3 mt-4 transition-all duration-300"
              style={{
                backgroundColor: `${COLORS.gold}08`,
                border: `1px solid ${COLORS.gold}30`,
                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.1)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" style={{ color: COLORS.gold }} />
                  <span className="text-sm font-semibold" style={{ color: COLORS.gold }}>
                    GPS Coordinates
                  </span>
                </div>
                {formData.gps_latitude && formData.gps_longitude && (
                  <a
                    href={getMapUrl()!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:opacity-80"
                    style={{
                      color: COLORS.gold,
                      backgroundColor: `${COLORS.gold}20`,
                      border: `1px solid ${COLORS.gold}40`
                    }}
                  >
                    <Globe className="w-3 h-3" />
                    View on Map
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={formData.gps_latitude ?? ''}
                  onChange={e =>
                    updateField('gps_latitude', e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  placeholder="25.276987"
                  type="number"
                  step="0.000001"
                  className="text-sm transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.gold}50 !important`,
                    color: `${COLORS.gold} !important`,
                    borderRadius: '0.5rem !important',
                    padding: '0.625rem !important'
                  }}
                />
                <Input
                  value={formData.gps_longitude ?? ''}
                  onChange={e =>
                    updateField('gps_longitude', e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  placeholder="55.296249"
                  type="number"
                  step="0.000001"
                  className="text-sm transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.gold}50 !important`,
                    color: `${COLORS.gold} !important`,
                    borderRadius: '0.5rem !important',
                    padding: '0.625rem !important'
                  }}
                />
              </div>

              <Button
                type="button"
                onClick={handleGeocodeFromAddress}
                disabled={!canGeocode || isGeocoding}
                className="salon-gps-button w-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                style={{
                  background: canGeocode
                    ? `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%) !important`
                    : `${COLORS.bronze}30 !important`,
                  color: canGeocode
                    ? `${COLORS.black} !important`
                    : `${COLORS.lightText} !important`,
                  fontWeight: 600,
                  boxShadow: canGeocode ? '0 6px 20px rgba(212, 175, 55, 0.4), 0 0 0 1px rgba(212, 175, 55, 0.2)' : 'none',
                  borderRadius: '0.75rem !important',
                  padding: '0.875rem 1.5rem !important',
                  transition: `all 0.3s ${COLORS.ease}`
                }}
              >
                {isGeocoding ? (
                  <>
                    <Loader2
                      className="w-4 h-4 mr-2 animate-spin"
                      style={{ color: canGeocode ? `${COLORS.black} !important` : `${COLORS.lightText} !important` }}
                    />
                    <span style={{ color: canGeocode ? `${COLORS.black} !important` : `${COLORS.lightText} !important` }}>
                      Finding Location...
                    </span>
                  </>
                ) : (
                  <>
                    <MapPin
                      className="w-4 h-4 mr-2"
                      style={{ color: canGeocode ? `${COLORS.black} !important` : `${COLORS.lightText} !important` }}
                    />
                    <span style={{ color: canGeocode ? `${COLORS.black} !important` : `${COLORS.lightText} !important` }}>
                      Get GPS from Address
                    </span>
                  </>
                )}
              </Button>

              {/* Status Messages */}
              {geocodingStatus !== 'idle' && (
                <div
                  className="flex items-start gap-2 text-xs p-4 rounded-xl animate-in fade-in transition-all duration-300"
                  style={{
                    backgroundColor:
                      geocodingStatus === 'success' ? `${COLORS.emerald}15` : `${COLORS.error}15`,
                    color: geocodingStatus === 'success' ? COLORS.emerald : COLORS.error,
                    border: `1px solid ${geocodingStatus === 'success' ? COLORS.emerald : COLORS.error}30`,
                    boxShadow: geocodingStatus === 'success'
                      ? '0 2px 8px rgba(15, 111, 92, 0.15)'
                      : '0 2px 8px rgba(220, 107, 107, 0.15)'
                  }}
                >
                  {geocodingStatus === 'success' ? (
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="leading-relaxed">{geocodingMessage}</p>
                </div>
              )}

              {formData.gps_latitude && formData.gps_longitude && (
                <div
                  className="text-xs p-3 rounded-xl text-center font-mono transition-all duration-300"
                  style={{
                    backgroundColor: `${COLORS.gold}15`,
                    color: COLORS.gold,
                    border: `1px solid ${COLORS.gold}40`,
                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.15)'
                  }}
                >
                  📍 {formData.gps_latitude.toFixed(6)}, {formData.gps_longitude.toFixed(6)}
                  {formData.gps_accuracy && ` (±${formData.gps_accuracy}m)`}
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div
            className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg"
            style={{
              backgroundColor: `${COLORS.charcoalLight}95 !important`,
              border: `1px solid ${COLORS.emerald}33 !important`,
              boxShadow: '0 4px 16px rgba(15, 111, 92, 0.15)',
              backdropFilter: 'blur(20px)',
              transition: `all 0.3s ${COLORS.ease}`
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: COLORS.emerald }}>
              <Phone className="w-4 h-4" />
              Contact Information
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                  Phone Number
                </Label>
                <Input
                  value={formData.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  placeholder="+971 4 123 4567"
                  type="tel"
                  className="transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.bronze}60 !important`,
                    color: `${COLORS.champagne} !important`,
                    borderRadius: '0.5rem !important',
                    padding: '0.75rem !important'
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                  Email Address
                </Label>
                <Input
                  value={formData.email}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="branch@salon.ae"
                  type="email"
                  className="transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.bronze}60 !important`,
                    color: `${COLORS.champagne} !important`,
                    borderRadius: '0.5rem !important',
                    padding: '0.75rem !important'
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                Branch Manager
              </Label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10"
                  style={{ color: COLORS.bronze }}
                />
                <Input
                  value={formData.manager_name}
                  onChange={e => updateField('manager_name', e.target.value)}
                  placeholder="Manager Name"
                  className="pl-10 transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.bronze}60 !important`,
                    color: `${COLORS.champagne} !important`,
                    borderRadius: '0.5rem !important',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem !important'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div
            className="p-6 rounded-xl transition-all duration-300 hover:shadow-lg"
            style={{
              backgroundColor: `${COLORS.charcoalLight}95 !important`,
              border: `1px solid ${COLORS.plum}33 !important`,
              boxShadow: '0 4px 16px rgba(183, 148, 244, 0.15)',
              backdropFilter: 'blur(20px)',
              transition: `all 0.3s ${COLORS.ease}`
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: COLORS.plum }}>
              <Clock className="w-4 h-4" />
              Operating Hours
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                  Opening Time
                </Label>
                <Input
                  value={formData.opening_time}
                  onChange={e => updateField('opening_time', e.target.value)}
                  type="time"
                  className="transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.bronze}60 !important`,
                    color: `${COLORS.champagne} !important`,
                    borderRadius: '0.5rem !important',
                    padding: '0.75rem !important'
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                  Closing Time
                </Label>
                <Input
                  value={formData.closing_time}
                  onChange={e => updateField('closing_time', e.target.value)}
                  type="time"
                  className="transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.bronze}60 !important`,
                    color: `${COLORS.champagne} !important`,
                    borderRadius: '0.5rem !important',
                    padding: '0.75rem !important'
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                Timezone
              </Label>
              <Select value={formData.timezone} onValueChange={value => updateField('timezone', value)}>
                <SelectTrigger
                  className="transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.bronze}60 !important`,
                    color: `${COLORS.champagne} !important`,
                    borderRadius: '0.5rem !important',
                    padding: '0.75rem !important'
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className="hera-select-content"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark} !important`,
                    borderColor: `${COLORS.gold}40 !important`,
                    border: `1px solid ${COLORS.gold}40 !important`,
                    boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px ${COLORS.gold}20 !important`,
                    borderRadius: '0.5rem !important'
                  }}
                >
                  <SelectItem
                    value="Asia/Dubai"
                    className="hera-select-item"
                    style={{
                      backgroundColor: 'transparent !important',
                      color: `${COLORS.champagne} !important`
                    }}
                  >
                    Asia/Dubai (GST +4)
                  </SelectItem>
                  <SelectItem
                    value="Asia/Riyadh"
                    className="hera-select-item"
                    style={{
                      backgroundColor: 'transparent !important',
                      color: `${COLORS.champagne} !important`
                    }}
                  >
                    Asia/Riyadh (AST +3)
                  </SelectItem>
                  <SelectItem
                    value="Europe/London"
                    className="hera-select-item"
                    style={{
                      backgroundColor: 'transparent !important',
                      color: `${COLORS.champagne} !important`
                    }}
                  >
                    Europe/London (GMT)
                  </SelectItem>
                  <SelectItem
                    value="America/New_York"
                    className="hera-select-item"
                    style={{
                      backgroundColor: 'transparent !important',
                      color: `${COLORS.champagne} !important`
                    }}
                  >
                    America/New_York (EST -5)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t" style={{ borderColor: `${COLORS.bronze}30` }}>
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="salon-cancel-button px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              style={{
                backgroundColor: 'transparent !important',
                border: `1.5px solid ${COLORS.bronze}60 !important`,
                color: `${COLORS.champagne} !important`,
                fontWeight: 600,
                borderRadius: '0.75rem !important',
                padding: '0.75rem 1.5rem !important',
                backdropFilter: 'blur(10px)',
                transition: `all 0.3s ${COLORS.ease}`
              }}
            >
              <span style={{ color: `${COLORS.champagne} !important` }}>Cancel</span>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="salon-submit-button px-8 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%) !important`,
                color: '#000000 !important',
                fontWeight: 700,
                boxShadow: '0 6px 20px rgba(212, 175, 55, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.3)',
                minWidth: '150px',
                borderRadius: '0.75rem !important',
                padding: '0.75rem 2rem !important',
                border: 'none !important',
                transition: `all 0.3s ${COLORS.ease}`
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center" style={{ color: '#000000 !important' }}>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" style={{ color: '#000000 !important' }} />
                  <span style={{ color: '#000000 !important', fontWeight: 700 }}>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center" style={{ color: '#000000 !important' }}>
                  <Check className="w-5 h-5 mr-2" style={{ color: '#000000 !important' }} />
                  <span style={{ color: '#000000 !important', fontWeight: 700 }}>
                    {branch ? 'Update Branch' : 'Create Branch'}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </form>

        {/* Global Styles for Dropdown Items */}
        <style jsx global>{`
          /* Override global CSS for select items */
          .hera-select-item[data-radix-collection-item] {
            cursor: pointer !important;
            padding: 0.5rem 0.75rem !important;
            transition: all 0.2s ease !important;
          }

          .hera-select-item[data-radix-collection-item]:hover {
            background-color: ${COLORS.gold}20 !important;
            color: ${COLORS.champagne} !important;
          }

          .hera-select-item[data-radix-collection-item][data-state="checked"] {
            background-color: ${COLORS.gold}30 !important;
            color: ${COLORS.champagne} !important;
          }

          /* Ensure dropdown content is above everything */
          [role="listbox"] {
            z-index: 99999 !important;
          }
        `}</style>
    </SalonLuxeModal>
  )
}
