/**
 * HERA Document Number Generator
 * Professional document numbering for furniture industry
 * 
 * Usage:
 *   const docNumber = await generateDocumentNumber(orgId, 'sales_order')
 *   // Returns: SO-FRN-2025-1001
 */

// Document number configurations by type
const DOCUMENT_CONFIGS = {
  sales_order: {
    prefix: 'SO-FRN',
    description: 'Sales Order',
    sequence_start: 1001
  },
  proforma_invoice: {
    prefix: 'PI-FRN', 
    description: 'Proforma Invoice',
    sequence_start: 2001
  },
  invoice: {
    prefix: 'INV-FRN',
    description: 'Commercial Invoice', 
    sequence_start: 3001
  },
  delivery_note: {
    prefix: 'DN-FRN',
    description: 'Delivery Note',
    sequence_start: 4001
  },
  purchase_order: {
    prefix: 'PO-FRN',
    description: 'Purchase Order',
    sequence_start: 5001
  },
  journal_entry: {
    prefix: 'JE-FRN',
    description: 'Journal Entry',
    sequence_start: 6001
  },
  quotation: {
    prefix: 'QT-FRN', 
    description: 'Quotation',
    sequence_start: 7001
  }
} as const

export async function generateDocumentNumber(organizationId: string, documentType: string): Promise<string> {
  try {
    const config = DOCUMENT_CONFIGS[documentType as keyof typeof DOCUMENT_CONFIGS]
    
    if (!config) {
      // Fallback for unknown document types
      const timestamp = Date.now()
      const prefix = documentType.toUpperCase().slice(0, 3)
      return `${prefix}-${timestamp}`
    }

    // Professional format: PREFIX-YYYY-SEQUENCE
    // Example: SO-FRN-2025-1001
    const currentYear = new Date().getFullYear()
    const timestamp = Date.now()
    
    // Extract last 4 digits of timestamp for uniqueness
    const sequence = config.sequence_start + parseInt(timestamp.toString().slice(-4))
    const paddedSequence = sequence.toString().padStart(4, '0')
    
    return `${config.prefix}-${currentYear}-${paddedSequence}`
    
  } catch (error) {
    console.error('Document number generation failed:', error)
    // Ultimate fallback
    const timestamp = Date.now()
    const prefix = documentType.toUpperCase().slice(0, 3)
    return `${prefix}-${timestamp}`
  }
}

// Document type constants for type safety
export const DocumentTypes = {
  SALES_ORDER: 'sales_order',
  PROFORMA_INVOICE: 'proforma_invoice', 
  INVOICE: 'invoice',
  DELIVERY_NOTE: 'delivery_note',
  PURCHASE_ORDER: 'purchase_order',
  JOURNAL_ENTRY: 'journal_entry',
  QUOTATION: 'quotation'
} as const

export type DocumentType = typeof DocumentTypes[keyof typeof DocumentTypes]

// Utility to get document description
export function getDocumentDescription(documentType: string): string {
  const config = DOCUMENT_CONFIGS[documentType as keyof typeof DOCUMENT_CONFIGS]
  return config?.description || documentType.replace('_', ' ').toUpperCase()
}

// Advanced document number parsing
export interface ParsedDocumentNumber {
  prefix: string
  year: string
  sequence: string
  isValid: boolean
  documentType?: string
}

export function parseDocumentNumber(documentNumber: string): ParsedDocumentNumber {
  const parts = documentNumber.split('-')
  
  if (parts.length >= 4) {
    // Format: SO-FRN-2025-1001
    const [type, industry, year, sequence] = parts
    const prefix = `${type}-${industry}`
    
    return {
      prefix,
      year,
      sequence, 
      isValid: true,
      documentType: type.toLowerCase() + '_' + (type === 'SO' ? 'order' : type === 'PI' ? 'invoice' : 'document')
    }
  } else if (parts.length === 2) {
    // Fallback format: SOL-1234567890
    const [prefix, sequence] = parts
    return {
      prefix,
      year: new Date().getFullYear().toString(),
      sequence,
      isValid: false
    }
  }
  
  return {
    prefix: documentNumber,
    year: '',
    sequence: '',
    isValid: false
  }
}

// Validate document number format
export function isValidDocumentNumber(documentNumber: string): boolean {
  const parsed = parseDocumentNumber(documentNumber)
  return parsed.isValid && 
         parsed.year.length === 4 && 
         parseInt(parsed.year) >= 2020 &&
         parsed.sequence.length >= 4
}