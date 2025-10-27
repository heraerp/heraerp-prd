/**
 * Role-Based Access Control Types
 * Smart Code: HERA.RBAC.TYPES.v1
 * 
 * SAP Fiori-inspired role-based access management system
 */

// Business Role Definition
export interface BusinessRole {
  id: string
  name: string
  description: string
  category: 'finance' | 'sales' | 'hr' | 'materials' | 'manufacturing' | 'procurement' | 'admin' | 'executive'
  permissions: Permission[]
  spaces: string[] // Space IDs this role can access
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Permission System
export interface Permission {
  id: string
  resource: string // e.g., 'finance.invoices', 'sales.orders'
  action: 'read' | 'write' | 'create' | 'delete' | 'approve' | 'execute'
  conditions?: PermissionCondition[]
}

export interface PermissionCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than'
  value: any
}

// Space Definition (Module-level access)
export interface Space {
  id: string
  name: string
  description: string
  module: 'finance' | 'sales' | 'hr' | 'materials' | 'manufacturing' | 'procurement' | 'admin'
  icon: string
  color: string
  pages: Page[]
  requiredRoles: string[]
  isActive: boolean
}

// Page Definition (Feature-level access)
export interface Page {
  id: string
  name: string
  path: string
  description: string
  spaceId: string
  sections: Section[]
  requiredPermissions: string[]
  requiredRoles?: string[]
  isActive: boolean
}

// Section Definition (Area within a page)
export interface Section {
  id: string
  name: string
  description: string
  pageId: string
  tiles: Tile[]
  requiredPermissions: string[]
  requiredRoles?: string[]
  isActive: boolean
}

// Tile Definition (Individual actions/widgets)
export interface Tile {
  id: string
  name: string
  description: string
  sectionId: string
  type: 'action' | 'kpi' | 'report' | 'navigation' | 'widget'
  href?: string
  action?: string
  requiredPermissions: string[]
  requiredRoles?: string[]
  badge?: string | number
  icon?: string
  color?: string
  isActive: boolean
}

// User Role Assignment
export interface UserRoleAssignment {
  userId: string
  roleId: string
  assignedBy: string
  assignedAt: string
  expiresAt?: string
  isActive: boolean
  constraints?: UserConstraint[]
}

export interface UserConstraint {
  type: 'time_based' | 'location_based' | 'approval_required'
  config: Record<string, any>
}

// Access Context
export interface AccessContext {
  userId: string
  roles: BusinessRole[]
  permissions: Permission[]
  currentSpace?: string
  currentPage?: string
  sessionId: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

// Pre-defined Business Roles
export const BUSINESS_ROLES = {
  // Finance Roles
  ACCOUNTS_PAYABLE_CLERK: 'accounts_payable_clerk',
  ACCOUNTS_RECEIVABLE_CLERK: 'accounts_receivable_clerk',
  FINANCIAL_ANALYST: 'financial_analyst',
  FINANCE_MANAGER: 'finance_manager',
  CFO: 'cfo',
  
  // Sales Roles
  SALES_REP: 'sales_rep',
  SALES_MANAGER: 'sales_manager',
  SALES_DIRECTOR: 'sales_director',
  CUSTOMER_SERVICE: 'customer_service',
  
  // CRM Roles
  CRM_SALES_REP: 'crm_sales_rep',
  CRM_SALES_MANAGER: 'crm_sales_manager',
  CRM_SALES_ADMIN: 'crm_sales_admin',
  
  // HR Roles
  HR_SPECIALIST: 'hr_specialist',
  HR_MANAGER: 'hr_manager',
  PAYROLL_ADMIN: 'payroll_admin',
  RECRUITMENT_SPECIALIST: 'recruitment_specialist',
  
  // Materials Management
  PROCUREMENT_SPECIALIST: 'procurement_specialist',
  INVENTORY_MANAGER: 'inventory_manager',
  WAREHOUSE_OPERATOR: 'warehouse_operator',
  
  // Salon Roles
  SALON_OWNER: 'salon_owner',
  SALON_MANAGER: 'salon_manager',
  SALON_RECEPTIONIST: 'salon_receptionist',
  SALON_STYLIST: 'salon_stylist',
  SALON_ACCOUNTANT: 'salon_accountant',
  
  // Admin & Executive
  SYSTEM_ADMIN: 'system_admin',
  EXECUTIVE: 'executive',
  AUDITOR: 'auditor'
} as const

// Permission Resources
export const PERMISSION_RESOURCES = {
  // Finance
  'finance.invoices': 'Finance - Invoice Management',
  'finance.payments': 'Finance - Payment Processing',
  'finance.reports': 'Finance - Financial Reports',
  'finance.assets': 'Finance - Fixed Assets',
  'finance.gl': 'Finance - General Ledger',
  
  // Sales
  'sales.orders': 'Sales - Order Management',
  'sales.quotes': 'Sales - Quotation Management',
  'sales.customers': 'Sales - Customer Management',
  'sales.reports': 'Sales - Sales Reports',
  'sales.crm': 'Sales - CRM Activities',
  
  // CRM
  'crm.leads': 'CRM - Lead Management',
  'crm.opportunities': 'CRM - Opportunity Management',
  'crm.customers': 'CRM - Customer Management',
  'crm.contacts': 'CRM - Contact Management',
  'crm.activities': 'CRM - Sales Activities',
  'crm.campaigns': 'CRM - Campaign Management',
  'crm.quotes': 'CRM - Quote Generation',
  'crm.pipeline': 'CRM - Sales Pipeline',
  'crm.forecasting': 'CRM - Sales Forecasting',
  'crm.territories': 'CRM - Territory Management',
  'crm.reports': 'CRM - CRM Reports & Analytics',
  'crm.admin': 'CRM - System Administration',
  
  // HR
  'hr.employees': 'HR - Employee Management',
  'hr.payroll': 'HR - Payroll Processing',
  'hr.benefits': 'HR - Benefits Administration',
  'hr.recruitment': 'HR - Recruitment Process',
  'hr.performance': 'HR - Performance Management',
  
  // Materials
  'materials.procurement': 'Materials - Procurement',
  'materials.inventory': 'Materials - Inventory Management',
  'materials.vendors': 'Materials - Vendor Management',
  'materials.reports': 'Materials - Inventory Reports',
  
  // Salon
  'salon.appointments': 'Salon - Appointment Management',
  'salon.pos': 'Salon - Point of Sale Operations',
  'salon.customers': 'Salon - Customer Management',
  'salon.staff': 'Salon - Staff Management',
  'salon.finance': 'Salon - Financial Operations',
  'salon.inventory': 'Salon - Inventory Management',
  'salon.services': 'Salon - Service Management',
  'salon.reports': 'Salon - Reports & Analytics',
  'salon.branches': 'Salon - Branch Management',
  'salon.settings': 'Salon - Settings & Configuration',
  
  // System
  'system.admin': 'System Administration',
  'system.audit': 'System Audit & Compliance',
  'system.config': 'System Configuration'
} as const

export type BusinessRoleKey = keyof typeof BUSINESS_ROLES
export type PermissionResource = keyof typeof PERMISSION_RESOURCES