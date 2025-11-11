/**
 * HERA v3.0 Platform Constants
 * Multi-Industry Platform Architecture
 * 
 * Defines core constants for platform organization, template packs, and industry management
 */

/**
 * Platform Organization ID
 * Special organization that contains:
 * - All USER entities (user registry)
 * - Template pack registry
 * - Industry definitions
 * - Platform metadata
 * 
 * Business data never stored here - only platform infrastructure
 */
export const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Industry Types
 * Maps to template pack availability and UI customization
 */
export const INDUSTRY_TYPES = {
  WASTE_MANAGEMENT: 'waste_management',
  SALON_BEAUTY: 'salon_beauty', 
  RESTAURANT: 'restaurant',
  HEALTHCARE: 'healthcare',
  RETAIL: 'retail',
  CONSTRUCTION: 'construction',
  GENERIC_BUSINESS: 'generic_business'
} as const

export type IndustryType = typeof INDUSTRY_TYPES[keyof typeof INDUSTRY_TYPES]

/**
 * Template Pack Registry
 * Maps industry types to their template pack IDs
 */
export const TEMPLATE_PACKS = {
  [INDUSTRY_TYPES.WASTE_MANAGEMENT]: 'waste_management_v1',
  [INDUSTRY_TYPES.SALON_BEAUTY]: 'salon_beauty_v1',
  [INDUSTRY_TYPES.RESTAURANT]: 'restaurant_v1', 
  [INDUSTRY_TYPES.HEALTHCARE]: 'healthcare_v1',
  [INDUSTRY_TYPES.RETAIL]: 'retail_v1',
  [INDUSTRY_TYPES.CONSTRUCTION]: 'construction_v1',
  [INDUSTRY_TYPES.GENERIC_BUSINESS]: 'generic_business_v1'
} as const

/**
 * Industry Display Names and Metadata
 */
export const INDUSTRY_CONFIG = {
  [INDUSTRY_TYPES.WASTE_MANAGEMENT]: {
    name: 'Waste Management',
    description: 'Collection, disposal, and recycling operations',
    icon: 'Truck',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    features: ['route_optimization', 'fleet_tracking', 'scale_integration', 'environmental_compliance']
  },
  [INDUSTRY_TYPES.SALON_BEAUTY]: {
    name: 'Salon & Beauty',
    description: 'Hair salons, spas, and beauty services',
    icon: 'Sparkles',
    primaryColor: '#d946ef',
    secondaryColor: '#c026d3',
    features: ['appointment_booking', 'staff_commission', 'inventory_tracking', 'customer_loyalty']
  },
  [INDUSTRY_TYPES.RESTAURANT]: {
    name: 'Restaurant',
    description: 'Food service and hospitality',
    icon: 'ChefHat',
    primaryColor: '#ea580c',
    secondaryColor: '#dc2626',
    features: ['pos_system', 'table_management', 'kitchen_orders', 'delivery_tracking']
  },
  [INDUSTRY_TYPES.HEALTHCARE]: {
    name: 'Healthcare',
    description: 'Medical practices and clinics',
    icon: 'Heart',
    primaryColor: '#0ea5e9',
    secondaryColor: '#0284c7',
    features: ['patient_records', 'appointment_scheduling', 'billing_insurance', 'compliance_tracking']
  },
  [INDUSTRY_TYPES.RETAIL]: {
    name: 'Retail',
    description: 'Stores and e-commerce',
    icon: 'ShoppingBag',
    primaryColor: '#7c3aed',
    secondaryColor: '#6d28d9',
    features: ['inventory_management', 'pos_system', 'customer_loyalty', 'multi_channel']
  },
  [INDUSTRY_TYPES.CONSTRUCTION]: {
    name: 'Construction',
    description: 'Building and project management',
    icon: 'Hammer',
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    features: ['project_tracking', 'resource_management', 'time_tracking', 'safety_compliance']
  },
  [INDUSTRY_TYPES.GENERIC_BUSINESS]: {
    name: 'General Business',
    description: 'Universal business operations',
    icon: 'Building2',
    primaryColor: '#374151',
    secondaryColor: '#1f2937',
    features: ['crm', 'project_management', 'invoicing', 'reporting']
  }
} as const

/**
 * Organization Types
 */
export const ORGANIZATION_TYPES = {
  PLATFORM: 'platform',          // Special platform org
  BUSINESS_UNIT: 'business_unit', // Standard tenant org
  DEMO: 'demo',                   // Demo/trial org
  ENTERPRISE: 'enterprise'        // Enterprise customer org
} as const

