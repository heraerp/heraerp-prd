import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-guard'
import { Parser } from 'json2csv'
import JSZip from 'jszip'
import crypto from 'crypto'
import type { ExportRequest } from '@/types/organizations'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const entityId = params.id
    const isDemo = isDemoMode(orgId)
    const body: ExportRequest = await request.json()

    // Log export request
    await logExportRequest(entityId, orgId, body)

    // Fetch all data based on sections
    const exportData: any = {}
    const baseUrl = `${request.nextUrl.origin}/api/civicflow/organizations/${entityId}`

    for (const section of body.sections) {
      const response = await fetch(`${baseUrl}/${section}`, {
        headers: { 'X-Organization-Id': orgId }
      })

      if (response.ok) {
        exportData[section] = await response.json()
      }
    }

    // Add organization overview
    const overviewResponse = await fetch(baseUrl, {
      headers: { 'X-Organization-Id': orgId }
    })

    if (overviewResponse.ok) {
      exportData.organization = await overviewResponse.json()
    }

    // Handle different export formats
    if (body.format === 'csv') {
      return exportAsCSV(exportData, isDemo)
    } else if (body.format === 'pdf') {
      return exportAsPDF(exportData, isDemo)
    } else if (body.format === 'zip') {
      return exportAsZIP(exportData, isDemo)
    }

    return NextResponse.json({ error: 'Invalid export format' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting organization data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}

async function logExportRequest(entityId: string, orgId: string, request: ExportRequest) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v2/universal/txn-emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId
      },
      body: JSON.stringify({
        smart_code: 'HERA.PUBLICSECTOR.CRM.EXPORT.ORGANIZATION.V1',
        reference_entity_id: entityId,
        metadata: {
          sections: request.sections,
          format: request.format,
          date_range: request.date_range,
          exported_at: new Date().toISOString(),
          record_counts: request.sections.map(s => ({ section: s, count: 0 }))
        }
      })
    })
  } catch (error) {
    console.error('Failed to log export request:', error)
  }
}

