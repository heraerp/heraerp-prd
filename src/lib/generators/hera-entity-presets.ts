/**
 * HERA Entity Presets - Enterprise Standard
 * Auto-metadata for consistent entity generation across modules and industries
 */

export interface HERAEntityPreset {
  title: string
  titlePlural: string
  smart_code: string
  module: 'CRM' | 'INV' | 'FIN' | 'HR' | 'OPS' | 'MKT'
  industry_agnostic: boolean
  icon: string
  primary_color: string
  accent_color: string
  description: string
  default_fields: string[]
  kpi_metrics: string[]
  business_rules: {
    requires_approval?: boolean
    audit_trail?: boolean
    status_workflow?: boolean
    duplicate_detection?: boolean
  }
}

/**
 * HERA Universal Entity Presets
 * These are the "Golden Standard" entities that work across all industries
 */
export const heraEntityPresets: Record<string, HERAEntityPreset> = {
  // === CRM MODULE ===
  ACCOUNT: {
    title: "Account",
    titlePlural: "Accounts", 
    smart_code: "HERA.CRM.CORE.ENTITY.ACCOUNT.V1",
    module: "CRM",
    industry_agnostic: true,
    icon: "Building2",
    primary_color: "#107c10",
    accent_color: "#0b5a0b",
    description: "Company accounts and organizations",
    default_fields: ["industry", "website", "employees", "revenue", "owner", "phone", "email"],
    kpi_metrics: ["total_accounts", "active_accounts", "monthly_new", "avg_revenue"],
    business_rules: {
      duplicate_detection: true,
      audit_trail: true
    }
  },

  CONTACT: {
    title: "Contact",
    titlePlural: "Contacts",
    smart_code: "HERA.CRM.CORE.ENTITY.CONTACT.V1", 
    module: "CRM",
    industry_agnostic: true,
    icon: "Users",
    primary_color: "#0078d4",
    accent_color: "#005a9e",
    description: "Individual contacts and people",
    default_fields: ["email", "phone", "title", "account", "department", "owner"],
    kpi_metrics: ["total_contacts", "active_contacts", "monthly_new", "by_account"],
    business_rules: {
      duplicate_detection: true,
      audit_trail: true
    }
  },

  LEAD: {
    title: "Lead", 
    titlePlural: "Leads",
    smart_code: "HERA.CRM.LEAD.ENTITY.LEAD.V1",
    module: "CRM",
    industry_agnostic: true,
    icon: "Target",
    primary_color: "#d83b01",
    accent_color: "#a62d01", 
    description: "Sales prospects and potential customers",
    default_fields: ["email", "phone", "company", "source", "score", "owner", "status"],
    kpi_metrics: ["total_leads", "qualified_leads", "conversion_rate", "avg_score"],
    business_rules: {
      status_workflow: true,
      audit_trail: true
    }
  },

  OPPORTUNITY: {
    title: "Opportunity",
    titlePlural: "Opportunities",
    smart_code: "HERA.CRM.PIPELINE.ENTITY.OPPORTUNITY.V1",
    module: "CRM", 
    industry_agnostic: true,
    icon: "TrendingUp",
    primary_color: "#6264a7",
    accent_color: "#464775",
    description: "Sales opportunities and deals in pipeline",
    default_fields: ["account", "contact", "value", "stage", "probability", "close_date", "owner"],
    kpi_metrics: ["total_value", "weighted_value", "win_rate", "avg_deal_size"],
    business_rules: {
      status_workflow: true,
      requires_approval: true,
      audit_trail: true
    }
  },

  ACTIVITY: {
    title: "Activity",
    titlePlural: "Activities", 
    smart_code: "HERA.CRM.ACTIVITY.ENTITY.TASK.V1",
    module: "CRM",
    industry_agnostic: true,
    icon: "Calendar",
    primary_color: "#8764b8",
    accent_color: "#5a4476",
    description: "Tasks, meetings, calls, and other activities",
    default_fields: ["subject", "type", "related_to", "due_date", "owner", "priority", "status"],
    kpi_metrics: ["total_activities", "completed_activities", "overdue", "by_type"],
    business_rules: {
      status_workflow: true,
      audit_trail: true
    }
  },

  // === INVENTORY MODULE ===
  PRODUCT: {
    title: "Product",
    titlePlural: "Products",
    smart_code: "HERA.INV.PRODUCT.ENTITY.ITEM.V1", 
    module: "INV",
    industry_agnostic: true,
    icon: "Package",
    primary_color: "#00bcf2",
    accent_color: "#0078d4",
    description: "Products, items, and inventory assets",
    default_fields: ["sku", "price", "cost", "category", "supplier", "stock", "unit"],
    kpi_metrics: ["total_products", "low_stock", "total_value", "top_categories"],
    business_rules: {
      duplicate_detection: true,
      audit_trail: true
    }
  },

  SUPPLIER: {
    title: "Supplier", 
    titlePlural: "Suppliers",
    smart_code: "HERA.INV.VENDOR.ENTITY.SUPPLIER.V1",
    module: "INV",
    industry_agnostic: true,
    icon: "Truck",
    primary_color: "#498205",
    accent_color: "#3d6b04",
    description: "Vendors and suppliers of products",
    default_fields: ["company", "contact_person", "email", "phone", "category", "rating", "terms"],
    kpi_metrics: ["total_suppliers", "active_suppliers", "avg_rating", "by_category"],
    business_rules: {
      duplicate_detection: true,
      audit_trail: true
    }
  },

  // === FINANCIAL MODULE ===
  CUSTOMER: {
    title: "Customer",
    titlePlural: "Customers", 
    smart_code: "HERA.FIN.AR.ENTITY.CUSTOMER.V1",
    module: "FIN",
    industry_agnostic: true,
    icon: "UserCheck",
    primary_color: "#00aa44",
    accent_color: "#008833",
    description: "Financial customers for AR/invoicing",
    default_fields: ["company", "billing_contact", "payment_terms", "credit_limit", "balance"],
    kpi_metrics: ["total_customers", "total_receivables", "overdue_amount", "avg_payment_days"],
    business_rules: {
      duplicate_detection: true,
      audit_trail: true
    }
  },

  VENDOR: {
    title: "Vendor",
    titlePlural: "Vendors",
    smart_code: "HERA.FIN.AP.ENTITY.VENDOR.V1",
    module: "FIN", 
    industry_agnostic: true,
    icon: "Building",
    primary_color: "#ff6b35",
    accent_color: "#cc4a20",
    description: "Financial vendors for AP/billing",
    default_fields: ["company", "contact_person", "payment_terms", "tax_id", "category"],
    kpi_metrics: ["total_vendors", "total_payables", "payment_due", "by_category"],
    business_rules: {
      duplicate_detection: true,
      audit_trail: true
    }
  },

  // === HUMAN RESOURCES MODULE ===
  EMPLOYEE: {
    title: "Employee",
    titlePlural: "Employees",
    smart_code: "HERA.HR.CORE.ENTITY.EMPLOYEE.V1",
    module: "HR",
    industry_agnostic: true,
    icon: "User",
    primary_color: "#8764b8",
    accent_color: "#5a4476", 
    description: "Company employees and staff members",
    default_fields: ["employee_id", "first_name", "last_name", "department", "position", "manager", "hire_date"],
    kpi_metrics: ["total_employees", "by_department", "new_hires", "avg_tenure"],
    business_rules: {
      duplicate_detection: true,
      audit_trail: true,
      requires_approval: true
    }
  },

  // === OPERATIONS MODULE ===
  PROJECT: {
    title: "Project", 
    titlePlural: "Projects",
    smart_code: "HERA.OPS.PROJECT.ENTITY.PROJECT.V1",
    module: "OPS",
    industry_agnostic: true,
    icon: "FolderOpen",
    primary_color: "#da3b01", 
    accent_color: "#a62d01",
    description: "Projects and operational initiatives",
    default_fields: ["project_name", "manager", "start_date", "end_date", "status", "budget", "client"],
    kpi_metrics: ["active_projects", "completed_projects", "total_budget", "on_time_delivery"],
    business_rules: {
      status_workflow: true,
      requires_approval: true,
      audit_trail: true
    }
  },

  // === MARKETING MODULE ===
  CAMPAIGN: {
    title: "Campaign",
    titlePlural: "Campaigns",
    smart_code: "HERA.MKT.CAMPAIGN.ENTITY.CAMPAIGN.V1", 
    module: "MKT",
    industry_agnostic: true,
    icon: "Megaphone",
    primary_color: "#e3008c",
    accent_color: "#b4006b",
    description: "Marketing campaigns and initiatives", 
    default_fields: ["campaign_name", "type", "channel", "start_date", "end_date", "budget", "owner"],
    kpi_metrics: ["active_campaigns", "total_budget", "avg_roi", "by_channel"],
    business_rules: {
      status_workflow: true,
      requires_approval: true,
      audit_trail: true
    }
  }
}

