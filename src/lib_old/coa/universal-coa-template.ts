/**
 * HERA Universal Chart of Accounts Template Generator
 * Enforces global 5-6-7-8-9 numbering structure across all industries
 * Smart Code: HERA.UNIVERSAL.COA.TEMPLATE.GENERATOR.V2
 */

export interface UniversalCOAAccount {
  id: string
  entity_code: string
  entity_name: string
  smart_code: string
  status: string
  account_type:
    | 'assets'
    | 'liabilities'
    | 'equity'
    | 'revenue'
    | 'cost_of_sales'
    | 'direct_expenses'
    | 'indirect_expenses'
    | 'taxes_extraordinary'
    | 'statistical'
  normal_balance: 'debit' | 'credit'
  vat_applicable: string
  currency: string
  // IFRS Lineage - MANDATORY FIELDS
  ifrs_classification: string // IFRS Statement Classification
  parent_account: string // Parent account code for hierarchy
  account_level: number // 1=Header, 2=Category, 3=SubCategory, 4=Account, 5=SubAccount
  ifrs_category: string // IFRS Presentation Category
  presentation_order: number // Order in financial statements
  is_header: boolean // True for header/summary accounts
  rollup_account: string // Account where this rolls up to
  // Additional IFRS Fields
  ifrs_statement?: 'SFP' | 'SPL' | 'SCE' | 'SCF' | 'NOTES' // Statement of Financial Position, Profit/Loss, Changes in Equity, Cash Flows
  ifrs_subcategory?: string // Detailed IFRS subcategory
  consolidation_method?: 'sum' | 'net' | 'none' // How to consolidate in group accounts
  elimination_rule?: string // Intercompany elimination rules
  reporting_standard?: 'IFRS' | 'IFRS_SME' | 'LOCAL_GAAP' // Applicable reporting standard
}

export interface COATemplate {
  industry: string
  country: string
  currency: string
  vat_rate: string
  accounts: UniversalCOAAccount[]
}

export interface IndustryCustomization {
  main_revenue_account: string
  key_cost_accounts: string[]
  specific_direct_expenses: string[]
  industry_assets: string[]
  regulatory_accounts: string[]
}

export class UniversalCOATemplateGenerator {
  private industryCustomizations: { [key: string]: IndustryCustomization } = {
    salon: {
      main_revenue_account: 'Hair Services Revenue',
      key_cost_accounts: ['Stylist Commissions', 'Product Costs'],
      specific_direct_expenses: ['Staff Salaries Direct', 'Equipment Maintenance'],
      industry_assets: ['Beauty Products Inventory', 'Hair Products Inventory', 'Salon Equipment'],
      regulatory_accounts: ['VAT Payable', 'Trade License Deposits']
    },
    restaurant: {
      main_revenue_account: 'Food Sales Revenue',
      key_cost_accounts: ['Food Costs', 'Beverage Costs', 'Chef Commissions'],
      specific_direct_expenses: ['Kitchen Staff Wages', 'Equipment Maintenance'],
      industry_assets: ['Food Inventory', 'Beverage Inventory', 'Kitchen Equipment'],
      regulatory_accounts: ['VAT Payable', 'Health License Fees']
    },
    healthcare: {
      main_revenue_account: 'Patient Services Revenue',
      key_cost_accounts: ['Medical Supplies', 'Pharmaceutical Costs'],
      specific_direct_expenses: ['Medical Staff Wages', 'Equipment Depreciation'],
      industry_assets: ['Medical Equipment', 'Pharmaceutical Inventory', 'Diagnostic Equipment'],
      regulatory_accounts: ['Professional License Fees', 'Medical Insurance Deposits']
    },
    retail: {
      main_revenue_account: 'Product Sales Revenue',
      key_cost_accounts: ['Cost of Goods Sold', 'Inventory Purchases'],
      specific_direct_expenses: ['Sales Staff Wages', 'Point of Sale Maintenance'],
      industry_assets: ['Merchandise Inventory', 'Store Equipment', 'Display Equipment'],
      regulatory_accounts: ['Trade License', 'Sales Tax Payable']
    },
    manufacturing: {
      main_revenue_account: 'Product Sales Revenue',
      key_cost_accounts: ['Raw Materials', 'Direct Labor', 'Manufacturing Overhead'],
      specific_direct_expenses: ['Production Staff Wages', 'Machine Maintenance'],
      industry_assets: [
        'Raw Materials Inventory',
        'Work in Process',
        'Finished Goods',
        'Manufacturing Equipment'
      ],
      regulatory_accounts: ['Environmental Compliance Fees', 'Safety License Deposits']
    }
  }

