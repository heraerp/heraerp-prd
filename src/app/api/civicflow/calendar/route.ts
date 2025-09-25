import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CalendarItem } from '@/types/calendar'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id')

    if (!orgId || orgId !== CIVICFLOW_ORG_ID) {
      return NextResponse.json({ error: 'Invalid organization' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const sources = searchParams.get('sources')?.split(',') || []
    const status = searchParams.get('status')
    const assignee = searchParams.get('assignee')
    const q = searchParams.get('q')

    // Fetch events from database if 'events' is in sources
    let eventItems: CalendarItem[] = []
    if (sources.includes('events')) {
      const { data: events } = await supabase
        .from('core_entities')
        .select(
          `
          *,
          core_dynamic_data(*)
        `
        )
        .eq('organization_id', orgId)
        .eq('entity_type', 'event')

      if (events) {
        eventItems = events.map(event => {
          const dynamicData = event.core_dynamic_data || []
          const getFieldValue = (fieldName: string, type: 'text' | 'number' | 'json' = 'text') => {
            const field = dynamicData.find((d: any) => d.field_name === fieldName)
            if (!field) return undefined
            switch (type) {
              case 'number':
                return field.field_value_number
              case 'json':
                return field.field_value_json
              default:
                return field.field_value_text
            }
          }

          const startDatetime = new Date(getFieldValue('start_datetime') || event.created_at)
          const endDatetime = new Date(getFieldValue('end_datetime') || startDatetime)
          const duration = Math.round(
            (endDatetime.getTime() - startDatetime.getTime()) / (60 * 1000)
          )

          return {
            id: event.id,
            title: event.entity_name,
            description: getFieldValue('description'),
            date: startDatetime.toISOString(),
            duration,
            all_day: duration >= 24 * 60,
            source: 'events',
            source_id: event.id,
            category: getFieldValue('event_type') || 'event',
            status: startDatetime > new Date() ? 'upcoming' : 'past',
            location:
              getFieldValue('is_online') === 'true'
                ? getFieldValue('online_url') || 'Online'
                : getFieldValue('venue_name'),
            participants: [],
            custom_fields: {
              event_type: getFieldValue('event_type'),
              is_online: getFieldValue('is_online') === 'true',
              capacity: getFieldValue('capacity', 'number')
            },
            created_at: event.created_at,
            updated_at: event.updated_at
          } as CalendarItem
        })
      }
    }

    // For now, return mock data since we don't have actual calendar items in the database
    const mockItems: CalendarItem[] = [
      {
        id: '1',
        title: 'Grant Application Deadline',
        description: 'Final submission for Community Development Grant',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        all_day: false,
        source: 'grants',
        source_id: 'grant-1',
        category: 'deadline',
        status: 'upcoming',
        location: 'Online Portal',
        participants: [
          { id: 'p1', name: 'John Smith', email: 'john@example.com', role: 'Grant Officer' },
          { id: 'p2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Applicant' }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Case Review Meeting',
        description: 'Monthly review of active constituent cases',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 90,
        all_day: false,
        source: 'cases',
        source_id: 'case-1',
        category: 'meeting',
        status: 'upcoming',
        location: 'Conference Room A',
        participants: [
          { id: 'p3', name: 'Mike Davis', email: 'mike@example.com', role: 'Case Manager' },
          { id: 'p4', name: 'Emily Chen', email: 'emily@example.com', role: 'Supervisor' }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Playbook Execution: Intake Process',
        description: 'Running constituent intake playbook for new applications',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 45,
        all_day: false,
        source: 'playbooks',
        source_id: 'playbook-1',
        category: 'milestone',
        status: 'upcoming',
        participants: [
          { id: 'p5', name: 'Alex Turner', email: 'alex@example.com', role: 'Coordinator' }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Payment Processing',
        description: 'Monthly benefit payments processing',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 120,
        all_day: true,
        source: 'payments',
        source_id: 'payment-batch-1',
        category: 'payment',
        status: 'upcoming',
        custom_fields: {
          total_amount: 125000,
          recipient_count: 450,
          payment_method: 'Direct Deposit'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '5',
        title: 'Constituent Consultation',
        description: 'One-on-one consultation for housing assistance',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        all_day: false,
        source: 'consultations',
        source_id: 'consult-1',
        category: 'meeting',
        status: 'upcoming',
        location: 'Office 201',
        participants: [
          { id: 'p6', name: 'Lisa Wong', email: 'lisa@example.com', role: 'Counselor' },
          { id: 'p7', name: 'James Miller', email: 'james@example.com', role: 'Constituent' }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '6',
        title: 'Overdue: Grant Report Submission',
        description: 'Quarterly report for Education Grant was due yesterday',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        all_day: false,
        source: 'grants',
        source_id: 'grant-2',
        category: 'deadline',
        status: 'overdue',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    // Combine event items with mock items
    const allItems = [...eventItems, ...mockItems]

    // Filter by date range
    let filteredItems = allItems
    if (startDate && endDate) {
      filteredItems = filteredItems.filter(item => {
        const itemDate = new Date(item.date)
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate)
      })
    }

    // Filter by sources
    if (sources.length > 0) {
      filteredItems = filteredItems.filter(item => sources.includes(item.source))
    }

    // Filter by status
    if (status && status !== 'all') {
      filteredItems = filteredItems.filter(item => item.status === status)
    }

    // Filter by search query
    if (q) {
      const query = q.toLowerCase()
      filteredItems = filteredItems.filter(
        item =>
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      )
    }

    return NextResponse.json({
      items: filteredItems,
      total: filteredItems.length
    })
  } catch (error) {
    console.error('Error fetching calendar items:', error)
    return NextResponse.json({ error: 'Failed to fetch calendar items' }, { status: 500 })
  }
}

// Export calendar data
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id')

    if (!orgId || orgId !== CIVICFLOW_ORG_ID) {
      return NextResponse.json({ error: 'Invalid organization' }, { status: 403 })
    }

    const body = await request.json()
    const { format, items } = body

    if (format === 'ics') {
      // Generate ICS file content
      let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CivicFlow//Calendar Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:CivicFlow Calendar
X-WR-TIMEZONE:America/New_York
`

      items.forEach((item: CalendarItem) => {
        const startDate = new Date(item.date)
        const endDate = new Date(startDate.getTime() + (item.duration || 60) * 60 * 1000)

        icsContent += `
BEGIN:VEVENT
UID:${item.id}@civicflow.gov
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${item.title}
DESCRIPTION:${item.description || ''}
LOCATION:${item.location || ''}
STATUS:CONFIRMED
END:VEVENT`
      })

      icsContent += '\nEND:VCALENDAR'

      return new NextResponse(icsContent, {
        headers: {
          'Content-Type': 'text/calendar',
          'Content-Disposition': `attachment; filename="civicflow-calendar.ics"`
        }
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting calendar:', error)
    return NextResponse.json({ error: 'Failed to export calendar' }, { status: 500 })
  }
}

function formatICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}
