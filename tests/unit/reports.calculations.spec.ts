// ================================================================================
// UNIT TESTS - REPORTS CALCULATIONS
// Smart Code: HERA.TEST.REPORTS.CALCULATIONS.v1
// Validates math & grouping for sales summaries, P&L, and balance sheet
// ================================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  SalesRow, 
  PnLRow, 
  BalanceRow,
  ReportCalculations 
} from '@/lib/schemas/reports'

describe('ReportCalculations', () => {
  
  // ================================================================================
  // SALES CALCULATIONS TESTS
  // ================================================================================
  
  describe('calculateSalesTotals', () => {
    it('should calculate totals correctly for sales rows', () => {
      const salesRows: SalesRow[] = [
        {
          service_net: 1000,
          product_net: 500,
          tips: 50,
          vat: 75,
          gross: 1125,
          txn_count: 10,
          avg_ticket: 112.5
        },
        {
          service_net: 800,
          product_net: 300,
          tips: 40,
          vat: 55,
          gross: 895,
          txn_count: 8,
          avg_ticket: 111.875
        },
        {
          service_net: 600,
          product_net: 200,
          tips: 30,
          vat: 40,
          gross: 670,
          txn_count: 6,
          avg_ticket: 111.67
        }
      ]

      const totals = ReportCalculations.calculateSalesTotals(salesRows)

      expect(totals.service_net).toBe(2400)
      expect(totals.product_net).toBe(1000)
      expect(totals.tips).toBe(120)
      expect(totals.vat).toBe(170)
      expect(totals.gross).toBe(2690)
      expect(totals.txn_count).toBe(24)
    })

    it('should handle empty array', () => {
      const totals = ReportCalculations.calculateSalesTotals([])
      
      expect(totals.service_net).toBe(0)
      expect(totals.product_net).toBe(0)
      expect(totals.tips).toBe(0)
      expect(totals.vat).toBe(0)
      expect(totals.gross).toBe(0)
      expect(totals.txn_count).toBe(0)
    })

    it('should handle negative amounts correctly', () => {
      const salesRows: SalesRow[] = [
        {
          service_net: 1000,
          product_net: -100, // Refund
          tips: 50,
          vat: 45, // VAT on net amount (900 * 0.05)
          gross: 995,
          txn_count: 5,
          avg_ticket: 199
        }
      ]

      const totals = ReportCalculations.calculateSalesTotals(salesRows)

      expect(totals.service_net).toBe(1000)
      expect(totals.product_net).toBe(-100)
      expect(totals.vat).toBe(45)
      expect(totals.gross).toBe(995)
    })
  })

  // ================================================================================
  // P&L CALCULATIONS TESTS  
  // ================================================================================

  describe('calculatePnLSubtotals', () => {
    it('should calculate P&L subtotals correctly', () => {
      const pnlRows: PnLRow[] = [
        // Revenue (negative in accounting, positive for display)
        { account_code: '4100', account_name: 'Food Sales', group: 'revenue', amount: -50000, is_subtotal: false, level: 0 },
        { account_code: '4200', account_name: 'Beverage Sales', group: 'revenue', amount: -20000, is_subtotal: false, level: 0 },
        
        // COGS (positive expense)
        { account_code: '5100', account_name: 'Food Costs', group: 'cogs', amount: 15000, is_subtotal: false, level: 0 },
        { account_code: '5200', account_name: 'Beverage Costs', group: 'cogs', amount: 6000, is_subtotal: false, level: 0 },
        
        // Operating Expenses
        { account_code: '6100', account_name: 'Salaries', group: 'expenses', amount: 12000, is_subtotal: false, level: 0 },
        { account_code: '6200', account_name: 'Rent', group: 'expenses', amount: 8000, is_subtotal: false, level: 0 },
        
        // Other Income
        { account_code: '7100', account_name: 'Interest Income', group: 'other', amount: -500, is_subtotal: false, level: 0 },
        
        // Subtotal rows (should be ignored in calculation)
        { account_code: 'TOTAL', account_name: 'Total Revenue', group: 'revenue', amount: -70000, is_subtotal: true, level: 0 }
      ]

      const subtotals = ReportCalculations.calculatePnLSubtotals(pnlRows)

      expect(subtotals.revenue).toBe(70000) // Math.abs(-70000)
      expect(subtotals.cogs).toBe(21000) // 15000 + 6000
      expect(subtotals.expenses).toBe(20000) // 12000 + 8000
      expect(subtotals.other).toBe(-500) // Interest income
      expect(subtotals.gross_profit).toBe(49000) // 70000 - 21000
      expect(subtotals.operating_profit).toBe(29000) // 70000 - 21000 - 20000
      expect(subtotals.net_income).toBe(29500) // 70000 - 21000 - 20000 + (-500)
    })

    it('should handle empty P&L data', () => {
      const subtotals = ReportCalculations.calculatePnLSubtotals([])

      expect(subtotals.revenue).toBe(0)
      expect(subtotals.cogs).toBe(0) 
      expect(subtotals.expenses).toBe(0)
      expect(subtotals.other).toBe(0)
      expect(subtotals.gross_profit).toBe(0)
      expect(subtotals.operating_profit).toBe(0)
      expect(subtotals.net_income).toBe(0)
    })

    it('should handle mixed positive/negative amounts', () => {
      const pnlRows: PnLRow[] = [
        { account_code: '4100', account_name: 'Sales', group: 'revenue', amount: -100000, is_subtotal: false, level: 0 },
        { account_code: '4200', account_name: 'Sales Returns', group: 'revenue', amount: 5000, is_subtotal: false, level: 0 }, // Returns reduce revenue
        { account_code: '5100', account_name: 'COGS', group: 'cogs', amount: 30000, is_subtotal: false, level: 0 },
        { account_code: '6100', account_name: 'Expenses', group: 'expenses', amount: 25000, is_subtotal: false, level: 0 }
      ]

      const subtotals = ReportCalculations.calculatePnLSubtotals(pnlRows)

      expect(subtotals.revenue).toBe(95000) // Math.abs(-100000 + 5000)
      expect(subtotals.gross_profit).toBe(65000) // 95000 - 30000
      expect(subtotals.net_income).toBe(40000) // 95000 - 30000 - 25000
    })
  })

  // ================================================================================
  // BALANCE SHEET VALIDATION TESTS
  // ================================================================================

  describe('validateBalanceEquation', () => {
    it('should validate balanced balance sheet', () => {
      const balanceRows: BalanceRow[] = [
        // Assets
        { account_code: '1100', account_name: 'Cash', group: 'assets', amount: 50000, is_subtotal: false, level: 0 },
        { account_code: '1200', account_name: 'Accounts Receivable', group: 'assets', amount: 25000, is_subtotal: false, level: 0 },
        
        // Liabilities  
        { account_code: '2100', account_name: 'Accounts Payable', group: 'liabilities', amount: 15000, is_subtotal: false, level: 0 },
        { account_code: '2200', account_name: 'Loans Payable', group: 'liabilities', amount: 30000, is_subtotal: false, level: 0 },
        
        // Equity
        { account_code: '3100', account_name: 'Owner Equity', group: 'equity', amount: 30000, is_subtotal: false, level: 0 },
        
        // Subtotal rows (should be ignored)
        { account_code: 'TOTAL_ASSETS', account_name: 'Total Assets', group: 'assets', amount: 75000, is_subtotal: true, level: 0 }
      ]

      const validation = ReportCalculations.validateBalanceEquation(balanceRows, 0.01)

      expect(validation.is_balanced).toBe(true)
      expect(validation.difference).toBe(0)
      expect(validation.assets).toBe(75000)
      expect(validation.liabilities).toBe(45000)
      expect(validation.equity).toBe(30000)
    })

    it('should detect unbalanced balance sheet', () => {
      const balanceRows: BalanceRow[] = [
        { account_code: '1100', account_name: 'Cash', group: 'assets', amount: 100000, is_subtotal: false, level: 0 },
        { account_code: '2100', account_name: 'Accounts Payable', group: 'liabilities', amount: 30000, is_subtotal: false, level: 0 },
        { account_code: '3100', account_name: 'Owner Equity', group: 'equity', amount: 65000, is_subtotal: false, level: 0 }
      ]

      const validation = ReportCalculations.validateBalanceEquation(balanceRows, 0.01)

      expect(validation.is_balanced).toBe(false)
      expect(validation.difference).toBe(5000) // 100000 - (30000 + 65000)
      expect(validation.assets).toBe(100000)
      expect(validation.liabilities).toBe(30000)
      expect(validation.equity).toBe(65000)
    })

    it('should handle tolerance correctly', () => {
      const balanceRows: BalanceRow[] = [
        { account_code: '1100', account_name: 'Cash', group: 'assets', amount: 100000.50, is_subtotal: false, level: 0 },
        { account_code: '2100', account_name: 'Accounts Payable', group: 'liabilities', amount: 40000.25, is_subtotal: false, level: 0 },
        { account_code: '3100', account_name: 'Owner Equity', group: 'equity', amount: 60000.24, is_subtotal: false, level: 0 }
      ]

      // Should be balanced within 0.01 tolerance (difference = 0.01)
      const validation1 = ReportCalculations.validateBalanceEquation(balanceRows, 0.01)
      expect(validation1.is_balanced).toBe(true)

      // Should be unbalanced with stricter tolerance  
      const validation2 = ReportCalculations.validateBalanceEquation(balanceRows, 0.001)
      expect(validation2.is_balanced).toBe(false)
    })
  })

  // ================================================================================
  // SALES MIX CALCULATIONS
  // ================================================================================

  describe('calculateSalesMix', () => {
    it('should calculate service/product mix percentages', () => {
      const mix = ReportCalculations.calculateSalesMix(7500, 2500) // 10000 total

      expect(mix.service_percent).toBe(75.00)
      expect(mix.product_percent).toBe(25.00)
    })

    it('should handle zero total correctly', () => {
      const mix = ReportCalculations.calculateSalesMix(0, 0)

      expect(mix.service_percent).toBe(0)
      expect(mix.product_percent).toBe(0)
    })

    it('should handle service-only sales', () => {
      const mix = ReportCalculations.calculateSalesMix(5000, 0)

      expect(mix.service_percent).toBe(100.00)
      expect(mix.product_percent).toBe(0)
    })

    it('should handle product-only sales', () => {
      const mix = ReportCalculations.calculateSalesMix(0, 3000)

      expect(mix.service_percent).toBe(0)
      expect(mix.product_percent).toBe(100.00)
    })

    it('should round percentages to 2 decimal places', () => {
      const mix = ReportCalculations.calculateSalesMix(3333, 6667) // Should be 33.33% and 66.67%

      expect(mix.service_percent).toBe(33.33)
      expect(mix.product_percent).toBe(66.67)
    })
  })

  // ================================================================================
  // CURRENCY FORMATTING TESTS
  // ================================================================================

  describe('formatCurrency', () => {
    it('should format AED currency correctly', () => {
      const formatted = ReportCalculations.formatCurrency(1234.56, 'AED', 'en-AE')
      
      // Note: Exact format depends on browser locale support
      expect(formatted).toContain('1,234.56')
      expect(formatted.length).toBeGreaterThan(7) // Should include currency symbol
    })

    it('should format USD currency correctly', () => {
      const formatted = ReportCalculations.formatCurrency(1234.56, 'USD', 'en-US')
      
      expect(formatted).toContain('1,234.56')
      expect(formatted).toMatch(/\$.*1,234\.56/) // Should contain $ symbol
    })

    it('should handle negative amounts', () => {
      const formatted = ReportCalculations.formatCurrency(-500.25, 'AED', 'en-AE')
      
      expect(formatted).toContain('500.25')
      expect(formatted).toMatch(/-.*500\.25|.*500\.25.*-/) // Negative sign somewhere
    })

    it('should handle zero amounts', () => {
      const formatted = ReportCalculations.formatCurrency(0, 'AED', 'en-AE')
      
      expect(formatted).toContain('0.00')
    })

    it('should handle large amounts', () => {
      const formatted = ReportCalculations.formatCurrency(1234567.89, 'AED', 'en-AE')
      
      expect(formatted).toContain('1,234,567.89')
    })
  })

  // ================================================================================
  // PERCENTAGE CALCULATION TESTS
  // ================================================================================

  describe('calculatePercentage', () => {
    it('should calculate percentages correctly', () => {
      expect(ReportCalculations.calculatePercentage(25, 100)).toBe(25.00)
      expect(ReportCalculations.calculatePercentage(1, 3)).toBe(33.33)
      expect(ReportCalculations.calculatePercentage(2, 3)).toBe(66.67)
    })

    it('should handle zero denominator safely', () => {
      expect(ReportCalculations.calculatePercentage(50, 0)).toBe(0)
    })

    it('should handle negative numbers', () => {
      expect(ReportCalculations.calculatePercentage(-25, 100)).toBe(-25.00)
      expect(ReportCalculations.calculatePercentage(25, -100)).toBe(-25.00)
      expect(ReportCalculations.calculatePercentage(-25, -100)).toBe(25.00)
    })

    it('should respect decimal places parameter', () => {
      expect(ReportCalculations.calculatePercentage(1, 3, 0)).toBe(33)
      expect(ReportCalculations.calculatePercentage(1, 3, 1)).toBe(33.3)
      expect(ReportCalculations.calculatePercentage(1, 3, 3)).toBe(33.333)
    })
  })

  // ================================================================================
  // INTEGRATION TESTS - REAL WORLD SCENARIOS
  // ================================================================================

  describe('Real World Scenarios', () => {
    it('should handle complete daily sales calculation', () => {
      // Hair Talkz Salon - typical busy day
      const dailySales: SalesRow[] = [
        { hour: '09:00', service_net: 450, product_net: 75, tips: 45, vat: 26.25, gross: 551.25, txn_count: 3, avg_ticket: 183.75 },
        { hour: '10:00', service_net: 600, product_net: 100, tips: 60, vat: 35, gross: 735, txn_count: 4, avg_ticket: 183.75 },
        { hour: '11:00', service_net: 750, product_net: 125, tips: 75, vat: 43.75, gross: 918.75, txn_count: 5, avg_ticket: 183.75 },
        { hour: '14:00', service_net: 900, product_net: 150, tips: 90, vat: 52.5, gross: 1102.5, txn_count: 6, avg_ticket: 183.75 },
        { hour: '15:00', service_net: 675, product_net: 125, tips: 70, vat: 40, gross: 840, txn_count: 4, avg_ticket: 210 }
      ]

      const totals = ReportCalculations.calculateSalesTotals(dailySales)
      const mix = ReportCalculations.calculateSalesMix(totals.service_net, totals.product_net)

      expect(totals.service_net).toBe(3375) // Sum of all service revenue
      expect(totals.product_net).toBe(575) // Sum of all product revenue  
      expect(totals.tips).toBe(340) // Sum of all tips
      expect(totals.vat).toBe(197.5) // Sum of all VAT
      expect(totals.gross).toBe(4147.5) // Total gross revenue
      expect(totals.txn_count).toBe(22) // Total transactions

      expect(mix.service_percent).toBe(85.44) // Service mix %
      expect(mix.product_percent).toBe(14.56) // Product mix %
    })

    it('should handle complete P&L calculation for small business', () => {
      // Restaurant P&L - Monthly
      const pnlData: PnLRow[] = [
        // Revenue
        { account_code: '4100', account_name: 'Food Sales', group: 'revenue', amount: -85000, is_subtotal: false, level: 1 },
        { account_code: '4200', account_name: 'Beverage Sales', group: 'revenue', amount: -25000, is_subtotal: false, level: 1 },
        { account_code: '4300', account_name: 'Delivery Fees', group: 'revenue', amount: -5000, is_subtotal: false, level: 1 },
        
        // COGS  
        { account_code: '5100', account_name: 'Food Costs', group: 'cogs', amount: 28000, is_subtotal: false, level: 1 },
        { account_code: '5200', account_name: 'Beverage Costs', group: 'cogs', amount: 8000, is_subtotal: false, level: 1 },
        
        // Operating Expenses
        { account_code: '6100', account_name: 'Staff Salaries', group: 'expenses', amount: 22000, is_subtotal: false, level: 1 },
        { account_code: '6200', account_name: 'Rent', group: 'expenses', amount: 12000, is_subtotal: false, level: 1 },
        { account_code: '6300', account_name: 'Utilities', group: 'expenses', amount: 3500, is_subtotal: false, level: 1 },
        { account_code: '6400', account_name: 'Marketing', group: 'expenses', amount: 2500, is_subtotal: false, level: 1 },
        { account_code: '6500', account_name: 'Insurance', group: 'expenses', amount: 1500, is_subtotal: false, level: 1 },
        
        // Other
        { account_code: '7100', account_name: 'Interest Income', group: 'other', amount: -200, is_subtotal: false, level: 1 },
        { account_code: '8100', account_name: 'Interest Expense', group: 'other', amount: 800, is_subtotal: false, level: 1 }
      ]

      const subtotals = ReportCalculations.calculatePnLSubtotals(pnlData)

      expect(subtotals.revenue).toBe(115000) // Total revenue
      expect(subtotals.cogs).toBe(36000) // Total COGS
      expect(subtotals.gross_profit).toBe(79000) // Revenue - COGS
      expect(subtotals.expenses).toBe(41500) // Total operating expenses
      expect(subtotals.operating_profit).toBe(37500) // Gross profit - expenses
      expect(subtotals.other).toBe(600) // Net other expense (800 - 200)
      expect(subtotals.net_income).toBe(36900) // Operating profit - other expenses

      // Calculate margins
      const grossMargin = ReportCalculations.calculatePercentage(subtotals.gross_profit, subtotals.revenue, 1)
      const operatingMargin = ReportCalculations.calculatePercentage(subtotals.operating_profit, subtotals.revenue, 1)
      const netMargin = ReportCalculations.calculatePercentage(subtotals.net_income, subtotals.revenue, 1)

      expect(grossMargin).toBe(68.7) // 79000/115000
      expect(operatingMargin).toBe(32.6) // 37500/115000
      expect(netMargin).toBe(32.1) // 36900/115000
    })

    it('should validate complete balance sheet for small business', () => {
      // Hair Talkz Salon - Balance sheet
      const balanceSheet: BalanceRow[] = [
        // Current Assets
        { account_code: '1100', account_name: 'Cash in Bank', group: 'assets', amount: 45000, is_subtotal: false, level: 1 },
        { account_code: '1200', account_name: 'Accounts Receivable', group: 'assets', amount: 8500, is_subtotal: false, level: 1 },
        { account_code: '1300', account_name: 'Inventory - Products', group: 'assets', amount: 12000, is_subtotal: false, level: 1 },
        { account_code: '1400', account_name: 'Prepaid Expenses', group: 'assets', amount: 3500, is_subtotal: false, level: 1 },
        
        // Fixed Assets
        { account_code: '1500', account_name: 'Salon Equipment', group: 'assets', amount: 85000, is_subtotal: false, level: 1 },
        { account_code: '1600', account_name: 'Furniture & Fixtures', group: 'assets', amount: 25000, is_subtotal: false, level: 1 },
        { account_code: '1700', account_name: 'Accumulated Depreciation', group: 'assets', amount: -15000, is_subtotal: false, level: 1 },
        
        // Current Liabilities
        { account_code: '2100', account_name: 'Accounts Payable', group: 'liabilities', amount: 8500, is_subtotal: false, level: 1 },
        { account_code: '2200', account_name: 'Accrued Salaries', group: 'liabilities', amount: 5500, is_subtotal: false, level: 1 },
        { account_code: '2300', account_name: 'VAT Payable', group: 'liabilities', amount: 3200, is_subtotal: false, level: 1 },
        
        // Long-term Liabilities
        { account_code: '2500', account_name: 'Equipment Loan', group: 'liabilities', amount: 35000, is_subtotal: false, level: 1 },
        
        // Equity
        { account_code: '3100', account_name: 'Owner Capital', group: 'equity', amount: 75000, is_subtotal: false, level: 1 },
        { account_code: '3200', account_name: 'Retained Earnings', group: 'equity', amount: 36800, is_subtotal: false, level: 1 }
      ]

      const validation = ReportCalculations.validateBalanceEquation(balanceSheet, 1.00)

      expect(validation.assets).toBe(164000) // Total assets
      expect(validation.liabilities).toBe(52200) // Total liabilities
      expect(validation.equity).toBe(111800) // Total equity
      expect(validation.is_balanced).toBe(true)
      expect(validation.difference).toBe(0)

      // Calculate financial ratios
      const currentAssets = 45000 + 8500 + 12000 + 3500 // 69000
      const currentLiabilities = 8500 + 5500 + 3200 // 17200
      const currentRatio = currentAssets / currentLiabilities

      expect(Math.round(currentRatio * 100) / 100).toBe(4.01) // Excellent liquidity

      const debtToEquity = validation.liabilities / validation.equity
      expect(Math.round(debtToEquity * 100) / 100).toBe(0.47) // Conservative debt level
    })
  })
})