  private countryCurrencies: { [key: string]: { currency: string; vat_rate: string } } = {
    AE: { currency: 'AED', vat_rate: '5%' },
    US: { currency: 'USD', vat_rate: '0%' },
    GB: { currency: 'GBP', vat_rate: '20%' },
    IN: { currency: 'INR', vat_rate: '18%' },
    CA: { currency: 'CAD', vat_rate: '13%' },
    AU: { currency: 'AUD', vat_rate: '10%' },
    DE: { currency: 'EUR', vat_rate: '19%' },
    FR: { currency: 'EUR', vat_rate: '20%' },
    SG: { currency: 'SGD', vat_rate: '7%' }
  }

  /**
   * Generate complete COA template for any industry following global numbering structure
   */
  generateUniversalCOA(
    industry: string,
    country: string = 'AE',
    organizationName: string = 'Business'
  ): COATemplate {
    const countryInfo = this.countryCurrencies[country] || this.countryCurrencies['AE']
    const customization =
      this.industryCustomizations[industry] || this.industryCustomizations['salon']

    const accounts: UniversalCOAAccount[] = [
      ...this.generateAssetsSection(industry, country, customization, countryInfo.currency),
      ...this.generateLiabilitiesSection(industry, country, customization, countryInfo.currency),
      ...this.generateEquitySection(industry, country, customization, countryInfo.currency),
      ...this.generateRevenueSection(industry, country, customization, countryInfo.currency),
      ...this.generateCostOfSalesSection(industry, country, customization, countryInfo.currency),
      ...this.generateDirectExpensesSection(industry, country, customization, countryInfo.currency),
      ...this.generateIndirectExpensesSection(
        industry,
        country,
        customization,
        countryInfo.currency
      ),
      ...this.generateTaxesExtraordinarySection(
        industry,
        country,
        customization,
        countryInfo.currency
      ),
      ...this.generateStatisticalSection(industry, country, customization)
    ]

    return {
      industry,
      country,
      currency: countryInfo.currency,
      vat_rate: countryInfo.vat_rate,
      accounts: accounts.sort((a, b) => a.entity_code.localeCompare(b.entity_code))
    }
  }

