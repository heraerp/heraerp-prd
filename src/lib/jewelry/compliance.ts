/**
 * HERA Jewelry Compliance Helpers
 * GST, KYC, AML, and Hallmark compliance utilities
 */

// GST Compliance Types
export interface GSTValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  gst_slab: 0 | 3
  hsn_code: string
  place_of_supply: string
  tax_mode: 'CGST_SGST' | 'IGST'
}

export interface GSTCalculation {
  base_amount: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_tax: number
  total_amount: number
  tax_breakdown: {
    cgst_rate: number
    sgst_rate: number
    igst_rate: number
  }
}

// KYC Compliance Types
export interface KYCRequirement {
  transaction_amount: number
  requires_kyc: boolean
  required_documents: string[]
  compliance_level: 'BASIC' | 'ENHANCED' | 'FULL'
}

export interface KYCDocument {
  type: 'PAN' | 'AADHAAR' | 'PASSPORT' | 'DRIVING_LICENSE' | 'VOTER_ID'
  number: string
  verified: boolean
  expiry_date?: string
}

// AML Compliance Types
export interface AMLCheck {
  transaction_amount: number
  cumulative_amount_today: number
  requires_reporting: boolean
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  suspicious_indicators: string[]
}

// Hallmark Compliance Types
export interface HallmarkRequirement {
  purity_karat: number
  requires_hallmark: boolean
  certification_authority: string
  exemptions: string[]
}

export interface HallmarkValidation {
  valid: boolean
  hallmark_number?: string
  certification_date?: string
  purity_certified: number
  testing_center: string
  errors: string[]
}

/**
 * GST Compliance Helper
 */
export class GSTCompliance {
  // GST rates for jewelry in India
  private static readonly GST_RATES = {
    GOLD_JEWELRY: 3, // 3% for gold jewelry
    SILVER_JEWELRY: 3, // 3% for silver jewelry
    DIAMONDS: 0.25, // 0.25% for diamonds above 1 carat
    PRECIOUS_STONES: 3, // 3% for other precious stones
    IMITATION: 12 // 12% for imitation jewelry
  }

  // Valid HSN codes for jewelry
  private static readonly JEWELRY_HSN_CODES = [
    '71131100', // Gold jewelry (hallmarked)
    '71131900', // Gold jewelry (other)
    '71139100', // Silver jewelry
    '71139900', // Other precious metal jewelry
    '71171900', // Imitation jewelry
    '71023100', // Diamonds (industrial)
    '71023900' // Diamonds (non-industrial)
  ]

  /**
   * Validate GST compliance for jewelry transaction
   */
  static validateGST(params: {
    item_type: string
    amount: number
    hsn_code: string
    place_of_supply: string
    business_location: string
    purity_karat?: number
  }): GSTValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate HSN code
    if (!this.JEWELRY_HSN_CODES.includes(params.hsn_code)) {
      errors.push(`Invalid HSN code for jewelry: ${params.hsn_code}`)
    }

    // Determine GST slab
    let gst_slab: 0 | 3 = 3
    if (params.item_type.toLowerCase().includes('diamond') && params.amount > 100000) {
      gst_slab = 0 // Diamonds above certain value may be 0%
    }

    // Validate place of supply
    const place_code = params.place_of_supply.toString().padStart(2, '0')
    if (!/^[0-9]{2}$/.test(place_code)) {
      errors.push('Place of supply must be a valid state code (01-37)')
    }

    // Determine tax mode
    const tax_mode = params.place_of_supply === params.business_location ? 'CGST_SGST' : 'IGST'

