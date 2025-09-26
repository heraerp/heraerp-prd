import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-guard'
import type { OrgContact } from '@/types/organizations'

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

    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const primaryOnly = searchParams.get('primary_only') === 'true'

    // Fetch all contact relationships
    let query = supabase
      .from('core_relationships')
      .select(
        `
        *,
        to_entity:to_entity_id(
          id,
          entity_name,
          entity_code
        )
      `
      )
      .eq('from_entity_id', entityId)
      .eq('relationship_type', 'has_contact')
      .eq('organization_id', orgId)

    if (primaryOnly) {
      query = query.eq('relationship_data->is_primary', true)
    }

    const { data: contactRels, error } = await query

    if (error) throw error

    // Build contact list with details
    const contacts: OrgContact[] = []

    for (const rel of contactRels || []) {
      if (!rel.to_entity) continue

      // Apply role filter
      if (role && rel.relationship_data?.role !== role) continue

      // Fetch contact details from dynamic data
      const { data: contactFields } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', rel.to_entity_id)
        .eq('organization_id', orgId)
        .in('field_name', ['email', 'phone', 'title', 'department'])

      const email = contactFields?.find(f => f.field_name === 'email')?.field_value_text
      const phone = contactFields?.find(f => f.field_name === 'phone')?.field_value_text

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const nameMatch = rel.to_entity.entity_name.toLowerCase().includes(searchLower)
        const emailMatch = email?.toLowerCase().includes(searchLower)
        const phoneMatch = phone?.includes(search)

        if (!nameMatch && !emailMatch && !phoneMatch) continue
      }

      contacts.push({
        id: rel.id,
        constituent_id: rel.to_entity_id,
        constituent_name: rel.to_entity.entity_name,
        email,
        phone,
        role: rel.relationship_data?.role || 'Contact',
        is_primary: rel.relationship_data?.is_primary || false,
        linked_at: rel.created_at
      })
    }

    // Sort by primary first, then by name
    contacts.sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1
      if (!a.is_primary && b.is_primary) return 1
      return a.constituent_name.localeCompare(b.constituent_name)
    })

    return NextResponse.json({
      data: contacts,
      total: contacts.length
    })
  } catch (error) {
    console.error('Error fetching organization contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const entityId = params.id
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const contactId = pathParts[pathParts.length - 1]

    // Find the relationship
    const { data: relationship, error: findError } = await supabase
      .from('core_relationships')
      .select('id')
      .eq('from_entity_id', entityId)
      .eq('to_entity_id', contactId)
      .eq('relationship_type', 'has_contact')
      .eq('organization_id', orgId)
      .single()

    if (findError || !relationship) {
      return NextResponse.json({ error: 'Contact relationship not found' }, { status: 404 })
    }

    // Delete the relationship
    const { error: deleteError } = await supabase
      .from('core_relationships')
      .delete()
      .eq('id', relationship.id)
      .eq('organization_id', orgId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing contact:', error)
    return NextResponse.json({ error: 'Failed to remove contact' }, { status: 500 })
  }
}