  private generateAssetsSection(
    industry: string,
    country: string,
    customization: IndustryCustomization,
    currency: string
  ): UniversalCOAAccount[] {
    return [
      // 1000-1999: ASSETS (MANDATORY GLOBAL STRUCTURE WITH IFRS LINEAGE)
      {
        id: 'assets_header',
        entity_code: '1000',
        entity_name: 'ASSETS',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.ASSETS.HEADER.v2`,
        status: 'active',
        account_type: 'assets',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Statement of Financial Position',
        parent_account: '', // Top level
        account_level: 1,
        ifrs_category: 'Assets',
        presentation_order: 1,
        is_header: true,
        rollup_account: '', // Top level
        ifrs_statement: 'SFP',
        ifrs_subcategory: 'Total Assets',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      {
        id: 'current_assets',
        entity_code: '1100',
        entity_name: 'Current Assets',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.CURRENT.ASSETS.v2`,
        status: 'active',
        account_type: 'assets',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Current Assets',
        parent_account: '1000',
        account_level: 2,
        ifrs_category: 'Current Assets',
        presentation_order: 2,
        is_header: true,
        rollup_account: '1000',
        ifrs_statement: 'SFP',
        ifrs_subcategory: 'Total Current Assets',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      {
        id: 'cash_bank',
        entity_code: '1110',
        entity_name: 'Cash and Bank Accounts',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.CASH.BANK.v2`,
        status: 'active',
        account_type: 'assets',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Cash and Cash Equivalents',
        parent_account: '1100',
        account_level: 3,
        ifrs_category: 'Cash and Cash Equivalents',
        presentation_order: 3,
        is_header: false,
        rollup_account: '1100',
        ifrs_statement: 'SFP',
        ifrs_subcategory: 'Cash and Cash Equivalents',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      ...customization.industry_assets.map((asset, index) => ({
        id: `industry_asset_${index + 1}`,
        entity_code: `113${index + 1}`,
        entity_name: asset,
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.ASSET.${asset.replace(/\s+/g, '.').toUpperCase()}.v2`,
        status: 'active',
        account_type: 'assets' as const,
        normal_balance: 'debit' as const,
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Inventories',
        parent_account: '1100',
        account_level: 4,
        ifrs_category: 'Current Assets',
        presentation_order: 10 + index,
        is_header: false,
        rollup_account: '1100',
        ifrs_statement: 'SFP' as const,
        ifrs_subcategory: 'Inventories',
        consolidation_method: 'sum' as const,
        reporting_standard: 'IFRS' as const
      }))
    ]
  }

  private generateLiabilitiesSection(
    industry: string,
    country: string,
    customization: IndustryCustomization,
    currency: string
  ): UniversalCOAAccount[] {
    return [
      // 2000-2999: LIABILITIES (MANDATORY GLOBAL STRUCTURE)
      {
        id: 'liabilities_header',
        entity_code: '2000',
        entity_name: 'LIABILITIES',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.LIABILITIES.HEADER.v2`,
        status: 'active',
        account_type: 'liabilities',
        normal_balance: 'credit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Statement of Financial Position',
        parent_account: '', // Top level
        account_level: 1,
        ifrs_category: 'Liabilities',
        presentation_order: 20,
        is_header: true,
        rollup_account: '', // Top level
        ifrs_statement: 'SFP',
        ifrs_subcategory: 'Total Liabilities',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      {
        id: 'current_liabilities',
        entity_code: '2100',
        entity_name: 'Current Liabilities',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.CURRENT.LIABILITIES.v2`,
        status: 'active',
        account_type: 'liabilities',
        normal_balance: 'credit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Current Liabilities',
        parent_account: '2000',
        account_level: 2,
        ifrs_category: 'Current Liabilities',
        presentation_order: 21,
        is_header: true,
        rollup_account: '2000',
        ifrs_statement: 'SFP',
        ifrs_subcategory: 'Total Current Liabilities',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      ...customization.regulatory_accounts.map((account, index) => ({
        id: `regulatory_liability_${index + 1}`,
        entity_code: `211${index + 1}`,
        entity_name: account,
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.LIABILITY.${account.replace(/\s+/g, '.').toUpperCase()}.v2`,
        status: 'active',
        account_type: 'liabilities' as const,
        normal_balance: 'credit' as const,
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Tax Liabilities',
        parent_account: '2100',
        account_level: 4,
        ifrs_category: 'Current Liabilities',
        presentation_order: 25 + index,
        is_header: false,
        rollup_account: '2100',
        ifrs_statement: 'SFP' as const,
        ifrs_subcategory: 'Tax and Regulatory Liabilities',
        consolidation_method: 'sum' as const,
        reporting_standard: 'IFRS' as const
      }))
    ]
  }

  private generateEquitySection(
    industry: string,
    country: string,
    customization: IndustryCustomization,
    currency: string
  ): UniversalCOAAccount[] {
    return [
      // 3000-3999: EQUITY (MANDATORY GLOBAL STRUCTURE)
      {
        id: 'equity_header',
        entity_code: '3000',
        entity_name: 'EQUITY',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.EQUITY.HEADER.v2`,
        status: 'active',
        account_type: 'equity',
        normal_balance: 'credit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Statement of Financial Position',
        parent_account: '', // Top level
        account_level: 1,
        ifrs_category: 'Equity',
        presentation_order: 30,
        is_header: true,
        rollup_account: '', // Top level
        ifrs_statement: 'SFP',
        ifrs_subcategory: 'Total Equity',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      {
        id: 'owner_equity',
        entity_code: '3100',
        entity_name: 'Owner Equity',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.OWNER.EQUITY.v2`,
        status: 'active',
        account_type: 'equity',
        normal_balance: 'credit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Share Capital',
        parent_account: '3000',
        account_level: 3,
        ifrs_category: 'Equity',
        presentation_order: 31,
        is_header: false,
        rollup_account: '3000',
        ifrs_statement: 'SFP',
        ifrs_subcategory: 'Contributed Capital',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      }
    ]
  }

  private generateRevenueSection(
    industry: string,
    country: string,
    customization: IndustryCustomization,
    currency: string
  ): UniversalCOAAccount[] {
    return [
      // 4000-4999: REVENUE (MANDATORY GLOBAL STRUCTURE)
      {
        id: 'revenue_header',
        entity_code: '4000',
        entity_name: 'REVENUE',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.REVENUE.HEADER.v2`,
        status: 'active',
        account_type: 'revenue',
        normal_balance: 'credit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Statement of Profit or Loss',
        parent_account: '', // Top level
        account_level: 1,
        ifrs_category: 'Revenue',
        presentation_order: 40,
        is_header: true,
        rollup_account: '', // Top level
        ifrs_statement: 'SPL',
        ifrs_subcategory: 'Total Revenue',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      {
        id: 'main_revenue',
        entity_code: '4100',
        entity_name: customization.main_revenue_account,
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.REVENUE.MAIN.v2`,
        status: 'active',
        account_type: 'revenue',
        normal_balance: 'credit',
        vat_applicable: 'true',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Revenue from Contracts with Customers',
        parent_account: '4000',
        account_level: 3,
        ifrs_category: 'Revenue',
        presentation_order: 41,
        is_header: false,
        rollup_account: '4000',
        ifrs_statement: 'SPL',
        ifrs_subcategory: 'Operating Revenue',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      }
    ]
  }

  private generateCostOfSalesSection(
    industry: string,
    country: string,
    customization: IndustryCustomization,
    currency: string
  ): UniversalCOAAccount[] {
    return [
      // 5000-5999: COST OF SALES (MANDATORY GLOBAL STRUCTURE)
      {
        id: 'cost_of_sales_header',
        entity_code: '5000',
        entity_name: 'COST OF SALES',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.COST.OF.SALES.HEADER.v2`,
        status: 'active',
        account_type: 'cost_of_sales',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Statement of Profit or Loss',
        parent_account: '', // Top level
        account_level: 1,
        ifrs_category: 'Cost of Sales',
        presentation_order: 50,
        is_header: true,
        rollup_account: '', // Top level
        ifrs_statement: 'SPL',
        ifrs_subcategory: 'Total Cost of Sales',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      ...customization.key_cost_accounts.map((account, index) => ({
        id: `cost_account_${index + 1}`,
        entity_code: `510${index + 1}`,
        entity_name: account,
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.COST.${account.replace(/\s+/g, '.').toUpperCase()}.v2`,
        status: 'active',
        account_type: 'cost_of_sales' as const,
        normal_balance: 'debit' as const,
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Cost of Sales',
        parent_account: '5000',
        account_level: 3,
        ifrs_category: 'Cost of Sales',
        presentation_order: 51 + index,
        is_header: false,
        rollup_account: '5000',
        ifrs_statement: 'SPL' as const,
        ifrs_subcategory: 'Direct Costs',
        consolidation_method: 'sum' as const,
        reporting_standard: 'IFRS' as const
      }))
    ]
  }

  private generateDirectExpensesSection(
    industry: string,
    country: string,
    customization: IndustryCustomization,
    currency: string
  ): UniversalCOAAccount[] {
    return [
      // 6000-6999: DIRECT EXPENSES (MANDATORY GLOBAL STRUCTURE)
      {
        id: 'direct_expenses_header',
        entity_code: '6000',
        entity_name: 'DIRECT EXPENSES',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.DIRECT.EXPENSES.HEADER.v2`,
        status: 'active',
        account_type: 'direct_expenses',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Statement of Profit or Loss',
        parent_account: '', // Top level
        account_level: 1,
        ifrs_category: 'Direct Expenses',
        presentation_order: 60,
        is_header: true,
        rollup_account: '', // Top level
        ifrs_statement: 'SPL',
        ifrs_subcategory: 'Total Direct Expenses',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      ...customization.specific_direct_expenses.map((account, index) => ({
        id: `direct_expense_${index + 1}`,
        entity_code: `610${index + 1}`,
        entity_name: account,
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.DIRECT.${account.replace(/\s+/g, '.').toUpperCase()}.v2`,
        status: 'active',
        account_type: 'direct_expenses' as const,
        normal_balance: 'debit' as const,
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Direct Operating Expenses',
        parent_account: '6000',
        account_level: 3,
        ifrs_category: 'Direct Expenses',
        presentation_order: 61 + index,
        is_header: false,
        rollup_account: '6000',
        ifrs_statement: 'SPL' as const,
        ifrs_subcategory: 'Operating Expenses',
        consolidation_method: 'sum' as const,
        reporting_standard: 'IFRS' as const
      }))
    ]
  }

  private generateIndirectExpensesSection(
    industry: string,
    country: string,
    customization: IndustryCustomization,
    currency: string
  ): UniversalCOAAccount[] {
    return [
      // 7000-7999: INDIRECT EXPENSES (MANDATORY GLOBAL STRUCTURE)
      {
        id: 'indirect_expenses_header',
        entity_code: '7000',
        entity_name: 'INDIRECT EXPENSES',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.INDIRECT.EXPENSES.HEADER.v2`,
        status: 'active',
        account_type: 'indirect_expenses',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Statement of Profit or Loss',
        parent_account: '', // Top level
        account_level: 1,
        ifrs_category: 'Indirect Expenses',
        presentation_order: 70,
        is_header: true,
        rollup_account: '', // Top level
        ifrs_statement: 'SPL',
        ifrs_subcategory: 'Total Indirect Expenses',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      {
        id: 'admin_expenses',
        entity_code: '7100',
        entity_name: 'Administrative Expenses',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.INDIRECT.ADMIN.v2`,
        status: 'active',
        account_type: 'indirect_expenses',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Administrative Expenses',
        parent_account: '7000',
        account_level: 3,
        ifrs_category: 'Indirect Expenses',
        presentation_order: 71,
        is_header: false,
        rollup_account: '7000',
        ifrs_statement: 'SPL',
        ifrs_subcategory: 'Administrative and General',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      {
        id: 'rent_expense',
        entity_code: '7110',
        entity_name: 'Rent Expense',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.INDIRECT.RENT.v2`,
        status: 'active',
        account_type: 'indirect_expenses',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Administrative Expenses',
        parent_account: '7100',
        account_level: 4,
        ifrs_category: 'Indirect Expenses',
        presentation_order: 72,
        is_header: false,
        rollup_account: '7100',
        ifrs_statement: 'SPL',
        ifrs_subcategory: 'Occupancy Costs',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      {
        id: 'utilities_expense',
        entity_code: '7120',
        entity_name: 'Utilities Expense',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.INDIRECT.UTILITIES.v2`,
        status: 'active',
        account_type: 'indirect_expenses',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Administrative Expenses',
        parent_account: '7100',
        account_level: 4,
        ifrs_category: 'Indirect Expenses',
        presentation_order: 73,
        is_header: false,
        rollup_account: '7100',
        ifrs_statement: 'SPL',
        ifrs_subcategory: 'Utilities and Communications',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      {
        id: 'marketing_expense',
        entity_code: '7200',
        entity_name: 'Marketing & Advertising',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.INDIRECT.MARKETING.v2`,
        status: 'active',
        account_type: 'indirect_expenses',
        normal_balance: 'debit',
        vat_applicable: 'true',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Selling and Marketing Expenses',
        parent_account: '7000',
        account_level: 3,
        ifrs_category: 'Indirect Expenses',
        presentation_order: 74,
        is_header: false,
        rollup_account: '7000',
        ifrs_statement: 'SPL',
        ifrs_subcategory: 'Marketing and Promotion',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      }
    ]
  }

  private generateTaxesExtraordinarySection(
    industry: string,
    country: string,
    customization: IndustryCustomization,
    currency: string
  ): UniversalCOAAccount[] {
    return [
      // 8000-8999: TAXES & EXTRAORDINARY (MANDATORY GLOBAL STRUCTURE)
      {
        id: 'taxes_extraordinary_header',
        entity_code: '8000',
        entity_name: 'TAXES & EXTRAORDINARY',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.TAXES.EXTRAORDINARY.HEADER.v2`,
        status: 'active',
        account_type: 'taxes_extraordinary',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Statement of Profit or Loss',
        parent_account: '', // Top level
        account_level: 1,
        ifrs_category: 'Taxes and Extraordinary',
        presentation_order: 80,
        is_header: true,
        rollup_account: '', // Top level
        ifrs_statement: 'SPL',
        ifrs_subcategory: 'Total Taxes and Extraordinary',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      {
        id: 'income_tax',
        entity_code: '8100',
        entity_name: 'Income Tax Expense',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.TAXES.INCOME.v2`,
        status: 'active',
        account_type: 'taxes_extraordinary',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Tax Expense',
        parent_account: '8000',
        account_level: 3,
        ifrs_category: 'Taxes and Extraordinary',
        presentation_order: 81,
        is_header: false,
        rollup_account: '8000',
        ifrs_statement: 'SPL',
        ifrs_subcategory: 'Income Tax',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      },
      {
        id: 'extraordinary_items',
        entity_code: '8200',
        entity_name: 'Extraordinary Items',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.EXTRAORDINARY.ITEMS.v2`,
        status: 'active',
        account_type: 'taxes_extraordinary',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: currency,
        // IFRS Lineage
        ifrs_classification: 'Extraordinary Items',
        parent_account: '8000',
        account_level: 3,
        ifrs_category: 'Taxes and Extraordinary',
        presentation_order: 82,
        is_header: false,
        rollup_account: '8000',
        ifrs_statement: 'SPL',
        ifrs_subcategory: 'Non-Recurring Items',
        consolidation_method: 'sum',
        reporting_standard: 'IFRS'
      }
    ]
  }

  private generateStatisticalSection(
    industry: string,
    country: string,
    customization: IndustryCustomization
  ): UniversalCOAAccount[] {
    return [
      // 9000-9999: STATISTICAL ACCOUNTS (MANDATORY GLOBAL STRUCTURE)
      {
        id: 'statistical_header',
        entity_code: '9000',
        entity_name: 'STATISTICAL ACCOUNTS',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.STATISTICAL.HEADER.v2`,
        status: 'active',
        account_type: 'statistical',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: 'UNITS',
        // IFRS Lineage
        ifrs_classification: 'Memorandum Accounts',
        parent_account: '', // Top level
        account_level: 1,
        ifrs_category: 'Statistical Information',
        presentation_order: 90,
        is_header: true,
        rollup_account: '', // Top level
        ifrs_statement: 'NOTES',
        ifrs_subcategory: 'Non-Financial Information',
        consolidation_method: 'none',
        reporting_standard: 'IFRS'
      },
      {
        id: 'customer_count',
        entity_code: '9100',
        entity_name: 'Customer Count',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.STATISTICAL.CUSTOMERS.v2`,
        status: 'active',
        account_type: 'statistical',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: 'UNITS',
        // IFRS Lineage
        ifrs_classification: 'Statistical Information',
        parent_account: '9000',
        account_level: 3,
        ifrs_category: 'Statistical Information',
        presentation_order: 91,
        is_header: false,
        rollup_account: '9000',
        ifrs_statement: 'NOTES',
        ifrs_subcategory: 'Customer Metrics',
        consolidation_method: 'none',
        reporting_standard: 'IFRS'
      },
      {
        id: 'service_hours',
        entity_code: '9200',
        entity_name: 'Service Hours Delivered',
        smart_code: `HERA.${country}.${industry.toUpperCase()}.GL.STATISTICAL.HOURS.v2`,
        status: 'active',
        account_type: 'statistical',
        normal_balance: 'debit',
        vat_applicable: 'false',
        currency: 'HOURS',
        // IFRS Lineage
        ifrs_classification: 'Statistical Information',
        parent_account: '9000',
        account_level: 3,
        ifrs_category: 'Statistical Information',
        presentation_order: 92,
        is_header: false,
        rollup_account: '9000',
        ifrs_statement: 'NOTES',
        ifrs_subcategory: 'Operational Metrics',
        consolidation_method: 'none',
        reporting_standard: 'IFRS'
      }
    ]
  }

  /**
   * Generate TypeScript code for industry-specific COA page
   */
  generateCOAPageCode(
    industry: string,
    country: string = 'AE',
    organizationName: string = 'Business'
  ): string {
    const template = this.generateUniversalCOA(industry, country, organizationName)
    const accounts = template.accounts

    return `// Auto-generated Universal COA for ${industry} industry in ${country}
// Global numbering structure: 5-6-7-8-9 classification enforced
// Smart Code: HERA.${country}.${industry.toUpperCase()}.COA.UNIVERSAL.v2

const initializeDefault${this.capitalizeFirst(industry)}COA = (): GLAccount[] => {
  return ${JSON.stringify(accounts, null, 4).replace(/"([^"]+)":/g, '$1:')}
}`
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /**
   * Validate account follows global numbering structure
   */
  validateAccountStructure(account: UniversalCOAAccount): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const firstDigit = account.entity_code.charAt(0)

    const expectedTypes: { [key: string]: string } = {
      '1': 'assets',
      '2': 'liabilities',
      '3': 'equity',
      '4': 'revenue',
      '5': 'cost_of_sales',
      '6': 'direct_expenses',
      '7': 'indirect_expenses',
      '8': 'taxes_extraordinary',
      '9': 'statistical'
    }

    if (expectedTypes[firstDigit] !== account.account_type) {
      errors.push(
        `Account ${account.entity_code} should have type '${expectedTypes[firstDigit]}' but has '${account.account_type}'`
      )
    }

    const debitAccounts = [
      'assets',
      'cost_of_sales',
      'direct_expenses',
      'indirect_expenses',
      'taxes_extraordinary',
      'statistical'
    ]
    const expectedBalance = debitAccounts.includes(account.account_type) ? 'debit' : 'credit'

    if (account.normal_balance !== expectedBalance) {
      errors.push(
        `Account ${account.entity_code} should have normal balance '${expectedBalance}' but has '${account.normal_balance}'`
      )
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export default UniversalCOATemplateGenerator
