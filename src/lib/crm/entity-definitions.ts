/**
 * HERA CRM Entity Definitions
 * Smart Code: HERA.CRM.CORE.DEFINITIONS.ENTITIES.V1
 * 
 * Sacred Six compliant entity definitions for CRM
 * All entities use core_entities + core_dynamic_data + core_relationships
 */

import { CRM_ENTITY_CODES, CRM_DYNAMIC_FIELD_CODES, CRM_STATUS_VALUES } from './smart-codes'

export interface CRMEntityDefinition {
  entity_type: string
  smart_code: string
  display_name: string
  description: string
  icon: string
  color: string
  required_fields: string[]
  dynamic_fields: CRMDynamicFieldDefinition[]
  default_relationships: string[]
  mobile_card_template: string
  search_fields: string[]
}

export interface CRMDynamicFieldDefinition {
  field_name: string
  smart_code: string
  field_type: 'text' | 'number' | 'boolean' | 'date' | 'json'
  display_name: string
  description: string
  required: boolean
  default_value?: any
  validation_rules?: {
    min_length?: number
    max_length?: number
    pattern?: string
    min_value?: number
    max_value?: number
    options?: string[]
  }
  mobile_input_type: 'text' | 'email' | 'phone' | 'url' | 'number' | 'date' | 'select' | 'textarea'
  placeholder?: string
  help_text?: string
}

// Account Entity Definition
export const ACCOUNT_DEFINITION: CRMEntityDefinition = {
  entity_type: 'ACCOUNT',
  smart_code: CRM_ENTITY_CODES.ACCOUNT,
  display_name: 'Account',
  description: 'Company or organization entity',
  icon: 'Building2',
  color: '#3b82f6', // Blue
  required_fields: ['entity_name'],
  search_fields: ['entity_name', 'industry', 'website'],
  mobile_card_template: 'account_card',
  default_relationships: [],
  dynamic_fields: [
    {
      field_name: 'industry',
      smart_code: CRM_DYNAMIC_FIELD_CODES.ACCOUNT_INDUSTRY,
      field_type: 'text',
      display_name: 'Industry',
      description: 'Primary industry classification',
      required: false,
      mobile_input_type: 'select',
      validation_rules: {
        options: [
          'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
          'Education', 'Real Estate', 'Consulting', 'Media', 'Government'
        ]
      }
    },
    {
      field_name: 'annual_revenue',
      smart_code: CRM_DYNAMIC_FIELD_CODES.ACCOUNT_REVENUE,
      field_type: 'number',
      display_name: 'Annual Revenue',
      description: 'Annual revenue in USD',
      required: false,
      mobile_input_type: 'number',
      placeholder: 'e.g., 1000000'
    },
    {
      field_name: 'employee_count',
      smart_code: CRM_DYNAMIC_FIELD_CODES.ACCOUNT_EMPLOYEES,
      field_type: 'number',
      display_name: 'Employees',
      description: 'Number of employees',
      required: false,
      mobile_input_type: 'number',
      validation_rules: { min_value: 1 }
    },
    {
      field_name: 'website',
      smart_code: CRM_DYNAMIC_FIELD_CODES.ACCOUNT_WEBSITE,
      field_type: 'text',
      display_name: 'Website',
      description: 'Company website URL',
      required: false,
      mobile_input_type: 'url',
      placeholder: 'https://company.com',
      validation_rules: {
        pattern: '^https?://.+'
      }
    },
    {
      field_name: 'account_type',
      smart_code: CRM_DYNAMIC_FIELD_CODES.ACCOUNT_TYPE,
      field_type: 'text',
      display_name: 'Account Type',
      description: 'Classification of account',
      required: false,
      mobile_input_type: 'select',
      validation_rules: {
        options: ['Prospect', 'Customer', 'Partner', 'Competitor', 'Former Customer']
      }
    },
    {
      field_name: 'rating',
      smart_code: CRM_DYNAMIC_FIELD_CODES.ACCOUNT_RATING,
      field_type: 'text',
      display_name: 'Rating',
      description: 'Account priority rating',
      required: false,
      mobile_input_type: 'select',
      validation_rules: {
        options: ['Hot', 'Warm', 'Cold']
      }
    }
  ]
}

