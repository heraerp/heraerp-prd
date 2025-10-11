/**
 * HERA Smart Code Helper Functions
 *
 * Smart Code Format: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.{VERSION}
 * Pattern: ^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.V[0-9]+$
 *
 * IMPORTANT: Version must be uppercase 'V' per HERA DNA Smart Code Guide
 */

/**
 * Ensures a smart code uses the correct format with uppercase version
 * @param code - The smart code to validate/fix
 * @returns The corrected smart code
 */
export function heraCode(code: string): string {
  // Ensure the code ends with uppercase .V{number}
  return code.replace(/\.v(\d+)$/i, '.V$1')
}

/**
 * Validates if a smart code matches the HERA pattern
 * @param code - The smart code to validate
 * @returns True if valid, false otherwise
 */
export function isValidHeraCode(code: string): boolean {
  const pattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.V[0-9]+$/
  return pattern.test(code)
}

/**
 * Creates a smart code with proper formatting
 * @param parts - Array of code parts (without HERA prefix and version)
 * @param version - Version number (default: 1)
 * @returns Properly formatted smart code with uppercase V
 */
export function createHeraCode(parts: string[], version: number = 1): string {
  const upperParts = parts.map(part => part.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))
  return `HERA.${upperParts.join('.')}.V${version}`
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
  // Accept both V and v, minimum 6 segments total (3 middle segments minimum)
  const pattern =
    /^(HERA)\.([A-Z0-9]{3,15})\.([A-Z0-9_]{2,30})((?:\.[A-Z0-9_]{2,30}){1,5})\.[Vv](\d+)$/
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
 * ✅ Updated to match HERA Transaction Pattern: HERA.{INDUSTRY}.TXN.{TYPE}.{OPERATION}.V{VERSION}
 */
export const HERA_CODES = {
  // Salon Smart Codes
  SALON: {
    // ✅ NEW: Transaction-based patterns (following appointments model)
    TXN: {
      SALE: {
        CREATE: heraCode('HERA.SALON.TXN.SALE.CREATE.V1'),
        UPDATE: heraCode('HERA.SALON.TXN.SALE.UPDATE.V1')
      },
      APPOINTMENT: {
        CREATE: heraCode('HERA.SALON.TXN.APPOINTMENT.CREATE.V1'),
        UPDATE: heraCode('HERA.SALON.TXN.APPOINTMENT.UPDATE.V1')
      }
    },
    // ✅ Legacy POS patterns (for backward compatibility)
    POS: {
      SALE: {
        HEADER: heraCode('HERA.SALON.TXN.SALE.CREATE.V1'), // ✅ Redirected to new pattern
        LINE: {
          SERVICE: heraCode('HERA.SALON.POS.LINE.SERVICE.V1'),
          PRODUCT: heraCode('HERA.SALON.POS.LINE.PRODUCT.V1'),
          DISCOUNT: heraCode('HERA.SALON.POS.LINE.DISCOUNT.V1'),
          TIP: heraCode('HERA.SALON.POS.LINE.TIP.V1'),
          TAX: heraCode('HERA.SALON.POS.LINE.TAX.V1')
        },
        PAYMENT: {
          CASH: heraCode('HERA.SALON.POS.PAYMENT.CASH.V1'),
          CARD: heraCode('HERA.SALON.POS.PAYMENT.CARD.V1'),
          VOUCHER: heraCode('HERA.SALON.POS.PAYMENT.VOUCHER.V1'),
          OTHER: heraCode('HERA.SALON.POS.PAYMENT.OTHER.V1')
        },
        COMMISSION: {
          EXPENSE: heraCode('HERA.SALON.POS.LINE.COMMISSION.EXPENSE.V1'),
          PAYABLE: heraCode('HERA.SALON.POS.LINE.COMMISSION.PAYABLE.V1')
        }
      }
    }
  },

  // CRM Smart Codes
  CRM: {
    CUSTOMER: {
      ENTITY: heraCode('HERA.CRM.CUST.ENT.PROF.V1')
    },
    SALE: {
      TRANSACTION: heraCode('HERA.CRM.SALE.TXN.ORDER.V1')
    }
  },

  // Finance Smart Codes
  FIN: {
    GL: {
      ACCOUNT: heraCode('HERA.FIN.GL.ACC.TXN.POST.V1')
    }
  }
} as const