    // High-value transaction warnings
    if (params.amount > 200000) {
      warnings.push('High-value transaction - ensure proper KYC documentation')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      gst_slab,
      hsn_code: params.hsn_code,
      place_of_supply: params.place_of_supply,
      tax_mode
    }
  }

  /**
   * Calculate GST amounts
   */
  static calculateGST(params: {
    base_amount: number
    gst_rate: number
    place_of_supply: string
    business_location: string
  }): GSTCalculation {
    const { base_amount, gst_rate, place_of_supply, business_location } = params
    const is_intra_state = place_of_supply === business_location

    let cgst_amount = 0
    let sgst_amount = 0
    let igst_amount = 0

    if (is_intra_state) {
      // Intra-state: CGST + SGST (split equally)
      cgst_amount = (base_amount * gst_rate) / (2 * 100)
      sgst_amount = (base_amount * gst_rate) / (2 * 100)
    } else {
      // Inter-state: IGST
      igst_amount = (base_amount * gst_rate) / 100
    }

    const total_tax = cgst_amount + sgst_amount + igst_amount
    const total_amount = base_amount + total_tax

    return {
      base_amount,
      cgst_amount: Math.round(cgst_amount * 100) / 100,
      sgst_amount: Math.round(sgst_amount * 100) / 100,
      igst_amount: Math.round(igst_amount * 100) / 100,
      total_tax: Math.round(total_tax * 100) / 100,
      total_amount: Math.round(total_amount * 100) / 100,
      tax_breakdown: {
        cgst_rate: is_intra_state ? gst_rate / 2 : 0,
        sgst_rate: is_intra_state ? gst_rate / 2 : 0,
        igst_rate: is_intra_state ? 0 : gst_rate
      }
    }
  }
}

/**
 * KYC Compliance Helper
 */
export class KYCCompliance {
  // KYC thresholds as per RBI guidelines
  private static readonly KYC_THRESHOLDS = {
    BASIC: 50000, // Above 50K requires basic KYC
    ENHANCED: 200000, // Above 2L requires enhanced KYC
    FULL: 1000000 // Above 10L requires full KYC
  }

  /**
   * Determine KYC requirements based on transaction amount
   */
  static getKYCRequirements(transaction_amount: number): KYCRequirement {
    let compliance_level: 'BASIC' | 'ENHANCED' | 'FULL' = 'BASIC'
    let required_documents: string[] = []

    if (transaction_amount >= this.KYC_THRESHOLDS.FULL) {
      compliance_level = 'FULL'
      required_documents = [
        'PAN Card (mandatory)',
        'Aadhaar Card',
        'Address Proof',
        'Income Proof',
        'Bank Statements (6 months)',
        'Form 60 (if PAN not available)'
      ]
    } else if (transaction_amount >= this.KYC_THRESHOLDS.ENHANCED) {
      compliance_level = 'ENHANCED'
      required_documents = [
        'PAN Card (mandatory)',
        'Aadhaar Card',
        'Address Proof',
        'Form 60 (if PAN not available)'
      ]
    } else if (transaction_amount >= this.KYC_THRESHOLDS.BASIC) {
      compliance_level = 'BASIC'
      required_documents = ['Valid Photo ID', 'Contact Information']
    }

    return {
      transaction_amount,
      requires_kyc: transaction_amount >= this.KYC_THRESHOLDS.BASIC,
      required_documents,
      compliance_level
    }
  }

  /**
   * Validate KYC documents
   */
  static validateKYCDocuments(
    documents: KYCDocument[],
    required_level: 'BASIC' | 'ENHANCED' | 'FULL'
  ): { valid: boolean; missing: string[]; errors: string[] } {
    const errors: string[] = []
    const missing: string[] = []

    if (required_level === 'BASIC') {
      // Basic KYC - any photo ID is sufficient
      const hasPhotoID = documents.some(doc =>
        ['PAN', 'AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID'].includes(doc.type)
      )
      if (!hasPhotoID) {
        missing.push('Valid Photo ID')
      }
    } else if (required_level === 'ENHANCED') {
      // Enhanced KYC - PAN is mandatory
      const hasPAN = documents.some(doc => doc.type === 'PAN')
      if (!hasPAN) {
        missing.push('PAN Card (mandatory for transactions above ₹2L)')
      }

      const hasAadhaar = documents.some(doc => doc.type === 'AADHAAR')
      if (!hasAadhaar) {
        missing.push('Aadhaar Card or equivalent address proof')
      }
    } else if (required_level === 'FULL') {
      // Full KYC - comprehensive documentation
      const hasPAN = documents.some(doc => doc.type === 'PAN')
      if (!hasPAN) {
        missing.push('PAN Card (mandatory for transactions above ₹10L)')
      }
    }

    // Validate document numbers
    documents.forEach(doc => {
      if (doc.type === 'PAN' && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(doc.number)) {
        errors.push('Invalid PAN format')
      }
      if (doc.type === 'AADHAAR' && !/^[0-9]{12}$/.test(doc.number.replace(/\s/g, ''))) {
        errors.push('Invalid Aadhaar format')
      }
    })

    return {
      valid: missing.length === 0 && errors.length === 0,
      missing,
      errors
    }
  }
}

