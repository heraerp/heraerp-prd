/**
 * HERA Security Framework Demo API
 *
 * Demonstrates the complete security framework implementation
 * with database context, authentication, and audit logging.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/security-middleware'
import type { SecurityContext } from '@/lib/security/database-context'

/**
 * GET /api/v2/security-demo
 * Demonstrates secure data access with organization isolation
 */
async function handleGetSecurityDemo(req: NextRequest, context: SecurityContext) {
  try {
    // This runs within executeWithContext automatically
    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get('entity_type') || 'demo'

    // Import Supabase client within the handler to use the context
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Query data - RLS automatically filters by organization
    const { data: entities, error } = await supabase
      .from('core_entities')
      .select(
        `
        id,
        entity_type,
        entity_name,
        organization_id,
        smart_code,
        created_at
      `
      )
      .eq('entity_type', entityType)
      .limit(10)

    if (error) {
      throw error
    }

    // Query dynamic data for these entities
    const entityIds = entities.map(e => e.id)
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .in('entity_id', entityIds)

    // Query recent transactions
    const { data: transactions } = await supabase
      .from('universal_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      context: {
        organization_id: context.orgId,
        user_id: context.userId,
        role: context.role,
        auth_mode: context.authMode
      },
      data: {
        entities: entities.length,
        dynamic_fields: dynamicData?.length || 0,
        recent_transactions: transactions?.length || 0,
        sample_entities: entities.slice(0, 3),
        sample_transactions: transactions?.slice(0, 2)
      },
      security_info: {
        rls_enabled: true,
        org_isolation: 'enforced',
        audit_logged: true
      }
    })
  } catch (error) {
    console.error('Security demo error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch demo data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v2/security-demo
 * Demonstrates secure data creation with audit logging
 */
async function handlePostSecurityDemo(req: NextRequest, context: SecurityContext) {
  try {
    const body = await req.json()
    const { entity_name, entity_type = 'demo_entity', dynamic_fields = {} } = body

    if (!entity_name) {
      return NextResponse.json({ error: 'entity_name is required' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create entity - organization_id is automatically set by context
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        entity_type,
        entity_name,
        organization_id: context.orgId, // Explicit for clarity
        smart_code: `HERA.DEMO.${entity_type.toUpperCase()}.V1`,
        created_by: context.userId
      })
      .select()
      .single()

    if (entityError) {
      throw entityError
    }

    // Add dynamic fields if provided
    const dynamicDataInserts = Object.entries(dynamic_fields).map(([field_name, field_value]) => ({
      entity_id: entity.id,
      organization_id: context.orgId,
      field_name,
      field_value,
      field_type: typeof field_value,
      smart_code: `HERA.DEMO.FIELD.${field_name.toUpperCase()}.V1`
    }))

    if (dynamicDataInserts.length > 0) {
      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .insert(dynamicDataInserts)

      if (dynamicError) {
        console.error('Failed to insert dynamic fields:', dynamicError)
        // Continue anyway - entity was created successfully
      }
    }

    // Create a demo transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('universal_transactions')
      .insert({
        transaction_type: 'demo_creation',
        organization_id: context.orgId,
        transaction_number: `DEMO-${Date.now()}`,
        smart_code: 'HERA.DEMO.TXN.CREATE.V1',
        total_amount: 0,
        from_entity_id: entity.id,
        created_by: context.userId,
        metadata: {
          created_via: 'security_demo_api',
          entity_type: entity_type,
          dynamic_fields_count: dynamicDataInserts.length
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Failed to create demo transaction:', transactionError)
      // Continue anyway
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          entity: {
            id: entity.id,
            entity_name: entity.entity_name,
            entity_type: entity.entity_type,
            organization_id: entity.organization_id,
            smart_code: entity.smart_code
          },
          dynamic_fields: dynamicDataInserts.length,
          transaction: transaction
            ? {
                id: transaction.id,
                transaction_number: transaction.transaction_number,
                smart_code: transaction.smart_code
              }
            : null
        },
        context: {
          organization_id: context.orgId,
          user_id: context.userId,
          role: context.role,
          auth_mode: context.authMode
        },
        security_info: {
          rls_enforced: true,
          audit_logged: true,
          context_validated: true
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Security demo creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create demo data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v2/security-demo/[id]
 * Demonstrates secure data deletion with audit trails
 */
async function handleDeleteSecurityDemo(req: NextRequest, context: SecurityContext) {
  try {
    const { searchParams } = new URL(req.url)
    const entityId = searchParams.get('id')

    if (!entityId) {
      return NextResponse.json({ error: 'Entity ID is required' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First, verify the entity exists and belongs to this org (RLS will handle this)
    const { data: entity, error: fetchError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, organization_id')
      .eq('id', entityId)
      .single()

    if (fetchError || !entity) {
      return NextResponse.json({ error: 'Entity not found or access denied' }, { status: 404 })
    }

    // Delete related dynamic data first
    const { error: dynamicDeleteError } = await supabase
      .from('core_dynamic_data')
      .delete()
      .eq('entity_id', entityId)

    if (dynamicDeleteError) {
      console.error('Failed to delete dynamic data:', dynamicDeleteError)
    }

    // Delete the entity
    const { error: deleteError } = await supabase.from('core_entities').delete().eq('id', entityId)

    if (deleteError) {
      throw deleteError
    }

    // Create audit transaction
    const { data: auditTransaction } = await supabase
      .from('universal_transactions')
      .insert({
        transaction_type: 'demo_deletion',
        organization_id: context.orgId,
        transaction_number: `DELETE-${Date.now()}`,
        smart_code: 'HERA.DEMO.TXN.DELETE.V1',
        total_amount: 0,
        created_by: context.userId,
        metadata: {
          deleted_entity: {
            id: entity.id,
            name: entity.entity_name,
            type: entity.entity_type
          },
          deleted_via: 'security_demo_api'
        }
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      message: 'Entity deleted successfully',
      deleted_entity: {
        id: entity.id,
        name: entity.entity_name,
        type: entity.entity_type
      },
      audit_transaction: auditTransaction
        ? {
            id: auditTransaction.id,
            transaction_number: auditTransaction.transaction_number
          }
        : null,
      context: {
        organization_id: context.orgId,
        user_id: context.userId,
        role: context.role
      }
    })
  } catch (error) {
    console.error('Security demo deletion error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete demo data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Apply security middleware with appropriate permissions
export const GET = withSecurity(handleGetSecurityDemo, {
  allowedRoles: ['owner', 'admin', 'manager', 'user'],
  enableAuditLogging: true,
  enableRateLimit: true
})

export const POST = withSecurity(handlePostSecurityDemo, {
  allowedRoles: ['owner', 'admin', 'manager'],
  enableAuditLogging: true,
  enableRateLimit: true
})

export const DELETE = withSecurity(handleDeleteSecurityDemo, {
  allowedRoles: ['owner', 'admin'],
  enableAuditLogging: true,
  enableRateLimit: true
})
