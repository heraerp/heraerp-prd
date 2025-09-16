import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabase-admin'

// HERA System Organization - source of all industry templates
const HERA_SYSTEM_ORG = '719dfed1-09b4-4ca8-bfda-f682460de945'

interface IndustryConfigurationRequest {
  organization_id: string
  industry_type:
    | 'restaurant'
    | 'healthcare'
    | 'manufacturing'
    | 'professional'
    | 'retail'
    | 'legal'
    | 'education'
  configuration_options: {
    business_model: string
    deployment_mode: '24_hour_rapid' | 'phased_rollout' | 'pilot_program'
    template_customization_level: 'standard' | 'customized' | 'fully_bespoke'
    integration_requirements?: Array<
      'accounting' | 'pos' | 'inventory' | 'crm' | 'hr' | 'compliance'
    >
    compliance_frameworks?: Array<string>
    localization_requirements?: Array<string>
  }
  sap_migration?: {
    migrate_from_sap: boolean
    sap_modules_to_replace: Array<string>
    data_migration_scope: 'full' | 'selective' | 'parallel_run'
    migration_timeline_days: number
  }
  validation_requirements?: {
    industry_compliance_validation: boolean
    performance_benchmarking: boolean
    integration_testing: boolean
    user_acceptance_testing: boolean
  }
}

interface IndustryConfigurationResponse {
  configuration_id: string
  organization_id: string
  industry_type: string
  deployment_plan: {
    total_implementation_hours: number
    implementation_phases: Array<{
      phase_name: string
      duration_hours: number
      deliverables: string[]
      sap_modules_replaced: string[]
      validation_checkpoints: string[]
    }>
    rapid_deployment_schedule: {
      hour_0_6: string[]
      hour_6_12: string[]
      hour_12_18: string[]
      hour_18_24: string[]
    }
  }
  template_deployment: {
    templates_copied: number
    smart_codes_generated: number
    industry_adapters_configured: number
    custom_configurations: Record<string, any>
  }
  sap_replacement_analysis: {
    sap_modules_replaced: Array<{
      sap_module: string
      hera_equivalent: string
      functionality_parity: string
      cost_savings_estimate: string
      implementation_time_reduction: string
    }>
    total_sap_license_savings: string
    total_implementation_time_savings: string
  }
  go_live_checklist: {
    technical_validation: Array<{
      checkpoint: string
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
      validation_criteria: string[]
    }>
    business_validation: Array<{
      process: string
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
      acceptance_criteria: string[]
    }>
    compliance_validation: Array<{
      framework: string
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
      compliance_requirements: string[]
    }>
  }
  support_framework: {
    onboarding_plan: string[]
    training_modules: string[]
    ongoing_support_level: string
    optimization_recommendations: string[]
  }
}

