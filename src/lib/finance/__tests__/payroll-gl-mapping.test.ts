/**
 * Payroll GL Account Mapping Tests
 * Verifies payroll GL account mappings and line generation
 */

import {
  PAYROLL_GL_ACCOUNTS,
  PAYROLL_PAYMENT_METHOD_TO_GL,
  getPayrollPaymentGLAccount,
  generatePayrollGLLines,
  generatePayrollSmartCode,
  validatePayrollTransaction,
  type PayrollLineItem
} from '../payroll-gl-mapping'

describe('Payroll GL Account Mapping', () => {
  describe('PAYROLL_GL_ACCOUNTS', () => {
    it('should have all payroll accounts defined', () => {
      expect(PAYROLL_GL_ACCOUNTS['6300']).toBeDefined()
      expect(PAYROLL_GL_ACCOUNTS['6300'].name).toBe('Salaries and Wages')
      expect(PAYROLL_GL_ACCOUNTS['6300'].type).toBe('expense')
      expect(PAYROLL_GL_ACCOUNTS['6300'].code).toBe('6300')
    })

    it('should have all asset accounts defined', () => {
      expect(PAYROLL_GL_ACCOUNTS['1000']).toBeDefined()
      expect(PAYROLL_GL_ACCOUNTS['1000'].name).toBe('Cash on Hand')
      expect(PAYROLL_GL_ACCOUNTS['1000'].type).toBe('asset')
    })

    it('should have liability accounts defined', () => {
      expect(PAYROLL_GL_ACCOUNTS['220000']).toBeDefined()
      expect(PAYROLL_GL_ACCOUNTS['220000'].name).toBe('Tax Payable (Income Tax)')
      expect(PAYROLL_GL_ACCOUNTS['220000'].type).toBe('liability')

      expect(PAYROLL_GL_ACCOUNTS['240000']).toBeDefined()
      expect(PAYROLL_GL_ACCOUNTS['240000'].name).toBe('Tips Payable to Staff')
      expect(PAYROLL_GL_ACCOUNTS['240000'].type).toBe('liability')
    })

    it('should have smart codes in HERA format', () => {
      Object.values(PAYROLL_GL_ACCOUNTS).forEach(account => {
        expect(account.smart_code).toMatch(/^HERA\.SALON\.FINANCE\.GL\.ACCOUNT\.\w+\.\w+\.v1$/)
      })
    })
  })

  describe('Payment Method Mappings', () => {
    it('should map all payment methods to GL accounts', () => {
      const paymentMethods = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE']

      paymentMethods.forEach(method => {
        expect(PAYROLL_PAYMENT_METHOD_TO_GL[method]).toBeDefined()
        expect(PAYROLL_GL_ACCOUNTS[PAYROLL_PAYMENT_METHOD_TO_GL[method] as keyof typeof PAYROLL_GL_ACCOUNTS]).toBeDefined()
      })
    })
  })

  describe('getPayrollPaymentGLAccount', () => {
    it('should return correct GL account for BANK_TRANSFER', () => {
      const account = getPayrollPaymentGLAccount('BANK_TRANSFER')
      expect(account).toBeDefined()
      expect(account?.code).toBe('1020')
      expect(account?.name).toBe('Bank Account')
      expect(account?.type).toBe('asset')
    })

    it('should return null for invalid payment method', () => {
      const account = getPayrollPaymentGLAccount('INVALID_METHOD')
      expect(account).toBeNull()
    })

    it('should handle all valid payment methods', () => {
      const methods = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE']

      methods.forEach(method => {
        const account = getPayrollPaymentGLAccount(method)
        expect(account).toBeDefined()
        expect(account?.type).toBe('asset')
      })
    })
  })

  describe('generatePayrollGLLines', () => {
    it('should generate balanced DR/CR lines for simple salary', () => {
      const payrollLines: PayrollLineItem[] = [
        {
          staff_entity_id: 'staff-1',
          staff_name: 'John Doe',
          component_type: 'BASIC_SALARY',
          gross_amount: 10000,
          tax_amount: 0,
          net_amount: 10000
        }
      ]

      const lines = generatePayrollGLLines(payrollLines, 'BANK_TRANSFER', false)

      expect(lines).toHaveLength(2)

      // DR: Salaries and Wages
      expect(lines[0].line_number).toBe(1)
      expect(lines[0].line_type).toBe('GL')
      expect(lines[0].line_amount).toBe(10000)
      expect(lines[0].line_data?.side).toBe('DR')
      expect(lines[0].line_data?.account_code).toBe('6300')
      expect(lines[0].line_data?.account_name).toBe('Salaries and Wages')

      // CR: Bank Account
      expect(lines[1].line_number).toBe(2)
      expect(lines[1].line_type).toBe('GL')
      expect(lines[1].line_amount).toBe(10000)
      expect(lines[1].line_data?.side).toBe('CR')
      expect(lines[1].line_data?.account_code).toBe('1020')
      expect(lines[1].line_data?.account_name).toBe('Bank Account')
    })

    it('should generate balanced DR/CR lines with tax withholding', () => {
      const payrollLines: PayrollLineItem[] = [
        {
          staff_entity_id: 'staff-1',
          staff_name: 'John Doe',
          component_type: 'BASIC_SALARY',
          gross_amount: 10000,
          tax_amount: 1000,
          net_amount: 9000
        }
      ]

      const lines = generatePayrollGLLines(payrollLines, 'BANK_TRANSFER', false)

      expect(lines).toHaveLength(3)

      // DR: Salaries and Wages
      expect(lines[0].line_amount).toBe(10000)
      expect(lines[0].line_data?.side).toBe('DR')
      expect(lines[0].line_data?.account_code).toBe('6300')

      // CR: Bank Account (net pay)
      expect(lines[1].line_amount).toBe(9000)
      expect(lines[1].line_data?.side).toBe('CR')
      expect(lines[1].line_data?.account_code).toBe('1020')

      // CR: Tax Payable
      expect(lines[2].line_amount).toBe(1000)
      expect(lines[2].line_data?.side).toBe('CR')
      expect(lines[2].line_data?.account_code).toBe('220000')
    })

    it('should generate balanced DR/CR lines with tips payout', () => {
      const payrollLines: PayrollLineItem[] = [
        {
          staff_entity_id: 'staff-1',
          staff_name: 'John Doe',
          component_type: 'BASIC_SALARY',
          gross_amount: 10000,
          tax_amount: 0,
          net_amount: 10000
        },
        {
          staff_entity_id: 'staff-1',
          staff_name: 'John Doe',
          component_type: 'TIPS_PAYOUT',
          gross_amount: 500,
          tax_amount: 0,
          net_amount: 500
        }
      ]

      const lines = generatePayrollGLLines(payrollLines, 'BANK_TRANSFER', true)

      expect(lines).toHaveLength(3)

      // DR: Salaries and Wages (10000)
      expect(lines[0].line_amount).toBe(10000)
      expect(lines[0].line_data?.side).toBe('DR')

      // CR: Bank Account (10500 total)
      expect(lines[1].line_amount).toBe(10500)
      expect(lines[1].line_data?.side).toBe('CR')

      // DR: Tips Payable (reduces liability)
      expect(lines[2].line_amount).toBe(500)
      expect(lines[2].line_data?.side).toBe('DR')
      expect(lines[2].line_data?.account_code).toBe('240000')
    })

    it('should handle multiple staff members', () => {
      const payrollLines: PayrollLineItem[] = [
        {
          staff_entity_id: 'staff-1',
          staff_name: 'John Doe',
          component_type: 'BASIC_SALARY',
          gross_amount: 10000,
          tax_amount: 1000,
          net_amount: 9000
        },
        {
          staff_entity_id: 'staff-2',
          staff_name: 'Jane Smith',
          component_type: 'BASIC_SALARY',
          gross_amount: 12000,
          tax_amount: 1200,
          net_amount: 10800
        }
      ]

      const lines = generatePayrollGLLines(payrollLines, 'BANK_TRANSFER', false)

      expect(lines).toHaveLength(3)

      // DR: Salaries and Wages (22000 total)
      expect(lines[0].line_amount).toBe(22000)
      expect(lines[0].line_data?.side).toBe('DR')

      // CR: Bank Account (19800 total net)
      expect(lines[1].line_amount).toBe(19800)
      expect(lines[1].line_data?.side).toBe('CR')

      // CR: Tax Payable (2200 total)
      expect(lines[2].line_amount).toBe(2200)
      expect(lines[2].line_data?.side).toBe('CR')
    })

    it('should throw error for invalid payment method', () => {
      const payrollLines: PayrollLineItem[] = [
        {
          staff_entity_id: 'staff-1',
          staff_name: 'John Doe',
          component_type: 'BASIC_SALARY',
          gross_amount: 10000,
          tax_amount: 0,
          net_amount: 10000
        }
      ]

      expect(() => {
        generatePayrollGLLines(payrollLines, 'INVALID_METHOD', false)
      }).toThrow('Invalid payment method')
    })

    it('should validate balance (DR = CR)', () => {
      const payrollLines: PayrollLineItem[] = [
        {
          staff_entity_id: 'staff-1',
          staff_name: 'John Doe',
          component_type: 'BASIC_SALARY',
          gross_amount: 10000,
          tax_amount: 1000,
          net_amount: 9000
        }
      ]

      const lines = generatePayrollGLLines(payrollLines, 'BANK_TRANSFER', false)

      const totalDR = lines
        .filter(line => line.line_data?.side === 'DR')
        .reduce((sum, line) => sum + line.line_amount, 0)

      const totalCR = lines
        .filter(line => line.line_data?.side === 'CR')
        .reduce((sum, line) => sum + line.line_amount, 0)

      expect(totalDR).toBe(totalCR)
    })
  })

  describe('generatePayrollSmartCode', () => {
    it('should generate correct smart code for SALARY', () => {
      const smartCode = generatePayrollSmartCode('SALARY')
      expect(smartCode).toBe('HERA.SALON.TRANSACTION.PAYROLL.SALARY.v1')
    })

    it('should generate correct smart code for TIPS', () => {
      const smartCode = generatePayrollSmartCode('TIPS')
      expect(smartCode).toBe('HERA.SALON.TRANSACTION.PAYROLL.TIPS.v1')
    })

    it('should generate correct smart code for MIXED', () => {
      const smartCode = generatePayrollSmartCode('MIXED')
      expect(smartCode).toBe('HERA.SALON.TRANSACTION.PAYROLL.MIXED.v1')
    })

    it('should follow HERA smart code format (UPPERCASE with lowercase version)', () => {
      const smartCodes = ['SALARY', 'TIPS', 'MIXED'] as const
      smartCodes.forEach(type => {
        const smartCode = generatePayrollSmartCode(type)
        // Check UPPERCASE segments (not lowercase)
        expect(smartCode).not.toMatch(/[a-z]/)
        expect(smartCode).toMatch(/^[A-Z.]+\.v[0-9]+$/)
        // Check minimum 6 segments
        const segments = smartCode.split('.')
        expect(segments.length).toBeGreaterThanOrEqual(6)
        // Check version is lowercase
        expect(smartCode).toMatch(/\.v1$/)
      })
    })
  })

  describe('validatePayrollTransaction', () => {
    it('should validate correct payroll transaction', () => {
      const payrollLines: PayrollLineItem[] = [
        {
          staff_entity_id: 'staff-1',
          staff_name: 'John Doe',
          component_type: 'BASIC_SALARY',
          gross_amount: 10000,
          tax_amount: 1000,
          net_amount: 9000
        }
      ]

      const validation = validatePayrollTransaction(payrollLines, 'BANK_TRANSFER')
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should reject empty payroll lines', () => {
      const validation = validatePayrollTransaction([], 'BANK_TRANSFER')
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Payroll must have at least one line item')
    })

    it('should reject invalid payment method', () => {
      const payrollLines: PayrollLineItem[] = [
        {
          staff_entity_id: 'staff-1',
          staff_name: 'John Doe',
          component_type: 'BASIC_SALARY',
          gross_amount: 10000,
          tax_amount: 0,
          net_amount: 10000
        }
      ]

      const validation = validatePayrollTransaction(payrollLines, 'INVALID_METHOD')
      expect(validation.valid).toBe(false)
      expect(validation.errors.some(err => err.includes('Invalid payment method'))).toBe(true)
    })

    it('should reject missing staff_entity_id', () => {
      const payrollLines: PayrollLineItem[] = [
        {
          staff_entity_id: '',
          staff_name: 'John Doe',
          component_type: 'BASIC_SALARY',
          gross_amount: 10000,
          tax_amount: 0,
          net_amount: 10000
        }
      ]

      const validation = validatePayrollTransaction(payrollLines, 'BANK_TRANSFER')
      expect(validation.valid).toBe(false)
      expect(validation.errors.some(err => err.includes('staff_entity_id is required'))).toBe(true)
    })

    it('should reject zero or negative amounts', () => {
      const payrollLines: PayrollLineItem[] = [
        {
          staff_entity_id: 'staff-1',
          staff_name: 'John Doe',
          component_type: 'BASIC_SALARY',
          gross_amount: 0,
          tax_amount: 0,
          net_amount: 0
        }
      ]

      const validation = validatePayrollTransaction(payrollLines, 'BANK_TRANSFER')
      expect(validation.valid).toBe(false)
      expect(validation.errors.some(err => err.includes('must be positive'))).toBe(true)
    })
  })
})
