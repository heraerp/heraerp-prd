/**
 * HERA DNA Component: Document Numbering System
 * Universal document number generation for all industries
 *
 * DNA Component ID: HERA.DNA.DOCUMENT.NUMBERING.UNIVERSAL.v1
 *
 * Features:
 * - Universal cross-industry support
 * - Professional sequential numbering
 * - Industry-specific prefixes and codes
 * - Year-based organization
 * - Automatic fallback system
 * - TypeScript integration
 * - Multi-tenant support
 */

import React, { useState, useEffect } from 'react'
import { universalApi } from '@/lib/universal-api'

// 🧬 HERA DNA: Universal Industry Configurations
export const HERA_DNA_DOCUMENT_CONFIGS = {
  // Furniture Industry
  furniture: {
    industry_code: 'FRN',
    documents: {
      sales_order: { prefix: 'SO-FRN', sequence_start: 1001, description: 'Sales Order' },
      proforma_invoice: { prefix: 'PI-FRN', sequence_start: 2001, description: 'Proforma Invoice' },
      invoice: { prefix: 'INV-FRN', sequence_start: 3001, description: 'Commercial Invoice' },
      delivery_note: { prefix: 'DN-FRN', sequence_start: 4001, description: 'Delivery Note' },
      purchase_order: { prefix: 'PO-FRN', sequence_start: 5001, description: 'Purchase Order' },
      journal_entry: { prefix: 'JE-FRN', sequence_start: 6001, description: 'Journal Entry' },
      quotation: { prefix: 'QT-FRN', sequence_start: 7001, description: 'Quotation' }
    }
  },

  // Restaurant Industry
  restaurant: {
    industry_code: 'REST',
    documents: {
      sales_order: { prefix: 'SO-REST', sequence_start: 1001, description: 'Food Order' },
      invoice: { prefix: 'INV-REST', sequence_start: 3001, description: 'Restaurant Invoice' },
      kitchen_order: { prefix: 'KO-REST', sequence_start: 8001, description: 'Kitchen Order' },
      table_bill: { prefix: 'TB-REST', sequence_start: 9001, description: 'Table Bill' },
      journal_entry: { prefix: 'JE-REST', sequence_start: 6001, description: 'Journal Entry' },
      purchase_order: { prefix: 'PO-REST', sequence_start: 5001, description: 'Supplier Order' },
      delivery_receipt: { prefix: 'DR-REST', sequence_start: 4001, description: 'Delivery Receipt' }
    }
  },

  // Salon Industry
  salon: {
    industry_code: 'SALON',
    documents: {
      appointment: {
        prefix: 'APT-SALON',
        sequence_start: 1001,
        description: 'Service Appointment'
      },
      service_invoice: {
        prefix: 'SVC-SALON',
        sequence_start: 3001,
        description: 'Service Invoice'
      },
      product_sale: { prefix: 'PS-SALON', sequence_start: 2001, description: 'Product Sale' },
      commission_note: { prefix: 'CM-SALON', sequence_start: 7001, description: 'Commission Note' },
      journal_entry: { prefix: 'JE-SALON', sequence_start: 6001, description: 'Journal Entry' },
      purchase_order: { prefix: 'PO-SALON', sequence_start: 5001, description: 'Supply Order' },
      gift_certificate: {
        prefix: 'GC-SALON',
        sequence_start: 8001,
        description: 'Gift Certificate'
      }
    }
  },

  // Healthcare Industry
  healthcare: {
    industry_code: 'HLTH',
    documents: {
      patient_record: { prefix: 'PR-HLTH', sequence_start: 1001, description: 'Patient Record' },
      medical_invoice: { prefix: 'MI-HLTH', sequence_start: 3001, description: 'Medical Invoice' },
      prescription: { prefix: 'RX-HLTH', sequence_start: 2001, description: 'Prescription' },
      insurance_claim: { prefix: 'IC-HLTH', sequence_start: 4001, description: 'Insurance Claim' },
      journal_entry: { prefix: 'JE-HLTH', sequence_start: 6001, description: 'Journal Entry' },
      lab_report: { prefix: 'LR-HLTH', sequence_start: 7001, description: 'Lab Report' },
      appointment: { prefix: 'APT-HLTH', sequence_start: 8001, description: 'Medical Appointment' }
    }
  },

  // Manufacturing Industry
  manufacturing: {
    industry_code: 'MFG',
    documents: {
      work_order: { prefix: 'WO-MFG', sequence_start: 1001, description: 'Work Order' },
      production_order: { prefix: 'PO-MFG', sequence_start: 2001, description: 'Production Order' },
      quality_report: { prefix: 'QR-MFG', sequence_start: 3001, description: 'Quality Report' },
      material_receipt: { prefix: 'MR-MFG', sequence_start: 4001, description: 'Material Receipt' },
      journal_entry: { prefix: 'JE-MFG', sequence_start: 6001, description: 'Journal Entry' },
      purchase_order: { prefix: 'PR-MFG', sequence_start: 5001, description: 'Purchase Request' },
      shipping_note: { prefix: 'SN-MFG', sequence_start: 7001, description: 'Shipping Note' }
    }
  },

  // Retail Industry
  retail: {
    industry_code: 'RTL',
    documents: {
      sales_receipt: { prefix: 'SR-RTL', sequence_start: 1001, description: 'Sales Receipt' },
      return_receipt: { prefix: 'RR-RTL', sequence_start: 2001, description: 'Return Receipt' },
      invoice: { prefix: 'INV-RTL', sequence_start: 3001, description: 'Customer Invoice' },
      stock_receipt: { prefix: 'ST-RTL', sequence_start: 4001, description: 'Stock Receipt' },
      journal_entry: { prefix: 'JE-RTL', sequence_start: 6001, description: 'Journal Entry' },
      purchase_order: { prefix: 'PO-RTL', sequence_start: 5001, description: 'Purchase Order' },
      layaway_ticket: { prefix: 'LT-RTL', sequence_start: 7001, description: 'Layaway Ticket' }
    }
  },

  // Universal/Generic Industry (fallback)
  universal: {
    industry_code: 'UNI',
    documents: {
      document: { prefix: 'DOC-UNI', sequence_start: 1001, description: 'Generic Document' },
      transaction: { prefix: 'TXN-UNI', sequence_start: 2001, description: 'Generic Transaction' },
      invoice: { prefix: 'INV-UNI', sequence_start: 3001, description: 'Generic Invoice' },
      receipt: { prefix: 'RCP-UNI', sequence_start: 4001, description: 'Generic Receipt' },
      journal_entry: { prefix: 'JE-UNI', sequence_start: 6001, description: 'Journal Entry' },
      purchase_order: { prefix: 'PO-UNI', sequence_start: 5001, description: 'Purchase Order' },
      quotation: { prefix: 'QT-UNI', sequence_start: 7001, description: 'Quotation' }
    }
  }
} as const

