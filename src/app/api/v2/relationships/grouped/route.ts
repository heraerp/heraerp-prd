/**
 * Batched Relationships API - Single call instead of multiple
 * Reduces 3-4 API calls down to 1 for dashboard performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/verifyAuth'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface RelationshipGroup {
  type: string
  count: number
  recent_items?: any[]
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.organizationId) {
      return NextResponse.json(
        { error: 'Organization context required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const typesParam = searchParams.get('types') || ''
    const limit = Number(searchParams.get('limit') || 1000)
    const includeItems = searchParams.get('include_items') === 'true'
    
    const types = typesParam
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    // Build the query
    let query = supabase
      .from('core_relationships')
      .select('relationship_type, id, source_entity_id, target_entity_id, created_at, relationship_data')
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by types if provided
    if (types.length > 0) {
      query = query.in('relationship_type', types)
    }

    const { data: relationships, error } = await query

    if (error) {
      console.error('❌ Relationships query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch relationships' },
        { status: 500 }
      )
    }

    // Group by relationship type
    const grouped = relationships?.reduce((acc, rel) => {
      const type = rel.relationship_type
      
      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          recent_items: []
        }
      }
      
      acc[type].count++
      
      // Include recent items if requested (max 5 per type)
      if (includeItems && acc[type].recent_items.length < 5) {
        acc[type].recent_items.push({
          id: rel.id,
          source_entity_id: rel.source_entity_id,
          target_entity_id: rel.target_entity_id,
          created_at: rel.created_at,
          data: rel.relationship_data
        })
      }
      
      return acc
    }, {} as Record<string, RelationshipGroup>)

    const groups = Object.values(grouped || {})

    // Sort by count descending
    groups.sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      organization_id: auth.organizationId,
      total_types: groups.length,
      total_relationships: relationships?.length || 0,
      groups,
      cached_at: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 's-maxage=15, stale-while-revalidate=60',
        'CDN-Cache-Control': 's-maxage=15',
      }
    })

  } catch (error: any) {
    console.error('❌ Grouped relationships API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}