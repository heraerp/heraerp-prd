/**
 * Entity References Diagnostic API
 * GET /api/v2/entities/[id]/references - Show what's preventing entity deletion
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const supabase = getSupabaseService()

    // Get entity details
    const { data: entity } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, status')
      .eq('id', entityId)
      .eq('organization_id', organizationId)
      .single()

    if (!entity) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Entity not found'
          }
        },
        { status: 404 }
      )
    }

    // Check transaction lines
    const { data: txnLines, count: txnLineCount } = await supabase
      .from('universal_transaction_lines')
      .select('id, transaction_id, line_amount, created_at', { count: 'exact' })
      .eq('line_entity_id', entityId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Check transactions (from_entity_id)
    const { data: txnsFrom, count: txnFromCount } = await supabase
      .from('universal_transactions')
      .select('id, transaction_type, smart_code, total_amount, created_at', { count: 'exact' })
      .eq('from_entity_id', entityId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Check transactions (to_entity_id)
    const { data: txnsTo, count: txnToCount } = await supabase
      .from('universal_transactions')
      .select('id, transaction_type, smart_code, total_amount, created_at', { count: 'exact' })
      .eq('to_entity_id', entityId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Check relationships
    const { data: relationships, count: relCount } = await supabase
      .from('core_relationships')
      .select('id, relationship_type, from_entity_id, to_entity_id, status, created_at', {
        count: 'exact'
      })
      .or(`from_entity_id.eq.${entityId},to_entity_id.eq.${entityId}`)
      .eq('organization_id', organizationId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(10)

    // Check dynamic data
    const { count: dynamicCount } = await supabase
      .from('core_dynamic_data')
      .select('*', { count: 'exact', head: true })
      .eq('entity_id', entityId)
      .eq('organization_id', organizationId)

    const totalReferences =
      (txnLineCount || 0) + (txnFromCount || 0) + (txnToCount || 0) + (relCount || 0)

    return NextResponse.json({
      entity,
      references: {
        transaction_lines: {
          count: txnLineCount || 0,
          samples: txnLines || [],
          blocks_deletion: (txnLineCount || 0) > 0
        },
        transactions_from: {
          count: txnFromCount || 0,
          samples: txnsFrom || [],
          blocks_deletion: (txnFromCount || 0) > 0
        },
        transactions_to: {
          count: txnToCount || 0,
          samples: txnsTo || [],
          blocks_deletion: (txnToCount || 0) > 0
        },
        relationships: {
          count: relCount || 0,
          samples: relationships || [],
          blocks_deletion: false // Relationships can be cascaded
        },
        dynamic_fields: {
          count: dynamicCount || 0,
          blocks_deletion: false // Dynamic fields can be cascaded
        }
      },
      summary: {
        total_references: totalReferences,
        can_hard_delete:
          (txnLineCount || 0) === 0 && (txnFromCount || 0) === 0 && (txnToCount || 0) === 0,
        can_soft_delete: true,
        recommendation:
          totalReferences > 0
            ? 'This entity has references and should be archived (soft deleted) rather than permanently deleted.'
            : 'This entity can be safely deleted.'
      }
    })
  } catch (error: any) {
    console.error('[GET entity references] Exception:', error)
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
