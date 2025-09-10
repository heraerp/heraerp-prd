import { supabase } from './supabase'

export interface WizardStepData {
  organization_id: string
  wizard_session_id: string
  step: string
  data: any
  metadata?: {
    ingest_source: string
    step_completion_time: string
  }
}

export interface ActivateOrganizationData {
  organization_id: string
  wizard_data: any
  wizard_session_id: string
}

export interface COATemplateRequest {
  industry: string
  country: string
  currency: string
}

// Extend existing universal API class with wizard methods
class UniversalAPIExtended {
  private organizationId: string | null = null
  private mockMode = false

  constructor() {
    this.mockMode = !supabase
  }

  setOrganizationId(orgId: string) {
    this.organizationId = orgId
  }

  // Wizard-specific methods
  async saveWizardStep(stepData: WizardStepData) {
    if (this.mockMode) {
      console.log('Mock: Saving wizard step', stepData)
      return { success: true }
    }

    try {
      // Save step data to core_dynamic_data table
      const { data, error } = await supabase
        .from('core_dynamic_data')
        .insert({
          id: crypto.randomUUID(),
          organization_id: stepData.organization_id,
          entity_id: null, // Wizard config not tied to specific entity
          field_name: `wizard_step_${stepData.step}`,
          field_value_json: {
            wizard_session_id: stepData.wizard_session_id,
            step_data: stepData.data,
            metadata: stepData.metadata
          },
          smart_code: `HERA.UCR.WIZARD.STEP.${stepData.step.toUpperCase()}.v1`,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Failed to save wizard step:', error)
      throw error
    }
  }

  async getCOATemplate(request: COATemplateRequest) {
    if (this.mockMode) {
      // Return mock COA template based on industry
      return this.generateMockCOATemplate(request)
    }

    try {
      // In production, this would fetch from system organization
      // or generate based on industry templates
      const systemOrgId = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'
      
      const { data: accounts, error } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', systemOrgId)
        .eq('entity_type', 'account_template')
        .like('smart_code', `%${request.industry}%`)
        .order('entity_code')

      if (error) throw error

      // Transform to COA format
      const coaAccounts = accounts?.map(account => ({
        entity_code: account.entity_code,
        entity_name: account.entity_name,
        parent_entity_code: account.from_entity_id,
        account_type: account.business_rules?.account_type || 'ASSET',
        account_subtype: account.business_rules?.account_subtype || 'CURRENT_ASSET',
        allow_posting: account.business_rules?.allow_posting ?? true,
        natural_balance: account.business_rules?.natural_balance || 'DEBIT',
        ifrs_classification: account.business_rules?.ifrs_classification || 'ASSET',
        smart_code: account.smart_code
      })) || []

      return { accounts: coaAccounts }
    } catch (error) {
      console.error('Failed to load COA template:', error)
      // Fallback to mock template
      return this.generateMockCOATemplate(request)
    }
  }

  private generateMockCOATemplate(request: COATemplateRequest) {
    const industryPrefix = request.industry
    const baseAccounts = [
      // Assets
      {
        entity_code: '1000000',
        entity_name: 'Current Assets',
        account_type: 'ASSET',
        account_subtype: 'CURRENT_ASSET',
        allow_posting: false,
        natural_balance: 'DEBIT',
        ifrs_classification: 'CURRENT_ASSET',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.ASSET.CURRENT.v1`
      },
      {
        entity_code: '1100000',
        entity_name: 'Cash and Bank',
        parent_entity_code: '1000000',
        account_type: 'ASSET',
        account_subtype: 'CURRENT_ASSET',
        allow_posting: true,
        natural_balance: 'DEBIT',
        ifrs_classification: 'CURRENT_ASSET',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.ASSET.CURRENT.CASH.v1`
      },
      {
        entity_code: '1200000',
        entity_name: 'Accounts Receivable',
        parent_entity_code: '1000000',
        account_type: 'ASSET',
        account_subtype: 'CURRENT_ASSET',
        allow_posting: true,
        natural_balance: 'DEBIT',
        ifrs_classification: 'CURRENT_ASSET',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.ASSET.CURRENT.AR.v1`
      },
      // Liabilities
      {
        entity_code: '2000000',
        entity_name: 'Current Liabilities',
        account_type: 'LIABILITY',
        account_subtype: 'CURRENT_LIABILITY',
        allow_posting: false,
        natural_balance: 'CREDIT',
        ifrs_classification: 'CURRENT_LIABILITY',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.LIAB.CURRENT.v1`
      },
      {
        entity_code: '2100000',
        entity_name: 'Accounts Payable',
        parent_entity_code: '2000000',
        account_type: 'LIABILITY',
        account_subtype: 'CURRENT_LIABILITY',
        allow_posting: true,
        natural_balance: 'CREDIT',
        ifrs_classification: 'CURRENT_LIABILITY',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.LIAB.CURRENT.AP.v1`
      },
      // Equity
      {
        entity_code: '3000000',
        entity_name: 'Equity',
        account_type: 'EQUITY',
        account_subtype: 'OWNERS_EQUITY',
        allow_posting: false,
        natural_balance: 'CREDIT',
        ifrs_classification: 'EQUITY',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.EQUITY.v1`
      },
      {
        entity_code: '3200000',
        entity_name: 'Retained Earnings',
        parent_entity_code: '3000000',
        account_type: 'EQUITY',
        account_subtype: 'RETAINED_EARNINGS',
        allow_posting: true,
        natural_balance: 'CREDIT',
        ifrs_classification: 'EQUITY',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.EQUITY.RETAINED.v1`
      },
      {
        entity_code: '3300000',
        entity_name: 'Current Year Earnings',
        parent_entity_code: '3000000',
        account_type: 'EQUITY',
        account_subtype: 'CURRENT_EARNINGS',
        allow_posting: false,
        natural_balance: 'CREDIT',
        ifrs_classification: 'EQUITY',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.EQUITY.CURRENT.v1`
      },
      // Revenue
      {
        entity_code: '4000000',
        entity_name: 'Revenue',
        account_type: 'REVENUE',
        account_subtype: 'OPERATING_REVENUE',
        allow_posting: false,
        natural_balance: 'CREDIT',
        ifrs_classification: 'REVENUE',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.REV.v1`
      },
      {
        entity_code: '4100000',
        entity_name: request.industry === 'SALON' ? 'Service Revenue' : 'Sales Revenue',
        parent_entity_code: '4000000',
        account_type: 'REVENUE',
        account_subtype: 'OPERATING_REVENUE',
        allow_posting: true,
        natural_balance: 'CREDIT',
        ifrs_classification: 'REVENUE',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.REV.OPERATING.SALES.v1`
      },
      // Expenses
      {
        entity_code: '5000000',
        entity_name: 'Operating Expenses',
        account_type: 'EXPENSE',
        account_subtype: 'OPERATING_EXPENSE',
        allow_posting: false,
        natural_balance: 'DEBIT',
        ifrs_classification: 'EXPENSE',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.EXP.OPERATING.v1`
      },
      {
        entity_code: '5100000',
        entity_name: request.industry === 'RESTAURANT' ? 'Cost of Food Sold' : 'Cost of Goods Sold',
        parent_entity_code: '5000000',
        account_type: 'EXPENSE',
        account_subtype: 'COST_OF_SALES',
        allow_posting: true,
        natural_balance: 'DEBIT',
        ifrs_classification: 'EXPENSE',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.EXP.OPERATING.COGS.v1`
      }
    ]

    // Add industry-specific accounts
    if (request.industry === 'RESTAURANT') {
      baseAccounts.push(
        {
          entity_code: '1150000',
          entity_name: 'Tips Receivable',
          parent_entity_code: '1000000',
          account_type: 'ASSET',
          account_subtype: 'CURRENT_ASSET',
          allow_posting: true,
          natural_balance: 'DEBIT',
          ifrs_classification: 'CURRENT_ASSET',
          smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.ASSET.CURRENT.TIPS.v1`
        },
        {
          entity_code: '5150000',
          entity_name: 'Food Waste',
          parent_entity_code: '5000000',
          account_type: 'EXPENSE',
          account_subtype: 'OPERATING_EXPENSE',
          allow_posting: true,
          natural_balance: 'DEBIT',
          ifrs_classification: 'EXPENSE',
          smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.EXP.OPERATING.WASTE.v1`
        }
      )
    } else if (request.industry === 'SALON') {
      baseAccounts.push(
        {
          entity_code: '4200000',
          entity_name: 'Product Sales Revenue',
          parent_entity_code: '4000000',
          account_type: 'REVENUE',
          account_subtype: 'OPERATING_REVENUE',
          allow_posting: true,
          natural_balance: 'CREDIT',
          ifrs_classification: 'REVENUE',
          smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.REV.PRODUCT.v1`
        },
        {
          entity_code: '5200000',
          entity_name: 'Beauty Supply Costs',
          parent_entity_code: '5000000',
          account_type: 'EXPENSE',
          account_subtype: 'COST_OF_SALES',
          allow_posting: true,
          natural_balance: 'DEBIT',
          ifrs_classification: 'EXPENSE',
          smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.EXP.SUPPLIES.v1`
        }
      )
    }

    return { accounts: baseAccounts }
  }

  async activateOrganization(activationData: ActivateOrganizationData) {
    if (this.mockMode) {
      console.log('Mock: Activating organization', activationData)
      return { success: true, message: 'Organization activated successfully' }
    }

    try {
      // In a full implementation, this would:
      // 1. Create all entities from wizard data
      // 2. Setup fiscal periods  
      // 3. Configure posting controls
      // 4. Setup document numbering
      // 5. Activate Finance/Fiscal DNA modules
      // 6. Create initial UCR configurations

      // For now, just update organization settings
      const { data, error } = await supabase
        .from('core_organizations')
        .update({
          settings: {
            ...activationData.wizard_data,
            wizard_completed: true,
            wizard_session_id: activationData.wizard_session_id,
            activation_date: new Date().toISOString()
          }
        })
        .eq('id', activationData.organization_id)

      if (error) throw error

      return { success: true, message: 'Organization activated successfully' }
    } catch (error) {
      console.error('Failed to activate organization:', error)
      return { success: false, error: 'Activation failed' }
    }
  }

  // Add read method for compatibility
  async read(params: { table: string } | string, filter?: any, organizationId?: string) {
    if (this.mockMode) {
      console.log('Mock: Reading data', params)
      return { data: [], error: null }
    }

    try {
      const tableName = typeof params === 'string' ? params : params.table
      const orgId = organizationId || this.organizationId
      
      console.log('🔧 UniversalAPI.read() called:')
      console.log('- Table:', tableName)
      console.log('- Organization ID:', orgId)
      console.log('- Current org ID:', this.organizationId)
      
      if (!orgId) {
        throw new Error('Organization ID is required')
      }
      
      console.log('🚀 Querying Supabase:', `${tableName} WHERE organization_id = ${orgId}`)
      
      let query = supabase.from(tableName).select('*').eq('organization_id', orgId)
      
      const { data, error } = await query
      
      console.log('📊 Supabase query result:')
      console.log('- Data type:', typeof data)
      console.log('- Data is array:', Array.isArray(data))
      console.log('- Data length:', data?.length || 'N/A')
      console.log('- Error:', error)
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error('❌ Failed to read data:', error)
      return { data: null, error: error.message || 'Read operation failed' }
    }
  }
  
  // Core entity management methods
  async createEntity(entityData: any) {
    if (this.mockMode) {
      console.log('Mock: Creating entity', entityData)
      return { success: true, data: { id: crypto.randomUUID(), ...entityData } }
    }

    try {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          id: crypto.randomUUID(),
          organization_id: entityData.organization_id || this.organizationId,
          ...entityData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Failed to create entity:', error)
      throw error
    }
  }

  async createTransaction(transactionData: any) {
    if (this.mockMode) {
      console.log('Mock: Creating transaction', transactionData)
      return { success: true, data: { id: crypto.randomUUID(), ...transactionData } }
    }

    try {
      const { data, error } = await supabase
        .from('universal_transactions')
        .insert({
          id: crypto.randomUUID(),
          organization_id: transactionData.organization_id || this.organizationId,
          ...transactionData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Failed to create transaction:', error)
      throw error
    }
  }

  async createTransactionLine(lineData: any) {
    if (this.mockMode) {
      console.log('Mock: Creating transaction line', lineData)
      return { success: true, data: { id: crypto.randomUUID(), ...lineData } }
    }

    try {
      const { data, error } = await supabase
        .from('universal_transaction_lines')
        .insert({
          id: crypto.randomUUID(),
          organization_id: lineData.organization_id || this.organizationId,
          ...lineData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Failed to create transaction line:', error)
      throw error
    }
  }

  async updateTransaction(transactionId: string, updateData: any) {
    if (this.mockMode) {
      console.log('Mock: Updating transaction', transactionId, updateData)
      return { success: true, data: { id: transactionId, ...updateData } }
    }

    try {
      const { data, error } = await supabase
        .from('universal_transactions')
        .update(updateData)
        .eq('id', transactionId)
        .eq('organization_id', this.organizationId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Failed to update transaction:', error)
      throw error
    }
  }

  async query(table: string, filters?: any) {
    if (this.mockMode) {
      console.log('Mock: Querying', table, filters)
      return { data: [], error: null }
    }

    try {
      let query = supabase.from(table).select('*')
      
      if (this.organizationId) {
        query = query.eq('organization_id', this.organizationId)
      }
      
      // Apply filters if provided
      if (filters) {
        Object.keys(filters).forEach(key => {
          query = query.eq(key, filters[key])
        })
      }

      const { data, error } = await query
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Failed to query:', error)
      return { data: null, error: error.message || 'Query failed' }
    }
  }

  async createRelationship(relationshipData: any) {
    if (this.mockMode) {
      console.log('Mock: Creating relationship', relationshipData)
      return { success: true, data: { id: crypto.randomUUID(), ...relationshipData } }
    }

    try {
      const { data, error } = await supabase
        .from('core_relationships')
        .insert({
          id: crypto.randomUUID(),
          organization_id: relationshipData.organization_id || this.organizationId,
          ...relationshipData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Failed to create relationship:', error)
      throw error
    }
  }

  async updateRelationship(relationshipId: string, updateData: any) {
    if (this.mockMode) {
      console.log('Mock: Updating relationship', relationshipId, updateData)
      return { success: true, data: { id: relationshipId, ...updateData } }
    }

    try {
      const { data, error } = await supabase
        .from('core_relationships')
        .update(updateData)
        .eq('id', relationshipId)
        .eq('organization_id', this.organizationId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Failed to update relationship:', error)
      throw error
    }
  }

  async getRelationships(filters?: any) {
    return this.query('core_relationships', filters)
  }

  async getEntities(filters?: any) {
    return this.query('core_entities', filters)
  }

  async getTransactionsByIds(transactionIds: string[]) {
    if (this.mockMode) {
      console.log('Mock: Getting transactions by IDs', transactionIds)
      return { data: [], error: null }
    }

    try {
      const { data, error } = await supabase
        .from('universal_transactions')
        .select('*')
        .in('id', transactionIds)
        .eq('organization_id', this.organizationId)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Failed to get transactions by IDs:', error)
      return { data: null, error: error.message || 'Query failed' }
    }
  }

  async getEntityBySmartCode(smartCode: string) {
    if (this.mockMode) {
      console.log('Mock: Getting entity by smart code', smartCode)
      return { data: null, error: null }
    }

    try {
      const { data, error } = await supabase
        .from('core_entities')
        .select('*')
        .eq('smart_code', smartCode)
        .eq('organization_id', this.organizationId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
      return { data: data || null, error: null }
    } catch (error) {
      console.error('Failed to get entity by smart code:', error)
      return { data: null, error: error.message || 'Query failed' }
    }
  }
}

// Export singleton instance
export const universalApi = new UniversalAPIExtended()