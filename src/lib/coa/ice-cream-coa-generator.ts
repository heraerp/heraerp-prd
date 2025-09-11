import { universalApi } from '@/lib/universal-api'

interface IceCreamCOAConfig {
  organizationId: string
  organizationName: string
  country: string
  currency: string
  includeKulfi?: boolean
  multiLocation?: boolean
  exportBusiness?: boolean
}

export class IceCreamCOAGenerator {
  private config: IceCreamCOAConfig

  constructor(config: IceCreamCOAConfig) {
    this.config = config
  }

  /**
   * Generate complete Chart of Accounts for ice cream manufacturing business
   */
  async generateCOA() {
    const accounts = []
    
    // Assets - 1000 series
    accounts.push(...this.generateAssetAccounts())
    
    // Liabilities - 2000 series
    accounts.push(...this.generateLiabilityAccounts())
    
    // Equity - 3000 series
    accounts.push(...this.generateEquityAccounts())
    
    // Revenue - 4000 series
    accounts.push(...this.generateRevenueAccounts())
    
    // Cost of Goods Sold - 5000 series
    accounts.push(...this.generateCOGSAccounts())
    
    // Operating Expenses - 6000 series
    accounts.push(...this.generateExpenseAccounts())
    
    // Other Income/Expenses - 8000 series
    accounts.push(...this.generateOtherAccounts())
    
    // Create all accounts in the database
    const createdAccounts = []
    for (const account of accounts) {
      try {
        const entity = await universalApi.createEntity({
          entity_type: 'gl_account',
          entity_name: account.account_name,
          entity_code: account.account_code,
          organization_id: this.config.organizationId,
          smart_code: account.smart_code,
          metadata: {
            account_type: account.account_type,
            parent_account: account.parent_account,
            ifrs_classification: account.ifrs_classification,
            description: account.description,
            gst_rate: account.gst_rate,
            is_header: account.is_header,
            normal_balance: account.normal_balance
          }
        })
        
        // Add dynamic fields for COA properties
        if (account.ifrs_fields) {
          for (const [field, value] of Object.entries(account.ifrs_fields)) {
            await universalApi.setDynamicField(
              entity.id,
              field,
              value,
              `HERA.IN.ICECREAM.GL.IFRS.${field.toUpperCase()}.v2`
            )
          }
        }
        
        createdAccounts.push(entity)
      } catch (error) {
        console.error(`Failed to create account ${account.account_code}:`, error)
      }
    }
    
    // Create relationships for parent-child hierarchy
    await this.createAccountHierarchy(createdAccounts)
    
    // Setup auto-journal rules
    await this.setupAutoJournalRules()
    
    return {
      success: true,
      accountsCreated: createdAccounts.length,
      accounts: createdAccounts
    }
  }

