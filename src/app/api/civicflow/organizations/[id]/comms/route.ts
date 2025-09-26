import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-guard'
import type { OrgCommRow } from '@/types/organizations'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const entityId = params.id
    const searchParams = request.nextUrl.searchParams
    const isDemo = isDemoMode(orgId)

    const direction = searchParams.get('direction')
    const channel = searchParams.get('channel')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    if (isDemo) {
      const mockComms: OrgCommRow[] = [
        {
          id: 'comm-1',
          message_id: 'msg-1',
          direction: 'outbound',
          channel: 'email',
          subject: 'Grant Application Update',
          preview: 'Your grant application CHI-2024-001 has been approved...',
          status: 'delivered',
          provider_id: 'mailchimp',
          last_event_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'comm-2',
          message_id: 'msg-2',
          direction: 'inbound',
          channel: 'email',
          subject: 'Re: Grant Application Update',
          preview: 'Thank you for the approval! We are excited to...',
          status: 'replied',
          provider_id: 'gmail',
          last_event_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'comm-3',
          message_id: 'msg-3',
          direction: 'outbound',
          channel: 'sms',
          subject: undefined,
          preview: 'Reminder: Community Health Fair registration closes tomorrow',
          status: 'delivered',
          provider_id: 'twilio',
          last_event_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'comm-4',
          message_id: 'msg-4',
          direction: 'outbound',
          channel: 'email',
          subject: 'Monthly Impact Report',
          preview: 'See how your partnership is making a difference...',
          status: 'opened',
          provider_id: 'mailchimp',
          last_event_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      // Apply filters
      let filteredComms = mockComms
      if (direction) {
        filteredComms = filteredComms.filter(c => c.direction === direction)
      }
      if (channel) {
        filteredComms = filteredComms.filter(c => c.channel === channel)
      }
      if (status) {
        filteredComms = filteredComms.filter(c => c.status === status)
      }
      if (dateFrom) {
        filteredComms = filteredComms.filter(c => new Date(c.created_at) >= new Date(dateFrom))
      }
      if (dateTo) {
        filteredComms = filteredComms.filter(c => new Date(c.created_at) <= new Date(dateTo))
      }

      return NextResponse.json({
        data: filteredComms,
        total: filteredComms.length
      })
    }

    // Production: Fetch comm_message entities related to this org
    let query = supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*)
      `
      )
      .eq('entity_type', 'comm_message')
      .eq('organization_id', orgId)

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data: messageEntities } = await query

    const comms: OrgCommRow[] = []

    for (const message of messageEntities || []) {
      // Check if message is related to this organization
      const { data: msgRels } = await supabase
        .from('core_relationships')
        .select('*')
        .or(`from_entity_id.eq.${message.id},to_entity_id.eq.${message.id}`)
        .eq('organization_id', orgId)

      const isOrgRelated = msgRels?.some(
        rel => rel.from_entity_id === entityId || rel.to_entity_id === entityId
      )

      if (!isOrgRelated) continue

      // Parse dynamic data
      const dynamicData: any = {}
      message.core_dynamic_data?.forEach((field: any) => {
        const value = field.field_value_text || field.field_value_number || field.field_value_json
        dynamicData[field.field_name] = value
      })

      // Apply filters
      if (direction && dynamicData.direction !== direction) continue
      if (channel && dynamicData.channel !== channel) continue
      if (status && dynamicData.status !== status) continue

      const commRow: OrgCommRow = {
        id: message.id,
        message_id: message.entity_code,
        direction: dynamicData.direction || 'outbound',
        channel: dynamicData.channel || 'email',
        subject: dynamicData.subject,
        preview: dynamicData.preview || dynamicData.body?.substring(0, 100) + '...',
        status: dynamicData.status || 'sent',
        provider_id: dynamicData.provider_id,
        last_event_at: dynamicData.last_event_at || message.updated_at,
        created_at: message.created_at
      }

      comms.push(commRow)
    }

    // Sort by created_at desc
    comms.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      data: comms,
      total: comms.length
    })
  } catch (error) {
    console.error('Error fetching communications:', error)
    return NextResponse.json({ error: 'Failed to fetch communications' }, { status: 500 })
  }
}
