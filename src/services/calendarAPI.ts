// HERA Universal Calendar API Service
// Handles all calendar operations using HERA 6-table architecture

import {
  UniversalResource,
  UniversalAppointment,
  AppointmentLine,
  ResourceAvailability,
  SchedulingConflict,
  ResourceUtilization,
  CalendarAnalytics,
  IndustryCalendarConfig,
  CalendarSecurityContext
} from '@/types/calendar.types'
import { calendarSmartCodeService } from './calendarSmartCodeService'

export class CalendarAPI {
  private baseUrl: string
  private organizationId: string
  private securityContext: CalendarSecurityContext

  constructor(organizationId: string, securityContext: CalendarSecurityContext) {
    this.baseUrl = '/api/v1/calendar'
    this.organizationId = organizationId
    this.securityContext = securityContext
  }

  // ==================== RESOURCE MANAGEMENT ====================

  /**
   * Get all resources for organization
   * Maps to core_entities with entity_type='calendar_resource'
   */
  async getResources(filters?: {
    resource_type?: string
    industry_type?: string
    status?: string
    skills?: string[]
  }): Promise<UniversalResource[]> {
    const query = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query.append(key, value.join(','))
        } else if (value) {
          query.append(key, value)
        }
      })
    }

    const response = await fetch(`${this.baseUrl}/resources?${query}`, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch resources: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get single resource by ID
   */
  async getResource(resourceId: string): Promise<UniversalResource> {
    const response = await fetch(`${this.baseUrl}/resources/${resourceId}`, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch resource: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create new resource
   * Creates entry in core_entities + properties in core_dynamic_data
   */
  async createResource(resource: Partial<UniversalResource>): Promise<UniversalResource> {
    // Auto-generate smart code if not provided
    if (!resource.smart_code && resource.entity_name && resource.industry_type) {
      const classification = calendarSmartCodeService.autoClassifyResource(
        resource.entity_name,
        resource.industry_type
      )
      resource.smart_code = classification.smartCode
      resource.ai_confidence = classification.confidence
    }

    const response = await fetch(`${this.baseUrl}/resources`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...resource,
        organization_id: this.organizationId,
        entity_type: 'calendar_resource'
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to create resource: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update resource
   * Updates core_entities + core_dynamic_data
   */
  async updateResource(
    resourceId: string,
    updates: Partial<UniversalResource>
  ): Promise<UniversalResource> {
    const response = await fetch(`${this.baseUrl}/resources/${resourceId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error(`Failed to update resource: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Delete resource
   */
  async deleteResource(resourceId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/resources/${resourceId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to delete resource: ${response.statusText}`)
    }
  }

  // ==================== APPOINTMENT MANAGEMENT ====================

  /**
   * Get appointments
   * Maps to universal_transactions with transaction_type in ['appointment', 'reservation', 'booking']
   */
  async getAppointments(filters?: {
    start_date?: Date
    end_date?: Date
    resource_ids?: string[]
    status?: string[]
    appointment_type?: string
  }): Promise<UniversalAppointment[]> {
    const query = new URLSearchParams()
    if (filters) {
      if (filters.start_date) query.append('start_date', filters.start_date.toISOString())
      if (filters.end_date) query.append('end_date', filters.end_date.toISOString())
      if (filters.resource_ids) query.append('resource_ids', filters.resource_ids.join(','))
      if (filters.status) query.append('status', filters.status.join(','))
      if (filters.appointment_type) query.append('appointment_type', filters.appointment_type)
    }

    const response = await fetch(`${this.baseUrl}/appointments?${query}`, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get single appointment with resource allocations
   */
  async getAppointment(
    appointmentId: string
  ): Promise<UniversalAppointment & { resource_allocations: AppointmentLine[] }> {
    const response = await fetch(`${this.baseUrl}/appointments/${appointmentId}`, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch appointment: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create appointment with resource allocations
   * Creates universal_transactions + universal_transaction_lines
   */
  async createAppointment(
    appointment: Partial<UniversalAppointment>,
    resourceAllocations: Partial<AppointmentLine>[]
  ): Promise<UniversalAppointment> {
    // Auto-generate smart code if not provided
    if (!appointment.smart_code && appointment.title) {
      const classification = calendarSmartCodeService.autoClassifyAppointment(
        appointment.title,
        appointment.industry_data?.industry || 'universal'
      )
      appointment.smart_code = classification.smartCode
    }

    // Generate reference number if not provided
    if (!appointment.reference_number) {
      appointment.reference_number = this.generateReferenceNumber(
        appointment.transaction_type || 'appointment'
      )
    }

    const response = await fetch(`${this.baseUrl}/appointments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        appointment: {
          ...appointment,
          organization_id: this.organizationId
        },
        resource_allocations: resourceAllocations.map(allocation => ({
          ...allocation,
          line_type: 'resource_allocation',
          quantity: allocation.quantity || 1
        }))
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to create appointment: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update appointment
   */
  async updateAppointment(
    appointmentId: string,
    updates: Partial<UniversalAppointment>,
    resourceAllocations?: Partial<AppointmentLine>[]
  ): Promise<UniversalAppointment> {
    const response = await fetch(`${this.baseUrl}/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        appointment: updates,
        resource_allocations: resourceAllocations
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to update appointment: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string, reason?: string): Promise<UniversalAppointment> {
    const response = await fetch(`${this.baseUrl}/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    })

    if (!response.ok) {
      throw new Error(`Failed to cancel appointment: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(appointmentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to delete appointment: ${response.statusText}`)
    }
  }

  // ==================== AVAILABILITY & SCHEDULING ====================

  /**
   * Get resource availability for date range
   */
  async getResourceAvailability(
    resourceIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<ResourceAvailability[]> {
    const query = new URLSearchParams({
      resource_ids: resourceIds.join(','),
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    })

    const response = await fetch(`${this.baseUrl}/availability?${query}`, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch availability: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Find available time slots for appointment
   */
  async findAvailableSlots(
    duration: number,
    resourceRequirements: {
      resource_type?: string
      skills_required?: string[]
      capacity_needed?: number
    },
    startDate: Date,
    endDate: Date,
    preferences?: {
      preferred_times?: string[]
      avoid_times?: string[]
      preferred_resources?: string[]
    }
  ): Promise<{
    available_slots: Array<{
      start_time: Date
      end_time: Date
      available_resources: UniversalResource[]
      confidence_score: number
    }>
  }> {
    const response = await fetch(`${this.baseUrl}/find-slots`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        duration,
        resource_requirements: resourceRequirements,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        preferences
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to find available slots: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Check for scheduling conflicts
   */
  async checkConflicts(
    appointment: Partial<UniversalAppointment>,
    resourceAllocations: Partial<AppointmentLine>[]
  ): Promise<SchedulingConflict[]> {
    const response = await fetch(`${this.baseUrl}/check-conflicts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        appointment,
        resource_allocations: resourceAllocations
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to check conflicts: ${response.statusText}`)
    }

    return response.json()
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get resource utilization analytics
   */
  async getResourceUtilization(
    resourceIds: string[],
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'week'
  ): Promise<ResourceUtilization[]> {
    const query = new URLSearchParams({
      resource_ids: resourceIds.join(','),
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      group_by: groupBy
    })

    const response = await fetch(`${this.baseUrl}/analytics/utilization?${query}`, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch utilization analytics: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get comprehensive calendar analytics
   */
  async getCalendarAnalytics(
    startDate: Date,
    endDate: Date,
    includeIndustryBenchmarks: boolean = false
  ): Promise<CalendarAnalytics> {
    const query = new URLSearchParams({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      include_benchmarks: includeIndustryBenchmarks.toString()
    })

    const response = await fetch(`${this.baseUrl}/analytics/comprehensive?${query}`, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar analytics: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get industry-specific calendar configuration
   */
  async getIndustryConfig(industry: string): Promise<IndustryCalendarConfig> {
    const response = await fetch(`${this.baseUrl}/config/industry/${industry}`, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch industry config: ${response.statusText}`)
    }

    return response.json()
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk create appointments (for imports, recurring appointments, etc.)
   */
  async bulkCreateAppointments(
    appointments: Array<{
      appointment: Partial<UniversalAppointment>
      resource_allocations: Partial<AppointmentLine>[]
    }>
  ): Promise<{
    created: UniversalAppointment[]
    errors: Array<{ index: number; error: string }>
  }> {
    const response = await fetch(`${this.baseUrl}/appointments/bulk`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ appointments })
    })

    if (!response.ok) {
      throw new Error(`Failed to bulk create appointments: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Bulk update appointments
   */
  async bulkUpdateAppointments(
    updates: Array<{
      appointment_id: string
      updates: Partial<UniversalAppointment>
    }>
  ): Promise<{
    updated: UniversalAppointment[]
    errors: Array<{ appointment_id: string; error: string }>
  }> {
    const response = await fetch(`${this.baseUrl}/appointments/bulk-update`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ updates })
    })

    if (!response.ok) {
      throw new Error(`Failed to bulk update appointments: ${response.statusText}`)
    }

    return response.json()
  }

  // ==================== REAL-TIME UPDATES ====================

  /**
   * Subscribe to real-time calendar updates
   */
  subscribeToUpdates(
    filters: {
      resource_ids?: string[]
      appointment_types?: string[]
    },
    callback: (event: any) => void
  ): () => void {
    // Implementation would use WebSocket or Server-Sent Events
    // Convert filters to URLSearchParams-compatible format
    const params = new URLSearchParams({ organization_id: this.organizationId })
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v))
        } else if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }

    const eventSource = new EventSource(`${this.baseUrl}/subscribe?${params}`)

    eventSource.onmessage = event => {
      callback(JSON.parse(event.data))
    }

    return () => {
      eventSource.close()
    }
  }

  // ==================== INTEGRATION HELPERS ====================

  /**
   * Export appointments to external calendar format
   */
  async exportToExternalCalendar(
    format: 'ical' | 'google' | 'outlook',
    appointmentIds: string[]
  ): Promise<{ export_url: string; expires_at: Date }> {
    const response = await fetch(`${this.baseUrl}/export/${format}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ appointment_ids: appointmentIds })
    })

    if (!response.ok) {
      throw new Error(`Failed to export calendar: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Import appointments from external source
   */
  async importFromExternalCalendar(
    source: 'ical' | 'csv' | 'json',
    data: string | File,
    mapping?: Record<string, string>
  ): Promise<{
    imported_count: number
    skipped_count: number
    errors: Array<{ row: number; error: string }>
  }> {
    const formData = new FormData()
    formData.append('source', source)

    if (typeof data === 'string') {
      formData.append('data', data)
    } else {
      formData.append('file', data)
    }

    if (mapping) {
      formData.append('mapping', JSON.stringify(mapping))
    }

    const response = await fetch(`${this.baseUrl}/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.securityContext.user_id}`,
        'X-Organization-ID': this.organizationId
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Failed to import calendar: ${response.statusText}`)
    }

    return response.json()
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.securityContext.user_id}`,
      'X-Organization-ID': this.organizationId,
      'X-User-Role': this.securityContext.user_role,
      'X-Resource-Access-Level': this.securityContext.resource_access_level
    }
  }

  private generateReferenceNumber(type: string): string {
    const prefix = type.toUpperCase().substring(0, 3)
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
  }
}

// Factory function to create CalendarAPI instance
export function createCalendarAPI(
  organizationId: string,
  securityContext: CalendarSecurityContext
): CalendarAPI {
  return new CalendarAPI(organizationId, securityContext)
}

// Default instance for common usage
export function useCalendarAPI(
  organizationId: string,
  userId: string,
  userRole: string = 'user'
): CalendarAPI {
  const securityContext: CalendarSecurityContext = {
    organization_id: organizationId,
    user_id: userId,
    user_role: userRole,
    resource_access_level: 'write',
    industry_permissions: ['universal'],
    data_access_scope: userRole === 'admin' ? 'all_appointments' : 'team_appointments'
  }

  return new CalendarAPI(organizationId, securityContext)
}