export type OrganizationType = typeof ORGANIZATION_TYPES[keyof typeof ORGANIZATION_TYPES]

/**
 * Membership Roles
 */
export const MEMBERSHIP_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin', 
  MANAGER: 'manager',
  STAFF: 'staff',
  VIEWER: 'viewer'
} as const

export type MembershipRole = typeof MEMBERSHIP_ROLES[keyof typeof MEMBERSHIP_ROLES]

/**
 * Smart Code Prefixes for Platform Entities
 */
export const PLATFORM_SMART_CODES = {
  // Platform entities (stored in platform org)
  PLATFORM_USER: 'HERA.PLATFORM.USER.ENTITY.v1',
  PLATFORM_ORG: 'HERA.PLATFORM.ORGANIZATION.ENTITY.v1',
  TEMPLATE_PACK: 'HERA.PLATFORM.TEMPLATE.PACK.v1',
  INDUSTRY_CONFIG: 'HERA.PLATFORM.INDUSTRY.CONFIG.v1',
  
  // Membership relationships 
  USER_MEMBER_OF_ORG: 'HERA.PLATFORM.RELATIONSHIP.MEMBERSHIP.v1',
  ORG_HAS_TEMPLATE_PACK: 'HERA.PLATFORM.RELATIONSHIP.TEMPLATE.v1',
  
  // Platform events
  USER_REGISTERED: 'HERA.PLATFORM.EVENT.USER.REGISTERED.v1',
  ORG_CREATED: 'HERA.PLATFORM.EVENT.ORG.CREATED.v1',
  TEMPLATE_LOADED: 'HERA.PLATFORM.EVENT.TEMPLATE.LOADED.v1'
} as const

/**
 * Default Branding Themes per Industry
 */
export const DEFAULT_BRANDING = {
  [INDUSTRY_TYPES.WASTE_MANAGEMENT]: {
    primary_color: '#10b981',
    secondary_color: '#059669',
    accent_color: '#f59e0b',
    font_family: 'Inter',
    theme: 'light'
  },
  [INDUSTRY_TYPES.SALON_BEAUTY]: {
    primary_color: '#d946ef',
    secondary_color: '#c026d3', 
    accent_color: '#f59e0b',
    font_family: 'Inter',
    theme: 'light'
  },
  [INDUSTRY_TYPES.RESTAURANT]: {
    primary_color: '#ea580c',
    secondary_color: '#dc2626',
    accent_color: '#f59e0b', 
    font_family: 'Inter',
    theme: 'light'
  },
  [INDUSTRY_TYPES.HEALTHCARE]: {
    primary_color: '#0ea5e9',
    secondary_color: '#0284c7',
    accent_color: '#10b981',
    font_family: 'Inter', 
    theme: 'light'
  },
  [INDUSTRY_TYPES.RETAIL]: {
    primary_color: '#7c3aed',
    secondary_color: '#6d28d9',
    accent_color: '#f59e0b',
    font_family: 'Inter',
    theme: 'light'
  },
  [INDUSTRY_TYPES.CONSTRUCTION]: {
    primary_color: '#f59e0b',
    secondary_color: '#d97706',
    accent_color: '#10b981',
    font_family: 'Inter',
    theme: 'light'
  },
  [INDUSTRY_TYPES.GENERIC_BUSINESS]: {
    primary_color: '#374151', 
    secondary_color: '#1f2937',
    accent_color: '#6366f1',
    font_family: 'Inter',
    theme: 'light'
  }
} as const

/**
 * Helper Functions
 */

/**
 * Check if an organization ID is the platform organization
 */
export function isPlatformOrg(orgId: string): boolean {
  return orgId === PLATFORM_ORG_ID
}

/**
 * Get industry config by type
 */
export function getIndustryConfig(industryType: IndustryType) {
  return INDUSTRY_CONFIG[industryType]
}

/**
 * Get template pack ID for an industry
 */
export function getTemplatePack(industryType: IndustryType) {
  return TEMPLATE_PACKS[industryType]
}

/**
 * Get default branding for an industry
 */
export function getDefaultBranding(industryType: IndustryType) {
  return DEFAULT_BRANDING[industryType]
}

/**
 * Validate industry type
 */
export function isValidIndustry(industry: string): industry is IndustryType {
  return Object.values(INDUSTRY_TYPES).includes(industry as IndustryType)
}

/**
 * Get all available industries for selection
 */
export function getAvailableIndustries() {
  return Object.entries(INDUSTRY_CONFIG).map(([key, config]) => ({
    value: key as IndustryType,
    label: config.name,
    description: config.description,
    icon: config.icon,
    primaryColor: config.primaryColor
  }))
}