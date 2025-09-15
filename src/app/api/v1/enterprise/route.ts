import { NextRequest } from 'next/server'
import { enterpriseMiddleware } from '@/lib/middleware/enterprise-middleware'
import { getSupabase } from '@/lib/supabase/client'
import { RLSQueryBuilder } from '@/lib/rbac/query-builder-middleware'
import { heraLogger } from '@/lib/observability/logger'
import { heraMetrics } from '@/lib/observability/metrics'
import { v4 as uuidv4 } from 'uuid'

/**
 * Example Enterprise API endpoint showing integration of all enterprise features:
 * - Rate limiting
 * - RBAC policy checks
 * - Idempotency handling
 * - RLS automatic enforcement
 * - Distributed tracing
 * - Structured logging
 * - Metrics collection
 * - Audit trail
 */

export async function GET(request: NextRequest) {
  return enterpriseMiddleware(request, async (req, ctx) => {
    // Get RLS-wrapped Supabase client
    const supabase = RLSQueryBuilder.wrapClient(getSupabase(), ctx.requestId)

    // Example: Fetch enterprise metrics summary
    const { data: organizations, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('status', 'active')

    if (orgError) throw orgError

    // Aggregate metrics
    const summary = {
      total_organizations: organizations?.length || 0,
      by_tier: {
        enterprise:
          organizations?.filter(o => (o.metadata as any)?.tier === 'enterprise').length || 0,
        professional:
          organizations?.filter(o => (o.metadata as any)?.tier === 'professional').length || 0,
        free: organizations?.filter(o => (o.metadata as any)?.tier === 'free').length || 0
      }
    }

    // Record business metric
    heraMetrics.recordTransaction(ctx.organizationId || 'system', 'enterprise_summary_view', 1, 0)

    // Log API usage
    heraLogger.info(
      'Enterprise summary retrieved',
      {
        organizations_count: summary.total_organizations
      },
      ctx.requestId
    )

    return new Response(
      JSON.stringify({
        success: true,
        data: summary,
        _meta: {
          request_id: ctx.requestId,
          trace_id: ctx.traceId,
          organization_id: ctx.organizationId
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  })
}

export async function POST(request: NextRequest) {
  return enterpriseMiddleware(request, async (req, ctx) => {
    const body = await req.json()
    const { action, data } = body

    // Get RLS-wrapped Supabase client
    const supabase = RLSQueryBuilder.wrapClient(getSupabase(), ctx.requestId)

    let result: any

    switch (action) {
      case 'create_enterprise_config':
        // Example: Create enterprise configuration entity
        const configId = uuidv4()
        const { data: entity, error: entityError } = await supabase
          .from('core_entities')
          .insert({
            id: configId,
            entity_type: 'enterprise_config',
            entity_name: data.name,
            entity_code: `ENT-CONFIG-${Date.now()}`,
            smart_code: 'HERA.ADMIN.CONFIG.ENTERPRISE.v1',
            organization_id: ctx.organizationId,
            metadata: {
              ...data.config,
              created_by: ctx.userId,
              version: 1
            }
          })
          .select()
          .single()

        if (entityError) throw entityError

        // Store sensitive data encrypted
        if (data.secrets) {
          const { kmsProvider } = await import('@/lib/crypto/kms-provider')
          for (const [key, value] of Object.entries(data.secrets)) {
            const encrypted = await kmsProvider.encrypt(value as string, {
              organization_id: ctx.organizationId!,
              purpose: 'credentials',
              field_name: key
            })

            await supabase.from('core_dynamic_data').insert({
              id: uuidv4(),
              entity_id: configId,
              field_name: key,
              field_value_text: encrypted.ciphertext,
              metadata: {
                encryption: {
                  key_id: encrypted.key_id,
                  algorithm: encrypted.algorithm,
                  encrypted_at: new Date().toISOString()
                }
              },
              smart_code: `HERA.ADMIN.CONFIG.SECRET.${key.toUpperCase()}.v1`,
              organization_id: ctx.organizationId
            })
          }
        }

        result = { config_id: configId, status: 'created' }
        break

      case 'update_rbac_policy':
        // Example: Update RBAC policy
        const { rbacPolicy } = await import('@/lib/rbac/policy-engine')
        await rbacPolicy.loadPolicies(data.policy_yaml, ctx.organizationId!)

        result = { status: 'policy_updated' }
        break

      case 'trigger_guardrail_check':
        // Example: Trigger guardrail validation
        const { guardrailAutoFix } = await import('@/lib/guardrails/auto-fix-service')
        const validation = await guardrailAutoFix.autoFixPayload(data.table, data.payload, {
          user_id: ctx.userId,
          session_org_id: ctx.organizationId,
          request_type: 'manual_check'
        })

        result = {
          validation_passed: validation.validation_passed,
          fixes_applied: validation.fixes_applied.length,
          corrected: validation.corrected
        }
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    // Create audit entry
    const auditId = uuidv4()
    await supabase.from('universal_transactions').insert({
      id: auditId,
      transaction_type: 'audit',
      transaction_code: `AUDIT-${Date.now()}`,
      smart_code: `HERA.SECURITY.AUDIT.ADMIN.${action.toUpperCase()}.v1`,
      organization_id: ctx.organizationId,
      metadata: {
        user_id: ctx.userId,
        user_name: 'Admin User', // Get from auth context
        action: action,
        resource: data.resource || 'enterprise_config',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        details: {
          request_data: data,
          result: result
        }
      },
      total_amount: 0,
      from_entity_id: ctx.userId,
      transaction_date: new Date().toISOString()
    })

    // Record metrics
    heraMetrics.recordTransaction(ctx.organizationId!, action, 1, 0)

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        audit_id: auditId,
        _meta: {
          request_id: ctx.requestId,
          trace_id: ctx.traceId,
          idempotency_key: req.headers.get('idempotency-key')
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  })
}
