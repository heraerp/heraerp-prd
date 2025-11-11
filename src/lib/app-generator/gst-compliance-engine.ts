/**
 * HERA GST Compliance Engine v2.4
 * 
 * India GST compliance with automatic tax calculations, return generation, and audit trails
 * Supports: jewelry industry, multi-state transactions, composition scheme, reverse charge
 * Compatible with GSTN API integration and regulatory requirements
 */

// GST Rate Structure (as per India GST rules)
export interface GSTRateStructure {
  hsn_code: string
  description: string
  cgst_rate: number  // Central GST
  sgst_rate: number  // State GST
  igst_rate: number  // Integrated GST
  cess_rate?: number // Compensation Cess
  category: 'goods' | 'services'
  effective_from: string
  effective_to?: string
}

// Transaction for GST calculation
export interface GSTTransaction {
  id: string
  transaction_type: 'sale' | 'purchase' | 'import' | 'export'
  transaction_date: string
  supplier_gstin?: string
  supplier_state_code: string
  customer_gstin?: string
  customer_state_code: string
  place_of_supply: string
  transaction_lines: GSTTransactionLine[]
  is_reverse_charge: boolean
  is_composition_dealer: boolean
  currency: string
  exchange_rate?: number
  organization_id: string
}

export interface GSTTransactionLine {
  line_number: number
  hsn_code: string
  description: string
  quantity: number
  unit_price: number
  taxable_amount: number
  discount_amount?: number
  cgst_rate: number
  sgst_rate: number
  igst_rate: number
  cess_rate?: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  cess_amount?: number
  total_tax_amount: number
  total_amount: number
}

// GST Return structures
export interface GSTR1Summary {
  period: string
  gstin: string
  total_taxable_amount: number
  total_igst: number
  total_cgst: number
  total_sgst: number
  total_cess: number
  b2b_invoices: number
  b2c_invoices: number
  exports: number
  nil_rated: number
  exempted: number
}

export interface GSTR3BReturn {
  period: string
  gstin: string
  outward_supplies: {
    taxable_supplies: number
    zero_rated_supplies: number
    exempted_supplies: number
    non_gst_supplies: number
  }
  inward_supplies: {
    reverse_charge: number
    inward_supplies_liable: number
  }
  tax_liability: {
    igst: number
    cgst: number
    sgst: number
    cess: number
  }
  input_tax_credit: {
    igst: number
    cgst: number
    sgst: number
    cess: number
  }
  net_tax_payable: {
    igst: number
    cgst: number
    sgst: number
    cess: number
  }
}

// Compliance configuration
export interface GSTComplianceConfig {
  organization_id: string
  gstin: string
  legal_name: string
  state_code: string
  registration_type: 'regular' | 'composition' | 'input_service_distributor' | 'non_resident'
  compliance_rating: 'gold' | 'silver' | 'default'
  auto_calculate_tax: boolean
  validate_gstin: boolean
  mandatory_fields: string[]
  industry_specific_rules: {
    jewelry_industry: boolean
    precious_metals: boolean
    diamonds: boolean
    apply_cess: boolean
  }
}

export class GSTComplianceEngine {
  private config: GSTComplianceConfig
  private gstRates: Map<string, GSTRateStructure> = new Map()
  private stateCodeMapping: Map<string, string> = new Map()
  
  constructor(config: GSTComplianceConfig) {
    this.config = config
    this.initializeGSTRates()
    this.initializeStateCodes()
  }
  
