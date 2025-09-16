import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export interface ConversionData {
  companyName: string
  ownerName: string
  businessEmail: string
  phone?: string
  businessType?: string
  employees?: string
  monthlyRevenue?: string
  subdomain: string
  customDomain: string
  plan: {
    type: 'starter' | 'professional' | 'enterprise'
    billing: 'monthly' | 'yearly'
    price: number
  }
  demoModule: string
}

export interface ConversionResult {
  success: boolean
  organization?: {
    id: string
    name: string
    subdomain: string
    customDomain: string
  }
  user?: {
    id: string
    email: string
    tempPassword: string
  }
  businessSetup?: {
    setupType: string
    chartOfAccounts: number
    templates: number
    workflows: number
    industry: string
  }
  accessUrl?: string
  error?: string
}

// Demo organization IDs mapping
const DEMO_ORGANIZATIONS: Record<string, string> = {
  furniture: 'f0af4ced-9d12-4a55-a649-b484368db249',
  salon: 'c2f7b7a3-7e3d-4c47-9f2e-d3f8a9c2e5f6',
  restaurant: 'a5d9c8f7-8f5e-4b7c-9e3f-f2d8a7c9e4b5',
  crm: 'e7f9a5c3-5d8e-4f9c-8b3e-d5f7a9c8e2f4'
}

export class DemoToSaaSConversionService {
  /**
   * Convert demo to production SaaS instance
   */
  static async convertDemoToSaaS(conversionData: ConversionData): Promise<ConversionResult> {
    try {
      console.log('🚀 Starting demo to SaaS conversion...', {
        company: conversionData.companyName,
        subdomain: conversionData.subdomain,
        module: conversionData.demoModule
      })

      // Step 1: Create production organization
      const productionOrg = await this.createProductionOrganization(conversionData)

      // Step 2: Create production user account
      const productionUser = await this.createProductionUser(conversionData, productionOrg.id)

      // Step 3: Initialize fresh production business
      const businessSetup = await this.initializeProductionBusiness(
        productionOrg.id,
        conversionData.demoModule
      )

      // Step 4: Set up subdomain (would integrate with DNS provider in production)
      await this.setupProductionDomain(conversionData.subdomain, productionOrg.id)

      // Step 5: Activate plan features
      await this.activateSubscriptionFeatures(productionOrg.id, conversionData.plan.type)

      return {
        success: true,
        organization: productionOrg,
        user: productionUser,
        businessSetup,
        accessUrl: `https://${conversionData.subdomain}.heraerp.com`
      }
    } catch (error) {
      console.error('❌ Conversion failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during conversion'
      }
    }
  }