/**
 * Industry-Specific Entity Extensions
 * These extend the universal presets for specific industries
 */
export const industryEntityPresets: Record<string, Record<string, Partial<HERAEntityPreset>>> = {
  // === RETAIL INDUSTRY ===
  RETAIL: {
    PRODUCT: {
      default_fields: ["sku", "barcode", "price", "cost", "category", "brand", "size", "color", "stock"],
      kpi_metrics: ["total_products", "low_stock", "best_sellers", "margin_analysis"]
    },
    STORE: {
      title: "Store",
      titlePlural: "Stores", 
      smart_code: "HERA.RETAIL.LOCATION.ENTITY.STORE.V1",
      icon: "MapPin",
      primary_color: "#0078d4",
      default_fields: ["store_name", "address", "manager", "phone", "region", "square_feet"]
    }
  },

  // === HEALTHCARE INDUSTRY ===
  HEALTHCARE: {
    PATIENT: {
      title: "Patient",
      titlePlural: "Patients",
      smart_code: "HERA.HEALTHCARE.PATIENT.ENTITY.PERSON.V1",
      icon: "Heart", 
      primary_color: "#e74856",
      default_fields: ["first_name", "last_name", "dob", "mrn", "insurance", "phone", "email"],
      business_rules: { audit_trail: true, requires_approval: false }
    },
    PROVIDER: {
      title: "Provider", 
      titlePlural: "Providers",
      smart_code: "HERA.HEALTHCARE.PROVIDER.ENTITY.DOCTOR.V1",
      icon: "Stethoscope",
      primary_color: "#00aa44"
    }
  },

  // === SALON INDUSTRY ===
  SALON: {
    CLIENT: {
      title: "Client",
      titlePlural: "Clients",
      smart_code: "HERA.SALON.CLIENT.ENTITY.PERSON.V1", 
      icon: "Scissors",
      primary_color: "#e3008c",
      default_fields: ["first_name", "last_name", "phone", "email", "preferences", "last_visit"]
    },
    SERVICE: {
      title: "Service",
      titlePlural: "Services",
      smart_code: "HERA.SALON.SERVICE.ENTITY.TREATMENT.V1",
      icon: "Sparkles",
      primary_color: "#8764b8", 
      default_fields: ["service_name", "duration", "price", "category", "stylist", "description"]
    }
  }
}