  /**
   * Calculate GST for a transaction
   */
  calculateGST(transaction: GSTTransaction): {
    calculated_transaction: GSTTransaction
    tax_summary: GSTTaxSummary
    compliance_status: GSTComplianceStatus
  } {
    console.log(`🧮 Calculating GST for transaction ${transaction.id}`)
    
    const calculatedLines: GSTTransactionLine[] = []
    let totalTaxableAmount = 0
    let totalCGST = 0
    let totalSGST = 0
    let totalIGST = 0
    let totalCess = 0
    
    // Determine if inter-state or intra-state
    const isInterState = transaction.supplier_state_code !== transaction.customer_state_code
    
    for (const line of transaction.transaction_lines) {
      const gstRate = this.getGSTRate(line.hsn_code)
      
      if (!gstRate) {
        throw new Error(`GST rate not found for HSN code: ${line.hsn_code}`)
      }
      
      // Calculate taxable amount
      const taxableAmount = line.quantity * line.unit_price - (line.discount_amount || 0)
      
      let cgstAmount = 0
      let sgstAmount = 0
      let igstAmount = 0
      let cessAmount = 0
      
      if (isInterState) {
        // Inter-state: IGST only
        igstAmount = (taxableAmount * gstRate.igst_rate) / 100
      } else {
        // Intra-state: CGST + SGST
        cgstAmount = (taxableAmount * gstRate.cgst_rate) / 100
        sgstAmount = (taxableAmount * gstRate.sgst_rate) / 100
      }
      
      // Cess calculation (applicable for jewelry industry)
      if (gstRate.cess_rate && this.config.industry_specific_rules.apply_cess) {
        cessAmount = (taxableAmount * gstRate.cess_rate) / 100
      }
      
      const totalTaxAmount = cgstAmount + sgstAmount + igstAmount + cessAmount
      
      const calculatedLine: GSTTransactionLine = {
        line_number: line.line_number,
        hsn_code: line.hsn_code,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        taxable_amount: taxableAmount,
        discount_amount: line.discount_amount,
        cgst_rate: isInterState ? 0 : gstRate.cgst_rate,
        sgst_rate: isInterState ? 0 : gstRate.sgst_rate,
        igst_rate: isInterState ? gstRate.igst_rate : 0,
        cess_rate: gstRate.cess_rate || 0,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        cess_amount: cessAmount,
        total_tax_amount: totalTaxAmount,
        total_amount: taxableAmount + totalTaxAmount
      }
      
      calculatedLines.push(calculatedLine)
      
      totalTaxableAmount += taxableAmount
      totalCGST += cgstAmount
      totalSGST += sgstAmount
      totalIGST += igstAmount
      totalCess += cessAmount
    }
    
    const calculatedTransaction: GSTTransaction = {
      ...transaction,
      transaction_lines: calculatedLines
    }
    
    const taxSummary: GSTTaxSummary = {
      total_taxable_amount: totalTaxableAmount,
      total_cgst: totalCGST,
      total_sgst: totalSGST,
      total_igst: totalIGST,
      total_cess: totalCess,
      total_tax: totalCGST + totalSGST + totalIGST + totalCess,
      total_amount: totalTaxableAmount + totalCGST + totalSGST + totalIGST + totalCess,
      is_inter_state: isInterState
    }
    
    const complianceStatus = this.validateCompliance(calculatedTransaction)
    
    return {
      calculated_transaction: calculatedTransaction,
      tax_summary: taxSummary,
      compliance_status: complianceStatus
    }
  }
  
  /**
   * Validate GST compliance
   */
  validateCompliance(transaction: GSTTransaction): GSTComplianceStatus {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Validate GSTIN
    if (this.config.validate_gstin) {
      if (transaction.supplier_gstin && !this.isValidGSTIN(transaction.supplier_gstin)) {
        errors.push('Invalid supplier GSTIN format')
      }
      
      if (transaction.customer_gstin && !this.isValidGSTIN(transaction.customer_gstin)) {
        errors.push('Invalid customer GSTIN format')
      }
    }
    
    // Validate mandatory fields
    for (const field of this.config.mandatory_fields) {
      if (!this.getFieldValue(transaction, field)) {
        errors.push(`Mandatory field missing: ${field}`)
      }
    }
    
    // Business rules validation
    if (transaction.transaction_type === 'sale' && transaction.total_amount > 50000) {
      if (!transaction.customer_gstin) {
        warnings.push('Sales above ₹50,000 to unregistered dealers may require additional documentation')
      }
    }
    
    // Reverse charge validation
    if (transaction.is_reverse_charge && transaction.transaction_type !== 'purchase') {
      errors.push('Reverse charge is applicable only for purchases')
    }
    
    // Composition dealer validation
    if (transaction.is_composition_dealer && transaction.total_amount > 150000) {
      warnings.push('Transaction amount exceeds composition scheme limit')
    }
    
    // Jewelry industry specific validations
    if (this.config.industry_specific_rules.jewelry_industry) {
      for (const line of transaction.transaction_lines) {
        if (line.hsn_code.startsWith('7113') || line.hsn_code.startsWith('7116')) { // Jewelry HSN codes
          if (line.quantity <= 0) {
            errors.push(`Invalid quantity for jewelry item: ${line.description}`)
          }
          
          if (line.unit_price <= 0) {
            errors.push(`Invalid unit price for jewelry item: ${line.description}`)
          }
        }
      }
    }
    
    return {
      is_compliant: errors.length === 0,
      compliance_score: this.calculateComplianceScore(errors, warnings),
      errors: errors,
      warnings: warnings,
      validated_at: new Date().toISOString(),
      next_review_date: this.calculateNextReviewDate()
    }
  }
  
