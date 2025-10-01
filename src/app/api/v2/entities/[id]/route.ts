/**
 * Universal Entity API v2 - DELETE endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const entityId = params.id

    if (!entityId || !entityId.match(/^[0-9a-f-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid entity ID' }, { status: 400 })
    }

    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = authResult
    const { searchParams } = new URL(request.url)

    // Options from query params
    const hard_delete = searchParams.get('hard_delete') === 'true'
    const cascade = searchParams.get('cascade') !== 'false' // Default true

    const supabase = getSupabaseService()

    // Delete entity using HERA RPC
    const { data: result, error } = await supabase.rpc('hera_entity_delete_v1', {
      p_organization_id: organizationId,
      p_entity_id: entityId,
      p_hard_delete: hard_delete,
      p_cascade: cascade
    })

    if (error) {
      console.error('Failed to delete entity:', error)
      return NextResponse.json(
        { error: 'Failed to delete entity', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: hard_delete ? 'Entity permanently deleted' : 'Entity archived successfully',
      data: result
    })
  } catch (error) {
    console.error('Universal entity delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
