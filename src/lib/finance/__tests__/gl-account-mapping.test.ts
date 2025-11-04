/**
 * GL Account Mapping Tests
 * Verifies expense category to GL account mappings and line generation
 */

import {
  GL_ACCOUNTS,
  EXPENSE_CATEGORY_TO_GL,
  PAYMENT_METHOD_TO_GL,
  getExpenseGLAccount,
  getPaymentGLAccount,
  generateExpenseGLLines
} from '../gl-account-mapping'

describe('GL Account Mapping', () => {
  describe('GL_ACCOUNTS', () => {
    it('should have all expense accounts defined', () => {
      expect(GL_ACCOUNTS['6100']).toBeDefined()
      expect(GL_ACCOUNTS['6100'].name).toBe('Rent Expense')
      expect(GL_ACCOUNTS['6100'].type).toBe('expense')
      expect(GL_ACCOUNTS['6100'].code).toBe('6100')
    })

    it('should have all asset accounts defined', () => {
      expect(GL_ACCOUNTS['1000']).toBeDefined()
      expect(GL_ACCOUNTS['1000'].name).toBe('Cash on Hand')
      expect(GL_ACCOUNTS['1000'].type).toBe('asset')
      expect(GL_ACCOUNTS['1000'].code).toBe('1000')
    })

    it('should have smart codes for all accounts', () => {
      Object.values(GL_ACCOUNTS).forEach(account => {
        expect(account.smart_code).toMatch(/^HERA\.FINANCE\.GL\.ACCOUNT\.\w+\.\w+\.v1$/)
      })
    })
  })

  describe('Category Mappings', () => {
    it('should map all expense categories to GL accounts', () => {
      const categories = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Inventory', 'Maintenance', 'Other']

      categories.forEach(category => {
        expect(EXPENSE_CATEGORY_TO_GL[category]).toBeDefined()
        expect(GL_ACCOUNTS[EXPENSE_CATEGORY_TO_GL[category]]).toBeDefined()
      })
    })

    it('should map all payment methods to GL accounts', () => {
      const paymentMethods = ['Cash', 'Bank Transfer', 'Card', 'Other']

      paymentMethods.forEach(method => {
        expect(PAYMENT_METHOD_TO_GL[method]).toBeDefined()
        expect(GL_ACCOUNTS[PAYMENT_METHOD_TO_GL[method]]).toBeDefined()
      })
    })
  })

  describe('getExpenseGLAccount', () => {
    it('should return correct GL account for Rent', () => {
      const account = getExpenseGLAccount('Rent')
      expect(account).toBeDefined()
      expect(account?.code).toBe('6100')
      expect(account?.name).toBe('Rent Expense')
      expect(account?.type).toBe('expense')
    })

    it('should return null for invalid category', () => {
      const account = getExpenseGLAccount('InvalidCategory')
      expect(account).toBeNull()
    })

    it('should handle all valid categories', () => {
      const categories = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Inventory', 'Maintenance', 'Other']

      categories.forEach(category => {
        const account = getExpenseGLAccount(category)
        expect(account).toBeDefined()
        expect(account?.type).toBe('expense')
      })
    })
  })

  describe('getPaymentGLAccount', () => {
    it('should return correct GL account for Cash', () => {
      const account = getPaymentGLAccount('Cash')
      expect(account).toBeDefined()
      expect(account?.code).toBe('1000')
      expect(account?.name).toBe('Cash on Hand')
      expect(account?.type).toBe('asset')
    })

    it('should return null for invalid payment method', () => {
      const account = getPaymentGLAccount('InvalidMethod')
      expect(account).toBeNull()
    })

    it('should handle all valid payment methods', () => {
      const methods = ['Cash', 'Bank Transfer', 'Card', 'Other']

      methods.forEach(method => {
        const account = getPaymentGLAccount(method)
        expect(account).toBeDefined()
        expect(account?.type).toBe('asset')
      })
    })
  })

  describe('generateExpenseGLLines', () => {
    it('should generate balanced DR/CR lines for rent expense', () => {
      const lines = generateExpenseGLLines('Rent', 'Bank Transfer', 5000)

      expect(lines).toHaveLength(2)

      // DR: Rent Expense
      expect(lines[0].line_number).toBe(1)
      expect(lines[0].line_type).toBe('GL')
      expect(lines[0].line_amount).toBe(5000)
      expect(lines[0].line_data.side).toBe('DR')
      expect(lines[0].line_data.account_code).toBe('6100')
      expect(lines[0].line_data.account_name).toBe('Rent Expense')

      // CR: Bank Account
      expect(lines[1].line_number).toBe(2)
      expect(lines[1].line_type).toBe('GL')
      expect(lines[1].line_amount).toBe(5000)
      expect(lines[1].line_data.side).toBe('CR')
      expect(lines[1].line_data.account_code).toBe('1020')
      expect(lines[1].line_data.account_name).toBe('Bank Account')
    })

    it('should include cost center when provided', () => {
      const lines = generateExpenseGLLines('Marketing', 'Cash', 1000, 'branch-001')

      expect(lines[0].line_data.cost_center).toBe('branch-001')
      expect(lines[1].line_data.cost_center).toBeUndefined()
    })

    it('should throw error for invalid category', () => {
      expect(() => {
        generateExpenseGLLines('InvalidCategory', 'Cash', 1000)
      }).toThrow('Invalid category')
    })

    it('should throw error for invalid payment method', () => {
      expect(() => {
        generateExpenseGLLines('Rent', 'InvalidMethod', 1000)
      }).toThrow('Invalid category')
    })

    it('should handle all category and payment method combinations', () => {
      const categories = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Inventory', 'Maintenance', 'Other']
      const methods = ['Cash', 'Bank Transfer', 'Card', 'Other']

      categories.forEach(category => {
        methods.forEach(method => {
          const lines = generateExpenseGLLines(category, method, 1000)

          expect(lines).toHaveLength(2)
          expect(lines[0].line_data.side).toBe('DR')
          expect(lines[1].line_data.side).toBe('CR')
          expect(lines[0].line_amount).toBe(lines[1].line_amount)
        })
      })
    })

    it('should generate different GL accounts for different categories', () => {
      const rentLines = generateExpenseGLLines('Rent', 'Cash', 1000)
      const utilitiesLines = generateExpenseGLLines('Utilities', 'Cash', 1000)

      expect(rentLines[0].line_data.account_code).not.toBe(utilitiesLines[0].line_data.account_code)
      expect(rentLines[0].line_data.account_code).toBe('6100')
      expect(utilitiesLines[0].line_data.account_code).toBe('6200')
    })

    it('should generate different GL accounts for different payment methods', () => {
      const cashLines = generateExpenseGLLines('Rent', 'Cash', 1000)
      const bankLines = generateExpenseGLLines('Rent', 'Bank Transfer', 1000)

      expect(cashLines[1].line_data.account_code).not.toBe(bankLines[1].line_data.account_code)
      expect(cashLines[1].line_data.account_code).toBe('1000')
      expect(bankLines[1].line_data.account_code).toBe('1020')
    })
  })
})
