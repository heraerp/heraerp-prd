import { NextRequest, NextResponse } from 'next/server'
import { rpc } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * DELETE /api/v2/universal/entity-delete
 *
 * Soft delete (mark as deleted) or hard delete entities
 *
 * Body parameters:
 * - entity_id: Entity ID to delete (required)
 * - organization_id: Organization ID (required)
 * - hard_delete: If true, permanently removes entity and related data (default: false)
 * - cascade: If true, also deletes relationships and dynamic data (default: false)
 * - actor_user_id: User performing the deletion (for audit)
 */
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { entity_id, organization_id, hard_delete = false, cascade = false, actor_user_id } = body

  // Validation
  if (!entity_id || !organization_id) {
    return NextResponse.json(
      { error: 'entity_id and organization_id are required' },
      { status: 400 }
    )
  }

  try {
    // Use database function for entity delete
    const result = await rpc('hera_entity_delete_v1', {
      p_organization_id: organization_id,
      p_entity_id: entity_id,
      p_hard_delete: hard_delete,
      p_cascade: cascade,
      p_actor_user_id: actor_user_id || null
    })

    if (!result.success) {
      // Handle specific error codes
      if (result.error === 'ENTITY_NOT_FOUND') {
        return NextResponse.json(
          { error: 'entity_not_found', message: result.message },
          { status: 404 }
        )
      }

      if (result.error === 'ENTITY_ALREADY_DELETED') {
        return NextResponse.json(
          { error: 'entity_already_deleted', message: result.message },
          { status: 400 }
        )
      }

      if (result.error === 'ENTITY_HAS_DEPENDENCIES') {
        return NextResponse.json(
          {
            error: 'entity_has_dependencies',
            message: result.message,
            metadata: result.metadata
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'entity_operation_failed', message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      api_version: 'v2',
      ...result
    })
  } catch (error: any) {
    console.error('Error in entity-delete:', error)
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}

/**
 * POST /api/v2/universal/entity-delete/recover
 *
 * Recover a soft-deleted entity
 */
export async function POST(req: NextRequest) {
  // Handle recovery endpoint
  if (req.nextUrl.pathname.endsWith('/recover')) {
    const body = await req.json().catch(() => null)

    if (!body) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    const { entity_id, organization_id, actor_user_id } = body

    if (!entity_id || !organization_id) {
      return NextResponse.json(
        { error: 'entity_id and organization_id are required' },
        { status: 400 }
      )
    }

    try {
      // Use database function for entity recover
      const result = await rpc('hera_entity_recover_v1', {
        p_organization_id: organization_id,
        p_entity_id: entity_id,
        p_cascade: false, // Could be made configurable
        p_actor_user_id: actor_user_id || null
      })

      if (!result.success) {
        if (result.error === 'ENTITY_NOT_FOUND') {
          return NextResponse.json(
            { error: 'entity_not_found', message: result.message },
            { status: 404 }
          )
        }

        if (result.error === 'ENTITY_NOT_DELETED') {
          return NextResponse.json(
            { error: 'entity_not_deleted', message: result.message },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { error: result.error || 'entity_operation_failed', message: result.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        api_version: 'v2',
        ...result
      })
    } catch (error: any) {
      console.error('Error in entity-recover:', error)
      return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 })
}
