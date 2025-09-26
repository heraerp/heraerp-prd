import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-guard'
import type { OrgDocument } from '@/types/organizations'

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

    const documentType = searchParams.get('document_type')
    const tags = searchParams.get('tags')?.split(',')
    const uploadedBy = searchParams.get('uploaded_by')

    if (isDemo) {
      const mockDocuments: OrgDocument[] = [
        {
          id: 'doc-1',
          document_name: 'Partnership Impact Report 2023',
          document_type: 'report',
          file_url: 'https://example.com/reports/impact-2023.pdf',
          file_size: 2456789,
          mime_type: 'application/pdf',
          description: 'Annual report showcasing partnership outcomes and community impact',
          tags: ['impact', 'annual', '2023'],
          uploaded_by: 'Sarah Johnson',
          uploaded_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'doc-2',
          document_name: 'Health Initiative Case Study',
          document_type: 'case_study',
          file_url: 'https://example.com/cases/health-initiative.pdf',
          file_size: 1234567,
          mime_type: 'application/pdf',
          description: 'Detailed case study of community health program implementation',
          tags: ['health', 'case-study', 'success'],
          uploaded_by: 'Michael Chen',
          uploaded_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'doc-3',
          document_name: 'Memorandum of Understanding',
          document_type: 'contract',
          file_url: 'https://example.com/contracts/mou-2024.pdf',
          file_size: 567890,
          mime_type: 'application/pdf',
          description: 'MOU for 2024 partnership activities',
          tags: ['legal', 'mou', '2024'],
          uploaded_by: 'Legal Team',
          uploaded_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'doc-4',
          document_name: 'Grant Application Evidence Pack',
          document_type: 'evidence',
          file_url: 'https://example.com/evidence/grant-chi-2024.zip',
          file_size: 15678901,
          mime_type: 'application/zip',
          description: 'Supporting documents for CHI-2024-001 grant application',
          tags: ['grant', 'evidence', 'CHI-2024'],
          uploaded_by: 'Sarah Johnson',
          uploaded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      // Apply filters
      let filteredDocs = mockDocuments
      if (documentType) {
        filteredDocs = filteredDocs.filter(d => d.document_type === documentType)
      }
      if (tags && tags.length > 0) {
        filteredDocs = filteredDocs.filter(d => d.tags?.some(tag => tags.includes(tag)))
      }
      if (uploadedBy) {
        filteredDocs = filteredDocs.filter(d => d.uploaded_by === uploadedBy)
      }

      return NextResponse.json({
        data: filteredDocs,
        total: filteredDocs.length
      })
    }

    // Production: Fetch document entities related to this org
    const { data: docRelationships } = await supabase
      .from('core_relationships')
      .select(
        `
        from_entity_id,
        from_entity:from_entity_id(
          *,
          core_dynamic_data(*)
        )
      `
      )
      .eq('to_entity_id', entityId)
      .eq('relationship_type', 'document_for_entity')
      .eq('organization_id', orgId)

    const documents: OrgDocument[] = []

    for (const rel of docRelationships || []) {
      if (!rel.from_entity) continue

      const docEntity = rel.from_entity

      // Parse dynamic data
      const dynamicData: any = {}
      docEntity.core_dynamic_data?.forEach((field: any) => {
        const value = field.field_value_text || field.field_value_number || field.field_value_json
        dynamicData[field.field_name] = value
      })

      // Apply filters
      if (documentType && dynamicData.document_type !== documentType) continue

      const docTags = dynamicData.tags
        ? typeof dynamicData.tags === 'string'
          ? dynamicData.tags.split(',').map((t: string) => t.trim())
          : dynamicData.tags
        : []

      if (tags && tags.length > 0 && !tags.some(tag => docTags.includes(tag))) continue
      if (uploadedBy && dynamicData.uploaded_by !== uploadedBy) continue

      const document: OrgDocument = {
        id: docEntity.id,
        document_name: docEntity.entity_name,
        document_type: dynamicData.document_type || 'other',
        file_url: dynamicData.file_url,
        file_size: dynamicData.file_size,
        mime_type: dynamicData.mime_type,
        description: dynamicData.description,
        tags: docTags,
        uploaded_by: dynamicData.uploaded_by,
        uploaded_at: dynamicData.uploaded_at || docEntity.created_at
      }

      documents.push(document)
    }

    // Sort by uploaded date desc
    documents.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())

    return NextResponse.json({
      data: documents,
      total: documents.length
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}
