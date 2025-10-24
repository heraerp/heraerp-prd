/**
 * Customer Modal Component
 * ✅ UPGRADED: Now using SalonLuxeModal and SalonLuxeButton
 * ✅ Enhanced phone validation for UAE format
 * Enterprise-grade customer add/edit modal with salon luxe theme
 */

'use client'

import React, { useState, useEffect } from 'react'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
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
import { User, Mail, Phone, MapPin, Calendar, Star, FileText, AlertCircle } from 'lucide-react'
import type { CustomerEntity } from '@/hooks/useHeraCustomers'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#B794F4',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

interface CustomerModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CustomerFormData) => Promise<void>
  customer?: CustomerEntity | null
  isLoading?: boolean
}

export interface CustomerFormData {
  name: string
  email?: string
  phone?: string
  address?: string
  birthday?: string
  notes?: string
  vip?: boolean
  loyalty_points?: number
}

// Enhanced phone validation for UAE numbers
const validatePhoneNumber = (phone: string): { isValid: boolean; message?: string } => {
  if (!phone || phone.trim() === '') {
    return { isValid: true } // Phone is optional
  }

  // Remove spaces, dashes, and parentheses for validation
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

  // Check if it contains only valid characters
  if (!/^[\d\+]+$/.test(cleanPhone)) {
    return {
      isValid: false,
      message: 'Phone can only contain numbers, +, spaces, and dashes'
    }
  }

  // UAE phone format validation
  // Accepts: +971 XX XXX XXXX or 05X XXX XXXX or 04 XXX XXXX
  const uaePatterns = [
    /^\+971[0-9]{9}$/, // +971501234567
    /^971[0-9]{9}$/, // 971501234567
    /^0[0-9]{9}$/, // 0501234567
    /^[0-9]{7,10}$/ // 7-10 digits (flexible)
  ]

  const isUAEFormat = uaePatterns.some(pattern => pattern.test(cleanPhone))

  if (!isUAEFormat && cleanPhone.length > 0) {
    return {
      isValid: false,
      message: 'Please use UAE format: +971 XX XXX XXXX or 05X XXX XXXX'
    }
  }

  // Check reasonable length (7-15 digits)
  if (cleanPhone.replace(/\+/g, '').length < 7 || cleanPhone.replace(/\+/g, '').length > 15) {
    return {
      isValid: false,
      message: 'Phone number should be 7-15 digits'
    }
  }

  return { isValid: true }
}