// Contact Entity Definition
export const CONTACT_DEFINITION: CRMEntityDefinition = {
  entity_type: 'CONTACT',
  smart_code: CRM_ENTITY_CODES.CONTACT,
  display_name: 'Contact',
  description: 'Individual person entity',
  icon: 'User',
  color: '#10b981', // Green
  required_fields: ['entity_name', 'email'],
  search_fields: ['entity_name', 'email', 'job_title', 'department'],
  mobile_card_template: 'contact_card',
  default_relationships: [],
  dynamic_fields: [
    {
      field_name: 'email',
      smart_code: CRM_DYNAMIC_FIELD_CODES.CONTACT_EMAIL,
      field_type: 'text',
      display_name: 'Email',
      description: 'Primary email address',
      required: true,
      mobile_input_type: 'email',
      validation_rules: {
        pattern: '^[^@]+@[^@]+\\.[^@]+$'
      }
    },
    {
      field_name: 'phone',
      smart_code: CRM_DYNAMIC_FIELD_CODES.CONTACT_PHONE,
      field_type: 'text',
      display_name: 'Phone',
      description: 'Business phone number',
      required: false,
      mobile_input_type: 'phone',
      placeholder: '+1 (555) 123-4567'
    },
    {
      field_name: 'mobile',
      smart_code: CRM_DYNAMIC_FIELD_CODES.CONTACT_MOBILE,
      field_type: 'text',
      display_name: 'Mobile',
      description: 'Mobile phone number',
      required: false,
      mobile_input_type: 'phone',
      placeholder: '+1 (555) 123-4567'
    },
    {
      field_name: 'job_title',
      smart_code: CRM_DYNAMIC_FIELD_CODES.CONTACT_TITLE,
      field_type: 'text',
      display_name: 'Job Title',
      description: 'Professional title',
      required: false,
      mobile_input_type: 'text',
      placeholder: 'e.g., VP of Sales'
    },
    {
      field_name: 'department',
      smart_code: CRM_DYNAMIC_FIELD_CODES.CONTACT_DEPARTMENT,
      field_type: 'text',
      display_name: 'Department',
      description: 'Department or division',
      required: false,
      mobile_input_type: 'text',
      placeholder: 'e.g., Sales, Marketing'
    },
    {
      field_name: 'birthday',
      smart_code: CRM_DYNAMIC_FIELD_CODES.CONTACT_BIRTHDAY,
      field_type: 'date',
      display_name: 'Birthday',
      description: 'Date of birth',
      required: false,
      mobile_input_type: 'date'
    },
    {
      field_name: 'linkedin_url',
      smart_code: CRM_DYNAMIC_FIELD_CODES.CONTACT_LINKEDIN,
      field_type: 'text',
      display_name: 'LinkedIn',
      description: 'LinkedIn profile URL',
      required: false,
      mobile_input_type: 'url',
      placeholder: 'https://linkedin.com/in/profile'
    },
    {
      field_name: 'contact_role',
      smart_code: CRM_DYNAMIC_FIELD_CODES.CONTACT_ROLE,
      field_type: 'text',
      display_name: 'Role',
      description: 'Role in buying process',
      required: false,
      mobile_input_type: 'select',
      validation_rules: {
        options: Object.values(CRM_STATUS_VALUES.CONTACT_ROLES)
      }
    }
  ]
}

// Lead Entity Definition
export const LEAD_DEFINITION: CRMEntityDefinition = {
  entity_type: 'LEAD',
  smart_code: CRM_ENTITY_CODES.LEAD,
  display_name: 'Lead',
  description: 'Potential customer prospect',
  icon: 'Target',
  color: '#f59e0b', // Orange
  required_fields: ['entity_name', 'source'],
  search_fields: ['entity_name', 'company', 'source', 'status'],
  mobile_card_template: 'lead_card',
  default_relationships: [],
  dynamic_fields: [
    {
      field_name: 'source',
      smart_code: CRM_DYNAMIC_FIELD_CODES.LEAD_SOURCE,
      field_type: 'text',
      display_name: 'Lead Source',
      description: 'How the lead was acquired',
      required: true,
      mobile_input_type: 'select',
      validation_rules: {
        options: ['Website', 'Referral', 'Cold Call', 'Email Campaign', 'Social Media', 'Trade Show', 'Partner', 'Advertisement']
      }
    },
    {
      field_name: 'status',
      smart_code: CRM_DYNAMIC_FIELD_CODES.LEAD_STATUS,
      field_type: 'text',
      display_name: 'Status',
      description: 'Current lead status',
      required: false,
      default_value: 'New',
      mobile_input_type: 'select',
      validation_rules: {
        options: Object.values(CRM_STATUS_VALUES.LEAD_STATUS)
      }
    },
    {
      field_name: 'score',
      smart_code: CRM_DYNAMIC_FIELD_CODES.LEAD_SCORE,
      field_type: 'number',
      display_name: 'Lead Score',
      description: 'Qualification score (0-100)',
      required: false,
      mobile_input_type: 'number',
      validation_rules: { min_value: 0, max_value: 100 }
    },
    {
      field_name: 'company',
      smart_code: CRM_DYNAMIC_FIELD_CODES.LEAD_COMPANY,
      field_type: 'text',
      display_name: 'Company',
      description: 'Company name',
      required: false,
      mobile_input_type: 'text',
      placeholder: 'Company name'
    },
    {
      field_name: 'budget',
      smart_code: CRM_DYNAMIC_FIELD_CODES.LEAD_BUDGET,
      field_type: 'number',
      display_name: 'Budget',
      description: 'Estimated budget in USD',
      required: false,
      mobile_input_type: 'number',
      placeholder: 'e.g., 10000'
    },
    {
      field_name: 'timeline',
      smart_code: CRM_DYNAMIC_FIELD_CODES.LEAD_TIMELINE,
      field_type: 'text',
      display_name: 'Timeline',
      description: 'Expected purchase timeline',
      required: false,
      mobile_input_type: 'select',
      validation_rules: {
        options: ['Immediate', 'This Quarter', 'Next Quarter', 'This Year', 'Unknown']
      }
    }
  ]
}

