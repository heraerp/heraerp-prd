// HERA Universal Calendar - Industry Configuration API
// Provides industry-specific calendar configurations

import { NextRequest, NextResponse } from 'next/server'
import { IndustryCalendarConfig } from '@/src/types/calendar.types'

// Industry configurations for different business types
const INDUSTRY_CONFIGS: Record<string, IndustryCalendarConfig> = {
  healthcare: {
    industry: 'healthcare',
    resource_types: ['STAFF', 'EQUIPMENT', 'ROOM'],
    appointment_types: [
      'consultation',
      'examination',
      'surgery',
      'follow_up',
      'emergency',
      'vaccination'
    ],
    default_duration: 30,
    business_hours: {
      start: '08:00',
      end: '18:00',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    },
    booking_rules: {
      advance_booking_days: 90,
      cancellation_hours: 24,
      preparation_minutes: 10,
      cleanup_minutes: 5
    },
    required_fields: ['title', 'start_time', 'end_time', 'appointment_type'],
    optional_fields: ['description', 'notes', 'patient_name', 'procedure_type', 'insurance_info']
  },

  restaurant: {
    industry: 'restaurant',
    resource_types: ['ROOM', 'STAFF', 'EQUIPMENT'],
    appointment_types: ['reservation', 'event', 'private_dining', 'catering', 'tasting'],
    default_duration: 90,
    business_hours: {
      start: '11:00',
      end: '23:00',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    },
    booking_rules: {
      advance_booking_days: 60,
      cancellation_hours: 4,
      preparation_minutes: 10,
      cleanup_minutes: 15
    },
    required_fields: ['title', 'start_time', 'end_time', 'party_size'],
    optional_fields: [
      'description',
      'notes',
      'special_requests',
      'occasion',
      'dietary_restrictions'
    ]
  },

  professional: {
    industry: 'professional',
    resource_types: ['STAFF', 'ROOM', 'VIRTUAL', 'EQUIPMENT'],
    appointment_types: [
      'meeting',
      'consultation',
      'presentation',
      'workshop',
      'interview',
      'training'
    ],
    default_duration: 60,
    business_hours: {
      start: '08:00',
      end: '18:00',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    booking_rules: {
      advance_booking_days: 90,
      cancellation_hours: 24,
      preparation_minutes: 15,
      cleanup_minutes: 10
    },
    required_fields: ['title', 'start_time', 'end_time', 'client_name'],
    optional_fields: ['description', 'notes', 'meeting_type', 'project_reference', 'agenda']
  },

  manufacturing: {
    industry: 'manufacturing',
    resource_types: ['EQUIPMENT', 'STAFF', 'ROOM'],
    appointment_types: [
      'maintenance',
      'production',
      'inspection',
      'calibration',
      'repair',
      'training'
    ],
    default_duration: 120,
    business_hours: {
      start: '06:00',
      end: '22:00',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    },
    booking_rules: {
      advance_booking_days: 30,
      cancellation_hours: 8,
      preparation_minutes: 30,
      cleanup_minutes: 20
    },
    required_fields: ['title', 'start_time', 'end_time', 'work_order'],
    optional_fields: [
      'description',
      'notes',
      'maintenance_type',
      'technician_notes',
      'parts_required'
    ]
  },

  retail: {
    industry: 'retail',
    resource_types: ['STAFF', 'ROOM', 'EQUIPMENT'],
    appointment_types: ['consultation', 'fitting', 'pickup', 'delivery', 'installation', 'repair'],
    default_duration: 45,
    business_hours: {
      start: '09:00',
      end: '21:00',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    },
    booking_rules: {
      advance_booking_days: 30,
      cancellation_hours: 24,
      preparation_minutes: 5,
      cleanup_minutes: 10
    },
    required_fields: ['title', 'start_time', 'end_time', 'service_type'],
    optional_fields: ['description', 'notes', 'customer_preferences', 'product_details']
  },

  education: {
    industry: 'education',
    resource_types: ['STAFF', 'ROOM', 'EQUIPMENT', 'VIRTUAL'],
    appointment_types: ['class', 'tutoring', 'meeting', 'exam', 'presentation', 'workshop'],
    default_duration: 50,
    business_hours: {
      start: '08:00',
      end: '17:00',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    booking_rules: {
      advance_booking_days: 365,
      cancellation_hours: 24,
      preparation_minutes: 10,
      cleanup_minutes: 5
    },
    required_fields: ['title', 'start_time', 'end_time', 'subject'],
    optional_fields: ['description', 'notes', 'course_code', 'instructor', 'student_capacity']
  },

  fitness: {
    industry: 'fitness',
    resource_types: ['STAFF', 'EQUIPMENT', 'ROOM'],
    appointment_types: [
      'training',
      'class',
      'assessment',
      'consultation',
      'therapy',
      'maintenance'
    ],
    default_duration: 60,
    business_hours: {
      start: '05:00',
      end: '23:00',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    },
    booking_rules: {
      advance_booking_days: 30,
      cancellation_hours: 12,
      preparation_minutes: 5,
      cleanup_minutes: 10
    },
    required_fields: ['title', 'start_time', 'end_time', 'activity_type'],
    optional_fields: [
      'description',
      'notes',
      'fitness_level',
      'special_requirements',
      'equipment_needed'
    ]
  },

  legal: {
    industry: 'legal',
    resource_types: ['STAFF', 'ROOM', 'VIRTUAL'],
    appointment_types: ['consultation', 'deposition', 'hearing', 'mediation', 'meeting', 'court'],
    default_duration: 60,
    business_hours: {
      start: '08:00',
      end: '18:00',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    booking_rules: {
      advance_booking_days: 180,
      cancellation_hours: 48,
      preparation_minutes: 30,
      cleanup_minutes: 15
    },
    required_fields: ['title', 'start_time', 'end_time', 'case_type'],
    optional_fields: ['description', 'notes', 'case_number', 'client_name', 'opposing_party']
  },

  automotive: {
    industry: 'automotive',
    resource_types: ['STAFF', 'EQUIPMENT', 'ROOM'],
    appointment_types: [
      'service',
      'repair',
      'inspection',
      'installation',
      'consultation',
      'pickup'
    ],
    default_duration: 120,
    business_hours: {
      start: '07:00',
      end: '19:00',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    },
    booking_rules: {
      advance_booking_days: 30,
      cancellation_hours: 24,
      preparation_minutes: 15,
      cleanup_minutes: 10
    },
    required_fields: ['title', 'start_time', 'end_time', 'vehicle_info'],
    optional_fields: ['description', 'notes', 'service_type', 'parts_needed', 'customer_concerns']
  },

  beauty: {
    industry: 'beauty',
    resource_types: ['STAFF', 'EQUIPMENT', 'ROOM'],
    appointment_types: ['haircut', 'styling', 'coloring', 'facial', 'massage', 'consultation'],
    default_duration: 90,
    business_hours: {
      start: '09:00',
      end: '20:00',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    },
    booking_rules: {
      advance_booking_days: 60,
      cancellation_hours: 24,
      preparation_minutes: 10,
      cleanup_minutes: 15
    },
    required_fields: ['title', 'start_time', 'end_time', 'service_type'],
    optional_fields: [
      'description',
      'notes',
      'stylist_preference',
      'color_preferences',
      'allergies'
    ]
  },

  universal: {
    industry: 'universal',
    resource_types: ['STAFF', 'EQUIPMENT', 'ROOM', 'VEHICLE', 'VIRTUAL'],
    appointment_types: [
      'appointment',
      'meeting',
      'consultation',
      'service',
      'maintenance',
      'event'
    ],
    default_duration: 60,
    business_hours: {
      start: '09:00',
      end: '17:00',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI']
    },
    booking_rules: {
      advance_booking_days: 30,
      cancellation_hours: 24,
      preparation_minutes: 10,
      cleanup_minutes: 10
    },
    required_fields: ['title', 'start_time', 'end_time'],
    optional_fields: ['description', 'notes', 'priority', 'status']
  }
}

// GET /api/v1/calendar/config/industry/[industry]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ industry: string }> }
) {
  try {
    const { industry: industryParam } = await params
    const industry = industryParam.toLowerCase()

    const config = INDUSTRY_CONFIGS[industry]

    if (!config) {
      // Return universal config as fallback
      return NextResponse.json(INDUSTRY_CONFIGS.universal)
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching industry config:', error)
    return NextResponse.json({ error: 'Failed to fetch industry configuration' }, { status: 500 })
  }
}

// Helper to get all configurations
function getAllConfigs() {
  return INDUSTRY_CONFIGS
}

// Helper function to get industry-specific validation rules
function getIndustryValidationRules(industry: string) {
  const config = INDUSTRY_CONFIGS[industry.toLowerCase()] || INDUSTRY_CONFIGS.universal

  return {
    required_fields: config.required_fields,
    optional_fields: config.optional_fields,
    appointment_types: config.appointment_types,
    resource_types: config.resource_types,
    booking_rules: config.booking_rules,
    business_hours: config.business_hours
  }
}

// Helper function to validate appointment data against industry rules
function validateAppointmentForIndustry(
  appointmentData: any,
  industry: string
): { isValid: boolean; errors: string[] } {
  const rules = getIndustryValidationRules(industry)
  const errors: string[] = []

  // Check required fields
  rules.required_fields.forEach(field => {
    if (!appointmentData[field] && !appointmentData.industry_data?.[field]) {
      errors.push(`${field.replace('_', ' ')} is required for ${industry} appointments`)
    }
  })

  // Validate appointment type
  if (
    appointmentData.appointment_type &&
    !rules.appointment_types.includes(appointmentData.appointment_type)
  ) {
    errors.push(
      `Invalid appointment type for ${industry}. Valid types: ${rules.appointment_types.join(', ')}`
    )
  }

  // Validate booking rules
  if (appointmentData.start_time) {
    const appointmentDate = new Date(appointmentData.start_time)
    const now = new Date()
    const daysInAdvance = Math.ceil(
      (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysInAdvance > rules.booking_rules.advance_booking_days) {
      errors.push(
        `Cannot book more than ${rules.booking_rules.advance_booking_days} days in advance`
      )
    }

    if (daysInAdvance < 0) {
      errors.push('Cannot book appointments in the past')
    }
  }

  // Validate business hours
  if (appointmentData.start_time && appointmentData.end_time) {
    const startTime = new Date(appointmentData.start_time)
    const endTime = new Date(appointmentData.end_time)
    const dayOfWeek = startTime.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()

    if (!rules.business_hours.days.includes(dayOfWeek)) {
      errors.push(`${industry} is not open on ${dayOfWeek}`)
    }

    const startHour = startTime.toTimeString().substring(0, 5)
    const endHour = endTime.toTimeString().substring(0, 5)

    if (startHour < rules.business_hours.start || endHour > rules.business_hours.end) {
      errors.push(
        `Appointment must be within business hours: ${rules.business_hours.start} - ${rules.business_hours.end}`
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
