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

    // 🎯 ENTERPRISE DIAGNOSTICS: Check all possible references

    // Check transaction lines
    const { count: txnLineCount } = await supabase
      .from('universal_transaction_lines')
      .select('*', { count: 'exact', head: true })
      .eq('line_entity_id', entityId)
      .eq('organization_id', organizationId)

    // Check transaction headers (from_entity_id, to_entity_id, and source_entity_id)
    const { count: txnFromCount } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('from_entity_id', entityId)
      .eq('organization_id', organizationId)

    const { count: txnToCount } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('to_entity_id', entityId)
      .eq('organization_id', organizationId)

    // 🎯 CRITICAL: Check source_entity_id (used for curation, governance, etc.)
    const { count: txnSourceCount } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('source_entity_id', entityId)
      .eq('organization_id', organizationId)

    const transactionReferences =
      (txnLineCount || 0) + (txnFromCount || 0) + (txnToCount || 0) + (txnSourceCount || 0)

    // 🎯 ENTERPRISE DIAGNOSTICS: Log all references
    console.log('[DELETE entity] Reference check:', {
      entityId,
      relationships: affectedRelationships,
      transaction_lines: txnLineCount || 0,
      transaction_from: txnFromCount || 0,
      transaction_to: txnToCount || 0,
      transaction_source: txnSourceCount || 0,
      total_transaction_refs: transactionReferences
    })

    // PREVENT hard delete if entity is used in any transactions (audit/financial integrity)
    if (hardDelete && transactionReferences > 0) {
      console.log('[DELETE entity] Blocked: Entity has transaction history')

      return NextResponse.json(
        {
          error: {
            code: 'TRANSACTION_INTEGRITY_VIOLATION',
            message: `Cannot delete: Entity is used in ${transactionReferences} transaction(s). For audit and financial reporting purposes, entities with transaction history can only be archived (soft delete).`,
            details: {
              transaction_lines: txnLineCount || 0,
              transaction_from: txnFromCount || 0,
              transaction_to: txnToCount || 0,
              transaction_source: txnSourceCount || 0,
              total_references: transactionReferences,
              suggestion: 'Use soft delete (archive) instead by setting hard_delete=false'
            }
          }
        },
        { status: 409 }
      )
    }

    if (hardDelete) {
      // HARD DELETE - Physical deletion with optional cascade
      // Only allowed if no transaction history exists
      console.log('[DELETE entity] Hard delete:', { entityId, cascade, affectedRelationships })

      // Check for active relationships if cascade is false
      if (!cascade && affectedRelationships > 0) {
        return NextResponse.json(
          {
            error: {
              code: 'RELATIONSHIP_CONFLICT',
              message:
                'Active relationships prevent hard delete; try soft delete or set cascade=true'
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

        // Check if it's a foreign key constraint violation
        const isForeignKeyError =
          entityError.message?.includes('foreign key constraint') || entityError.code === '23503'

        return NextResponse.json(
          {
            error: {
              code: isForeignKeyError ? 'FOREIGN_KEY_CONSTRAINT' : 'DELETE_FAILED',
              message: isForeignKeyError
                ? 'Cannot delete: Entity is referenced by other records. Try soft delete (archive) or delete with cascade=true'
                : entityError.message,
              details: entityError.message
            }
          },
          { status: isForeignKeyError ? 409 : 500 }
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
            source_entity_id: entityId,
            total_amount: 0,
            transaction_number: `DEL-${entityId.slice(0, 8)}-${Date.now()}`,
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