// Industry-specific configuration templates
const INDUSTRY_TEMPLATES = {
  restaurant: {
    business_models: [
      'quick_service',
      'casual_dining',
      'fine_dining',
      'food_truck',
      'catering',
      'delivery_only'
    ],
    core_modules: [
      'POS',
      'Inventory',
      'Recipe_Management',
      'Labor_Scheduling',
      'Financial_Reporting'
    ],
    sap_equivalents: ['SAP_Retail', 'SAP_S4HANA_Restaurant', 'SAP_ByDesign'],
    compliance_frameworks: ['FDA_Food_Safety', 'Local_Health_Department', 'IRS_Restaurant_Tax'],
    key_integrations: ['pos', 'inventory', 'accounting', 'hr'],
    implementation_hours: 18,
    template_count: 25
  },
  healthcare: {
    business_models: [
      'hospital',
      'clinic',
      'dental_practice',
      'specialty_practice',
      'medical_device',
      'pharmacy'
    ],
    core_modules: [
      'Patient_Management',
      'Billing',
      'Insurance_Claims',
      'Inventory',
      'Compliance_Tracking'
    ],
    sap_equivalents: ['SAP_Healthcare', 'SAP_S4HANA_for_Healthcare', 'SAP_Patient_Management'],
    compliance_frameworks: ['HIPAA', 'FDA_Medical_Device', 'CMS_Medicare', 'Joint_Commission'],
    key_integrations: ['emr', 'billing', 'insurance', 'inventory', 'compliance'],
    implementation_hours: 20,
    template_count: 35
  },
  manufacturing: {
    business_models: [
      'discrete_manufacturing',
      'process_manufacturing',
      'make_to_order',
      'make_to_stock',
      'engineer_to_order'
    ],
    core_modules: [
      'Production_Planning',
      'Quality_Management',
      'Supply_Chain',
      'Asset_Management',
      'Cost_Accounting'
    ],
    sap_equivalents: ['SAP_PP', 'SAP_QM', 'SAP_MM', 'SAP_PM', 'SAP_CO'],
    compliance_frameworks: ['ISO_9001', 'ISO_14001', 'OSHA', 'FDA_Manufacturing'],
    key_integrations: ['erp', 'mes', 'quality', 'maintenance', 'accounting'],
    implementation_hours: 24,
    template_count: 45
  },
  professional: {
    business_models: [
      'consulting',
      'accounting_firm',
      'law_firm',
      'engineering_firm',
      'marketing_agency'
    ],
    core_modules: [
      'Project_Management',
      'Time_Tracking',
      'Client_Billing',
      'Document_Management',
      'CRM'
    ],
    sap_equivalents: ['SAP_PS', 'SAP_CRM', 'SAP_Document_Management', 'SAP_Time_Management'],
    compliance_frameworks: ['SOX_Compliance', 'Professional_Standards', 'Client_Confidentiality'],
    key_integrations: ['crm', 'project_management', 'document_management', 'accounting'],
    implementation_hours: 16,
    template_count: 20
  },
  retail: {
    business_models: ['brick_and_mortar', 'ecommerce', 'omnichannel', 'franchise', 'wholesale'],
    core_modules: [
      'Inventory_Management',
      'POS',
      'Customer_Management',
      'Supply_Chain',
      'Marketing'
    ],
    sap_equivalents: ['SAP_Retail', 'SAP_Customer_Engagement', 'SAP_Supply_Chain'],
    compliance_frameworks: ['PCI_DSS', 'Consumer_Protection', 'Sales_Tax_Compliance'],
    key_integrations: ['pos', 'ecommerce', 'inventory', 'crm', 'marketing'],
    implementation_hours: 20,
    template_count: 30
  }
}

