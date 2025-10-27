/**
 * HERA v2 Module Configuration Template
 * 
 * This file defines the core configuration for your module following HERA v2 standards.
 * Copy this template and customize for your specific module needs.
 */

export interface ModuleConfig {
  module_code: string;
  module_name: string;
  module_description: string;
  smart_code_prefix: string;
  entities: EntityConfig[];
  transactions: TransactionConfig[];
  workflows: WorkflowConfig[];
  relationships: RelationshipTypeConfig[];
}

export interface EntityConfig {
  entity_type: string;
  smart_code_pattern: string;
  display_name: string;
  description: string;
  attributes: AttributeConfig[];
  relationships: string[];
  workflows: string[];
  validation_rules: string[];
  ui_config: EntityUIConfig;
}

export interface AttributeConfig {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'json';
  required: boolean;
  display_name: string;
  description?: string;
  options?: string[] | { value: string; label: string; }[];
  validation_rules?: string[];
  default_value?: any;
  ai_suggestions?: boolean;
}

export interface TransactionConfig {
  transaction_type: string;
  smart_code: string;
  display_name: string;
  description: string;
  posting_rules: PostingRule[];
  workflows: string[];
  validation_rules: string[];
  ui_config: TransactionUIConfig;
}

export interface PostingRule {
  account_code: string;
  side: 'DR' | 'CR';
  amount_field: string;
  condition?: string;
  dimensions?: string[];
}

export interface WorkflowConfig {
  workflow_type: string;
  smart_code: string;
  display_name: string;
  description: string;
  steps: WorkflowStepConfig[];
  triggers: WorkflowTrigger[];
}

export interface WorkflowStepConfig {
  step_name: string;
  step_type: 'manual' | 'automated' | 'approval' | 'notification';
  required_role?: string;
  description: string;
  form_schema?: any;
  automated_action?: string;
  due_days?: number;
}

export interface WorkflowTrigger {
  event: string;
  condition?: string;
  workflow_type: string;
}

export interface RelationshipTypeConfig {
  relationship_type: string;
  display_name: string;
  description: string;
  cardinality: '1:1' | '1:M' | 'M:M';
  reverse_type?: string;
}

export interface EntityUIConfig {
  list_view: {
    columns: string[];
    search_fields: string[];
    filter_fields: string[];
  };
  form_view: {
    step_1_fields: string[];
    step_2_relationships: string[];
    step_3_attributes: string[];
    step_4_workflows: string[];
  };
  detail_view: {
    header_fields: string[];
    tabs: { name: string; fields: string[]; }[];
  };
}

export interface TransactionUIConfig {
  header_fields: string[];
  line_item_fields: string[];
  summary_fields: string[];
}