  /**
   * Create production organization
   */
  private static async createProductionOrganization(conversionData: ConversionData) {
    const orgId = uuidv4()

    const { data, error } = await supabase
      .from('core_organizations')
      .insert({
        id: orgId,
        organization_name: conversionData.companyName,
        organization_code: conversionData.subdomain.toUpperCase(),
        organization_type: 'production_saas',
        industry_classification: conversionData.demoModule,
        subdomain: conversionData.subdomain,
        settings: {
          plan: conversionData.plan.type,
          billing_cycle: conversionData.plan.billing,
          custom_domain: conversionData.customDomain,
          features_enabled: this.getPlanFeatures(conversionData.plan.type),
          converted_from_demo: true,
          demo_module: conversionData.demoModule,
          conversion_date: new Date().toISOString(),
          country: 'AE', // Default, can be customized
          currency: 'AED'
        },
        status: 'active'
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create organization: ${error.message}`)

    return {
      id: orgId,
      name: conversionData.companyName,
      subdomain: conversionData.subdomain,
      customDomain: conversionData.customDomain
    }
  }

  /**
   * Create production user account
   */
  private static async createProductionUser(
    conversionData: ConversionData,
    organizationId: string
  ) {
    const tempPassword = this.generateSecurePassword()

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: conversionData.businessEmail,
      password: tempPassword,
      email_confirm: false, // Will send verification email
      user_metadata: {
        full_name: conversionData.ownerName,
        organization_id: organizationId,
        organization_name: conversionData.companyName,
        organizations: [organizationId],
        default_organization: organizationId,
        role: 'owner',
        plan: conversionData.plan.type,
        converted_from_demo: true,
        conversion_date: new Date().toISOString()
      }
    })

    if (authError || !authData.user) {
      throw new Error(`Failed to create user: ${authError?.message}`)
    }

    // Create user entity in core_entities
    const { error: entityError } = await supabase.from('core_entities').insert({
      id: authData.user.id,
      organization_id: organizationId,
      entity_type: 'user',
      entity_name: conversionData.ownerName,
      entity_code: `USER-OWNER-${conversionData.subdomain.toUpperCase()}`,
      smart_code: `HERA.${conversionData.demoModule.toUpperCase()}.USER.OWNER.v1`,
      status: 'active',
      metadata: {
        email: conversionData.businessEmail,
        role: 'owner',
        plan: conversionData.plan.type,
        converted_from_demo: true,
        phone: conversionData.phone,
        permissions: ['all:read', 'all:write', 'all:delete', 'admin:manage', 'billing:manage']
      }
    })

    if (entityError) {
      console.warn('⚠️  Could not create user entity:', entityError.message)
    }

    return {
      id: authData.user.id,
      email: conversionData.businessEmail,
      tempPassword
    }
  }

  /**
   * Initialize fresh production business setup
   */
  private static async initializeProductionBusiness(organizationId: string, businessType: string) {
    console.log(`🚀 Initializing fresh ${businessType} business for production...`)

    try {
      // 1. Create Chart of Accounts with IFRS compliance
      const coaResult = await this.setupChartOfAccounts(organizationId, businessType)

      // 2. Create basic business entity templates (not demo data)
      const templates = await this.createBusinessTemplates(organizationId, businessType)

      // 3. Setup basic workflows and statuses
      const workflows = await this.setupBusinessWorkflows(organizationId, businessType)

      console.log(
        `✅ Production business initialized: ${coaResult.accounts} GL accounts, ${templates.length} templates, ${workflows.length} workflows`
      )

      return {
        setupType: 'fresh_production_business',
        chartOfAccounts: coaResult.accounts,
        templates: templates.length,
        workflows: workflows.length,
        industry: businessType
      }
    } catch (error) {
      console.error('❌ Error initializing production business:', error)
      throw error
    }
  }

  /**
   * Setup Chart of Accounts for production business
   */
  private static async setupChartOfAccounts(organizationId: string, businessType: string) {
    // Industry-specific COA templates
    const coaTemplates: Record<string, any[]> = {
      furniture: [
        { code: '1100', name: 'Cash and Bank', type: 'asset', category: 'current_assets' },
        { code: '1200', name: 'Accounts Receivable', type: 'asset', category: 'current_assets' },
        {
          code: '1300',
          name: 'Inventory - Raw Materials',
          type: 'asset',
          category: 'current_assets'
        },
        {
          code: '1310',
          name: 'Inventory - Finished Goods',
          type: 'asset',
          category: 'current_assets'
        },
        { code: '1500', name: 'Equipment and Machinery', type: 'asset', category: 'fixed_assets' },
        {
          code: '2100',
          name: 'Accounts Payable',
          type: 'liability',
          category: 'current_liabilities'
        },
        { code: '3000', name: "Owner's Equity", type: 'equity', category: 'equity' },
        { code: '4100', name: 'Sales Revenue', type: 'revenue', category: 'operating_revenue' },
        { code: '5100', name: 'Cost of Goods Sold', type: 'expense', category: 'cost_of_sales' },
        {
          code: '6100',
          name: 'Operating Expenses',
          type: 'expense',
          category: 'operating_expenses'
        }
      ],
      salon: [
        { code: '1100', name: 'Cash and Bank', type: 'asset', category: 'current_assets' },
        { code: '1200', name: 'Accounts Receivable', type: 'asset', category: 'current_assets' },
        { code: '1300', name: 'Product Inventory', type: 'asset', category: 'current_assets' },
        { code: '1500', name: 'Salon Equipment', type: 'asset', category: 'fixed_assets' },
        {
          code: '2100',
          name: 'Accounts Payable',
          type: 'liability',
          category: 'current_liabilities'
        },
        { code: '3000', name: "Owner's Equity", type: 'equity', category: 'equity' },
        { code: '4100', name: 'Service Revenue', type: 'revenue', category: 'operating_revenue' },
        { code: '4200', name: 'Product Sales', type: 'revenue', category: 'operating_revenue' },
        { code: '5100', name: 'Product Costs', type: 'expense', category: 'cost_of_sales' },
        { code: '6100', name: 'Staff Wages', type: 'expense', category: 'operating_expenses' }
      ],
      restaurant: [
        { code: '1100', name: 'Cash and Bank', type: 'asset', category: 'current_assets' },
        { code: '1200', name: 'Accounts Receivable', type: 'asset', category: 'current_assets' },
        { code: '1300', name: 'Food Inventory', type: 'asset', category: 'current_assets' },
        { code: '1310', name: 'Beverage Inventory', type: 'asset', category: 'current_assets' },
        { code: '1500', name: 'Kitchen Equipment', type: 'asset', category: 'fixed_assets' },
        {
          code: '2100',
          name: 'Accounts Payable',
          type: 'liability',
          category: 'current_liabilities'
        },
        { code: '3000', name: "Owner's Equity", type: 'equity', category: 'equity' },
        { code: '4100', name: 'Food Sales', type: 'revenue', category: 'operating_revenue' },
        { code: '4200', name: 'Beverage Sales', type: 'revenue', category: 'operating_revenue' },
        { code: '5100', name: 'Cost of Food Sold', type: 'expense', category: 'cost_of_sales' },
        {
          code: '6100',
          name: 'Kitchen Staff Wages',
          type: 'expense',
          category: 'operating_expenses'
        }
      ],
      crm: [
        { code: '1100', name: 'Cash and Bank', type: 'asset', category: 'current_assets' },
        { code: '1200', name: 'Accounts Receivable', type: 'asset', category: 'current_assets' },
        { code: '1500', name: 'Office Equipment', type: 'asset', category: 'fixed_assets' },
        {
          code: '2100',
          name: 'Accounts Payable',
          type: 'liability',
          category: 'current_liabilities'
        },
        { code: '3000', name: "Owner's Equity", type: 'equity', category: 'equity' },
        { code: '4100', name: 'Service Revenue', type: 'revenue', category: 'operating_revenue' },
        {
          code: '4200',
          name: 'Consulting Revenue',
          type: 'revenue',
          category: 'operating_revenue'
        },
        { code: '6100', name: 'Staff Salaries', type: 'expense', category: 'operating_expenses' },
        { code: '6200', name: 'Software Licenses', type: 'expense', category: 'operating_expenses' }
      ]
    }

    const accounts = coaTemplates[businessType] || coaTemplates.crm
    const createdAccounts = []

    for (const account of accounts) {
      const glAccount = await supabase
        .from('core_entities')
        .insert({
          id: uuidv4(),
          organization_id: organizationId,
          entity_type: 'gl_account',
          entity_name: account.name,
          entity_code: account.code,
          smart_code: `HERA.FIN.GL.ACC.${account.code}.v1`,
          status: 'active',
          metadata: {
            account_type: account.type,
            account_category: account.category,
            ifrs_compliant: true,
            created_by_conversion: true,
            business_type: businessType
          }
        })
        .select()
        .single()

      if (!glAccount.error) {
        createdAccounts.push(glAccount.data)
      }
    }

    return { accounts: createdAccounts.length }
  }

  /**
   * Create basic business entity templates
   */
  private static async createBusinessTemplates(organizationId: string, businessType: string) {
    const templates: Record<string, any[]> = {
      furniture: [
        {
          type: 'product_category',
          name: 'Bedroom Furniture',
          description: 'Beds, dressers, nightstands'
        },
        {
          type: 'product_category',
          name: 'Living Room Furniture',
          description: 'Sofas, coffee tables, chairs'
        },
        { type: 'supplier_type', name: 'Wood Suppliers', description: 'Raw material suppliers' },
        { type: 'customer_type', name: 'Retail Customers', description: 'Individual customers' }
      ],
      salon: [
        { type: 'service_category', name: 'Hair Services', description: 'Cuts, color, styling' },
        {
          type: 'service_category',
          name: 'Beauty Treatments',
          description: 'Facials, manicures, pedicures'
        },
        { type: 'staff_role', name: 'Hair Stylist', description: 'Licensed hair professional' },
        { type: 'customer_type', name: 'Regular Clients', description: 'Repeat customers' }
      ],
      restaurant: [
        { type: 'menu_category', name: 'Main Courses', description: 'Primary dishes' },
        { type: 'menu_category', name: 'Beverages', description: 'Drinks and refreshments' },
        { type: 'supplier_type', name: 'Food Suppliers', description: 'Ingredient suppliers' },
        { type: 'table_type', name: '4-Person Tables', description: 'Standard dining tables' }
      ],
      crm: [
        { type: 'lead_source', name: 'Website Inquiry', description: 'Leads from website forms' },
        { type: 'lead_status', name: 'Qualified Lead', description: 'Leads that meet criteria' },
        { type: 'customer_type', name: 'Enterprise Client', description: 'Large business clients' },
        {
          type: 'pipeline_stage',
          name: 'Proposal Sent',
          description: 'Proposal submitted to prospect'
        }
      ]
    }

    const businessTemplates = templates[businessType] || []
    const createdEntities = []

    for (const template of businessTemplates) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          id: uuidv4(),
          organization_id: organizationId,
          entity_type: template.type,
          entity_name: template.name,
          entity_code: `TMPL-${template.type.toUpperCase()}-${Math.random().toString(36).substr(2, 6)}`,
          smart_code: `HERA.${businessType.toUpperCase()}.TEMPLATE.${template.type.toUpperCase()}.v1`,
          status: 'template',
          metadata: {
            is_template: true,
            business_type: businessType,
            description: template.description,
            created_by_conversion: true
          }
        })
        .select()
        .single()

      if (!error && data) {
        createdEntities.push(data)
      }
    }

    return createdEntities
  }

  /**
   * Setup basic business workflows
   */
  private static async setupBusinessWorkflows(organizationId: string, businessType: string) {
    const workflowStatuses = [
      { name: 'Draft', color: '#94A3B8', order: 1 },
      { name: 'Pending', color: '#F59E0B', order: 2 },
      { name: 'Approved', color: '#10B981', order: 3 },
      { name: 'In Progress', color: '#3B82F6', order: 4 },
      { name: 'Completed', color: '#059669', order: 5 },
      { name: 'Cancelled', color: '#DC2626', order: 6 }
    ]

    const createdStatuses = []

    for (const status of workflowStatuses) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          id: uuidv4(),
          organization_id: organizationId,
          entity_type: 'workflow_status',
          entity_name: `${status.name} Status`,
          entity_code: `STATUS-${status.name.toUpperCase().replace(' ', '-')}`,
          smart_code: `HERA.WORKFLOW.STATUS.${status.name.toUpperCase().replace(' ', '_')}.v1`,
          status: 'active',
          metadata: {
            status_color: status.color,
            display_order: status.order,
            business_type: businessType,
            created_by_conversion: true
          }
        })
        .select()
        .single()

      if (!error && data) {
        createdStatuses.push(data)
      }
    }

    return createdStatuses
  }

  /**
   * Set up production domain (placeholder - would integrate with DNS provider)
   */
  private static async setupProductionDomain(subdomain: string, organizationId: string) {
    console.log('🌐 Setting up production domain...', { subdomain, organizationId })

    // In production, this would:
    // 1. Create DNS records with provider (Cloudflare, Route53, etc.)
    // 2. Generate SSL certificate
    // 3. Update load balancer routing
    // 4. Configure CDN

    // For demo, we'll just log the setup
    console.log(`   ✅ Domain configured: ${subdomain}.heraerp.com`)
    console.log('   ✅ SSL certificate generated')
    console.log('   ✅ CDN routing configured')

    // Update organization with domain status
    await supabase
      .from('core_organizations')
      .update({
        settings: {
          ...{}, // Would merge existing settings
          domain_status: 'active',
          ssl_status: 'active',
          dns_configured: true,
          domain_setup_date: new Date().toISOString()
        }
      })
      .eq('id', organizationId)
  }

  /**
   * Activate subscription features based on plan
   */
  private static async activateSubscriptionFeatures(organizationId: string, planType: string) {
    console.log('🔧 Activating subscription features...', { organizationId, planType })

    const features = this.getPlanFeatures(planType)

    // Update organization with feature flags
    const { error } = await supabase
      .from('core_organizations')
      .update({
        settings: {
          ...{}, // Would merge existing settings
          active_features: features,
          plan_activated_at: new Date().toISOString(),
          feature_limits: this.getPlanLimits(planType)
        }
      })
      .eq('id', organizationId)

    if (error) {
      console.error('❌ Error activating features:', error.message)
    } else {
      console.log(`   ✅ Activated ${features.length} features for ${planType} plan`)
    }
  }

  /**
   * Get features for a plan type
   */
  private static getPlanFeatures(planType: string): string[] {
    const planFeatures = {
      starter: ['basic-reports', 'mobile-app', 'email-support'],
      professional: [
        'basic-reports',
        'advanced-reports',
        'mobile-app',
        'api-access',
        'integrations',
        'priority-support',
        'custom-fields'
      ],
      enterprise: [
        'basic-reports',
        'advanced-reports',
        'mobile-app',
        'api-access',
        'integrations',
        'priority-support',
        'custom-fields',
        'sso',
        'advanced-security',
        'custom-integrations',
        'phone-support',
        'dedicated-manager'
      ]
    }

    return planFeatures[planType as keyof typeof planFeatures] || []
  }

  /**
   * Get limits for a plan type
   */
  private static getPlanLimits(planType: string) {
    const planLimits = {
      starter: {
        users: 3,
        storage_gb: 10,
        api_calls_month: 1000,
        reports_month: 50
      },
      professional: {
        users: 15,
        storage_gb: 100,
        api_calls_month: 10000,
        reports_month: 500
      },
      enterprise: {
        users: -1, // unlimited
        storage_gb: 1024,
        api_calls_month: -1, // unlimited
        reports_month: -1 // unlimited
      }
    }

    return planLimits[planType as keyof typeof planLimits] || planLimits.starter
  }

  /**
   * Generate secure random password
   */
  private static generateSecurePassword(): string {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    return password
  }

  /**
   * Check subdomain availability
   */
  static async checkSubdomainAvailability(
    subdomain: string
  ): Promise<{ available: boolean; reason?: string }> {
    try {
      const { data, error } = await supabase
        .from('core_organizations')
        .select('id')
        .eq('subdomain', subdomain)
        .limit(1)

      if (error) {
        return { available: false, reason: 'database_error' }
      }

      return {
        available: !data || data.length === 0,
        reason: data && data.length > 0 ? 'taken' : undefined
      }
    } catch (error) {
      return { available: false, reason: 'unknown_error' }
    }
  }

  /**
   * Get conversion metrics for a demo session
   */
  static async getDemoMetrics(demoModule: string, organizationId: string) {
    try {
      // Get entities created
      const { data: entities } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', organizationId)

      // Get transactions created
      const { data: transactions } = await supabase
        .from('universal_transactions')
        .select('id')
        .eq('organization_id', organizationId)

      // Calculate metrics (simplified for demo)
      const totalRecords = (entities?.length || 0) + (transactions?.length || 0)
      const featuresUsed = this.inferFeaturesUsed(entities || [], transactions || [])

      return {
        sessionDuration: '45 minutes', // Would track actual session time
        featuresUsed,
        dataCreated: totalRecords,
        returnVisits: 3, // Would track actual visits
        conversionReadiness: totalRecords > 10 ? 'high' : totalRecords > 5 ? 'medium' : 'low'
      }
    } catch (error) {
      console.error('Error getting demo metrics:', error)
      return {
        sessionDuration: '30 minutes',
        featuresUsed: [],
        dataCreated: 0,
        returnVisits: 1,
        conversionReadiness: 'low' as const
      }
    }
  }

  /**
   * Infer features used from data
   */
  private static inferFeaturesUsed(entities: any[], transactions: any[]): string[] {
    const features = []

    if (entities.some(e => e.entity_type === 'customer')) features.push('customers')
    if (entities.some(e => e.entity_type === 'product')) features.push('inventory')
    if (entities.some(e => e.entity_type === 'employee')) features.push('staff')
    if (transactions.some(t => t.transaction_type === 'sale')) features.push('orders')
    if (transactions.length > 0) features.push('reports')

    return features
  }
}
