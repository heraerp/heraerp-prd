/**
 * Smart Code Validation Tests
 * Generated for: Purchasing Rebate Processing v1.0.0
 */

import { describe, it, expect } from 'vitest'

// HERA DNA Smart Code regex pattern
const SMART_CODE_REGEX = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/

describe('Smart Code Validation', () => {
  describe('App Pack Smart Codes', () => {
    it('app smart code should be valid', () => {
      const smartCode = 'HERA.PURCHASE.REBATE.APPLICATION.MAIN.v1'
      expect(smartCode).toMatch(SMART_CODE_REGEX)
      expect(smartCode).toContain('HERA.')
      expect(smartCode.endsWith('.v1')).toBe(true)
    })
  })

  describe('Entity Smart Codes', () => {
    const entities = [
    {
        "entity_type": "VENDOR",
        "smart_code": "HERA.PURCHASE.MASTER.VENDOR.ENTITY.v1",
        "fields": [
            {
                "name": "vendor_name",
                "smart_code": "HERA.PURCHASE.MASTER.VENDOR.FIELD.NAME.v1"
            },
            {
                "name": "tax_id",
                "smart_code": "HERA.PURCHASE.MASTER.VENDOR.FIELD.TAX_ID.v1"
            },
            {
                "name": "payment_terms",
                "smart_code": "HERA.PURCHASE.MASTER.VENDOR.FIELD.PAYMENT_TERMS.v1"
            },
            {
                "name": "is_active",
                "smart_code": "HERA.PURCHASE.MASTER.VENDOR.FIELD.IS_ACTIVE.v1"
            }
        ]
    },
    {
        "entity_type": "REBATE_AGREEMENT",
        "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.ENTITY.v1",
        "fields": [
            {
                "name": "agreement_name",
                "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.NAME.v1"
            },
            {
                "name": "agreement_type",
                "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.TYPE.v1"
            },
            {
                "name": "valid_from",
                "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.VALID_FROM.v1"
            },
            {
                "name": "valid_to",
                "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.VALID_TO.v1"
            },
            {
                "name": "base_rate",
                "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.BASE_RATE.v1"
            },
            {
                "name": "target_volume",
                "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.TARGET_VOLUME.v1"
            },
            {
                "name": "settlement_method",
                "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.SETTLEMENT_METHOD.v1"
            },
            {
                "name": "settlement_frequency",
                "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.SETTLEMENT_FREQUENCY.v1"
            },
            {
                "name": "status",
                "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.STATUS.v1"
            }
        ]
    },
    {
        "entity_type": "REBATE_TIER",
        "smart_code": "HERA.PURCHASE.REBATE.TIER.ENTITY.v1",
        "fields": [
            {
                "name": "min_volume",
                "smart_code": "HERA.PURCHASE.REBATE.TIER.FIELD.MIN_VOLUME.v1"
            },
            {
                "name": "max_volume",
                "smart_code": "HERA.PURCHASE.REBATE.TIER.FIELD.MAX_VOLUME.v1"
            },
            {
                "name": "rate",
                "smart_code": "HERA.PURCHASE.REBATE.TIER.FIELD.RATE.v1"
            }
        ]
    },
    {
        "entity_type": "PRODUCT",
        "smart_code": "HERA.PROCURE.MASTER.PRODUCT.ENTITY.v1",
        "fields": [
            {
                "name": "product_name",
                "smart_code": "HERA.PROCURE.MASTER.PRODUCT.FIELD.NAME.v1"
            },
            {
                "name": "product_code",
                "smart_code": "HERA.PROCURE.MASTER.PRODUCT.FIELD.CODE.v1"
            },
            {
                "name": "category",
                "smart_code": "HERA.PROCURE.MASTER.PRODUCT.FIELD.CATEGORY.v1"
            },
            {
                "name": "unit_price",
                "smart_code": "HERA.PROCURE.MASTER.PRODUCT.FIELD.UNIT_PRICE.v1"
            }
        ]
    }
]

    entities.forEach(entity => {
      describe(`Entity: ${entity.entity_type}`, () => {
        it('should have valid entity smart code', () => {
          expect(entity.smart_code).toMatch(SMART_CODE_REGEX)
          expect(entity.smart_code).toContain('HERA.')
          expect(entity.smart_code).toContain(entity.entity_type)
        })

        it('should have valid field smart codes', () => {
          entity.fields.forEach(field => {
            expect(field.smart_code).toMatch(SMART_CODE_REGEX)
            expect(field.smart_code).toContain('HERA.')
            expect(field.smart_code).toContain('FIELD.')
            expect(field.smart_code).toContain(field.name.toUpperCase())
          })
        })
      })
    })
  })

  describe('Transaction Smart Codes', () => {
    const transactions = [
    {
        "transaction_type": "REBATE_ACCRUAL",
        "smart_code": "HERA.FINANCE.TXN.REBATE.ACCRUAL.MAIN.v1",
        "lines": [
            {
                "name": "Rebate Expense",
                "smart_code": "HERA.FINANCE.TXN.REBATE.ACCRUAL.LINE.EXPENSE.v1"
            },
            {
                "name": "Rebate Liability",
                "smart_code": "HERA.FINANCE.TXN.REBATE.ACCRUAL.LINE.LIABILITY.v1"
            }
        ]
    },
    {
        "transaction_type": "REBATE_SETTLEMENT",
        "smart_code": "HERA.FINANCE.TXN.REBATE.SETTLEMENT.MAIN.v1",
        "lines": [
            {
                "name": "Clear Liability",
                "smart_code": "HERA.FINANCE.TXN.REBATE.SETTLEMENT.LINE.CLEAR_LIABILITY.v1"
            },
            {
                "name": "Vendor Credit",
                "smart_code": "HERA.FINANCE.TXN.REBATE.SETTLEMENT.LINE.VENDOR_CREDIT.v1"
            }
        ]
    }
]

    transactions.forEach(transaction => {
      describe(`Transaction: ${transaction.transaction_type}`, () => {
        it('should have valid transaction smart code', () => {
          expect(transaction.smart_code).toMatch(SMART_CODE_REGEX)
          expect(transaction.smart_code).toContain('HERA.')
          expect(transaction.smart_code).toContain('TXN.')
        })

        it('should have valid line smart codes', () => {
          transaction.lines.forEach(line => {
            expect(line.smart_code).toMatch(SMART_CODE_REGEX)
            expect(line.smart_code).toContain('HERA.')
            expect(line.smart_code).toContain('LINE.')
          })
        })
      })
    })
  })

  describe('Smart Code Consistency', () => {
    it('all smart codes should use same version pattern', () => {
      const allSmartCodes = [
        'HERA.PURCHASE.REBATE.APPLICATION.MAIN.v1',
        ...["HERA.PURCHASE.MASTER.VENDOR.ENTITY.v1","HERA.PURCHASE.REBATE.AGREEMENT.ENTITY.v1","HERA.PURCHASE.REBATE.TIER.ENTITY.v1","HERA.PROCURE.MASTER.PRODUCT.ENTITY.v1"],
        ...["HERA.FINANCE.TXN.REBATE.ACCRUAL.MAIN.v1","HERA.FINANCE.TXN.REBATE.SETTLEMENT.MAIN.v1"]
      ]

      allSmartCodes.forEach(smartCode => {
        // Should end with .v followed by number
        expect(smartCode).toMatch(/\.v[0-9]+$/)
        
        // Should have consistent HERA prefix
        expect(smartCode).toMatch(/^HERA\.[A-Z]/)
        
        // Should not have lowercase segments (except version)
        const segments = smartCode.split('.')
        const versionSegment = segments[segments.length - 1]
        const nonVersionSegments = segments.slice(0, -1)
        
        nonVersionSegments.forEach(segment => {
          expect(segment).toMatch(/^[A-Z0-9_]+$/)
        })
        
        expect(versionSegment).toMatch(/^v[0-9]+$/)
      })
    })

    it('smart codes should not have duplicates', () => {
      const allSmartCodes = [
        'HERA.PURCHASE.REBATE.APPLICATION.MAIN.v1',
        ...["HERA.PURCHASE.MASTER.VENDOR.ENTITY.v1","HERA.PURCHASE.REBATE.AGREEMENT.ENTITY.v1","HERA.PURCHASE.REBATE.TIER.ENTITY.v1","HERA.PROCURE.MASTER.PRODUCT.ENTITY.v1"],
        ...["HERA.FINANCE.TXN.REBATE.ACCRUAL.MAIN.v1","HERA.FINANCE.TXN.REBATE.SETTLEMENT.MAIN.v1"],
        ...["HERA.PURCHASE.MASTER.VENDOR.FIELD.NAME.v1","HERA.PURCHASE.MASTER.VENDOR.FIELD.TAX_ID.v1","HERA.PURCHASE.MASTER.VENDOR.FIELD.PAYMENT_TERMS.v1","HERA.PURCHASE.MASTER.VENDOR.FIELD.IS_ACTIVE.v1","HERA.PURCHASE.REBATE.AGREEMENT.FIELD.NAME.v1","HERA.PURCHASE.REBATE.AGREEMENT.FIELD.TYPE.v1","HERA.PURCHASE.REBATE.AGREEMENT.FIELD.VALID_FROM.v1","HERA.PURCHASE.REBATE.AGREEMENT.FIELD.VALID_TO.v1","HERA.PURCHASE.REBATE.AGREEMENT.FIELD.BASE_RATE.v1","HERA.PURCHASE.REBATE.AGREEMENT.FIELD.TARGET_VOLUME.v1","HERA.PURCHASE.REBATE.AGREEMENT.FIELD.SETTLEMENT_METHOD.v1","HERA.PURCHASE.REBATE.AGREEMENT.FIELD.SETTLEMENT_FREQUENCY.v1","HERA.PURCHASE.REBATE.AGREEMENT.FIELD.STATUS.v1","HERA.PURCHASE.REBATE.TIER.FIELD.MIN_VOLUME.v1","HERA.PURCHASE.REBATE.TIER.FIELD.MAX_VOLUME.v1","HERA.PURCHASE.REBATE.TIER.FIELD.RATE.v1","HERA.PROCURE.MASTER.PRODUCT.FIELD.NAME.v1","HERA.PROCURE.MASTER.PRODUCT.FIELD.CODE.v1","HERA.PROCURE.MASTER.PRODUCT.FIELD.CATEGORY.v1","HERA.PROCURE.MASTER.PRODUCT.FIELD.UNIT_PRICE.v1"],
        ...["HERA.FINANCE.TXN.REBATE.ACCRUAL.LINE.EXPENSE.v1","HERA.FINANCE.TXN.REBATE.ACCRUAL.LINE.LIABILITY.v1","HERA.FINANCE.TXN.REBATE.SETTLEMENT.LINE.CLEAR_LIABILITY.v1","HERA.FINANCE.TXN.REBATE.SETTLEMENT.LINE.VENDOR_CREDIT.v1"]
      ]

      const uniqueSmartCodes = [...new Set(allSmartCodes)]
      expect(uniqueSmartCodes).toHaveLength(allSmartCodes.length)
    })
  })

  describe('Canonical Smart Code Examples', () => {
    it('should match known valid patterns', () => {
      const validExamples = [
        'HERA.FINANCE.TXN.SALE.v1',
        'HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.v1',
        'HERA.SALON.CC.ADMIN.OVERHEAD.v2',
        'HERA.ENTERPRISE.CUSTOMER.ENTITY.v1',
        'HERA.MANUFACTURING.PRODUCT.FIELD.PRICE.v1'
      ]

      validExamples.forEach(example => {
        expect(example).toMatch(SMART_CODE_REGEX)
      })
    })

    it('should reject invalid patterns', () => {
      const invalidExamples = [
        'hera.finance.txn.sale.v1',           // lowercase
        'FINANCE.TXN.SALE.v1',               // missing HERA
        'HERA.FINANCE.TXN.SALE.V1',          // uppercase version
        'HERA.FINANCE.TXN.SALE',             // missing version
        'HERA..TXN.SALE.v1',                 // empty segment
        'HERA.FINANCE-TXN.SALE.v1'           // invalid character
      ]

      invalidExamples.forEach(example => {
        expect(example).not.toMatch(SMART_CODE_REGEX)
      })
    })
  })
})