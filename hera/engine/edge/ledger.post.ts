/**
 * Edge Function: ledger.post
 * Posts journal entries to the ledger (persists to database)
 */

import { LedgerRequestSchema } from '../contracts/dto';
import { ok, makeError } from '../contracts/errors';
import { toHttpResponse } from '../contracts/http';
import { requireDims, assertBalanced, guardIdempotency, validateSmartCode } from '../contracts/validation';

// Mock idempotency check function (would be replaced with actual DB check)
async function checkExistingTransaction(externalRef: string): Promise<string | null> {
  // TODO: Implement actual database check
  // For now, return null (no existing transaction)
  return null;
}

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

    // Don't allow simulation flag in post endpoint
    if (data.simulate) {
      return new Response(
        JSON.stringify(
          toHttpResponse(
            makeError('E_GUARDRAIL', 'Use /ledger/simulate endpoint for simulations')
          ).body
        ),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    // Check idempotency
    const idempotencyResult = await guardIdempotency(
      checkExistingTransaction,
      data.external_reference
    );
    
    if (!idempotencyResult.ok) {
      // Special handling for idempotent requests
      if (idempotencyResult.error.code === 'E_IDEMPOTENT' && 
          idempotencyResult.error.context?.transaction_id) {
        return new Response(
          JSON.stringify(
            toHttpResponse(
              ok(
                { transaction_id: idempotencyResult.error.context.transaction_id },
                { idempotent: true }
              )
            ).body
          ),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Other idempotency errors
      const response = toHttpResponse(idempotencyResult);
      return new Response(
        JSON.stringify(response.body),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Implement actual posting logic
    // For now, return a mock transaction ID
    const mockTransactionId = crypto.randomUUID();

    return new Response(
      JSON.stringify(
        toHttpResponse(
          ok({ transaction_id: mockTransactionId })
        ).body
      ),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Handle upstream errors specially
    if (error instanceof Error && error.message.includes('database')) {
      return new Response(
        JSON.stringify(
          toHttpResponse(
            makeError('E_UPSTREAM', 'Database connection failed', {
              details: { error: error.message }
            })
          ).body
        ),
        { 
          status: 502, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '5'
          } 
        }
      );
    }

    // Generic internal error
    return new Response(
      JSON.stringify(
        toHttpResponse(
          makeError('E_INTERNAL', 'An unexpected error occurred', {
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          })
        ).body
      ),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': '5'
        } 
      }
    );
  }
}