/**
 * Get complete entity preset with industry extensions
 */
export function getEntityPreset(entityType: string, industry?: string): HERAEntityPreset | null {
  const basePreset = heraEntityPresets[entityType.toUpperCase()]
  if (!basePreset) return null

  if (industry && industryEntityPresets[industry.toUpperCase()]?.[entityType.toUpperCase()]) {
    const industryOverride = industryEntityPresets[industry.toUpperCase()][entityType.toUpperCase()]
    return { ...basePreset, ...industryOverride }
  }

  return basePreset
}

/**
 * List all available entity types
 */
export function getAvailableEntityTypes(industry?: string): string[] {
  const baseTypes = Object.keys(heraEntityPresets)
  
  if (industry && industryEntityPresets[industry.toUpperCase()]) {
    const industryTypes = Object.keys(industryEntityPresets[industry.toUpperCase()])
    return [...new Set([...baseTypes, ...industryTypes])]
  }

  return baseTypes
}

/**
 * Get entities by module
 */
export function getEntitiesByModule(module: string): HERAEntityPreset[] {
  return Object.values(heraEntityPresets).filter(preset => preset.module === module.toUpperCase())
}

/**
 * Auto-generate smart code
 */
export function generateSmartCode(
  module: string,
  category: string, 
  entityType: string,
  subType: string = "ENTITY"
): string {
  return `HERA.${module.toUpperCase()}.${category.toUpperCase()}.${subType.toUpperCase()}.${entityType.toUpperCase()}.V1`
}

/**
 * Validate smart code format
 */
export function validateSmartCode(smartCode: string): boolean {
  const pattern = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.V\d+$/
  return pattern.test(smartCode)
}

/**
 * Extract metadata from smart code
 */
export function parseSmartCode(smartCode: string) {
  const parts = smartCode.split('.')
  if (parts.length !== 6 || parts[0] !== 'HERA') {
    throw new Error(`Invalid smart code format: ${smartCode}`)
  }

  return {
    platform: parts[0], // "HERA"
    module: parts[1],   // "CRM"
    category: parts[2], // "CORE" 
    subType: parts[3],  // "ENTITY"
    entityType: parts[4], // "ACCOUNT"
    version: parts[5]   // "V1"
  }
}