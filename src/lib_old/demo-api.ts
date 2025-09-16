/**
 * Demo API Service
 * Simulates real API calls using demo data
 */

import { getDemoData, initializeDemoData, DEMO_ORG_ID } from './demo-data'

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class DemoApiService {
  private data: any

  constructor() {
    this.data = getDemoData() || initializeDemoData()
  }

  // Chart of Accounts
  async getChartOfAccounts() {
    await delay(300)
    return {
      success: true,
      data: this.data.chartOfAccounts.map((account: any) => ({
        id: `demo-coa-${account.code}`,
        organization_id: DEMO_ORG_ID,
        entity_type: 'account',
        business_rules: { ledger_type: 'GL' },
        entity_code: account.code,
        entity_name: account.name,
        status: 'active',
        dynamic_data: {
          account_type: account.type,
          account_subtype: account.subtype,
          current_balance: account.balance,
          normal_balance:
            account.type === 'asset' || account.type === 'expense' ? 'debit' : 'credit'
        }
      }))
    }
  }

  // Customers
  async getCustomers() {
    await delay(200)
    return {
      success: true,
      data: this.data.customers.map((customer: any) => ({
        id: customer.id,
        organization_id: DEMO_ORG_ID,
        entity_type: 'customer',
        entity_code: customer.code,
        entity_name: customer.name,
        status: customer.status,
        dynamic_data: {
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          contact_person: customer.contactPerson,
          credit_limit: customer.creditLimit,
          current_balance: customer.balance,
          payment_terms: customer.paymentTerms,
          tax_id: customer.taxId,
          customer_type: customer.type,
          notes: customer.notes
        }
      }))
    }
  }

  // Vendors
  async getVendors() {
    await delay(200)
    return {
      success: true,
      data: this.data.vendors.map((vendor: any) => ({
        id: vendor.id,
        organization_id: DEMO_ORG_ID,
        entity_type: 'vendor',
        entity_code: vendor.code,
        entity_name: vendor.name,
        status: vendor.status,
        dynamic_data: {
          email: vendor.email,
          phone: vendor.phone,
          address: vendor.address,
          contact_person: vendor.contactPerson,
          credit_limit: vendor.creditLimit,
          current_balance: vendor.balance,
          payment_terms: vendor.paymentTerms,
          tax_id: vendor.taxId,
          category: vendor.category,
          notes: vendor.notes
        }
      }))
    }
  }

  // Products
  async getProducts() {
    await delay(250)
    return {
      success: true,
      data: this.data.products.map((product: any) => ({
        id: product.id,
        organization_id: DEMO_ORG_ID,
        entity_type: 'product',
        entity_code: product.code,
        entity_name: product.name,
        status: product.isActive ? 'active' : 'inactive',
        dynamic_data: {
          category: product.category,
          price: product.price,
          cost: product.cost,
          unit: product.unit,
          stock_level: product.stockLevel,
          reorder_point: product.reorderPoint,
          description: product.description,
          tags: product.tags,
          nutrition_info: product.nutritionInfo,
          abv: product.abv
        }
      }))
    }
  }

  // Transactions
  async getTransactions(filters?: any) {
    await delay(300)
    let transactions = this.data.transactions

    if (filters?.type) {
      transactions = transactions.filter((t: any) => t.type === filters.type)
    }

    if (filters?.status) {
      transactions = transactions.filter((t: any) => t.status === filters.status)
    }

    if (filters?.dateFrom) {
      transactions = transactions.filter((t: any) => new Date(t.date) >= new Date(filters.dateFrom))
    }

    if (filters?.dateTo) {
      transactions = transactions.filter((t: any) => new Date(t.date) <= new Date(filters.dateTo))
    }

    return {
      success: true,
      data: transactions.map((trans: any) => ({
        id: trans.id,
        organization_id: DEMO_ORG_ID,
        transaction_type: trans.type,
        transaction_code: trans.number,
        transaction_date: trans.date,
        status: trans.status,
        total_amount: trans.total,
        metadata: {
          subtotal: trans.subtotal,
          tax: trans.tax,
          items: trans.items,
          payment_method: trans.paymentMethod,
          notes: trans.notes,
          customer_id: trans.customerId,
          vendor_id: trans.vendorId
        }
      }))
    }
  }

  // Dashboard KPIs
  async getDashboardKPIs() {
    await delay(200)
    return {
      success: true,
      data: this.data.kpis
    }
  }

  // Create new transaction
  async createTransaction(transaction: any) {
    await delay(500)
    const newTrans = {
      id: `demo-trans-${Date.now()}`,
      ...transaction,
      created_at: new Date().toISOString()
    }

    this.data.transactions.unshift(newTrans)

    // Update session storage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hera-demo-data', JSON.stringify(this.data))
    }

    return {
      success: true,
      data: newTrans
    }
  }

  // Update entity
  async updateEntity(entityType: string, entityId: string, updates: any) {
    await delay(300)

    // Find and update the entity
    let collection
    switch (entityType) {
      case 'customer':
        collection = this.data.customers
        break
      case 'vendor':
        collection = this.data.vendors
        break
      case 'product':
        collection = this.data.products
        break
      default:
        return { success: false, error: 'Invalid entity type' }
    }

    const index = collection.findIndex((item: any) => item.id === entityId)
    if (index !== -1) {
      collection[index] = { ...collection[index], ...updates }

      // Update session storage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('hera-demo-data', JSON.stringify(this.data))
      }

      return {
        success: true,
        data: collection[index]
      }
    }

    return { success: false, error: 'Entity not found' }
  }

  // Financial reports
  async getFinancialReport(reportType: string, params?: any) {
    await delay(400)

    switch (reportType) {
      case 'profit_loss':
        return this.generateProfitLossReport(params)
      case 'balance_sheet':
        return this.generateBalanceSheetReport(params)
      case 'cash_flow':
        return this.generateCashFlowReport(params)
      default:
        return { success: false, error: 'Invalid report type' }
    }
  }

  private generateProfitLossReport(params: any) {
    const revenue = this.data.chartOfAccounts
      .filter((acc: any) => acc.type === 'revenue')
      .reduce((sum: number, acc: any) => sum + Math.abs(acc.balance), 0)

    const cogs = this.data.chartOfAccounts
      .filter((acc: any) => acc.subtype === 'cogs')
      .reduce((sum: number, acc: any) => sum + acc.balance, 0)

    const expenses = this.data.chartOfAccounts
      .filter((acc: any) => acc.type === 'expense' && acc.subtype !== 'cogs')
      .reduce((sum: number, acc: any) => sum + acc.balance, 0)

    const grossProfit = revenue - cogs
    const netIncome = grossProfit - expenses

    return {
      success: true,
      data: {
        period: params?.period || 'YTD',
        revenue,
        cogs,
        grossProfit,
        grossMargin: ((grossProfit / revenue) * 100).toFixed(2) + '%',
        expenses,
        netIncome,
        netMargin: ((netIncome / revenue) * 100).toFixed(2) + '%'
      }
    }
  }

  private generateBalanceSheetReport(params: any) {
    const assets = this.data.chartOfAccounts
      .filter((acc: any) => acc.type === 'asset')
      .reduce((sum: number, acc: any) => sum + acc.balance, 0)

    const liabilities = this.data.chartOfAccounts
      .filter((acc: any) => acc.type === 'liability')
      .reduce((sum: number, acc: any) => sum + Math.abs(acc.balance), 0)

    const equity = this.data.chartOfAccounts
      .filter((acc: any) => acc.type === 'equity')
      .reduce((sum: number, acc: any) => sum + Math.abs(acc.balance), 0)

    return {
      success: true,
      data: {
        date: params?.date || new Date().toISOString().split('T')[0],
        assets,
        liabilities,
        equity,
        totalLiabilitiesAndEquity: liabilities + equity,
        isBalanced: Math.abs(assets - (liabilities + equity)) < 0.01
      }
    }
  }

  private generateCashFlowReport(params: any) {
    // Simplified cash flow calculation
    const operatingCashFlow = this.data.kpis.revenue.thisMonth * 0.2
    const investingCashFlow = -15000 // Equipment purchases
    const financingCashFlow = -8000 // Loan payments

    return {
      success: true,
      data: {
        period: params?.period || 'This Month',
        operatingActivities: operatingCashFlow,
        investingActivities: investingCashFlow,
        financingActivities: financingCashFlow,
        netCashFlow: operatingCashFlow + investingCashFlow + financingCashFlow,
        beginningCash: 120000,
        endingCash: 120000 + operatingCashFlow + investingCashFlow + financingCashFlow
      }
    }
  }
}

// Export singleton instance
export const demoApi = new DemoApiService()
