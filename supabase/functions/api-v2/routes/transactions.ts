// HERA v2.3 API Gateway - Transaction Routes
// Smart Code: HERA.API.V2.ROUTES.TRANSACTIONS.v1

import type { RequestContext } from '../types/middleware.ts';
import { createServiceRoleClient, setGatewayContext } from '../lib/supabase-client.ts';
import { createSuccessResponse, createErrorResponse } from '../lib/utils.ts';

/**
 * Handle transaction CRUD operations
 */
export async function handleTransactions(req: Request, context: RequestContext): Promise<Response> {
  try {
    const method = req.method.toUpperCase();
    
    switch (method) {
      case 'GET':
        return await getTransactions(req, context);
      case 'POST':
        return await createTransaction(req, context);
      case 'PUT':
      case 'PATCH':
        return await updateTransaction(req, context);
      case 'DELETE':
        return await deleteTransaction(req, context);
      default:
        throw new Error('405:Method not allowed');
    }
    
  } catch (error) {
    console.error('Transaction operation error:', error);
    return createErrorResponse(error, context.requestId);
  }
}

/**
 * Get transactions with filtering and pagination
 */
async function getTransactions(req: Request, context: RequestContext): Promise<Response> {
  const url = new URL(req.url);
  const transactionType = url.searchParams.get('transaction_type');
  const transactionStatus = url.searchParams.get('transaction_status');
  const sourceEntityId = url.searchParams.get('source_entity_id');
  const targetEntityId = url.searchParams.get('target_entity_id');
  const smartCode = url.searchParams.get('smart_code');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const dateFrom = url.searchParams.get('date_from');
  const dateTo = url.searchParams.get('date_to');
  
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'hera_txn_crud_v1', 'api_v2_gateway');
  
  const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: context.actor.id,
    p_organization_id: context.orgContext.org_id,
    p_transaction: null,
    p_lines: [],
    p_options: {
      transaction_type: transactionType,
      transaction_status: transactionStatus,
      source_entity_id: sourceEntityId,
      target_entity_id: targetEntityId,
      smart_code: smartCode,
      limit,
      offset,
      date_from: dateFrom,
      date_to: dateTo,
      include_lines: true
    }
  });
  
  if (error) {
    throw new Error(`500:Transaction read failed: ${error.message}`);
  }
  
  return createSuccessResponse(
    result || { items: [], total: 0 },
    context.requestId,
    {
      actor_id: context.actor.id,
      organization_id: context.orgContext.org_id,
      filters: { 
        transaction_type: transactionType,
        transaction_status: transactionStatus,
        source_entity_id: sourceEntityId,
        target_entity_id: targetEntityId,
        smart_code: smartCode,
        date_range: { from: dateFrom, to: dateTo }
      },
      pagination: { limit, offset }
    }
  );
}

/**
 * Create new transaction
 */
async function createTransaction(req: Request, context: RequestContext): Promise<Response> {
  const body = await req.json();
  
  // Validate required fields
  if (!body.transaction_data?.transaction_type) {
    throw new Error('400:Missing required field: transaction_data.transaction_type');
  }
  
  if (!body.transaction_data?.smart_code) {
    throw new Error('400:Missing required field: transaction_data.smart_code');
  }
  
  // Validate GL balance if this is a financial transaction
  if (body.lines && Array.isArray(body.lines)) {
    const glLines = body.lines.filter((line: any) => 
      line.smart_code && line.smart_code.includes('.GL.')
    );
    
    if (glLines.length > 0) {
      const balanceCheck = validateGLBalance(glLines);
      if (!balanceCheck.isBalanced) {
        throw new Error(`400:GL transactions not balanced: ${balanceCheck.details}`);
      }
    }
  }
  
  // Ensure organization_id matches context
  if (body.organization_id && body.organization_id !== context.orgContext.org_id) {
    throw new Error('403:Organization ID in payload must match authenticated context');
  }
  
  // Set organization_id from context
  body.organization_id = context.orgContext.org_id;
  if (body.transaction_data) {
    body.transaction_data.organization_id = context.orgContext.org_id;
  }
  
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'hera_txn_crud_v1', 'api_v2_gateway');
  
  const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: context.actor.id,
    p_organization_id: context.orgContext.org_id,
    p_transaction: body.transaction_data,
    p_lines: body.lines || [],
    p_options: body.options || {}
  });
  
  if (error) {
    throw new Error(`400:Transaction creation failed: ${error.message}`);
  }
  
  return createSuccessResponse(
    result,
    context.requestId,
    {
      operation: 'CREATE',
      transaction_type: body.transaction_data.transaction_type,
      smart_code: body.transaction_data.smart_code,
      line_count: body.lines?.length || 0,
      actor_id: context.actor.id,
      organization_id: context.orgContext.org_id
    }
  );
}

