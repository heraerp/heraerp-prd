// HERA Universal Calendar Smart Code Service
// Handles smart code generation, validation, and classification for calendar entities

import { CalendarSmartCodes, UniversalResource, UniversalAppointment } from '@/types/calendar.types'

export class CalendarSmartCodeService {
  // Smart Code Pattern: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{OBJECT}.{STATUS}.v{VERSION}

  /**
   * Generate Smart Code for Calendar Resources
   */
  generateResourceSmartCode(industry: string, resourceType: string, status: string = 'v1'): string {
    const industryCode = this.getIndustryCode(industry)
    const resourceTypeCode = this.getResourceTypeCode(resourceType)

    return `HERA.${industryCode}.CRM.RES.${resourceTypeCode}.${status}`
  }

  /**
   * Generate Smart Code for Appointment Transactions
   */
  generateAppointmentSmartCode(
    industry: string,
    appointmentType: string,
    status: string = 'v1'
  ): string {
    const industryCode = this.getIndustryCode(industry)
    const appointmentTypeCode = this.getAppointmentTypeCode(appointmentType)

    return `HERA.${industryCode}.CRM.TXN.${appointmentTypeCode}.${status}`
  }

  /**
   * Generate Smart Code for Calendar Events
   */
  generateCalendarEventSmartCode(
    eventStatus: 'draft' | 'ai_enhanced' | 'human_reviewed' | 'production'
  ): string {
    const statusCode = this.getEventStatusCode(eventStatus)
    return `HERA.CRM.CAL.ENT.EVENT.${statusCode}`
  }

  /**
   * Generate Smart Code for Resource Allocation Lines
   */
  generateAllocationSmartCode(
    industry: string,
    allocationType: string,
    status: string = 'v1'
  ): string {
    const industryCode = this.getIndustryCode(industry)
    return `HERA.${industryCode}.CRM.LIN.${allocationType.toUpperCase()}.${status}`
  }

  /**
   * Validate Smart Code Format
   */
  validateSmartCode(smartCode: string): {
    isValid: boolean
    parts: {
      prefix: string
      industry: string
      module: string
      type: string
      object: string
      status: string
    } | null
    errors: string[]
  } {
    const errors: string[] = []
    const parts = smartCode.split('.')

    if (parts.length < 6) {
      errors.push('Smart code must have at least 6 parts separated by dots')
      return { isValid: false, parts: null, errors }
    }

    if (parts[0] !== 'HERA') {
      errors.push('Smart code must start with HERA')
    }

    const validIndustries = ['HLTH', 'REST', 'PROF', 'MFG', 'CRM', 'UNI']
    if (!validIndustries.includes(parts[1])) {
      errors.push(`Invalid industry code: ${parts[1]}. Valid codes: ${validIndustries.join(', ')}`)
    }

    if (parts[2] !== 'CRM' && parts[2] !== 'CAL') {
      errors.push(`Invalid module code: ${parts[2]}. Expected CRM or CAL for calendar system`)
    }

    return {
      isValid: errors.length === 0,
      parts: {
        prefix: parts[0],
        industry: parts[1],
        module: parts[2],
        type: parts[3],
        object: parts[4],
        status: parts[5]
      },
      errors
    }
  }

