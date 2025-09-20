/**
 * 📦 HERA Module Registry
 *
 * Central registry of all HERA modules and their configurations
 * - Module definitions and metadata
 * - Feature flags and capabilities
 * - Dependency management
 * - Version compatibility
 */

export type ModuleCategory = 'core' | 'industry' | 'addon' | 'enterprise'

export interface ModuleConfig {
  id: string
  name: string
  smartCode: string
  version: string
  description: string
  category: ModuleCategory
  features: string[]
  routes: ModuleRoute[]
  components: ModuleComponent[]
  dependencies: string[] // Other module smart codes
  permissions: string[] // Required permissions
  configuration?: ModuleConfiguration
}

export interface ModuleRoute {
  path: string
  name: string
  component: string // Component path
  requiresAuth: boolean
  permissions?: string[]
}

export interface ModuleComponent {
  name: string
  path: string // Import path
  type: 'page' | 'widget' | 'form' | 'table' | 'chart'
  exportName: string
}

export interface ModuleConfiguration {
  defaults: Record<string, any>
  schema: Record<string, ConfigField>
}

export interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'select' | 'json'
  label: string
  description?: string
  required?: boolean
  default?: any
  options?: { value: string; label: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

// Core modules (included with all installations)
export const CORE_MODULES: ModuleConfig[] = [
  {
    id: 'core-dashboard',
    name: 'Dashboard',
    smartCode: 'HERA.CORE.DASHBOARD.MODULE.v1',
    version: 'v1',
    description: 'Main dashboard and analytics',
    category: 'core',
    features: ['Overview metrics', 'Recent activity', 'Quick actions'],
    routes: [
      {
        path: '/',
        name: 'Dashboard',
        component: '@/app/org/page',
        requiresAuth: true
      }
    ],
    components: [
      {
        name: 'DashboardMetrics',
        path: '@/components/dashboard/DashboardMetrics',
        type: 'widget',
        exportName: 'DashboardMetrics'
      }
    ],
    dependencies: [],
    permissions: ['dashboard:view']
  },
  {
    id: 'core-entities',
    name: 'Entity Management',
    smartCode: 'HERA.CORE.ENTITIES.MODULE.v1',
    version: 'v1',
    description: 'Universal entity management',
    category: 'core',
    features: ['Create entities', 'Dynamic fields', 'Relationships', 'Import/Export'],
    routes: [
      {
        path: '/entities',
        name: 'Entities',
        component: '@/app/org/entities/page',
        requiresAuth: true
      }
    ],
    components: [
      {
        name: 'EntityTable',
        path: '@/components/entities/EntityTable',
        type: 'table',
        exportName: 'EntityTable'
      },
      {
        name: 'EntityForm',
        path: '@/components/entities/EntityForm',
        type: 'form',
        exportName: 'EntityForm'
      }
    ],
    dependencies: [],
    permissions: ['entities:view', 'entities:create', 'entities:update', 'entities:delete']
  },
  {
    id: 'core-accounting',
    name: 'Accounting',
    smartCode: 'HERA.CORE.ACCOUNTING.MODULE.v1',
    version: 'v1',
    description: 'Chart of accounts and journal entries',
    category: 'core',
    features: ['Chart of accounts', 'Journal entries', 'Trial balance', 'Financial reports'],
    routes: [
      {
        path: '/accounting',
        name: 'Accounting',
        component: '@/app/org/accounting/page',
        requiresAuth: true
      }
    ],
    components: [
      {
        name: 'ChartOfAccounts',
        path: '@/components/accounting/ChartOfAccounts',
        type: 'table',
        exportName: 'ChartOfAccounts'
      }
    ],
    dependencies: ['HERA.CORE.ENTITIES.MODULE.v1'],
    permissions: ['accounting:view', 'accounting:create', 'accounting:post']
  }
]

// Industry-specific modules
export const INDUSTRY_MODULES: ModuleConfig[] = [
  {
    id: 'salon-pos',
    name: 'Salon POS',
    smartCode: 'HERA.SALON.POS.MODULE.v1',
    version: 'v1',
    description: 'Complete salon management system',
    category: 'industry',
    features: [
      'Appointment booking',
      'Service management',
      'Staff scheduling',
      'Client profiles',
      'Inventory tracking'
    ],
    routes: [
      {
        path: '/pos',
        name: 'POS Terminal',
        component: '@/app/org/pos/page',
        requiresAuth: true,
        permissions: ['pos:use']
      },
      {
        path: '/appointments',
        name: 'Appointments',
        component: '@/app/org/appointments/page',
        requiresAuth: true,
        permissions: ['appointments:view']
      },
      {
        path: '/clients',
        name: 'Clients',
        component: '@/app/org/clients/page',
        requiresAuth: true,
        permissions: ['clients:view']
      }
    ],
    components: [
      {
        name: 'POSTerminal',
        path: '@/components/salon/POSTerminal',
        type: 'page',
        exportName: 'POSTerminal'
      },
      {
        name: 'AppointmentCalendar',
        path: '@/components/salon/AppointmentCalendar',
        type: 'widget',
        exportName: 'AppointmentCalendar'
      }
    ],
    dependencies: ['HERA.CORE.ENTITIES.MODULE.v1', 'HERA.CORE.ACCOUNTING.MODULE.v1'],
    permissions: ['salon:access'],
    configuration: {
      defaults: {
        appointment_duration_default: 60,
        booking_advance_days: 30,
        cancellation_hours: 24
      },
      schema: {
        appointment_duration_default: {
          type: 'number',
          label: 'Default Appointment Duration (minutes)',
          required: true,
          default: 60,
          validation: { min: 15, max: 240 }
        },
        booking_advance_days: {
          type: 'number',
          label: 'Advance Booking Days',
          required: true,
          default: 30,
          validation: { min: 1, max: 365 }
        }
      }
    }
  },
  {
    id: 'restaurant-pos',
    name: 'Restaurant POS',
    smartCode: 'HERA.RESTAURANT.POS.MODULE.v1',
    version: 'v1',
    description: 'Restaurant management and POS system',
    category: 'industry',
    features: [
      'Menu management',
      'Order processing',
      'Table management',
      'Kitchen display',
      'Inventory control'
    ],
    routes: [
      {
        path: '/pos',
        name: 'POS Terminal',
        component: '@/app/restaurant/pos/page',
        requiresAuth: true
      },
      {
        path: '/kitchen',
        name: 'Kitchen Display',
        component: '@/app/restaurant/kitchen/page',
        requiresAuth: true
      },
      {
        path: '/menu',
        name: 'Menu Management',
        component: '@/app/restaurant/menu/page',
        requiresAuth: true
      }
    ],
    components: [
      {
        name: 'POSTerminal',
        path: '@/components/restaurant/POSTerminal',
        type: 'page',
        exportName: 'POSTerminal'
      },
      {
        name: 'KitchenDisplay',
        path: '@/components/restaurant/KitchenDisplay',
        type: 'page',
        exportName: 'KitchenDisplay'
      }
    ],
    dependencies: ['HERA.CORE.ENTITIES.MODULE.v1', 'HERA.CORE.ACCOUNTING.MODULE.v1'],
    permissions: ['restaurant:access']
  }
]

// Add-on modules
export const ADDON_MODULES: ModuleConfig[] = [
  {
    id: 'auto-journal',
    name: 'Auto-Journal Engine',
    smartCode: 'HERA.FIN.AUTO.JOURNAL.MODULE.V1',
    version: 'v1',
    description: 'AI-powered automatic journal entry creation',
    category: 'addon',
    features: [
      '85% automation rate',
      'Smart transaction classification',
      'Batch processing',
      'Real-time posting'
    ],
    routes: [
      {
        path: '/accounting/auto-journal',
        name: 'Auto-Journal Settings',
        component: '@/app/org/accounting/auto-journal/page',
        requiresAuth: true,
        permissions: ['accounting:admin']
      }
    ],
    components: [
      {
        name: 'AutoJournalDashboard',
        path: '@/components/accounting/AutoJournalDashboard',
        type: 'widget',
        exportName: 'AutoJournalDashboard'
      }
    ],
    dependencies: ['HERA.CORE.ACCOUNTING.MODULE.v1'],
    permissions: ['auto-journal:use'],
    configuration: {
      defaults: {
        batch_threshold: 100,
        immediate_threshold: 1000,
        batch_frequency: 'daily'
      },
      schema: {
        batch_threshold: {
          type: 'number',
          label: 'Batch Processing Threshold ($)',
          description: 'Transactions below this amount are batched',
          required: true,
          default: 100,
          validation: { min: 10, max: 10000 }
        },
        immediate_threshold: {
          type: 'number',
          label: 'Immediate Processing Threshold ($)',
          description: 'Transactions above this amount are processed immediately',
          required: true,
          default: 1000,
          validation: { min: 100, max: 100000 }
        },
        batch_frequency: {
          type: 'select',
          label: 'Batch Processing Frequency',
          required: true,
          default: 'daily',
          options: [
            { value: 'hourly', label: 'Every Hour' },
            { value: 'daily', label: 'Daily' },
            { value: 'shift_end', label: 'End of Shift' }
          ]
        }
      }
    }
  }
]

// Enterprise modules
export const ENTERPRISE_MODULES: ModuleConfig[] = [
  {
    id: 'sso-enterprise',
    name: 'Enterprise SSO',
    smartCode: 'HERA.ENTERPRISE.SSO.MODULE.v1',
    version: 'v1',
    description: 'SAML 2.0 and OIDC single sign-on',
    category: 'enterprise',
    features: [
      'SAML 2.0 support',
      'OpenID Connect',
      'Multi-factor authentication',
      'Directory synchronization'
    ],
    routes: [
      {
        path: '/settings/sso',
        name: 'SSO Configuration',
        component: '@/app/org/settings/sso/page',
        requiresAuth: true,
        permissions: ['admin:sso']
      }
    ],
    components: [],
    dependencies: [],
    permissions: ['enterprise:sso']
  }
]

// Complete module registry
export const MODULE_REGISTRY = new Map<string, ModuleConfig>()

// Populate registry
;[...CORE_MODULES, ...INDUSTRY_MODULES, ...ADDON_MODULES, ...ENTERPRISE_MODULES].forEach(module => {
  MODULE_REGISTRY.set(module.smartCode, module)
})

/**
 * Get module by smart code
 */
export function getModule(smartCode: string): ModuleConfig | undefined {
  return MODULE_REGISTRY.get(smartCode)
}

/**
 * Get modules by category
 */
export function getModulesByCategory(
  category: 'core' | 'industry' | 'addon' | 'enterprise'
): ModuleConfig[] {
  return Array.from(MODULE_REGISTRY.values()).filter(m => m.category === category)
}

/**
 * Get module routes for enabled modules
 */
export function getEnabledRoutes(enabledModules: string[]): ModuleRoute[] {
  const routes: ModuleRoute[] = []

  enabledModules.forEach(smartCode => {
    const module = getModule(smartCode)
    if (module) {
      routes.push(...module.routes)
    }
  })

  return routes
}

/**
 * Check module dependencies
 */
export function checkDependencies(
  smartCode: string,
  enabledModules: string[]
): {
  satisfied: boolean
  missing: string[]
} {
  const module = getModule(smartCode)
  if (!module) return { satisfied: false, missing: [smartCode] }

  const missing = module.dependencies.filter(dep => !enabledModules.includes(dep))

  return {
    satisfied: missing.length === 0,
    missing
  }
}

/**
 * Get module configuration schema
 */
export function getModuleConfigSchema(smartCode: string): ModuleConfiguration | undefined {
  const module = getModule(smartCode)
  return module?.configuration
}
