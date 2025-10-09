import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify-auth'
import { assertSmartCode } from '@/lib/universal/smartcode'
import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * PUT /api/v2/transactions/[id]
 * Updates an existing transaction (primarily metadata and status)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth verification
    const authResult = await verifyAuth(request)
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const transactionId = params.id
    if (!transactionId) {
      return NextResponse.json({ error: 'transaction_id required' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    // Organization isolation enforcement
    const reqOrgId = body.p_organization_id || body.organization_id
    if (!reqOrgId || reqOrgId !== authResult.organizationId) {
      return NextResponse.json(
        { error: 'forbidden', details: 'organization_id mismatch' },
        { status: 403 }
      )
    }

    // Create Supabase client with service role for updates
    const supabase = createServerClient()

    // First verify the transaction belongs to the organization
    const { data: existing, error: fetchError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('organization_id', authResult.organizationId)
      .single()

    if (fetchError || !existing) {
      console.error('[Transaction PUT] Transaction not found:', { transactionId, fetchError })
      return NextResponse.json(
        { error: 'not_found', details: 'Transaction not found or access denied' },
        { status: 404 }
      )
    }

    // Build update object
    const updateData: any = {}

    // Update basic fields if provided
    if (body.p_transaction_date || body.transaction_date) {
      updateData.transaction_date = body.p_transaction_date || body.transaction_date
    }
    if (body.p_source_entity_id || body.source_entity_id) {
      updateData.source_entity_id = body.p_source_entity_id || body.source_entity_id
    }
    if (body.p_target_entity_id !== undefined) {
      updateData.target_entity_id = body.p_target_entity_id || body.target_entity_id || null
    }
    if (body.p_total_amount !== undefined || body.total_amount !== undefined) {
      updateData.total_amount = body.p_total_amount || body.total_amount
    }
    if (body.p_currency_code || body.currency_code) {
      updateData.currency_code = body.p_currency_code || body.currency_code
    }

    // Update transaction_status if provided (CRITICAL for appointments)
    if (body.p_status || body.status) {
      updateData.transaction_status = body.p_status || body.status
    }

    // Update metadata - merge with existing
    if (body.p_metadata || body.metadata) {
      const newMetadata = body.p_metadata || body.metadata
      updateData.metadata = {
        ...existing.metadata,
        ...newMetadata
      }
    }

    // Update smart code if provided
    if (body.p_smart_code || body.smart_code) {
      const smartCode = body.p_smart_code || body.smart_code
      updateData.smart_code = assertSmartCode(smartCode)
    }

    // Always update updated_at
    updateData.updated_at = new Date().toISOString()

    // Perform update
    const { data: updated, error: updateError } = await supabase
      .from('universal_transactions')
      .update(updateData)
      .eq('id', transactionId)
      .eq('organization_id', authResult.organizationId)
      .select()
      .single()

    if (updateError) {
      console.error('[Transaction PUT] Update failed:', updateError)
      return NextResponse.json(
        { error: 'update_failed', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Transaction updated successfully'
    })
  } catch (error) {
    console.error('Transaction PUT error:', error)
    return NextResponse.json(
      {
        error: 'internal_server_error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v2/transactions/[id]
 * Deletes a transaction (hard delete or soft delete based on force parameter)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth verification
    const authResult = await verifyAuth(request)
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const transactionId = params.id
    if (!transactionId) {
      return NextResponse.json({ error: 'transaction_id required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Create Supabase client with service role for deletes
    const supabase = createServerClient()

    // First verify the transaction belongs to the organization
    const { data: existing, error: fetchError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('organization_id', authResult.organizationId)
      .single()

    if (fetchError || !existing) {
      console.error('[Transaction DELETE] Transaction not found:', { transactionId, fetchError })
      return NextResponse.json(
        { error: 'not_found', details: 'Transaction not found or access denied' },
        { status: 404 }
      )
    }

    if (force) {
      // Hard delete - remove transaction and its lines
      // First delete transaction lines
      const { error: linesDeleteError } = await supabase
        .from('universal_transaction_lines')
        .delete()
        .eq('transaction_id', transactionId)

      if (linesDeleteError) {
        console.error('[Transaction DELETE] Failed to delete lines:', linesDeleteError)
        // Continue anyway - transaction might not have lines
      }

      // Then delete the transaction
      const { error: deleteError } = await supabase
        .from('universal_transactions')
        .delete()
        .eq('id', transactionId)
        .eq('organization_id', authResult.organizationId)

      if (deleteError) {
        console.error('[Transaction DELETE] Hard delete failed:', deleteError)
        return NextResponse.json(
          { error: 'delete_failed', details: deleteError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Transaction permanently deleted',
        deleted: true
      })
    } else {
      // Soft delete - update metadata to mark as cancelled/archived
      const { data: updated, error: updateError } = await supabase
        .from('universal_transactions')
        .update({
          metadata: {
            ...existing.metadata,
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancelled_by: authResult.id
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .eq('organization_id', authResult.organizationId)
        .select()
        .single()

      if (updateError) {
        console.error('[Transaction DELETE] Soft delete failed:', updateError)
        return NextResponse.json(
          { error: 'delete_failed', details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Transaction cancelled (soft delete)',
        deleted: false
      })
    }
  } catch (error) {
    console.error('Transaction DELETE error:', error)
    return NextResponse.json(
      {
        error: 'internal_server_error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
