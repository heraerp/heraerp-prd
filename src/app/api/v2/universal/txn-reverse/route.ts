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
    original_transaction_id: { type: 'string', format: 'uuid' },
    smart_code: {
      type: 'string',
      pattern: '^HERA\\.[A-Z0-9]+(\\.([A-Z0-9]+)){4,}\\.V[0-9]+$'
    },
    reason: { type: 'string', minLength: 1 }
  },
  required: ['organization_id', 'original_transaction_id', 'smart_code', 'reason'],
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
    const { data, error } = await supabase.rpc('hera_txn_reverse_v1', {
      p_org_id: payload.organization_id,
      p_original_txn_id: payload.original_transaction_id,
      p_reason: payload.reason.trim(),
      p_reversal_smart_code: payload.smart_code
    });

    if (error) {
      console.error('Database error:', error);

      // Handle specific error cases
      if (error.message.includes('TXN_NOT_FOUND')) {
        return NextResponse.json(
          { success: false, error: 'Original transaction not found' },
          { status: 404 }
        );
      }

      if (error.message.includes('ORG_MISMATCH')) {
        return NextResponse.json(
          { success: false, error: 'Original transaction not found in organization' },
          { status: 404 }
        );
      }

      if (error.message.includes('INVALID_SMART_CODE')) {
        return NextResponse.json(
          { success: false, error: 'Invalid smart code format' },
          { status: 400 }
        );
      }

      if (error.message.includes('REVERSAL_REASON_REQUIRED')) {
        return NextResponse.json(
          { success: false, error: 'Reversal reason is required' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || 'Reversal failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      api_version: 'v2',
      reversal_transaction_id: data.data.reversal_transaction_id,
      original_transaction_id: data.data.original_transaction_id,
      lines_reversed: data.data.lines_reversed,
      reversal_reason: data.data.reversal_reason
    }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}