  private generateAssetAccounts() {
    const accounts = []
    
    // Current Assets
    accounts.push({
      account_code: '1000',
      account_name: 'Assets',
      account_type: 'header',
      is_header: true,
      ifrs_classification: 'ASSETS',
      smart_code: `HERA.${this.config.country}.ICECREAM.GL.ASSET.HEADER.v2`,
      normal_balance: 'debit'
    })
    
    // Cash accounts
    accounts.push({
      account_code: '1111',
      account_name: 'Petty Cash',
      account_type: 'asset',
      parent_account: '1110',
      smart_code: `HERA.${this.config.country}.ICECREAM.GL.ASSET.CASH.PETTY.v2`,
      normal_balance: 'debit',
      ifrs_fields: {
        statement_type: 'SFP',
        classification_1: 'Current Assets',
        classification_2: 'Cash and Cash Equivalents',
        cash_flow_category: 'Operating'
      }
    })
    
    // Inventory - Raw Materials
    const rawMaterials = [
      { code: '1311', name: 'Raw Materials - Dairy Products', desc: 'Milk, cream, butter, milk powder' },
      { code: '1312', name: 'Raw Materials - Sugar & Sweeteners', desc: 'Sugar, corn syrup, honey' },
      { code: '1313', name: 'Raw Materials - Flavoring & Colors', desc: 'Vanilla, chocolate, fruit extracts' },
      { code: '1314', name: 'Raw Materials - Stabilizers & Emulsifiers', desc: 'Guar gum, lecithin' },
      { code: '1315', name: 'Raw Materials - Inclusions', desc: 'Nuts, chocolate chips, fruit pieces' },
      { code: '1316', name: 'Packaging Materials', desc: 'Cups, cones, sticks, wrappers' }
    ]
    
    rawMaterials.forEach(rm => {
      accounts.push({
        account_code: rm.code,
        account_name: rm.name,
        account_type: 'asset',
        parent_account: '1310',
        description: rm.desc,
        smart_code: `HERA.${this.config.country}.ICECREAM.GL.ASSET.RAW.${rm.code}.v2`,
        normal_balance: 'debit',
        ifrs_fields: {
          statement_type: 'SFP',
          classification_1: 'Current Assets',
          classification_2: 'Inventories',
          classification_3: 'Raw Materials'
        }
      })
    })
    
    // Finished Goods
    const finishedGoods = [
      { code: '1331', name: 'FG - Ice Cream Cups/Tubs', type: 'CUPS' },
      { code: '1332', name: 'FG - Ice Cream Bars/Sticks', type: 'BARS' },
      { code: '1333', name: 'FG - Ice Cream Cones', type: 'CONES' },
      { code: '1334', name: 'FG - Bulk Ice Cream', type: 'BULK' }
    ]
    
    if (this.config.includeKulfi) {
      finishedGoods.push({ code: '1335', name: 'FG - Kulfi Products', type: 'KULFI' })
    }
    
    finishedGoods.forEach(fg => {
      accounts.push({
        account_code: fg.code,
        account_name: fg.name,
        account_type: 'asset',
        parent_account: '1330',
        smart_code: `HERA.${this.config.country}.ICECREAM.GL.ASSET.FG.${fg.type}.v2`,
        normal_balance: 'debit',
        ifrs_fields: {
          statement_type: 'SFP',
          classification_1: 'Current Assets',
          classification_2: 'Inventories',
          classification_3: 'Finished Goods'
        }
      })
    })
    
    // Fixed Assets - Production Equipment
    accounts.push({
      account_code: '1610',
      account_name: 'Production Equipment',
      account_type: 'asset',
      parent_account: '1600',
      description: 'Pasteurizers, homogenizers, churning machines',
      smart_code: `HERA.${this.config.country}.ICECREAM.GL.ASSET.EQUIPMENT.PRODUCTION.v2`,
      normal_balance: 'debit',
      ifrs_fields: {
        statement_type: 'SFP',
        classification_1: 'Non-Current Assets',
        classification_2: 'Property, Plant and Equipment',
        depreciation_method: 'straight_line',
        useful_life_years: 10
      }
    })
    
    accounts.push({
      account_code: '1620',
      account_name: 'Freezing & Cold Storage Equipment',
      account_type: 'asset',
      parent_account: '1600',
      description: 'Blast freezers, cold rooms, display freezers',
      smart_code: `HERA.${this.config.country}.ICECREAM.GL.ASSET.EQUIPMENT.FREEZER.v2`,
      normal_balance: 'debit',
      ifrs_fields: {
        statement_type: 'SFP',
        classification_1: 'Non-Current Assets',
        classification_2: 'Property, Plant and Equipment',
        depreciation_method: 'straight_line',
        useful_life_years: 15
      }
    })
    
    return accounts
  }

  private generateRevenueAccounts() {
    const accounts = []
    
    // Revenue header
    accounts.push({
      account_code: '4000',
      account_name: 'Revenue',
      account_type: 'header',
      is_header: true,
      ifrs_classification: 'REVENUE',
      smart_code: `HERA.${this.config.country}.ICECREAM.GL.REVENUE.HEADER.v2`,
      normal_balance: 'credit'
    })
    
    // Sales channels
    const salesChannels = [
      { code: '4110', name: 'Ice Cream Sales - Retail Stores', type: 'RETAIL', gst: '18%' },
      { code: '4111', name: 'Ice Cream Sales - Wholesale', type: 'WHOLESALE', gst: '18%' },
      { code: '4112', name: 'Ice Cream Sales - Food Service', type: 'FOODSERVICE', gst: '18%' },
      { code: '4113', name: 'Ice Cream Sales - Online/Delivery', type: 'ONLINE', gst: '18%' }
    ]
    
    if (this.config.includeKulfi) {
      salesChannels.push({
        code: '4114',
        name: 'Kulfi Sales - All Channels',
        type: 'KULFI',
        gst: '12%' // Lower GST rate for traditional products
      })
    }
    
    salesChannels.forEach(channel => {
      accounts.push({
        account_code: channel.code,
        account_name: channel.name,
        account_type: 'revenue',
        parent_account: '4100',
        gst_rate: channel.gst,
        smart_code: `HERA.${this.config.country}.ICECREAM.GL.REVENUE.${channel.type}.v2`,
        normal_balance: 'credit',
        ifrs_fields: {
          statement_type: 'SPL',
          classification_1: 'Revenue',
          classification_2: 'Product Sales',
          revenue_recognition: 'point_in_time'
        }
      })
    })
    
    return accounts
  }

