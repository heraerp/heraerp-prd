import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateSchema } from '@/lib/v2/validation'
import { withTxnLogging } from '@/lib/v2/logging/structured-logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const schema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'QUERY', 'EMIT', 'REVERSE', 'VOID', 'VALIDATE']
    },
    actor_user_id: { type: 'string', format: 'uuid' },
    organization_id: { type: 'string', format: 'uuid' },
    payload: { type: 'object' }
  },
  required: ['action', 'actor_user_id', 'organization_id', 'payload'],
  additionalProperties: false
}

/**
 * Universal Transaction CRUD Orchestrator API
 *
 * Wraps hera_txn_crud_v1 RPC function for all transaction operations
 *
 * Actions:
 * - CREATE: Create transaction with header + lines
 * - READ: Read single transaction
 * - UPDATE: Update transaction fields
 * - DELETE: Hard delete empty draft
 * - QUERY: List transactions with filters
 * - EMIT: Create event-based transaction
 * - REVERSE: Create reversal transaction
 * - VOID: Soft delete with reason
 * - VALIDATE: Validate transaction
 */
export const POST = withTxnLogging('txn-crud', async (payload, logger) => {
  // Validate payload
  const validation = await validateSchema(payload, schema)
  if (!validation.valid) {
    logger.logValidationFailed(validation.errors?.[0]?.message || 'Invalid payload')
    throw new Error(validation.errors?.[0]?.message || 'Invalid payload')
  }

  const { action, actor_user_id, organization_id, payload: actionPayload } = payload

  logger.logInfo(`Transaction ${action} operation`, {
    action,
    organization_id,
    actor_user_id,
    transaction_id: actionPayload.transaction_id
  })

  // Call orchestrator RPC function
  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: action,
    p_actor_user_id: actor_user_id,
    p_organization_id: organization_id,
    p_payload: actionPayload
  })

  if (error) {
    logger.logError(`Transaction ${action} RPC error`, error)

    // Handle specific error cases
    if (error.message.includes('SMART_CODE_INVALID')) {
      throw new Error('Invalid smart code format - must match HERA DNA pattern')
    }

    if (error.message.includes('TXN_NOT_FOUND')) {
      throw new Error('Transaction not found')
    }

    if (error.message.includes('ORG_MISMATCH')) {
      throw new Error('Transaction not found in organization')
    }

    if (error.message.includes('GL_IMBALANCE')) {
      throw new Error('GL transaction is not balanced - debits must equal credits')
    }

    if (error.message.includes('GL_LINE_SIDE_REQUIRED')) {
      throw new Error('GL lines must include line_data.side (DR or CR)')
    }

    throw new Error(error.message)
  }

  // Check function-level errors
  if (!data?.success) {
    logger.logError(`Transaction ${action} function error`, {
      error: data?.error,
      error_detail: data?.error_detail,
      error_hint: data?.error_hint
    })

    throw new Error(data?.error || `Transaction ${action} operation failed`)
  }

  logger.logSuccess(`Transaction ${action} successful`, {
    transaction_id: data.transaction_id,
    action: data.action
  })

  // Return response based on action
  switch (action) {
    case 'CREATE':
    case 'EMIT':
      return {
        success: true,
        transaction_id: data.transaction_id,
        transaction: data.data,
        action: data.action
      }

    case 'READ':
      return {
        success: true,
        transaction_id: data.transaction_id,
        transaction: data.data,
        action: data.action
      }

    case 'QUERY':
      return {
        success: true,
        transactions: data.data,
        count: data.data?.length || 0,
        action: data.action
      }

    case 'UPDATE':
    case 'VOID':
    case 'REVERSE':
      return {
        success: true,
        transaction_id: data.transaction_id,
        transaction: data.data,
        action: data.action
      }

    case 'DELETE':
      return {
        success: true,
        transaction_id: data.transaction_id,
        action: data.action
      }

    case 'VALIDATE':
      return {
        success: true,
        valid: true,
        transaction_id: data.transaction_id,
        action: data.action
      }

    default:
      return {
        success: true,
        data: data.data,
        action: data.action
      }
  }
})
