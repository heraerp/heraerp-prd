/**
 * ================================================================================
 * HERA CENTRAL: Default Master Data Templates
 * Smart Code: HERA.PLATFORM.CENTRAL.TEMPLATES.DEFAULT.v1
 * ================================================================================
 * 
 * Pre-configured templates for common industry/region combinations
 * - Retail standard templates for GCC, EU, US
 * - Manufacturing templates with regional variations
 * - Healthcare and other industry templates
 * - Default apps, modules, policies, and configurations
 * 
 * Sacred Six Compliance: All templates stored as entities + dynamic data
 * ================================================================================
 */

import { heraPlatformEngine } from './platform-engine'

// =============================================================================
// TEMPLATE DEFINITIONS
// =============================================================================

export const DEFAULT_PROVISIONING_TEMPLATES = {
  // ============================================================================
  // RETAIL INDUSTRY TEMPLATES
  // ============================================================================
  
  RETAIL_GCC_STARTER: {
    template_code: 'RETAIL_GCC_STARTER',
    template_name: 'Retail GCC Starter Package',
    industry_code: 'RETAIL',
    region_code: 'GCC',
    license_tier: 'STARTER',
    description: 'Essential retail functionality for GCC market with VAT compliance',
    
    modules: [
      'FICO_CORE',      // Financial accounting
      'INVENTORY_BASIC', // Basic inventory management
      'CRM_LITE'        // Customer management
    ],
    
    apps: [
      'RETAIL_CORE',    // Main retail application
      'POS_BASIC'       // Point of sale
    ],
    
    overlays: [
      'FICO_OVERLAY_RETAIL',     // Retail-specific financial rules
      'FICO_OVERLAY_GCC_VAT',    // GCC VAT compliance
      'RETAIL_OVERLAY_BASIC'     // Basic retail features
    ],
    
    policies: [
      'FICO_POLICY_RETAIL_BASIC',     // Basic financial policies
      'SECURITY_POLICY_STARTER',      // Starter security rules
      'WORKFLOW_POLICY_SIMPLE'        // Simple approval workflows
    ],
    
    coa_pack: 'COA_RETAIL_GCC_BASIC_v1',
    
    dimensions: [
      'STORE',          // Store/location dimension
      'CHANNEL',        // Sales channel (online, offline)
      'PRODUCT_CATEGORY' // Product categorization
    ],
    
    field_configs: {
      customer_fields: ['name', 'email', 'phone', 'loyalty_tier'],
      product_fields: ['sku', 'name', 'category', 'price', 'cost'],
      invoice_fields: ['number', 'date', 'customer', 'total', 'vat_amount']
    },
    
    default_settings: {
      base_currency: 'AED',
      fiscal_year_end: '12-31',
      vat_rate: 0.05,
      multi_currency: false,
      cost_center_required: false,
      auto_posting: true
    }
  },

  RETAIL_GCC_PROFESSIONAL: {
    template_code: 'RETAIL_GCC_PROFESSIONAL',
    template_name: 'Retail GCC Professional Package',
    industry_code: 'RETAIL',
    region_code: 'GCC',
    license_tier: 'PROFESSIONAL',
    description: 'Comprehensive retail solution with advanced features',
    
    modules: [
      'FICO_ADVANCED',           // Advanced financial features
      'INVENTORY_ADVANCED',      // Advanced inventory with WMS
      'CRM_FULL',               // Full CRM capabilities
      'PROCUREMENT',            // Procurement management
      'ANALYTICS_STANDARD'      // Business analytics
    ],
    
    apps: [
      'RETAIL_ENTERPRISE',      // Full retail suite
      'POS_ADVANCED',          // Advanced POS
      'ECOMMERCE_BASIC',       // Basic e-commerce
      'LOYALTY_PROGRAM'        // Loyalty management
    ],
    
    overlays: [
      'FICO_OVERLAY_RETAIL_ADV',     // Advanced retail financial rules
      'FICO_OVERLAY_GCC_VAT',        // GCC VAT compliance
      'RETAIL_OVERLAY_PROFESSIONAL', // Professional retail features
      'LOYALTY_OVERLAY_BASIC'        // Loyalty program features
    ],
    
    policies: [
      'FICO_POLICY_RETAIL_ADVANCED',  // Advanced financial policies
      'SECURITY_POLICY_PROFESSIONAL', // Professional security
      'WORKFLOW_POLICY_ADVANCED',     // Multi-level approvals
      'AI_POLICY_STANDARD'            // AI usage governance
    ],
    
    coa_pack: 'COA_RETAIL_GCC_ADVANCED_v2',
    
    dimensions: [
      'STORE', 'CHANNEL', 'PRODUCT_CATEGORY',
      'COST_CENTER',    // Cost center accounting
      'PROFIT_CENTER',  // Profitability analysis
      'PROJECT',        // Project tracking
      'CAMPAIGN'        // Marketing campaigns
    ]
  },

  RETAIL_EU_STARTER: {
    template_code: 'RETAIL_EU_STARTER',
    template_name: 'Retail EU Starter Package',
    industry_code: 'RETAIL',
    region_code: 'EU',
    license_tier: 'STARTER',
    description: 'Essential retail functionality for EU market with GDPR compliance',
    
    modules: [
      'FICO_CORE',
      'INVENTORY_BASIC',
      'CRM_LITE',
      'GDPR_COMPLIANCE'  // EU-specific compliance
    ],
    
    overlays: [
      'FICO_OVERLAY_RETAIL',
      'FICO_OVERLAY_EU_VAT',     // EU VAT rules
      'GDPR_OVERLAY_BASIC',      // GDPR compliance
      'RETAIL_OVERLAY_EU'        // EU retail specifics
    ],
    
    default_settings: {
      base_currency: 'EUR',
      vat_rate: 0.20,  // Standard EU VAT rate
      gdpr_required: true,
      data_retention_years: 7
    }
  },

  RETAIL_US_STARTER: {
    template_code: 'RETAIL_US_STARTER',
    template_name: 'Retail US Starter Package',
    industry_code: 'RETAIL',
    region_code: 'US',
    license_tier: 'STARTER',
    description: 'Essential retail functionality for US market with state tax compliance',
    
    overlays: [
      'FICO_OVERLAY_RETAIL',
      'FICO_OVERLAY_US_SALES_TAX', // US state sales tax
      'RETAIL_OVERLAY_US'          // US retail specifics
    ],
    
    default_settings: {
      base_currency: 'USD',
      sales_tax_enabled: true,
      multi_state_tax: true
    }
  },

  // ============================================================================
  // MANUFACTURING INDUSTRY TEMPLATES  
  // ============================================================================

  MANUFACTURING_EU_PROFESSIONAL: {
    template_code: 'MANUFACTURING_EU_PROFESSIONAL',
    template_name: 'Manufacturing EU Professional Package',
    industry_code: 'MANUFACTURING',
    region_code: 'EU',
    license_tier: 'PROFESSIONAL',
    description: 'Comprehensive manufacturing solution for EU market',
    
    modules: [
      'FICO_ADVANCED',
      'INVENTORY_MANUFACTURING',  // Manufacturing inventory
      'MRP_STANDARD',            // Material requirements planning
      'QUALITY_MANAGEMENT',      // Quality control
      'SHOP_FLOOR_CONTROL',      // Production management
      'CRM_MANUFACTURING'        // B2B CRM
    ],
    
    apps: [
      'MANUFACTURING_SUITE',     // Core manufacturing app
      'PRODUCTION_PLANNING',     // Production planning
      'QUALITY_CONTROL'         // Quality management
    ],
    
    dimensions: [
      'COST_CENTER', 'PROFIT_CENTER', 'PROJECT',
      'WORK_CENTER',      // Manufacturing work centers
      'PRODUCTION_LINE',  // Production lines
      'SHIFT',           // Work shifts
      'QUALITY_LOT'      // Quality batches
    ],
    
    policies: [
      'FICO_POLICY_MANUFACTURING',
      'QUALITY_POLICY_ISO9001',     // ISO 9001 compliance
      'ENVIRONMENTAL_POLICY_EU',    // EU environmental rules
      'SAFETY_POLICY_STANDARD'     // Workplace safety
    ]
  },

  // ============================================================================
  // SALON/SPA INDUSTRY TEMPLATES
  // ============================================================================

  SALON_GCC_STARTER: {
    template_code: 'SALON_GCC_STARTER',
    template_name: 'Salon & Spa GCC Starter Package',
    industry_code: 'SALON',
    region_code: 'GCC',
    license_tier: 'STARTER',
    description: 'Complete salon management solution for GCC market',
    
    modules: [
      'FICO_CORE',
      'APPOINTMENT_MANAGEMENT',  // Booking and scheduling
      'STAFF_MANAGEMENT',       // Staff scheduling
      'INVENTORY_SALON',        // Salon inventory
      'CRM_SALON'              // Customer management
    ],
    
    apps: [
      'SALON_PRO',             // Main salon application
      'POS_SALON',            // Salon POS
      'BOOKING_SYSTEM'        // Online booking
    ],
    
    dimensions: [
      'STORE', 'STYLIST', 'SERVICE_CATEGORY',
      'ROOM',              // Treatment rooms
      'TIME_SLOT',         // Appointment slots
      'MEMBERSHIP_TIER'    // Customer tiers
    ],
    
    overlays: [
      'SALON_OVERLAY_LUXURY',    // Luxury salon features
      'FICO_OVERLAY_GCC_VAT',   // GCC VAT compliance
      'APPOINTMENT_OVERLAY_ADV'  // Advanced scheduling
    ],
    
    default_settings: {
      base_currency: 'AED',
      appointment_duration_default: 60,
      commission_tracking: true,
      tip_pooling: false
    }
  },

  // ============================================================================
  // HEALTHCARE INDUSTRY TEMPLATES
  // ============================================================================

  HEALTHCARE_US_PROFESSIONAL: {
    template_code: 'HEALTHCARE_US_PROFESSIONAL',
    template_name: 'Healthcare US Professional Package',
    industry_code: 'HEALTHCARE',
    region_code: 'US',
    license_tier: 'PROFESSIONAL',
    description: 'Healthcare management with HIPAA compliance',
    
    modules: [
      'FICO_HEALTHCARE',        // Healthcare financial management
      'PATIENT_MANAGEMENT',     // Patient records
      'APPOINTMENT_SCHEDULING', // Medical appointments
      'BILLING_MEDICAL',        // Medical billing
      'COMPLIANCE_HIPAA'        // HIPAA compliance
    ],
    
    policies: [
      'FICO_POLICY_HEALTHCARE',
      'HIPAA_POLICY_STRICT',     // HIPAA compliance
      'SECURITY_POLICY_MEDICAL', // Medical data security
      'AUDIT_POLICY_HEALTHCARE'  // Healthcare audit requirements
    ],
    
    default_settings: {
      hipaa_required: true,
      data_encryption: 'AES256',
      audit_retention_years: 10,
      patient_consent_required: true
    }
  },

  // ============================================================================
  // AGRICULTURE INDUSTRY TEMPLATES
  // ============================================================================

  AGRO_INDIA_STARTER: {
    template_code: 'AGRO_INDIA_STARTER',
    template_name: 'Agriculture India Starter Package',
    industry_code: 'AGRO',
    region_code: 'INDIA',
    license_tier: 'STARTER',
    description: 'Agricultural management solution for Indian market',
    
    modules: [
      'FICO_AGRO',             // Agricultural accounting
      'FARM_MANAGEMENT',       // Farm operations
      'CROP_PLANNING',         // Crop management
      'INVENTORY_AGRO',        // Agricultural inventory
      'WEATHER_INTEGRATION'    // Weather data
    ],
    
    apps: [
      'AGRO_SUITE',           // Main agriculture app
      'FARM_PLANNER'          // Farm planning tools
    ],
    
    dimensions: [
      'FARM', 'FIELD', 'CROP', 'SEASON',
      'FARMER',              // Farmer/grower
      'WAREHOUSE',           // Storage facilities
      'VEHICLE',             // Farm equipment
      'IRRIGATION_ZONE'      // Irrigation management
    ],
    
    default_settings: {
      base_currency: 'INR',
      seasonal_accounting: true,
      weather_alerts: true,
      gst_enabled: true
    }
  }
}

