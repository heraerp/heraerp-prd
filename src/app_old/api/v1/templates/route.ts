import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// HERA System Organization - source of all master templates
const HERA_SYSTEM_ORG = '719dfed1-09b4-4ca8-bfda-f682460de945'

interface TemplateListRequest {
  organization_id?: string
  template_types?: Array<
    | 'bom_template'
    | 'pricing_template'
    | 'calculation_engine'
    | 'validation_engine'
    | 'industry_adapter'
    | 'cost_accounting_framework'
  >
  include_system_templates?: boolean
  industry_filter?: Array<'restaurant' | 'healthcare' | 'manufacturing' | 'professional' | 'system'>
}

interface TemplateCopyRequest {
  source_organization_id: string
  target_organization_id: string
  template_codes: string[]
  copy_options?: {
    customize_smart_codes?: boolean
    update_organization_references?: boolean
    copy_dynamic_data?: boolean
    copy_relationships?: boolean
    validation_level?: 'L1_SYNTAX' | 'L2_SEMANTIC' | 'L3_PERFORMANCE' | 'L4_INTEGRATION'
  }
}

interface TemplateCustomizeRequest {
  organization_id: string
  template_code: string
  customizations: {
    entity_name?: string
    metadata_updates?: Record<string, any>
    dynamic_field_updates?: Array<{
      field_name: string
      field_value: any
      action: 'add' | 'update' | 'remove'
    }>
  }
  validation_options?: {
    validate_after_customization?: boolean
    validation_level?: 'L1_SYNTAX' | 'L2_SEMANTIC' | 'L3_PERFORMANCE' | 'L4_INTEGRATION'
  }
}