function exportAsCSV(data: any, isDemo: boolean): NextResponse {
  const csv: string[] = []

  // Organization header
  if (data.organization) {
    csv.push('ORGANIZATION PROFILE')
    csv.push(`Name,${data.organization.entity_name}`)
    csv.push(`Type,${data.organization.type}`)
    csv.push(`Status,${data.organization.status}`)
    csv.push(`Manager,${data.organization.manager?.user_name || 'Not assigned'}`)
    csv.push('')
  }

  // Contacts section
  if (data.contacts?.data) {
    csv.push('CONTACTS')
    const parser = new Parser({
      fields: ['constituent_name', 'role', 'email', 'phone', 'is_primary']
    })
    csv.push(parser.parse(data.contacts.data))
    csv.push('')
  }

  // Funding section
  if (data.funding?.data) {
    csv.push('FUNDING')
    const parser = new Parser({
      fields: [
        'grant_name',
        'grant_code',
        'status',
        'amount_requested',
        'amount_awarded',
        'start_date',
        'end_date'
      ]
    })
    csv.push(parser.parse(data.funding.data))
    csv.push('')
  }

  // Events section
  if (data.events?.data) {
    csv.push('EVENTS')
    const parser = new Parser({
      fields: ['event_name', 'event_type', 'event_date', 'status']
    })
    csv.push(parser.parse(data.events.data))
    csv.push('')
  }

  // Add watermark for demo
  if (isDemo) {
    csv.push('')
    csv.push('*** DEMO DATA - NOT FOR PRODUCTION USE ***')
    csv.push(`Exported on ${new Date().toISOString()}`)
  }

  const content = csv.join('\n')
  const checksum = crypto.createHash('sha256').update(content).digest('hex')

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="organization-export.csv"`,
      'X-Checksum': checksum
    }
  })
}

function exportAsPDF(data: any, isDemo: boolean): NextResponse {
  // For now, create a simple text format
  let content = 'ORGANIZATION PROFILE EXPORT\n'
  content += '='.repeat(50) + '\n\n'

  // Organization details
  if (data.organization) {
    content += 'ORGANIZATION DETAILS\n'
    content += '-'.repeat(30) + '\n'
    content += `Name: ${data.organization.entity_name}\n`
    content += `Type: ${data.organization.type}\n`
    content += `Status: ${data.organization.status}\n`
    content += `Sector: ${data.organization.sector || 'N/A'}\n`
    content += `Website: ${data.organization.website || 'N/A'}\n`
    content += `Manager: ${data.organization.manager?.user_name || 'Not assigned'}\n`
    content += `Engagement Stage: ${data.organization.engagement?.stage || 'N/A'}\n`
    content += `Engagement Score: ${data.organization.engagement?.score || 0}\n`
    content += '\n'
  }

  // Overview KPIs
  if (data.overview?.kpis) {
    content += 'KEY METRICS\n'
    content += '-'.repeat(30) + '\n'
    content += `Programs Enrolled: ${data.overview.kpis.programs_enrolled}\n`
    content += `Events Attended: ${data.overview.kpis.total_events_attended}\n`
    content += `Messages (30d): ${data.overview.kpis.messages_last_30d}\n`
    content += `Open Cases: ${data.overview.kpis.open_cases_count}\n`
    content += `Active Grants: ${data.overview.kpis.active_grants_count}\n`
    content += `Total Funding: $${data.overview.kpis.total_funding_received.toLocaleString()}\n`
    content += '\n'
  }

  // Contacts summary
  if (data.contacts) {
    content += `CONTACTS (${data.contacts.total})\n`
    content += '-'.repeat(30) + '\n'
    data.contacts.data?.slice(0, 5).forEach((contact: any) => {
      content += `- ${contact.constituent_name} (${contact.role})${contact.is_primary ? ' *PRIMARY*' : ''}\n`
      if (contact.email) content += `  Email: ${contact.email}\n`
      if (contact.phone) content += `  Phone: ${contact.phone}\n`
    })
    if (data.contacts.total > 5) {
      content += `... and ${data.contacts.total - 5} more contacts\n`
    }
    content += '\n'
  }

  // Add watermark for demo
  if (isDemo) {
    content += '\n' + '='.repeat(50) + '\n'
    content += 'DEMO DATA - NOT FOR PRODUCTION USE\n'
    content += `Exported on ${new Date().toISOString()}\n`
  }

  const checksum = crypto.createHash('sha256').update(content).digest('hex')

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="organization-export.txt"`,
      'X-Checksum': checksum
    }
  })
}

async function exportAsZIP(data: any, isDemo: boolean): Promise<NextResponse> {
  const zip = new JSZip()

  // Add organization summary
  if (data.organization) {
    zip.file('organization.json', JSON.stringify(data.organization, null, 2))
  }

  // Add each section as separate file
  for (const [section, sectionData] of Object.entries(data)) {
    if (section !== 'organization' && sectionData) {
      zip.file(`${section}.json`, JSON.stringify(sectionData, null, 2))
    }
  }

  // Add metadata
  const metadata = {
    exported_at: new Date().toISOString(),
    sections: Object.keys(data),
    record_counts: Object.entries(data).map(([section, sectionData]: [string, any]) => ({
      section,
      count: sectionData?.data?.length || sectionData?.total || 1
    })),
    is_demo: isDemo
  }
  zip.file('metadata.json', JSON.stringify(metadata, null, 2))

  // Add watermark file for demo
  if (isDemo) {
    zip.file(
      'DEMO_DATA_NOTICE.txt',
      'This export contains DEMO data and should not be used for production purposes.\n' +
        `Exported on: ${new Date().toISOString()}\n` +
        'Watermarked by: CivicFlow Demo System'
    )
  }

  const content = await zip.generateAsync({ type: 'nodebuffer' })
  const checksum = crypto.createHash('sha256').update(content).digest('hex')

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="organization-export.zip"`,
      'X-Checksum': checksum
    }
  })
}
