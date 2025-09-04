// ================================================================================
// HERA INDUSTRY-SPECIFIC CASHFLOW TEMPLATES
// Predefined cashflow patterns and configurations for different business types
// Smart Code: HERA.FIN.CF.INDUSTRY.TEMPLATES.v1
// ================================================================================

export interface IndustryCashflowTemplate {
  industry: string
  display_name: string
  typical_categories: {
    operating: string[]
    investing: string[]
    financing: string[]
  }
  cash_cycle_days: {
    dso: number // Days Sales Outstanding
    dio: number // Days Inventory Outstanding  
    dpo: number // Days Payable Outstanding
    ccc: number // Cash Conversion Cycle
  }
  seasonality_factors: {
    q1: number
    q2: number
    q3: number
    q4: number
  }
  benchmark_ratios: {
    operating_cf_margin: number
    cash_to_revenue_ratio: number
    working_capital_ratio: number
  }
  smart_code_mappings: {
    [key: string]: {
      category: 'operating' | 'investing' | 'financing'
      classification: string
      typical_amount_range: [number, number]
    }
  }
  forecast_assumptions: {
    revenue_growth_rate: number
    expense_inflation_rate: number
    capex_as_percent_revenue: number
    dividend_payout_ratio: number
  }
}

// ================================================================================
// RESTAURANT INDUSTRY TEMPLATE
// ================================================================================

export const RestaurantCashflowTemplate: IndustryCashflowTemplate = {
  industry: 'restaurant',
  display_name: 'Restaurant & Food Service',
  
  typical_categories: {
    operating: [
      'receipts_from_customers',
      'payments_to_suppliers',
      'payments_to_employees', 
      'rent_payments',
      'utilities_payments',
      'tax_payments'
    ],
    investing: [
      'acquisition_of_ppe',
      'kitchen_equipment_purchases',
      'renovation_costs'
    ],
    financing: [
      'proceeds_from_loans',
      'loan_repayments',
      'owner_contributions'
    ]
  },

  cash_cycle_days: {
    dso: 2,   // Most restaurants are cash-based
    dio: 7,   // Fresh food inventory turns quickly
    dpo: 15,  // Standard supplier payment terms
    ccc: -6   // Negative cycle (collect before paying)
  },

  seasonality_factors: {
    q1: 0.9,  // Post-holiday slowdown
    q2: 1.1,  // Spring pickup
    q3: 1.0,  // Summer stability
    q4: 1.2   // Holiday season boost
  },

  benchmark_ratios: {
    operating_cf_margin: 0.12,     // 12% of revenue
    cash_to_revenue_ratio: 0.08,   // 8% of annual revenue
    working_capital_ratio: 0.05    // Minimal working capital needs
  },

  smart_code_mappings: {
    'HERA.REST.POS.TXN.SALE.v1': {
      category: 'operating',
      classification: 'receipts_from_customers',
      typical_amount_range: [10, 200]
    },
    'HERA.REST.INV.PUR.FOOD.v1': {
      category: 'operating',
      classification: 'payments_to_suppliers',
      typical_amount_range: [100, 2000]
    },
    'HERA.REST.HR.PAY.SALARY.v1': {
      category: 'operating',
      classification: 'payments_to_employees',
      typical_amount_range: [2000, 15000]
    },
    'HERA.REST.FAC.PAY.RENT.v1': {
      category: 'operating',
      classification: 'rent_payments',
      typical_amount_range: [5000, 25000]
    },
    'HERA.REST.EQP.PUR.KITCHEN.v1': {
      category: 'investing',
      classification: 'kitchen_equipment_purchases',
      typical_amount_range: [1000, 50000]
    }
  },

  forecast_assumptions: {
    revenue_growth_rate: 0.08,      // 8% annual growth
    expense_inflation_rate: 0.05,   // 5% cost inflation
    capex_as_percent_revenue: 0.03, // 3% of revenue for equipment
    dividend_payout_ratio: 0.20     // 20% of net income
  }
}

// ================================================================================
// HAIR SALON TEMPLATE (Hair Talkz Demo)
// ================================================================================

