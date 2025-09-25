import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSchema } from '@/lib/v2/validation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const rowSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    from_entity_id: { type: 'string', format: 'uuid' },
    to_entity_id: { type: 'string', format: 'uuid' },
    relationship_type: { type: 'string' },
    relationship_subtype: { type: 'string' },
    relationship_name: { type: 'string' },
    relationship_code: { type: 'string' },
    smart_code: {
      type: 'string',
      pattern: '^HERA\\.[A-Z]+\\.[A-Z]+(?:\\.[A-Z0-9]+)*\\.v\\d+$'
    },
    is_active: { type: 'boolean' },
    effective_date: { type: 'string', format: 'date-time' },
    expiration_date: { type: 'string', format: 'date-time' },
    relationship_data: { type: 'object' },
    metadata: { type: 'object' }
  },
  required: ['from_entity_id', 'to_entity_id', 'relationship_type', 'smart_code'],
  additionalProperties: false
};

const schema = {
  type: 'object',
  properties: {
    organization_id: { type: 'string', format: 'uuid' },
    rows: {
      type: 'array',
      items: rowSchema,
      minItems: 1,
      maxItems: 1000
    }
  },
  required: ['organization_id', 'rows'],
  additionalProperties: false
};

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Validate payload
    const validation = await validateSchema(payload, schema);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors?.[0]?.message || 'Invalid payload' },
        { status: 400 }
      );
    }

    // Call database function
    const { data, error } = await supabase.rpc('hera_relationship_upsert_batch_v1', {
      p_organization_id: payload.organization_id,
      p_rows: payload.rows
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Return with appropriate status code
    const status = data?.status || (data?.success ? 200 : 207);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}