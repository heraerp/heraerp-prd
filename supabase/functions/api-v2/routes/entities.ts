// HERA v2.3 API Gateway - Entity Routes
// Smart Code: HERA.API.V2.ROUTES.ENTITIES.v1

import type { RequestContext } from '../types/middleware.ts';
import { createServiceRoleClient, setGatewayContext } from '../lib/supabase-client.ts';
import { createSuccessResponse, createErrorResponse } from '../lib/utils.ts';

/**
 * Handle entity CRUD operations
 */
export async function handleEntities(req: Request, context: RequestContext): Promise<Response> {
  try {
    const method = req.method.toUpperCase();
    
    switch (method) {
      case 'GET':
        return await getEntities(req, context);
      case 'POST':
        return await createEntity(req, context);
      case 'PUT':
      case 'PATCH':
        return await updateEntity(req, context);
      case 'DELETE':
        return await deleteEntity(req, context);
      default:
        throw new Error('405:Method not allowed');
    }
    
  } catch (error) {
    console.error('Entity operation error:', error);
    return createErrorResponse(error, context.requestId);
  }
}

/**
 * Get entities with filtering and pagination
 */
async function getEntities(req: Request, context: RequestContext): Promise<Response> {
  const url = new URL(req.url);
  const entityType = url.searchParams.get('entity_type');
  const smartCode = url.searchParams.get('smart_code');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const search = url.searchParams.get('search');
  
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'hera_entities_crud_v1', 'api_v2_gateway');
  
  const { data: result, error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: context.actor.id,
    p_organization_id: context.orgContext.org_id,
    p_entity: null,
    p_dynamic: null,
    p_relationships: [],
    p_options: {
      entity_type: entityType,
      smart_code: smartCode,
      limit,
      offset,
      search,
      include_dynamic: true,
      include_relationships: false
    }
  });
  
  if (error) {
    throw new Error(`500:Entity read failed: ${error.message}`);
  }
  
  return createSuccessResponse(
    result || { items: [], total: 0 },
    context.requestId,
    {
      actor_id: context.actor.id,
      organization_id: context.orgContext.org_id,
      filters: { entity_type: entityType, smart_code: smartCode },
      pagination: { limit, offset }
    }
  );
}

/**
 * Create new entity
 */
async function createEntity(req: Request, context: RequestContext): Promise<Response> {
  const body = await req.json();
  
  // Validate required fields
  if (!body.entity_data?.entity_type) {
    throw new Error('400:Missing required field: entity_data.entity_type');
  }
  
  if (!body.entity_data?.smart_code) {
    throw new Error('400:Missing required field: entity_data.smart_code');
  }
  
  // Ensure organization_id matches context
  if (body.organization_id && body.organization_id !== context.orgContext.org_id) {
    throw new Error('403:Organization ID in payload must match authenticated context');
  }
  
  // Set organization_id from context
  body.organization_id = context.orgContext.org_id;
  if (body.entity_data) {
    body.entity_data.organization_id = context.orgContext.org_id;
  }
  
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'hera_entities_crud_v1', 'api_v2_gateway');
  
  const { data: result, error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: context.actor.id,
    p_organization_id: context.orgContext.org_id,
    p_entity: body.entity_data,
    p_dynamic: body.dynamic_fields || [],
    p_relationships: body.relationships || [],
    p_options: body.options || {}
  });
  
  if (error) {
    throw new Error(`400:Entity creation failed: ${error.message}`);
  }
  
  return createSuccessResponse(
    result,
    context.requestId,
    {
      operation: 'CREATE',
      entity_type: body.entity_data.entity_type,
      smart_code: body.entity_data.smart_code,
      actor_id: context.actor.id,
      organization_id: context.orgContext.org_id
    }
  );
}

/**
 * Update existing entity
 */
