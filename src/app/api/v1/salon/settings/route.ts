import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withErrorHandler } from '@/lib/api-error-handler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

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

const DEFAULT_SETTINGS: SalonSettings = {
  business_info: {
    name: 'Dubai Luxury Salon & Spa',
    type: 'Full Service Salon & Spa',
    address: 'Dubai Marina, Dubai, UAE',
    phone: '+971 4 123 4567',
    email: 'info@dubailuxurysalon.ae',
    website: 'https://dubailuxurysalon.ae',
    tax_id: '',
    registration_number: ''
  },
  business_hours: {
    monday: { open: '09:00', close: '21:00', closed: false },
    tuesday: { open: '09:00', close: '21:00', closed: false },
    wednesday: { open: '09:00', close: '21:00', closed: false },
    thursday: { open: '09:00', close: '22:00', closed: false },
    friday: { open: '10:00', close: '22:00', closed: false },
    saturday: { open: '09:00', close: '22:00', closed: false },
    sunday: { open: '10:00', close: '20:00', closed: false }
  },
  appointment_settings: {
    default_duration: 60,
    buffer_time: 15,
    max_advance_booking: 90,
    allow_online_booking: true,
    require_deposit: false,
    deposit_amount: 100,
    cancellation_policy: '24 hours advance notice required for cancellation',
    reminder_timing: {
      email: 24,
      sms: 2
    }
  },
  payment_settings: {
    accepted_methods: {
      cash: true,
      credit_card: true,
      debit_card: true,
      digital_wallet: true,
      gift_card: true,
      bank_transfer: false
    },
    tip_suggestions: [10, 15, 20, 25],
    tax_rate: 5.0,
    loyalty_program_active: true,
    points_per_currency: 1,
    currency: 'AED'
  },
  notification_settings: {
    email: {
      appointment_confirmations: true,
      appointment_reminders: true,
      birthday_offers: true,
      promotional_emails: false,
      loyalty_updates: true
    },
    sms: {
      appointment_reminders: true,
      confirmation_requests: false,
      promotional_sms: false
    }
  },
  staff_settings: {
    commission_structure: 'percentage',
    default_commission_rate: 40,
    allow_schedule_management: true,
    require_clock_in: false,
    overtime_rate: 1.5
  },
  system_settings: {
    timezone: 'Asia/Dubai',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    language: 'en',
    theme: 'light',
    session_timeout: 30,
    require_password_change: false,
    two_factor_auth: false,
    data_backup_enabled: true
  }
}

// GET: Fetch salon settings
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')

  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: 'Organization ID is required' },
      { status: 400 }
    )
  }

  try {
    // Check if settings exist for this organization
    const { data: existingSettings, error: fetchError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'salon_settings')
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw fetchError
    }

    let settings: SalonSettings

    if (existingSettings && existingSettings.metadata) {
      // Return existing settings
      settings = existingSettings.metadata as SalonSettings
    } else {
      // Create default settings if none exist
      const { data: newSettings, error: createError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'salon_settings',
          entity_name: 'Salon Configuration Settings',
          entity_code: `SETTINGS-${organizationId}`,
          smart_code: 'HERA.SALON.SETTINGS.CONFIG.v1',
          metadata: DEFAULT_SETTINGS
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      settings = DEFAULT_SETTINGS
    }

    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error('Error fetching salon settings:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
  }
})

// PUT: Update salon settings
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { organizationId, settings } = body

  if (!organizationId || !settings) {
    return NextResponse.json(
      { success: false, error: 'Organization ID and settings are required' },
      { status: 400 }
    )
  }

  try {
    // Update settings
    const { data, error } = await supabase
      .from('core_entities')
      .update({
        metadata: settings,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('entity_type', 'salon_settings')
      .select()
      .single()

    if (error) {
      // If update fails, might need to create
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: createError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: organizationId,
            entity_type: 'salon_settings',
            entity_name: 'Salon Configuration Settings',
            entity_code: `SETTINGS-${organizationId}`,
            smart_code: 'HERA.SALON.SETTINGS.CONFIG.v1',
            metadata: settings
          })
          .select()
          .single()

        if (createError) {
          throw createError
        }

        return NextResponse.json({
          success: true,
          settings: newSettings.metadata,
          message: 'Settings created successfully'
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      settings: data.metadata,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating salon settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
})

// PATCH: Update specific section of settings
export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { organizationId, section, data } = body

  if (!organizationId || !section || !data) {
    return NextResponse.json(
      { success: false, error: 'Organization ID, section, and data are required' },
      { status: 400 }
    )
  }

  try {
    // Fetch current settings
    const { data: currentSettings, error: fetchError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'salon_settings')
      .single()

    if (fetchError) {
      throw fetchError
    }

    // Update specific section
    const updatedSettings = {
      ...currentSettings.metadata,
      [section]: data
    }

    // Save updated settings
    const { data: result, error: updateError } = await supabase
      .from('core_entities')
      .update({
        metadata: updatedSettings,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('entity_type', 'salon_settings')
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      settings: result.metadata,
      message: `${section} settings updated successfully`
    })
  } catch (error) {
    console.error('Error updating salon settings section:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings section' },
      { status: 500 }
    )
  }
})