  /**
   * Get Industry-Specific Smart Code Patterns
   */
  getIndustrySmartCodes(industry: string): Record<string, string> {
    const basePatterns = {
      // Universal Resource Types
      STAFF: this.generateResourceSmartCode(industry, 'STAFF'),
      EQUIPMENT: this.generateResourceSmartCode(industry, 'EQUIPMENT'),
      ROOM: this.generateResourceSmartCode(industry, 'ROOM'),
      VEHICLE: this.generateResourceSmartCode(industry, 'VEHICLE'),
      VIRTUAL: this.generateResourceSmartCode(industry, 'VIRTUAL'),

      // Universal Appointment Types
      APPOINTMENT: this.generateAppointmentSmartCode(industry, 'APPOINTMENT'),
      MEETING: this.generateAppointmentSmartCode(industry, 'MEETING'),
      MAINTENANCE: this.generateAppointmentSmartCode(industry, 'MAINTENANCE'),
      CONSULTATION: this.generateAppointmentSmartCode(industry, 'CONSULTATION'),

      // Calendar Events
      EVENT_DRAFT: this.generateCalendarEventSmartCode('draft'),
      EVENT_AI_ENHANCED: this.generateCalendarEventSmartCode('ai_enhanced'),
      EVENT_REVIEWED: this.generateCalendarEventSmartCode('human_reviewed'),
      EVENT_PRODUCTION: this.generateCalendarEventSmartCode('production')
    }

    // Industry-specific extensions
    switch (industry.toLowerCase()) {
      case 'healthcare':
        return {
          ...basePatterns,
          PATIENT_APPOINTMENT: 'HERA.HLTH.CRM.TXN.APPT.v1',
          SURGERY_BOOKING: 'HERA.HLTH.CRM.TXN.SURG.v1',
          EQUIPMENT_MAINTENANCE: 'HERA.HLTH.CRM.TXN.MAINT.v1',
          DOCTOR: 'HERA.HLTH.CRM.RES.DOCTOR.v1',
          NURSE: 'HERA.HLTH.CRM.RES.NURSE.v1',
          MEDICAL_EQUIPMENT: 'HERA.HLTH.CRM.RES.MEDEQUIP.v1',
          EXAMINATION_ROOM: 'HERA.HLTH.CRM.RES.EXAMROOM.v1',
          OPERATING_ROOM: 'HERA.HLTH.CRM.RES.OPROOM.v1'
        }

      case 'restaurant':
        return {
          ...basePatterns,
          TABLE_RESERVATION: 'HERA.REST.CRM.TXN.RESV.v1',
          EVENT_BOOKING: 'HERA.REST.CRM.TXN.EVENT.v1',
          CATERING_ORDER: 'HERA.REST.CRM.TXN.CATER.v1',
          DINING_TABLE: 'HERA.REST.CRM.RES.TABLE.v1',
          PRIVATE_ROOM: 'HERA.REST.CRM.RES.PRIVROOM.v1',
          KITCHEN_STATION: 'HERA.REST.CRM.RES.KITCHEN.v1',
          SERVER: 'HERA.REST.CRM.RES.SERVER.v1',
          CHEF: 'HERA.REST.CRM.RES.CHEF.v1',
          BAR_STATION: 'HERA.REST.CRM.RES.BAR.v1'
        }

      case 'professional':
        return {
          ...basePatterns,
          CLIENT_MEETING: 'HERA.PROF.CRM.TXN.MEET.v1',
          CONSULTATION: 'HERA.PROF.CRM.TXN.CONSULT.v1',
          PROJECT_REVIEW: 'HERA.PROF.CRM.TXN.REVIEW.v1',
          CONSULTANT: 'HERA.PROF.CRM.RES.CONSULT.v1',
          CONFERENCE_ROOM: 'HERA.PROF.CRM.RES.CONFROOM.v1',
          VIDEO_CALL_ROOM: 'HERA.PROF.CRM.RES.VIRTUAL.v1',
          PRESENTATION_ROOM: 'HERA.PROF.CRM.RES.PRESROOM.v1'
        }

      case 'manufacturing':
        return {
          ...basePatterns,
          EQUIPMENT_MAINTENANCE: 'HERA.MFG.CRM.TXN.MAINT.v1',
          PRODUCTION_SCHEDULE: 'HERA.MFG.CRM.TXN.PROD.v1',
          QUALITY_INSPECTION: 'HERA.MFG.CRM.TXN.QC.v1',
          PRODUCTION_LINE: 'HERA.MFG.CRM.RES.LINE.v1',
          MACHINE: 'HERA.MFG.CRM.RES.MACHINE.v1',
          OPERATOR: 'HERA.MFG.CRM.RES.OPERATOR.v1',
          TECHNICIAN: 'HERA.MFG.CRM.RES.TECH.v1',
          QUALITY_STATION: 'HERA.MFG.CRM.RES.QC.v1'
        }

      default:
        return basePatterns
    }
  }

