import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSchema } from '@/lib/v2/validation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const schema = {
  type: 'object',
  properties: {
    organization_id: { type: 'string', format: 'uuid' },
    relationship_id: { type: 'string', format: 'uuid' }
  },
  required: ['organization_id', 'relationship_id'],
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
    const { data, error } = await supabase.rpc('hera_relationship_read_v1', {
      p_organization_id: payload.organization_id,
      p_relationship_id: payload.relationship_id
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || 'Relationship not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}