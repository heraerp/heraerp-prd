/**
 * HERA Universal API v2 - Single Relationship Upsert
 * Creates or updates a single relationship
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
    const {
      relationship_type,
      smart_code,
      from_entity_id,
      to_entity_id,
      status = 'ACTIVE', // API expects 'ACTIVE', maps to is_active = true
      metadata = null,
      effective_from = null,
      effective_to = null
    } = body

    const is_active = status === 'ACTIVE'

    console.log('🔗 [Relationship Upsert] Request:', {
      organizationId: authResult.organizationId,
      relationship_type,
      from_entity_id,
      to_entity_id
    })

    // Validate required fields
    if (!relationship_type || !from_entity_id || !to_entity_id) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          details: 'relationship_type, from_entity_id, and to_entity_id are required'
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseService()

    // Check if relationship already exists
    const { data: existing } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', authResult.organizationId)
      .eq('relationship_type', relationship_type)
      .eq('from_entity_id', from_entity_id)
      .eq('to_entity_id', to_entity_id)
      .maybeSingle()

    let result

    if (existing) {
      // Update existing relationship
      const { data, error } = await supabase
        .from('core_relationships')
        .update({
          is_active,
          smart_code: smart_code || existing.smart_code,
          relationship_data: metadata !== null ? metadata : existing.relationship_data,
          effective_date: effective_from,
          expiration_date: effective_to,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('❌ [Relationship Upsert] Update error:', error)
        return NextResponse.json(
          { error: 'Failed to update relationship', details: error.message },
          { status: 500 }
        )
      }

      result = data
      console.log('✅ [Relationship Upsert] Updated existing relationship:', result.id)
    } else {
      // Create new relationship
      const { data, error } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: authResult.organizationId,
          relationship_type,
          smart_code: smart_code || 'HERA.CORE.REL.GENERIC.V1',
          from_entity_id,
          to_entity_id,
          relationship_direction: 'forward',
          is_active,
          relationship_data: metadata || {},
          effective_date: effective_from,
          expiration_date: effective_to
        })
        .select()
        .single()

      if (error) {
        console.error('❌ [Relationship Upsert] Insert error:', error)
        return NextResponse.json(
          { error: 'Failed to create relationship', details: error.message },
          { status: 500 }
        )
      }

      result = data
      console.log('✅ [Relationship Upsert] Created new relationship:', result.id)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ [Relationship Upsert] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