export const HairSalonCashflowTemplate: IndustryCashflowTemplate = {
  industry: 'salon',
  display_name: 'Hair Salon & Beauty Services',
  
  typical_categories: {
    operating: [
      'service_revenue_receipts',
      'product_sales_receipts',
      'supply_payments',
      'staff_payments',
      'rent_payments',
      'utilities_payments',
      'marketing_payments',
      'insurance_payments'
    ],
    investing: [
      'equipment_purchases',
      'renovation_investments',
      'technology_upgrades'
    ],
    financing: [
      'owner_contributions',
      'loan_proceeds',
      'loan_repayments',
      'owner_withdrawals'
    ]
  },

  cash_cycle_days: {
    dso: 1,   // Immediate payment for services
    dio: 45,  // Hair products and supplies inventory
    dpo: 30,  // Standard supplier payment terms
    ccc: 16   // Quick cash conversion
  },

  seasonality_factors: {
    q1: 0.85, // Post-holiday quiet period
    q2: 1.15, // Spring/prom season boost
    q3: 1.10, // Summer wedding season
    q4: 1.25  // Holiday party season peak
  },

  benchmark_ratios: {
    operating_cf_margin: 0.15,     // 15% of revenue
    cash_to_revenue_ratio: 0.12,   // 12% of annual revenue
    working_capital_ratio: 0.08    // Moderate working capital needs
  },

  smart_code_mappings: {
    'HERA.SALON.SVC.TXN.HAIRCUT.v1': {
      category: 'operating',
      classification: 'service_revenue_receipts',
      typical_amount_range: [25, 150]
    },
    'HERA.SALON.SVC.TXN.COLOR.v1': {
      category: 'operating',
      classification: 'service_revenue_receipts',
      typical_amount_range: [80, 300]
    },
    'HERA.SALON.PRD.TXN.SALE.v1': {
      category: 'operating',
      classification: 'product_sales_receipts',
      typical_amount_range: [15, 100]
    },
    'HERA.SALON.INV.PUR.SUPPLY.v1': {
      category: 'operating',
      classification: 'supply_payments',
      typical_amount_range: [200, 1500]
    },
    'HERA.SALON.HR.PAY.STYLIST.v1': {
      category: 'operating',
      classification: 'staff_payments',
      typical_amount_range: [1500, 6000]
    },
    'HERA.SALON.FAC.PAY.RENT.v1': {
      category: 'operating',
      classification: 'rent_payments',
      typical_amount_range: [2500, 8000]
    },
    'HERA.SALON.EQP.PUR.CHAIR.v1': {
      category: 'investing',
      classification: 'equipment_purchases',
      typical_amount_range: [500, 5000]
    },
    'HERA.SALON.CAP.INV.RENO.v1': {
      category: 'investing',
      classification: 'renovation_investments',
      typical_amount_range: [5000, 50000]
    }
  },

  forecast_assumptions: {
    revenue_growth_rate: 0.12,      // 12% annual growth
    expense_inflation_rate: 0.06,   // 6% cost inflation
    capex_as_percent_revenue: 0.05, // 5% of revenue for equipment/renovation
    dividend_payout_ratio: 0.30     // 30% owner withdrawals
  }
}

// ================================================================================
// HEALTHCARE TEMPLATE
// ================================================================================

export const HealthcareCashflowTemplate: IndustryCashflowTemplate = {
  industry: 'healthcare',
  display_name: 'Healthcare & Medical Services',
  
  typical_categories: {
    operating: [
      'patient_service_receipts',
      'insurance_receipts',
      'medical_supply_payments',
      'staff_salary_payments',
      'facility_rent_payments',
      'insurance_payments',
      'equipment_lease_payments'
    ],
    investing: [
      'medical_equipment_purchases',
      'technology_system_purchases',
      'facility_improvements'
    ],
    financing: [
      'equipment_financing',
      'loan_repayments',
      'partner_contributions'
    ]
  },

  cash_cycle_days: {
    dso: 45,  // Insurance claim processing delays
    dio: 30,  // Medical supplies inventory
    dpo: 30,  // Standard payment terms
    ccc: 45   // Longer collection cycle
  },

  seasonality_factors: {
    q1: 1.05, // Insurance deductible resets
    q2: 0.95, // Spring dip
    q3: 0.90, // Summer vacation period
    q4: 1.10  // Year-end medical needs
  },

  benchmark_ratios: {
    operating_cf_margin: 0.18,     // 18% of revenue
    cash_to_revenue_ratio: 0.15,   // 15% of annual revenue
    working_capital_ratio: 0.12    // Higher working capital needs
  },

  smart_code_mappings: {
    'HERA.HLTH.PAT.TXN.CONSULT.v1': {
      category: 'operating',
      classification: 'patient_service_receipts',
      typical_amount_range: [100, 500]
    },
    'HERA.HLTH.INS.TXN.CLAIM.v1': {
      category: 'operating',
      classification: 'insurance_receipts',
      typical_amount_range: [200, 2000]
    },
    'HERA.HLTH.SUP.PUR.MEDICAL.v1': {
      category: 'operating',
      classification: 'medical_supply_payments',
      typical_amount_range: [500, 5000]
    },
    'HERA.HLTH.EQP.PUR.MEDICAL.v1': {
      category: 'investing',
      classification: 'medical_equipment_purchases',
      typical_amount_range: [2000, 100000]
    }
  },

  forecast_assumptions: {
    revenue_growth_rate: 0.06,      // 6% annual growth
    expense_inflation_rate: 0.04,   // 4% cost inflation
    capex_as_percent_revenue: 0.08, // 8% of revenue for equipment
    dividend_payout_ratio: 0.25     // 25% partner distributions
  }
}

