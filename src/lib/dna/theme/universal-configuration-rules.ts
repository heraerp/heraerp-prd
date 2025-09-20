// ================================================================================
// HERA DNA UNIVERSAL CONFIGURATION RULES
// Smart Code: HERA.DNA.CONFIG.RULES.UNIVERSAL.V1
// Configuration system for dynamic theme selection based on business rules
// ================================================================================

import { universalApi } from '@/lib/universal-api'

// ================================================================================
// CONFIGURATION RULE TYPES
// ================================================================================

export interface ConfigurationRule {
  id: string
  name: string
  description: string
  smartCode: string
  priority: number // Higher number = higher priority
  conditions: ConfigurationCondition[]
  actions: ConfigurationAction[]
  metadata?: Record<string, any>
}

export interface ConfigurationCondition {
  type: 'organization' | 'industry' | 'user_role' | 'business_size' | 'feature_flag' | 'time_based' | 'custom'
  operator: 'equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'between'
  field: string
  value: any
  caseSensitive?: boolean
}

export interface ConfigurationAction {
  type: 'set_theme' | 'set_feature' | 'set_layout' | 'set_branding' | 'custom'
  target: string
  value: any
  override?: boolean // Whether this action can be overridden by user preferences
}

export interface OrganizationProfile {
  organizationId: string
  industryType?: string
  businessSize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  region?: string
  brandColors?: {
    primary?: string
    secondary?: string
    logo?: string
  }
  features?: string[]
  customData?: Record<string, any>
}

export interface UserProfile {
  userId: string
  role: string
  permissions: string[]
  preferences?: {
    themeVariant?: string
    darkMode?: boolean
    highContrast?: boolean
    reducedMotion?: boolean
    language?: string
  }
  accessLevel?: 'basic' | 'standard' | 'premium' | 'admin'
}

// ================================================================================
// PREDEFINED CONFIGURATION RULES
// ================================================================================

