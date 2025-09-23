/**
 * Individual Category API Routes
 * GET, PATCH, DELETE operations for specific categories
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

// Update schema
const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().max(200).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  icon: z.string().optional(),
  sort_order: z.number().int().min(0).optional(),
  status: z.enum(['active', 'archived']).optional()
})

// GET /api/playbook/salon/categories/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = authResult.organizationId
    const categoryId = params.id

    const supabase = getSupabaseService()

    // Get category
    const { data: category, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'service_category')
      .eq('id', categoryId)
      .single()

    if (error || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Get service count
    const { count: serviceCount } = await supabase
      .from('core_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('relationship_type', 'BELONGS_TO_CATEGORY')
      .eq('to_entity_id', categoryId)

    // Get dynamic data
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_number')
      .eq('organization_id', organizationId)
      .eq('entity_id', categoryId)

    // Map dynamic fields
    const dynamicFields: any = {}
    if (dynamicData) {
      dynamicData.forEach(dd => {
        switch (dd.field_name) {
          case 'category.color':
            dynamicFields.color = dd.field_value_text
            break
          case 'category.icon':
            dynamicFields.icon = dd.field_value_text
            break
          case 'category.sort_order':
            dynamicFields.sort_order = dd.field_value_number
            break
          case 'category.description':
            dynamicFields.description = dd.field_value_text
            break
        }
      })
    }

    return NextResponse.json({
      id: category.id,
      entity_name: category.entity_name,
      entity_code: category.entity_code,
      status: category.status,
      smart_code: category.smart_code,
      created_at: category.created_at,
      updated_at: category.updated_at,
      service_count: serviceCount || 0,
      color: dynamicFields.color || '#D4AF37',
      icon: dynamicFields.icon || 'Tag',
      sort_order: dynamicFields.sort_order || 0,
      description: dynamicFields.description || null
    })
  } catch (error) {
    console.error('Get category error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/playbook/salon/categories/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = authResult.organizationId
    const categoryId = params.id
    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)

    const supabase = getSupabaseService()

    // Check category exists
    const { data: existing, error: existingError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'service_category')
      .eq('id', categoryId)
      .single()

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check for duplicate name if changing
    if (validatedData.name && validatedData.name !== existing.entity_name) {
      const { data: duplicate } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'service_category')
        .eq('entity_name', validatedData.name)
        .neq('id', categoryId)
        .single()

      if (duplicate) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update entity fields
    const entityUpdates: any = {}
    if (validatedData.name) entityUpdates.entity_name = validatedData.name
    if (validatedData.code) entityUpdates.entity_code = validatedData.code
    if (validatedData.status) entityUpdates.status = validatedData.status

    if (Object.keys(entityUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('core_entities')
        .update(entityUpdates)
        .eq('id', categoryId)

      if (updateError) {
        console.error('Error updating category:', updateError)
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
      }
    }

    // Update dynamic data
    const dynamicUpdates = []

    if (validatedData.description !== undefined) {
      dynamicUpdates.push({
        organization_id: organizationId,
        entity_id: categoryId,
        field_name: 'category.description',
        field_type: 'text',
        field_value_text: validatedData.description,
        smart_code: 'HERA.SALON.SVC.CATEGORY.FIELD.DESCRIPTION.V1'
      })
    }

    if (validatedData.color) {
      dynamicUpdates.push({
        organization_id: organizationId,
        entity_id: categoryId,
        field_name: 'category.color',
        field_type: 'text',
        field_value_text: validatedData.color,
        smart_code: 'HERA.SALON.SVC.CATEGORY.FIELD.COLOR.V1'
      })
    }

    if (validatedData.icon) {
      dynamicUpdates.push({
        organization_id: organizationId,
        entity_id: categoryId,
        field_name: 'category.icon',
        field_type: 'text',
        field_value_text: validatedData.icon,
        smart_code: 'HERA.SALON.SVC.CATEGORY.FIELD.ICON.V1'
      })
    }

    if (validatedData.sort_order !== undefined) {
      dynamicUpdates.push({
        organization_id: organizationId,
        entity_id: categoryId,
        field_name: 'category.sort_order',
        field_type: 'number',
        field_value_number: validatedData.sort_order,
        smart_code: 'HERA.SALON.SVC.CATEGORY.FIELD.SORT_ORDER.V1'
      })
    }

    if (dynamicUpdates.length > 0) {
      // Delete existing dynamic data for these fields
      await supabase
        .from('core_dynamic_data')
        .delete()
        .eq('entity_id', categoryId)
        .in(
          'field_name',
          dynamicUpdates.map(d => d.field_name)
        )

      // Insert new values
      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .insert(dynamicUpdates)

      if (dynamicError) {
        console.error('Error updating dynamic data:', dynamicError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update category error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/playbook/salon/categories/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = authResult.organizationId
    const categoryId = params.id

    const supabase = getSupabaseService()

    // Check category exists
    const { data: category, error: categoryError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'service_category')
      .eq('id', categoryId)
      .single()

    if (categoryError || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check for linked services
    const { count: serviceCount } = await supabase
      .from('core_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('relationship_type', 'BELONGS_TO_CATEGORY')
      .eq('to_entity_id', categoryId)

    if (serviceCount && serviceCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete category with linked services',
          service_count: serviceCount
        },
        { status: 400 }
      )
    }

    // Delete dynamic data first
    await supabase.from('core_dynamic_data').delete().eq('entity_id', categoryId)

    // Delete the category entity
    const { error: deleteError } = await supabase
      .from('core_entities')
      .delete()
      .eq('id', categoryId)

    if (deleteError) {
      console.error('Error deleting category:', deleteError)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
