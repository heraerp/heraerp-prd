/**
 * Customer Modal Component
 * Enterprise-grade customer add/edit modal with salon luxe theme
 * Follows HERA DNA patterns from services/products
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Loader2, User, Mail, Phone, MapPin, Calendar, Star, FileText } from 'lucide-react'
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
      setFormData({
        name: customer.entity_name || '',
        email: customer.dynamic_fields?.email?.value || customer.email || '',
        phone: customer.dynamic_fields?.phone?.value || customer.phone || '',
        address: '',
        birthday: customer.dynamic_fields?.birthday?.value || customer.birthday || '',
        notes: customer.dynamic_fields?.notes?.value || customer.notes || '',
        vip: customer.dynamic_fields?.vip?.value || customer.vip || false,
        loyalty_points:
          customer.dynamic_fields?.loyalty_points?.value || customer.loyalty_points || 0
      })
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

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format'
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: COLORS.charcoal,
          border: `1px solid ${COLORS.gold}40`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${COLORS.gold}15`
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-2xl font-bold flex items-center gap-3"
            style={{ color: COLORS.champagne }}
          >
            <div
              className="p-2 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}15 100%)`,
                border: `1px solid ${COLORS.gold}50`
              }}
            >
              <User className="h-5 w-5" style={{ color: COLORS.gold }} />
            </div>
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
          <DialogDescription style={{ color: COLORS.bronze }}>
            {customer
              ? 'Update customer information and preferences'
              : 'Create a new customer profile with contact details'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Customer Name - Required */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-medium"
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
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter customer name"
                className="pl-10 transition-all duration-300"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${errors.name ? COLORS.rose : COLORS.bronze}40`,
                  color: COLORS.lightText
                }}
                required
              />
            </div>
            {errors.name && (
              <p className="text-xs" style={{ color: COLORS.rose }}>
                {errors.name}
              </p>
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
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
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
                <p className="text-xs" style={{ color: COLORS.rose }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
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
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+971 XX XXX XXXX"
                  className="pl-10 transition-all duration-300"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    border: `1px solid ${errors.phone ? COLORS.rose : COLORS.bronze}40`,
                    color: COLORS.lightText
                  }}
                />
              </div>
              {errors.phone && (
                <p className="text-xs" style={{ color: COLORS.rose }}>
                  {errors.phone}
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
                className="pl-10 transition-all duration-300"
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
                className="pl-10 transition-all duration-300"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${COLORS.bronze}40`,
                  color: COLORS.lightText
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="flex justify-end gap-3 pt-4 border-t"
            style={{ borderColor: COLORS.bronze + '30' }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
              className="transition-all duration-300"
              style={{
                color: COLORS.lightText,
                border: `1px solid ${COLORS.bronze}40`
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || isLoading}
              className="transition-all duration-300 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                color: COLORS.charcoalDark,
                fontWeight: 600,
                boxShadow: `0 4px 20px ${COLORS.gold}30`
              }}
            >
              {submitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {customer ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{customer ? 'Update Customer' : 'Add Customer'}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