// ================================================================================
// RETAIL TEMPLATE
// ================================================================================

export const RetailCashflowTemplate: IndustryCashflowTemplate = {
  industry: 'retail',
  display_name: 'Retail & E-commerce',
  
  typical_categories: {
    operating: [
      'sales_receipts',
      'inventory_payments',
      'staff_payments',
      'rent_payments',
      'marketing_payments',
      'utilities_payments'
    ],
    investing: [
      'store_equipment_purchases',
      'technology_investments',
      'store_renovations'
    ],
    financing: [
      'inventory_financing',
      'loan_repayments',
      'owner_distributions'
    ]
  },

  cash_cycle_days: {
    dso: 15,  // Mix of cash and credit sales
    dio: 60,  // Seasonal inventory buildup
    dpo: 45,  // Negotiate extended payment terms
    ccc: 30   // Standard retail cycle
  },

  seasonality_factors: {
    q1: 0.80, // Post-holiday inventory clearance
    q2: 0.95, // Spring restocking
    q3: 1.00, // Summer stability
    q4: 1.40  // Holiday season surge
  },

  benchmark_ratios: {
    operating_cf_margin: 0.10,     // 10% of revenue
    cash_to_revenue_ratio: 0.06,   // 6% of annual revenue
    working_capital_ratio: 0.15    // Higher inventory requirements
  },

  smart_code_mappings: {
    'HERA.RTL.POS.TXN.SALE.v1': {
      category: 'operating',
      classification: 'sales_receipts',
      typical_amount_range: [20, 500]
    },
    'HERA.RTL.INV.PUR.MERCH.v1': {
      category: 'operating',
      classification: 'inventory_payments',
      typical_amount_range: [1000, 25000]
    },
    'HERA.RTL.STR.PUR.EQUIP.v1': {
      category: 'investing',
      classification: 'store_equipment_purchases',
      typical_amount_range: [500, 15000]
    }
  },

  forecast_assumptions: {
    revenue_growth_rate: 0.10,      // 10% annual growth
    expense_inflation_rate: 0.05,   // 5% cost inflation  
    capex_as_percent_revenue: 0.04, // 4% of revenue for store improvements
    dividend_payout_ratio: 0.35     // 35% owner distributions
  }
}

// ================================================================================
// MANUFACTURING TEMPLATE  
// ================================================================================

export const ManufacturingCashflowTemplate: IndustryCashflowTemplate = {
  industry: 'manufacturing',
  display_name: 'Manufacturing & Production',
  
  typical_categories: {
    operating: [
      'product_sales_receipts',
      'raw_material_payments', 
      'labor_payments',
      'overhead_payments',
      'utility_payments',
      'transportation_payments'
    ],
    investing: [
      'machinery_purchases',
      'facility_expansions',
      'technology_upgrades',
      'rd_investments'
    ],
    financing: [
      'equipment_financing',
      'working_capital_loans',
      'loan_repayments',
      'dividend_payments'
    ]
  },

  cash_cycle_days: {
    dso: 60,  // B2B payment terms
    dio: 90,  // Complex manufacturing cycle
    dpo: 45,  // Supplier payment terms
    ccc: 105  // Longer manufacturing cycle
  },

  seasonality_factors: {
    q1: 0.85, // Post-holiday production ramp-down
    q2: 1.05, // Spring production increase
    q3: 1.00, // Summer stability
    q4: 1.20  // Holiday production peak
  },

  benchmark_ratios: {
    operating_cf_margin: 0.14,     // 14% of revenue
    cash_to_revenue_ratio: 0.10,   // 10% of annual revenue
    working_capital_ratio: 0.20    // Higher working capital needs
  },

  smart_code_mappings: {
    'HERA.MFG.SAL.TXN.PRODUCT.v1': {
      category: 'operating',
      classification: 'product_sales_receipts',
      typical_amount_range: [1000, 50000]
    },
    'HERA.MFG.PUR.TXN.RAWMAT.v1': {
      category: 'operating', 
      classification: 'raw_material_payments',
      typical_amount_range: [500, 20000]
    },
    'HERA.MFG.EQP.PUR.MACHINE.v1': {
      category: 'investing',
      classification: 'machinery_purchases',
      typical_amount_range: [10000, 500000]
    }
  },

  forecast_assumptions: {
    revenue_growth_rate: 0.07,      // 7% annual growth
    expense_inflation_rate: 0.06,   // 6% cost inflation
    capex_as_percent_revenue: 0.12, // 12% of revenue for equipment
    dividend_payout_ratio: 0.20     // 20% dividend payout
  }
}