  private generateCOGSAccounts() {
    const accounts = []
    
    // COGS header
    accounts.push({
      account_code: '5000',
      account_name: 'Cost of Goods Sold',
      account_type: 'header',
      is_header: true,
      ifrs_classification: 'COST_OF_SALES',
      smart_code: `HERA.${this.config.country}.ICECREAM.GL.COGS.HEADER.v2`,
      normal_balance: 'debit'
    })
    
    // Direct material costs
    const materials = [
      { code: '5110', name: 'Dairy Products Cost', type: 'DAIRY' },
      { code: '5111', name: 'Sugar & Sweeteners Cost', type: 'SUGAR' },
      { code: '5112', name: 'Flavoring & Colors Cost', type: 'FLAVOR' },
      { code: '5113', name: 'Inclusions Cost', type: 'INCLUSION' },
      { code: '5114', name: 'Packaging Materials Cost', type: 'PACKAGING' }
    ]
    
    materials.forEach(material => {
      accounts.push({
        account_code: material.code,
        account_name: material.name,
        account_type: 'expense',
        parent_account: '5100',
        smart_code: `HERA.${this.config.country}.ICECREAM.GL.COGS.${material.type}.v2`,
        normal_balance: 'debit',
        ifrs_fields: {
          statement_type: 'SPL',
          classification_1: 'Cost of Sales',
          classification_2: 'Direct Materials'
        }
      })
    })
    
    // Manufacturing overhead - Cold chain specific
    accounts.push({
      account_code: '5310',
      account_name: 'Factory Electricity - Refrigeration',
      account_type: 'expense',
      parent_account: '5300',
      description: 'Major cost driver for ice cream production',
      smart_code: `HERA.${this.config.country}.ICECREAM.GL.COGS.ELECTRICITY.v2`,
      normal_balance: 'debit'
    })
    
    accounts.push({
      account_code: '5313',
      account_name: 'Cold Chain Maintenance',
      account_type: 'expense',
      parent_account: '5300',
      smart_code: `HERA.${this.config.country}.ICECREAM.GL.COGS.COLDCHAIN.v2`,
      normal_balance: 'debit'
    })
    
    // Variances - Critical for ice cream
    accounts.push({
      account_code: '5412',
      account_name: 'Cold Chain Wastage',
      account_type: 'expense',
      parent_account: '5400',
      description: 'Melted products, temperature excursions',
      smart_code: `HERA.${this.config.country}.ICECREAM.GL.COGS.VARIANCE.WASTAGE.v2`,
      normal_balance: 'debit'
    })
    
    return accounts
  }

  private async createAccountHierarchy(accounts: any[]) {
    // Create parent-child relationships between accounts
    const accountMap = new Map(accounts.map(acc => [(acc.metadata as any)?.account_code, acc]))
    
    for (const account of accounts) {
      if ((account.metadata as any)?.parent_account) {
        const parent = accountMap.get(account.metadata.parent_account)
        if (parent) {
          await universalApi.createRelationship({
            from_entity_id: parent.id,
            to_entity_id: account.id,
            relationship_type: 'parent_of',
            organization_id: this.config.organizationId,
            smart_code: 'HERA.GL.HIERARCHY.PARENT_CHILD.v2'
          })
        }
      }
    }
  }

