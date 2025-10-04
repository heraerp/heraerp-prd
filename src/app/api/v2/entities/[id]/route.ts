/**
 * Entity DELETE API v2
 * DELETE /api/v2/entities/[id] - Delete entity by ID using RPC
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = authResult
    const { id: entityId } = await params

    // Get query params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard_delete') === 'true'

    console.log('[DELETE entity] Request:', {
      entityId,
      organizationId,
      hardDelete
    })

    const supabase = getSupabaseService()

    // Call RPC function to handle delete with proper business logic
    const { data, error } = await supabase.rpc('hera_entity_delete_v1', {
      p_organization_id: organizationId,
      p_entity_id: entityId,
      p_cascade_dynamic_data: true,
      p_cascade_relationships: true
    })

    if (error) {
      console.error('[DELETE entity] RPC Error:', error)

      // Handle specific error cases
      if (error.code === 'insufficient_privilege') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      if (error.code === 'no_data_found') {
        return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
      }

      return NextResponse.json(
        { error: 'Failed to delete entity', details: error.message },
        { status: 500 }
      )
    }

    console.log('[DELETE entity] Success:', data)

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Entity permanently deleted' : 'Entity archived',
      data: data
    })
  } catch (error: any) {
    console.error('[DELETE entity] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