  /**
   * Auto-classify Resource Based on Name and Context
   */
  autoClassifyResource(
    resourceName: string,
    industry: string,
    context?: Record<string, any>
  ): {
    suggestedType: string
    confidence: number
    smartCode: string
    reasoning: string
  } {
    const name = resourceName.toLowerCase()
    const industrySmartCodes = this.getIndustrySmartCodes(industry)

    // Healthcare classification
    if (industry === 'healthcare') {
      if (name.includes('doctor') || name.includes('physician') || name.includes('md')) {
        return {
          suggestedType: 'DOCTOR',
          confidence: 0.95,
          smartCode: industrySmartCodes.DOCTOR,
          reasoning: 'Name contains medical professional indicators'
        }
      }
      if (name.includes('nurse') || name.includes('rn')) {
        return {
          suggestedType: 'NURSE',
          confidence: 0.9,
          smartCode: industrySmartCodes.NURSE,
          reasoning: 'Name contains nursing professional indicators'
        }
      }
      if (name.includes('room') && (name.includes('exam') || name.includes('patient'))) {
        return {
          suggestedType: 'EXAMINATION_ROOM',
          confidence: 0.85,
          smartCode: industrySmartCodes.EXAMINATION_ROOM,
          reasoning: 'Name indicates medical examination space'
        }
      }
    }

    // Restaurant classification
    if (industry === 'restaurant') {
      if (name.includes('table') && /\d/.test(name)) {
        return {
          suggestedType: 'DINING_TABLE',
          confidence: 0.95,
          smartCode: industrySmartCodes.DINING_TABLE,
          reasoning: 'Name contains table with number identifier'
        }
      }
      if (name.includes('chef') || name.includes('cook')) {
        return {
          suggestedType: 'CHEF',
          confidence: 0.9,
          smartCode: industrySmartCodes.CHEF,
          reasoning: 'Name contains culinary professional indicators'
        }
      }
      if (name.includes('server') || name.includes('waiter') || name.includes('waitress')) {
        return {
          suggestedType: 'SERVER',
          confidence: 0.9,
          smartCode: industrySmartCodes.SERVER,
          reasoning: 'Name contains service professional indicators'
        }
      }
    }

    // Professional services classification
    if (industry === 'professional') {
      if (name.includes('consultant') || name.includes('advisor')) {
        return {
          suggestedType: 'CONSULTANT',
          confidence: 0.9,
          smartCode: industrySmartCodes.CONSULTANT,
          reasoning: 'Name contains professional service indicators'
        }
      }
      if (name.includes('conference') || name.includes('meeting')) {
        return {
          suggestedType: 'CONFERENCE_ROOM',
          confidence: 0.85,
          smartCode: industrySmartCodes.CONFERENCE_ROOM,
          reasoning: 'Name indicates meeting/conference space'
        }
      }
    }

    // Manufacturing classification
    if (industry === 'manufacturing') {
      if (name.includes('line') || name.includes('assembly')) {
        return {
          suggestedType: 'PRODUCTION_LINE',
          confidence: 0.9,
          smartCode: industrySmartCodes.PRODUCTION_LINE,
          reasoning: 'Name indicates production/assembly line'
        }
      }
      if (name.includes('machine') || name.includes('equipment')) {
        return {
          suggestedType: 'MACHINE',
          confidence: 0.85,
          smartCode: industrySmartCodes.MACHINE,
          reasoning: 'Name contains machinery indicators'
        }
      }
    }

    // Generic classification fallback
    if (name.includes('room') || name.includes('space')) {
      return {
        suggestedType: 'ROOM',
        confidence: 0.7,
        smartCode: this.generateResourceSmartCode(industry, 'ROOM'),
        reasoning: 'Generic room/space classification'
      }
    }

    if (name.includes('equipment') || name.includes('device') || name.includes('tool')) {
      return {
        suggestedType: 'EQUIPMENT',
        confidence: 0.7,
        smartCode: this.generateResourceSmartCode(industry, 'EQUIPMENT'),
        reasoning: 'Generic equipment classification'
      }
    }

    // Default to staff if no other classification matches
    return {
      suggestedType: 'STAFF',
      confidence: 0.5,
      smartCode: this.generateResourceSmartCode(industry, 'STAFF'),
      reasoning: 'Default staff classification - manual review recommended'
    }
  }