export function CustomerModal({
  open,
  onClose,
  onSubmit,
  customer,
  isLoading = false
}: CustomerModalProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    birthday: '',
    notes: '',
    vip: false,
    loyalty_points: 0
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Initialize form with customer data when editing
  useEffect(() => {
    if (customer) {
      const formDataToSet = {
        name: customer.entity_name || '',
        email: customer.dynamic_fields?.email?.value || customer.email || '',
        phone: customer.dynamic_fields?.phone?.value || customer.phone || '',
        address: '',
        birthday: customer.dynamic_fields?.birthday?.value || customer.birthday || '',
        notes: customer.dynamic_fields?.notes?.value || customer.notes || '',
        vip: customer.dynamic_fields?.vip?.value || customer.vip || false,
        loyalty_points:
          customer.dynamic_fields?.loyalty_points?.value || customer.loyalty_points || 0
      }

      setFormData(formDataToSet)
    } else {
      // Reset form for new customer
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        birthday: '',
        notes: '',
        vip: false,
        loyalty_points: 0
      })
    }
    setErrors({})
  }, [customer, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format (e.g., customer@example.com)'
    }

    // Enhanced phone validation
    if (formData.phone) {
      const phoneValidation = validatePhoneNumber(formData.phone)
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.message || 'Invalid phone number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Error submitting customer:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SalonLuxeModal
      open={open}
      onClose={onClose}
      title={customer ? 'Edit Customer' : 'Add New Customer'}
      description={
        customer
          ? 'Update customer information and preferences'
          : 'Create a new customer profile with contact details'
      }
      icon={<User className="h-6 w-6" />}
      size="lg"
      footer={
        <>
          <SalonLuxeButton variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </SalonLuxeButton>
          <SalonLuxeButton
            type="submit"
            loading={submitting || isLoading}
            onClick={handleSubmit}
          >
            {customer ? 'Update Customer' : 'Add Customer'}
          </SalonLuxeButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        {/* Customer Name - Required */}
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="text-sm font-medium flex items-center gap-2"
            style={{ color: COLORS.lightText }}
          >
            Customer Name <span style={{ color: COLORS.rose }}>*</span>
          </Label>
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: COLORS.bronze }}
            />
            <Input
              id="name"
              value={formData.name}
              onChange={e => {
                setFormData({ ...formData, name: e.target.value })
                // Clear error on change
                if (errors.name) {
                  setErrors({ ...errors, name: '' })
                }
              }}
              placeholder="Enter customer full name"
              className="pl-10 transition-all duration-300"
              style={{
                backgroundColor: COLORS.charcoalLight,
                border: `1px solid ${errors.name ? COLORS.rose : COLORS.bronze}40`,
                color: COLORS.lightText
              }}
              required
              autoFocus
            />
          </div>
          {errors.name && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.rose }}>
              <AlertCircle className="h-3 w-3" />
              <span>{errors.name}</span>
            </div>
          )}
        </div>

        {/* Email & Phone - Two columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Email */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium"
              style={{ color: COLORS.lightText }}
            >
              Email Address
            </Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: COLORS.bronze }}
              />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => {
                  setFormData({ ...formData, email: e.target.value })
                  if (errors.email) {
                    setErrors({ ...errors, email: '' })
                  }
                }}
                placeholder="customer@example.com"
                className="pl-10 transition-all duration-300"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${errors.email ? COLORS.rose : COLORS.bronze}40`,
                  color: COLORS.lightText
                }}
              />
            </div>
            {errors.email && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.rose }}>
                <AlertCircle className="h-3 w-3" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Phone with Enhanced Validation */}
          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-sm font-medium"
              style={{ color: COLORS.lightText }}
            >
              Phone Number
            </Label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: COLORS.bronze }}
              />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={e => {
                  setFormData({ ...formData, phone: e.target.value })
                  if (errors.phone) {
                    setErrors({ ...errors, phone: '' })
                  }
                }}
                placeholder="+971 50 123 4567"
                className="pl-10 transition-all duration-300"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${errors.phone ? COLORS.rose : COLORS.bronze}40`,
                  color: COLORS.lightText
                }}
              />
            </div>
            {errors.phone && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.rose }}>
                <AlertCircle className="h-3 w-3" />
                <span>{errors.phone}</span>
              </div>
            )}
            {!errors.phone && formData.phone && (
              <p className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                UAE format: +971 XX XXX XXXX
              </p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label
            htmlFor="address"
            className="text-sm font-medium"
            style={{ color: COLORS.lightText }}
          >
            Address
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4" style={{ color: COLORS.bronze }} />
            <Textarea
              id="address"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter customer address"
              rows={2}
              className="pl-10 transition-all duration-300 resize-none"
              style={{
                backgroundColor: COLORS.charcoalLight,
                border: `1px solid ${COLORS.bronze}40`,
                color: COLORS.lightText
              }}
            />
          </div>
        </div>

        {/* Birthday & VIP Status */}
        <div className="grid grid-cols-2 gap-4">
          {/* Birthday */}
          <div className="space-y-2">
            <Label
              htmlFor="birthday"
              className="text-sm font-medium"
              style={{ color: COLORS.lightText }}
            >
              Birthday
            </Label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: COLORS.bronze }}
              />
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                className="pl-10 transition-all duration-300"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${COLORS.bronze}40`,
                  color: COLORS.lightText
                }}
              />
            </div>
          </div>

          {/* VIP Status */}
          <div className="space-y-2">
            <Label
              htmlFor="vip"
              className="text-sm font-medium"
              style={{ color: COLORS.lightText }}
            >
              VIP Status
            </Label>
            <Select
              value={formData.vip ? 'true' : 'false'}
              onValueChange={value => setFormData({ ...formData, vip: value === 'true' })}
            >
              <SelectTrigger
                id="vip"
                className="transition-all duration-300"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${COLORS.bronze}40`,
                  color: COLORS.lightText
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                style={{
                  backgroundColor: COLORS.charcoal,
                  border: `1px solid ${COLORS.bronze}40`
                }}
              >
                <SelectItem value="false" style={{ color: COLORS.lightText }}>
                  Regular Customer
                </SelectItem>
                <SelectItem value="true" style={{ color: COLORS.gold }}>
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3" style={{ color: COLORS.gold }} />
                    VIP Customer
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label
            htmlFor="notes"
            className="text-sm font-medium"
            style={{ color: COLORS.lightText }}
          >
            Notes & Preferences
          </Label>
          <div className="relative">
            <FileText
              className="absolute left-3 top-3 h-4 w-4"
              style={{ color: COLORS.bronze }}
            />
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Service preferences, allergies, special requests..."
              rows={3}
              className="pl-10 transition-all duration-300 resize-none"
              style={{
                backgroundColor: COLORS.charcoalLight,
                border: `1px solid ${COLORS.bronze}40`,
                color: COLORS.lightText
              }}
            />
          </div>
          <p className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Add any important notes about customer preferences or requirements
          </p>
        </div>
      </form>
    </SalonLuxeModal>
  )
}
