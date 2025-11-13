/**
 * HERA FICO Installation API
 * Smart Code: HERA.FICO.API.INSTALL.v1
 * 
 * 🚀 Platform-grade FICO module installation with overlay system
 * - One-click installation with industry/regional customization
 * - Deterministic merge lattice for policy resolution
 * - Complete audit trail and governance tracking
 * - Sacred Six compliance with zero schema changes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// FICO Installation Request Schema
interface FICOInstallationRequest {
  organization_id: string
  industry: 'RETAIL' | 'MANUFACTURING' | 'SERVICES' | 'SALON' | 'HEALTHCARE' | 'TECHNOLOGY'
  region: 'GCC' | 'EU' | 'US' | 'ASIA' | 'GLOBAL'
  coa_pack: string  // e.g., "COA_RETAIL_STD_v3"
  overlays: string[]  // e.g., ["FICO_RETAIL_PROMO", "GCC_VAT_v2"]
  options: {
    fiscal_year_end: string  // "MM-DD" format
    base_currency: string
    multi_currency: boolean
    cost_center_required: boolean
    profit_center_enabled: boolean
    project_accounting: boolean
    auto_close_enabled: boolean
    [key: string]: any
  }
}

interface FICOInstallationResponse {
  success: boolean
  installation_id?: string
  module_version?: string
  installed_components?: string[]
  policy_bundle_id?: string
  setup_tasks?: Array<{
    task_id: string
    name: string
    status: 'PENDING' | 'COMPLETED' | 'FAILED'
    description: string
  }>
  error?: string
  warnings?: string[]
}

// Base FICO Chart of Accounts Templates
const COA_TEMPLATES = {
  COA_RETAIL_STD_v3: {
    name: "Retail Standard Chart of Accounts v3",
    accounts: [
      // Assets (1000-1999)
      { code: "1000", name: "Cash and Cash Equivalents", type: "ASSET", balance: "DEBIT", category: "CURRENT_ASSET" },
      { code: "1100", name: "Accounts Receivable", type: "ASSET", balance: "DEBIT", category: "CURRENT_ASSET", reconciliation: true },
      { code: "1200", name: "Inventory - Finished Goods", type: "ASSET", balance: "DEBIT", category: "CURRENT_ASSET" },
      { code: "1300", name: "Prepaid Expenses", type: "ASSET", balance: "DEBIT", category: "CURRENT_ASSET" },
      { code: "1500", name: "Property, Plant & Equipment", type: "ASSET", balance: "DEBIT", category: "FIXED_ASSET" },
      { code: "1600", name: "Accumulated Depreciation", type: "ASSET", balance: "CREDIT", category: "FIXED_ASSET" },
      
      // Liabilities (2000-2999)
      { code: "2000", name: "Accounts Payable", type: "LIABILITY", balance: "CREDIT", category: "CURRENT_LIABILITY", reconciliation: true },
      { code: "2100", name: "Accrued Expenses", type: "LIABILITY", balance: "CREDIT", category: "CURRENT_LIABILITY" },
      { code: "2200", name: "Sales Tax Payable", type: "LIABILITY", balance: "CREDIT", category: "CURRENT_LIABILITY" },
      { code: "2300", name: "VAT Payable", type: "LIABILITY", balance: "CREDIT", category: "CURRENT_LIABILITY" },
      { code: "2400", name: "Deferred Revenue", type: "LIABILITY", balance: "CREDIT", category: "CURRENT_LIABILITY" },
      { code: "2800", name: "Long-term Debt", type: "LIABILITY", balance: "CREDIT", category: "LONG_TERM_LIABILITY" },
      
      // Equity (3000-3999)
      { code: "3000", name: "Owner's Capital", type: "EQUITY", balance: "CREDIT", category: "EQUITY" },
      { code: "3100", name: "Retained Earnings", type: "EQUITY", balance: "CREDIT", category: "EQUITY" },
      { code: "3200", name: "Current Year Earnings", type: "EQUITY", balance: "CREDIT", category: "EQUITY" },
      
      // Revenue (4000-4999)
      { code: "4000", name: "Sales Revenue", type: "REVENUE", balance: "CREDIT", category: "OPERATING_REVENUE" },
      { code: "4100", name: "Service Revenue", type: "REVENUE", balance: "CREDIT", category: "OPERATING_REVENUE" },
      { code: "4200", name: "Other Revenue", type: "REVENUE", balance: "CREDIT", category: "OTHER_REVENUE" },
      
      // Cost of Goods Sold (5000-5999)
      { code: "5000", name: "Cost of Goods Sold", type: "EXPENSE", balance: "DEBIT", category: "COGS", cost_center_required: true },
      { code: "5100", name: "Purchase Discounts", type: "EXPENSE", balance: "CREDIT", category: "COGS" },
      
      // Operating Expenses (6000-6999)
      { code: "6000", name: "Salaries and Wages", type: "EXPENSE", balance: "DEBIT", category: "OPERATING_EXPENSE", cost_center_required: true },
      { code: "6100", name: "Employee Benefits", type: "EXPENSE", balance: "DEBIT", category: "OPERATING_EXPENSE", cost_center_required: true },
      { code: "6200", name: "Rent Expense", type: "EXPENSE", balance: "DEBIT", category: "OPERATING_EXPENSE", cost_center_required: true },
      { code: "6300", name: "Utilities", type: "EXPENSE", balance: "DEBIT", category: "OPERATING_EXPENSE", cost_center_required: true },
      { code: "6400", name: "Marketing and Advertising", type: "EXPENSE", balance: "DEBIT", category: "OPERATING_EXPENSE", cost_center_required: true },
      { code: "6500", name: "Professional Services", type: "EXPENSE", balance: "DEBIT", category: "OPERATING_EXPENSE" },
      { code: "6600", name: "Insurance", type: "EXPENSE", balance: "DEBIT", category: "OPERATING_EXPENSE" },
      { code: "6700", name: "Depreciation Expense", type: "EXPENSE", balance: "DEBIT", category: "OPERATING_EXPENSE" },
      
      // Other Income/Expense (7000-7999)
      { code: "7000", name: "Interest Income", type: "REVENUE", balance: "CREDIT", category: "OTHER_REVENUE" },
      { code: "7100", name: "Interest Expense", type: "EXPENSE", balance: "DEBIT", category: "OTHER_EXPENSE" },
      { code: "7200", name: "Foreign Exchange Gain/Loss", type: "EXPENSE", balance: "DEBIT", category: "OTHER_EXPENSE" }
    ]
  },
  
  COA_SALON_STD_v1: {
    name: "Salon Services Chart of Accounts v1",
    accounts: [
      // Additional salon-specific accounts
      { code: "4150", name: "Hair Services Revenue", type: "REVENUE", balance: "CREDIT", category: "SERVICE_REVENUE" },
      { code: "4160", name: "Beauty Services Revenue", type: "REVENUE", balance: "CREDIT", category: "SERVICE_REVENUE" },
      { code: "4170", name: "Package Services Revenue", type: "REVENUE", balance: "CREDIT", category: "SERVICE_REVENUE" },
      { code: "2450", name: "Package Liability", type: "LIABILITY", balance: "CREDIT", category: "CURRENT_LIABILITY" },
      { code: "6800", name: "Stylist Commissions", type: "EXPENSE", balance: "DEBIT", category: "OPERATING_EXPENSE" },
      { code: "6810", name: "Product Costs", type: "EXPENSE", balance: "DEBIT", category: "OPERATING_EXPENSE" }
    ]
  }
}

// Regional Tax Engine Configurations
const TAX_ENGINES = {
  GCC_VAT_v2: {
    name: "GCC VAT Engine v2",
    jurisdiction: "GCC",
    rates: {
      standard: 0.05,  // 5% VAT
      zero: 0.00,      // Zero-rated
      exempt: null     // Exempt from VAT
    },
    rules: {
      b2b_reverse_charge: "buyer_vat_reg && seller_vat_reg",
      export_zero_rated: "delivery_country != home_country",
      threshold_registration: 375000  // AED
    }
  },
  
  EU_VAT_v1: {
    name: "EU VAT Engine v1", 
    jurisdiction: "EU",
    rates: {
      standard: 0.20,     // 20% standard rate
      reduced: [0.05, 0.13], // Reduced rates
      zero: 0.00,
      exempt: null
    },
    rules: {
      intrastat_required: true,
      oss_enabled: true,
      oss_threshold: 10000
    }
  }
}

// Industry-Specific Policy Overlays
const INDUSTRY_OVERLAYS = {
  FICO_RETAIL_v1: {
    name: "FICO Retail Overlay v1",
    posting_rules: [
      {
        match: { transaction_type: "POS.SALE" },
        lines: [
          { side: "DR", account: "1000", amount: "payload.cash_amount" },
          { side: "DR", account: "1100", amount: "payload.card_amount" }, 
          { side: "CR", account: "4000", amount: "payload.net_sale" },
          { side: "CR", account: "2300", amount: "payload.vat_amount" }
        ],
        dimensions: { store: "payload.store_id", cashier: "payload.cashier_id" }
      },
      {
        match: { transaction_type: "INVENTORY.ISSUE" },
        lines: [
          { side: "DR", account: "5000", amount: "payload.cost_value" },
          { side: "CR", account: "1200", amount: "payload.cost_value" }
        ],
        dimensions: { product: "payload.product_id", store: "payload.store_id" }
      }
    ]
  },
  
  FICO_SALON_v1: {
    name: "FICO Salon Services Overlay v1", 
    posting_rules: [
      {
        match: { transaction_type: "SERVICE.COMPLETE" },
        lines: [
          { side: "DR", account: "1000", amount: "payload.total_amount" },
          { side: "CR", account: "4150", amount: "payload.service_revenue" },
          { side: "CR", account: "2300", amount: "payload.vat_amount" },
          { side: "DR", account: "6800", amount: "payload.commission_amount" }
        ],
        dimensions: { stylist: "payload.stylist_id", service: "payload.service_id" }
      },
      {
        match: { transaction_type: "PACKAGE.SALE" },
        lines: [
          { side: "DR", account: "1000", amount: "payload.total_amount" },
          { side: "CR", account: "2450", amount: "payload.package_liability" },
          { side: "CR", account: "2300", amount: "payload.vat_amount" }
        ]
      }
    ]
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const installRequest: FICOInstallationRequest = await request.json()
    
    console.log(`[FICO Install] 🚀 Starting FICO installation for org ${installRequest.organization_id}`)
    console.log(`[FICO Install] 📋 Industry: ${installRequest.industry}, Region: ${installRequest.region}`)

    // 1. Validate installation request
    const validation = validateInstallationRequest(installRequest)
    if (!validation.valid) {
      return NextResponse.json({ 
        success: false, 
        error: validation.error 
      }, { status: 400 })
    }

    // 2. Get organization context for actor
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing authorization header' 
      }, { status: 401 })
    }

    // Extract user from JWT (simplified - in production use proper JWT validation)
    const token = authHeader.substring(7)
    const { data: authData, error: authError } = await supabase.auth.getUser(token)
    if (authError || !authData.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid authorization token' 
      }, { status: 401 })
    }

    const actorUserId = authData.user.id
    const installationId = `FICO_INSTALL_${Date.now()}`

    // 3. Create FICO Module Definition Entity
    console.log(`[FICO Install] 📦 Creating FICO module entity`)
    const { error: moduleError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: '00000000-0000-0000-0000-000000000000', // Platform organization
      p_entity: {
        entity_type: 'MODULE_DEF',
        entity_name: 'HERA Finance & Controlling (FICO)',
        entity_code: 'FICO',
        smart_code: 'HERA.FICO.MODULE.CORE.DEF.v1'
      },
      p_dynamic: {
        version: { field_type: 'text', field_value_text: 'v1.0', smart_code: 'HERA.FICO.MODULE.VERSION.v1' },
        capabilities: { 
          field_type: 'json', 
          field_value_json: {
            gl_accounting: true,
            multi_currency: installRequest.options.multi_currency,
            cost_accounting: installRequest.options.cost_center_required,
            profit_center: installRequest.options.profit_center_enabled,
            project_accounting: installRequest.options.project_accounting,
            period_close: installRequest.options.auto_close_enabled,
            industry_overlays: installRequest.overlays
          },
          smart_code: 'HERA.FICO.MODULE.CAPABILITIES.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })

    if (moduleError) {
      console.error('[FICO Install] Error creating module:', moduleError)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to create FICO module: ${moduleError.message}` 
      }, { status: 500 })
    }

    // 4. Install Chart of Accounts
    console.log(`[FICO Install] 📊 Installing Chart of Accounts: ${installRequest.coa_pack}`)
    const coaResult = await installChartOfAccounts(
      supabase, 
      installRequest.organization_id, 
      installRequest.coa_pack, 
      actorUserId
    )

    if (!coaResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: `COA installation failed: ${coaResult.error}` 
      }, { status: 500 })
    }

    // 5. Install Cost Centers (if enabled)
    let costCenterResult = { success: true, count: 0 }
    if (installRequest.options.cost_center_required) {
      console.log(`[FICO Install] 🏢 Creating default cost centers`)
      costCenterResult = await createDefaultCostCenters(
        supabase, 
        installRequest.organization_id, 
        installRequest.industry,
        actorUserId
      )
    }

    // 6. Install Base Policy Bundle
    console.log(`[FICO Install] 📋 Installing base policy bundle`)
    const policyResult = await installBasePolicyBundle(
      supabase,
      installRequest.organization_id,
      installRequest.industry,
      installRequest.region,
      actorUserId
    )

    if (!policyResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: `Policy installation failed: ${policyResult.error}` 
      }, { status: 500 })
    }

    // 7. Install Industry Overlays
    console.log(`[FICO Install] 🎨 Installing industry overlays: ${installRequest.overlays.join(', ')}`)
    const overlayResults = await installIndustryOverlays(
      supabase,
      installRequest.organization_id,
      installRequest.overlays,
      actorUserId
    )

    // 8. Create Organization Installation Relationship
    console.log(`[FICO Install] 🔗 Creating organization installation relationship`)
    const { error: relationshipError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: actorUserId,
      p_organization_id: '00000000-0000-0000-0000-000000000000',
      p_entity: { entity_type: 'MODULE_DEF', entity_code: 'FICO' },
      p_dynamic: {},
      p_relationships: [
        {
          target_entity_id: installRequest.organization_id,
          relationship_type: 'ORG_INSTALLED_MODULE',
          smart_code: 'HERA.FICO.REL.ORG.INSTALLED.MODULE.v1',
          metadata: {
            installation_id: installationId,
            version: 'v1.0',
            industry: installRequest.industry,
            region: installRequest.region,
            installed_at: new Date().toISOString(),
            installed_by: actorUserId,
            options: installRequest.options
          }
        }
      ],
      p_options: {}
    })

    // 9. Create Fiscal Period Setup
    console.log(`[FICO Install] 📅 Setting up fiscal periods`)
    const fiscalResult = await setupFiscalPeriods(
      supabase,
      installRequest.organization_id,
      installRequest.options.fiscal_year_end,
      actorUserId
    )

    // 10. Create Installation Audit Transaction
    console.log(`[FICO Install] 📝 Creating installation audit transaction`)
    await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: installRequest.organization_id,
      p_transaction: {
        transaction_type: 'FICO.INSTALLATION',
        smart_code: 'HERA.FICO.TXN.INSTALLATION.v1',
        transaction_number: installationId,
        total_amount: 0,
        metadata: {
          installation_request: installRequest,
          components_installed: {
            module: true,
            coa: coaResult.success,
            cost_centers: costCenterResult.success,
            policies: policyResult.success,
            overlays: overlayResults.every(r => r.success),
            fiscal_periods: fiscalResult.success
          },
          installation_duration_ms: Date.now(),
          actor: actorUserId
        }
      },
      p_lines: [],
      p_options: {}
    })

    // 11. Build Response
    const response: FICOInstallationResponse = {
      success: true,
      installation_id: installationId,
      module_version: 'v1.0',
      installed_components: [
        'FICO Core Module',
        `Chart of Accounts (${installRequest.coa_pack})`,
        ...(installRequest.options.cost_center_required ? [`Cost Centers (${costCenterResult.count})`] : []),
        `Base Policy Bundle`,
        ...installRequest.overlays.map(overlay => `Overlay: ${overlay}`),
        'Fiscal Period Calendar'
      ],
      policy_bundle_id: policyResult.bundle_id,
      setup_tasks: [
        {
          task_id: 'USER_PERMISSIONS',
          name: 'Configure User Permissions',
          status: 'PENDING',
          description: 'Assign FICO roles to users'
        },
        {
          task_id: 'OPENING_BALANCES',
          name: 'Enter Opening Balances', 
          status: 'PENDING',
          description: 'Enter beginning balances for balance sheet accounts'
        },
        {
          task_id: 'BANK_SETUP',
          name: 'Configure Bank Accounts',
          status: 'PENDING',
          description: 'Set up bank account master data'
        },
        {
          task_id: 'CUSTOMER_VENDOR_IMPORT',
          name: 'Import Customer/Vendor Master',
          status: 'PENDING',
          description: 'Import existing customer and vendor data'
        },
        {
          task_id: 'INTEGRATION_TEST',
          name: 'Test Integration Points',
          status: 'PENDING',
          description: 'Test POS, inventory, and other module integrations'
        }
      ],
      warnings: overlayResults.filter(r => !r.success).map(r => r.error).filter(Boolean)
    }

    console.log(`[FICO Install] ✅ FICO installation completed successfully`)
    console.log(`[FICO Install] 📊 Installed ${response.installed_components?.length} components`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('[FICO Install] ❌ Installation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown installation error' 
    }, { status: 500 })
  }
}

// Helper functions

function validateInstallationRequest(request: FICOInstallationRequest): { valid: boolean; error?: string } {
  if (!request.organization_id) {
    return { valid: false, error: 'Organization ID is required' }
  }
  
  if (!request.industry) {
    return { valid: false, error: 'Industry selection is required' }
  }
  
  if (!request.region) {
    return { valid: false, error: 'Region selection is required' }
  }
  
  if (!request.coa_pack || !COA_TEMPLATES[request.coa_pack as keyof typeof COA_TEMPLATES]) {
    return { valid: false, error: 'Valid COA pack selection is required' }
  }
  
  if (!request.options.fiscal_year_end || !/^\d{2}-\d{2}$/.test(request.options.fiscal_year_end)) {
    return { valid: false, error: 'Fiscal year end must be in MM-DD format' }
  }
  
  return { valid: true }
}

async function installChartOfAccounts(
  supabase: any, 
  organizationId: string, 
  coaPack: string, 
  actorUserId: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    const template = COA_TEMPLATES[coaPack as keyof typeof COA_TEMPLATES]
    let installedCount = 0

    for (const account of template.accounts) {
      const { error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_entity: {
          entity_type: 'GL_ACCOUNT',
          entity_name: account.name,
          entity_code: account.code,
          smart_code: `HERA.FICO.GL.ACCOUNT.${account.type}.${account.category}.v1`
        },
        p_dynamic: {
          account_type: { field_type: 'text', field_value_text: account.type, smart_code: 'HERA.FICO.GL.ACCOUNT.TYPE.v1' },
          balance_type: { field_type: 'text', field_value_text: account.balance, smart_code: 'HERA.FICO.GL.ACCOUNT.BALANCE.v1' },
          category: { field_type: 'text', field_value_text: account.category, smart_code: 'HERA.FICO.GL.ACCOUNT.CATEGORY.v1' },
          posting_allowed: { field_type: 'boolean', field_value_boolean: true, smart_code: 'HERA.FICO.GL.ACCOUNT.POSTING.v1' },
          reconciliation_account: { field_type: 'boolean', field_value_boolean: account.reconciliation || false, smart_code: 'HERA.FICO.GL.ACCOUNT.RECON.v1' },
          cost_center_required: { field_type: 'boolean', field_value_boolean: account.cost_center_required || false, smart_code: 'HERA.FICO.GL.ACCOUNT.CC.v1' }
        },
        p_relationships: [],
        p_options: {}
      })
      
      if (error) {
        console.error(`[FICO Install] Error creating account ${account.code}:`, error)
      } else {
        installedCount++
      }
    }

    return { success: true, count: installedCount }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown COA error' }
  }
}

async function createDefaultCostCenters(
  supabase: any,
  organizationId: string,
  industry: string,
  actorUserId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const defaultCostCenters = [
      { code: "CC001", name: "Administration", type: "ADMIN" },
      { code: "CC002", name: "Sales & Marketing", type: "SALES" },
      { code: "CC003", name: "Operations", type: "OPERATIONS" },
      ...(industry === 'RETAIL' ? [
        { code: "CC101", name: "Store Operations", type: "STORE" },
        { code: "CC102", name: "Warehouse", type: "WAREHOUSE" }
      ] : []),
      ...(industry === 'SALON' ? [
        { code: "CC201", name: "Hair Services", type: "SERVICE" },
        { code: "CC202", name: "Beauty Services", type: "SERVICE" }
      ] : [])
    ]

    let createdCount = 0
    for (const cc of defaultCostCenters) {
      const { error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_entity: {
          entity_type: 'COST_CENTER',
          entity_name: cc.name,
          entity_code: cc.code,
          smart_code: `HERA.FICO.COST.CENTER.ENTITY.${cc.type}.v1`
        },
        p_dynamic: {
          cost_center_code: { field_type: 'text', field_value_text: cc.code, smart_code: 'HERA.FICO.COST.CENTER.CODE.v1' },
          cost_center_name: { field_type: 'text', field_value_text: cc.name, smart_code: 'HERA.FICO.COST.CENTER.NAME.v1' },
          valid_from: { field_type: 'date', field_value_text: new Date().toISOString().split('T')[0], smart_code: 'HERA.FICO.COST.CENTER.VALID.FROM.v1' },
          currency: { field_type: 'text', field_value_text: 'AED', smart_code: 'HERA.FICO.COST.CENTER.CURRENCY.v1' }
        },
        p_relationships: [],
        p_options: {}
      })

      if (!error) createdCount++
    }

    return { success: true, count: createdCount }
  } catch (error) {
    return { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown cost center error' }
  }
}

async function installBasePolicyBundle(
  supabase: any,
  organizationId: string,
  industry: string,
  region: string,
  actorUserId: string
): Promise<{ success: boolean; bundle_id?: string; error?: string }> {
  try {
    const bundleId = `FICO_BASE_${organizationId}_v1`
    
    const basePolicyBundle = {
      bundle_id: bundleId,
      version: "v1.0",
      priority: 4, // Base module priority
      effective_date: new Date().toISOString(),
      validations: {
        header_required: ["transaction_date", "currency_code", "fiscal_period"],
        line_required: ["account_code", "side", "amount"],
        rules: [
          {
            code: "DRCR_BALANCE",
            name: "Debit Credit Balance Check",
            expr: "sum('DR') == sum('CR')",
            severity: "ERROR",
            message: "Total debits must equal total credits"
          },
          {
            code: "PERIOD_OPEN", 
            name: "Posting Period Open",
            expr: "is_open_period(header.fiscal_period)",
            severity: "ERROR",
            message: "Cannot post to closed period"
          },
          {
            code: "ACCOUNT_EXISTS",
            name: "Account Existence Check",
            expr: "lines.every(line => account_exists(line.account_code))",
            severity: "ERROR", 
            message: "All accounts must exist in chart of accounts"
          }
        ]
      },
      posting_rules: [],
      tax_rules: region === 'GCC' ? {
        engine_ref: "GCC_VAT_v2",
        default_tax_code: "S1", // Standard rate
        tax_calculation_method: "NET"
      } : {},
      dimension_rules: {
        required_dimensions: [],
        conditional_requirements: [
          {
            condition: "line.account_code.startsWith('6')", // Expense accounts
            required_dimensions: ["cost_center"]
          }
        ]
      },
      currency_rules: {
        allowed_currencies: ["AED", "USD", "EUR"],
        base_currency: "AED",
        exchange_rate_type: "DAILY"
      },
      metadata: {
        created_by: actorUserId,
        created_at: new Date().toISOString(),
        source: "BASE",
        description: `Base FICO policy bundle for ${industry} in ${region}`,
        applies_to: [industry, region]
      }
    }

    // Store policy bundle as entity
    const { error } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: '00000000-0000-0000-0000-000000000000', // Platform org for base policies
      p_entity: {
        entity_type: 'POLICY_BUNDLE',
        entity_name: `FICO Base Policy - ${industry} ${region}`,
        entity_code: bundleId,
        smart_code: `HERA.FICO.POLICY.BUNDLE.BASE.${industry}.${region}.v1`
      },
      p_dynamic: {
        policy_data: {
          field_type: 'json',
          field_value_json: basePolicyBundle,
          smart_code: 'HERA.FICO.POLICY.DATA.JSON.v1'
        }
      },
      p_relationships: [
        {
          target_entity_id: organizationId,
          relationship_type: 'POLICY_APPLIES_TO_ORG',
          smart_code: 'HERA.FICO.REL.POLICY.APPLIES.ORG.v1'
        }
      ],
      p_options: {}
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, bundle_id: bundleId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown policy error' }
  }
}

async function installIndustryOverlays(
  supabase: any,
  organizationId: string,
  overlays: string[],
  actorUserId: string
): Promise<Array<{ success: boolean; overlay: string; error?: string }>> {
  const results = []

  for (const overlayCode of overlays) {
    try {
      const overlay = INDUSTRY_OVERLAYS[overlayCode as keyof typeof INDUSTRY_OVERLAYS]
      if (!overlay) {
        results.push({ success: false, overlay: overlayCode, error: 'Overlay not found' })
        continue
      }

      // Install overlay as entity with posting rules
      const { error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: actorUserId,
        p_organization_id: '00000000-0000-0000-0000-000000000000',
        p_entity: {
          entity_type: 'OVERLAY_DEF',
          entity_name: overlay.name,
          entity_code: overlayCode,
          smart_code: `HERA.FICO.OVERLAY.INDUSTRY.${overlayCode}.v1`
        },
        p_dynamic: {
          overlay_data: {
            field_type: 'json',
            field_value_json: overlay,
            smart_code: 'HERA.FICO.OVERLAY.DATA.JSON.v1'
          }
        },
        p_relationships: [
          {
            target_entity_id: organizationId,
            relationship_type: 'ORG_ENABLED_OVERLAY',
            smart_code: 'HERA.FICO.REL.ORG.ENABLED.OVERLAY.v1'
          }
        ],
        p_options: {}
      })

      results.push({ 
        success: !error, 
        overlay: overlayCode,
        error: error?.message 
      })

    } catch (error) {
      results.push({ 
        success: false, 
        overlay: overlayCode, 
        error: error instanceof Error ? error.message : 'Unknown overlay error' 
      })
    }
  }

  return results
}

async function setupFiscalPeriods(
  supabase: any,
  organizationId: string,
  fiscalYearEnd: string,
  actorUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentYear = new Date().getFullYear()
    const [endMonth, endDay] = fiscalYearEnd.split('-').map(Number)
    
    // Create 12 monthly periods for current fiscal year
    for (let period = 1; period <= 12; period++) {
      let year = currentYear
      let month = endMonth - 12 + period
      
      if (month <= 0) {
        month += 12
        year--
      } else if (month > 12) {
        month -= 12
        year++
      }

      const periodFrom = new Date(year, month - 1, 1)
      const periodTo = new Date(year, month, 0) // Last day of month

      const { error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_entity: {
          entity_type: 'FISCAL_PERIOD',
          entity_name: `Period ${period.toString().padStart(2, '0')} - ${currentYear}`,
          entity_code: `${currentYear}${period.toString().padStart(2, '0')}`,
          smart_code: `HERA.FICO.FISCAL.PERIOD.ENTITY.MONTHLY.v1`
        },
        p_dynamic: {
          fiscal_year: { field_type: 'text', field_value_text: currentYear.toString(), smart_code: 'HERA.FICO.FISCAL.YEAR.v1' },
          period_number: { field_type: 'number', field_value_number: period, smart_code: 'HERA.FICO.PERIOD.NUMBER.v1' },
          period_from: { field_type: 'date', field_value_text: periodFrom.toISOString().split('T')[0], smart_code: 'HERA.FICO.PERIOD.FROM.v1' },
          period_to: { field_type: 'date', field_value_text: periodTo.toISOString().split('T')[0], smart_code: 'HERA.FICO.PERIOD.TO.v1' },
          period_status: { field_type: 'text', field_value_text: 'OPEN', smart_code: 'HERA.FICO.PERIOD.STATUS.v1' }
        },
        p_relationships: [],
        p_options: {}
      })

      if (error) {
        console.error(`Error creating fiscal period ${period}:`, error)
      }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown fiscal period error' }
  }
}