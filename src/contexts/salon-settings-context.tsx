'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

// Default organization ID for development
const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

interface SalonSettings {
  business_info: {
    name: string
    type: string
    address: string
    phone: string
    email: string
    website?: string
    tax_id?: string
    registration_number?: string
  }
  business_hours: {
    [key: string]: {
      open: string
      close: string
      closed: boolean
    }
  }
  appointment_settings: {
    default_duration: number
    buffer_time: number
    max_advance_booking: number
    allow_online_booking: boolean
    require_deposit: boolean
    deposit_amount: number
    cancellation_policy: string
    reminder_timing: {
      email: number
      sms: number
    }
  }
  payment_settings: {
    accepted_methods: {
      cash: boolean
      credit_card: boolean
      debit_card: boolean
      digital_wallet: boolean
      gift_card: boolean
      bank_transfer: boolean
    }
    tip_suggestions: number[]
    tax_rate: number
    loyalty_program_active: boolean
    points_per_currency: number
    currency: string
  }
  notification_settings: {
    email: {
      appointment_confirmations: boolean
      appointment_reminders: boolean
      birthday_offers: boolean
      promotional_emails: boolean
      loyalty_updates: boolean
    }
    sms: {
      appointment_reminders: boolean
      confirmation_requests: boolean
      promotional_sms: boolean
    }
  }
  staff_settings: {
    commission_structure: 'percentage' | 'fixed'
    default_commission_rate: number
    allow_schedule_management: boolean
    require_clock_in: boolean
    overtime_rate: number
  }
  system_settings: {
    timezone: string
    date_format: string
    time_format: string
    language: string
    theme: 'light' | 'dark'
    session_timeout: number
    require_password_change: boolean
    two_factor_auth: boolean
    data_backup_enabled: boolean
  }
}

interface SalonSettingsContextType {
  settings: SalonSettings | null
  loading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
  updateSettings: (settings: SalonSettings) => Promise<boolean>
  updateSettingsSection: (section: keyof SalonSettings, data: any) => Promise<boolean>
}

const SalonSettingsContext = createContext<SalonSettingsContextType | undefined>(undefined)

export const useSalonSettings = () => {
  const context = useContext(SalonSettingsContext)
  if (!context) {
    throw new Error('useSalonSettings must be used within a SalonSettingsProvider')
  }
  return context
}

interface SalonSettingsProviderProps {
  children: ReactNode
}

export function SalonSettingsProvider({ children }: SalonSettingsProviderProps) {
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID

  const [settings, setSettings] = useState<SalonSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    if (!organizationId || contextLoading) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/v1/salon/settings?organization_id=${organizationId}`)
      const data = await response.json()

      if (data.success) {
        setSettings(data.settings)
      } else {
        throw new Error(data.error || 'Failed to fetch settings')
      }
    } catch (err) {
      console.error('Error fetching salon settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: SalonSettings): Promise<boolean> => {
    try {
      const response = await fetch('/api/v1/salon/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          settings: newSettings
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      setSettings(data.settings)
      return true
    } catch (err) {
      console.error('Error updating salon settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to update settings')
      return false
    }
  }

  const updateSettingsSection = async (
    section: keyof SalonSettings,
    data: any
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/v1/salon/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          section,
          data
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings section')
      }

      setSettings(result.settings)
      return true
    } catch (err) {
      console.error('Error updating salon settings section:', err)
      setError(err instanceof Error ? err.message : 'Failed to update settings')
      return false
    }
  }

  useEffect(() => {
    if (organizationId && !contextLoading) {
      fetchSettings()
    }
  }, [organizationId, contextLoading])

  return (
    <SalonSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refreshSettings: fetchSettings,
        updateSettings,
        updateSettingsSection
      }}
    >
      {children}
    </SalonSettingsContext.Provider>
  )
}
