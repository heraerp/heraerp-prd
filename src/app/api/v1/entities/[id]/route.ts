import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { HERAJWTService } from '@/lib/auth/jwt-service'

const jwtService = new HERAJWTService()

// Helper function to extract organization_id from JWT token or header
async function getOrganizationContext(request: NextRequest): Promise<string> {
  // Try X-Organization-Id header first
  const orgHeader = request.headers.get('X-Organization-Id')
  if (orgHeader) {
    return orgHeader
  }

  // Fall back to JWT token
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authentication required')
  }

  const token = authHeader.replace('Bearer ', '')
  const payload = await jwtService.verify(token)

  if (!payload.organization_id) {
    throw new Error('Organization context missing')
  }

  return payload.organization_id
}

// GET /api/v1/entities/[id] - Get single entity
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const organizationId = await getOrganizationContext(request)

    const { data: entity, error } = await supabaseAdmin
      .from('core_entities')
      .select('*')
      .eq('id', params.id)
      .eq('organization_id', organizationId)
      .single()

    if (error || !entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Get dynamic data
    const { data: dynamicData } = await supabaseAdmin
      .from('core_dynamic_data')
      .select('field_name, field_value')
      .eq('entity_id', entity.id)

    // Convert dynamic data to metadata object
    const metadata: Record<string, any> = {}
    if (dynamicData) {
      dynamicData.forEach(item => {
        try {
          // Try to parse JSON values
          metadata[item.field_name] = JSON.parse(item.field_value)
        } catch {
          // If not JSON, use as string
          metadata[item.field_name] = item.field_value
        }
      })
    }

    return NextResponse.json({
      ...entity,
      metadata,
      // Support both 'metadata' and 'data' for compatibility
      data: metadata
    })
  } catch (error) {
    console.error('Get entity error:', error)
    return NextResponse.json({ error: 'Failed to fetch entity' }, { status: 500 })
  }
}

// PATCH /api/v1/entities/[id] - Update entity
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const organizationId = await getOrganizationContext(request)
    const body = await request.json()

    // Extract metadata/data fields
    const { metadata, data, ...entityFields } = body

    // Update entity fields if provided
    if (Object.keys(entityFields).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('core_entities')
        .update({
          ...entityFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('organization_id', organizationId)

      if (updateError) {
        console.error('Update entity error:', updateError)
        return NextResponse.json({ error: 'Failed to update entity' }, { status: 500 })
      }
    }

    // Update dynamic data if provided
    const dynamicFields = metadata || data
    if (dynamicFields && Object.keys(dynamicFields).length > 0) {
      for (const [key, value] of Object.entries(dynamicFields)) {
        // Check if field exists
        const { data: existing } = await supabaseAdmin
          .from('core_dynamic_data')
          .select('id')
          .eq('entity_id', params.id)
          .eq('field_name', key)
          .single()

        const fieldValue = typeof value === 'object' ? JSON.stringify(value) : String(value)

        if (existing) {
          // Update existing field
          await supabaseAdmin
            .from('core_dynamic_data')
            .update({
              field_value: fieldValue,
              updated_at: new Date().toISOString()
            })
            .eq('entity_id', params.id)
            .eq('field_name', key)
        } else {
          // Insert new field
          await supabaseAdmin.from('core_dynamic_data').insert({
            entity_id: params.id,
            organization_id: organizationId,
            field_name: key,
            field_value: fieldValue,
            field_type: typeof value === 'object' ? 'json' : 'text'
          })
        }
      }
    }

    // Return updated entity
    return GET(request, { params })
  } catch (error) {
    console.error('Update entity error:', error)
    return NextResponse.json({ error: 'Failed to update entity' }, { status: 500 })
  }
}