export const UNIVERSAL_CONFIGURATION_RULES: ConfigurationRule[] = [
  // Industry-based theme rules
  {
    id: 'industry-restaurant-theme',
    name: 'Restaurant Industry Theme',
    description: 'Apply warm earth theme for restaurant businesses',
    smartCode: 'HERA.DNA.CONFIG.RULE.INDUSTRY.RESTAURANT.V1',
    priority: 100,
    conditions: [
      {
        type: 'industry',
        operator: 'equals',
        field: 'industryType',
        value: 'restaurant'
      }
    ],
    actions: [
      {
        type: 'set_theme',
        target: 'variant',
        value: 'warm',
        override: false
      },
      {
        type: 'set_feature',
        target: 'showKitchenMetrics',
        value: true
      }
    ]
  },

  {
    id: 'industry-salon-theme',
    name: 'Salon Industry Theme',
    description: 'Apply elegant purple theme for salon and spa businesses',
    smartCode: 'HERA.DNA.CONFIG.RULE.INDUSTRY.SALON.V1',
    priority: 100,
    conditions: [
      {
        type: 'industry',
        operator: 'equals',
        field: 'industryType',
        value: 'salon'
      }
    ],
    actions: [
      {
        type: 'set_theme',
        target: 'variant',
        value: 'elegant',
        override: false
      },
      {
        type: 'set_feature',
        target: 'showAppointmentMetrics',
        value: true
      }
    ]
  },

  {
    id: 'industry-healthcare-theme',
    name: 'Healthcare Industry Theme',
    description: 'Apply cool teal theme for healthcare organizations',
    smartCode: 'HERA.DNA.CONFIG.RULE.INDUSTRY.HEALTHCARE.V1',
    priority: 100,
    conditions: [
      {
        type: 'industry',
        operator: 'equals',
        field: 'industryType',
        value: 'healthcare'
      }
    ],
    actions: [
      {
        type: 'set_theme',
        target: 'variant',
        value: 'cool',
        override: false
      },
      {
        type: 'set_feature',
        target: 'showPatientMetrics',
        value: true
      }
    ]
  },

  {
    id: 'industry-retail-theme',
    name: 'Retail Industry Theme',
    description: 'Apply vibrant green theme for retail businesses',
    smartCode: 'HERA.DNA.CONFIG.RULE.INDUSTRY.RETAIL.V1',
    priority: 100,
    conditions: [
      {
        type: 'industry',
        operator: 'equals',
        field: 'industryType',
        value: 'retail'
      }
    ],
    actions: [
      {
        type: 'set_theme',
        target: 'variant',
        value: 'vibrant',
        override: false
      },
      {
        type: 'set_feature',
        target: 'showInventoryMetrics',
        value: true
      }
    ]
  },

  {
    id: 'industry-manufacturing-theme',
    name: 'Manufacturing Industry Theme',
    description: 'Apply modern slate theme for manufacturing organizations',
    smartCode: 'HERA.DNA.CONFIG.RULE.INDUSTRY.MANUFACTURING.V1',
    priority: 100,
    conditions: [
      {
        type: 'industry',
        operator: 'equals',
        field: 'industryType',
        value: 'manufacturing'
      }
    ],
    actions: [
      {
        type: 'set_theme',
        target: 'variant',
        value: 'modern',
        override: false
      },
      {
        type: 'set_feature',
        target: 'showProductionMetrics',
        value: true
      }
    ]
  },

  {
    id: 'industry-professional-theme',
    name: 'Professional Services Theme',
    description: 'Apply professional blue theme for professional services',
    smartCode: 'HERA.DNA.CONFIG.RULE.INDUSTRY.PROFESSIONAL.V1',
    priority: 100,
    conditions: [
      {
        type: 'industry',
        operator: 'equals',
        field: 'industryType',
        value: 'professional'
      }
    ],
    actions: [
      {
        type: 'set_theme',
        target: 'variant',
        value: 'professional',
        override: false
      }
    ]
  },

  // Business size-based rules
  {
    id: 'enterprise-advanced-features',
    name: 'Enterprise Advanced Features',
    description: 'Enable advanced features for enterprise organizations',
    smartCode: 'HERA.DNA.CONFIG.RULE.ENTERPRISE.FEATURES.V1',
    priority: 200,
    conditions: [
      {
        type: 'business_size',
        operator: 'equals',
        field: 'businessSize',
        value: 'enterprise'
      }
    ],
    actions: [
      {
        type: 'set_feature',
        target: 'advancedAnalytics',
        value: true
      },
      {
        type: 'set_feature',
        target: 'customBranding',
        value: true
      },
      {
        type: 'set_feature',
        target: 'multiOrgSupport',
        value: true
      }
    ]
  },

  // User role-based rules
  {
    id: 'admin-full-access',
    name: 'Administrator Full Access',
    description: 'Enable all features for administrators',
    smartCode: 'HERA.DNA.CONFIG.RULE.ADMIN.ACCESS.V1',
    priority: 300,
    conditions: [
      {
        type: 'user_role',
        operator: 'equals',
        field: 'role',
        value: 'admin'
      }
    ],
    actions: [
      {
        type: 'set_feature',
        target: 'themeSelector',
        value: true,
        override: true
      },
      {
        type: 'set_feature',
        target: 'systemConfiguration',
        value: true
      },
      {
        type: 'set_feature',
        target: 'userManagement',
        value: true
      }
    ]
  },

  // Custom branding rules
  {
    id: 'custom-brand-colors',
    name: 'Custom Brand Colors',
    description: 'Apply custom brand colors when available',
    smartCode: 'HERA.DNA.CONFIG.RULE.CUSTOM.BRANDING.V1',
    priority: 400,
    conditions: [
      {
        type: 'organization',
        operator: 'contains',
        field: 'brandColors',
        value: 'primary'
      }
    ],
    actions: [
      {
        type: 'set_branding',
        target: 'primaryColor',
        value: '${organization.brandColors.primary}',
        override: true
      }
    ]
  },

  // Accessibility rules
  {
    id: 'high-contrast-accessibility',
    name: 'High Contrast Accessibility',
    description: 'Apply high contrast theme for accessibility',
    smartCode: 'HERA.DNA.CONFIG.RULE.ACCESSIBILITY.CONTRAST.V1',
    priority: 500,
    conditions: [
      {
        type: 'user_role',
        operator: 'contains',
        field: 'preferences.highContrast',
        value: true
      }
    ],
    actions: [
      {
        type: 'set_theme',
        target: 'highContrast',
        value: true,
        override: true
      },
      {
        type: 'set_theme',
        target: 'shadows',
        value: 'lg'
      }
    ]
  }
]

