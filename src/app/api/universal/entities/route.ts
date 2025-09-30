// src/app/api/universal/entities/route.ts
// HERA Universal API v2 - Entity Routes (POST, GET)
// Self-assembling RPC-first architecture with Smart Code Engine

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callRPC, assertOrgScope, serverSupabase } from '@/lib/universal/supabase';
import { SmartCodeEngine } from '@/lib/universal/smart-code-engine';
import { EntityBuilder } from '@/lib/universal/entity-builder';
import { 
  EntityUpsertBody, 
  EntityProfilesQuery,
  SearchParams 
} from '@/lib/universal/schemas';
import { GuardrailViolation } from '@/lib/universal/guardrails';

// ================================================================================
// POST /api/universal/entities - Create or Update Entity
// ================================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate base schema
    const validatedBase = EntityUpsertBody.parse(body);
    
    // Extract auth token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // Initialize Smart Code Engine
    const engine = new SmartCodeEngine(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Load UCR rules from Smart Code
    const context = await engine.loadSmartCode(
      validatedBase.p_smart_code,
      validatedBase.p_organization_id
    );
    
    // Build dynamic schema from UCR rules
    const dynamicSchema = await EntityBuilder.buildSchema(
      validatedBase.p_smart_code,
      validatedBase.p_organization_id
    );
    
    // Validate against dynamic schema (includes UCR rules)
    const validated = dynamicSchema.base_schema.parse(body);
    
    // Check if entity creation requires procedures
    const createProcedures = context.procedures.filter(p => p.procedure_type === 'create');
    
    if (createProcedures.length > 0) {
      // Use EntityBuilder for procedure-based creation
      const result = await EntityBuilder.create(validated, validatedBase.p_organization_id);
      
      return NextResponse.json({
        success: true,
        data: result
      });
    } else {
      // Direct RPC call for simple entity creation
      const result = await callRPC('hera_entity_upsert_v1', validatedBase, {
        mode: 'rls',
        token
      });
      
      if (result.error) {
        return NextResponse.json(
          { success: false, error: result.error.message },
          { status: 400 }
        );
      }
      
      // Store dynamic fields if any
      const dynamicFields = Object.entries(validated).filter(
        ([key]) => !key.startsWith('p_') && 
                   dynamicSchema.field_schemas.some(f => f.field_name === key)
      );
      
      if (dynamicFields.length > 0 && result.data?.entity_id) {
        // Store each dynamic field
        for (const [field_name, value] of dynamicFields) {
          const fieldType = dynamicSchema.field_schemas.find(f => f.field_name === field_name)?.field_type || 'text';
          
          await callRPC('hera_dynamic_data_set_v1', {
            p_organization_id: validatedBase.p_organization_id,
            p_entity_id: result.data.entity_id,
            p_field_name: field_name,
            p_field_type: fieldType,
            p_field_value: fieldType === 'text' ? String(value) : null,
            p_field_value_number: fieldType === 'number' ? Number(value) : null,
            p_field_value_boolean: fieldType === 'boolean' ? Boolean(value) : null,
            p_field_value_date: fieldType === 'date' ? value : null,
            p_field_value_json: fieldType === 'json' ? value : null,
            p_smart_code: validatedBase.p_smart_code
          }, {
            mode: 'rls',
            token
          });
        }
      }
      
      return NextResponse.json({
        success: true,
        data: result.data
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      );
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
      );
    }
    
    console.error('[Entity POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ================================================================================
// GET /api/universal/entities - Query Entities
// ================================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build query parameters - support both with and without p_ prefix
    const queryParams: any = {
      p_organization_id: searchParams.get('p_organization_id') || searchParams.get('organization_id'),
      p_entity_type: searchParams.get('p_entity_type') || searchParams.get('entity_type'),
      p_smart_code: searchParams.get('p_smart_code') || searchParams.get('smart_code'),
      p_parent_entity_id: searchParams.get('p_parent_entity_id') || searchParams.get('parent_entity_id'),
      p_status: searchParams.get('p_status') || searchParams.get('status')
    };
    
    // Remove null values
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === null) {
        delete queryParams[key];
      }
    });
    
    // Validate query parameters
    const validated = EntityProfilesQuery.parse(queryParams);
    
    // Assert org scope
    assertOrgScope(validated);
    
    // Extract auth token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // Query entities directly using Supabase
    const supabase = serverSupabase();
    
    let query = supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', validated.p_organization_id);
    
    // Apply filters
    if (validated.p_entity_type) {
      query = query.eq('entity_type', validated.p_entity_type);
    }
    if (validated.p_smart_code) {
      query = query.eq('smart_code', validated.p_smart_code);
    }
    if (validated.p_parent_entity_id) {
      query = query.eq('parent_entity_id', validated.p_parent_entity_id);
    }
    if (validated.p_status) {
      query = query.eq('status', validated.p_status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    const result = { data: data || [] };
    
    // Add pagination support
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // Slice results for pagination (ideally this would be done in the RPC)
    const paginatedData = Array.isArray(result.data) 
      ? result.data.slice(offset, offset + limit)
      : [];
    
    // Build response with pagination metadata
    const totalCount = Array.isArray(result.data) ? result.data.length : 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      },
      _links: {
        self: `/api/universal/entities?${searchParams.toString()}`,
        next: page < totalPages ? `/api/universal/entities?${new URLSearchParams({...Object.fromEntries(searchParams), page: String(page + 1)}).toString()}` : null,
        prev: page > 1 ? `/api/universal/entities?${new URLSearchParams({...Object.fromEntries(searchParams), page: String(page - 1)}).toString()}` : null
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    console.error('[Entity GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}