  private async setupAutoJournalRules() {
    // Define auto-journal rules for common ice cream transactions
    const rules = [
      {
        name: 'Ice Cream Retail Sale',
        trigger: 'HERA.REST.POS.TXN.SALE.v1',
        journal_entries: [
          { account: '1112', type: 'debit', amount: 'total_amount' },
          { account: '4110', type: 'credit', amount: 'base_amount' },
          { account: '2210', type: 'credit', amount: 'gst_amount' }
        ]
      },
      {
        name: 'Raw Material Purchase',
        trigger: 'HERA.SCM.PUR.TXN.GOODS_RECEIPT.v1',
        journal_entries: [
          { account: '1311', type: 'debit', amount: 'base_amount' },
          { account: '1410', type: 'debit', amount: 'gst_amount' },
          { account: '2111', type: 'credit', amount: 'total_amount' }
        ]
      },
      {
        name: 'Production Completion',
        trigger: 'HERA.MFG.PROD.TXN.COMPLETION.v1',
        journal_entries: [
          { account: '1331', type: 'debit', amount: 'total_cost' },
          { account: '1321', type: 'credit', amount: 'wip_cost' },
          { account: '5110', type: 'credit', amount: 'material_cost' },
          { account: '5210', type: 'credit', amount: 'labor_cost' }
        ]
      },
      {
        name: 'Cold Chain Wastage',
        trigger: 'HERA.INV.ADJ.TXN.WASTAGE.v1',
        journal_entries: [
          { account: '5412', type: 'debit', amount: 'wastage_cost' },
          { account: '1331', type: 'credit', amount: 'wastage_cost' }
        ]
      }
    ]
    
    // Store rules as entities with smart codes
    for (const rule of rules) {
      await universalApi.createEntity({
        entity_type: 'auto_journal_rule',
        entity_name: rule.name,
        organization_id: this.config.organizationId,
        smart_code: 'HERA.FIN.AUTO_JOURNAL.RULE.v2',
        metadata: rule
      })
    }
  }

  private generateLiabilityAccounts() {
    const accounts = []
    
    // GST accounts for India
    if (this.config.country === 'IN') {
      accounts.push({
        account_code: '2210',
        account_name: 'GST Output - 18%',
        account_type: 'liability',
        parent_account: '2200',
        gst_rate: '18%',
        smart_code: `HERA.IN.ICECREAM.GL.LIABILITY.GST.OUTPUT18.v2`,
        normal_balance: 'credit'
      })
      
      accounts.push({
        account_code: '2211',
        account_name: 'GST Output - 12%',
        account_type: 'liability',
        parent_account: '2200',
        gst_rate: '12%',
        description: 'For Kulfi and traditional products',
        smart_code: `HERA.IN.ICECREAM.GL.LIABILITY.GST.OUTPUT12.v2`,
        normal_balance: 'credit'
      })
    }
    
    return accounts
  }

  private generateEquityAccounts() {
    // Standard equity accounts
    return [
      {
        account_code: '3100',
        account_name: 'Share Capital',
        account_type: 'equity',
        parent_account: '3000',
        smart_code: `HERA.${this.config.country}.ICECREAM.GL.EQUITY.CAPITAL.v2`,
        normal_balance: 'credit'
      },
      {
        account_code: '3200',
        account_name: 'Retained Earnings',
        account_type: 'equity',
        parent_account: '3000',
        smart_code: `HERA.${this.config.country}.ICECREAM.GL.EQUITY.RETAINED.v2`,
        normal_balance: 'credit'
      }
    ]
  }

  private generateExpenseAccounts() {
    const accounts = []
    
    // Ice cream specific expenses
    accounts.push({
      account_code: '6114',
      account_name: 'Freezer Placement Program',
      account_type: 'expense',
      parent_account: '6100',
      description: 'Cost of placing freezers at retail locations',
      smart_code: `HERA.${this.config.country}.ICECREAM.GL.EXPENSE.FREEZER.PLACEMENT.v2`,
      normal_balance: 'debit'
    })
    
    accounts.push({
      account_code: '6213',
      account_name: 'Food License & Certifications',
      account_type: 'expense',
      parent_account: '6200',
      description: 'FSSAI license, ISO certifications',
      smart_code: `HERA.${this.config.country}.ICECREAM.GL.EXPENSE.LICENSE.v2`,
      normal_balance: 'debit'
    })
    
    return accounts
  }

  private generateOtherAccounts() {
    // Other income and expenses
    return [
      {
        account_code: '8100',
        account_name: 'Interest Income',
        account_type: 'revenue',
        parent_account: '8000',
        smart_code: `HERA.${this.config.country}.ICECREAM.GL.OTHER.INTEREST.INCOME.v2`,
        normal_balance: 'credit'
      }
    ]
  }
}

// Example usage
export async function setupIceCreamCOA(organizationId: string) {
  const generator = new IceCreamCOAGenerator({
    organizationId,
    organizationName: 'Kochi Refreshments Ice Cream Factory',
    country: 'IN',
    currency: 'INR',
    includeKulfi: true,
    multiLocation: true,
    exportBusiness: false
  })
  
  const result = await generator.generateCOA()
  console.log(`Created ${result.accountsCreated} accounts for ice cream business`)
  
  return result
}