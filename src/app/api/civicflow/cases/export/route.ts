import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateCSV } from '@/lib/utils/export-utils'
import { generatePDFReport } from '@/lib/services/export-service'
import JSZip from 'jszip'
import type { CaseFilters, CaseListItem } from '@/types/cases'

const DEMO_ORG_ID = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'

export async function POST(request: NextRequest) {
  try {
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    const { filters, format } = await request.json()
    
    // Get organization ID from header
    const orgId = request.headers.get('X-Organization-Id') || 
      (request.nextUrl.pathname.startsWith('/civicflow') ? DEMO_ORG_ID : null)
    
    const isDemoMode = orgId === DEMO_ORG_ID || !request.headers.get('X-Organization-Id')
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      )
    }

    // Fetch cases using same logic as list endpoint
    const { data: entities, error: entitiesError } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_code,
        entity_name,
        smart_code,
        created_at,
        updated_at
      `)
      .eq('organization_id', orgId)
      .eq('entity_type', 'case')

    if (entitiesError) throw entitiesError

    if (!entities || entities.length === 0) {
      return NextResponse.json(
        { error: 'No cases to export' },
        { status: 404 }
      )
    }

    const caseIds = entities.map(e => e.id)
    
    // Get dynamic fields
    const { data: dynamicFields } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_text, field_value_number, field_value_date')
      .in('entity_id', caseIds)

    // Get relationships
    const { data: relationships } = await supabase
      .from('core_relationships')
      .select(`
        from_entity_id,
        to_entity_id,
        relationship_type,
        to_entity:core_entities!to_entity_id(
          id,
          entity_name,
          entity_type
        )
      `)
      .in('from_entity_id', caseIds)
      .in('relationship_type', ['case_to_program', 'case_to_subject'])

    // Build case list
    const cases: CaseListItem[] = entities.map(entity => {
      const entityFields = dynamicFields?.filter(df => df.entity_id === entity.id) || []
      const fieldMap = entityFields.reduce((acc, field) => {
        acc[field.field_name] = field.field_value_text || 
          field.field_value_number || 
          field.field_value_date || 
          null
        return acc
      }, {} as Record<string, any>)

      const entityRels = relationships?.filter(r => r.from_entity_id === entity.id) || []
      const program = entityRels.find(r => r.relationship_type === 'case_to_program')
      const subject = entityRels.find(r => r.relationship_type === 'case_to_subject')

      let tags: string[] = []
      try {
        if (fieldMap.tags) {
          tags = JSON.parse(fieldMap.tags)
        }
      } catch {}

      return {
        id: entity.id,
        entity_code: entity.entity_code,
        entity_name: entity.entity_name,
        smart_code: entity.smart_code,
        status: fieldMap.status || 'new',
        priority: fieldMap.priority || 'medium',
        rag: fieldMap.rag || 'G',
        due_date: fieldMap.due_date,
        owner: fieldMap.owner,
        tags,
        program_id: program?.to_entity_id || null,
        program_name: program?.to_entity?.entity_name || null,
        subject_id: subject?.to_entity_id || null,
        subject_name: subject?.to_entity?.entity_name || null,
        subject_type: subject?.to_entity?.entity_type as any || null,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
        last_action_at: null,
        last_action_type: null
      }
    })

    // Apply filters (reuse filter logic from list endpoint)
    let filteredCases = cases
    // ... apply same filters as list endpoint

    // Generate export based on format
    let responseData: any
    let contentType: string
    let filename: string

    switch (format) {
      case 'csv': {
        const csv = generateCSV(filteredCases, [
          'entity_code',
          'entity_name',
          'status',
          'priority',
          'rag',
          'owner',
          'program_name',
          'subject_name',
          'due_date',
          'created_at'
        ])
        
        responseData = isDemoMode 
          ? csv + '\n\n# Demo Mode - Sample Data Only' 
          : csv
        contentType = 'text/csv'
        filename = `cases-export-${new Date().toISOString()}.csv`
        break
      }

      case 'pdf': {
        const pdfData = {
          title: 'Cases Export',
          subtitle: isDemoMode ? 'Demo Mode - Sample Data Only' : '',
          sections: [{
            title: 'Cases Summary',
            content: `Total Cases: ${filteredCases.length}`,
            table: {
              headers: ['Code', 'Name', 'Status', 'Priority', 'RAG', 'Owner', 'Due Date'],
              rows: filteredCases.map(c => [
                c.entity_code,
                c.entity_name,
                c.status,
                c.priority,
                c.rag,
                c.owner || '-',
                c.due_date || '-'
              ])
            }
          }]
        }
        
        responseData = await generatePDFReport(pdfData)
        contentType = 'application/pdf'
        filename = `cases-export-${new Date().toISOString()}.pdf`
        break
      }

      case 'zip': {
        const zip = new JSZip()
        
        // Add CSV
        const csv = generateCSV(filteredCases)
        zip.file('cases.csv', csv)
        
        // Add JSON
        const jsonData = {
          exported_at: new Date().toISOString(),
          organization_id: orgId,
          demo_mode: isDemoMode,
          total_cases: filteredCases.length,
          cases: filteredCases
        }
        zip.file('cases.json', JSON.stringify(jsonData, null, 2))
        
        // Add readme
        const readme = `# Cases Export

Generated: ${new Date().toISOString()}
Total Cases: ${filteredCases.length}
${isDemoMode ? '\n⚠️ Demo Mode - Sample Data Only\n' : ''}

## Files:
- cases.csv: Spreadsheet-compatible format
- cases.json: Full data with metadata
`
        zip.file('README.txt', readme)
        
        responseData = await zip.generateAsync({ type: 'nodebuffer' })
        contentType = 'application/zip'
        filename = `cases-export-${new Date().toISOString()}.zip`
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        )
    }

    // Return file
    return new NextResponse(responseData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Cases export error:', error)
    return NextResponse.json(
      { error: 'Failed to export cases' },
      { status: 500 }
    )
  }
}