/**
 * Update existing transaction
 */
async function updateTransaction(req: Request, context: RequestContext): Promise<Response> {
  const body = await req.json();
  
  // Validate required fields
  if (!body.transaction_data?.transaction_id) {
    throw new Error('400:Missing required field: transaction_data.transaction_id');
  }
  
  // Validate GL balance if lines are being updated
  if (body.lines && Array.isArray(body.lines)) {
    const glLines = body.lines.filter((line: any) => 
      line.smart_code && line.smart_code.includes('.GL.')
    );
    
    if (glLines.length > 0) {
      const balanceCheck = validateGLBalance(glLines);
      if (!balanceCheck.isBalanced) {
        throw new Error(`400:GL transactions not balanced: ${balanceCheck.details}`);
      }
    }
  }
  
  // Ensure organization_id matches context
  if (body.organization_id && body.organization_id !== context.orgContext.org_id) {
    throw new Error('403:Organization ID in payload must match authenticated context');
  }
  
  // Set organization_id from context
  body.organization_id = context.orgContext.org_id;
  if (body.transaction_data) {
    body.transaction_data.organization_id = context.orgContext.org_id;
  }
  
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'hera_txn_crud_v1', 'api_v2_gateway');
  
  const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'UPDATE',
    p_actor_user_id: context.actor.id,
    p_organization_id: context.orgContext.org_id,
    p_transaction: body.transaction_data,
    p_lines: body.lines || [],
    p_options: body.options || {}
  });
  
  if (error) {
    throw new Error(`400:Transaction update failed: ${error.message}`);
  }
  
  return createSuccessResponse(
    result,
    context.requestId,
    {
      operation: 'UPDATE',
      transaction_id: body.transaction_data.transaction_id,
      line_count: body.lines?.length || 0,
      actor_id: context.actor.id,
      organization_id: context.orgContext.org_id
    }
  );
}

/**
 * Delete transaction
 */
async function deleteTransaction(req: Request, context: RequestContext): Promise<Response> {
  const body = await req.json();
  
  // Validate required fields
  if (!body.transaction_data?.transaction_id) {
    throw new Error('400:Missing required field: transaction_data.transaction_id');
  }
  
  // Ensure organization_id matches context
  if (body.organization_id && body.organization_id !== context.orgContext.org_id) {
    throw new Error('403:Organization ID in payload must match authenticated context');
  }
  
  // Set organization_id from context
  body.organization_id = context.orgContext.org_id;
  if (body.transaction_data) {
    body.transaction_data.organization_id = context.orgContext.org_id;
  }
  
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'hera_txn_crud_v1', 'api_v2_gateway');
  
  const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'DELETE',
    p_actor_user_id: context.actor.id,
    p_organization_id: context.orgContext.org_id,
    p_transaction: body.transaction_data,
    p_lines: [],
    p_options: body.options || {}
  });
  
  if (error) {
    throw new Error(`400:Transaction deletion failed: ${error.message}`);
  }
  
  return createSuccessResponse(
    result,
    context.requestId,
    {
      operation: 'DELETE',
      transaction_id: body.transaction_data.transaction_id,
      actor_id: context.actor.id,
      organization_id: context.orgContext.org_id
    }
  );
}

/**
 * Handle transaction approval workflow
 */
export async function handleTransactionApproval(req: Request, context: RequestContext): Promise<Response> {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.transaction_id) {
      throw new Error('400:Missing required field: transaction_id');
    }
    
    if (!body.action || !['approve', 'reject', 'cancel'].includes(body.action)) {
      throw new Error('400:Invalid action. Must be: approve, reject, or cancel');
    }
    
    const supabase = createServiceRoleClient();
    await setGatewayContext(supabase, 'hera_txn_approval_v1', 'api_v2_gateway');
    
    const { data: result, error } = await supabase.rpc('hera_txn_approval_v1', {
      p_actor_user_id: context.actor.id,
      p_organization_id: context.orgContext.org_id,
      p_transaction_id: body.transaction_id,
      p_action: body.action,
      p_approval_notes: body.notes || '',
      p_options: body.options || {}
    });
    
    if (error) {
      throw new Error(`400:Transaction approval failed: ${error.message}`);
    }
    
    return createSuccessResponse(
      result,
      context.requestId,
      {
        operation: 'APPROVE_TRANSACTION',
        transaction_id: body.transaction_id,
        action: body.action,
        actor_id: context.actor.id,
        organization_id: context.orgContext.org_id
      }
    );
    
  } catch (error) {
    console.error('Transaction approval error:', error);
    return createErrorResponse(error, context.requestId);
  }
}

