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
    entity_id: { type: 'string', format: 'uuid' },
    side: { type: 'string', enum: ['either', 'from', 'to'] },
    relationship_type: { type: 'string' },
    active_only: { type: 'boolean' },
    effective_from: { type: 'string', format: 'date-time' },
    effective_to: { type: 'string', format: 'date-time' },
    limit: { type: 'integer', minimum: 1, maximum: 1000 },
    offset: { type: 'integer', minimum: 0 }
  },
  required: ['organization_id'],
  additionalProperties: false
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

    // Call database function with defaults
    const { data, error } = await supabase.rpc('hera_relationship_query_v1', {
      p_organization_id: payload.organization_id,
      p_entity_id: payload.entity_id || null,
      p_side: payload.side || 'either',
      p_relationship_type: payload.relationship_type || null,
      p_active_only: payload.active_only !== false, // Default true
      p_effective_from: payload.effective_from || null,
      p_effective_to: payload.effective_to || null,
      p_limit: payload.limit || 100,
      p_offset: payload.offset || 0
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || { success: true, data: [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