  /**
   * Generate GSTR-1 return data
   */
  generateGSTR1(transactions: GSTTransaction[], period: string): GSTR1Summary {
    const summary: GSTR1Summary = {
      period: period,
      gstin: this.config.gstin,
      total_taxable_amount: 0,
      total_igst: 0,
      total_cgst: 0,
      total_sgst: 0,
      total_cess: 0,
      b2b_invoices: 0,
      b2c_invoices: 0,
      exports: 0,
      nil_rated: 0,
      exempted: 0
    }
    
    for (const transaction of transactions) {
      // Only include outward supplies (sales)
      if (transaction.transaction_type !== 'sale') continue
      
      const taxSummary = this.calculateTransactionTaxSummary(transaction)
      
      summary.total_taxable_amount += taxSummary.total_taxable_amount
      summary.total_igst += taxSummary.total_igst
      summary.total_cgst += taxSummary.total_cgst
      summary.total_sgst += taxSummary.total_sgst
      summary.total_cess += taxSummary.total_cess
      
      // Categorize transactions
      if (transaction.transaction_type === 'export') {
        summary.exports++
      } else if (transaction.customer_gstin) {
        summary.b2b_invoices++
      } else {
        summary.b2c_invoices++
      }
    }
    
    return summary
  }
  
  /**
   * Generate GSTR-3B return
   */
  generateGSTR3B(
    outwardTransactions: GSTTransaction[],
    inwardTransactions: GSTTransaction[],
    period: string
  ): GSTR3BReturn {
    const outwardSummary = this.summarizeOutwardSupplies(outwardTransactions)
    const inwardSummary = this.summarizeInwardSupplies(inwardTransactions)
    const taxLiability = this.calculateTaxLiability(outwardTransactions)
    const inputTaxCredit = this.calculateInputTaxCredit(inwardTransactions)
    
    return {
      period: period,
      gstin: this.config.gstin,
      outward_supplies: outwardSummary,
      inward_supplies: inwardSummary,
      tax_liability: taxLiability,
      input_tax_credit: inputTaxCredit,
      net_tax_payable: {
        igst: Math.max(0, taxLiability.igst - inputTaxCredit.igst),
        cgst: Math.max(0, taxLiability.cgst - inputTaxCredit.cgst),
        sgst: Math.max(0, taxLiability.sgst - inputTaxCredit.sgst),
        cess: Math.max(0, taxLiability.cess - inputTaxCredit.cess)
      }
    }
  }
  
  /**
   * Jewelry industry specific GST calculations
   */
  calculateJewelryGST(
    goldWeight: number,
    goldPurity: number,
    goldRate: number,
    makingCharges: number,
    stoneValue: number = 0
  ): JewelryGSTCalculation {
    // Gold component (HSN: 7108)
    const goldValue = (goldWeight * goldPurity / 24) * goldRate
    const goldGST = goldValue * 0.03 // 3% GST on gold
    
    // Making charges (HSN: 7113)
    const makingGST = makingCharges * 0.05 // 5% GST on making charges
    
    // Stone component (HSN: 7103)
    const stoneGST = stoneValue * 0.05 // 5% GST on stones
    
    const totalTaxableValue = goldValue + makingCharges + stoneValue
    const totalGST = goldGST + makingGST + stoneGST
    const totalValue = totalTaxableValue + totalGST
    
    return {
      gold_component: {
        weight: goldWeight,
        purity: goldPurity,
        rate: goldRate,
        value: goldValue,
        gst_amount: goldGST,
        hsn_code: '7108'
      },
      making_charges: {
        amount: makingCharges,
        gst_amount: makingGST,
        hsn_code: '7113'
      },
      stone_component: {
        value: stoneValue,
        gst_amount: stoneGST,
        hsn_code: '7103'
      },
      total_taxable_value: totalTaxableValue,
      total_gst: totalGST,
      total_value: totalValue,
      breakdown: {
        gold_percentage: (goldValue / totalTaxableValue) * 100,
        making_percentage: (makingCharges / totalTaxableValue) * 100,
        stone_percentage: (stoneValue / totalTaxableValue) * 100
      }
    }
  }
  
  // Helper methods
  private getGSTRate(hsnCode: string): GSTRateStructure | undefined {
    return this.gstRates.get(hsnCode)
  }
  
  private isValidGSTIN(gstin: string): boolean {
    // GSTIN format: 15 characters (2 digits state code + 10 alphanumeric PAN + 1 check digit + Z + check digit)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstinRegex.test(gstin)
  }
  