// Opportunity Entity Definition
export const OPPORTUNITY_DEFINITION: CRMEntityDefinition = {
  entity_type: 'OPPORTUNITY',
  smart_code: CRM_ENTITY_CODES.OPPORTUNITY,
  display_name: 'Opportunity',
  description: 'Sales opportunity in pipeline',
  icon: 'Target',
  color: '#8b5cf6', // Purple
  required_fields: ['entity_name', 'stage', 'amount', 'close_date'],
  search_fields: ['entity_name', 'stage', 'type', 'source'],
  mobile_card_template: 'opportunity_card',
  default_relationships: [],
  dynamic_fields: [
    {
      field_name: 'stage',
      smart_code: CRM_DYNAMIC_FIELD_CODES.OPP_STAGE,
      field_type: 'text',
      display_name: 'Stage',
      description: 'Current sales stage',
      required: true,
      mobile_input_type: 'select',
      validation_rules: {
        options: Object.values(CRM_STATUS_VALUES.OPPORTUNITY_STAGES)
      }
    },
    {
      field_name: 'amount',
      smart_code: CRM_DYNAMIC_FIELD_CODES.OPP_AMOUNT,
      field_type: 'number',
      display_name: 'Amount',
      description: 'Opportunity value in USD',
      required: true,
      mobile_input_type: 'number',
      validation_rules: { min_value: 0 }
    },
    {
      field_name: 'probability',
      smart_code: CRM_DYNAMIC_FIELD_CODES.OPP_PROBABILITY,
      field_type: 'number',
      display_name: 'Probability (%)',
      description: 'Win probability percentage',
      required: false,
      mobile_input_type: 'number',
      validation_rules: { min_value: 0, max_value: 100 }
    },
    {
      field_name: 'close_date',
      smart_code: CRM_DYNAMIC_FIELD_CODES.OPP_CLOSE_DATE,
      field_type: 'date',
      display_name: 'Close Date',
      description: 'Expected close date',
      required: true,
      mobile_input_type: 'date'
    },
    {
      field_name: 'source',
      smart_code: CRM_DYNAMIC_FIELD_CODES.OPP_SOURCE,
      field_type: 'text',
      display_name: 'Lead Source',
      description: 'Original lead source',
      required: false,
      mobile_input_type: 'select',
      validation_rules: {
        options: ['Website', 'Referral', 'Cold Call', 'Email Campaign', 'Social Media', 'Trade Show', 'Partner']
      }
    },
    {
      field_name: 'type',
      smart_code: CRM_DYNAMIC_FIELD_CODES.OPP_TYPE,
      field_type: 'text',
      display_name: 'Type',
      description: 'Opportunity type',
      required: false,
      mobile_input_type: 'select',
      validation_rules: {
        options: ['New Business', 'Existing Business', 'Renewal', 'Upsell']
      }
    },
    {
      field_name: 'next_step',
      smart_code: CRM_DYNAMIC_FIELD_CODES.OPP_NEXT_STEP,
      field_type: 'text',
      display_name: 'Next Step',
      description: 'Next action to take',
      required: false,
      mobile_input_type: 'textarea',
      placeholder: 'Describe the next step...'
    }
  ]
}