/**
 * AML (Anti-Money Laundering) Compliance Helper
 */
export class AMLCompliance {
  // AML thresholds as per PMLA guidelines
  private static readonly AML_THRESHOLDS = {
    CASH_TRANSACTION_REPORTING: 1000000, // 10L cash transactions need CTR
    SUSPICIOUS_TRANSACTION_REPORTING: 1000000, // 10L+ need STR consideration
    DAILY_CASH_LIMIT: 200000 // 2L per day cash limit
  }

  /**
   * Perform AML check for transaction
   */
  static performAMLCheck(params: {
    transaction_amount: number
    payment_method: string
    customer_id: string
    cumulative_amount_today: number
    customer_risk_profile?: 'LOW' | 'MEDIUM' | 'HIGH'
  }): AMLCheck {
    const { transaction_amount, payment_method, cumulative_amount_today } = params
    const suspicious_indicators: string[] = []
    let risk_level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'

    // Check cash transaction limits
    if (
      payment_method === 'cash' &&
      transaction_amount >= this.AML_THRESHOLDS.CASH_TRANSACTION_REPORTING
    ) {
      suspicious_indicators.push('Large cash transaction above reporting threshold')
      risk_level = 'HIGH'
    }

    // Check daily limits
    if (
      payment_method === 'cash' &&
      cumulative_amount_today >= this.AML_THRESHOLDS.DAILY_CASH_LIMIT
    ) {
      suspicious_indicators.push('Daily cash limit exceeded')
      risk_level = 'HIGH'
    }

    // Check for structuring (multiple transactions just below threshold)
    if (transaction_amount >= 900000 && transaction_amount < 1000000) {
      suspicious_indicators.push('Possible structuring - amount just below reporting threshold')
      risk_level = 'MEDIUM'
    }

    // High-value jewelry purchases
    if (transaction_amount >= 500000) {
      suspicious_indicators.push('High-value jewelry purchase - enhanced monitoring required')
      if (risk_level === 'LOW') risk_level = 'MEDIUM'
    }

    const requires_reporting =
      payment_method === 'cash' &&
      transaction_amount >= this.AML_THRESHOLDS.CASH_TRANSACTION_REPORTING

    return {
      transaction_amount,
      cumulative_amount_today,
      requires_reporting,
      risk_level,
      suspicious_indicators
    }
  }
}

/**
 * Hallmark Compliance Helper
 */
export class HallmarkCompliance {
  // BIS hallmarking requirements
  private static readonly HALLMARK_REQUIREMENTS = {
    MANDATORY_PURITY_THRESHOLD: 18, // 18K and above gold requires hallmarking
    EXEMPTED_CATEGORIES: [
      'antique_jewelry',
      'handcrafted_jewelry_below_2g',
      'export_jewelry',
      'temporary_imports'
    ]
  }

  /**
   * Check if hallmarking is required
   */
  static checkHallmarkRequirement(params: {
    metal_type: string
    purity_karat: number
    item_category: string
    weight_grams: number
  }): HallmarkRequirement {
    const { metal_type, purity_karat, item_category, weight_grams } = params

    let requires_hallmark = false
    let certification_authority = 'BIS (Bureau of Indian Standards)'
    let exemptions: string[] = []

    // Gold jewelry 18K and above requires hallmarking
    if (
      metal_type.toLowerCase() === 'gold' &&
      purity_karat >= this.HALLMARK_REQUIREMENTS.MANDATORY_PURITY_THRESHOLD
    ) {
      requires_hallmark = true

      // Check exemptions
      if (item_category === 'antique' || item_category === 'antique_jewelry') {
        exemptions.push('Antique jewelry exemption')
        requires_hallmark = false
      }

      if (weight_grams < 2 && item_category.includes('handcrafted')) {
        exemptions.push('Handcrafted jewelry below 2g exemption')
        requires_hallmark = false
      }

      if (item_category === 'export') {
        exemptions.push('Export jewelry exemption')
        requires_hallmark = false
      }
    }

    return {
      purity_karat,
      requires_hallmark,
      certification_authority,
      exemptions
    }
  }

