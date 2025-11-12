/**
 * Universal Configuration System
 * Smart Code: HERA.UNIVERSAL.CONFIG.SYSTEM.v1
 * 
 * Zero-hardcoding configuration system that defines all domains, sections, 
 * workspaces, entities, and transactions dynamically
 */

export interface UniversalIcon {
  name: string
  component?: string
}

export interface UniversalDomain {
  id: string
  name: string
  description: string
  icon: UniversalIcon
  color: string
  sections: string[]
}

export interface UniversalSection {
  id: string
  name: string
  description: string
  icon: UniversalIcon
  color: string
  workspaces: string[]
  domains: string[]
}

export interface UniversalWorkspace {
  id: string
  name: string
  description: string
  icon: UniversalIcon
  color: string
  personaLabel: string
  visibleRoles: string[]
  defaultNav: string
  sections: string[]
  domains: string[]
}

export interface UniversalEntityType {
  id: string
  name: string
  description: string
  icon: UniversalIcon
  color: string
  fields: UniversalField[]
  actions: string[]
  workspaces: string[]
}

export interface UniversalTransactionType {
  id: string
  name: string
  description: string
  icon: UniversalIcon
  color: string
  hasLines: boolean
  fields: UniversalField[]
  statuses: string[]
  workspaces: string[]
}

export interface UniversalWorkflowType {
  id: string
  name: string
  description: string
  icon: UniversalIcon
  color: string
  steps: UniversalWorkflowStep[]
  triggers: string[]
  workspaces: string[]
}

export interface UniversalWorkflowStep {
  id: string
  name: string
  description: string
  type: 'manual' | 'automatic' | 'approval'
  required: boolean
}

export interface UniversalField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'boolean' | 'select' | 'multiselect'
  required: boolean
  placeholder?: string
  options?: string[]
  validation?: string
}

export interface UniversalRelationshipType {
  id: string
  name: string
  description: string
  sourceTypes: string[]
  targetTypes: string[]
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many'
  workspaces: string[]
}

export interface UniversalAnalyticsType {
  id: string
  name: string
  description: string
  icon: UniversalIcon
  color: string
  chartTypes: string[]
  dimensions: string[]
  measures: string[]
  workspaces: string[]
}

