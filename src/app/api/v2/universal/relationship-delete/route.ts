import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateSchema } from '@/lib/v2/validation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const schema = {
  type: 'object',
  properties: {
    organization_id: { type: 'string', format: 'uuid' },
    relationship_id: { type: 'string', format: 'uuid' },
    expiration_date: { type: 'string', format: 'date-time' }
  },
  required: ['organization_id', 'relationship_id'],
  additionalProperties: false
}

async function handleDelete(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const payload: any = {
      organization_id: searchParams.get('organization_id'),
      relationship_id: searchParams.get('relationship_id')
    }

    // Only add expiration_date if provided
    const expiration_date = searchParams.get('expiration_date')
    if (expiration_date) {
      payload.expiration_date = expiration_date
    }

    console.log('[relationship-delete] 🗑️ DELETE request:', {
      url: request.url,
      params: Object.fromEntries(searchParams.entries()),
      payload
    })

    // Validate payload (but skip format validation for string params)
    if (!payload.organization_id || !payload.relationship_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: organization_id and relationship_id' },
        { status: 400 }
      )
    }

    // Call database function (soft delete)
    const { data, error } = await supabase.rpc('hera_relationship_delete_v1', {
      p_organization_id: payload.organization_id,
      p_relationship_id: payload.relationship_id,
      p_expiration_date: payload.expiration_date || null
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || 'Relationship not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  return handleDelete(request)
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Validate payload
    const validation = await validateSchema(payload, schema)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors?.[0]?.message || 'Invalid payload' },
        { status: 400 }
      )
    }

    // Call database function (soft delete)
    const { data, error } = await supabase.rpc('hera_relationship_delete_v1', {
      p_organization_id: payload.organization_id,
      p_relationship_id: payload.relationship_id,
      p_expiration_date: payload.expiration_date || null
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || 'Relationship not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