// ================================================================================
// EDGE CASES AND ERROR HANDLING
// ================================================================================

describe('Edge Cases and Error Handling', () => {
  
  it('should handle very large numbers without overflow', () => {
    const largeSales: SalesRow[] = [
      {
        service_net: 999999999,
        product_net: 888888888,
        tips: 77777777,
        vat: 94444444,
        gross: 2060110308,
        txn_count: 1000000,
        avg_ticket: 2060.11
      }
    ]

    const totals = ReportCalculations.calculateSalesTotals(largeSales)
    expect(totals.gross).toBe(2060110308)
    expect(totals.txn_count).toBe(1000000)
  })

  it('should handle very small decimal amounts', () => {
    const microSales: SalesRow[] = [
      {
        service_net: 0.01,
        product_net: 0.02,
        tips: 0.001,
        vat: 0.0015,
        gross: 0.0315,
        txn_count: 1,
        avg_ticket: 0.0315
      }
    ]

    const totals = ReportCalculations.calculateSalesTotals(microSales)
    expect(totals.service_net).toBe(0.01)
    expect(totals.product_net).toBe(0.02)
    expect(totals.vat).toBe(0.0015)
  })

  it('should handle mixed currencies in formatting', () => {
    // Test various currency formatting
    const currencies = ['AED', 'USD', 'EUR', 'GBP', 'SAR']
    const amount = 1234.56

    currencies.forEach(currency => {
      const formatted = ReportCalculations.formatCurrency(amount, currency)
      expect(formatted).toContain('1,234.56')
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(8)
    })
  })
})