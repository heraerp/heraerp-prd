/**
 * GL Balance Validation Tests
 * Generated for: Purchasing Rebate Processing v1.0.0
 */

import { describe, it, expect } from 'vitest'

describe('GL Balance Validation', () => {
  describe('GL Transaction Structure', () => {
    const glTransactions = [
    {
        "transaction_type": "REBATE_ACCRUAL",
        "transaction_name": "Rebate Accrual",
        "description": "Periodic rebate accrual calculation and posting",
        "smart_code": "HERA.FINANCE.TXN.REBATE.ACCRUAL.MAIN.v1",
        "category": "finance",
        "lines": [
            {
                "name": "Rebate Expense",
                "description": "Rebate expense recognition",
                "required": true,
                "smart_code": "HERA.FINANCE.TXN.REBATE.ACCRUAL.LINE.EXPENSE.v1",
                "line_type": "GL",
                "account_type": "EXPENSE",
                "side": "DR"
            },
            {
                "name": "Rebate Liability",
                "description": "Rebate liability accrual",
                "required": true,
                "smart_code": "HERA.FINANCE.TXN.REBATE.ACCRUAL.LINE.LIABILITY.v1",
                "line_type": "GL",
                "account_type": "LIABILITY",
                "side": "CR"
            }
        ]
    },
    {
        "transaction_type": "REBATE_SETTLEMENT",
        "transaction_name": "Rebate Settlement",
        "description": "Final rebate settlement with vendor credit",
        "smart_code": "HERA.FINANCE.TXN.REBATE.SETTLEMENT.MAIN.v1",
        "category": "finance",
        "lines": [
            {
                "name": "Clear Liability",
                "description": "Clear accrued rebate liability",
                "required": true,
                "smart_code": "HERA.FINANCE.TXN.REBATE.SETTLEMENT.LINE.CLEAR_LIABILITY.v1",
                "line_type": "GL",
                "account_type": "LIABILITY",
                "side": "DR"
            },
            {
                "name": "Vendor Credit",
                "description": "Credit to vendor accounts payable",
                "required": true,
                "smart_code": "HERA.FINANCE.TXN.REBATE.SETTLEMENT.LINE.VENDOR_CREDIT.v1",
                "line_type": "GL",
                "account_type": "LIABILITY",
                "side": "CR"
            }
        ]
    }
]

    glTransactions.forEach(transaction => {
      describe(`GL Transaction: ${transaction.transaction_type}`, () => {
        const glLines = transaction.lines.filter(line => 
          line.line_type === 'GL' || line.smart_code.includes('.GL.')
        )

        it('should have GL lines with valid sides', () => {
          glLines.forEach(line => {
            expect(['DR', 'CR']).toContain(line.side)
            expect(line.side).toBeDefined()
          })
        })

        it('should have GL lines with account types', () => {
          glLines.forEach(line => {
            if (line.line_type === 'GL') {
              expect(line.account_type).toBeDefined()
              expect(typeof line.account_type).toBe('string')
            }
          })
        })

        it('GL lines should have proper smart codes', () => {
          glLines.forEach(line => {
            expect(line.smart_code).toContain('.GL.')
            expect(line.smart_code).toMatch(/^HERA\.[A-Z0-9_]+\.GL\.[A-Z0-9_]+\.v[0-9]+$/)
          })
        })
      })
    })
  })

  describe('Balance Enforcement Logic', () => {
    it('should validate DR equals CR per currency', () => {
      // Sample GL transaction data for testing
      const sampleTransactions = [
        {
          name: 'Balanced Sale Transaction',
          currency: 'AED',
          lines: [
            { side: 'DR', amount: 472.50, account: '110000', description: 'Cash' },
            { side: 'CR', amount: 450.00, account: '410000', description: 'Revenue' },
            { side: 'CR', amount: 22.50, account: '230000', description: 'VAT' }
          ],
          shouldBalance: true
        },
        {
          name: 'Imbalanced Transaction',
          currency: 'USD',
          lines: [
            { side: 'DR', amount: 1000.00, account: '110000', description: 'Cash' },
            { side: 'CR', amount: 900.00, account: '410000', description: 'Revenue' }
          ],
          shouldBalance: false
        },
        {
          name: 'Multi-currency Balanced',
          lines: [
            { side: 'DR', amount: 100.00, currency: 'USD', account: '110000' },
            { side: 'CR', amount: 100.00, currency: 'USD', account: '410000' },
            { side: 'DR', amount: 50.00, currency: 'EUR', account: '110001' },
            { side: 'CR', amount: 50.00, currency: 'EUR', account: '410001' }
          ],
          shouldBalance: true
        }
      ]

      sampleTransactions.forEach(txn => {
        const currencyTotals = new Map()

        txn.lines.forEach(line => {
          const currency = line.currency || txn.currency || 'USD'
          if (!currencyTotals.has(currency)) {
            currencyTotals.set(currency, { dr: 0, cr: 0 })
          }
          
          const totals = currencyTotals.get(currency)
          if (line.side === 'DR') {
            totals.dr += line.amount
          } else {
            totals.cr += line.amount
          }
        })

        // Check balance for each currency
        let isBalanced = true
        currencyTotals.forEach(totals => {
          const difference = Math.abs(totals.dr - totals.cr)
          if (difference > 0.01) { // Allow for rounding
            isBalanced = false
          }
        })

        if (txn.shouldBalance) {
          expect(isBalanced).toBe(true)
        } else {
          expect(isBalanced).toBe(false)
        }
      })
    })

    it('should handle rounding differences', () => {
      const lines = [
        { side: 'DR', amount: 33.33 },
        { side: 'DR', amount: 33.33 },
        { side: 'DR', amount: 33.34 },
        { side: 'CR', amount: 100.00 }
      ]

      let drTotal = 0
      let crTotal = 0

      lines.forEach(line => {
        if (line.side === 'DR') {
          drTotal += line.amount
        } else {
          crTotal += line.amount
        }
      })

      const difference = Math.abs(drTotal - crTotal)
      expect(difference).toBeLessThanOrEqual(0.01) // Should be within rounding tolerance
    })
  })

  describe('Michele\'s Salon Example (Real World)', () => {
    it('should validate Michele\'s Salon POS transaction', () => {
      // Real example from Michele's Salon
      const transaction = {
        description: 'Hair Treatment + Service Tax',
        currency: 'AED',
        lines: [
          {
            side: 'DR',
            amount: 472.50,
            account: '110000',
            description: 'Cash/Card Payment'
          },
          {
            side: 'CR', 
            amount: 450.00,
            account: '410000',
            description: 'Hair Treatment Revenue'
          },
          {
            side: 'CR',
            amount: 22.50,
            account: '230000', 
            description: '5% Service Tax'
          }
        ]
      }

      let drTotal = 0
      let crTotal = 0

      transaction.lines.forEach(line => {
        expect(['DR', 'CR']).toContain(line.side)
        expect(line.amount).toBeGreaterThan(0)
        expect(line.account).toMatch(/^[0-9]{6}$/) // 6-digit account codes

        if (line.side === 'DR') {
          drTotal += line.amount
        } else {
          crTotal += line.amount
        }
      })

      // Verify balance: DR 472.50 = CR (450.00 + 22.50)
      expect(drTotal).toBe(472.50)
      expect(crTotal).toBe(472.50)
      expect(Math.abs(drTotal - crTotal)).toBeLessThanOrEqual(0.01)
    })
  })

  
})