// GET - List available templates
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const templateTypes = searchParams.get('template_types')?.split(',')
    const includeSystem = searchParams.get('include_system') === 'true'
    const industryFilter = searchParams.get('industry')?.split(',')

    if (!organizationId && !includeSystem) {
      return NextResponse.json({
        endpoint: '/api/v1/templates',
        description: 'HERA-SPEAR Template Management System',
        available_template_types: [
          'bom_template',
          'pricing_template',
          'calculation_engine',
          'validation_engine',
          'industry_adapter',
          'cost_accounting_framework'
        ],
        sap_equivalent_features: {
          cost_accounting_framework:
            'Replaces SAP CO Module (Cost Center Accounting, Internal Orders, ABC)',
          bom_template: 'Replaces SAP PC Module (Product Cost Management)',
          pricing_template: 'Replaces SAP CO-PA (Profitability Analysis)',
          calculation_engine: 'Replaces SAP Universal Journal + Material Ledger'
        },
        implementation_speed: '24 hours vs SAP 12-21 months',
        cost_savings: '90% lower cost ($290K vs $2.9M)',
        example_request: {
          organization_id: 'uuid-here',
          template_types: ['bom_template', 'pricing_template'],
          include_system_templates: true,
          industry_filter: ['restaurant', 'healthcare']
        }
      })
    }

    // Build query for templates
    let query = supabase.from('core_entities').select(`
        id,
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        smart_code_status,
        smart_code_version,
        organization_id,
        status,
        metadata,
        created_at,
        updated_at,
        core_organizations!core_entities_organization_id_fkey(organization_name)
      `)

    // Organization filter
    const orgFilters = []
    if (organizationId) orgFilters.push(organizationId)
    if (includeSystem) orgFilters.push(HERA_SYSTEM_ORG)

    if (orgFilters.length > 0) {
      query = query.in('organization_id', orgFilters)
    }

    // Template type filter
    const templateTypeFilters = [
      'bom_template',
      'pricing_template',
      'calculation_engine',
      'validation_engine',
      'industry_adapter',
      'implementation_framework',
      'cost_accounting_framework'
    ]

    if (templateTypes && templateTypes.length > 0) {
      query = query.in('entity_type', templateTypes)
    } else {
      query = query.in('entity_type', templateTypeFilters)
    }

    // Industry filter (based on smart code patterns)
    if (industryFilter && industryFilter.length > 0) {
      const industryPatterns = industryFilter.map(industry => {
        switch (industry) {
          case 'restaurant':
            return 'HERA.REST.%'
          case 'healthcare':
            return 'HERA.HLTH.%'
          case 'manufacturing':
            return 'HERA.MFG.%'
          case 'system':
            return 'HERA.SYSTEM.%'
          default:
            return 'HERA.PROF.%'
        }
      })

      // Build OR condition for industry patterns
      const industryConditions = industryPatterns
        .map(pattern => `smart_code.ilike.${pattern}`)
        .join(',')
      query = query.or(industryConditions)
    }

    query = query
      .order('entity_type', { ascending: true })
      .order('entity_name', { ascending: true })

    const { data: templates, error } = await query

    if (error) {
      throw error
    }

    // Group templates by type and add SAP comparison
    const templatesByType = templates?.reduce((acc: any, template) => {
      const type = template.entity_type
      if (!acc[type]) {
        acc[type] = {
          template_type: type,
          sap_equivalent: getSAPEquivalent(type),
          templates: []
        }
      }
      acc[type].templates.push({
        ...template,
        organization_name: template.core_organizations?.organization_name,
        is_system_template: template.organization_id === HERA_SYSTEM_ORG
      })
      return acc
    }, {})

    return NextResponse.json({
      templates_by_type: templatesByType || {},
      total_templates: templates?.length || 0,
      system_templates: templates?.filter(t => t.organization_id === HERA_SYSTEM_ORG).length || 0,
      client_templates: templates?.filter(t => t.organization_id !== HERA_SYSTEM_ORG).length || 0,
      hera_advantages: {
        implementation_time: '24 hours',
        sap_implementation_time: '12-21 months',
        cost_savings: '90% lower cost',
        feature_parity: '100% + additional capabilities',
        real_time_processing: 'Built-in (no period-end delays)',
        integration_complexity: 'Zero (unified architecture)'
      }
    })
  } catch (error) {
    console.error('Template list error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve templates',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

// POST - Copy templates or customize existing ones
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body = await request.json()
    const action = body.action || 'copy'

    switch (action) {
      case 'copy':
        return await copyTemplates(body as TemplateCopyRequest)
      case 'customize':
        return await customizeTemplate(body as TemplateCustomizeRequest)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: copy, customize' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Template operation error:', error)
    return NextResponse.json(
      {
        error: 'Template operation failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

async function copyTemplates(request: TemplateCopyRequest) {
  const {
    source_organization_id,
    target_organization_id,
    template_codes,
    copy_options = {}
  } = request

  const {
    customize_smart_codes = true,
    update_organization_references = true,
    copy_dynamic_data = true,
    copy_relationships = true,
    validation_level = 'L2_SEMANTIC'
  } = copy_options

  try {
    // Get source templates
    const { data: sourceTemplates, error: fetchError } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        dynamic_data:core_dynamic_data(*),
        relationships:core_relationships(*)
      `
      )
      .eq('organization_id', source_organization_id)
      .in('entity_code', template_codes)

    if (fetchError) throw fetchError

    if (!sourceTemplates || sourceTemplates.length === 0) {
      return NextResponse.json({ error: 'No templates found with provided codes' }, { status: 404 })
    }

    const copiedTemplates = []
    const errors = []

    for (const template of sourceTemplates) {
      try {
        // Create new entity with updated organization
        const newEntity = {
          ...template,
          id: undefined, // Let Supabase generate new ID
          organization_id: target_organization_id,
          entity_code: `${template.entity_code}-COPY-${Date.now()}`,
          entity_name: `${template.entity_name} (Copy)`,
          created_at: undefined,
          updated_at: undefined
        }

        // Update smart code if requested
        if (customize_smart_codes && template.smart_code) {
          // Replace organization context in smart code
          newEntity.smart_code = updateSmartCodeForOrganization(
            template.smart_code,
            target_organization_id
          )
        }

        // Update metadata organization references
        if (update_organization_references && template.metadata) {
          newEntity.metadata = updateOrganizationReferences(
            template.metadata,
            target_organization_id
          )
        }

        // Insert new entity
        const { data: newEntityData, error: insertError } = await supabase
          .from('core_entities')
          .insert([newEntity])
          .select()
          .single()

        if (insertError) throw insertError

        // Copy dynamic data if requested
        if (copy_dynamic_data && template.dynamic_data && template.dynamic_data.length > 0) {
          const dynamicDataCopies = template.dynamic_data.map((dd: any) => ({
            entity_id: newEntityData.id,
            organization_id: target_organization_id,
            field_name: dd.field_name,
            field_type: dd.field_type,
            field_value_text: dd.field_value_text,
            field_value_number: dd.field_value_number,
            field_value_boolean: dd.field_value_boolean,
            field_value_json: dd.field_value_json,
            smart_code: dd.smart_code,
            smart_code_context: dd.smart_code_context
          }))

          await supabase.from('core_dynamic_data').insert(dynamicDataCopies)
        }

        // Copy relationships if requested (this would need mapping logic)
        if (copy_relationships && template.relationships && template.relationships.length > 0) {
          // Note: Relationship copying is complex as it requires mapping target entities
          // For now, we'll skip this and add a warning
        }

        copiedTemplates.push({
          source_code: template.entity_code,
          target_code: newEntity.entity_code,
          entity_id: newEntityData.id,
          smart_code: newEntity.smart_code,
          status: 'copied_successfully'
        })
      } catch (copyError) {
        errors.push({
          template_code: template.entity_code,
          error: (copyError as Error).message
        })
      }
    }

    // Validate copied templates if requested
    const validationResults = []
    if (validation_level && copiedTemplates.length > 0) {
      for (const copied of copiedTemplates) {
        try {
          const validationResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/validation/4-level`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                organization_id: target_organization_id,
                validation_target: {
                  type: 'entity',
                  target_id: copied.entity_id,
                  smart_code: copied.smart_code
                },
                validation_levels: [validation_level]
              })
            }
          )

          const validation = await validationResponse.json()
          validationResults.push({
            template_code: copied.target_code,
            validation_result: validation.overall_result,
            validation_time_ms: validation.total_execution_time_ms
          })
        } catch (validationError) {
          validationResults.push({
            template_code: copied.target_code,
            validation_result: 'VALIDATION_FAILED',
            error: (validationError as Error).message
          })
        }
      }
    }

    return NextResponse.json({
      operation: 'template_copy',
      source_organization_id,
      target_organization_id,
      templates_requested: template_codes.length,
      templates_copied: copiedTemplates.length,
      templates_failed: errors.length,
      copied_templates: copiedTemplates,
      errors: errors.length > 0 ? errors : undefined,
      validation_results: validationResults.length > 0 ? validationResults : undefined,
      next_steps: [
        'Review copied templates for organization-specific customizations',
        'Test template functionality in target organization',
        'Update any hardcoded references to source organization'
      ]
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Template copy operation failed',
        details: (error as Error).message
      },
      { status: 500 }
    )
  }
}

