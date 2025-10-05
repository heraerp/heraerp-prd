/**
 * HERA Universal API v2 - List Relationships
 * Queries relationships with flexible filtering
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
    const { filters = {}, limit = 500, cursor = null } = body

    console.log('🔗 [List Relationships] Request:', {
      organizationId: authResult.organizationId,
      filters,
      limit
    })

    const supabase = getSupabaseService()

    // Build query with JOIN to get related entity details
    let query = supabase
      .from('core_relationships')
      .select(`
        *,
        to_entity:core_entities!core_relationships_to_entity_id_fkey(
          id,
          entity_name,
          entity_code,
          entity_type
        )
      `)
      .eq('organization_id', authResult.organizationId)

    // Apply filters
    if (filters.relationship_type) {
      query = query.eq('relationship_type', filters.relationship_type)
    }

    if (filters.from_entity_id) {
      query = query.eq('from_entity_id', filters.from_entity_id)
    }

    if (filters.to_entity_id) {
      query = query.eq('to_entity_id', filters.to_entity_id)
    }

    // Filter by active status - use is_active column (boolean)
    if (filters.status !== undefined) {
      const isActive = filters.status === 'ACTIVE'
      query = query.eq('is_active', isActive)
    } else {
      // Default to active relationships only
      query = query.eq('is_active', true)
    }

    // Apply limit
    query = query.limit(limit)

    // Apply cursor if provided
    if (cursor) {
      query = query.gt('id', cursor)
    }

    // Execute query
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('❌ [List Relationships] Query error:', error)
      return NextResponse.json(
        { error: 'Failed to list relationships', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ [List Relationships] Found ${data.length} relationships`)

    // Determine next cursor
    const nextCursor = data.length >= limit ? data[data.length - 1].id : null

    return NextResponse.json({
      items: data,
      next_cursor: nextCursor
    })
  } catch (error: any) {
    console.error('❌ [List Relationships] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
