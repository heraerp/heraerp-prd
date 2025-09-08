/**
 * HERA Calendar Integration Service
 * 
 * Provider-agnostic calendar synchronization for leave management
 * Supports Google Calendar, Outlook, and other providers
 */

import { universalApi } from '@/lib/universal-api'

export interface CalendarEvent {
  id?: string
  title: string
  description?: string
  startDate: string
  endDate: string
  allDay: boolean
  attendees?: string[]
  location?: string
  color?: string
  reminders?: Array<{
    method: 'email' | 'popup'
    minutes: number
  }>
  visibility?: 'public' | 'private' | 'confidential'
  status?: 'confirmed' | 'tentative' | 'cancelled'
}

export interface CalendarProvider {
  name: string
  createEvent(event: CalendarEvent): Promise<string>
  updateEvent(eventId: string, event: CalendarEvent): Promise<void>
  deleteEvent(eventId: string): Promise<void>
  getEvent(eventId: string): Promise<CalendarEvent | null>
  listEvents(startDate: string, endDate: string): Promise<CalendarEvent[]>
}

/**
 * Google Calendar Provider
 */
export class GoogleCalendarProvider implements CalendarProvider {
  name = 'google'
  
  constructor(
    private accessToken: string,
    private calendarId: string = 'primary'
  ) {}

  async createEvent(event: CalendarEvent): Promise<string> {
    // In production, this would make actual Google Calendar API calls
    // For now, we'll simulate the response
    console.log('Creating Google Calendar event:', event)
    
    const googleEvent = {
      summary: event.title,
      description: event.description,
      start: {
        date: event.allDay ? event.startDate : undefined,
        dateTime: !event.allDay ? `${event.startDate}T09:00:00` : undefined,
        timeZone: 'UTC'
      },
      end: {
        date: event.allDay ? event.endDate : undefined,
        dateTime: !event.allDay ? `${event.endDate}T17:00:00` : undefined,
        timeZone: 'UTC'
      },
      attendees: event.attendees?.map(email => ({ email })),
      colorId: this.getGoogleColorId(event.color),
      visibility: event.visibility || 'default',
      reminders: {
        useDefault: false,
        overrides: event.reminders || [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 }
        ]
      }
    }
    
    // Simulated response
    return `google_event_${Date.now()}`
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<void> {
    console.log('Updating Google Calendar event:', eventId, event)
    // Implementation would update the event via Google Calendar API
  }

  async deleteEvent(eventId: string): Promise<void> {
    console.log('Deleting Google Calendar event:', eventId)
    // Implementation would delete the event via Google Calendar API
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    console.log('Getting Google Calendar event:', eventId)
    // Implementation would fetch the event via Google Calendar API
    return null
  }

  async listEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    console.log('Listing Google Calendar events:', startDate, endDate)
    // Implementation would list events via Google Calendar API
    return []
  }

  private getGoogleColorId(color?: string): string {
    const colorMap: Record<string, string> = {
      'blue': '1',
      'green': '2',
      'purple': '3',
      'red': '4',
      'yellow': '5',
      'orange': '6',
      'turquoise': '7',
      'gray': '8',
      'bold-blue': '9',
      'bold-green': '10',
      'bold-red': '11'
    }
    return colorMap[color || 'blue'] || '1'
  }
}

/**
 * Outlook Calendar Provider
 */
export class OutlookCalendarProvider implements CalendarProvider {
  name = 'outlook'
  
  constructor(
    private accessToken: string,
    private userEmail: string
  ) {}

  async createEvent(event: CalendarEvent): Promise<string> {
    console.log('Creating Outlook Calendar event:', event)
    
    const outlookEvent = {
      subject: event.title,
      body: {
        contentType: 'HTML',
        content: event.description || ''
      },
      start: {
        dateTime: event.allDay ? `${event.startDate}T00:00:00` : `${event.startDate}T09:00:00`,
        timeZone: 'UTC'
      },
      end: {
        dateTime: event.allDay ? `${event.endDate}T23:59:59` : `${event.endDate}T17:00:00`,
        timeZone: 'UTC'
      },
      isAllDay: event.allDay,
      attendees: event.attendees?.map(email => ({
        emailAddress: { address: email },
        type: 'required'
      })),
      showAs: event.visibility === 'private' ? 'busy' : 'free',
      importance: 'normal',
      reminderMinutesBeforeStart: event.reminders?.[0]?.minutes || 15,
      isReminderOn: true
    }
    
    // Simulated response
    return `outlook_event_${Date.now()}`
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<void> {
    console.log('Updating Outlook Calendar event:', eventId, event)
    // Implementation would update the event via Microsoft Graph API
  }

  async deleteEvent(eventId: string): Promise<void> {
    console.log('Deleting Outlook Calendar event:', eventId)
    // Implementation would delete the event via Microsoft Graph API
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    console.log('Getting Outlook Calendar event:', eventId)
    // Implementation would fetch the event via Microsoft Graph API
    return null
  }

  async listEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    console.log('Listing Outlook Calendar events:', startDate, endDate)
    // Implementation would list events via Microsoft Graph API
    return []
  }
}

