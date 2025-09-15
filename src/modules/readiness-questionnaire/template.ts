/**
 * HERA ERP Readiness Questionnaire Template
 * Smart Code: HERA.ERP.READINESS.TEMPLATE.SEED.V1
 *
 * Seed template with 12 sections for comprehensive ERP readiness assessment
 */

import { QuestionnaireTemplate, Section, Question } from './types'

export const createReadinessTemplate = (organizationId: string): QuestionnaireTemplate => {
  const template: QuestionnaireTemplate = {
    id: `template_${Date.now()}`,
    organization_id: organizationId,
    title: 'ERP Readiness Assessment',
    version: 1,
    smart_code: 'HERA.ERP.Readiness.Template.Questionnaire.V1',
    sections: []
  }

  // Section 1: Company Profile
  const companyProfile: Section = {
    code: 'COMPANY_PROFILE',
    title: 'Company Profile',
    description: 'Basic information about your organization',
    display_order: 1,
    smart_code: 'HERA.ERP.Readiness.Section.Standard.V1',
    questions: [
      {
        id: 'cp_001',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'COMPANY_PROFILE',
        prompt: 'What are your main business lines?',
        help_text: 'Select all that apply to your organization',
        input_type: 'multiselect',
        options: [
          { code: 'MANUFACTURING', label: 'Manufacturing' },
          { code: 'TRADING', label: 'Trading/Distribution' },
          { code: 'PROJECT_SERVICES', label: 'Project Services' },
          { code: 'RETAIL', label: 'Retail' },
          { code: 'CONSULTING', label: 'Consulting' },
          { code: 'HEALTHCARE', label: 'Healthcare' },
          { code: 'HOSPITALITY', label: 'Hospitality' },
          { code: 'OTHER', label: 'Other' }
        ],
        required: true,
        display_order: 1,
        kpi_tags: ['business_model', 'complexity']
      },
      {
        id: 'cp_002',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'COMPANY_PROFILE',
        prompt: 'What is your annual revenue range?',
        input_type: 'select',
        options: [
          { code: 'UNDER_1M', label: 'Under $1M' },
          { code: '1M_5M', label: '$1M - $5M' },
          { code: '5M_25M', label: '$5M - $25M' },
          { code: '25M_100M', label: '$25M - $100M' },
          { code: 'OVER_100M', label: 'Over $100M' }
        ],
        required: true,
        display_order: 2,
        kpi_tags: ['scale', 'complexity']
      },
      {
        id: 'cp_003',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Number.V1',
        section_code: 'COMPANY_PROFILE',
        prompt: 'How many employees does your organization have?',
        input_type: 'number',
        required: true,
        display_order: 3,
        kpi_tags: ['scale', 'hr_complexity']
      }
    ]
  }

  // Section 2: Sales
  const sales: Section = {
    code: 'SALES',
    title: 'Sales Management',
    description: 'Current sales processes and requirements',
    display_order: 2,
    smart_code: 'HERA.ERP.Readiness.Section.Standard.V1',
    questions: [
      {
        id: 'sl_001',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'SALES',
        prompt: 'Do you need alerts for overdue payments or credit limits?',
        help_text: 'This helps manage customer credit risk and cash flow',
        input_type: 'yesno',
        required: true,
        display_order: 1,
        kpi_tags: ['credit_management', 'cash_flow']
      },
      {
        id: 'sl_002',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'SALES',
        prompt: 'What is your primary sales channel?',
        input_type: 'select',
        options: [
          { code: 'DIRECT_SALES', label: 'Direct Sales Team' },
          { code: 'ONLINE', label: 'E-commerce/Online' },
          { code: 'RETAIL_STORES', label: 'Physical Retail Stores' },
          { code: 'DISTRIBUTORS', label: 'Distributors/Partners' },
          { code: 'MIXED', label: 'Multiple Channels' }
        ],
        required: true,
        display_order: 2,
        kpi_tags: ['sales_complexity', 'channel_management']
      },
      {
        id: 'sl_003',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Textarea.V1',
        section_code: 'SALES',
        prompt: 'Describe your current sales process from lead to cash collection',
        help_text: 'Include key steps, approvals, and pain points',
        input_type: 'textarea',
        required: false,
        display_order: 3,
        kpi_tags: ['process_maturity', 'sales_cycle']
      },
      {
        id: 'sl_004',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'SALES',
        prompt: 'Do you need multi-currency support for international sales?',
        input_type: 'yesno',
        required: true,
        display_order: 4,
        kpi_tags: ['international_business', 'currency_management']
      }
    ]
  }

  // Section 3: Procurement
  const procurement: Section = {
    code: 'PROCUREMENT',
    title: 'Procurement & Purchasing',
    description: 'Purchasing processes and vendor management',
    display_order: 3,
    smart_code: 'HERA.ERP.Readiness.Section.Standard.V1',
    questions: [
      {
        id: 'pr_001',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'PROCUREMENT',
        prompt: 'How do you currently manage purchase approvals?',
        input_type: 'select',
        options: [
          { code: 'MANUAL_EMAIL', label: 'Manual/Email approvals' },
          { code: 'PAPER_BASED', label: 'Paper-based forms' },
          { code: 'EXCEL_SHEETS', label: 'Excel spreadsheets' },
          { code: 'BASIC_SYSTEM', label: 'Basic approval system' },
          { code: 'NO_FORMAL', label: 'No formal approval process' }
        ],
        required: true,
        display_order: 1,
        kpi_tags: ['approval_process', 'control_maturity']
      },
      {
        id: 'pr_002',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'PROCUREMENT',
        prompt: 'Do you conduct formal tender processes for major purchases?',
        input_type: 'yesno',
        required: true,
        display_order: 2,
        kpi_tags: ['procurement_maturity', 'compliance']
      },
      {
        id: 'pr_003',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Number.V1',
        section_code: 'PROCUREMENT',
        prompt: 'How many active suppliers do you work with?',
        input_type: 'number',
        required: false,
        display_order: 3,
        kpi_tags: ['supplier_complexity', 'vendor_management']
      },
      {
        id: 'pr_004',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Textarea.V1',
        section_code: 'PROCUREMENT',
        prompt: 'What are your biggest challenges in procurement and vendor management?',
        help_text: 'Include issues with approvals, vendor performance, cost control, etc.',
        input_type: 'textarea',
        required: false,
        display_order: 4,
        kpi_tags: ['pain_points', 'improvement_areas']
      }
    ]
  }

  // Section 4: Production
  const production: Section = {
    code: 'PRODUCTION',
    title: 'Production Management',
    description: 'Manufacturing and production processes',
    display_order: 4,
    smart_code: 'HERA.ERP.Readiness.Section.Standard.V1',
    questions: [
      {
        id: 'pd_001',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'PRODUCTION',
        prompt: 'Does your organization have manufacturing or production activities?',
        input_type: 'yesno',
        required: true,
        display_order: 1,
        kpi_tags: ['manufacturing', 'production_complexity']
      },
      {
        id: 'pd_002',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'PRODUCTION',
        prompt: 'What type of production environment best describes your operations?',
        input_type: 'select',
        options: [
          { code: 'MAKE_TO_ORDER', label: 'Make to Order (MTO)' },
          { code: 'MAKE_TO_STOCK', label: 'Make to Stock (MTS)' },
          { code: 'ASSEMBLE_TO_ORDER', label: 'Assemble to Order (ATO)' },
          { code: 'ENGINEER_TO_ORDER', label: 'Engineer to Order (ETO)' },
          { code: 'NOT_APPLICABLE', label: 'Not Applicable' }
        ],
        required: false,
        display_order: 2,
        kpi_tags: ['production_strategy', 'manufacturing_complexity']
      },
      {
        id: 'pd_003',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'PRODUCTION',
        prompt: 'Do you need to track work-in-progress (WIP) and production costs in real-time?',
        input_type: 'yesno',
        required: false,
        display_order: 3,
        kpi_tags: ['cost_tracking', 'real_time_visibility']
      },
      {
        id: 'pd_004',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Textarea.V1',
        section_code: 'PRODUCTION',
        prompt: 'Describe your quality control and compliance requirements',
        help_text: 'Include industry standards, certifications, and quality processes',
        input_type: 'textarea',
        required: false,
        display_order: 4,
        kpi_tags: ['quality_control', 'compliance']
      }
    ]
  }

  // Section 5: Inventory
  const inventory: Section = {
    code: 'INVENTORY',
    title: 'Inventory Management',
    description: 'Stock control and warehouse operations',
    display_order: 5,
    smart_code: 'HERA.ERP.Readiness.Section.Standard.V1',
    questions: [
      {
        id: 'iv_001',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'INVENTORY',
        prompt: 'How do you currently track inventory levels?',
        input_type: 'select',
        options: [
          { code: 'MANUAL_COUNT', label: 'Manual counting/spreadsheets' },
          { code: 'BASIC_SOFTWARE', label: 'Basic inventory software' },
          { code: 'BARCODE_SYSTEM', label: 'Barcode scanning system' },
          { code: 'RFID_SYSTEM', label: 'RFID tracking' },
          { code: 'NO_FORMAL', label: 'No formal tracking' }
        ],
        required: true,
        display_order: 1,
        kpi_tags: ['inventory_control', 'technology_adoption']
      },
      {
        id: 'iv_002',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'INVENTORY',
        prompt: 'Do you need to track inventory across multiple locations or warehouses?',
        input_type: 'yesno',
        required: true,
        display_order: 2,
        kpi_tags: ['multi_location', 'complexity']
      },
      {
        id: 'iv_003',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'INVENTORY',
        prompt: 'Do you require lot/batch tracking for your products?',
        help_text: 'Important for expiry dates, recalls, and compliance',
        input_type: 'yesno',
        required: true,
        display_order: 3,
        kpi_tags: ['traceability', 'compliance']
      },
      {
        id: 'iv_004',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Textarea.V1',
        section_code: 'INVENTORY',
        prompt: 'What are your main challenges with inventory management?',
        help_text: 'Include issues with stock-outs, overstocking, accuracy, etc.',
        input_type: 'textarea',
        required: false,
        display_order: 4,
        kpi_tags: ['pain_points', 'optimization_needs']
      }
    ]
  }

  // Section 6: Projects
  const projects: Section = {
    code: 'PROJECTS',
    title: 'Project Management',
    description: 'Project tracking and resource management',
    display_order: 6,
    smart_code: 'HERA.ERP.Readiness.Section.Standard.V1',
    questions: [
      {
        id: 'pj_001',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'PROJECTS',
        prompt: 'Does your business operate on a project basis?',
        help_text: 'E.g., construction, consulting, custom manufacturing',
        input_type: 'yesno',
        required: true,
        display_order: 1,
        kpi_tags: ['project_based', 'business_model']
      },
      {
        id: 'pj_002',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'PROJECTS',
        prompt: 'Do you need to track project profitability and costs in real-time?',
        input_type: 'yesno',
        required: false,
        display_order: 2,
        kpi_tags: ['profitability', 'real_time_tracking']
      },
      {
        id: 'pj_003',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'PROJECTS',
        prompt: 'How do you currently manage project resources and scheduling?',
        input_type: 'select',
        options: [
          { code: 'MANUAL_PLANNING', label: 'Manual planning/spreadsheets' },
          { code: 'PROJECT_SOFTWARE', label: 'Dedicated project management software' },
          { code: 'BASIC_TOOLS', label: 'Basic tools (calendars, email)' },
          { code: 'ERP_MODULE', label: 'ERP project module' },
          { code: 'NO_FORMAL', label: 'No formal resource planning' }
        ],
        required: false,
        display_order: 3,
        kpi_tags: ['resource_management', 'planning_maturity']
      },
      {
        id: 'pj_004',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Textarea.V1',
        section_code: 'PROJECTS',
        prompt: 'What project management challenges do you face?',
        help_text: 'Include issues with resource allocation, timelines, budget control',
        input_type: 'textarea',
        required: false,
        display_order: 4,
        kpi_tags: ['project_challenges', 'improvement_areas']
      }
    ]
  }

  // Section 7: Finance
  const finance: Section = {
    code: 'FINANCE',
    title: 'Financial Management',
    description: 'Accounting and financial reporting requirements',
    display_order: 7,
    smart_code: 'HERA.ERP.Readiness.Section.Standard.V1',
    questions: [
      {
        id: 'fn_001',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'FINANCE',
        prompt: 'What accounting standards do you follow?',
        input_type: 'select',
        options: [
          { code: 'IFRS', label: 'IFRS (International)' },
          { code: 'GAAP', label: 'GAAP (US)' },
          { code: 'LOCAL_GAAP', label: 'Local GAAP' },
          { code: 'TAX_BASIS', label: 'Tax basis only' },
          { code: 'OTHER', label: 'Other' }
        ],
        required: true,
        display_order: 1,
        kpi_tags: ['compliance', 'reporting_standards']
      },
      {
        id: 'fn_002',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'FINANCE',
        prompt: 'Do you need automated financial consolidation across multiple entities?',
        input_type: 'yesno',
        required: true,
        display_order: 2,
        kpi_tags: ['consolidation', 'multi_entity']
      },
      {
        id: 'fn_003',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'FINANCE',
        prompt: 'Do you require real-time financial dashboards and reporting?',
        input_type: 'yesno',
        required: true,
        display_order: 3,
        kpi_tags: ['real_time_reporting', 'dashboards']
      },
      {
        id: 'fn_004',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Textarea.V1',
        section_code: 'FINANCE',
        prompt: 'What are your most critical financial reports and how often do you need them?',
        help_text: 'Include P&L, Balance Sheet, Cash Flow, and any regulatory reports',
        input_type: 'textarea',
        required: false,
        display_order: 4,
        kpi_tags: ['reporting_requirements', 'frequency']
      }
    ]
  }

  // Section 8: HR/Payroll
  const hrPayroll: Section = {
    code: 'HR_PAYROLL',
    title: 'HR & Payroll',
    description: 'Human resources and payroll management',
    display_order: 8,
    smart_code: 'HERA.ERP.Readiness.Section.Standard.V1',
    questions: [
      {
        id: 'hr_001',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'HR_PAYROLL',
        prompt: 'Do you process payroll internally or outsource it?',
        help_text: 'This affects integration requirements with your ERP system',
        input_type: 'select',
        options: [
          { code: 'INTERNAL', label: 'Process internally' },
          { code: 'OUTSOURCED', label: 'Fully outsourced' },
          { code: 'HYBRID', label: 'Hybrid approach' }
        ],
        required: true,
        display_order: 1,
        kpi_tags: ['payroll_management', 'outsourcing']
      },
      {
        id: 'hr_002',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'HR_PAYROLL',
        prompt: 'Do you need to track employee time and attendance integration?',
        input_type: 'yesno',
        required: true,
        display_order: 2,
        kpi_tags: ['time_tracking', 'attendance']
      },
      {
        id: 'hr_003',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'HR_PAYROLL',
        prompt: 'Do you require employee self-service portals?',
        help_text: 'For leave requests, payslips, personal information updates',
        input_type: 'yesno',
        required: false,
        display_order: 3,
        kpi_tags: ['self_service', 'employee_portal']
      },
      {
        id: 'hr_004',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Textarea.V1',
        section_code: 'HR_PAYROLL',
        prompt: 'What HR compliance requirements do you have?',
        help_text: 'Include labor law compliance, visa tracking, etc.',
        input_type: 'textarea',
        required: false,
        display_order: 4,
        kpi_tags: ['compliance', 'legal_requirements']
      }
    ]
  }

  // Section 9: Assets
  const assets: Section = {
    code: 'ASSETS',
    title: 'Asset Management',
    description: 'Fixed assets and maintenance management',
    display_order: 9,
    smart_code: 'HERA.ERP.Readiness.Section.Standard.V1',
    questions: [
      {
        id: 'as_001',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'ASSETS',
        prompt: 'Do you have significant fixed assets that require tracking?',
        help_text: 'Equipment, vehicles, property, IT assets',
        input_type: 'yesno',
        required: true,
        display_order: 1,
        kpi_tags: ['asset_tracking', 'fixed_assets']
      },
      {
        id: 'as_002',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'ASSETS',
        prompt: 'Do you need preventive maintenance scheduling and tracking?',
        input_type: 'yesno',
        required: false,
        display_order: 2,
        kpi_tags: ['maintenance', 'preventive_maintenance']
      },
      {
        id: 'as_003',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'ASSETS',
        prompt: 'Do you require automated depreciation calculations?',
        input_type: 'yesno',
        required: false,
        display_order: 3,
        kpi_tags: ['depreciation', 'financial_integration']
      },
      {
        id: 'as_004',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Textarea.V1',
        section_code: 'ASSETS',
        prompt: 'What are your main challenges with asset management?',
        help_text: 'Include maintenance scheduling, cost tracking, compliance',
        input_type: 'textarea',
        required: false,
        display_order: 4,
        kpi_tags: ['asset_challenges', 'maintenance_issues']
      }
    ]
  }

  // Section 10: IT Infrastructure
  const itInfrastructure: Section = {
    code: 'IT_INFRASTRUCTURE',
    title: 'IT Infrastructure',
    description: 'Technology readiness and integration requirements',
    display_order: 10,
    smart_code: 'HERA.ERP.Readiness.Section.Standard.V1',
    questions: [
      {
        id: 'it_001',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'IT_INFRASTRUCTURE',
        prompt: 'What is your preferred deployment model?',
        input_type: 'select',
        options: [
          { code: 'CLOUD_SAAS', label: 'Cloud/SaaS' },
          { code: 'ON_PREMISE', label: 'On-premise' },
          { code: 'HYBRID_CLOUD', label: 'Hybrid cloud' },
          { code: 'PRIVATE_CLOUD', label: 'Private cloud' }
        ],
        required: true,
        display_order: 1,
        kpi_tags: ['deployment_model', 'cloud_readiness']
      },
      {
        id: 'it_002',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'IT_INFRASTRUCTURE',
        prompt: 'Do you have existing systems that need to integrate with the ERP?',
        help_text: 'CRM, e-commerce, legacy systems, etc.',
        input_type: 'yesno',
        required: true,
        display_order: 2,
        kpi_tags: ['system_integration', 'legacy_systems']
      },
      {
        id: 'it_003',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'IT_INFRASTRUCTURE',
        prompt: 'What is your current IT support capability?',
        input_type: 'select',
        options: [
          { code: 'DEDICATED_TEAM', label: 'Dedicated IT team' },
          { code: 'PART_TIME', label: 'Part-time IT person' },
          { code: 'OUTSOURCED', label: 'Outsourced IT support' },
          { code: 'MINIMAL', label: 'Minimal IT support' }
        ],
        required: true,
        display_order: 3,
        kpi_tags: ['it_capability', 'support_model']
      },
      {
        id: 'it_004',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Textarea.V1',
        section_code: 'IT_INFRASTRUCTURE',
        prompt: 'What are your main concerns about ERP implementation from an IT perspective?',
        help_text: 'Include security, performance, integration challenges',
        input_type: 'textarea',
        required: false,
        display_order: 4,
        kpi_tags: ['it_concerns', 'implementation_risks']
      }
    ]
  }

  // Section 11: AI Agents
  const aiAgents: Section = {
    code: 'AI_AGENTS',
    title: 'AI & Automation',
    description: 'Artificial intelligence and automation readiness',
    display_order: 11,
    smart_code: 'HERA.ERP.Readiness.Section.Standard.V1',
    questions: [
      {
        id: 'ai_001',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'AI_AGENTS',
        prompt: 'Are you interested in AI-powered business process automation?',
        help_text: 'AI agents that can handle routine tasks, approvals, and decisions',
        input_type: 'yesno',
        required: true,
        display_order: 1,
        kpi_tags: ['ai_readiness', 'automation']
      },
      {
        id: 'ai_002',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'AI_AGENTS',
        prompt: 'Which business processes would benefit most from AI automation?',
        input_type: 'multiselect',
        options: [
          { code: 'INVOICE_PROCESSING', label: 'Invoice processing and approval' },
          { code: 'CUSTOMER_SERVICE', label: 'Customer service and support' },
          { code: 'DEMAND_FORECASTING', label: 'Demand forecasting' },
          { code: 'PRICING_OPTIMIZATION', label: 'Pricing optimization' },
          { code: 'QUALITY_CONTROL', label: 'Quality control and inspection' },
          { code: 'FINANCIAL_ANALYSIS', label: 'Financial analysis and reporting' },
          { code: 'INVENTORY_OPTIMIZATION', label: 'Inventory optimization' },
          { code: 'NOT_INTERESTED', label: 'Not interested in AI automation' }
        ],
        required: false,
        display_order: 2,
        kpi_tags: ['ai_applications', 'process_automation']
      },
      {
        id: 'ai_003',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.YesNo.V1',
        section_code: 'AI_AGENTS',
        prompt: 'Would you be comfortable with AI agents making routine business decisions?',
        help_text: 'With appropriate controls and human oversight',
        input_type: 'yesno',
        required: false,
        display_order: 3,
        kpi_tags: ['ai_comfort', 'decision_automation']
      },
      {
        id: 'ai_004',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Textarea.V1',
        section_code: 'AI_AGENTS',
        prompt: 'What concerns do you have about implementing AI in your business processes?',
        help_text: 'Include concerns about accuracy, control, job impact, etc.',
        input_type: 'textarea',
        required: false,
        display_order: 4,
        kpi_tags: ['ai_concerns', 'implementation_barriers']
      }
    ]
  }

  // Section 12: General Expectations
  const generalExpectations: Section = {
    code: 'GENERAL_EXPECTATIONS',
    title: 'General Expectations',
    description: 'Overall expectations and success criteria',
    display_order: 12,
    smart_code: 'HERA.ERP.Readiness.Section.Standard.V1',
    questions: [
      {
        id: 'ge_001',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'GENERAL_EXPECTATIONS',
        prompt: 'What is your target timeline for ERP implementation?',
        input_type: 'select',
        options: [
          { code: 'UNDER_3_MONTHS', label: 'Under 3 months' },
          { code: '3_6_MONTHS', label: '3-6 months' },
          { code: '6_12_MONTHS', label: '6-12 months' },
          { code: 'OVER_12_MONTHS', label: 'Over 12 months' },
          { code: 'NO_TIMELINE', label: 'No specific timeline' }
        ],
        required: true,
        display_order: 1,
        kpi_tags: ['timeline', 'urgency']
      },
      {
        id: 'ge_002',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Select.V1',
        section_code: 'GENERAL_EXPECTATIONS',
        prompt: 'What is your primary motivation for implementing an ERP system?',
        input_type: 'select',
        options: [
          { code: 'GROWTH_SCALING', label: 'Support business growth and scaling' },
          { code: 'EFFICIENCY', label: 'Improve operational efficiency' },
          { code: 'COMPLIANCE', label: 'Meet compliance requirements' },
          { code: 'COST_REDUCTION', label: 'Reduce operational costs' },
          { code: 'VISIBILITY', label: 'Better business visibility and control' },
          { code: 'REPLACE_LEGACY', label: 'Replace legacy systems' }
        ],
        required: true,
        display_order: 2,
        kpi_tags: ['motivation', 'success_criteria']
      },
      {
        id: 'ge_003',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Number.V1',
        section_code: 'GENERAL_EXPECTATIONS',
        prompt: 'How many users do you expect to have on the ERP system?',
        input_type: 'number',
        required: true,
        display_order: 3,
        kpi_tags: ['user_count', 'licensing']
      },
      {
        id: 'ge_004',
        organization_id: organizationId,
        smart_code: 'HERA.ERP.Readiness.Question.Textarea.V1',
        section_code: 'GENERAL_EXPECTATIONS',
        prompt: 'What would success look like 12 months after ERP implementation?',
        help_text: 'Include specific improvements you expect to see',
        input_type: 'textarea',
        required: false,
        display_order: 4,
        kpi_tags: ['success_metrics', 'roi_expectations']
      }
    ]
  }

  // Add all sections to template
  template.sections = [
    companyProfile,
    sales,
    procurement,
    production,
    inventory,
    projects,
    finance,
    hrPayroll,
    assets,
    itInfrastructure,
    aiAgents,
    generalExpectations
  ]

  return template
}