// Activity Entity Definition
export const ACTIVITY_DEFINITION: CRMEntityDefinition = {
  entity_type: 'ACTIVITY',
  smart_code: CRM_ENTITY_CODES.ACTIVITY,
  display_name: 'Activity',
  description: 'Sales activity or interaction',
  icon: 'Activity',
  color: '#06b6d4', // Cyan
  required_fields: ['entity_name', 'type'],
  search_fields: ['entity_name', 'type', 'outcome'],
  mobile_card_template: 'activity_card',
  default_relationships: [],
  dynamic_fields: [
    {
      field_name: 'type',
      smart_code: CRM_DYNAMIC_FIELD_CODES.ACTIVITY_TYPE,
      field_type: 'text',
      display_name: 'Activity Type',
      description: 'Type of activity',
      required: true,
      mobile_input_type: 'select',
      validation_rules: {
        options: Object.values(CRM_STATUS_VALUES.ACTIVITY_TYPES)
      }
    },
    {
      field_name: 'direction',
      smart_code: CRM_DYNAMIC_FIELD_CODES.ACTIVITY_DIRECTION,
      field_type: 'text',
      display_name: 'Direction',
      description: 'Inbound or outbound',
      required: false,
      mobile_input_type: 'select',
      validation_rules: {
        options: ['Inbound', 'Outbound']
      }
    },
    {
      field_name: 'outcome',
      smart_code: CRM_DYNAMIC_FIELD_CODES.ACTIVITY_OUTCOME,
      field_type: 'text',
      display_name: 'Outcome',
      description: 'Activity result',
      required: false,
      mobile_input_type: 'select',
      validation_rules: {
        options: ['Connected', 'Left Message', 'No Answer', 'Busy', 'Wrong Number', 'Meeting Scheduled']
      }
    },
    {
      field_name: 'duration',
      smart_code: CRM_DYNAMIC_FIELD_CODES.ACTIVITY_DURATION,
      field_type: 'number',
      display_name: 'Duration (min)',
      description: 'Duration in minutes',
      required: false,
      mobile_input_type: 'number',
      validation_rules: { min_value: 0 }
    }
  ]
}

// Task Entity Definition
export const TASK_DEFINITION: CRMEntityDefinition = {
  entity_type: 'TASK',
  smart_code: CRM_ENTITY_CODES.TASK,
  display_name: 'Task',
  description: 'To-do item or follow-up task',
  icon: 'CheckSquare',
  color: '#ef4444', // Red
  required_fields: ['entity_name', 'due_date'],
  search_fields: ['entity_name', 'status', 'priority'],
  mobile_card_template: 'task_card',
  default_relationships: [],
  dynamic_fields: [
    {
      field_name: 'due_date',
      smart_code: CRM_DYNAMIC_FIELD_CODES.TASK_DUE_DATE,
      field_type: 'date',
      display_name: 'Due Date',
      description: 'Task due date',
      required: true,
      mobile_input_type: 'date'
    },
    {
      field_name: 'priority',
      smart_code: CRM_DYNAMIC_FIELD_CODES.TASK_PRIORITY,
      field_type: 'text',
      display_name: 'Priority',
      description: 'Task priority level',
      required: false,
      default_value: 'Normal',
      mobile_input_type: 'select',
      validation_rules: {
        options: Object.values(CRM_STATUS_VALUES.TASK_PRIORITY)
      }
    },
    {
      field_name: 'status',
      smart_code: CRM_DYNAMIC_FIELD_CODES.TASK_STATUS,
      field_type: 'text',
      display_name: 'Status',
      description: 'Task completion status',
      required: false,
      default_value: 'Not Started',
      mobile_input_type: 'select',
      validation_rules: {
        options: ['Not Started', 'In Progress', 'Completed', 'Deferred', 'Waiting']
      }
    }
  ]
}

// Registry of all CRM entity definitions
export const CRM_ENTITY_DEFINITIONS = {
  ACCOUNT: ACCOUNT_DEFINITION,
  CONTACT: CONTACT_DEFINITION,
  LEAD: LEAD_DEFINITION,
  OPPORTUNITY: OPPORTUNITY_DEFINITION,
  ACTIVITY: ACTIVITY_DEFINITION,
  TASK: TASK_DEFINITION
} as const

// Helper functions
export function getCRMEntityDefinition(entityType: keyof typeof CRM_ENTITY_DEFINITIONS): CRMEntityDefinition {
  return CRM_ENTITY_DEFINITIONS[entityType]
}

export function getAllCRMEntityTypes(): string[] {
  return Object.keys(CRM_ENTITY_DEFINITIONS)
}

export function getCRMEntitySmartCode(entityType: keyof typeof CRM_ENTITY_DEFINITIONS): string {
  return CRM_ENTITY_DEFINITIONS[entityType].smart_code
}