async function updateEntity(req: Request, context: RequestContext): Promise<Response> {
  const body = await req.json();
  
  // Validate required fields
  if (!body.entity_data?.entity_id && !body.entity_data?.smart_code) {
    throw new Error('400:Missing required field: entity_data.entity_id or entity_data.smart_code');
  }
  
  // Ensure organization_id matches context
  if (body.organization_id && body.organization_id !== context.orgContext.org_id) {
    throw new Error('403:Organization ID in payload must match authenticated context');
  }
  
  // Set organization_id from context
  body.organization_id = context.orgContext.org_id;
  if (body.entity_data) {
    body.entity_data.organization_id = context.orgContext.org_id;
  }
  
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'hera_entities_crud_v1', 'api_v2_gateway');
  
  const { data: result, error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'UPDATE',
    p_actor_user_id: context.actor.id,
    p_organization_id: context.orgContext.org_id,
    p_entity: body.entity_data,
    p_dynamic: body.dynamic_fields || [],
    p_relationships: body.relationships || [],
    p_options: body.options || {}
  });
  
  if (error) {
    throw new Error(`400:Entity update failed: ${error.message}`);
  }
  
  return createSuccessResponse(
    result,
    context.requestId,
    {
      operation: 'UPDATE',
      entity_id: body.entity_data.entity_id,
      smart_code: body.entity_data.smart_code,
      actor_id: context.actor.id,
      organization_id: context.orgContext.org_id
    }
  );
}

/**
 * Delete entity
 */
async function deleteEntity(req: Request, context: RequestContext): Promise<Response> {
  const body = await req.json();
  
  // Validate required fields
  if (!body.entity_data?.entity_id && !body.entity_data?.smart_code) {
    throw new Error('400:Missing required field: entity_data.entity_id or entity_data.smart_code');
  }
  
  // Ensure organization_id matches context
  if (body.organization_id && body.organization_id !== context.orgContext.org_id) {
    throw new Error('403:Organization ID in payload must match authenticated context');
  }
  
  // Set organization_id from context
  body.organization_id = context.orgContext.org_id;
  if (body.entity_data) {
    body.entity_data.organization_id = context.orgContext.org_id;
  }
  
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'hera_entities_crud_v1', 'api_v2_gateway');
  
  const { data: result, error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'DELETE',
    p_actor_user_id: context.actor.id,
    p_organization_id: context.orgContext.org_id,
    p_entity: body.entity_data,
    p_dynamic: [],
    p_relationships: [],
    p_options: body.options || {}
  });
  
  if (error) {
    throw new Error(`400:Entity deletion failed: ${error.message}`);
  }
  
  return createSuccessResponse(
    result,
    context.requestId,
    {
      operation: 'DELETE',
      entity_id: body.entity_data.entity_id,
      smart_code: body.entity_data.smart_code,
      actor_id: context.actor.id,
      organization_id: context.orgContext.org_id
    }
  );
}

/**
 * Handle entity search with advanced filtering
 */
export async function handleEntitySearch(req: Request, context: RequestContext): Promise<Response> {
  try {
    const body = await req.json();
    
    // Validate search parameters
    if (!body.entity_type && !body.search_text && !body.filters) {
      throw new Error('400:At least one search parameter required: entity_type, search_text, or filters');
    }
    
    const supabase = createServiceRoleClient();
    await setGatewayContext(supabase, 'hera_entities_search_v1', 'api_v2_gateway');
    
    const { data: result, error } = await supabase.rpc('hera_entities_search_v1', {
      p_actor_user_id: context.actor.id,
      p_organization_id: context.orgContext.org_id,
      p_entity_type: body.entity_type,
      p_search_text: body.search_text,
      p_filters: body.filters || {},
      p_options: {
        limit: body.limit || 100,
        offset: body.offset || 0,
        sort_by: body.sort_by || 'created_at',
        sort_order: body.sort_order || 'desc',
        include_dynamic: body.include_dynamic !== false,
        include_relationships: body.include_relationships || false
      }
    });
    
    if (error) {
      throw new Error(`500:Entity search failed: ${error.message}`);
    }
    
    return createSuccessResponse(
      result || { items: [], total: 0 },
      context.requestId,
      {
        search_parameters: {
          entity_type: body.entity_type,
          search_text: body.search_text,
          filters: body.filters
        },
        organization_id: context.orgContext.org_id,
        actor_id: context.actor.id
      }
    );
    
  } catch (error) {
    console.error('Entity search error:', error);
    return createErrorResponse(error, context.requestId);
  }
}

/**
 * Handle entity relationships
 */