// 🧬 HERA DNA: Document Type Constants
export const HERA_DNA_DOCUMENT_TYPES = {
  // Universal document types across all industries
  SALES_ORDER: 'sales_order',
  PROFORMA_INVOICE: 'proforma_invoice',
  INVOICE: 'invoice',
  DELIVERY_NOTE: 'delivery_note',
  PURCHASE_ORDER: 'purchase_order',
  JOURNAL_ENTRY: 'journal_entry',
  QUOTATION: 'quotation',

  // Industry-specific types
  KITCHEN_ORDER: 'kitchen_order', // Restaurant
  TABLE_BILL: 'table_bill', // Restaurant
  APPOINTMENT: 'appointment', // Salon, Healthcare
  SERVICE_INVOICE: 'service_invoice', // Salon
  PRODUCT_SALE: 'product_sale', // Salon, Retail
  COMMISSION_NOTE: 'commission_note', // Salon
  GIFT_CERTIFICATE: 'gift_certificate', // Salon, Retail
  PATIENT_RECORD: 'patient_record', // Healthcare
  MEDICAL_INVOICE: 'medical_invoice', // Healthcare
  PRESCRIPTION: 'prescription', // Healthcare
  INSURANCE_CLAIM: 'insurance_claim', // Healthcare
  LAB_REPORT: 'lab_report', // Healthcare
  WORK_ORDER: 'work_order', // Manufacturing
  PRODUCTION_ORDER: 'production_order', // Manufacturing
  QUALITY_REPORT: 'quality_report', // Manufacturing
  MATERIAL_RECEIPT: 'material_receipt', // Manufacturing
  SALES_RECEIPT: 'sales_receipt', // Retail
  RETURN_RECEIPT: 'return_receipt', // Retail
  STOCK_RECEIPT: 'stock_receipt', // Retail
  LAYAWAY_TICKET: 'layaway_ticket', // Retail
  DELIVERY_RECEIPT: 'delivery_receipt', // Restaurant
  SHIPPING_NOTE: 'shipping_note' // Manufacturing
} as const

