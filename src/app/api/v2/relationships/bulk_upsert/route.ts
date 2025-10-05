/**
 * HERA Universal API v2 - Bulk Relationship Upsert
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
    const { relationship_type, smart_code, pairs, status = 'ACTIVE', metadata = null } = body

    const is_active = status === 'ACTIVE'

    console.log('🔗 [Bulk Relationship Upsert] Request:', {
      organizationId: authResult.organizationId,
      relationship_type,
      pairCount: pairs?.length || 0
    })

    // Validate required fields
    if (!relationship_type) {
      console.error('❌ [Bulk Upsert] Missing relationship_type')
      return NextResponse.json(
        { error: 'Bad Request', details: 'relationship_type is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(pairs)) {
      console.error('❌ [Bulk Upsert] pairs is not an array:', pairs)
      return NextResponse.json(
        { error: 'Bad Request', details: 'pairs must be an array' },
        { status: 400 }
      )
    }

    if (pairs.length === 0) {
      console.log('⚠️ [Bulk Upsert] Empty pairs array - nothing to do')
      return NextResponse.json({ items: [] })
    }

    // Validate each pair
    for (const pair of pairs) {
      if (!pair.from_entity_id || !pair.to_entity_id) {
        console.error('❌ [Bulk Upsert] Invalid pair:', pair)
        return NextResponse.json(
          {
            error: 'Bad Request',
            details: 'Each pair must have from_entity_id and to_entity_id'
          },
          { status: 400 }
        )
      }
    }

    const supabase = getSupabaseService()

    // Delete all existing relationships of this type for the from_entity_ids
    const fromEntityIds = [...new Set(pairs.map((p: any) => p.from_entity_id))]

    if (fromEntityIds.length > 0) {
      console.log(`🗑️ [Bulk Upsert] Deleting ${relationship_type} for entities:`, fromEntityIds)
      const { error: deleteError } = await supabase
        .from('core_relationships')
        .delete()
        .eq('organization_id', authResult.organizationId)
        .eq('relationship_type', relationship_type)
        .in('from_entity_id', fromEntityIds)

      if (deleteError) {
        console.error('❌ [Bulk Upsert] Delete error:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete existing relationships', details: deleteError.message },
          { status: 500 }
        )
      }
      console.log(`✅ [Bulk Upsert] Deleted existing ${relationship_type} relationships`)
    }

    // Insert new relationships
    const insertRows = pairs.map((pair: any) => ({
      organization_id: authResult.organizationId,
      relationship_type,
      smart_code: smart_code || 'HERA.CORE.REL.GENERIC.V1',
      from_entity_id: pair.from_entity_id,
      to_entity_id: pair.to_entity_id,
      relationship_direction: 'forward',
      is_active,
      relationship_data: pair.metadata || metadata || {}
    }))

    console.log(`📝 [Bulk Upsert] Inserting ${insertRows.length} relationships:`,
      insertRows.map(r => ({ from: r.from_entity_id, to: r.to_entity_id, type: r.relationship_type }))
    )

    const { data, error } = await supabase
      .from('core_relationships')
      .insert(insertRows)
      .select()

    if (error) {
      console.error('❌ [Bulk Relationship Upsert] Insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create relationships', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ [Bulk Relationship Upsert] Created ${data.length} relationships`)

    return NextResponse.json({
      items: data.map(rel => ({
        id: rel.id,
        from_entity_id: rel.from_entity_id,
        to_entity_id: rel.to_entity_id,
        relationship_type: rel.relationship_type,
        status: rel.is_active ? 'ACTIVE' : 'INACTIVE',
        is_active: rel.is_active
      }))
    })
  } catch (error: any) {
    console.error('❌ [Bulk Relationship Upsert] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
