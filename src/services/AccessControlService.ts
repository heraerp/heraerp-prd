/**
 * Access Control Service
 * Smart Code: HERA.RBAC.SERVICE.v1
 * 
 * Core service for role-based access control management
 */

import { 
  BusinessRole, 
  Permission, 
  Space, 
  Page, 
  Section, 
  Tile, 
  AccessContext,
  UserRoleAssignment,
  BUSINESS_ROLES
} from '@/types/rbac'

export class AccessControlService {
  private static instance: AccessControlService
  private userRoles: Map<string, BusinessRole[]> = new Map()
  private spaces: Map<string, Space> = new Map()
  private pages: Map<string, Page> = new Map()
  private accessCache: Map<string, boolean> = new Map()

  private constructor() {
    this.initializeDefaultSpaces()
    this.initializeDefaultRoles()
  }

  public static getInstance(): AccessControlService {
    if (!AccessControlService.instance) {
      AccessControlService.instance = new AccessControlService()
    }
    return AccessControlService.instance
  }

  // Initialize default spaces based on HERA modules
  private initializeDefaultSpaces(): void {
    const defaultSpaces: Space[] = [
      {
        id: 'finance',
        name: 'Finance',
        description: 'Financial Accounting & Management',
        module: 'finance',
        icon: 'Calculator',
        color: 'bg-green-600',
        pages: [],
        requiredRoles: ['accounts_payable_clerk', 'accounts_receivable_clerk', 'financial_analyst', 'finance_manager', 'cfo'],
        isActive: true
      },
      {
        id: 'sales',
        name: 'Sales & Distribution',
        description: 'Sales Management & CRM',
        module: 'sales',
        icon: 'ShoppingCart',
        color: 'bg-blue-600',
        pages: [],
        requiredRoles: ['sales_rep', 'sales_manager', 'sales_director', 'customer_service', 'crm_sales_rep', 'crm_sales_manager', 'crm_sales_admin'],
        isActive: true
      },
      {
        id: 'hr',
        name: 'Human Resources',
        description: 'HR & Talent Management',
        module: 'hr',
        icon: 'Users',
        color: 'bg-purple-600',
        pages: [],
        requiredRoles: ['hr_specialist', 'hr_manager', 'payroll_admin', 'recruitment_specialist'],
        isActive: true
      },
      {
        id: 'materials',
        name: 'Materials Management',
        description: 'Procurement & Inventory',
        module: 'materials',
        icon: 'Package',
        color: 'bg-orange-600',
        pages: [],
        requiredRoles: ['procurement_specialist', 'inventory_manager', 'warehouse_operator'],
        isActive: true
      },
      {
        id: 'salon',
        name: 'Salon Management',
        description: 'Beauty Business Operations',
        module: 'salon',
        icon: 'Scissors',
        color: 'bg-pink-600',
        pages: [],
        requiredRoles: ['salon_owner', 'salon_manager', 'salon_receptionist', 'salon_stylist', 'salon_accountant'],
        isActive: true
      },
      {
        id: 'manufacturing',
        name: 'Manufacturing',
        description: 'Production Management & Quality Control',
        module: 'manufacturing',
        icon: 'Factory',
        color: 'bg-indigo-600',
        pages: [],
        requiredRoles: ['manufacturing_operator', 'manufacturing_supervisor', 'manufacturing_engineer', 'manufacturing_planner', 'manufacturing_manager', 'quality_manager', 'production_manager'],
        isActive: true
      },
      {
        id: 'procurement',
        name: 'Procurement',
        description: 'Source-to-Pay Management & Supplier Relations',
        module: 'procurement',
        icon: 'ShoppingCart',
        color: 'bg-emerald-600',
        pages: [],
        requiredRoles: ['procurement_specialist', 'procurement_manager', 'sourcing_specialist', 'supplier_manager', 'buyer', 'contract_manager'],
        isActive: true
      },
      {
        id: 'services',
        name: 'Services',
        description: 'Service Management & Project Delivery',
        module: 'services',
        icon: 'Briefcase',
        color: 'bg-teal-600',
        pages: [],
        requiredRoles: ['service_manager', 'project_manager', 'service_technician'],
        isActive: true
      },
      {
        id: 'assets',
        name: 'Asset Management',
        description: 'Asset Lifecycle & Maintenance Management',
        module: 'assets',
        icon: 'UserCheck',
        color: 'bg-gray-600',
        pages: [],
        requiredRoles: ['asset_manager', 'maintenance_technician', 'facility_manager'],
        isActive: true
      }
    ]

    defaultSpaces.forEach(space => {
      this.spaces.set(space.id, space)
    })
  }