async function configureIndustryDeployment(
  request: IndustryConfigurationRequest
): Promise<IndustryConfigurationResponse> {
  const configurationId = `industry_config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const industryTemplate = INDUSTRY_TEMPLATES[request.industry_type]

  if (!industryTemplate) {
    throw new Error(`Unsupported industry type: ${request.industry_type}`)
  }

  try {
    // Step 1: Copy industry templates from HERA System Organization
    const templateCopyResult = await copyIndustryTemplates(
      request.organization_id,
      request.industry_type,
      request.configuration_options.template_customization_level
    )

    // Step 2: Configure industry-specific adapters
    const adapterConfiguration = await configureIndustryAdapters(
      request.organization_id,
      request.industry_type,
      request.configuration_options
    )

    // Step 3: Generate deployment plan
    const deploymentPlan = generateDeploymentPlan(
      request.industry_type,
      request.configuration_options.deployment_mode,
      industryTemplate
    )

    // Step 4: Create SAP replacement analysis
    const sapAnalysis = generateSAPReplacementAnalysis(
      request.industry_type,
      request.sap_migration,
      industryTemplate
    )

    // Step 5: Generate go-live checklist
    const goLiveChecklist = generateGoLiveChecklist(
      request.industry_type,
      request.validation_requirements,
      industryTemplate
    )

    // Step 6: Store configuration record
    await storeConfigurationRecord(configurationId, request, {
      templateCopyResult,
      adapterConfiguration,
      deploymentPlan,
      sapAnalysis
    })

    return {
      configuration_id: configurationId,
      organization_id: request.organization_id,
      industry_type: request.industry_type,
      deployment_plan: deploymentPlan,
      template_deployment: templateCopyResult,
      sap_replacement_analysis: sapAnalysis,
      go_live_checklist: goLiveChecklist,
      support_framework: generateSupportFramework(request.industry_type, industryTemplate)
    }
  } catch (error) {
    throw new Error(`Industry configuration failed: ${(error as Error).message}`)
  }
}

async function copyIndustryTemplates(
  organizationId: string,
  industryType: string,
  customizationLevel: string
) {
  // Get all templates for the industry from HERA System Organization
  const { data: industryTemplates } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', HERA_SYSTEM_ORG)
    .ilike('smart_code', `HERA.${getIndustryCode(industryType)}.%`)

  if (!industryTemplates || industryTemplates.length === 0) {
    throw new Error(`No templates found for industry: ${industryType}`)
  }

  // Copy templates using the template copy API
  const templateCodes = industryTemplates.map(t => t.entity_code)

  const copyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'copy',
      source_organization_id: HERA_SYSTEM_ORG,
      target_organization_id: organizationId,
      template_codes: templateCodes,
      copy_options: {
        customize_smart_codes: customizationLevel !== 'standard',
        update_organization_references: true,
        copy_dynamic_data: true,
        copy_relationships: true,
        validation_level: 'L3_PERFORMANCE'
      }
    })
  })

  const copyResult = await copyResponse.json()

  return {
    templates_copied: copyResult.templates_copied || 0,
    smart_codes_generated: templateCodes.length,
    industry_adapters_configured: 1,
    custom_configurations: {
      customization_level: customizationLevel,
      templates_customized: copyResult.templates_copied || 0,
      validation_results: copyResult.validation_results || []
    }
  }
}

async function configureIndustryAdapters(
  organizationId: string,
  industryType: string,
  options: any
) {
  // Create industry-specific adapter configuration
  const adapterConfig = {
    industry_type: industryType,
    business_model: options.business_model,
    integration_requirements: options.integration_requirements || [],
    compliance_frameworks: options.compliance_frameworks || [],
    localization_requirements: options.localization_requirements || []
  }

  // Store adapter configuration
  const { data: adapterEntity } = await supabase
    .from('core_entities')
    .insert([
      {
        organization_id: organizationId,
        entity_type: 'industry_adapter',
        entity_name: `${industryType.toUpperCase()} Industry Adapter`,
        entity_code: `ADAPTER-${industryType.toUpperCase()}-001`,
        smart_code: `HERA.${getIndustryCode(industryType)}.ADAPTER.ENT.CONFIGURATION.v1`,
        smart_code_status: 'PROD',
        status: 'active',
        metadata: {
          adapter_type: 'industry_configuration',
          industry_template: INDUSTRY_TEMPLATES[industryType],
          configuration: adapterConfig,
          deployment_ready: true
        }
      }
    ])
    .select()
    .single()

  return adapterEntity
}

function generateDeploymentPlan(
  industryType: string,
  deploymentMode: string,
  industryTemplate: any
) {
  const baseHours = industryTemplate.implementation_hours

  let totalHours = baseHours
  if (deploymentMode === 'phased_rollout') totalHours *= 1.5
  if (deploymentMode === 'pilot_program') totalHours *= 0.75

  const phases = [
    {
      phase_name: 'Foundation Setup',
      duration_hours: Math.ceil(totalHours * 0.25),
      deliverables: [
        'Universal schema deployment',
        'Core entity templates installation',
        'Basic security configuration',
        'Initial user setup'
      ],
      sap_modules_replaced: ['SAP Basis', 'SAP Security'],
      validation_checkpoints: ['Schema validation', 'User access testing']
    },
    {
      phase_name: 'Industry Configuration',
      duration_hours: Math.ceil(totalHours * 0.35),
      deliverables: [
        'Industry-specific templates deployment',
        'Business process configuration',
        'Compliance framework setup',
        'Integration point configuration'
      ],
      sap_modules_replaced: industryTemplate.sap_equivalents.slice(0, 2),
      validation_checkpoints: ['Template validation', 'Process flow testing']
    },
    {
      phase_name: 'Integration & Testing',
      duration_hours: Math.ceil(totalHours * 0.25),
      deliverables: [
        'External system integrations',
        'Data migration execution',
        'End-to-end testing',
        'Performance optimization'
      ],
      sap_modules_replaced: industryTemplate.sap_equivalents.slice(2),
      validation_checkpoints: ['Integration testing', 'Performance benchmarking']
    },
    {
      phase_name: 'Go-Live & Support',
      duration_hours: Math.ceil(totalHours * 0.15),
      deliverables: [
        'Production deployment',
        'User training completion',
        'Go-live support',
        'Post-deployment optimization'
      ],
      sap_modules_replaced: ['SAP Support'],
      validation_checkpoints: ['Go-live readiness', 'User acceptance']
    }
  ]

  // 24-hour rapid deployment schedule
  const rapidSchedule = {
    hour_0_6: [
      'Deploy universal 6-table schema',
      'Configure organization and users',
      'Install core industry templates',
      'Set up basic security'
    ],
    hour_6_12: [
      'Configure business processes',
      'Set up compliance frameworks',
      'Deploy industry-specific entities',
      'Configure integrations'
    ],
    hour_12_18: [
      'Execute data migration',
      'Configure workflows and approvals',
      'Set up reporting and dashboards',
      'Complete integration testing'
    ],
    hour_18_24: [
      'Conduct user training',
      'Perform final validations',
      'Execute go-live procedures',
      'Provide go-live support'
    ]
  }

  return {
    total_implementation_hours: totalHours,
    implementation_phases: phases,
    rapid_deployment_schedule: rapidSchedule
  }
}

function generateSAPReplacementAnalysis(
  industryType: string,
  sapMigration: any,
  industryTemplate: any
) {
  const sapModules = sapMigration?.sap_modules_to_replace || industryTemplate.sap_equivalents

  const moduleReplacements = sapModules.map((sapModule: string) => ({
    sap_module: sapModule,
    hera_equivalent: `HERA Universal ${sapModule.replace('SAP_', '').replace('_', ' ')} Framework`,
    functionality_parity: '100% + Enhanced Features',
    cost_savings_estimate: '90% reduction',
    implementation_time_reduction: '95% faster (24 hours vs 12-21 months)'
  }))

  return {
    sap_modules_replaced: moduleReplacements,
    total_sap_license_savings: '$2.6M per year (90% of typical $2.9M SAP total cost)',
    total_implementation_time_savings: '12-21 months reduced to 24 hours'
  }
}

function generateGoLiveChecklist(
  industryType: string,
  validationRequirements: any,
  industryTemplate: any
) {
  const technicalValidation = [
    {
      checkpoint: 'Schema Deployment Validation',
      status: 'PENDING' as const,
      validation_criteria: [
        'All 6 universal tables deployed',
        'Proper indexing configured',
        'RLS policies active'
      ]
    },
    {
      checkpoint: 'Template Configuration Validation',
      status: 'PENDING' as const,
      validation_criteria: [
        'Industry templates copied',
        'Smart codes validated',
        'Dynamic data configured'
      ]
    },
    {
      checkpoint: 'Integration Testing',
      status: 'PENDING' as const,
      validation_criteria: [
        'External APIs responding',
        'Data synchronization working',
        'Error handling tested'
      ]
    },
    {
      checkpoint: 'Performance Benchmarking',
      status: 'PENDING' as const,
      validation_criteria: [
        'Sub-second response times',
        'Concurrent user testing',
        'Load testing completed'
      ]
    }
  ]

  const businessValidation = [
    {
      process: 'Core Business Workflows',
      status: 'PENDING' as const,
      acceptance_criteria: [
        'End-to-end process testing',
        'Business rule validation',
        'Exception handling verified'
      ]
    },
    {
      process: 'Reporting and Analytics',
      status: 'PENDING' as const,
      acceptance_criteria: [
        'Standard reports generating',
        'Custom dashboards working',
        'Data accuracy verified'
      ]
    },
    {
      process: 'User Access and Security',
      status: 'PENDING' as const,
      acceptance_criteria: [
        'User roles configured',
        'Permissions testing passed',
        'Audit trails working'
      ]
    }
  ]

  const complianceValidation = (industryTemplate.compliance_frameworks || []).map(
    (framework: string) => ({
      framework,
      status: 'PENDING' as const,
      compliance_requirements: [
        `${framework} requirements verified`,
        'Audit trail compliance',
        'Documentation complete'
      ]
    })
  )

  return {
    technical_validation: technicalValidation,
    business_validation: businessValidation,
    compliance_validation: complianceValidation
  }
}

function generateSupportFramework(industryType: string, industryTemplate: any) {
  return {
    onboarding_plan: [
      'Executive overview and ROI presentation',
      'Administrator training (4 hours)',
      'End-user training (2 hours per role)',
      'Go-live support (24/7 for first week)'
    ],
    training_modules: [
      `${industryType.toUpperCase()} Industry Overview`,
      'Universal HERA Platform Navigation',
      'Business Process Configuration',
      'Reporting and Analytics',
      'Integration Management',
      'System Administration'
    ],
    ongoing_support_level: 'Premier Support with dedicated success manager',
    optimization_recommendations: [
      'Monthly performance reviews',
      'Quarterly business process optimization',
      'Annual system health checks',
      'Continuous user training programs'
    ]
  }
}

async function storeConfigurationRecord(
  configurationId: string,
  request: IndustryConfigurationRequest,
  results: any
) {
  await supabase.from('universal_transactions').insert([
    {
      organization_id: request.organization_id,
      transaction_type: 'industry_configuration',
      transaction_code: configurationId,
      reference_number: request.industry_type,
      transaction_date: new Date().toISOString(),
      total_amount: results.deploymentPlan.total_implementation_hours,
      smart_code: 'HERA.SYSTEM.INDUSTRY.TXN.CONFIGURATION.v1',
      business_context: {
        industry_type: request.industry_type,
        deployment_mode: request.configuration_options.deployment_mode,
        customization_level: request.configuration_options.template_customization_level,
        sap_migration: request.sap_migration || null
      },
      metadata: {
        configuration_request: request,
        deployment_results: results
      }
    }
  ])
}

function getIndustryCode(industryType: string): string {
  const industryCodeMap: Record<string, string> = {
    restaurant: 'REST',
    healthcare: 'HLTH',
    manufacturing: 'MFG',
    professional: 'PROF',
    retail: 'RETAIL',
    legal: 'LEGAL',
    education: 'EDU'
  }
  return industryCodeMap[industryType] || 'PROF'
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body: IndustryConfigurationRequest = await request.json()

    if (!body.organization_id || !body.industry_type) {
      return NextResponse.json(
        { error: 'organization_id and industry_type are required' },
        { status: 400 }
      )
    }

    const result = await configureIndustryDeployment(body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Industry configuration error:', error)
    return NextResponse.json(
      {
        error: 'Industry configuration failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()

  return NextResponse.json({
    endpoint: '/api/v1/industry/configure',
    description: 'HERA Industry Configuration Engine - 24-Hour ERP Implementation',
    supported_industries: Object.keys(INDUSTRY_TEMPLATES),
    industry_details: INDUSTRY_TEMPLATES,
    deployment_modes: ['24_hour_rapid', 'phased_rollout', 'pilot_program'],
    customization_levels: ['standard', 'customized', 'fully_bespoke'],
    sap_replacement_capabilities: {
      implementation_time: '24 hours vs SAP 12-21 months',
      cost_savings: '90% lower cost ($290K vs $2.9M)',
      functionality_parity: '100% + additional capabilities',
      modules_replaced: 'All major SAP modules with enhanced features'
    },
    example_request: {
      organization_id: 'uuid-here',
      industry_type: 'restaurant',
      configuration_options: {
        business_model: 'casual_dining',
        deployment_mode: '24_hour_rapid',
        template_customization_level: 'customized',
        integration_requirements: ['pos', 'inventory', 'accounting'],
        compliance_frameworks: ['FDA_Food_Safety', 'Local_Health_Department']
      },
      sap_migration: {
        migrate_from_sap: true,
        sap_modules_to_replace: ['SAP_Retail', 'SAP_MM', 'SAP_FI'],
        data_migration_scope: 'full',
        migration_timeline_days: 1
      },
      validation_requirements: {
        industry_compliance_validation: true,
        performance_benchmarking: true,
        integration_testing: true,
        user_acceptance_testing: true
      }
    }
  })
}