async function customizeTemplate(request: TemplateCustomizeRequest) {
  const { organization_id, template_code, customizations, validation_options = {} } = request

  try {
    // Get existing template
    const { data: template, error: fetchError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('entity_code', template_code)
      .single()

    if (fetchError) throw fetchError

    // Apply customizations
    const updates: any = {}
    if (customizations.entity_name) {
      updates.entity_name = customizations.entity_name
    }
    if (customizations.metadata_updates) {
      updates.metadata = {
        ...template.metadata,
        ...customizations.metadata_updates,
        customization_history: [
          ...((template.metadata as any)?.customization_history || []),
          {
            timestamp: new Date().toISOString(),
            changes: Object.keys(customizations.metadata_updates)
          }
        ]
      }
    }

    // Update entity
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('core_entities')
      .update(updates)
      .eq('id', template.id)
      .select()
      .single()

    if (updateError) throw updateError

    // Handle dynamic field updates
    if (customizations.dynamic_field_updates && customizations.dynamic_field_updates.length > 0) {
      for (const fieldUpdate of customizations.dynamic_field_updates) {
        switch (fieldUpdate.action) {
          case 'add':
          case 'update':
            await supabase.from('core_dynamic_data').upsert({
              entity_id: template.id,
              organization_id,
              field_name: fieldUpdate.field_name,
              field_type: typeof fieldUpdate.field_value,
              [`field_value_${typeof fieldUpdate.field_value}`]: fieldUpdate.field_value
            })
            break
          case 'remove':
            await supabase
              .from('core_dynamic_data')
              .delete()
              .eq('entity_id', template.id)
              .eq('field_name', fieldUpdate.field_name)
            break
        }
      }
    }

    // Validate if requested
    let validationResult = undefined
    if (validation_options.validate_after_customization) {
      const validationResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/validation/4-level`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id,
            validation_target: {
              type: 'entity',
              target_id: template.id,
              smart_code: updatedTemplate.smart_code,
              data: updatedTemplate
            },
            validation_levels: [validation_options.validation_level || 'L2_SEMANTIC']
          })
        }
      )

      validationResult = await validationResponse.json()
    }

    return NextResponse.json({
      operation: 'template_customize',
      template_code,
      customizations_applied: {
        entity_updates: Object.keys(updates),
        dynamic_field_updates: customizations.dynamic_field_updates?.length || 0
      },
      updated_template: {
        id: updatedTemplate.id,
        entity_name: updatedTemplate.entity_name,
        smart_code: updatedTemplate.smart_code,
        updated_at: updatedTemplate.updated_at
      },
      validation_result,
      suggestions: [
        'Template customization completed successfully',
        'Consider running full L4_INTEGRATION validation before production use',
        'Update any dependent templates or configurations'
      ]
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Template customization failed',
        details: (error as Error).message
      },
      { status: 500 }
    )
  }
}

function getSAPEquivalent(templateType: string): string {
  const sapMappings: Record<string, string> = {
    cost_accounting_framework:
      'SAP CO Module (CSKS, AUFK, PRPS) - Cost Centers, Internal Orders, Projects',
    bom_template: 'SAP PC Module (CS01, CS02, CS03) - BOM Management, Product Costing',
    pricing_template: 'SAP CO-PA (KE21N, KE24, KE30) - Profitability Analysis',
    calculation_engine: 'SAP Universal Journal (ACDOCA) + Material Ledger (CKM3N)',
    validation_engine: 'SAP Data Quality Management + Process Validation',
    industry_adapter: 'SAP Industry-Specific Solutions (IS-Retail, IS-Healthcare, etc.)'
  }

  return sapMappings[templateType] || 'SAP Standard Functionality'
}

function updateSmartCodeForOrganization(smartCode: string, organizationId: string): string {
  // For now, keep the same smart code but this could be enhanced
  // to include organization-specific variations
  return smartCode
}

function updateOrganizationReferences(metadata: any, organizationId: string): any {
  // Deep clone and update organization references
  const updated = JSON.parse(JSON.stringify(metadata))

  // Update any organization_id references in metadata
  if (updated.organization_references) {
    updated.organization_references = updated.organization_references.map((ref: any) => ({
      ...ref,
      target_organization_id: organizationId
    }))
  }

  // Add customization tracking
  updated.customization_info = {
    copied_to_organization: organizationId,
    copied_at: new Date().toISOString(),
    original_metadata_preserved: true
  }

  return updated
}
