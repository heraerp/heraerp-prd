import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSchema } from '@/lib/v2/validation';
import { withTxnLogging } from '@/lib/v2/logging/structured-logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const schema = {
  type: 'object',
  properties: {
    organization_id: { type: 'string', format: 'uuid' },
    source_entity_id: { type: 'string', format: 'uuid' },
    target_entity_id: { type: 'string', format: 'uuid' },
    transaction_type: { type: 'string' },
    smart_code_like: { type: 'string' },
    date_from: { type: 'string', format: 'date-time' },
    date_to: { type: 'string', format: 'date-time' },
    limit: { type: 'integer', minimum: 1, maximum: 1000 },
    offset: { type: 'integer', minimum: 0 },
    include_lines: { type: 'boolean' }
  },
  required: ['organization_id'],
  additionalProperties: false
};

export const POST = withTxnLogging('txn-query', async (payload, logger) => {
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

    // Build filters object
    const filters: Record<string, any> = {};
    if (payload.source_entity_id) filters.source_entity_id = payload.source_entity_id;
    if (payload.target_entity_id) filters.target_entity_id = payload.target_entity_id;
    if (payload.transaction_type) filters.transaction_type = payload.transaction_type;
    if (payload.smart_code_like) filters.smart_code_like = payload.smart_code_like;
    if (payload.date_from) filters.date_from = payload.date_from;
    if (payload.date_to) filters.date_to = payload.date_to;
    if (payload.limit) filters.limit = payload.limit;
    if (payload.offset) filters.offset = payload.offset;

    // Call database function
    const { data, error } = await supabase.rpc('hera_txn_query_v1', {
      p_org_id: payload.organization_id,
      p_filters: filters
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    let transactions = data?.data || [];

    // If include_lines is requested, fetch lines for all transactions in ONE query
    if (payload.include_lines && transactions.length > 0) {
      const transactionIds = transactions.map((txn: any) => txn.id);

      // Single query to fetch all lines for all transactions
      const { data: linesData, error: linesError } = await supabase
        .from('universal_transaction_lines')
        .select(`
          id,
          transaction_id,
          line_number,
          line_type,
          line_entity_id,
          quantity,
          unit_price,
          line_amount,
          discount_amount,
          tax_amount,
          total_amount,
          currency,
          dr_cr,
          smart_code,
          description,
          status,
          metadata,
          ai_confidence,
          created_at,
          updated_at,
          version
        `)
        .eq('organization_id', payload.organization_id)
        .in('transaction_id', transactionIds)
        .order('transaction_id, line_number'); // ORDER BY transaction_id, line_number for grouping

      if (!linesError && linesData) {
        // Group lines by transaction_id (optimized grouping)
        const linesByTxn = linesData.reduce((acc: Record<string, any[]>, line: any) => {
          if (!acc[line.transaction_id]) {
            acc[line.transaction_id] = [];
          }
          acc[line.transaction_id].push(line);
          return acc;
        }, {});

        // Attach lines to each transaction (maintains order)
        transactions = transactions.map((txn: any) => ({
          ...txn,
          lines: linesByTxn[txn.id] || []
        }));
      }
    }

    return NextResponse.json({
      api_version: 'v2',
      transactions,
      total: data?.total || 0,
      limit: data?.limit || 100,
      offset: data?.offset || 0
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}