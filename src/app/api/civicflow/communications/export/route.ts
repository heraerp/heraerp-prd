import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const searchParams = request.nextUrl.searchParams

    const type = searchParams.get('type') // campaigns, templates, audiences, messages, logs
    const format_type = searchParams.get('format') || 'csv' // csv, json
    const filters = Object.fromEntries(searchParams.entries())

    let data: any[] = []

    switch (type) {
      case 'campaigns': {
        const { data: campaigns } = await supabase
          .from('core_entities')
          .select('*, core_dynamic_data(*)')
          .eq('organization_id', orgId)
          .eq('entity_type', 'comm_campaign')

        data = campaigns || []
        break
      }

      case 'templates': {
        const { data: templates } = await supabase
          .from('core_entities')
          .select('*, core_dynamic_data(*)')
          .eq('organization_id', orgId)
          .eq('entity_type', 'comm_template')

        data = templates || []
        break
      }

      case 'audiences': {
        const { data: audiences } = await supabase
          .from('core_entities')
          .select('*, core_dynamic_data(*)')
          .eq('organization_id', orgId)
          .eq('entity_type', 'comm_audience')

        data = audiences || []
        break
      }

      case 'messages': {
        const { data: messages } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', orgId)
          .in('transaction_type', ['comm_message_out', 'comm_message_in'])

        data = messages || []
        break
      }

      case 'logs': {
        const { data: logs } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', orgId)
          .like('transaction_type', 'comm_%')

        data = logs || []
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    // Format data based on format_type
    if (format_type === 'csv') {
      const csv = convertToCSV(data, type)

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="civicflow-${type}-${format(new Date(), 'yyyy-MM-dd')}.csv"`
        }
      })
    } else {
      return NextResponse.json(data, {
        headers: {
          'Content-Disposition': `attachment; filename="civicflow-${type}-${format(new Date(), 'yyyy-MM-dd')}.json"`
        }
      })
    }
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}

function convertToCSV(data: any[], type: string): string {
  if (data.length === 0) return ''

  // Define headers based on type
  let headers: string[] = []
  let rows: string[][] = []

  switch (type) {
    case 'campaigns':
      headers = [
        'ID',
        'Code',
        'Name',
        'Channel',
        'Template',
        'Audience',
        'Status',
        'Created',
        'Scheduled'
      ]
      rows = data.map(item => [
        item.id,
        item.entity_code,
        item.entity_name,
        getDynamicValue(item, 'channel'),
        getDynamicValue(item, 'template_name'),
        getDynamicValue(item, 'audience_name'),
        getDynamicValue(item, 'status') || item.status,
        format(new Date(item.created_at), 'yyyy-MM-dd HH:mm'),
        getDynamicValue(item, 'schedule_at') || ''
      ])
      break

    case 'templates':
      headers = ['ID', 'Code', 'Name', 'Channel', 'Version', 'Active', 'Created', 'Updated']
      rows = data.map(item => [
        item.id,
        item.entity_code,
        item.entity_name,
        getDynamicValue(item, 'channel'),
        getDynamicValue(item, 'version') || '1',
        getDynamicValue(item, 'is_active') ? 'Yes' : 'No',
        format(new Date(item.created_at), 'yyyy-MM-dd HH:mm'),
        format(new Date(item.updated_at), 'yyyy-MM-dd HH:mm')
      ])
      break

    case 'audiences':
      headers = ['ID', 'Code', 'Name', 'Size', 'Consent Policy', 'Created']
      rows = data.map(item => [
        item.id,
        item.entity_code,
        item.entity_name,
        getDynamicValue(item, 'size_estimate') || '0',
        getDynamicValue(item, 'consent_policy') || 'opt_in',
        format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')
      ])
      break

    case 'messages':
    case 'logs':
      headers = ['ID', 'Code', 'Type', 'Status', 'Created']
      rows = data.map(item => [
        item.id,
        item.transaction_code,
        item.transaction_type,
        item.metadata?.status || 'completed',
        format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')
      ])
      break
  }

  // Build CSV
  const csvRows = [headers.join(',')]
  rows.forEach(row => {
    csvRows.push(row.map(cell => `"${cell}"`).join(','))
  })

  return csvRows.join('\n')
}

function getDynamicValue(entity: any, fieldName: string): any {
  const field = entity.core_dynamic_data?.find((f: any) => f.field_name === fieldName)
  return field?.field_value_text || field?.field_value_number || field?.field_value_json || ''
}