  private getFieldValue(transaction: GSTTransaction, fieldPath: string): any {
    const parts = fieldPath.split('.')
    let value: any = transaction
    
    for (const part of parts) {
      value = value?.[part]
    }
    
    return value
  }
  
  private calculateComplianceScore(errors: string[], warnings: string[]): number {
    let score = 100
    score -= errors.length * 10 // 10 points per error
    score -= warnings.length * 5 // 5 points per warning
    return Math.max(0, score)
  }
  
  private calculateNextReviewDate(): string {
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + 30) // Review every 30 days
    return nextReview.toISOString()
  }
  
  private calculateTransactionTaxSummary(transaction: GSTTransaction): GSTTaxSummary {
    let totalTaxableAmount = 0
    let totalCGST = 0
    let totalSGST = 0
    let totalIGST = 0
    let totalCess = 0
    
    for (const line of transaction.transaction_lines) {
      totalTaxableAmount += line.taxable_amount
      totalCGST += line.cgst_amount
      totalSGST += line.sgst_amount
      totalIGST += line.igst_amount
      totalCess += line.cess_amount || 0
    }
    
    return {
      total_taxable_amount: totalTaxableAmount,
      total_cgst: totalCGST,
      total_sgst: totalSGST,
      total_igst: totalIGST,
      total_cess: totalCess,
      total_tax: totalCGST + totalSGST + totalIGST + totalCess,
      total_amount: totalTaxableAmount + totalCGST + totalSGST + totalIGST + totalCess,
      is_inter_state: transaction.supplier_state_code !== transaction.customer_state_code
    }
  }
  
  private summarizeOutwardSupplies(transactions: GSTTransaction[]): GSTR3BReturn['outward_supplies'] {
    let taxableSupplies = 0
    let zeroRatedSupplies = 0
    let exemptedSupplies = 0
    let nonGSTSupplies = 0
    
    for (const transaction of transactions) {
      if (transaction.transaction_type === 'sale') {
        const taxSummary = this.calculateTransactionTaxSummary(transaction)
        
        if (transaction.transaction_type === 'export') {
          zeroRatedSupplies += taxSummary.total_taxable_amount
        } else if (taxSummary.total_tax > 0) {
          taxableSupplies += taxSummary.total_taxable_amount
        } else {
          exemptedSupplies += taxSummary.total_taxable_amount
        }
      }
    }
    
    return {
      taxable_supplies: taxableSupplies,
      zero_rated_supplies: zeroRatedSupplies,
      exempted_supplies: exemptedSupplies,
      non_gst_supplies: nonGSTSupplies
    }
  }
  
  private summarizeInwardSupplies(transactions: GSTTransaction[]): GSTR3BReturn['inward_supplies'] {
    let reverseCharge = 0
    let inwardSuppliesLiable = 0
    
    for (const transaction of transactions) {
      if (transaction.transaction_type === 'purchase') {
        const taxSummary = this.calculateTransactionTaxSummary(transaction)
        
        if (transaction.is_reverse_charge) {
          reverseCharge += taxSummary.total_taxable_amount
        } else {
          inwardSuppliesLiable += taxSummary.total_taxable_amount
        }
      }
    }
    
    return {
      reverse_charge: reverseCharge,
      inward_supplies_liable: inwardSuppliesLiable
    }
  }
  
  private calculateTaxLiability(transactions: GSTTransaction[]): { igst: number; cgst: number; sgst: number; cess: number } {
    let igst = 0, cgst = 0, sgst = 0, cess = 0
    
    for (const transaction of transactions) {
      if (transaction.transaction_type === 'sale') {
        const taxSummary = this.calculateTransactionTaxSummary(transaction)
        igst += taxSummary.total_igst
        cgst += taxSummary.total_cgst
        sgst += taxSummary.total_sgst
        cess += taxSummary.total_cess
      }
    }
    
    return { igst, cgst, sgst, cess }
  }
  
  private calculateInputTaxCredit(transactions: GSTTransaction[]): { igst: number; cgst: number; sgst: number; cess: number } {
    let igst = 0, cgst = 0, sgst = 0, cess = 0
    
    for (const transaction of transactions) {
      if (transaction.transaction_type === 'purchase' && !transaction.is_reverse_charge) {
        const taxSummary = this.calculateTransactionTaxSummary(transaction)
        igst += taxSummary.total_igst
        cgst += taxSummary.total_cgst
        sgst += taxSummary.total_sgst
        cess += taxSummary.total_cess
      }
    }
    
    return { igst, cgst, sgst, cess }
  }
  
  private initializeGSTRates(): void {
    // Jewelry industry GST rates
    const jewelryRates: GSTRateStructure[] = [
      {
        hsn_code: '7108',
        description: 'Gold (bars, etc.)',
        cgst_rate: 1.5,
        sgst_rate: 1.5,
        igst_rate: 3,
        category: 'goods',
        effective_from: '2017-07-01'
      },
      {
        hsn_code: '7113',
        description: 'Articles of jewelry',
        cgst_rate: 1.5,
        sgst_rate: 1.5,
        igst_rate: 3,
        category: 'goods',
        effective_from: '2017-07-01'
      },
      {
        hsn_code: '7116',
        description: 'Articles of natural pearls',
        cgst_rate: 1.5,
        sgst_rate: 1.5,
        igst_rate: 3,
        category: 'goods',
        effective_from: '2017-07-01'
      },
      {
        hsn_code: '7103',
        description: 'Precious stones',
        cgst_rate: 0.125,
        sgst_rate: 0.125,
        igst_rate: 0.25,
        category: 'goods',
        effective_from: '2017-07-01'
      }
    ]
    
    jewelryRates.forEach(rate => {
      this.gstRates.set(rate.hsn_code, rate)
    })
  }
  
  private initializeStateCodes(): void {
    const stateCodes = [
      ['01', 'Jammu and Kashmir'], ['02', 'Himachal Pradesh'], ['03', 'Punjab'],
      ['04', 'Chandigarh'], ['05', 'Uttarakhand'], ['06', 'Haryana'],
      ['07', 'Delhi'], ['08', 'Rajasthan'], ['09', 'Uttar Pradesh'],
      ['10', 'Bihar'], ['11', 'Sikkim'], ['12', 'Arunachal Pradesh'],
      ['13', 'Nagaland'], ['14', 'Manipur'], ['15', 'Mizoram'],
      ['16', 'Tripura'], ['17', 'Meghalaya'], ['18', 'Assam'],
      ['19', 'West Bengal'], ['20', 'Jharkhand'], ['21', 'Odisha'],
      ['22', 'Chhattisgarh'], ['23', 'Madhya Pradesh'], ['24', 'Gujarat'],
      ['25', 'Daman and Diu'], ['26', 'Dadra and Nagar Haveli'],
      ['27', 'Maharashtra'], ['28', 'Andhra Pradesh'], ['29', 'Karnataka'],
      ['30', 'Goa'], ['31', 'Lakshadweep'], ['32', 'Kerala'],
      ['33', 'Tamil Nadu'], ['34', 'Puducherry'], ['35', 'Andaman and Nicobar Islands'],
      ['36', 'Telangana'], ['37', 'Andhra Pradesh'], ['38', 'Ladakh']
    ]
    
    stateCodes.forEach(([code, name]) => {
      this.stateCodeMapping.set(code, name)
    })
  }
}