// Universal Configuration Registry
export const UNIVERSAL_CONFIG = {
  domains: [
    {
      id: 'retail',
      name: 'Retail',
      description: 'Store operations and point-of-sale management',
      icon: { name: 'ShoppingBag' },
      color: 'blue',
      sections: ['pos', 'inventory', 'merchandising', 'analytics', 'admin']
    },
    {
      id: 'wholesale',
      name: 'Wholesale',
      description: 'B2B trading and distribution management',
      icon: { name: 'Package' },
      color: 'green',
      sections: ['ordering', 'catalog', 'pricing', 'distributors', 'analytics']
    },
    {
      id: 'finance',
      name: 'Finance',
      description: 'Financial management and accounting',
      icon: { name: 'DollarSign' },
      color: 'emerald',
      sections: ['accounting', 'reporting', 'budgeting', 'compliance', 'treasury']
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing',
      description: 'Production planning and shop floor management',
      icon: { name: 'Factory' },
      color: 'orange',
      sections: ['planning', 'production', 'quality', 'maintenance', 'scheduling']
    },
    {
      id: 'crm',
      name: 'CRM',
      description: 'Customer relationship management',
      icon: { name: 'Users' },
      color: 'purple',
      sections: ['leads', 'contacts', 'opportunities', 'accounts', 'campaigns', 'customer360']
    }
  ] as UniversalDomain[],

  sections: [
    // Retail sections
    {
      id: 'pos',
      name: 'Point of Sale',
      description: 'Cash register and customer checkout operations',
      icon: { name: 'CreditCard' },
      color: 'blue',
      workspaces: ['main', 'mobile', 'kiosk'],
      domains: ['retail']
    },
    {
      id: 'inventory',
      name: 'Inventory Management',
      description: 'Stock control and warehouse operations',
      icon: { name: 'Package' },
      color: 'indigo',
      workspaces: ['main', 'receiving', 'dispatch'],
      domains: ['retail', 'wholesale', 'manufacturing']
    },
    {
      id: 'merchandising',
      name: 'Merchandising',
      description: 'Product catalog and pricing management',
      icon: { name: 'Tags' },
      color: 'pink',
      workspaces: ['main', 'pricing', 'promotions'],
      domains: ['retail', 'wholesale']
    },
    // Wholesale sections
    {
      id: 'ordering',
      name: 'Order Management',
      description: 'B2B order processing and fulfillment',
      icon: { name: 'ShoppingCart' },
      color: 'green',
      workspaces: ['main', 'processing', 'fulfillment'],
      domains: ['wholesale']
    },
    {
      id: 'catalog',
      name: 'Catalog Management',
      description: 'Product catalog for wholesale customers',
      icon: { name: 'Book' },
      color: 'teal',
      workspaces: ['main', 'publishing', 'versioning'],
      domains: ['wholesale']
    },
    // Finance sections
    {
      id: 'accounting',
      name: 'General Accounting',
      description: 'Chart of accounts and journal entries',
      icon: { name: 'Calculator' },
      color: 'emerald',
      workspaces: ['main', 'journals', 'reconciliation'],
      domains: ['finance']
    },
    {
      id: 'reporting',
      name: 'Financial Reporting',
      description: 'Financial statements and analysis',
      icon: { name: 'BarChart3' },
      color: 'cyan',
      workspaces: ['main', 'statements', 'analysis'],
      domains: ['finance']
    },
    // Missing sections - Analytics
    {
      id: 'analytics',
      name: 'Analytics & Insights',
      description: 'Business intelligence and data analytics',
      icon: { name: 'BarChart3' },
      color: 'violet',
      workspaces: ['main', 'dashboards', 'reports'],
      domains: ['retail', 'wholesale', 'finance', 'manufacturing', 'crm']
    },
    // Missing sections - Admin
    {
      id: 'admin',
      name: 'Administration',
      description: 'System administration and configuration',
      icon: { name: 'Settings' },
      color: 'gray',
      workspaces: ['main', 'users', 'security'],
      domains: ['retail', 'wholesale', 'finance', 'manufacturing', 'crm']
    },
    // Missing wholesale sections
    {
      id: 'pricing',
      name: 'Pricing Management',
      description: 'Wholesale pricing strategies and tiers',
      icon: { name: 'DollarSign' },
      color: 'green',
      workspaces: ['main', 'tiers', 'strategies'],
      domains: ['wholesale']
    },
    {
      id: 'distributors',
      name: 'Distributor Network',
      description: 'Partner and distributor management',
      icon: { name: 'Building2' },
      color: 'teal',
      workspaces: ['main', 'partners', 'territories'],
      domains: ['wholesale']
    },
    // Missing finance sections
    {
      id: 'budgeting',
      name: 'Budget Planning',
      description: 'Financial planning and budget management',
      icon: { name: 'Calculator' },
      color: 'emerald',
      workspaces: ['main', 'planning', 'variance'],
      domains: ['finance']
    },
    {
      id: 'compliance',
      name: 'Compliance Management',
      description: 'Regulatory compliance and audit trails',
      icon: { name: 'Shield' },
      color: 'red',
      workspaces: ['main', 'audit', 'reporting'],
      domains: ['finance']
    },
    {
      id: 'treasury',
      name: 'Treasury Operations',
      description: 'Cash management and treasury functions',
      icon: { name: 'CreditCard' },
      color: 'blue',
      workspaces: ['main', 'cash', 'payments'],
      domains: ['finance']
    },
    // Missing manufacturing sections
    {
      id: 'planning',
      name: 'Production Planning',
      description: 'Manufacturing resource planning',
      icon: { name: 'Calendar' },
      color: 'orange',
      workspaces: ['main', 'scheduling', 'capacity'],
      domains: ['manufacturing']
    },
    {
      id: 'production',
      name: 'Production Control',
      description: 'Shop floor operations and control',
      icon: { name: 'Factory' },
      color: 'amber',
      workspaces: ['main', 'shopfloor', 'quality'],
      domains: ['manufacturing']
    },
    {
      id: 'quality',
      name: 'Quality Management',
      description: 'Quality control and assurance',
      icon: { name: 'Target' },
      color: 'green',
      workspaces: ['main', 'inspection', 'testing'],
      domains: ['manufacturing']
    },
    {
      id: 'maintenance',
      name: 'Maintenance Management',
      description: 'Equipment maintenance and reliability',
      icon: { name: 'Settings' },
      color: 'gray',
      workspaces: ['main', 'preventive', 'repairs'],
      domains: ['manufacturing']
    },
    {
      id: 'scheduling',
      name: 'Production Scheduling',
      description: 'Detailed production scheduling',
      icon: { name: 'Clock' },
      color: 'purple',
      workspaces: ['main', 'sequences', 'optimization'],
      domains: ['manufacturing']
    },
    // Missing CRM sections
    {
      id: 'leads',
      name: 'Lead Management',
      description: 'Sales lead tracking and qualification',
      icon: { name: 'Target' },
      color: 'purple',
      workspaces: ['main', 'qualification', 'nurturing'],
      domains: ['crm']
    },
    {
      id: 'contacts',
      name: 'Contact Management',
      description: 'Customer and prospect contact information',
      icon: { name: 'Users' },
      color: 'blue',
      workspaces: ['main', 'directory', 'communication'],
      domains: ['crm']
    },
    {
      id: 'opportunities',
      name: 'Sales Opportunities',
      description: 'Sales pipeline and opportunity tracking',
      icon: { name: 'TrendingUp' },
      color: 'green',
      workspaces: ['main', 'pipeline', 'forecasting'],
      domains: ['crm']
    },
    {
      id: 'accounts',
      name: 'Account Management',
      description: 'Customer account management and growth',
      icon: { name: 'Building2' },
      color: 'indigo',
      workspaces: ['main', 'portfolio', 'growth'],
      domains: ['crm']
    },
    {
      id: 'campaigns',
      name: 'Marketing Campaigns',
      description: 'Marketing campaign management and analytics',
      icon: { name: 'Zap' },
      color: 'pink',
      workspaces: ['main', 'execution', 'analytics'],
      domains: ['crm']
    },
    // Customer 360 section for CRM
    {
      id: 'customer360',
      name: 'Customer 360',
      description: 'Comprehensive customer view and management',
      icon: { name: 'Users' },
      color: 'indigo',
      workspaces: ['main', 'analytics', 'insights'],
      domains: ['crm']
    }
  ] as UniversalSection[],

  workspaces: [
    {
      id: 'main',
      name: 'Main Workspace',
      description: 'Primary operational workspace',
      icon: { name: 'LayoutDashboard' },
      color: 'blue',
      personaLabel: 'Manager',
      visibleRoles: ['manager', 'admin', 'operator'],
      defaultNav: 'master-data',
      sections: ['pos', 'inventory', 'ordering', 'accounting'],
      domains: ['retail', 'wholesale', 'finance', 'manufacturing', 'crm']
    },
    {
      id: 'mobile',
      name: 'Mobile Workspace',
      description: 'Mobile-optimized interface for field operations',
      icon: { name: 'Smartphone' },
      color: 'purple',
      personaLabel: 'Field Operator',
      visibleRoles: ['operator', 'supervisor'],
      defaultNav: 'workflow',
      sections: ['pos', 'inventory'],
      domains: ['retail']
    },
    {
      id: 'processing',
      name: 'Processing Workspace',
      description: 'Order and transaction processing center',
      icon: { name: 'Cog' },
      color: 'orange',
      personaLabel: 'Processor',
      visibleRoles: ['processor', 'supervisor', 'admin'],
      defaultNav: 'workflow',
      sections: ['ordering', 'accounting'],
      domains: ['wholesale', 'finance']
    },
    // Missing POS workspaces
    {
      id: 'kiosk',
      name: 'Kiosk Workspace',
      description: 'Self-service customer kiosk interface',
      icon: { name: 'Smartphone' },
      color: 'green',
      personaLabel: 'Customer',
      visibleRoles: ['customer', 'guest'],
      defaultNav: 'self-checkout',
      sections: ['pos'],
      domains: ['retail']
    },
    // Missing inventory workspaces
    {
      id: 'receiving',
      name: 'Receiving Workspace',
      description: 'Goods receiving and inspection',
      icon: { name: 'Package' },
      color: 'indigo',
      personaLabel: 'Receiver',
      visibleRoles: ['receiver', 'warehouse_staff', 'supervisor'],
      defaultNav: 'receiving',
      sections: ['inventory'],
      domains: ['retail', 'wholesale', 'manufacturing']
    },
    {
      id: 'dispatch',
      name: 'Dispatch Workspace',
      description: 'Order fulfillment and shipping',
      icon: { name: 'Truck' },
      color: 'blue',
      personaLabel: 'Dispatcher',
      visibleRoles: ['dispatcher', 'warehouse_staff', 'supervisor'],
      defaultNav: 'shipping',
      sections: ['inventory'],
      domains: ['retail', 'wholesale', 'manufacturing']
    },
    // Missing merchandising workspaces
    {
      id: 'pricing',
      name: 'Pricing Workspace',
      description: 'Product pricing and promotions',
      icon: { name: 'DollarSign' },
      color: 'pink',
      personaLabel: 'Pricing Manager',
      visibleRoles: ['pricing_manager', 'merchandiser', 'admin'],
      defaultNav: 'pricing',
      sections: ['merchandising', 'pricing'],
      domains: ['retail', 'wholesale']
    },
    {
      id: 'promotions',
      name: 'Promotions Workspace',
      description: 'Marketing promotions and campaigns',
      icon: { name: 'Tags' },
      color: 'purple',
      personaLabel: 'Marketing Manager',
      visibleRoles: ['marketing_manager', 'merchandiser', 'admin'],
      defaultNav: 'campaigns',
      sections: ['merchandising', 'campaigns'],
      domains: ['retail', 'wholesale', 'crm']
    },
    // CRM Customer 360 workspaces
    {
      id: 'analytics',
      name: 'Analytics Workspace',
      description: 'Customer analytics and insights dashboard',
      icon: { name: 'BarChart3' },
      color: 'indigo',
      personaLabel: 'Data Analyst',
      visibleRoles: ['analyst', 'manager', 'admin'],
      defaultNav: 'analytics',
      sections: ['customer360', 'analytics'],
      domains: ['crm', 'retail', 'wholesale']
    },
    {
      id: 'insights',
      name: 'Customer Insights Workspace',
      description: 'Advanced customer intelligence and behavioral analysis',
      icon: { name: 'Brain' },
      color: 'violet',
      personaLabel: 'Customer Success Manager',
      visibleRoles: ['customer_success', 'manager', 'admin'],
      defaultNav: 'insights',
      sections: ['customer360'],
      domains: ['crm']
    }
  ] as UniversalWorkspace[],

  entityTypes: [
    {
      id: 'customers',
      name: 'Customers',
      description: 'Customer accounts and contact information',
      icon: { name: 'Users' },
      color: 'blue',
      fields: [
        { id: 'name', name: 'name', label: 'Name', type: 'text', required: true },
        { id: 'email', name: 'email', label: 'Email', type: 'email', required: false },
        { id: 'phone', name: 'phone', label: 'Phone', type: 'phone', required: false },
        { id: 'address', name: 'address', label: 'Address', type: 'text', required: false }
      ],
      actions: ['create', 'edit', 'view', 'delete', 'merge'],
      workspaces: ['main', 'mobile']
    },
    {
      id: 'products',
      name: 'Products',
      description: 'Product catalog and inventory items',
      icon: { name: 'Package' },
      color: 'green',
      fields: [
        { id: 'name', name: 'name', label: 'Product Name', type: 'text', required: true },
        { id: 'sku', name: 'sku', label: 'SKU', type: 'text', required: true },
        { id: 'price', name: 'price', label: 'Price', type: 'number', required: true },
        { id: 'category', name: 'category', label: 'Category', type: 'select', required: false, options: ['Electronics', 'Clothing', 'Food'] }
      ],
      actions: ['create', 'edit', 'view', 'delete', 'duplicate'],
      workspaces: ['main', 'processing']
    },
    {
      id: 'suppliers',
      name: 'Suppliers',
      description: 'Vendor and supplier management',
      icon: { name: 'Building2' },
      color: 'orange',
      fields: [
        { id: 'name', name: 'name', label: 'Supplier Name', type: 'text', required: true },
        { id: 'contact', name: 'contact', label: 'Contact Person', type: 'text', required: false },
        { id: 'email', name: 'email', label: 'Email', type: 'email', required: false },
        { id: 'paymentTerms', name: 'payment_terms', label: 'Payment Terms', type: 'select', required: false, options: ['Net 30', 'Net 60', 'COD'] }
      ],
      actions: ['create', 'edit', 'view', 'delete'],
      workspaces: ['main']
    },
    // Additional entity types for retail inventory workspace
    {
      id: 'categories',
      name: 'Categories',
      description: 'Product categories and classifications',
      icon: { name: 'Tags' },
      color: 'purple',
      fields: [
        { id: 'name', name: 'name', label: 'Category Name', type: 'text', required: true },
        { id: 'code', name: 'code', label: 'Category Code', type: 'text', required: true },
        { id: 'description', name: 'description', label: 'Description', type: 'text', required: false },
        { id: 'parentCategory', name: 'parent_category', label: 'Parent Category', type: 'select', required: false }
      ],
      actions: ['create', 'edit', 'view', 'delete'],
      workspaces: ['main']
    },
    {
      id: 'brands',
      name: 'Brands',
      description: 'Product brands and manufacturers',
      icon: { name: 'Star' },
      color: 'yellow',
      fields: [
        { id: 'name', name: 'name', label: 'Brand Name', type: 'text', required: true },
        { id: 'code', name: 'code', label: 'Brand Code', type: 'text', required: true },
        { id: 'description', name: 'description', label: 'Description', type: 'text', required: false },
        { id: 'website', name: 'website', label: 'Website', type: 'text', required: false }
      ],
      actions: ['create', 'edit', 'view', 'delete'],
      workspaces: ['main']
    },
    {
      id: 'locations',
      name: 'Locations',
      description: 'Storage locations and warehouses',
      icon: { name: 'MapPin' },
      color: 'teal',
      fields: [
        { id: 'name', name: 'name', label: 'Location Name', type: 'text', required: true },
        { id: 'code', name: 'code', label: 'Location Code', type: 'text', required: true },
        { id: 'type', name: 'type', label: 'Location Type', type: 'select', required: true, options: ['Warehouse', 'Store', 'Shelf', 'Bin'] },
        { id: 'address', name: 'address', label: 'Address', type: 'text', required: false }
      ],
      actions: ['create', 'edit', 'view', 'delete'],
      workspaces: ['main']
    },
    {
      id: 'items',
      name: 'Items',
      description: 'Individual inventory items with stock tracking',
      icon: { name: 'Package' },
      color: 'green',
      fields: [
        { id: 'name', name: 'name', label: 'Item Name', type: 'text', required: true },
        { id: 'sku', name: 'sku', label: 'SKU', type: 'text', required: true },
        { id: 'barcode', name: 'barcode', label: 'Barcode', type: 'text', required: false },
        { id: 'stockLevel', name: 'stock_level', label: 'Stock Level', type: 'number', required: true },
        { id: 'minStock', name: 'min_stock', label: 'Minimum Stock', type: 'number', required: true },
        { id: 'maxStock', name: 'max_stock', label: 'Maximum Stock', type: 'number', required: false },
        { id: 'cost', name: 'cost', label: 'Cost Price', type: 'number', required: true },
        { id: 'sellPrice', name: 'sell_price', label: 'Selling Price', type: 'number', required: true }
      ],
      actions: ['create', 'edit', 'view', 'delete', 'adjust_stock'],
      workspaces: ['main']
    },
    // CRM Customer 360 entity types
    {
      id: 'contacts',
      name: 'Contacts',
      description: 'Individual contact persons within customer organizations',
      icon: { name: 'Users' },
      color: 'blue',
      fields: [
        { id: 'firstName', name: 'first_name', label: 'First Name', type: 'text', required: true },
        { id: 'lastName', name: 'last_name', label: 'Last Name', type: 'text', required: true },
        { id: 'title', name: 'title', label: 'Job Title', type: 'text', required: false },
        { id: 'email', name: 'email', label: 'Email', type: 'email', required: true },
        { id: 'phone', name: 'phone', label: 'Phone', type: 'text', required: false },
        { id: 'department', name: 'department', label: 'Department', type: 'text', required: false },
        { id: 'isPrimary', name: 'is_primary', label: 'Primary Contact', type: 'boolean', required: false }
      ],
      actions: ['create', 'edit', 'view', 'delete', 'merge', 'export'],
      workspaces: ['main', 'analytics', 'insights']
    },
    {
      id: 'accounts',
      name: 'Accounts',
      description: 'Customer organizations and company accounts',
      icon: { name: 'Building2' },
      color: 'indigo',
      fields: [
        { id: 'name', name: 'name', label: 'Account Name', type: 'text', required: true },
        { id: 'industry', name: 'industry', label: 'Industry', type: 'select', required: false, options: ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other'] },
        { id: 'website', name: 'website', label: 'Website', type: 'text', required: false },
        { id: 'revenue', name: 'annual_revenue', label: 'Annual Revenue', type: 'number', required: false },
        { id: 'employees', name: 'employee_count', label: 'Employee Count', type: 'number', required: false },
        { id: 'address', name: 'address', label: 'Address', type: 'text', required: false },
        { id: 'tier', name: 'customer_tier', label: 'Customer Tier', type: 'select', required: false, options: ['Bronze', 'Silver', 'Gold', 'Platinum'] }
      ],
      actions: ['create', 'edit', 'view', 'delete', 'merge', 'export'],
      workspaces: ['main', 'analytics', 'insights']
    },
    {
      id: 'opportunities',
      name: 'Opportunities',
      description: 'Sales opportunities and deals in the pipeline',
      icon: { name: 'TrendingUp' },
      color: 'green',
      fields: [
        { id: 'name', name: 'name', label: 'Opportunity Name', type: 'text', required: true },
        { id: 'value', name: 'deal_value', label: 'Deal Value', type: 'number', required: true },
        { id: 'stage', name: 'sales_stage', label: 'Sales Stage', type: 'select', required: true, options: ['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] },
        { id: 'probability', name: 'win_probability', label: 'Win Probability (%)', type: 'number', required: false },
        { id: 'closeDate', name: 'expected_close_date', label: 'Expected Close Date', type: 'date', required: true },
        { id: 'source', name: 'lead_source', label: 'Lead Source', type: 'select', required: false, options: ['Website', 'Referral', 'Cold Call', 'Trade Show', 'Partner', 'Advertisement'] },
        { id: 'description', name: 'description', label: 'Description', type: 'text', required: false }
      ],
      actions: ['create', 'edit', 'view', 'delete', 'convert', 'forecast'],
      workspaces: ['main', 'analytics']
    },
    {
      id: 'activities',
      name: 'Activities',
      description: 'Customer interactions, meetings, calls, and tasks',
      icon: { name: 'Activity' },
      color: 'orange',
      fields: [
        { id: 'subject', name: 'subject', label: 'Subject', type: 'text', required: true },
        { id: 'type', name: 'activity_type', label: 'Activity Type', type: 'select', required: true, options: ['Call', 'Meeting', 'Email', 'Task', 'Demo', 'Follow-up'] },
        { id: 'status', name: 'status', label: 'Status', type: 'select', required: true, options: ['Planned', 'In Progress', 'Completed', 'Cancelled'] },
        { id: 'priority', name: 'priority', label: 'Priority', type: 'select', required: false, options: ['Low', 'Medium', 'High', 'Urgent'] },
        { id: 'dueDate', name: 'due_date', label: 'Due Date', type: 'date', required: false },
        { id: 'duration', name: 'duration_minutes', label: 'Duration (minutes)', type: 'number', required: false },
        { id: 'notes', name: 'notes', label: 'Notes', type: 'text', required: false }
      ],
      actions: ['create', 'edit', 'view', 'delete', 'complete', 'schedule'],
      workspaces: ['main', 'analytics']
    },
    {
      id: 'items_crm',
      name: 'Customer Items',
      description: 'Products and services associated with customer accounts',
      icon: { name: 'Package' },
      color: 'purple',
      fields: [
        { id: 'name', name: 'name', label: 'Item Name', type: 'text', required: true },
        { id: 'type', name: 'item_type', label: 'Type', type: 'select', required: true, options: ['Product', 'Service', 'Solution', 'License', 'Subscription'] },
        { id: 'category', name: 'category', label: 'Category', type: 'select', required: false, options: ['Software', 'Hardware', 'Consulting', 'Support', 'Training'] },
        { id: 'value', name: 'item_value', label: 'Value', type: 'number', required: false },
        { id: 'description', name: 'description', label: 'Description', type: 'text', required: false },
        { id: 'purchaseDate', name: 'purchase_date', label: 'Purchase Date', type: 'date', required: false },
        { id: 'renewalDate', name: 'renewal_date', label: 'Renewal Date', type: 'date', required: false },
        { id: 'status', name: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'Inactive', 'Expired', 'Pending Renewal'] }
      ],
      actions: ['create', 'edit', 'view', 'delete', 'renew', 'upgrade'],
      workspaces: ['main', 'analytics', 'insights']
    }
  ] as UniversalEntityType[],

  transactionTypes: [
    {
      id: 'sales',
      name: 'Sales Transactions',
      description: 'Customer sales and receipts',
      icon: { name: 'ShoppingCart' },
      color: 'green',
      hasLines: true,
      fields: [
        { id: 'customer', name: 'customer_id', label: 'Customer', type: 'select', required: false },
        { id: 'total', name: 'total_amount', label: 'Total Amount', type: 'number', required: true },
        { id: 'date', name: 'transaction_date', label: 'Date', type: 'date', required: true }
      ],
      statuses: ['draft', 'processing', 'completed', 'cancelled'],
      workspaces: ['main', 'mobile', 'pos']
    },
    {
      id: 'purchases',
      name: 'Purchase Orders',
      description: 'Supplier purchase orders and receipts',
      icon: { name: 'Package' },
      color: 'blue',
      hasLines: true,
      fields: [
        { id: 'supplier', name: 'supplier_id', label: 'Supplier', type: 'select', required: true },
        { id: 'total', name: 'total_amount', label: 'Total Amount', type: 'number', required: true },
        { id: 'date', name: 'transaction_date', label: 'Date', type: 'date', required: true }
      ],
      statuses: ['draft', 'sent', 'received', 'completed'],
      workspaces: ['main', 'processing']
    },
    {
      id: 'adjustments',
      name: 'Inventory Adjustments',
      description: 'Stock level adjustments and corrections',
      icon: { name: 'Edit' },
      color: 'orange',
      hasLines: true,
      fields: [
        { id: 'reason', name: 'reason', label: 'Adjustment Reason', type: 'select', required: true, options: ['Physical Count', 'Damage', 'Theft', 'Other'] },
        { id: 'date', name: 'transaction_date', label: 'Date', type: 'date', required: true }
      ],
      statuses: ['draft', 'approved', 'completed'],
      workspaces: ['main']
    },
    // Additional transaction types for retail inventory
    {
      id: 'transfers',
      name: 'Stock Transfers',
      description: 'Transfer items between locations',
      icon: { name: 'ArrowRightLeft' },
      color: 'purple',
      hasLines: true,
      fields: [
        { id: 'fromLocation', name: 'from_location', label: 'From Location', type: 'select', required: true },
        { id: 'toLocation', name: 'to_location', label: 'To Location', type: 'select', required: true },
        { id: 'date', name: 'transaction_date', label: 'Transfer Date', type: 'date', required: true },
        { id: 'reason', name: 'reason', label: 'Transfer Reason', type: 'text', required: false }
      ],
      statuses: ['draft', 'in_transit', 'received', 'completed'],
      workspaces: ['main']
    },
    {
      id: 'receipts',
      name: 'Goods Receipts',
      description: 'Receive inventory from suppliers',
      icon: { name: 'PackageCheck' },
      color: 'teal',
      hasLines: true,
      fields: [
        { id: 'supplier', name: 'supplier_id', label: 'Supplier', type: 'select', required: true },
        { id: 'poNumber', name: 'po_number', label: 'PO Number', type: 'text', required: false },
        { id: 'date', name: 'transaction_date', label: 'Receipt Date', type: 'date', required: true },
        { id: 'receivedBy', name: 'received_by', label: 'Received By', type: 'text', required: true }
      ],
      statuses: ['draft', 'partial', 'completed', 'rejected'],
      workspaces: ['main', 'receiving']
    },
    {
      id: 'issues',
      name: 'Stock Issues',
      description: 'Issue items for consumption or sale',
      icon: { name: 'ArrowDown' },
      color: 'red',
      hasLines: true,
      fields: [
        { id: 'issueTo', name: 'issue_to', label: 'Issue To', type: 'text', required: true },
        { id: 'department', name: 'department', label: 'Department', type: 'select', required: false, options: ['Sales', 'Production', 'Maintenance', 'Admin'] },
        { id: 'date', name: 'transaction_date', label: 'Issue Date', type: 'date', required: true },
        { id: 'purpose', name: 'purpose', label: 'Purpose', type: 'text', required: false }
      ],
      statuses: ['draft', 'issued', 'consumed', 'returned'],
      workspaces: ['main']
    },
    {
      id: 'returns',
      name: 'Returns',
      description: 'Return items from customers or to suppliers',
      icon: { name: 'Undo2' },
      color: 'amber',
      hasLines: true,
      fields: [
        { id: 'returnType', name: 'return_type', label: 'Return Type', type: 'select', required: true, options: ['Customer Return', 'Supplier Return', 'Internal Return'] },
        { id: 'originalTransaction', name: 'original_transaction', label: 'Original Transaction', type: 'text', required: false },
        { id: 'date', name: 'transaction_date', label: 'Return Date', type: 'date', required: true },
        { id: 'reason', name: 'reason', label: 'Return Reason', type: 'select', required: true, options: ['Defective', 'Wrong Item', 'Customer Change', 'Overstock'] }
      ],
      statuses: ['draft', 'processing', 'approved', 'completed', 'rejected'],
      workspaces: ['main']
    },
    {
      id: 'cycles',
      name: 'Cycle Counts',
      description: 'Periodic inventory counting and verification',
      icon: { name: 'RotateCcw' },
      color: 'indigo',
      hasLines: true,
      fields: [
        { id: 'countType', name: 'count_type', label: 'Count Type', type: 'select', required: true, options: ['Full Count', 'Partial Count', 'ABC Analysis'] },
        { id: 'location', name: 'location', label: 'Location', type: 'select', required: true },
        { id: 'date', name: 'transaction_date', label: 'Count Date', type: 'date', required: true },
        { id: 'countedBy', name: 'counted_by', label: 'Counted By', type: 'text', required: true }
      ],
      statuses: ['scheduled', 'in_progress', 'completed', 'variance_review'],
      workspaces: ['main']
    }
  ] as UniversalTransactionType[],

  workflowTypes: [
    {
      id: 'checkout',
      name: 'Customer Checkout',
      description: 'Point-of-sale checkout process',
      icon: { name: 'CreditCard' },
      color: 'green',
      steps: [
        { id: 'scan', name: 'Scan Items', description: 'Scan or add items to cart', type: 'manual', required: true },
        { id: 'payment', name: 'Process Payment', description: 'Accept customer payment', type: 'manual', required: true },
        { id: 'receipt', name: 'Print Receipt', description: 'Print customer receipt', type: 'automatic', required: false }
      ],
      triggers: ['manual', 'barcode_scan'],
      workspaces: ['main', 'mobile']
    },
    {
      id: 'reorder',
      name: 'Automatic Reorder',
      description: 'Automated inventory reordering workflow',
      icon: { name: 'RefreshCw' },
      color: 'blue',
      steps: [
        { id: 'check', name: 'Check Stock Levels', description: 'Monitor inventory levels', type: 'automatic', required: true },
        { id: 'approve', name: 'Approve Reorder', description: 'Manager approval for reorder', type: 'approval', required: true },
        { id: 'order', name: 'Place Order', description: 'Send purchase order to supplier', type: 'automatic', required: true }
      ],
      triggers: ['schedule', 'low_stock'],
      workspaces: ['main']
    }
  ] as UniversalWorkflowType[],

  relationshipTypes: [
    {
      id: 'customer_orders',
      name: 'Customer Orders',
      description: 'Link customers to their orders',
      sourceTypes: ['customers'],
      targetTypes: ['sales'],
      cardinality: 'one-to-many',
      workspaces: ['main', 'mobile']
    },
    {
      id: 'product_suppliers',
      name: 'Product Suppliers',
      description: 'Link products to their suppliers',
      sourceTypes: ['products'],
      targetTypes: ['suppliers'],
      cardinality: 'many-to-many',
      workspaces: ['main']
    }
  ] as UniversalRelationshipType[],

  analyticsTypes: [
    {
      id: 'sales_reports',
      name: 'Sales Reports',
      description: 'Sales performance analytics and reporting',
      icon: { name: 'BarChart3' },
      color: 'green',
      chartTypes: ['line', 'bar', 'pie'],
      dimensions: ['date', 'customer', 'product', 'category'],
      measures: ['revenue', 'quantity', 'profit'],
      workspaces: ['main']
    },
    {
      id: 'inventory_reports',
      name: 'Inventory Reports',
      description: 'Stock levels and movement analytics',
      icon: { name: 'Package' },
      color: 'blue',
      chartTypes: ['bar', 'line', 'gauge'],
      dimensions: ['product', 'category', 'location', 'date'],
      measures: ['stock_level', 'movements', 'value'],
      workspaces: ['main']
    }
  ] as UniversalAnalyticsType[]
}

/**
 * Universal Smart Code Generator
 * Generates HERA DNA smart codes based on route context
 */
export function generateUniversalSmartCode(
  domain: string,
  section?: string,
  workspace?: string,
  type?: string,
  subtype?: string
): string {
  const parts = ['HERA', domain.toUpperCase()]
  
  if (section) parts.push(section.toUpperCase())
  if (type) parts.push(type.toUpperCase())
  if (workspace) parts.push(workspace.toUpperCase())
  if (subtype) parts.push(subtype.toUpperCase())
  
  return `${parts.join('.')}.v1`
}

/**
 * Universal Route Resolver
 * Resolves configuration for any domain/section/workspace combination
 */
export function resolveUniversalConfig(
  domain?: string,
  section?: string,
  workspace?: string
) {
  const config = {
    domain: domain ? UNIVERSAL_CONFIG.domains.find(d => d.id === domain) : null,
    section: section ? UNIVERSAL_CONFIG.sections.find(s => s.id === section) : null,
    workspace: workspace ? UNIVERSAL_CONFIG.workspaces.find(w => w.id === workspace) : null,
    entityTypes: UNIVERSAL_CONFIG.entityTypes.filter(e => 
      !workspace || e.workspaces.includes(workspace)
    ),
    transactionTypes: UNIVERSAL_CONFIG.transactionTypes.filter(t => 
      !workspace || t.workspaces.includes(workspace)
    ),
    workflowTypes: UNIVERSAL_CONFIG.workflowTypes.filter(w => 
      !workspace || w.workspaces.includes(workspace)
    ),
    relationshipTypes: UNIVERSAL_CONFIG.relationshipTypes.filter(r => 
      !workspace || r.workspaces.includes(workspace)
    ),
    analyticsTypes: UNIVERSAL_CONFIG.analyticsTypes.filter(a => 
      !workspace || a.workspaces.includes(workspace)
    )
  }

  return config
}

/**
 * Universal Breadcrumb Generator
 */
export function generateUniversalBreadcrumbs(
  domain?: string,
  section?: string,
  workspace?: string,
  entityType?: string,
  id?: string
) {
  const breadcrumbs = []
  
  if (domain) {
    const domainConfig = UNIVERSAL_CONFIG.domains.find(d => d.id === domain)
    breadcrumbs.push({
      label: domainConfig?.name || domain,
      href: `/${domain}`,
      icon: domainConfig?.icon.name
    })
  }
  
  if (section) {
    const sectionConfig = UNIVERSAL_CONFIG.sections.find(s => s.id === section)
    breadcrumbs.push({
      label: sectionConfig?.name || section,
      href: `/${domain}/${section}`,
      icon: sectionConfig?.icon.name
    })
  }
  
  if (workspace) {
    const workspaceConfig = UNIVERSAL_CONFIG.workspaces.find(w => w.id === workspace)
    breadcrumbs.push({
      label: workspaceConfig?.name || workspace,
      href: `/${domain}/${section}/${workspace}`,
      icon: workspaceConfig?.icon.name
    })
  }
  
  if (entityType) {
    const entityConfig = UNIVERSAL_CONFIG.entityTypes.find(e => e.id === entityType)
    breadcrumbs.push({
      label: entityConfig?.name || entityType,
      href: `/${domain}/${section}/${workspace}/entities/${entityType}`,
      icon: entityConfig?.icon.name
    })
  }
  
  if (id) {
    breadcrumbs.push({
      label: `#${id}`,
      href: `/${domain}/${section}/${workspace}/entities/${entityType}/${id}`,
      icon: 'ExternalLink'
    })
  }
  
  return breadcrumbs
}