  /**
   * Auto-classify Appointment Based on Context
   */
  autoClassifyAppointment(
    appointmentTitle: string,
    industry: string,
    context?: Record<string, any>
  ): {
    suggestedType: string
    confidence: number
    smartCode: string
    reasoning: string
  } {
    const title = appointmentTitle.toLowerCase()
    const industrySmartCodes = this.getIndustrySmartCodes(industry)

    // Healthcare appointments
    if (industry === 'healthcare') {
      if (title.includes('surgery') || title.includes('operation')) {
        return {
          suggestedType: 'SURGERY_BOOKING',
          confidence: 0.95,
          smartCode: industrySmartCodes.SURGERY_BOOKING,
          reasoning: 'Title indicates surgical procedure'
        }
      }
      if (title.includes('consultation') || title.includes('checkup') || title.includes('visit')) {
        return {
          suggestedType: 'PATIENT_APPOINTMENT',
          confidence: 0.9,
          smartCode: industrySmartCodes.PATIENT_APPOINTMENT,
          reasoning: 'Title indicates patient consultation'
        }
      }
    }

    // Restaurant appointments
    if (industry === 'restaurant') {
      if (title.includes('reservation') || title.includes('table') || title.includes('dinner')) {
        return {
          suggestedType: 'TABLE_RESERVATION',
          confidence: 0.95,
          smartCode: industrySmartCodes.TABLE_RESERVATION,
          reasoning: 'Title indicates dining reservation'
        }
      }
      if (title.includes('event') || title.includes('party') || title.includes('celebration')) {
        return {
          suggestedType: 'EVENT_BOOKING',
          confidence: 0.85,
          smartCode: industrySmartCodes.EVENT_BOOKING,
          reasoning: 'Title indicates special event booking'
        }
      }
    }

    // Professional services appointments
    if (industry === 'professional') {
      if (title.includes('meeting') || title.includes('discussion') || title.includes('review')) {
        return {
          suggestedType: 'CLIENT_MEETING',
          confidence: 0.9,
          smartCode: industrySmartCodes.CLIENT_MEETING,
          reasoning: 'Title indicates client meeting'
        }
      }
      if (
        title.includes('consultation') ||
        title.includes('advice') ||
        title.includes('strategy')
      ) {
        return {
          suggestedType: 'CONSULTATION',
          confidence: 0.85,
          smartCode: industrySmartCodes.CONSULTATION,
          reasoning: 'Title indicates professional consultation'
        }
      }
    }

    // Manufacturing appointments
    if (industry === 'manufacturing') {
      if (title.includes('maintenance') || title.includes('repair') || title.includes('service')) {
        return {
          suggestedType: 'EQUIPMENT_MAINTENANCE',
          confidence: 0.95,
          smartCode: industrySmartCodes.EQUIPMENT_MAINTENANCE,
          reasoning: 'Title indicates equipment maintenance'
        }
      }
      if (title.includes('inspection') || title.includes('quality') || title.includes('check')) {
        return {
          suggestedType: 'QUALITY_INSPECTION',
          confidence: 0.9,
          smartCode: industrySmartCodes.QUALITY_INSPECTION,
          reasoning: 'Title indicates quality control activity'
        }
      }
    }

    // Default classification
    return {
      suggestedType: 'APPOINTMENT',
      confidence: 0.6,
      smartCode: this.generateAppointmentSmartCode(industry, 'APPOINTMENT'),
      reasoning: 'Generic appointment classification'
    }
  }

  // Private helper methods
  private getIndustryCode(industry: string): string {
    const industryMap: Record<string, string> = {
      healthcare: 'HLTH',
      restaurant: 'REST',
      professional: 'PROF',
      manufacturing: 'MFG',
      universal: 'UNI'
    }
    return industryMap[industry.toLowerCase()] || 'UNI'
  }

  private getResourceTypeCode(resourceType: string): string {
    const typeMap: Record<string, string> = {
      STAFF: 'STAFF',
      EQUIPMENT: 'EQUIP',
      ROOM: 'ROOM',
      VEHICLE: 'VEHICLE',
      VIRTUAL: 'VIRTUAL',
      DOCTOR: 'DOCTOR',
      NURSE: 'NURSE',
      TABLE: 'TABLE',
      KITCHEN: 'KITCHEN',
      MACHINE: 'MACHINE',
      LINE: 'LINE'
    }
    return typeMap[resourceType.toUpperCase()] || resourceType.toUpperCase()
  }

  private getAppointmentTypeCode(appointmentType: string): string {
    const typeMap: Record<string, string> = {
      APPOINTMENT: 'APPT',
      RESERVATION: 'RESV',
      MEETING: 'MEET',
      MAINTENANCE: 'MAINT',
      CONSULTATION: 'CONSULT',
      SURGERY: 'SURG',
      EVENT: 'EVENT',
      INSPECTION: 'QC'
    }
    return typeMap[appointmentType.toUpperCase()] || appointmentType.substring(0, 6).toUpperCase()
  }

  private getEventStatusCode(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'DRAFT',
      ai_enhanced: 'AI.HIGH',
      human_reviewed: 'HR.v1',
      production: 'PROD.v1'
    }
    return statusMap[status] || 'DRAFT'
  }
}

// Singleton instance
export const calendarSmartCodeService = new CalendarSmartCodeService()