// Type definitions
export interface GSTTaxSummary {
  total_taxable_amount: number
  total_cgst: number
  total_sgst: number
  total_igst: number
  total_cess: number
  total_tax: number
  total_amount: number
  is_inter_state: boolean
}

export interface GSTComplianceStatus {
  is_compliant: boolean
  compliance_score: number
  errors: string[]
  warnings: string[]
  validated_at: string
  next_review_date: string
}

export interface JewelryGSTCalculation {
  gold_component: {
    weight: number
    purity: number
    rate: number
    value: number
    gst_amount: number
    hsn_code: string
  }
  making_charges: {
    amount: number
    gst_amount: number
    hsn_code: string
  }
  stone_component: {
    value: number
    gst_amount: number
    hsn_code: string
  }
  total_taxable_value: number
  total_gst: number
  total_value: number
  breakdown: {
    gold_percentage: number
    making_percentage: number
    stone_percentage: number
  }
}

/**
 * Helper function to create GST compliance engine with jewelry industry defaults
 */
export function createJewelryGSTEngine(
  organizationId: string,
  gstin: string,
  stateCode: string
): GSTComplianceEngine {
  const config: GSTComplianceConfig = {
    organization_id: organizationId,
    gstin: gstin,
    legal_name: '', // Would be fetched from organization
    state_code: stateCode,
    registration_type: 'regular',
    compliance_rating: 'default',
    auto_calculate_tax: true,
    validate_gstin: true,
    mandatory_fields: ['supplier_gstin', 'customer_state_code', 'place_of_supply'],
    industry_specific_rules: {
      jewelry_industry: true,
      precious_metals: true,
      diamonds: true,
      apply_cess: false // Jewelry doesn't have cess currently
    }
  }
  
  return new GSTComplianceEngine(config)
}

export default GSTComplianceEngine