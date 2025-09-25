export interface CalendarParticipant {
  id: string
  name: string
  email?: string
  role: string
}

export interface CalendarAttachment {
  id: string
  name: string
  url: string
  type: string
}

export interface CalendarItem {
  id: string
  title: string
  description?: string
  date: string // ISO date string
  duration?: number // in minutes
  all_day?: boolean
  source: 'grants' | 'cases' | 'playbooks' | 'payments' | 'consultations'
  source_id: string
  category: 'deadline' | 'meeting' | 'review' | 'milestone' | 'payment' | 'submission'
  status?: 'upcoming' | 'overdue' | 'completed' | 'cancelled'
  location?: string
  participants?: CalendarParticipant[]
  attachments?: CalendarAttachment[]
  custom_fields?: Record<string, any>
  created_at: string
  updated_at: string
}
