/**
 * HERA Smart Code Helper Functions
 * 
 * Smart Code Format: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.{VERSION}
 * Pattern: ^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$
 * 
 * IMPORTANT: Version must be lowercase 'v' not uppercase 'V'
 */

/**
 * Ensures a smart code uses the correct format with lowercase version
 * @param code - The smart code to validate/fix
 * @returns The corrected smart code
 */
export function heraCode(code: string): string {
  // Ensure the code ends with lowercase .v{number}
  return code.replace(/\.V(\d+)$/i, '.v$1')
}

/**
 * Validates if a smart code matches the HERA pattern
 * @param code - The smart code to validate
 * @returns True if valid, false otherwise
 */
export function isValidHeraCode(code: string): boolean {
  const pattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/
  return pattern.test(code)
}

/**
 * Creates a smart code with proper formatting
 * @param parts - Array of code parts (without HERA prefix and version)
 * @param version - Version number (default: 1)
 * @returns Properly formatted smart code
 */
export function createHeraCode(parts: string[], version: number = 1): string {
  const upperParts = parts.map(part => part.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))
  return `HERA.${upperParts.join('.')}.v${version}`
}

/**
 * Extracts parts from a smart code
 * @param code - The smart code to parse
 * @returns Object with parsed components or null if invalid
 */
export function parseHeraCode(code: string): {
  prefix: string
  industry: string
  module: string
  parts: string[]
  version: number
} | null {
  const pattern = /^(HERA)\.([A-Z0-9]{3,15})\.([A-Z0-9_]{2,30})((?:\.[A-Z0-9_]{2,30})+)\.v(\d+)$/
  const match = code.match(pattern)
  
  if (!match) return null
  
  const [, prefix, industry, module, restParts, version] = match
  const parts = restParts.substring(1).split('.') // Remove leading dot
  
  return {
    prefix,
    industry,
    module,
    parts,
    version: parseInt(version, 10)
  }
}

/**
 * Common HERA Smart Code patterns for quick reference
 */
export const HERA_CODES = {
  // Salon Smart Codes
  SALON: {
    POS: {
      SALE: {
        HEADER: heraCode('HERA.SALON.POS.SALE.HEADER.v1'),
        LINE: {
          SERVICE: heraCode('HERA.SALON.POS.LINE.SERVICE.v1'),
          PRODUCT: heraCode('HERA.SALON.POS.LINE.PRODUCT.v1'),
          DISCOUNT: heraCode('HERA.SALON.POS.LINE.DISCOUNT.v1'),
          TIP: heraCode('HERA.SALON.POS.LINE.TIP.v1'),
          TAX: heraCode('HERA.SALON.POS.LINE.TAX.v1'),
        },
        PAYMENT: {
          CASH: heraCode('HERA.SALON.POS.PAYMENT.CASH.v1'),
          CARD: heraCode('HERA.SALON.POS.PAYMENT.CARD.v1'),
          VOUCHER: heraCode('HERA.SALON.POS.PAYMENT.VOUCHER.v1'),
          OTHER: heraCode('HERA.SALON.POS.PAYMENT.OTHER.v1'),
        },
        COMMISSION: {
          EXPENSE: heraCode('HERA.SALON.POS.LINE.COMMISSION.EXPENSE.v1'),
          PAYABLE: heraCode('HERA.SALON.POS.LINE.COMMISSION.PAYABLE.v1'),
        }
      }
    }
  },
  
  // CRM Smart Codes
  CRM: {
    CUSTOMER: {
      ENTITY: heraCode('HERA.CRM.CUST.ENT.PROF.v1'),
    },
    SALE: {
      TRANSACTION: heraCode('HERA.CRM.SALE.TXN.ORDER.v1'),
    }
  },
  
  // Finance Smart Codes
  FIN: {
    GL: {
      ACCOUNT: heraCode('HERA.FIN.GL.ACC.TXN.POST.v1'),
    }
  }
} as const