export async function handleEntityRelationships(req: Request, context: RequestContext): Promise<Response> {
  try {
    const method = req.method.toUpperCase();
    const url = new URL(req.url);
    const entityId = url.searchParams.get('entity_id');
    
    if (!entityId) {
      throw new Error('400:Missing required parameter: entity_id');
    }
    
    if (method === 'GET') {
      return await getEntityRelationships(entityId, req, context);
    } else if (method === 'POST') {
      return await createEntityRelationship(entityId, req, context);
    } else if (method === 'DELETE') {
      return await deleteEntityRelationship(entityId, req, context);
    } else {
      throw new Error('405:Method not allowed');
    }
    
  } catch (error) {
    console.error('Entity relationships error:', error);
    return createErrorResponse(error, context.requestId);
  }
}

/**
 * Get entity relationships
 */
async function getEntityRelationships(entityId: string, req: Request, context: RequestContext): Promise<Response> {
  const url = new URL(req.url);
  const relationshipType = url.searchParams.get('relationship_type');
  const direction = url.searchParams.get('direction') || 'both'; // 'source', 'target', or 'both'
  
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'hera_relationships_crud_v1', 'api_v2_gateway');
  
  const { data: result, error } = await supabase.rpc('hera_relationships_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: context.actor.id,
    p_organization_id: context.orgContext.org_id,
    p_relationship: null,
    p_options: {
      entity_id: entityId,
      relationship_type: relationshipType,
      direction,
      include_entities: true
    }
  });
  
  if (error) {
    throw new Error(`500:Failed to get entity relationships: ${error.message}`);
  }
  
  return createSuccessResponse(
    result || { items: [] },
    context.requestId,
    {
      entity_id: entityId,
      relationship_type: relationshipType,
      direction,
      organization_id: context.orgContext.org_id
    }
  );
}

/**
 * Create entity relationship
 */
async function createEntityRelationship(entityId: string, req: Request, context: RequestContext): Promise<Response> {
  const body = await req.json();
  
  // Validate required fields
  if (!body.target_entity_id) {
    throw new Error('400:Missing required field: target_entity_id');
  }
  
  if (!body.relationship_type) {
    throw new Error('400:Missing required field: relationship_type');
  }
  
  const relationshipData = {
    source_entity_id: entityId,
    target_entity_id: body.target_entity_id,
    relationship_type: body.relationship_type,
    effective_date: body.effective_date || new Date().toISOString(),
    expiration_date: body.expiration_date,
    relationship_data: body.relationship_data || {},
    smart_code: body.smart_code || `HERA.RELATIONSHIP.${body.relationship_type}.v1`
  };
  
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'hera_relationships_crud_v1', 'api_v2_gateway');
  
  const { data: result, error } = await supabase.rpc('hera_relationships_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: context.actor.id,
    p_organization_id: context.orgContext.org_id,
    p_relationship: relationshipData,
    p_options: {}
  });
  
  if (error) {
    throw new Error(`400:Failed to create entity relationship: ${error.message}`);
  }
  
  return createSuccessResponse(
    result,
    context.requestId,
    {
      operation: 'CREATE_RELATIONSHIP',
      source_entity_id: entityId,
      target_entity_id: body.target_entity_id,
      relationship_type: body.relationship_type,
      organization_id: context.orgContext.org_id
    }
  );
}

/**
 * Delete entity relationship
 */
async function deleteEntityRelationship(entityId: string, req: Request, context: RequestContext): Promise<Response> {
  const body = await req.json();
  
  // Validate required fields
  if (!body.relationship_id && (!body.target_entity_id || !body.relationship_type)) {
    throw new Error('400:Missing required field: relationship_id OR (target_entity_id AND relationship_type)');
  }
  
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'hera_relationships_crud_v1', 'api_v2_gateway');
  
  const { data: result, error } = await supabase.rpc('hera_relationships_crud_v1', {
    p_action: 'DELETE',
    p_actor_user_id: context.actor.id,
    p_organization_id: context.orgContext.org_id,
    p_relationship: {
      relationship_id: body.relationship_id,
      source_entity_id: entityId,
      target_entity_id: body.target_entity_id,
      relationship_type: body.relationship_type
    },
    p_options: {}
  });
  
  if (error) {
    throw new Error(`400:Failed to delete entity relationship: ${error.message}`);
  }
  
  return createSuccessResponse(
    result,
    context.requestId,
    {
      operation: 'DELETE_RELATIONSHIP',
      entity_id: entityId,
      relationship_id: body.relationship_id,
      organization_id: context.orgContext.org_id
    }
  );
}