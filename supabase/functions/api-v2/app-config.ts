/**
 * HERA v2.4 Platform Configuration API Endpoints
 * Smart Code: HERA.API.V2.CONFIG.PLATFORM.v1
 * 
 * Complete REST API for managing JSON-driven ERP configurations
 * Integrates with existing API v2 security gateway
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// Configuration API Handler
// =============================================================================

export interface ConfigRequest {
  op: 'app_config'
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'VALIDATE' | 'LIST' | 'GENERATE_ENTITY' | 'GENERATE_TRANSACTION' | 'GENERATE_APP'
  app_id?: string
  config_data?: any
  entity_config?: any
  transaction_config?: any
  app_config?: any
  is_override?: boolean
  options?: any
}

export async function handleAppConfigRequest(
  req: Request,
  supabase: any,
  actorUserId: string,
  organizationId: string
): Promise<Response> {
  try {
    const body = await req.json() as ConfigRequest

    // Validate basic request structure
    if (body.op !== 'app_config') {
      return new Response(
        JSON.stringify({ error: 'Invalid operation. Expected: app_config' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Route to specific action handler
    switch (body.action) {
      case 'CREATE':
      case 'UPDATE':
        return await handleConfigCreateUpdate(supabase, actorUserId, organizationId, body)
      
      case 'READ':
        return await handleConfigRead(supabase, actorUserId, organizationId, body)
      
      case 'DELETE':
        return await handleConfigDelete(supabase, actorUserId, organizationId, body)
      
      case 'VALIDATE':
        return await handleConfigValidate(supabase, body)
      
      case 'LIST':
        return await handleConfigList(supabase, actorUserId, organizationId)
      
      // Phase 2.3: Runtime generation actions
      case 'GENERATE_ENTITY':
        return await handleGenerateEntity(supabase, actorUserId, organizationId, body)
      
      case 'GENERATE_TRANSACTION':
        return await handleGenerateTransaction(supabase, actorUserId, organizationId, body)
      
      case 'GENERATE_APP':
        return await handleGenerateApp(supabase, actorUserId, organizationId, body)
      
      default:
        return new Response(
          JSON.stringify({ 
            error: `Invalid action: ${body.action}. Supported: CREATE, READ, UPDATE, DELETE, VALIDATE, LIST, GENERATE_ENTITY, GENERATE_TRANSACTION, GENERATE_APP` 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('[handleAppConfigRequest] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// =============================================================================
// Create/Update Configuration Handler
// =============================================================================

async function handleConfigCreateUpdate(
  supabase: any,
  actorUserId: string,
  organizationId: string,
  body: ConfigRequest
): Promise<Response> {
  if (!body.app_id) {
    return new Response(
      JSON.stringify({ error: 'app_id is required for CREATE/UPDATE operations' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!body.config_data) {
    return new Response(
      JSON.stringify({ error: 'config_data is required for CREATE/UPDATE operations' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Call the RPC function
    const { data, error } = await supabase.rpc('hera_app_config_crud_v1', {
      p_action: body.action,
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_app_id: body.app_id,
      p_config_data: body.config_data,
      p_is_override: body.is_override || false,
      p_options: body.options || {}
    })

    if (error) {
      console.error('[handleConfigCreateUpdate] RPC Error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create/update configuration',
          details: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: data,
        actor: actorUserId,
        org: organizationId,
        rid: generateRequestId()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[handleConfigCreateUpdate] Exception:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Configuration operation failed',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// =============================================================================
// Read Configuration Handler
// =============================================================================

async function handleConfigRead(
  supabase: any,
  actorUserId: string,
  organizationId: string,
  body: ConfigRequest
): Promise<Response> {
  if (!body.app_id) {
    return new Response(
      JSON.stringify({ error: 'app_id is required for READ operations' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Call the RPC function to get merged config
    const { data, error } = await supabase.rpc('hera_app_config_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_app_id: body.app_id,
      p_config_data: null,
      p_is_override: false,
      p_options: body.options || {}
    })

    if (error) {
      console.error('[handleConfigRead] RPC Error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to read configuration',
          details: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!data) {
      return new Response(
        JSON.stringify({ 
          error: 'Configuration not found',
          app_id: body.app_id
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: data,
        actor: actorUserId,
        org: organizationId,
        rid: generateRequestId()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[handleConfigRead] Exception:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Configuration read failed',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// =============================================================================
// Delete Configuration Handler
// =============================================================================

async function handleConfigDelete(
  supabase: any,
  actorUserId: string,
  organizationId: string,
  body: ConfigRequest
): Promise<Response> {
  if (!body.app_id) {
    return new Response(
      JSON.stringify({ error: 'app_id is required for DELETE operations' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Call the RPC function
    const { data, error } = await supabase.rpc('hera_app_config_crud_v1', {
      p_action: 'DELETE',
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_app_id: body.app_id,
      p_config_data: null,
      p_is_override: body.is_override || false,
      p_options: body.options || {}
    })

    if (error) {
      console.error('[handleConfigDelete] RPC Error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete configuration',
          details: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: data,
        actor: actorUserId,
        org: organizationId,
        rid: generateRequestId()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[handleConfigDelete] Exception:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Configuration delete failed',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// =============================================================================
// Validate Configuration Handler
// =============================================================================

async function handleConfigValidate(
  supabase: any,
  body: ConfigRequest
): Promise<Response> {
  if (!body.config_data) {
    return new Response(
      JSON.stringify({ error: 'config_data is required for VALIDATE operations' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Call the validation function
    const { data, error } = await supabase.rpc('validate_app_config_json_v1', {
      p_config_json: body.config_data
    })

    if (error) {
      console.error('[handleConfigValidate] RPC Error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Return validation result
    const validationResult = data && data.length > 0 ? data[0] : { is_valid: false, errors: [], warnings: [] }

    return new Response(
      JSON.stringify({
        ok: true,
        data: validationResult,
        rid: generateRequestId()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[handleConfigValidate] Exception:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Validation operation failed',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// =============================================================================
// List Configurations Handler
// =============================================================================

async function handleConfigList(
  supabase: any,
  actorUserId: string,
  organizationId: string
): Promise<Response> {
  try {
    // Query all app configs available to this organization
    // This includes platform configs + org-specific overrides
    
    // Get platform configs
    const { data: platformConfigs, error: platformError } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_name,
        smart_code,
        created_at,
        updated_at,
        core_dynamic_data!inner (
          field_value_json
        )
      `)
      .eq('entity_type', 'APP_CONFIG')
      .eq('core_dynamic_data.field_name', 'app_definition')
      .eq('status', 'active')

    if (platformError) {
      console.error('[handleConfigList] Platform configs error:', platformError)
    }

    // Get org-specific overrides
    const { data: orgOverrides, error: orgError } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_name,
        smart_code,
        created_at,
        updated_at,
        core_dynamic_data!inner (
          field_value_json
        )
      `)
      .eq('entity_type', 'APP_CONFIG_OVERRIDE')
      .eq('organization_id', organizationId)
      .eq('core_dynamic_data.field_name', 'app_override')
      .eq('status', 'active')

    if (orgError) {
      console.error('[handleConfigList] Org overrides error:', orgError)
    }

    // Extract app IDs from smart codes
    const extractAppId = (smartCode: string): string => {
      const match = smartCode.match(/HERA\.(?:PLATFORM|ORG)\.CONFIG\.APP\.([A-Z_]+)\.v1/)
      return match ? match[1].toLowerCase() : 'unknown'
    }

    const platformApps = (platformConfigs || []).map(config => ({
      app_id: extractAppId(config.smart_code),
      name: config.entity_name,
      type: 'platform',
      has_override: false,
      last_updated: config.updated_at,
      config_preview: config.core_dynamic_data[0]?.field_value_json
    }))

    const orgApps = (orgOverrides || []).map(config => ({
      app_id: extractAppId(config.smart_code),
      name: config.entity_name,
      type: 'override',
      has_override: true,
      last_updated: config.updated_at,
      config_preview: config.core_dynamic_data[0]?.field_value_json
    }))

    // Merge platform and org configs
    const appConfigMap = new Map<string, any>()

    // Add platform configs first
    platformApps.forEach(app => {
      appConfigMap.set(app.app_id, app)
    })

    // Update with org overrides
    orgApps.forEach(app => {
      const existing = appConfigMap.get(app.app_id)
      if (existing) {
        existing.has_override = true
        existing.override_updated = app.last_updated
      } else {
        appConfigMap.set(app.app_id, app)
      }
    })

    const availableConfigs = Array.from(appConfigMap.values()).sort((a, b) => 
      a.app_id.localeCompare(b.app_id)
    )

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          app_ids: availableConfigs.map(config => config.app_id),
          configs: availableConfigs,
          total: availableConfigs.length,
          platform_configs: platformApps.length,
          org_overrides: orgApps.length
        },
        actor: actorUserId,
        org: organizationId,
        rid: generateRequestId()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[handleConfigList] Exception:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to list configurations',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// =============================================================================
// Configuration Schema Endpoint
// =============================================================================

export async function handleConfigSchema(req: Request): Promise<Response> {
  try {
    // Return the JSON schema for HERA app configurations
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "HERA v2.4 Application Configuration",
      type: "object",
      required: ["app_id", "version", "metadata"],
      properties: {
        app_id: {
          type: "string",
          pattern: "^[a-z_]+$",
          description: "Unique identifier for the application"
        },
        version: {
          type: "string",
          pattern: "^v[0-9]+\\.[0-9]+\\.[0-9]+$",
          description: "Configuration schema version"
        },
        metadata: {
          type: "object",
          required: ["name", "description", "module", "icon", "category"],
          properties: {
            name: { type: "string", minLength: 1 },
            description: { type: "string", minLength: 1 },
            module: { type: "string", minLength: 1 },
            icon: { type: "string", minLength: 1 },
            category: { type: "string", minLength: 1 },
            tags: {
              type: "array",
              items: { type: "string" }
            }
          }
        },
        entities: {
          type: "array",
          items: {
            type: "object",
            required: ["entity_type", "smart_code_prefix", "display_name", "fields"],
            properties: {
              entity_type: { type: "string", pattern: "^[A-Z_]+$" },
              smart_code_prefix: { type: "string", pattern: "^HERA\\.[A-Z_]+\\." },
              display_name: { type: "string", minLength: 1 },
              fields: {
                type: "array",
                items: {
                  type: "object",
                  required: ["field_name", "display_label", "field_type", "is_required", "field_order"],
                  properties: {
                    field_name: { type: "string", pattern: "^[a-z_]+$" },
                    field_type: {
                      type: "string",
                      enum: ["text", "number", "date", "boolean", "json", "entity_reference"]
                    }
                  }
                }
              }
            }
          }
        },
        transactions: {
          type: "array",
          items: {
            type: "object",
            required: ["transaction_type", "smart_code_prefix", "display_name", "header_fields", "line_fields"]
          }
        },
        screens: {
          type: "array",
          items: {
            type: "object",
            required: ["screen_id", "screen_type", "display_name"]
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: schema,
        rid: generateRequestId()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[handleConfigSchema] Exception:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get configuration schema',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

function generateRequestId(): string {
  return 'req_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function isConfigRequest(body: any): body is ConfigRequest {
  return body && typeof body === 'object' && body.op === 'app_config'
}

// =============================================================================
// Phase 2.3: Runtime Entity Generation Handlers
// =============================================================================

async function handleGenerateEntity(
  supabase: any,
  actorUserId: string,
  organizationId: string,
  body: ConfigRequest
): Promise<Response> {
  if (!body.entity_config) {
    return new Response(
      JSON.stringify({ error: 'entity_config is required for GENERATE_ENTITY operations' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Call the runtime entity generation function
    const { data, error } = await supabase.rpc('generate_entity_from_config_v1', {
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_entity_config: body.entity_config,
      p_options: body.options || {}
    })

    if (error) {
      console.error('[handleGenerateEntity] RPC Error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate entity from configuration',
          details: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Extract result from RPC response
    const result = data && data.length > 0 ? data[0] : null
    
    if (!result || !result.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Entity generation failed',
          details: result?.message || 'Unknown error'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          success: result.success,
          entity_id: result.entity_id,
          smart_code: result.smart_code,
          fields_created: result.fields_created,
          relationships_created: result.relationships_created,
          message: result.message
        },
        actor: actorUserId,
        org: organizationId,
        rid: generateRequestId()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[handleGenerateEntity] Exception:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Entity generation operation failed',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function handleGenerateTransaction(
  supabase: any,
  actorUserId: string,
  organizationId: string,
  body: ConfigRequest
): Promise<Response> {
  if (!body.transaction_config) {
    return new Response(
      JSON.stringify({ error: 'transaction_config is required for GENERATE_TRANSACTION operations' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Call the runtime transaction generation function
    const { data, error } = await supabase.rpc('generate_transaction_from_config_v1', {
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_transaction_config: body.transaction_config,
      p_options: body.options || {}
    })

    if (error) {
      console.error('[handleGenerateTransaction] RPC Error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate transaction from configuration',
          details: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Extract result from RPC response
    const result = data && data.length > 0 ? data[0] : null
    
    if (!result || !result.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Transaction generation failed',
          details: result?.message || 'Unknown error'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          success: result.success,
          transaction_entity_id: result.transaction_entity_id,
          smart_code: result.smart_code,
          header_fields_created: result.header_fields_created,
          line_fields_created: result.line_fields_created,
          state_machine_created: result.state_machine_created,
          message: result.message
        },
        actor: actorUserId,
        org: organizationId,
        rid: generateRequestId()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[handleGenerateTransaction] Exception:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Transaction generation operation failed',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function handleGenerateApp(
  supabase: any,
  actorUserId: string,
  organizationId: string,
  body: ConfigRequest
): Promise<Response> {
  if (!body.app_config && !body.config_data) {
    return new Response(
      JSON.stringify({ error: 'app_config or config_data is required for GENERATE_APP operations' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const appConfig = body.app_config || body.config_data

  try {
    // Call the runtime app generation function
    const { data, error } = await supabase.rpc('generate_app_from_config_v1', {
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_app_config: appConfig,
      p_options: body.options || {}
    })

    if (error) {
      console.error('[handleGenerateApp] RPC Error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate app from configuration',
          details: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Extract result from RPC response
    const result = data && data.length > 0 ? data[0] : null
    
    if (!result || !result.success) {
      return new Response(
        JSON.stringify({ 
          error: 'App generation failed',
          details: result?.message || 'Unknown error'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          success: result.success,
          app_entity_id: result.app_entity_id,
          entities_created: result.entities_created,
          transactions_created: result.transactions_created,
          screens_created: result.screens_created,
          business_rules_created: result.business_rules_created,
          message: result.message,
          app_config: appConfig
        },
        actor: actorUserId,
        org: organizationId,
        rid: generateRequestId()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[handleGenerateApp] Exception:', error)
    return new Response(
      JSON.stringify({ 
        error: 'App generation operation failed',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}