/**
 * Mock Calendar Provider for development
 */
export class MockCalendarProvider implements CalendarProvider {
  name = 'mock'
  private events: Map<string, CalendarEvent> = new Map()

  async createEvent(event: CalendarEvent): Promise<string> {
    const id = `mock_event_${Date.now()}`
    this.events.set(id, { ...event, id })
    return id
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<void> {
    if (this.events.has(eventId)) {
      this.events.set(eventId, { ...event, id: eventId })
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    this.events.delete(eventId)
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    return this.events.get(eventId) || null
  }

  async listEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    return Array.from(this.events.values()).filter(event => {
      return event.startDate >= startDate && event.endDate <= endDate
    })
  }
}

/**
 * Calendar Integration Service
 */
export class CalendarIntegrationService {
  private providers: Map<string, CalendarProvider> = new Map()
  
  registerProvider(provider: CalendarProvider) {
    this.providers.set(provider.name, provider)
  }
  
  async createLeaveEvent(
    providerName: string,
    leaveRequest: any,
    employeeName: string,
    organizationId: string
  ): Promise<string | null> {
    const provider = this.providers.get(providerName)
    if (!provider) {
      console.warn(`Calendar provider ${providerName} not registered`)
      return null
    }

    const leaveTypeColors: Record<string, string> = {
      'annual': 'blue',
      'sick': 'green',
      'unpaid': 'gray',
      'maternity': 'purple',
      'paternity': 'purple',
      'bereavement': 'gray'
    }

    const event: CalendarEvent = {
      title: `${employeeName} - ${this.formatLeaveType(leaveRequest.metadata.leave_type)}`,
      description: `Leave request: ${leaveRequest.metadata.reason || 'No reason provided'}`,
      startDate: leaveRequest.metadata.start_date,
      endDate: leaveRequest.metadata.end_date,
      allDay: leaveRequest.metadata.partial_days?.type !== 'half',
      color: leaveTypeColors[leaveRequest.metadata.leave_type] || 'blue',
      visibility: 'confidential', // Privacy by default
      reminders: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 } // 1 hour before
      ]
    }

    try {
      const eventId = await provider.createEvent(event)
      
      // Store the calendar event ID in dynamic data
      await universalApi.setDynamicField(
        leaveRequest.id,
        'calendar_event_id',
        eventId,
        'transaction',
        organizationId
      )
      
      await universalApi.setDynamicField(
        leaveRequest.id,
        'calendar_provider',
        providerName,
        'transaction',
        organizationId
      )
      
      return eventId
    } catch (error) {
      console.error('Failed to create calendar event:', error)
      return null
    }
  }
  
  async updateLeaveEvent(
    leaveRequestId: string,
    updates: Partial<CalendarEvent>,
    organizationId: string
  ): Promise<void> {
    // Get the calendar details from dynamic data
    const calendarData = await universalApi.getDynamicFields(
      leaveRequestId,
      ['calendar_event_id', 'calendar_provider'],
      organizationId
    )
    
    if (!calendarData.calendar_event_id || !calendarData.calendar_provider) {
      console.warn('No calendar sync data found for leave request')
      return
    }
    
    const provider = this.providers.get(calendarData.calendar_provider)
    if (!provider) {
      console.warn(`Calendar provider ${calendarData.calendar_provider} not registered`)
      return
    }
    
    await provider.updateEvent(calendarData.calendar_event_id, updates)
  }
  
  async deleteLeaveEvent(
    leaveRequestId: string,
    organizationId: string
  ): Promise<void> {
    // Get the calendar details from dynamic data
    const calendarData = await universalApi.getDynamicFields(
      leaveRequestId,
      ['calendar_event_id', 'calendar_provider'],
      organizationId
    )
    
    if (!calendarData.calendar_event_id || !calendarData.calendar_provider) {
      console.warn('No calendar sync data found for leave request')
      return
    }
    
    const provider = this.providers.get(calendarData.calendar_provider)
    if (!provider) {
      console.warn(`Calendar provider ${calendarData.calendar_provider} not registered`)
      return
    }
    
    await provider.deleteEvent(calendarData.calendar_event_id)
    
    // Clear the calendar sync data
    await universalApi.setDynamicField(
      leaveRequestId,
      'calendar_event_id',
      null,
      'transaction',
      organizationId
    )
  }
  
  private formatLeaveType(type: string): string {
    const typeLabels: Record<string, string> = {
      'annual': 'Annual Leave',
      'sick': 'Sick Leave',
      'unpaid': 'Unpaid Leave',
      'maternity': 'Maternity Leave',
      'paternity': 'Paternity Leave',
      'bereavement': 'Bereavement Leave'
    }
    return typeLabels[type] || type
  }
}

// Export singleton instance
export const calendarService = new CalendarIntegrationService()

// Register default providers
if (typeof window !== 'undefined') {
  // In browser environment, register mock provider for development
  calendarService.registerProvider(new MockCalendarProvider())
}