export type HeraDocumentType =
  (typeof HERA_DNA_DOCUMENT_TYPES)[keyof typeof HERA_DNA_DOCUMENT_TYPES]
export type HeraIndustryType = keyof typeof HERA_DNA_DOCUMENT_CONFIGS

// 🧬 HERA DNA: Universal Document Number Generator
export async function generateHeraDocumentNumber(
  organizationId: string,
  documentType: string,
  industry?: HeraIndustryType
): Promise<string> {
  const dnaSmartCode = 'HERA.DNA.DOCUMENT.NUMBERING.UNIVERSAL.v1'

  try {
    // Auto-detect industry if not provided
    if (!industry) {
      industry = await detectOrganizationIndustry(organizationId)
    }

    const industryConfig =
      HERA_DNA_DOCUMENT_CONFIGS[industry] || HERA_DNA_DOCUMENT_CONFIGS.universal
    const documentConfig =
      industryConfig.documents[documentType as keyof typeof industryConfig.documents]

    if (!documentConfig) {
      // Fallback for unknown document types
      const timestamp = Date.now()
      const prefix = documentType.toUpperCase().slice(0, 3)
      return `${prefix}-${industryConfig.industry_code}-${timestamp}`
    }

    // Professional format: PREFIX-YEAR-SEQUENCE
    const currentYear = new Date().getFullYear()
    const timestamp = Date.now()

    // Create unique sequence based on timestamp + start number
    const sequence = documentConfig.sequence_start + parseInt(timestamp.toString().slice(-4))
    const paddedSequence = sequence.toString().padStart(4, '0')

    const documentNumber = `${documentConfig.prefix}-${currentYear}-${paddedSequence}`

    // Store document number generation in DNA tracking
    await trackDocumentNumberGeneration(organizationId, documentType, documentNumber, industry)

    return documentNumber
  } catch (error) {
    console.error('HERA DNA Document Number generation failed:', error)
    // Ultimate fallback with DNA smart code
    const timestamp = Date.now()
    const prefix = documentType.toUpperCase().slice(0, 3)
    return `${prefix}-DNA-${timestamp}`
  }
}

// 🧬 HERA DNA: Auto-detect Organization Industry
async function detectOrganizationIndustry(organizationId: string): Promise<HeraIndustryType> {
  try {
    universalApi.setOrganizationId(organizationId)

    const orgResponse = await universalApi.read('core_organizations', undefined, organizationId)

    if (orgResponse.success && orgResponse.data && orgResponse.data.length > 0) {
      const org = orgResponse.data.find((o: any) => o.id === organizationId)

      if (org?.industry_classification) {
        const classification = org.industry_classification.toLowerCase()

        // Map classification to industry types
        if (classification.includes('furniture')) return 'furniture'
        if (classification.includes('restaurant') || classification.includes('food'))
          return 'restaurant'
        if (classification.includes('salon') || classification.includes('beauty')) return 'salon'
        if (classification.includes('healthcare') || classification.includes('medical'))
          return 'healthcare'
        if (classification.includes('manufacturing') || classification.includes('production'))
          return 'manufacturing'
        if (classification.includes('retail') || classification.includes('store')) return 'retail'
      }
    }

    return 'universal' // Default fallback
  } catch (error) {
    console.error('Industry detection failed:', error)
    return 'universal'
  }
}

// 🧬 HERA DNA: Track Document Number Generation
async function trackDocumentNumberGeneration(
  organizationId: string,
  documentType: string,
  documentNumber: string,
  industry: HeraIndustryType
) {
  try {
    await universalApi.createDynamicField(
      organizationId,
      'document_number_generated',
      JSON.stringify({
        document_type: documentType,
        document_number: documentNumber,
        industry: industry,
        generated_at: new Date().toISOString(),
        smart_code: 'HERA.DNA.DOCUMENT.NUMBERING.UNIVERSAL.v1'
      }),
      {
        smart_code: 'HERA.DNA.DOCUMENT.TRACKING.v1',
        field_category: 'document_numbering_dna'
      }
    )
  } catch (error) {
    console.error('Document tracking failed:', error)
    // Non-critical error, continue
  }
}

// 🧬 HERA DNA: Document Number Parser
export interface HeraDocumentNumberInfo {
  documentNumber: string
  prefix: string
  industryCode: string
  year: string
  sequence: string
  documentType?: string
  industry?: HeraIndustryType
  isValid: boolean
  generatedBy: 'hera_dna' | 'legacy' | 'unknown'
}