/**
 * Handle transaction posting (GL integration)
 */
export async function handleTransactionPosting(req: Request, context: RequestContext): Promise<Response> {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.transaction_id) {
      throw new Error('400:Missing required field: transaction_id');
    }
    
    const supabase = createServiceRoleClient();
    await setGatewayContext(supabase, 'hera_txn_posting_v1', 'api_v2_gateway');
    
    const { data: result, error } = await supabase.rpc('hera_txn_posting_v1', {
      p_actor_user_id: context.actor.id,
      p_organization_id: context.orgContext.org_id,
      p_transaction_id: body.transaction_id,
      p_posting_date: body.posting_date || new Date().toISOString().split('T')[0],
      p_options: body.options || {}
    });
    
    if (error) {
      throw new Error(`400:Transaction posting failed: ${error.message}`);
    }
    
    return createSuccessResponse(
      result,
      context.requestId,
      {
        operation: 'POST_TRANSACTION',
        transaction_id: body.transaction_id,
        posting_date: body.posting_date,
        actor_id: context.actor.id,
        organization_id: context.orgContext.org_id
      }
    );
    
  } catch (error) {
    console.error('Transaction posting error:', error);
    return createErrorResponse(error, context.requestId);
  }
}

/**
 * Validate GL balance for transaction lines
 */
function validateGLBalance(lines: any[]): { isBalanced: boolean; details: string } {
  const totals = new Map<string, { dr: number; cr: number }>();
  
  for (const line of lines) {
    const currency = line.transaction_currency_code || line.currency || 'DOC';
    const side = line.line_data?.side;
    const amount = Number(line.line_amount || 0);
    
    if (!['DR', 'CR'].includes(side)) {
      continue; // Skip non-GL lines
    }
    
    const t = totals.get(currency) || { dr: 0, cr: 0 };
    if (side === 'DR') {
      t.dr += amount;
    } else {
      t.cr += amount;
    }
    totals.set(currency, t);
  }
  
  const unbalancedCurrencies: string[] = [];
  
  for (const [currency, t] of totals) {
    const diff = Math.abs(t.dr - t.cr);
    if (diff > 0.01) { // Allow for small rounding differences
      unbalancedCurrencies.push(`${currency}: DR ${t.dr.toFixed(2)} ≠ CR ${t.cr.toFixed(2)}`);
    }
  }
  
  return {
    isBalanced: unbalancedCurrencies.length === 0,
    details: unbalancedCurrencies.join(', ')
  };
}

/**
 * Handle transaction search with advanced filtering
 */
export async function handleTransactionSearch(req: Request, context: RequestContext): Promise<Response> {
  try {
    const body = await req.json();
    
    const supabase = createServiceRoleClient();
    await setGatewayContext(supabase, 'hera_txn_search_v1', 'api_v2_gateway');
    
    const { data: result, error } = await supabase.rpc('hera_txn_search_v1', {
      p_actor_user_id: context.actor.id,
      p_organization_id: context.orgContext.org_id,
      p_transaction_type: body.transaction_type,
      p_search_text: body.search_text,
      p_amount_min: body.amount_min,
      p_amount_max: body.amount_max,
      p_date_from: body.date_from,
      p_date_to: body.date_to,
      p_entity_ids: body.entity_ids || [],
      p_filters: body.filters || {},
      p_options: {
        limit: body.limit || 100,
        offset: body.offset || 0,
        sort_by: body.sort_by || 'transaction_date',
        sort_order: body.sort_order || 'desc',
        include_lines: body.include_lines !== false
      }
    });
    
    if (error) {
      throw new Error(`500:Transaction search failed: ${error.message}`);
    }
    
    return createSuccessResponse(
      result || { items: [], total: 0 },
      context.requestId,
      {
        search_parameters: {
          transaction_type: body.transaction_type,
          search_text: body.search_text,
          amount_range: { min: body.amount_min, max: body.amount_max },
          date_range: { from: body.date_from, to: body.date_to }
        },
        organization_id: context.orgContext.org_id,
        actor_id: context.actor.id
      }
    );
    
  } catch (error) {
    console.error('Transaction search error:', error);
    return createErrorResponse(error, context.requestId);
  }
}