// Example Module Configuration - CRM Customer Management
export const CRM_MODULE_CONFIG: ModuleConfig = {
  module_code: 'CRM',
  module_name: 'Customer Relationship Management',
  module_description: 'Comprehensive customer lifecycle management with S/4HANA integration',
  smart_code_prefix: 'HERA.CRM',
  
  entities: [
    {
      entity_type: 'CUSTOMER',
      smart_code_pattern: 'HERA.CRM.CUSTOMER.{CODE}.v1',
      display_name: 'Customer',
      description: 'Customer master data with extended attributes',
      attributes: [
        {
          name: 'customer_type',
          type: 'select',
          required: true,
          display_name: 'Customer Type',
          description: 'Classification of customer',
          options: [
            { value: 'individual', label: 'Individual' },
            { value: 'corporate', label: 'Corporate' },
            { value: 'government', label: 'Government' }
          ],
          ai_suggestions: true
        },
        {
          name: 'credit_limit',
          type: 'number',
          required: false,
          display_name: 'Credit Limit',
          description: 'Maximum credit amount allowed',
          default_value: 0,
          validation_rules: ['positive_number']
        },
        {
          name: 'payment_terms',
          type: 'select',
          required: true,
          display_name: 'Payment Terms',
          options: ['net15', 'net30', 'net60', 'cod', 'prepaid'],
          default_value: 'net30'
        },
        {
          name: 'industry',
          type: 'select',
          required: false,
          display_name: 'Industry',
          options: ['technology', 'manufacturing', 'retail', 'healthcare', 'finance', 'other']
        },
        {
          name: 'tax_id',
          type: 'text',
          required: false,
          display_name: 'Tax ID',
          validation_rules: ['tax_id_format']
        },
        {
          name: 'preferred_currency',
          type: 'select',
          required: true,
          display_name: 'Preferred Currency',
          options: ['USD', 'EUR', 'GBP', 'INR', 'JPY'],
          default_value: 'USD'
        },
        {
          name: 'sales_rep_id',
          type: 'text',
          required: false,
          display_name: 'Sales Representative',
          description: 'Assigned sales representative'
        }
      ],
      relationships: [
        'BELONGS_TO_ORGANIZATION',
        'HAS_CONTACT_PERSON',
        'OWNS_ACCOUNTS',
        'ASSIGNED_TO_SALES_REP'
      ],
      workflows: [
        'CUSTOMER_APPROVAL',
        'CREDIT_ASSESSMENT',
        'ONBOARDING'
      ],
      validation_rules: [
        'unique_customer_code',
        'valid_tax_id',
        'credit_limit_approval'
      ],
      ui_config: {
        list_view: {
          columns: ['entity_code', 'entity_name', 'customer_type', 'credit_limit', 'payment_terms'],
          search_fields: ['entity_code', 'entity_name', 'tax_id'],
          filter_fields: ['customer_type', 'industry', 'payment_terms']
        },
        form_view: {
          step_1_fields: ['entity_code', 'entity_name', 'customer_type', 'industry'],
          step_2_relationships: ['BELONGS_TO_ORGANIZATION', 'HAS_CONTACT_PERSON'],
          step_3_attributes: ['credit_limit', 'payment_terms', 'preferred_currency', 'tax_id'],
          step_4_workflows: ['CUSTOMER_APPROVAL', 'CREDIT_ASSESSMENT']
        },
        detail_view: {
          header_fields: ['entity_code', 'entity_name', 'customer_type'],
          tabs: [
            { name: 'General', fields: ['customer_type', 'industry', 'tax_id'] },
            { name: 'Financial', fields: ['credit_limit', 'payment_terms', 'preferred_currency'] },
            { name: 'Sales', fields: ['sales_rep_id'] }
          ]
        }
      }
    },
    {
      entity_type: 'CONTACT_PERSON',
      smart_code_pattern: 'HERA.CRM.CONTACT.{CODE}.v1',
      display_name: 'Contact Person',
      description: 'Individual contact within customer organization',
      attributes: [
        {
          name: 'first_name',
          type: 'text',
          required: true,
          display_name: 'First Name'
        },
        {
          name: 'last_name',
          type: 'text',
          required: true,
          display_name: 'Last Name'
        },
        {
          name: 'email',
          type: 'text',
          required: true,
          display_name: 'Email',
          validation_rules: ['email_format']
        },
        {
          name: 'phone',
          type: 'text',
          required: false,
          display_name: 'Phone'
        },
        {
          name: 'role',
          type: 'text',
          required: false,
          display_name: 'Role/Title'
        },
        {
          name: 'is_primary',
          type: 'boolean',
          required: false,
          display_name: 'Primary Contact',
          default_value: false
        }
      ],
      relationships: [
        'WORKS_FOR_CUSTOMER',
        'REPORTS_TO_CONTACT'
      ],
      workflows: [
        'CONTACT_VERIFICATION'
      ],
      validation_rules: [
        'unique_email',
        'valid_phone_format'
      ],
      ui_config: {
        list_view: {
          columns: ['first_name', 'last_name', 'email', 'role', 'is_primary'],
          search_fields: ['first_name', 'last_name', 'email'],
          filter_fields: ['role', 'is_primary']
        },
        form_view: {
          step_1_fields: ['first_name', 'last_name', 'email', 'role'],
          step_2_relationships: ['WORKS_FOR_CUSTOMER'],
          step_3_attributes: ['phone', 'is_primary'],
          step_4_workflows: ['CONTACT_VERIFICATION']
        },
        detail_view: {
          header_fields: ['first_name', 'last_name', 'email'],
          tabs: [
            { name: 'General', fields: ['first_name', 'last_name', 'email', 'phone', 'role'] },
            { name: 'Settings', fields: ['is_primary'] }
          ]
        }
      }
    }
  ],

  transactions: [
    {
      transaction_type: 'CUSTOMER_INVOICE',
      smart_code: 'HERA.CRM.TXN.INVOICE.v1',
      display_name: 'Customer Invoice',
      description: 'Invoice transaction with AR posting',
      posting_rules: [
        {
          account_code: '1200', // Accounts Receivable
          side: 'DR',
          amount_field: 'total_amount'
        },
        {
          account_code: '4000', // Revenue
          side: 'CR',
          amount_field: 'total_amount'
        }
      ],
      workflows: [
        'INVOICE_APPROVAL',
        'CREDIT_CHECK'
      ],
      validation_rules: [
        'gl_balanced',
        'customer_credit_limit',
        'invoice_number_unique'
      ],
      ui_config: {
        header_fields: ['customer_id', 'invoice_date', 'due_date', 'currency'],
        line_item_fields: ['product', 'quantity', 'unit_price', 'amount'],
        summary_fields: ['subtotal', 'tax_amount', 'total_amount']
      }
    },
    {
      transaction_type: 'CUSTOMER_PAYMENT',
      smart_code: 'HERA.CRM.TXN.PAYMENT.v1',
      display_name: 'Customer Payment',
      description: 'Payment receipt with AR credit',
      posting_rules: [
        {
          account_code: '1000', // Cash
          side: 'DR',
          amount_field: 'payment_amount'
        },
        {
          account_code: '1200', // Accounts Receivable
          side: 'CR',
          amount_field: 'payment_amount'
        }
      ],
      workflows: [
        'PAYMENT_VERIFICATION'
      ],
      validation_rules: [
        'gl_balanced',
        'payment_amount_positive'
      ],
      ui_config: {
        header_fields: ['customer_id', 'payment_date', 'payment_method', 'reference'],
        line_item_fields: ['invoice_reference', 'payment_amount'],
        summary_fields: ['total_payment']
      }
    }
  ],

  workflows: [
    {
      workflow_type: 'CUSTOMER_APPROVAL',
      smart_code: 'HERA.CRM.WORKFLOW.CUSTOMER.APPROVAL.v1',
      display_name: 'Customer Approval Process',
      description: 'Multi-step approval for new customer creation',
      steps: [
        {
          step_name: 'Initial Data Review',
          step_type: 'manual',
          required_role: 'sales_coordinator',
          description: 'Review customer data for completeness and accuracy'
        },
        {
          step_name: 'Credit Assessment',
          step_type: 'automated',
          description: 'Automated credit score and limit calculation',
          automated_action: 'calculate_credit_score'
        },
        {
          step_name: 'Manager Approval',
          step_type: 'approval',
          required_role: 'sales_manager',
          description: 'Manager approval for customer creation',
          due_days: 3
        },
        {
          step_name: 'System Activation',
          step_type: 'automated',
          description: 'Activate customer in all systems',
          automated_action: 'activate_customer'
        }
      ],
      triggers: [
        {
          event: 'entity_created',
          condition: 'entity_type = CUSTOMER',
          workflow_type: 'CUSTOMER_APPROVAL'
        }
      ]
    },
    {
      workflow_type: 'CREDIT_ASSESSMENT',
      smart_code: 'HERA.CRM.WORKFLOW.CREDIT.ASSESSMENT.v1',
      display_name: 'Credit Assessment',
      description: 'Automated and manual credit evaluation process',
      steps: [
        {
          step_name: 'Credit Bureau Check',
          step_type: 'automated',
          description: 'Query external credit bureaus',
          automated_action: 'credit_bureau_check'
        },
        {
          step_name: 'Financial Analysis',
          step_type: 'manual',
          required_role: 'credit_analyst',
          description: 'Analyze financial statements and history'
        },
        {
          step_name: 'Credit Decision',
          step_type: 'approval',
          required_role: 'credit_manager',
          description: 'Final credit limit and terms approval'
        }
      ],
      triggers: [
        {
          event: 'credit_limit_change',
          workflow_type: 'CREDIT_ASSESSMENT'
        }
      ]
    }
  ],

  relationships: [
    {
      relationship_type: 'BELONGS_TO_ORGANIZATION',
      display_name: 'Belongs To Organization',
      description: 'Customer belongs to a parent organization',
      cardinality: 'M:1',
      reverse_type: 'HAS_CUSTOMER'
    },
    {
      relationship_type: 'HAS_CONTACT_PERSON',
      display_name: 'Has Contact Person',
      description: 'Customer has associated contact persons',
      cardinality: '1:M',
      reverse_type: 'WORKS_FOR_CUSTOMER'
    },
    {
      relationship_type: 'ASSIGNED_TO_SALES_REP',
      display_name: 'Assigned To Sales Rep',
      description: 'Customer assigned to sales representative',
      cardinality: 'M:1',
      reverse_type: 'MANAGES_CUSTOMER'
    },
    {
      relationship_type: 'OWNS_ACCOUNTS',
      display_name: 'Owns Accounts',
      description: 'Customer owns financial accounts',
      cardinality: '1:M',
      reverse_type: 'OWNED_BY_CUSTOMER'
    }
  ]
};

// Export the configuration as default for easy importing
export default CRM_MODULE_CONFIG;