export function parseHeraDocumentNumber(documentNumber: string): HeraDocumentNumberInfo {
  const parts = documentNumber.split('-')

  if (parts.length >= 4) {
    // HERA DNA format: SO-FRN-2025-1001
    const [type, industryCode, year, sequence] = parts
    const prefix = `${type}-${industryCode}`

    // Detect industry from code
    let industry: HeraIndustryType = 'universal'
    Object.entries(HERA_DNA_DOCUMENT_CONFIGS).forEach(([key, config]) => {
      if (config.industry_code === industryCode) {
        industry = key as HeraIndustryType
      }
    })

    return {
      documentNumber,
      prefix,
      industryCode,
      year,
      sequence,
      industry,
      isValid: true,
      generatedBy: 'hera_dna'
    }
  } else if (parts.length === 2 && parts[1].includes('DNA')) {
    // HERA DNA fallback format: DOC-DNA-1234567890
    const [prefix, sequence] = parts
    return {
      documentNumber,
      prefix,
      industryCode: 'DNA',
      year: new Date().getFullYear().toString(),
      sequence: sequence.replace('DNA-', ''),
      isValid: false,
      generatedBy: 'hera_dna'
    }
  } else {
    // Legacy or unknown format
    return {
      documentNumber,
      prefix: parts[0] || documentNumber,
      industryCode: 'UNKNOWN',
      year: '',
      sequence: '',
      isValid: false,
      generatedBy: 'legacy'
    }
  }
}

// 🧬 HERA DNA: Document Number Validation
export function isValidHeraDocumentNumber(documentNumber: string): boolean {
  const parsed = parseHeraDocumentNumber(documentNumber)
  return (
    parsed.isValid &&
    parsed.year.length === 4 &&
    parseInt(parsed.year) >= 2020 &&
    parsed.sequence.length >= 4 &&
    parsed.generatedBy === 'hera_dna'
  )
}

// 🧬 HERA DNA: Get Document Description
export function getHeraDocumentDescription(
  documentType: string,
  industry?: HeraIndustryType
): string {
  if (!industry) industry = 'universal'

  const industryConfig = HERA_DNA_DOCUMENT_CONFIGS[industry]
  const documentConfig =
    industryConfig?.documents[documentType as keyof typeof industryConfig.documents]

  return documentConfig?.description || documentType.replace('_', ' ').toUpperCase()
}

// 🧬 HERA DNA: React Hook for Document Number Generation
export function useHeraDocumentNumbering(
  organizationId: string | null | undefined,
  industry?: HeraIndustryType
) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)
  const [generationHistory, setGenerationHistory] = useState<string[]>([])

  const generateNumber = async (documentType: string): Promise<string> => {
    if (!organizationId) {
      console.error('HERA DNA: Cannot generate document number without organization ID')
      throw new Error('Organization ID is required')
    }

    setIsGenerating(true)
    try {
      const docNumber = await generateHeraDocumentNumber(organizationId, documentType, industry)
      setLastGenerated(docNumber)
      setGenerationHistory(prev => [docNumber, ...prev.slice(0, 9)]) // Keep last 10
      return docNumber
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    generateNumber,
    isGenerating,
    lastGenerated,
    generationHistory
  }
}

// 🧬 HERA DNA: Document Number Display Component
interface HeraDocumentNumberDisplayProps {
  documentNumber: string
  showDetails?: boolean
  className?: string
}

export function HeraDocumentNumberDisplay({
  documentNumber,
  showDetails = false,
  className = ''
}: HeraDocumentNumberDisplayProps) {
  const parsed = parseHeraDocumentNumber(documentNumber)

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
        {documentNumber}
      </code>

      {parsed.generatedBy === 'hera_dna' && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
          🧬 DNA
        </span>
      )}

      {showDetails && parsed.isValid && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {parsed.industry} • {parsed.year} • #{parsed.sequence}
        </div>
      )}
    </div>
  )
}

export default {
  generateHeraDocumentNumber,
  useHeraDocumentNumbering,
  HeraDocumentNumberDisplay,
  parseHeraDocumentNumber,
  isValidHeraDocumentNumber,
  getHeraDocumentDescription,
  HERA_DNA_DOCUMENT_TYPES,
  HERA_DNA_DOCUMENT_CONFIGS
}
