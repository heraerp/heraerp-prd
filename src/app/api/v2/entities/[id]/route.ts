/**
 * Entity DELETE API v2 - RPC: hera_entity_delete_v1
 * DELETE /api/v2/entities/[id] - Delete entity by ID using RPC contract
 *
 * Supports both soft delete (archive) and hard delete with cascade options
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
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized for this organization'
          }
        },
        { status: 403 }
      )
    }

    const { organizationId } = authResult
    const { id: entityId } = await params

    // Get query params with RPC contract defaults
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard_delete') === 'true'
    const cascade = searchParams.get('cascade') !== 'false' // default true
    const reason = searchParams.get('reason') || undefined
    const smartCode = searchParams.get('smart_code') || 'HERA.CORE.ENTITY.DELETE.V1'

    console.log('[DELETE entity] RPC Request:', {
      entityId,
      organizationId,
      hardDelete,
      cascade,
      reason,
      smartCode
    })

    const supabase = getSupabaseService()

    // Count relationships before deletion/archival
    const { count: relCount } = await supabase
      .from('core_relationships')
      .select('*', { count: 'exact', head: true })
      .or(`from_entity_id.eq.${entityId},to_entity_id.eq.${entityId}`)
      .eq('organization_id', organizationId)
      .eq('status', 'ACTIVE')

    const affectedRelationships = relCount || 0

    if (hardDelete) {
      // HARD DELETE - Physical deletion with optional cascade
      console.log('[DELETE entity] Hard delete:', { entityId, cascade, affectedRelationships })

      // Check for active relationships if cascade is false
      if (!cascade && affectedRelationships > 0) {
        return NextResponse.json(
          {
            error: {
              code: 'RELATIONSHIP_CONFLICT',
              message: 'Active relationships prevent hard delete; try soft delete or set cascade=true'
            }
          },
          { status: 409 }
        )
      }

      if (cascade) {
        // Delete relationships
        const { error: relError } = await supabase
          .from('core_relationships')
          .delete()
          .or(`from_entity_id.eq.${entityId},to_entity_id.eq.${entityId}`)
          .eq('organization_id', organizationId)

        if (relError) {
          console.error('[DELETE entity] Relationship delete error:', relError)
        }

        // Delete dynamic data
        const { error: dynError } = await supabase
          .from('core_dynamic_data')
          .delete()
          .eq('entity_id', entityId)
          .eq('organization_id', organizationId)

        if (dynError) {
          console.error('[DELETE entity] Dynamic data delete error:', dynError)
        }
      }

      // Delete the entity itself
      const { error: entityError } = await supabase
        .from('core_entities')
        .delete()
        .eq('id', entityId)
        .eq('organization_id', organizationId)

      if (entityError) {
        console.error('[DELETE entity] Entity delete error:', entityError)
        return NextResponse.json(
          {
            error: {
              code: 'DELETE_FAILED',
              message: entityError.message
            }
          },
          { status: 500 }
        )
      }

      console.log('[DELETE entity] Hard delete successful')

      // RPC contract response format
      return NextResponse.json({
        deleted: true,
        entity_id: entityId,
        mode: 'HARD',
        cascade_applied: cascade,
        affected_relationships: cascade ? affectedRelationships : 0
      })
    } else {
      // SOFT DELETE - Archive with status update
      console.log('[DELETE entity] Soft delete (archive):', { entityId, cascade })

      // Create tombstone transaction for audit trail
      let tombstoneId: string | null = null
      if (reason) {
        const { data: tombstone } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: organizationId,
            transaction_type: 'entity_delete',
            smart_code: smartCode,
            from_entity_id: entityId,
            total_amount: 0,
            transaction_code: `DEL-${entityId.slice(0, 8)}-${Date.now()}`,
            metadata: {
              reason,
              deleted_at: new Date().toISOString(),
              mode: 'soft',
              cascade
            }
          })
          .select('id')
          .single()

        tombstoneId = tombstone?.id || null
      }

      // Archive the entity
      const { error } = await supabase
        .from('core_entities')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', entityId)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('[DELETE entity] Archive error:', error)
        return NextResponse.json(
          {
            error: {
              code: 'ARCHIVE_FAILED',
              message: error.message
            }
          },
          { status: 500 }
        )
      }

      // Inactivate relationships if cascade enabled
      if (cascade && affectedRelationships > 0) {
        const { error: relError } = await supabase
          .from('core_relationships')
          .update({
            status: 'INACTIVE',
            updated_at: new Date().toISOString()
          })
          .or(`from_entity_id.eq.${entityId},to_entity_id.eq.${entityId}`)
          .eq('organization_id', organizationId)
          .eq('status', 'ACTIVE')

        if (relError) {
          console.error('[DELETE entity] Relationship inactivation error:', relError)
        }
      }

      console.log('[DELETE entity] Archive successful')

      // RPC contract response format
      return NextResponse.json({
        deleted: true,
        entity_id: entityId,
        mode: 'SOFT',
        cascade_applied: cascade,
        affected_relationships: cascade ? affectedRelationships : 0,
        tombstone_id: tombstoneId
      })
    }
  } catch (error: any) {
    console.error('[DELETE entity] Exception:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      },
      { status: 500 }
    )
  }
}
