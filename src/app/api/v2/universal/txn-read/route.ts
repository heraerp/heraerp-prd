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
    organization_id: { type: 'string', format: 'uuid' },
    transaction_id: { type: 'string', format: 'uuid' },
    include_lines: { type: 'boolean' }
  },
  required: ['organization_id', 'transaction_id'],
  additionalProperties: false
}

export const POST = withTxnLogging('txn-read', async (payload, logger) => {
  // Validate payload
  const validation = await validateSchema(payload, schema)
  if (!validation.valid) {
    logger.logValidationFailed(validation.errors?.[0]?.message || 'Invalid payload')
    throw new Error(validation.errors?.[0]?.message || 'Invalid payload')
  }

  // Call database function
  const { data, error } = await supabase.rpc('hera_txn_read_v1', {
    p_org_id: payload.organization_id,
    p_transaction_id: payload.transaction_id,
    p_include_lines: payload.include_lines !== false // Default true
  })

  if (error) {
    // Handle specific error cases
    if (error.message.includes('TXN_NOT_FOUND')) {
      throw new Error('Transaction not found')
    }

    if (error.message.includes('ORG_MISMATCH')) {
      throw new Error('Transaction not found in organization')
    }

    throw new Error(error.message)
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Transaction not found')
  }

  return {
    transaction: data.data
  }
})
