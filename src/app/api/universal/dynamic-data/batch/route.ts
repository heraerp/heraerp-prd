// HERA Universal API v2 - Dynamic Data Batch Route
// Batch set multiple dynamic fields for an entity

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serverSupabase } from '@/lib/universal/supabase';
import { SmartCodeSchema } from '@/lib/universal/zprimitives';
import { UUID } from '@/lib/universal/zprimitives';

// Schema for batch dynamic data
const BatchDynamicDataSchema = z.object({
  p_organization_id: UUID,
  p_entity_id: UUID,
  p_smart_code: SmartCodeSchema,
  p_fields: z.array(z.discriminatedUnion('field_type', [
    z.object({
      field_name: z.string(),
      field_type: z.literal('text'),
      field_value: z.string().nullable(),
    }),
    z.object({
      field_name: z.string(),
      field_type: z.literal('number'),
      field_value_number: z.number().nullable(),
    }),
    z.object({
      field_name: z.string(),
      field_type: z.literal('boolean'),
      field_value_boolean: z.boolean(),
    }),
    z.object({
      field_name: z.string(),
      field_type: z.literal('date'),
      field_value_date: z.string().nullable(),
    }),
    z.object({
      field_name: z.string(),
      field_type: z.literal('json'),
      field_value_json: z.any().nullable(),
    }),
  ])),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = BatchDynamicDataSchema.parse(body);
    
    const supabase = serverSupabase();
    const results = [];
    
    // Process each field
    for (const field of validated.p_fields) {
      // Check if field already exists
      const { data: existing } = await supabase
        .from('core_dynamic_data')
        .select('id')
        .eq('organization_id', validated.p_organization_id)
        .eq('entity_id', validated.p_entity_id)
        .eq('field_name', field.field_name)
        .single();
      
      // Prepare data for insert/update
      const fieldData: any = {
        organization_id: validated.p_organization_id,
        entity_id: validated.p_entity_id,
        field_name: field.field_name,
        field_type: field.field_type,
        smart_code: validated.p_smart_code,
        field_value_text: null,
        field_value_number: null,
        field_value_boolean: null,
        field_value_date: null,
        field_value_json: null,
      };

      // Set the appropriate value based on field type
      switch (field.field_type) {
        case 'text':
          fieldData.field_value_text = field.field_value;
          break;
        case 'number':
          fieldData.field_value_number = field.field_value_number;
          break;
        case 'boolean':
          fieldData.field_value_boolean = field.field_value_boolean;
          break;
        case 'date':
          fieldData.field_value_date = field.field_value_date;
          break;
        case 'json':
          fieldData.field_value_json = field.field_value_json;
          break;
      }
      
      let result;
      if (existing) {
        // Update existing field
        result = await supabase
          .from('core_dynamic_data')
          .update(fieldData)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Insert new field
        result = await supabase
          .from('core_dynamic_data')
          .insert(fieldData)
          .select()
          .single();
      }
      
      if (result.error) {
        throw new Error(`Failed to set field ${field.field_name}: ${result.error.message}`);
      }
      
      results.push(result.data);
    }
    
    return NextResponse.json({
      success: true,
      data: results,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    console.error('[Dynamic Data Batch] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}