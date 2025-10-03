// src/app/api/universal/entities/[id]/route.ts
// HERA Universal API v2 - Single Entity Routes (GET, PUT, DELETE)
// Self-assembling RPC-first architecture with Smart Code Engine

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { callRPC, assertOrgScope } from '@/lib/universal/supabase'
import { SmartCodeEngine } from '@/lib/universal/smart-code-engine'
import { EntityBuilder } from '@/lib/universal/entity-builder'
import { EntityReadParams, EntityDeleteParams, EntityUpsertBody } from '@/lib/universal/schemas'
import { GuardrailViolation, UUID } from '@/lib/universal/guardrails'

interface RouteParams {
  params: {
    id: string
  }
}

// ================================================================================
// GET /api/universal/entities/[id] - Get Single Entity with Dynamic Fields
// ================================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: entityId } = await params

    // Validate entity ID
    if (!UUID.safeParse(entityId).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid entity ID format' },
        { status: 400 }
      )
    }

    // Get organization ID from query params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organization_id is required' },
        { status: 400 }
      )
    }

    // Validate parameters
    const validated = EntityReadParams.parse({
      p_entity_id: entityId,
      p_organization_id: organizationId
    })

    // Extract auth token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    // Get entity from database
    const result = await callRPC('hera_entity_get_v1', validated, {
      mode: 'rls',
      token
    })

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 400 })
    }

    if (!result.data) {
      return NextResponse.json({ success: false, error: 'Entity not found' }, { status: 404 })
    }

    // Load dynamic fields if entity has a smart code
    if (result.data.smart_code && searchParams.get('include_dynamic') === 'true') {
      try {
        // Use EntityBuilder to get entity with dynamic fields populated
        const enrichedEntity = await EntityBuilder.get(entityId, organizationId)

        return NextResponse.json({
          success: true,
          data: enrichedEntity
        })
      } catch (error) {
        // If dynamic field loading fails, return base entity
        console.warn('[Entity GET] Failed to load dynamic fields:', error)
        return NextResponse.json({
          success: true,
          data: result.data,
          warning: 'Could not load dynamic fields'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('[Entity GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ================================================================================
// PUT /api/universal/entities/[id] - Update Entity
// ================================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: entityId } = await params

    // Validate entity ID
    if (!UUID.safeParse(entityId).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid entity ID format' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Add entity ID to body for validation
    body.p_entity_id = entityId

    // Validate base schema
    const validatedBase = EntityUpsertBody.parse(body)

    // Extract auth token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    // Initialize Smart Code Engine if smart code provided
    if (validatedBase.p_smart_code) {
      const engine = new SmartCodeEngine(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Load UCR rules
      const context = await engine.loadSmartCode(
        validatedBase.p_smart_code,
        validatedBase.p_organization_id
      )

      // Check if update requires procedures
      const updateProcedures = context.procedures.filter(p => p.procedure_type === 'update')

      if (updateProcedures.length > 0) {
        // Use EntityBuilder for procedure-based update
        const result = await EntityBuilder.update(entityId, body, validatedBase.p_organization_id)

        return NextResponse.json({
          success: true,
          data: result
        })
      }
    }

    // Direct RPC call for simple update
    const result = await callRPC('hera_entity_upsert_v1', validatedBase, {
      mode: 'rls',
      token
    })

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    if (error instanceof GuardrailViolation) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        },
        { status: 400 }
      )
    }

    console.error('[Entity PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ================================================================================
// DELETE /api/universal/entities/[id] - Delete Entity
// ================================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: entityId } = await params

    console.log('[Entity DELETE] Request received:', {
      entityId,
      url: request.url
    })

    // Validate entity ID
    if (!UUID.safeParse(entityId).success) {
      console.error('[Entity DELETE] Invalid UUID:', entityId)
      return NextResponse.json(
        { success: false, error: 'Invalid entity ID format' },
        { status: 400 }
      )
    }

    // Get organization ID from query params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    console.log('[Entity DELETE] Query params:', {
      organizationId,
      allParams: Object.fromEntries(searchParams.entries())
    })

    if (!organizationId) {
      console.error('[Entity DELETE] Missing organization_id')
      return NextResponse.json(
        { success: false, error: 'organization_id is required' },
        { status: 400 }
      )
    }

    // Validate parameters
    const validated = EntityDeleteParams.parse({
      p_entity_id: entityId,
      p_organization_id: organizationId
    })

    // Extract auth token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    // First get the entity to check if it has procedures
    console.log('[Entity DELETE] Calling hera_entity_read_v1 with:', {
      p_entity_id: entityId,
      p_organization_id: organizationId
    })

    const entityResult = await callRPC(
      'hera_entity_read_v1',
      { p_entity_id: entityId, p_organization_id: organizationId },
      { mode: 'rls', token }
    )

    console.log('[Entity DELETE] RPC result:', {
      hasError: !!entityResult.error,
      hasData: !!entityResult.data,
      error: entityResult.error,
      dataKeys: entityResult.data ? Object.keys(entityResult.data) : []
    })

    if (entityResult.error || !entityResult.data) {
      console.error('[Entity DELETE] Entity not found or error:', {
        error: entityResult.error,
        data: entityResult.data
      })
      return NextResponse.json({ success: false, error: 'Entity not found' }, { status: 404 })
    }

    // Check if entity has delete procedures via smart code
    if (entityResult.data.smart_code) {
      try {
        const engine = new SmartCodeEngine(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const context = await engine.loadSmartCode(entityResult.data.smart_code, organizationId)

        const deleteProcedures = context.procedures.filter(p => p.procedure_type === 'delete')

        if (deleteProcedures.length > 0) {
          // Use EntityBuilder for procedure-based deletion
          const result = await EntityBuilder.delete(entityId, organizationId)

          return NextResponse.json({
            success: true,
            data: { deleted: result.success, procedures_executed: result.procedures_executed }
          })
        }
      } catch (error) {
        console.warn('[Entity DELETE] Failed to check delete procedures:', error)
        // Continue with standard delete
      }
    }

    // Standard RPC delete
    const result = await callRPC('hera_entity_delete_v1', validated, {
      mode: 'rls',
      token
    })

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('[Entity DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
