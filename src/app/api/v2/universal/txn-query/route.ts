import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSchema, queryParamsSchema } from '@/lib/v2/validation';
import { withTxnLogging } from '@/lib/v2/logging/structured-logger';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schema for transaction query payload
const txnQuerySchema = z.object({
  organization_id: z.string().uuid(),
  source_entity_id: z.string().uuid().optional(),
  target_entity_id: z.string().uuid().optional(),
  transaction_type: z.string().optional(),
  smart_code_like: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
  offset: z.number().min(0).optional().default(0),
  include_lines: z.boolean().optional().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Validate payload
    const validation = validateSchema(txnQuerySchema, payload);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          validation_errors: validation.errors
        },
        { status: 400 }
      );
    }

    const validatedPayload = validation.data!;

    // Build filters object
    const filters: Record<string, any> = {};
    if (validatedPayload.source_entity_id) filters.source_entity_id = validatedPayload.source_entity_id;
    if (validatedPayload.target_entity_id) filters.target_entity_id = validatedPayload.target_entity_id;
    if (validatedPayload.transaction_type) filters.transaction_type = validatedPayload.transaction_type;
    if (validatedPayload.smart_code_like) filters.smart_code_like = validatedPayload.smart_code_like;
    if (validatedPayload.date_from) filters.date_from = validatedPayload.date_from;
    if (validatedPayload.date_to) filters.date_to = validatedPayload.date_to;
    if (validatedPayload.limit) filters.limit = validatedPayload.limit;
    if (validatedPayload.offset) filters.offset = validatedPayload.offset;

    // Call database function
    const { data, error } = await supabase.rpc('hera_txn_query_v1', {
      p_org_id: validatedPayload.organization_id,
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
    if (validatedPayload.include_lines && transactions.length > 0) {
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
        .eq('organization_id', validatedPayload.organization_id)
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