  /**
   * Validate hallmark details
   */
  static validateHallmark(params: {
    hallmark_number: string
    purity_karat: number
    certification_date: string
    testing_center: string
  }): HallmarkValidation {
    const { hallmark_number, purity_karat, certification_date, testing_center } = params
    const errors: string[] = []

    // Validate hallmark number format (simplified)
    if (!/^[A-Z0-9]{8,15}$/.test(hallmark_number)) {
      errors.push('Invalid hallmark number format')
    }

    // Validate certification date (should not be future)
    const cert_date = new Date(certification_date)
    const today = new Date()
    if (cert_date > today) {
      errors.push('Certification date cannot be in the future')
    }

    // Validate purity (only certain karat values are certified)
    const valid_purities = [18, 20, 22, 24]
    if (!valid_purities.includes(purity_karat)) {
      errors.push(`Invalid purity for hallmarking: ${purity_karat}K`)
    }

    // Validate testing center
    if (!testing_center || testing_center.length < 3) {
      errors.push('Valid testing center information required')
    }

    return {
      valid: errors.length === 0,
      hallmark_number,
      certification_date,
      purity_certified: purity_karat,
      testing_center,
      errors
    }
  }
}

/**
 * Comprehensive compliance checker for jewelry transactions
 */
export class JewelryCompliance {
  /**
   * Perform comprehensive compliance check
   */
  static async performComplianceCheck(params: {
    // Transaction details
    transaction_amount: number
    payment_method: string
    customer_id: string

    // Item details
    item_type: string
    metal_type: string
    purity_karat: number
    weight_grams: number
    hsn_code: string

    // Location details
    place_of_supply: string
    business_location: string

    // Customer details
    customer_documents: KYCDocument[]
    cumulative_amount_today: number

    // Hallmark details (if applicable)
    hallmark_number?: string
    certification_date?: string
    testing_center?: string
  }) {
    const results = {
      gst: GSTCompliance.validateGST({
        item_type: params.item_type,
        amount: params.transaction_amount,
        hsn_code: params.hsn_code,
        place_of_supply: params.place_of_supply,
        business_location: params.business_location,
        purity_karat: params.purity_karat
      }),

      kyc: KYCCompliance.getKYCRequirements(params.transaction_amount),

      aml: AMLCompliance.performAMLCheck({
        transaction_amount: params.transaction_amount,
        payment_method: params.payment_method,
        customer_id: params.customer_id,
        cumulative_amount_today: params.cumulative_amount_today
      }),

      hallmark: HallmarkCompliance.checkHallmarkRequirement({
        metal_type: params.metal_type,
        purity_karat: params.purity_karat,
        item_category: params.item_type,
        weight_grams: params.weight_grams
      })
    }

    // Validate KYC documents if available
    if (params.customer_documents && params.customer_documents.length > 0) {
      const kyc_validation = KYCCompliance.validateKYCDocuments(
        params.customer_documents,
        results.kyc.compliance_level
      )
      Object.assign(results.kyc, { validation: kyc_validation })
    }

    // Validate hallmark if required and provided
    if (results.hallmark.requires_hallmark && params.hallmark_number) {
      const hallmark_validation = HallmarkCompliance.validateHallmark({
        hallmark_number: params.hallmark_number,
        purity_karat: params.purity_karat,
        certification_date: params.certification_date || new Date().toISOString(),
        testing_center: params.testing_center || 'Unknown'
      })
      Object.assign(results.hallmark, { validation: hallmark_validation })
    }

    return results
  }
}

// Export all compliance classes
export { GSTCompliance, KYCCompliance, AMLCompliance, HallmarkCompliance, JewelryCompliance }