// =============================================================================
// TEMPLATE INSTALLATION FUNCTIONS
// =============================================================================

/**
 * Install default templates into the platform organization
 */
export async function installDefaultTemplates(actorUserId: string): Promise<{
  success: boolean
  installed_count: number
  errors: string[]
}> {
  console.log('[DefaultTemplates] 🚀 Installing default provisioning templates...')
  
  const errors: string[] = []
  let installedCount = 0
  
  try {
    for (const [templateKey, template] of Object.entries(DEFAULT_PROVISIONING_TEMPLATES)) {
      try {
        await createProvisioningTemplate(template, actorUserId)
        installedCount++
        console.log(`[DefaultTemplates] ✅ Installed template: ${template.template_code}`)
      } catch (error) {
        const errorMsg = `Failed to install template ${template.template_code}: ${error}`
        errors.push(errorMsg)
        console.error(`[DefaultTemplates] ❌ ${errorMsg}`)
      }
    }
    
    console.log(`[DefaultTemplates] 🎉 Installed ${installedCount} default templates`)
    
    return {
      success: errors.length === 0,
      installed_count: installedCount,
      errors
    }
    
  } catch (error) {
    console.error('[DefaultTemplates] 💥 Template installation failed:', error)
    return {
      success: false,
      installed_count: installedCount,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Create a single provisioning template entity
 */
async function createProvisioningTemplate(template: any, actorUserId: string): Promise<void> {
  // Implementation would use hera_entities_crud_v1 to create template entities
  // This is a placeholder for the actual implementation
  console.log(`Creating template: ${template.template_code}`)
  
  // The actual implementation would:
  // 1. Create ORG_PROVISIONING_TEMPLATE entity
  // 2. Store all template data in dynamic_data
  // 3. Create relationships to industry/region entities
  // 4. Create relationships to required modules/apps
}

// =============================================================================
// TEMPLATE QUERY FUNCTIONS
// =============================================================================

/**
 * Get available templates for an industry/region combination
 */
export function getTemplatesForIndustryRegion(
  industryCode: string,
  regionCode: string
): typeof DEFAULT_PROVISIONING_TEMPLATES[keyof typeof DEFAULT_PROVISIONING_TEMPLATES][] {
  return Object.values(DEFAULT_PROVISIONING_TEMPLATES).filter(
    template => template.industry_code === industryCode && template.region_code === regionCode
  )
}

/**
 * Get the best default template for industry/region/license combination
 */
export function getDefaultTemplate(
  industryCode: string,
  regionCode: string,
  licenseTier: string
): typeof DEFAULT_PROVISIONING_TEMPLATES[keyof typeof DEFAULT_PROVISIONING_TEMPLATES] | null {
  const templateKey = `${industryCode}_${regionCode}_${licenseTier}` as keyof typeof DEFAULT_PROVISIONING_TEMPLATES
  return DEFAULT_PROVISIONING_TEMPLATES[templateKey] || null
}

/**
 * Get all supported industry codes
 */
export function getSupportedIndustries(): string[] {
  return [...new Set(Object.values(DEFAULT_PROVISIONING_TEMPLATES).map(t => t.industry_code))]
}

/**
 * Get all supported region codes
 */
export function getSupportedRegions(): string[] {
  return [...new Set(Object.values(DEFAULT_PROVISIONING_TEMPLATES).map(t => t.region_code))]
}

/**
 * Get all supported license tiers
 */
export function getSupportedLicenseTiers(): string[] {
  return [...new Set(Object.values(DEFAULT_PROVISIONING_TEMPLATES).map(t => t.license_tier))]
}