  // Initialize default business roles
  private initializeDefaultRoles(): void {
    const defaultRoles: BusinessRole[] = [
      // Finance Roles
      {
        id: 'accounts_payable_clerk',
        name: 'Accounts Payable Clerk',
        description: 'Process supplier invoices and payments',
        category: 'finance',
        permissions: [
          { id: 'ap_read', resource: 'finance.invoices', action: 'read' },
          { id: 'ap_create', resource: 'finance.invoices', action: 'create' },
          { id: 'ap_payments', resource: 'finance.payments', action: 'create' }
        ],
        spaces: ['finance'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'finance_manager',
        name: 'Finance Manager',
        description: 'Manage financial operations and approve transactions',
        category: 'finance',
        permissions: [
          { id: 'finance_full', resource: 'finance.*', action: 'read' },
          { id: 'finance_approve', resource: 'finance.*', action: 'approve' },
          { id: 'finance_reports', resource: 'finance.reports', action: 'read' }
        ],
        spaces: ['finance'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Sales Roles
      {
        id: 'sales_rep',
        name: 'Sales Representative',
        description: 'Manage customer relationships and sales activities',
        category: 'sales',
        permissions: [
          { id: 'sales_orders_rw', resource: 'sales.orders', action: 'read' },
          { id: 'sales_orders_create', resource: 'sales.orders', action: 'create' },
          { id: 'sales_customers', resource: 'sales.customers', action: 'read' },
          { id: 'sales_crm', resource: 'sales.crm', action: 'write' }
        ],
        spaces: ['sales'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sales_manager',
        name: 'Sales Manager',
        description: 'Manage sales team and approve sales transactions',
        category: 'sales',
        permissions: [
          { id: 'sales_full', resource: 'sales.*', action: 'read' },
          { id: 'sales_approve', resource: 'sales.*', action: 'approve' },
          { id: 'sales_reports', resource: 'sales.reports', action: 'read' }
        ],
        spaces: ['sales'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // HR Roles
      {
        id: 'hr_specialist',
        name: 'HR Specialist',
        description: 'Manage employee records and HR processes',
        category: 'hr',
        permissions: [
          { id: 'hr_employees', resource: 'hr.employees', action: 'write' },
          { id: 'hr_benefits', resource: 'hr.benefits', action: 'write' },
          { id: 'hr_recruitment', resource: 'hr.recruitment', action: 'write' }
        ],
        spaces: ['hr'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Materials Roles
      {
        id: 'procurement_specialist',
        name: 'Procurement Specialist',
        description: 'Manage purchasing and vendor relationships',
        category: 'materials',
        permissions: [
          { id: 'procurement_rw', resource: 'materials.procurement', action: 'write' },
          { id: 'vendors_rw', resource: 'materials.vendors', action: 'write' },
          { id: 'inventory_read', resource: 'materials.inventory', action: 'read' }
        ],
        spaces: ['materials'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Salon Roles
      {
        id: 'salon_owner',
        name: 'Salon Owner',
        description: 'Full salon access and business management',
        category: 'salon',
        permissions: [
          { id: 'salon_full', resource: 'salon.*', action: 'read' },
          { id: 'salon_write', resource: 'salon.*', action: 'write' },
          { id: 'salon_approve', resource: 'salon.*', action: 'approve' }
        ],
        spaces: ['salon'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'salon_manager',
        name: 'Salon Manager',
        description: 'Salon operations and staff management',
        category: 'salon',
        permissions: [
          { id: 'salon_operations', resource: 'salon.appointments', action: 'write' },
          { id: 'salon_staff_mgmt', resource: 'salon.staff', action: 'write' },
          { id: 'salon_customers', resource: 'salon.customers', action: 'write' },
          { id: 'salon_reports', resource: 'salon.reports', action: 'read' }
        ],
        spaces: ['salon'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'salon_receptionist',
        name: 'Salon Receptionist',
        description: 'Front desk operations and customer service',
        category: 'salon',
        permissions: [
          { id: 'salon_appointments', resource: 'salon.appointments', action: 'write' },
          { id: 'salon_pos_access', resource: 'salon.pos', action: 'write' },
          { id: 'salon_customers_access', resource: 'salon.customers', action: 'write' }
        ],
        spaces: ['salon'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'salon_stylist',
        name: 'Salon Stylist',
        description: 'Service provider and customer interaction',
        category: 'salon',
        permissions: [
          { id: 'salon_appointments_view', resource: 'salon.appointments', action: 'read' },
          { id: 'salon_services_access', resource: 'salon.services', action: 'read' },
          { id: 'salon_customers_view', resource: 'salon.customers', action: 'read' }
        ],
        spaces: ['salon'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'salon_accountant',
        name: 'Salon Accountant',
        description: 'Financial operations and reporting',
        category: 'salon',
        permissions: [
          { id: 'salon_finance', resource: 'salon.finance', action: 'write' },
          { id: 'salon_reports_access', resource: 'salon.reports', action: 'read' },
          { id: 'salon_pos_financial', resource: 'salon.pos', action: 'read' }
        ],
        spaces: ['salon'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Manufacturing Roles
      {
        id: 'manufacturing_operator',
        name: 'Manufacturing Operator',
        description: 'Shop floor operations and production execution',
        category: 'manufacturing',
        permissions: [
          { id: 'manufacturing_read', resource: 'manufacturing.orders', action: 'read' },
          { id: 'manufacturing_execute', resource: 'manufacturing.shopfloor', action: 'write' },
          { id: 'manufacturing_materials', resource: 'manufacturing.materials', action: 'read' }
        ],
        spaces: ['manufacturing'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'manufacturing_supervisor',
        name: 'Manufacturing Supervisor',
        description: 'Production line supervision and quality oversight',
        category: 'manufacturing',
        permissions: [
          { id: 'manufacturing_supervision', resource: 'manufacturing.operations', action: 'write' },
          { id: 'manufacturing_quality', resource: 'manufacturing.quality', action: 'write' },
          { id: 'manufacturing_resources', resource: 'manufacturing.resources', action: 'write' }
        ],
        spaces: ['manufacturing'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'manufacturing_engineer',
        name: 'Manufacturing Engineer',
        description: 'Product engineering, BOM management and process design',
        category: 'manufacturing',
        permissions: [
          { id: 'manufacturing_engineering', resource: 'manufacturing.engineering', action: 'write' },
          { id: 'manufacturing_bom', resource: 'manufacturing.bom', action: 'write' },
          { id: 'manufacturing_routing', resource: 'manufacturing.routing', action: 'write' }
        ],
        spaces: ['manufacturing'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'manufacturing_planner',
        name: 'Manufacturing Planner',
        description: 'Production planning, scheduling and capacity management',
        category: 'manufacturing',
        permissions: [
          { id: 'manufacturing_planning', resource: 'manufacturing.planning', action: 'write' },
          { id: 'manufacturing_capacity', resource: 'manufacturing.capacity', action: 'write' },
          { id: 'manufacturing_mrp', resource: 'manufacturing.mrp', action: 'write' }
        ],
        spaces: ['manufacturing'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'manufacturing_manager',
        name: 'Manufacturing Manager',
        description: 'Overall manufacturing operations and strategic planning',
        category: 'manufacturing',
        permissions: [
          { id: 'manufacturing_full', resource: 'manufacturing.*', action: 'read' },
          { id: 'manufacturing_approve', resource: 'manufacturing.*', action: 'approve' },
          { id: 'manufacturing_analytics', resource: 'manufacturing.analytics', action: 'read' }
        ],
        spaces: ['manufacturing'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'quality_manager',
        name: 'Quality Manager',
        description: 'Quality management, compliance and process improvement',
        category: 'manufacturing',
        permissions: [
          { id: 'quality_full', resource: 'manufacturing.quality', action: 'write' },
          { id: 'quality_inspection', resource: 'manufacturing.inspection', action: 'write' },
          { id: 'quality_compliance', resource: 'manufacturing.compliance', action: 'write' }
        ],
        spaces: ['manufacturing'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'production_manager',
        name: 'Production Manager',
        description: 'Production operations management and performance optimization',
        category: 'manufacturing',
        permissions: [
          { id: 'production_operations', resource: 'manufacturing.operations', action: 'write' },
          { id: 'production_monitoring', resource: 'manufacturing.monitoring', action: 'read' },
          { id: 'production_orders', resource: 'manufacturing.orders', action: 'write' }
        ],
        spaces: ['manufacturing'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Procurement Roles
      {
        id: 'procurement_specialist',
        name: 'Procurement Specialist',
        description: 'Operational procurement and purchase order management',
        category: 'procurement',
        permissions: [
          { id: 'procurement_operations', resource: 'procurement.operations', action: 'write' },
          { id: 'procurement_orders', resource: 'procurement.orders', action: 'write' },
          { id: 'procurement_requisitions', resource: 'procurement.requisitions', action: 'write' }
        ],
        spaces: ['procurement'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'procurement_manager',
        name: 'Procurement Manager',
        description: 'Strategic procurement management and oversight',
        category: 'procurement',
        permissions: [
          { id: 'procurement_full', resource: 'procurement.*', action: 'read' },
          { id: 'procurement_approve', resource: 'procurement.*', action: 'approve' },
          { id: 'procurement_analytics', resource: 'procurement.analytics', action: 'read' }
        ],
        spaces: ['procurement'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sourcing_specialist',
        name: 'Sourcing Specialist',
        description: 'Strategic sourcing and supplier discovery',
        category: 'procurement',
        permissions: [
          { id: 'sourcing_events', resource: 'procurement.sourcing', action: 'write' },
          { id: 'sourcing_analysis', resource: 'procurement.analysis', action: 'write' },
          { id: 'sourcing_contracts', resource: 'procurement.contracts', action: 'write' }
        ],
        spaces: ['procurement'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'supplier_manager',
        name: 'Supplier Manager',
        description: 'Supplier relationship and performance management',
        category: 'procurement',
        permissions: [
          { id: 'supplier_management', resource: 'procurement.suppliers', action: 'write' },
          { id: 'supplier_evaluation', resource: 'procurement.evaluation', action: 'write' },
          { id: 'supplier_development', resource: 'procurement.development', action: 'write' }
        ],
        spaces: ['procurement'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'buyer',
        name: 'Buyer',
        description: 'Tactical purchasing and vendor management',
        category: 'procurement',
        permissions: [
          { id: 'buying_operations', resource: 'procurement.buying', action: 'write' },
          { id: 'vendor_management', resource: 'procurement.vendors', action: 'write' },
          { id: 'catalog_management', resource: 'procurement.catalog', action: 'write' }
        ],
        spaces: ['procurement'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'contract_manager',
        name: 'Contract Manager',
        description: 'Contract lifecycle and compliance management',
        category: 'procurement',
        permissions: [
          { id: 'contract_management', resource: 'procurement.contracts', action: 'write' },
          { id: 'contract_compliance', resource: 'procurement.compliance', action: 'write' },
          { id: 'contract_negotiation', resource: 'procurement.negotiation', action: 'write' }
        ],
        spaces: ['procurement'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // CRM Roles
      {
        id: 'crm_sales_rep',
        name: 'CRM Sales Representative',
        description: 'Manage leads, opportunities and customer relationships in CRM',
        category: 'sales',
        permissions: [
          { id: 'crm_leads_rw', resource: 'crm.leads', action: 'write' },
          { id: 'crm_opportunities_rw', resource: 'crm.opportunities', action: 'write' },
          { id: 'crm_customers_read', resource: 'crm.customers', action: 'read' },
          { id: 'crm_contacts_rw', resource: 'crm.contacts', action: 'write' },
          { id: 'crm_activities_rw', resource: 'crm.activities', action: 'write' },
          { id: 'crm_quotes_create', resource: 'crm.quotes', action: 'create' }
        ],
        spaces: ['sales'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'crm_sales_manager',
        name: 'CRM Sales Manager',
        description: 'Manage sales team, territories and approve CRM operations',
        category: 'sales',
        permissions: [
          { id: 'crm_full_read', resource: 'crm.*', action: 'read' },
          { id: 'crm_leads_manage', resource: 'crm.leads', action: 'write' },
          { id: 'crm_opportunities_manage', resource: 'crm.opportunities', action: 'write' },
          { id: 'crm_customers_manage', resource: 'crm.customers', action: 'write' },
          { id: 'crm_territories', resource: 'crm.territories', action: 'write' },
          { id: 'crm_pipeline_manage', resource: 'crm.pipeline', action: 'write' },
          { id: 'crm_forecasting', resource: 'crm.forecasting', action: 'read' },
          { id: 'crm_reports', resource: 'crm.reports', action: 'read' }
        ],
        spaces: ['sales'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'crm_sales_admin',
        name: 'CRM Administrator',
        description: 'Full CRM system administration and configuration',
        category: 'sales',
        permissions: [
          { id: 'crm_admin_full', resource: 'crm.*', action: 'write' },
          { id: 'crm_admin_delete', resource: 'crm.*', action: 'delete' },
          { id: 'crm_admin_config', resource: 'crm.admin', action: 'write' },
          { id: 'crm_campaigns', resource: 'crm.campaigns', action: 'write' }
        ],
        spaces: ['sales'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Executive Role
      {
        id: 'executive',
        name: 'Executive',
        description: 'Full access to all modules and executive reports',
        category: 'executive',
        permissions: [
          { id: 'exec_all', resource: '*', action: 'read' },
          { id: 'exec_reports', resource: '*.reports', action: 'read' }
        ],
        spaces: ['finance', 'sales', 'hr', 'materials', 'salon', 'manufacturing', 'procurement', 'services', 'assets'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    // Store roles for demo purposes (in real app, this would come from database)
    defaultRoles.forEach(role => {
      this.userRoles.set(role.id, [role])
    })
  }

  // Check if user has access to a space
  public canAccessSpace(userId: string, spaceId: string): boolean {
    const cacheKey = `space_${userId}_${spaceId}`
    if (this.accessCache.has(cacheKey)) {
      return this.accessCache.get(cacheKey)!
    }

    const userRoles = this.getUserRoles(userId)
    const space = this.spaces.get(spaceId)
    
    if (!space || !space.isActive) {
      this.accessCache.set(cacheKey, false)
      return false
    }

    const hasAccess = userRoles.some(role => 
      space.requiredRoles.includes(role.id) || 
      role.permissions.some(p => p.resource === '*' || p.resource.startsWith(space.module))
    )

    this.accessCache.set(cacheKey, hasAccess)
    return hasAccess
  }

  // Check if user has access to a page
  public canAccessPage(userId: string, pageId: string): boolean {
    const cacheKey = `page_${userId}_${pageId}`
    if (this.accessCache.has(cacheKey)) {
      return this.accessCache.get(cacheKey)!
    }

    const userRoles = this.getUserRoles(userId)
    const page = this.pages.get(pageId)
    
    if (!page || !page.isActive) {
      this.accessCache.set(cacheKey, false)
      return false
    }

    // Check space access first
    if (!this.canAccessSpace(userId, page.spaceId)) {
      this.accessCache.set(cacheKey, false)
      return false
    }

    const hasAccess = this.hasRequiredPermissions(userRoles, page.requiredPermissions) ||
                     (page.requiredRoles && userRoles.some(role => page.requiredRoles!.includes(role.id)))

    this.accessCache.set(cacheKey, hasAccess)
    return hasAccess
  }

  // Check if user can access a section
  public canAccessSection(userId: string, sectionId: string, pageId: string): boolean {
    if (!this.canAccessPage(userId, pageId)) {
      return false
    }

    const userRoles = this.getUserRoles(userId)
    // In a real implementation, you'd fetch section from database
    // For demo, we'll assume access if page access is granted
    return true
  }

  // Check if user can access a tile
  public canAccessTile(userId: string, tileId: string, sectionId: string, pageId: string): boolean {
    if (!this.canAccessSection(userId, sectionId, pageId)) {
      return false
    }

    const userRoles = this.getUserRoles(userId)
    // In a real implementation, you'd fetch tile permissions from database
    // For demo, we'll assume access if section access is granted
    return true
  }

  // Get user's accessible spaces
  public getAccessibleSpaces(userId: string): Space[] {
    return Array.from(this.spaces.values()).filter(space => 
      this.canAccessSpace(userId, space.id)
    )
  }

  // Get user's roles
  public getUserRoles(userId: string): BusinessRole[] {
    // In a real implementation, this would fetch from database
    // For demo, we'll use a default role based on user ID pattern
    if (userId.includes('finance') || userId.includes('ap') || userId.includes('ar')) {
      return [this.getDefaultRole('finance_manager')]
    } else if (userId.includes('sales')) {
      return [this.getDefaultRole('sales_manager')]
    } else if (userId.includes('crm')) {
      return [this.getDefaultRole('crm_sales_manager')]
    } else if (userId.includes('hr')) {
      return [this.getDefaultRole('hr_specialist')]
    } else if (userId.includes('materials') || userId.includes('procurement')) {
      return [this.getDefaultRole('procurement_specialist')]
    } else if (userId.includes('salon') || userId.includes('owner') || userId.includes('stylist')) {
      return [this.getDefaultRole('salon_owner')] // Default to salon owner for demo
    } else if (userId.includes('manufacturing') || userId.includes('production') || userId.includes('quality')) {
      return [this.getDefaultRole('manufacturing_manager')] // Default to manufacturing manager for demo
    } else if (userId.includes('procurement') || userId.includes('sourcing') || userId.includes('buyer') || userId.includes('supplier')) {
      return [this.getDefaultRole('procurement_manager')] // Default to procurement manager for demo
    } else {
      return [this.getDefaultRole('executive')] // Default to executive for demo
    }
  }

  // Helper method to get default role
  private getDefaultRole(roleId: string): BusinessRole {
    const defaultRoles = this.getAllRoles()
    return defaultRoles.find(role => role.id === roleId) || defaultRoles[0]
  }

  // Get all available roles
  public getAllRoles(): BusinessRole[] {
    return [
      {
        id: 'executive',
        name: 'Executive',
        description: 'Full access to all modules',
        category: 'executive',
        permissions: [{ id: 'exec_all', resource: '*', action: 'read' }],
        spaces: ['finance', 'sales', 'hr', 'materials', 'salon', 'manufacturing', 'procurement'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'salon_owner',
        name: 'Salon Owner',
        description: 'Full salon access and business management',
        category: 'salon',
        permissions: [
          { id: 'salon_full', resource: 'salon.*', action: 'read' },
          { id: 'salon_write', resource: 'salon.*', action: 'write' },
          { id: 'salon_approve', resource: 'salon.*', action: 'approve' }
        ],
        spaces: ['salon'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'salon_manager',
        name: 'Salon Manager',
        description: 'Salon operations and staff management',
        category: 'salon',
        permissions: [
          { id: 'salon_operations', resource: 'salon.appointments', action: 'write' },
          { id: 'salon_staff_mgmt', resource: 'salon.staff', action: 'write' },
          { id: 'salon_customers', resource: 'salon.customers', action: 'write' },
          { id: 'salon_reports', resource: 'salon.reports', action: 'read' }
        ],
        spaces: ['salon'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'crm_sales_rep',
        name: 'CRM Sales Representative',
        description: 'Manage leads, opportunities and customer relationships in CRM',
        category: 'sales',
        permissions: [
          { id: 'crm_leads_rw', resource: 'crm.leads', action: 'write' },
          { id: 'crm_opportunities_rw', resource: 'crm.opportunities', action: 'write' },
          { id: 'crm_customers_read', resource: 'crm.customers', action: 'read' },
          { id: 'crm_contacts_rw', resource: 'crm.contacts', action: 'write' },
          { id: 'crm_activities_rw', resource: 'crm.activities', action: 'write' },
          { id: 'crm_quotes_create', resource: 'crm.quotes', action: 'create' }
        ],
        spaces: ['sales'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'crm_sales_manager',
        name: 'CRM Sales Manager',
        description: 'Manage sales team, territories and approve CRM operations',
        category: 'sales',
        permissions: [
          { id: 'crm_full_read', resource: 'crm.*', action: 'read' },
          { id: 'crm_leads_manage', resource: 'crm.leads', action: 'write' },
          { id: 'crm_opportunities_manage', resource: 'crm.opportunities', action: 'write' },
          { id: 'crm_customers_manage', resource: 'crm.customers', action: 'write' },
          { id: 'crm_territories', resource: 'crm.territories', action: 'write' },
          { id: 'crm_pipeline_manage', resource: 'crm.pipeline', action: 'write' },
          { id: 'crm_forecasting', resource: 'crm.forecasting', action: 'read' },
          { id: 'crm_reports', resource: 'crm.reports', action: 'read' }
        ],
        spaces: ['sales'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'crm_sales_admin',
        name: 'CRM Administrator',
        description: 'Full CRM system administration and configuration',
        category: 'sales',
        permissions: [
          { id: 'crm_admin_full', resource: 'crm.*', action: 'write' },
          { id: 'crm_admin_delete', resource: 'crm.*', action: 'delete' },
          { id: 'crm_admin_config', resource: 'crm.admin', action: 'write' },
          { id: 'crm_campaigns', resource: 'crm.campaigns', action: 'write' }
        ],
        spaces: ['sales'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'manufacturing_manager',
        name: 'Manufacturing Manager',
        description: 'Overall manufacturing operations and strategic planning',
        category: 'manufacturing',
        permissions: [
          { id: 'manufacturing_full', resource: 'manufacturing.*', action: 'read' },
          { id: 'manufacturing_approve', resource: 'manufacturing.*', action: 'approve' },
          { id: 'manufacturing_analytics', resource: 'manufacturing.analytics', action: 'read' }
        ],
        spaces: ['manufacturing'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'procurement_manager',
        name: 'Procurement Manager',
        description: 'Strategic procurement management and oversight',
        category: 'procurement',
        permissions: [
          { id: 'procurement_full', resource: 'procurement.*', action: 'read' },
          { id: 'procurement_approve', resource: 'procurement.*', action: 'approve' },
          { id: 'procurement_analytics', resource: 'procurement.analytics', action: 'read' }
        ],
        spaces: ['procurement'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }

  // Helper method to check required permissions
  private hasRequiredPermissions(userRoles: BusinessRole[], requiredPermissions: string[]): boolean {
    if (requiredPermissions.length === 0) return true

    const userPermissions = userRoles.flatMap(role => role.permissions)
    
    return requiredPermissions.every(required => 
      userPermissions.some(permission => 
        permission.resource === '*' || 
        permission.resource === required ||
        (required.includes('.') && permission.resource === required.split('.')[0] + '.*')
      )
    )
  }

  // Clear access cache (useful when roles change)
  public clearAccessCache(userId?: string): void {
    if (userId) {
      // Clear cache for specific user
      for (const key of this.accessCache.keys()) {
        if (key.includes(userId)) {
          this.accessCache.delete(key)
        }
      }
    } else {
      // Clear all cache
      this.accessCache.clear()
    }
  }

  // Create access context for a user
  public createAccessContext(userId: string, sessionId: string): AccessContext {
    const roles = this.getUserRoles(userId)
    const permissions = roles.flatMap(role => role.permissions)

    return {
      userId,
      roles,
      permissions,
      sessionId,
      timestamp: new Date().toISOString()
    }
  }
}