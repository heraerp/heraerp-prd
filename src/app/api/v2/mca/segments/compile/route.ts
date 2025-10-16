/**
 * MCA Segment Compilation API Endpoint
 * DSL to SQL compilation for dynamic audience building
 * 
 * Smart Code: HERA.CRM.MCA.API.SEGMENT.COMPILE.V1
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { compileSegment } from '@/lib/mca/rpc-functions'
import { z } from 'zod'

// Request validation schema
const SegmentCompileSchema = z.object({
  segment_id: z.string().uuid('Segment ID must be a valid UUID'),
  organization_id: z.string().uuid('Organization ID must be a valid UUID'),
  test_mode: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(1000).optional().default(100)
})

/**
 * POST /api/v2/mca/segments/compile
 * Compiles segment DSL into executable SQL and returns audience metrics
 */
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Authentication check
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = SegmentCompileSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const { segment_id, organization_id, test_mode, limit } = validation.data

    // Organization access validation
    const { data: orgAccess } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('id', organization_id)
      .single()

    if (!orgAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Organization access denied' },
        { status: 403 }
      )
    }

    // Verify segment exists and belongs to organization
    const { data: segment } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('id', segment_id)
      .eq('entity_type', 'SEGMENT')
      .eq('organization_id', organization_id)
      .single()

    if (!segment) {
      return NextResponse.json(
        { error: 'Segment not found or access denied' },
        { status: 404 }
      )
    }

    // Execute segment compilation via RPC
    const startTime = Date.now()
    const compileResult = await compileSegment({
      segment_id,
      organization_id,
      test_mode,
      limit
    })
    const endTime = Date.now()

    // Update segment with latest compilation results
    const { error: updateError } = await supabase
      .from('core_dynamic_data')
      .upsert([
        {
          entity_id: segment_id,
          field_name: 'audience_count',
          field_type: 'number',
          field_value_number: compileResult.audience_count,
          smart_code: 'HERA.CRM.MCA.DYN.SEGMENT.V1.AUDIENCE_COUNT.V1',
          organization_id
        },
        {
          entity_id: segment_id,
          field_name: 'last_compiled',
          field_type: 'datetime',
          field_value_datetime: new Date().toISOString(),
          smart_code: 'HERA.CRM.MCA.DYN.SEGMENT.V1.LAST_COMPILED.V1',
          organization_id
        },
        {
          entity_id: segment_id,
          field_name: 'compilation_time_ms',
          field_type: 'number',
          field_value_number: endTime - startTime,
          smart_code: 'HERA.CRM.MCA.DYN.SEGMENT.V1.COMPILATION_TIME.V1',
          organization_id
        }
      ])

    if (updateError) {
      console.warn('⚠️ Failed to update segment compilation stats:', updateError)
    }

    // Log compilation event for audit trail
    const { error: logError } = await supabase
      .from('universal_transactions')
      .insert({
        transaction_type: 'SEGMENT_COMPILED',
        transaction_number: `SEG-COMPILE-${Date.now()}`,
        smart_code: 'HERA.CRM.MCA.EVENT.SEGMENT.COMPILED.V1',
        source_entity_id: segment_id,
        organization_id,
        total_amount: compileResult.audience_count,
        metadata: {
          compilation_time_ms: compileResult.compilation_time_ms,
          test_mode,
          user_id: session.user.id
        }
      })

    if (logError) {
      console.warn('⚠️ Failed to log segment compilation:', logError)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...compileResult,
        segment_name: segment.entity_name,
        compiled_at: new Date().toISOString(),
        compiled_by: session.user.id,
        test_mode
      }
    })

  } catch (error) {
    console.error('❌ Segment compilation API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}