// ================================================================================
// TEMPLATE REGISTRY
// ================================================================================

export const IndustryTemplateRegistry: Record<string, IndustryCashflowTemplate> = {
  restaurant: RestaurantCashflowTemplate,
  salon: HairSalonCashflowTemplate,
  healthcare: HealthcareCashflowTemplate,
  retail: RetailCashflowTemplate,
  manufacturing: ManufacturingCashflowTemplate
}

// ================================================================================
// TEMPLATE UTILITIES
// ================================================================================

export class CashflowTemplateManager {
  
  /**
   * Get template for a specific industry
   */
  static getTemplate(industry: string): IndustryCashflowTemplate | null {
    return IndustryTemplateRegistry[industry.toLowerCase()] || null
  }

  /**
   * Get all available industry templates
   */
  static getAllTemplates(): IndustryCashflowTemplate[] {
    return Object.values(IndustryTemplateRegistry)
  }

  /**
   * Get industry-specific cashflow categories
   */
  static getIndustryCategories(industry: string) {
    const template = this.getTemplate(industry)
    return template?.typical_categories || {
      operating: ['receipts_from_customers', 'payments_to_suppliers', 'payments_to_employees'],
      investing: ['acquisition_of_ppe', 'proceeds_from_ppe_disposal'],
      financing: ['proceeds_from_borrowings', 'repayment_of_borrowings']
    }
  }

  /**
   * Get industry benchmark ratios
   */
  static getIndustryBenchmarks(industry: string) {
    const template = this.getTemplate(industry)
    return template?.benchmark_ratios || {
      operating_cf_margin: 0.12,
      cash_to_revenue_ratio: 0.08,
      working_capital_ratio: 0.10
    }
  }

  /**
   * Get seasonal adjustment factors
   */
  static getSeasonalityFactors(industry: string) {
    const template = this.getTemplate(industry)
    return template?.seasonality_factors || {
      q1: 1.0, q2: 1.0, q3: 1.0, q4: 1.0
    }
  }

  /**
   * Classify transaction based on industry template
   */
  static classifyTransactionByIndustry(industry: string, smartCode: string, transactionType: string) {
    const template = this.getTemplate(industry)
    
    if (template && template.smart_code_mappings[smartCode]) {
      return template.smart_code_mappings[smartCode]
    }

    // Fallback to generic classification
    return {
      category: 'operating' as const,
      classification: 'other_operating_activities',
      typical_amount_range: [0, 1000000] as [number, number]
    }
  }

  /**
   * Generate industry-specific forecast assumptions
   */
  static getForecastAssumptions(industry: string) {
    const template = this.getTemplate(industry)
    return template?.forecast_assumptions || {
      revenue_growth_rate: 0.08,
      expense_inflation_rate: 0.05,
      capex_as_percent_revenue: 0.05,
      dividend_payout_ratio: 0.25
    }
  }

  /**
   * Get expected cash conversion cycle for industry
   */
  static getCashCycleBenchmark(industry: string) {
    const template = this.getTemplate(industry)
    return template?.cash_cycle_days || {
      dso: 30, dio: 45, dpo: 30, ccc: 45
    }
  }

  /**
   * Validate if transaction amounts are within typical ranges for industry
   */
  static validateTransactionAmount(industry: string, smartCode: string, amount: number): {
    isTypical: boolean
    message: string
    suggestedRange: [number, number]
  } {
    const classification = this.classifyTransactionByIndustry(industry, smartCode, '')
    const [min, max] = classification.typical_amount_range

    const isTypical = amount >= min && amount <= max

    return {
      isTypical,
      message: isTypical 
        ? 'Transaction amount is within typical range for this industry'
        : `Transaction amount of ${amount} is outside typical range (${min} - ${max}) for ${industry} industry`,
      suggestedRange: [min, max]
    }
  }
}