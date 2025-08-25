/**
 * Edge Function: ledger.simulate
 * Simulates journal entries without persisting to database
 */

import { LedgerRequestSchema } from '../contracts/dto';
import { ok, makeError } from '../contracts/errors';
import { toHttpResponse } from '../contracts/http';
import { requireDims, assertBalanced, validateSmartCode } from '../contracts/validation';

export async function handler(request: Request): Promise<Response> {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input against DTO schema
    const parse = LedgerRequestSchema.safeParse(body);
    if (!parse.success) {
      return new Response(
        JSON.stringify(
          toHttpResponse(
            makeError('E_GUARDRAIL', 'Invalid request', {
              details: parse.error.flatten()
            })
          ).body
        ),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = parse.data;

    // Validate organization ID is provided
    if (!data.organization_id) {
      return new Response(
        JSON.stringify(
          toHttpResponse(
            makeError('E_ORG_REQUIRED', 'Organization ID is required')
          ).body
        ),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate smart code format
    const smartCodeResult = validateSmartCode(data.event_smart_code);
    if (!smartCodeResult.ok) {
      return new Response(
        JSON.stringify(toHttpResponse(smartCodeResult).body),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Implement actual simulation logic
    // For now, return a mock response
    const mockResponse = {
      header: {
        organization_id: data.organization_id,
        transaction_type: 'GL_JOURNAL' as const,
        smart_code: data.event_smart_code,
        transaction_currency_code: data.currency,
        base_currency_code: data.currency,
        posting_period_code: null,
        business_context: data.business_context,
        external_reference: data.external_reference || null,
        total_amount: data.total_amount
      },
      lines: [
        {
          entity_id: '00000000-0000-0000-0000-000000000001', // Mock debit account
          line_type: 'debit' as const,
          line_amount: data.total_amount,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1'
        },
        {
          entity_id: '00000000-0000-0000-0000-000000000002', // Mock credit account
          line_type: 'credit' as const,
          line_amount: data.total_amount,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1'
        }
      ]
    };

    // Validate the simulated journal is balanced
    const balanceResult = assertBalanced(mockResponse.lines);
    if (!balanceResult.ok) {
      return new Response(
        JSON.stringify(toHttpResponse(balanceResult).body),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(toHttpResponse(ok(mockResponse)).body),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify(
        toHttpResponse(
          makeError('E_INTERNAL', 'An unexpected error occurred', {
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          })
        ).body
      ),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}