// ================================================================================
// CONFIGURATION ENGINE
// ================================================================================

export class UniversalConfigurationEngine {
  private rules: ConfigurationRule[]
  
  constructor(customRules: ConfigurationRule[] = []) {
    this.rules = [...UNIVERSAL_CONFIGURATION_RULES, ...customRules]
      .sort((a, b) => b.priority - a.priority) // Higher priority first
  }

  /**
   * Evaluate configuration rules and return applicable theme and feature settings
   */
  async evaluateConfiguration(
    organizationProfile: OrganizationProfile,
    userProfile: UserProfile
  ) {
    const applicableRules = this.rules.filter(rule => 
      this.evaluateConditions(rule.conditions, organizationProfile, userProfile)
    )

    const configuration = {
      theme: {
        variant: 'professional',
        customizations: {}
      },
      features: {},
      branding: {},
      layout: {}
    }

    // Apply actions from applicable rules
    for (const rule of applicableRules) {
      for (const action of rule.actions) {
        this.applyAction(action, configuration, organizationProfile, userProfile)
      }
    }

    return {
      configuration,
      appliedRules: applicableRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        smartCode: rule.smartCode,
        priority: rule.priority
      }))
    }
  }

  /**
   * Evaluate if all conditions for a rule are met
   */
  private evaluateConditions(
    conditions: ConfigurationCondition[],
    organizationProfile: OrganizationProfile,
    userProfile: UserProfile
  ): boolean {
    return conditions.every(condition => 
      this.evaluateCondition(condition, organizationProfile, userProfile)
    )
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: ConfigurationCondition,
    organizationProfile: OrganizationProfile,
    userProfile: UserProfile
  ): boolean {
    let contextValue: any

    // Get value from appropriate context
    switch (condition.type) {
      case 'organization':
        contextValue = this.getNestedValue(organizationProfile, condition.field)
        break
      case 'industry':
        contextValue = organizationProfile.industryType
        break
      case 'business_size':
        contextValue = organizationProfile.businessSize
        break
      case 'user_role':
        contextValue = condition.field === 'role' 
          ? userProfile.role 
          : this.getNestedValue(userProfile, condition.field)
        break
      case 'feature_flag':
        contextValue = organizationProfile.features?.includes(condition.field)
        break
      default:
        return false
    }

    // Apply operator
    return this.applyOperator(contextValue, condition.operator, condition.value, condition.caseSensitive)
  }

  /**
   * Apply an operator to compare values
   */
  private applyOperator(
    contextValue: any,
    operator: ConfigurationCondition['operator'],
    expectedValue: any,
    caseSensitive = true
  ): boolean {
    if (!caseSensitive && typeof contextValue === 'string' && typeof expectedValue === 'string') {
      contextValue = contextValue.toLowerCase()
      expectedValue = expectedValue.toLowerCase()
    }

    switch (operator) {
      case 'equals':
        return contextValue === expectedValue
      case 'contains':
        return typeof contextValue === 'string' && contextValue.includes(expectedValue)
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(contextValue)
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(contextValue)
      case 'greater_than':
        return Number(contextValue) > Number(expectedValue)
      case 'less_than':
        return Number(contextValue) < Number(expectedValue)
      case 'between':
        return Array.isArray(expectedValue) && 
               Number(contextValue) >= Number(expectedValue[0]) && 
               Number(contextValue) <= Number(expectedValue[1])
      default:
        return false
    }
  }

  /**
   * Apply a configuration action
   */
  private applyAction(
    action: ConfigurationAction,
    configuration: any,
    organizationProfile: OrganizationProfile,
    userProfile: UserProfile
  ) {
    const value = this.resolveActionValue(action.value, organizationProfile, userProfile)

    switch (action.type) {
      case 'set_theme':
        if (!configuration.theme[action.target] || action.override) {
          configuration.theme[action.target] = value
        }
        break
      case 'set_feature':
        configuration.features[action.target] = value
        break
      case 'set_branding':
        configuration.branding[action.target] = value
        break
      case 'set_layout':
        configuration.layout[action.target] = value
        break
    }
  }

  /**
   * Resolve action value with variable substitution
   */
  private resolveActionValue(
    value: any,
    organizationProfile: OrganizationProfile,
    userProfile: UserProfile
  ): any {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const path = value.slice(2, -1)
      if (path.startsWith('organization.')) {
        return this.getNestedValue(organizationProfile, path.substring(13))
      } else if (path.startsWith('user.')) {
        return this.getNestedValue(userProfile, path.substring(5))
      }
    }
    return value
  }

  /**
   * Get nested object value by dot notation path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current && current[key], obj)
  }
}

// ================================================================================
// CONFIGURATION PERSISTENCE
// ================================================================================

export class ConfigurationPersistence {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Save configuration to universal database
   */
  async saveConfiguration(configuration: any, appliedRules: any[]) {
    try {
      // Save as entity in universal system
      const configEntity = await universalApi.createEntity({
        entity_type: 'configuration',
        entity_name: `Theme Configuration - ${this.organizationId}`,
        entity_code: `CONFIG-THEME-${this.organizationId}`,
        smart_code: 'HERA.DNA.CONFIG.ENTITY.THEME.V1',
        organization_id: this.organizationId
      })

      // Save configuration data as dynamic fields
      await universalApi.setDynamicField(configEntity.id, 'theme_variant', configuration.theme.variant)
      await universalApi.setDynamicField(configEntity.id, 'theme_customizations', JSON.stringify(configuration.theme.customizations))
      await universalApi.setDynamicField(configEntity.id, 'features', JSON.stringify(configuration.features))
      await universalApi.setDynamicField(configEntity.id, 'branding', JSON.stringify(configuration.branding))
      await universalApi.setDynamicField(configEntity.id, 'applied_rules', JSON.stringify(appliedRules))

      return configEntity
    } catch (error) {
      console.error('Failed to save configuration:', error)
      throw error
    }
  }

  /**
   * Load configuration from universal database
   */
  async loadConfiguration() {
    try {
      // Query for existing configuration
      const configurations = await universalApi.queryEntities({
        entity_type: 'configuration',
        organization_id: this.organizationId,
        smart_code: 'HERA.DNA.CONFIG.ENTITY.THEME.V1'
      })

      if (configurations.length === 0) {
        return null
      }

      const configEntity = configurations[0]
      const dynamicFields = await universalApi.getDynamicFields(configEntity.id)

      return {
        theme: {
          variant: dynamicFields.theme_variant || 'professional',
          customizations: JSON.parse(dynamicFields.theme_customizations || '{}')
        },
        features: JSON.parse(dynamicFields.features || '{}'),
        branding: JSON.parse(dynamicFields.branding || '{}'),
        appliedRules: JSON.parse(dynamicFields.applied_rules || '[]')
      }
    } catch (error) {
      console.error('Failed to load configuration:', error)
      return null
    }
  }
}

// ================================================================================
// EXPORTS
// ================================================================================

export { UniversalConfigurationEngine as default }

// Utility function for easy configuration
export async function getThemeConfiguration(
  organizationProfile: OrganizationProfile,
  userProfile: UserProfile,
  customRules: ConfigurationRule[] = []
) {
  const engine = new UniversalConfigurationEngine(customRules)
  return await engine.evaluateConfiguration(organizationProfile, userProfile)
}