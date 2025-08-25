import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Enterprise-grade configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('CRITICAL: Supabase configuration missing')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// HERA Universal Architecture Constants
const ENTITY_TYPE = 'salon_service_category'
const SMART_CODE_PREFIX = 'HERA.SALON.CATEGORY'

// GET: Fetch all service categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    
    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
    }

    // Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', ENTITY_TYPE)
      .neq('status', 'deleted')
      .order('entity_name')

    if (categoriesError) throw categoriesError

    // Fetch dynamic data for all categories
    const categoryIds = categories?.map(c => c.id) || []
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .in('entity_id', categoryIds)

    if (dynamicError) throw dynamicError

    // Fetch service count for each category
    const { data: services, error: servicesError } = await supabase
      .from('core_entities')
      .select('id, metadata')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'salon_service')
      .neq('status', 'deleted')

    if (servicesError) throw servicesError

    // Merge dynamic data with categories and add service count
    const enrichedCategories = categories?.map(category => {
      const categoryDynamicData = dynamicData?.filter(d => d.entity_id === category.id) || []
      const dynamicFields: any = {}
      
      categoryDynamicData.forEach(field => {
        if (field.field_value_text) dynamicFields[field.field_name] = field.field_value_text
        if (field.field_value_number !== null) dynamicFields[field.field_name] = field.field_value_number
        if (field.field_value_boolean !== null) dynamicFields[field.field_name] = field.field_value_boolean
        if (field.field_value_json) dynamicFields[field.field_name] = field.field_value_json
      })

      // Count services in this category
      const serviceCount = services?.filter(s => 
        s.metadata?.category === category.entity_code ||
        dynamicData?.find(d => d.entity_id === s.id && d.field_name === 'category' && d.field_value_text === category.entity_code)
      ).length || 0
      
      return {
        ...category,
        ...dynamicFields,
        service_count: serviceCount
      }
    }) || []

    // Calculate analytics
    const totalCategories = enrichedCategories.length
    const activeCategories = enrichedCategories.filter(c => 
      c.metadata?.is_active !== false && c.is_active !== false
    ).length
    const totalServices = services?.length || 0

    const analytics = {
      total_categories: totalCategories,
      active_categories: activeCategories,
      total_services: totalServices,
      average_services_per_category: totalCategories > 0 ? Math.round(totalServices / totalCategories) : 0
    }

    return NextResponse.json({
      categories: enrichedCategories,
      analytics
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error },
      { status: 500 }
    )
  }
}

// POST: Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      category_name,
      description,
      color_code,
      icon,
      sort_order,
      is_active,
      organization_id
    } = body

    if (!category_name || !organization_id) {
      return NextResponse.json(
        { error: 'category_name and organization_id are required' },
        { status: 400 }
      )
    }

    // Generate category code
    const categoryCode = category_name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 20)
    
    const smartCode = `${SMART_CODE_PREFIX}.${categoryCode}.v1`

    // Create category entity
    const { data: category, error: categoryError } = await supabase
      .from('core_entities')
      .insert({
        entity_type: ENTITY_TYPE,
        entity_name: category_name,
        entity_code: categoryCode,
        organization_id,
        smart_code: smartCode,
        metadata: {
          is_active: is_active !== false,
          icon,
          color_code
        }
      })
      .select()
      .single()

    if (categoryError) throw categoryError

    // Store dynamic fields
    const dynamicFields = []

    if (description) {
      dynamicFields.push({
        field_name: 'description',
        field_value_text: description
      })
    }

    if (color_code) {
      dynamicFields.push({
        field_name: 'color_code',
        field_value_text: color_code
      })
    }

    if (icon) {
      dynamicFields.push({
        field_name: 'icon',
        field_value_text: icon
      })
    }

    if (sort_order !== undefined) {
      dynamicFields.push({
        field_name: 'sort_order',
        field_value_number: parseInt(sort_order) || 0
      })
    }

    if (dynamicFields.length > 0) {
      const dynamicInserts = dynamicFields.map(field => ({
        entity_id: category.id,
        organization_id,
        ...field,
        smart_code: `${smartCode}.${field.field_name.toUpperCase()}`
      }))

      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .insert(dynamicInserts)

      if (dynamicError) throw dynamicError
    }

    return NextResponse.json({
      message: 'Category created successfully',
      category: {
        ...category,
        ...body
      }
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category', details: error },
      { status: 500 }
    )
  }
}

// PUT: Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id: categoryId } = await params

    const {
      category_name,
      description,
      color_code,
      icon,
      sort_order,
      is_active
    } = body

    // Generate new category code if name changed
    let categoryCode = undefined
    if (category_name) {
      categoryCode = category_name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 20)
    }

    // Update category entity
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (category_name) {
      updateData.entity_name = category_name
    }

    if (categoryCode) {
      updateData.entity_code = categoryCode
    }

    updateData.metadata = {
      is_active: is_active !== false,
      icon,
      color_code
    }

    const { error: updateError } = await supabase
      .from('core_entities')
      .update(updateData)
      .eq('id', categoryId)

    if (updateError) throw updateError

    // Update dynamic fields
    const fieldsToUpdate = []

    if (description !== undefined) {
      fieldsToUpdate.push({
        field_name: 'description',
        field_value_text: description
      })
    }

    if (color_code !== undefined) {
      fieldsToUpdate.push({
        field_name: 'color_code',
        field_value_text: color_code
      })
    }

    if (icon !== undefined) {
      fieldsToUpdate.push({
        field_name: 'icon',
        field_value_text: icon
      })
    }

    if (sort_order !== undefined) {
      fieldsToUpdate.push({
        field_name: 'sort_order',
        field_value_number: parseInt(sort_order) || 0
      })
    }

    for (const field of fieldsToUpdate) {
      const { error: upsertError } = await supabase
        .from('core_dynamic_data')
        .upsert({
          entity_id: categoryId,
          field_name: field.field_name,
          ...field,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'entity_id,field_name'
        })

      if (upsertError) throw upsertError
    }

    return NextResponse.json({
      message: 'Category updated successfully'
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category', details: error },
      { status: 500 }
    )
  }
}

// DELETE: Soft delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params

    // Check if category has services
    const { data: services, error: servicesError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id')
      .eq('field_name', 'category')
      .eq('field_value_text', categoryId)
      .limit(1)

    if (servicesError) throw servicesError

    if (services && services.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing services' },
        { status: 400 }
      )
    }

    // Soft delete the category
    const { error } = await supabase
      .from('core_entities')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)

    if (error) throw error

    return NextResponse.json({
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category', details: error },
      { status: 500 }
    )
  }
}