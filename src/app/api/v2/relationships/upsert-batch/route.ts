/**
 * HERA Universal API v2 - Batch Relationship Upsert
 * Creates or updates multiple relationships in a single request
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify-auth'
import { getSupabaseService } from '@/lib/supabase-service'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Auth verification
    const authResult = await verifyAuth(request)
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { p_organization_id, p_rows } = body

    console.log('🔗 [Batch Relationship Upsert] Request:', {
      organizationId: p_organization_id,
      rowCount: p_rows?.length || 0,
      authOrgId: authResult.organizationId
    })

    // Validate organization ID
    if (!p_organization_id || p_organization_id !== authResult.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden', details: 'Organization ID mismatch' },
        { status: 403 }
      )
    }

    // Validate rows
    if (!Array.isArray(p_rows) || p_rows.length === 0) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'p_rows must be a non-empty array' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseService()

    // Delete existing relationships for the entities before inserting new ones
    // This ensures we're replacing, not appending
    const fromEntityIds = [...new Set(p_rows.map(r => r.from_entity_id).filter(Boolean))]
    const relationshipTypes = [...new Set(p_rows.map(r => r.relationship_type).filter(Boolean))]

    if (fromEntityIds.length > 0 && relationshipTypes.length > 0) {
      console.log('🗑️ [Batch Relationship Upsert] Deleting existing relationships:', {
        fromEntityIds: fromEntityIds.length,
        relationshipTypes
      })

      // Delete existing relationships for these entities and types
      for (const relationshipType of relationshipTypes) {
        const { error: deleteError } = await supabase
          .from('core_relationships')
          .delete()
          .eq('organization_id', p_organization_id)
          .in('from_entity_id', fromEntityIds)
          .eq('relationship_type', relationshipType)

        if (deleteError) {
          console.warn(`⚠️ Failed to delete existing ${relationshipType} relationships:`, deleteError)
        }
      }
    }

    // Prepare rows for insertion
    const insertRows = p_rows.map((row: any) => ({
      organization_id: p_organization_id,
      from_entity_id: row.from_entity_id,
      to_entity_id: row.to_entity_id,
      relationship_type: row.relationship_type,
      smart_code: row.smart_code || 'HERA.CORE.REL.GENERIC.V1',
      relationship_direction: row.relationship_direction || 'forward',
      is_active: row.is_active !== false,
      metadata: row.metadata || {}
    }))

    console.log('➕ [Batch Relationship Upsert] Inserting relationships:', {
      count: insertRows.length,
      sample: insertRows[0]
    })

    // Insert new relationships
    const { data, error } = await supabase
      .from('core_relationships')
      .insert(insertRows)
      .select()

    if (error) {
      console.error('❌ [Batch Relationship Upsert] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to upsert relationships', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ [Batch Relationship Upsert] Success:', {
      inserted: data?.length || 0
    })

    return NextResponse.json({
      success: true,
      data: data,
      count: data?.length || 0
    })
  } catch (error: any) {
    console.error('❌ [Batch Relationship Upsert] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
