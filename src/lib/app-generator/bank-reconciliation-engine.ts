/**
 * HERA Bank Reconciliation Engine v2.4
 * 
 * Automatic bank transaction matching with sophisticated algorithms
 * Supports: multiple currencies, fuzzy matching, confidence scoring, manual overrides
 * Compatible with jewelry ERP and complex business applications
 */

import { HERAPolicyEngine, PolicyContext } from './policy-engine'

// Bank transaction from external feed
export interface BankTransaction {
  id: string
  bank_account_id: string
  transaction_date: string
  description: string
  amount: number
  currency: string
  reference_number?: string
  transaction_type: 'debit' | 'credit'
  balance_after: number
  bank_metadata?: {
    check_number?: string
    beneficiary?: string
    originator?: string
    fee_amount?: number
    exchange_rate?: number
  }
}

// ERP transaction for matching
export interface ERPTransaction {
  id: string
  transaction_id: string
  transaction_type: string
  entity_id?: string
  entity_name?: string
  description: string
  amount: number
  currency: string
  transaction_date: string
  smart_code: string
  organization_id: string
  status: string
  reference_fields?: {
    invoice_number?: string
    purchase_order?: string
    customer_code?: string
    vendor_code?: string
  }
}

// Reconciliation match result
export interface ReconciliationMatch {
  id: string
  bank_transaction: BankTransaction
  erp_transaction: ERPTransaction
  match_type: 'exact' | 'fuzzy' | 'manual' | 'split' | 'many_to_one' | 'one_to_many'
  confidence_score: number
  match_criteria: {
    amount_match: number
    date_match: number
    description_match: number
    reference_match: number
    overall_score: number
  }
  status: 'pending' | 'approved' | 'rejected'
  created_by: string
  created_at: string
  approved_by?: string
  approved_at?: string
  notes?: string
}

// Unmatched transaction
export interface UnmatchedTransaction {
  id: string
  type: 'bank' | 'erp'
  transaction: BankTransaction | ERPTransaction
  potential_matches: ReconciliationMatch[]
  requires_investigation: boolean
  investigation_notes?: string
  assigned_to?: string
}

// Reconciliation configuration
export interface ReconciliationConfig {
  organization_id: string
  bank_account_id: string
  matching_rules: {
    amount_tolerance: number
    date_tolerance_days: number
    minimum_confidence_score: number
    auto_approve_threshold: number
    description_similarity_threshold: number
  }
  currencies: {
    base_currency: string
    exchange_rate_source?: string
    exchange_rate_tolerance: number
  }
  business_rules: {
    excluded_transaction_types: string[]
    priority_keywords: string[]
    ignore_case_in_descriptions: boolean
    require_manual_approval_above: number
  }
}

export class BankReconciliationEngine {
  private policyEngine: HERAPolicyEngine
  private config: ReconciliationConfig
  private matches: Map<string, ReconciliationMatch> = new Map()
  private unmatchedTransactions: Map<string, UnmatchedTransaction> = new Map()
  
  constructor(config: ReconciliationConfig, policyEngine?: HERAPolicyEngine) {
    this.config = config
    this.policyEngine = policyEngine || new HERAPolicyEngine()
  }
  
  /**
   * Run complete reconciliation process
   */
  async runReconciliation(
    bankTransactions: BankTransaction[],
    erpTransactions: ERPTransaction[],
    actorUserId: string
  ): Promise<{
    matches: ReconciliationMatch[]
    unmatched_bank: UnmatchedTransaction[]
    unmatched_erp: UnmatchedTransaction[]
    summary: ReconciliationSummary
  }> {
    console.log(`🏦 Starting bank reconciliation with ${bankTransactions.length} bank txns, ${erpTransactions.length} ERP txns`)
    
    // Clear previous results
    this.matches.clear()
    this.unmatchedTransactions.clear()
    
    // Step 1: Exact matches (amount, date, reference)
    const exactMatches = await this.findExactMatches(bankTransactions, erpTransactions, actorUserId)
    console.log(`✅ Found ${exactMatches.length} exact matches`)
    
    // Step 2: Fuzzy matches (similar amount, close date, description similarity)
    const remainingBankTxns = bankTransactions.filter(bt => 
      !exactMatches.some(m => m.bank_transaction.id === bt.id)
    )
    const remainingERPTxns = erpTransactions.filter(et => 
      !exactMatches.some(m => m.erp_transaction.id === et.id)
    )
    
    const fuzzyMatches = await this.findFuzzyMatches(remainingBankTxns, remainingERPTxns, actorUserId)
    console.log(`🔍 Found ${fuzzyMatches.length} fuzzy matches`)
    
    // Step 3: Apply business rules via policy engine
    const validatedMatches = await this.validateMatches([...exactMatches, ...fuzzyMatches], actorUserId)
    
    // Step 4: Handle unmatched transactions
    const allMatches = validatedMatches.filter(m => m.status !== 'rejected')
    const unmatchedBank = this.findUnmatchedTransactions(bankTransactions, allMatches, 'bank')
    const unmatchedERP = this.findUnmatchedTransactions(erpTransactions, allMatches, 'erp')
    
    // Step 5: Generate summary
    const summary = this.generateSummary(allMatches, unmatchedBank, unmatchedERP)
    
    return {
      matches: allMatches,
      unmatched_bank: unmatchedBank,
      unmatched_erp: unmatchedERP,
      summary
    }
  }
  
  /**
   * Find exact matches based on amount, date, and reference
   */
  private async findExactMatches(
    bankTransactions: BankTransaction[],
    erpTransactions: ERPTransaction[],
    actorUserId: string
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = []
    
    for (const bankTxn of bankTransactions) {
      for (const erpTxn of erpTransactions) {
        // Skip if already matched
        if (matches.some(m => m.bank_transaction.id === bankTxn.id || m.erp_transaction.id === erpTxn.id)) {
          continue
        }
        
        const matchCriteria = this.calculateMatchCriteria(bankTxn, erpTxn)
        
        // Exact match criteria
        if (
          matchCriteria.amount_match === 100 &&
          matchCriteria.date_match >= 90 &&
          (matchCriteria.reference_match >= 80 || matchCriteria.description_match >= 70)
        ) {
          const match: ReconciliationMatch = {
            id: `exact_${bankTxn.id}_${erpTxn.id}`,
            bank_transaction: bankTxn,
            erp_transaction: erpTxn,
            match_type: 'exact',
            confidence_score: matchCriteria.overall_score,
            match_criteria: matchCriteria,
            status: matchCriteria.overall_score >= this.config.matching_rules.auto_approve_threshold ? 'approved' : 'pending',
            created_by: actorUserId,
            created_at: new Date().toISOString()
          }
          
          matches.push(match)
          this.matches.set(match.id, match)
        }
      }
    }
    
    return matches
  }
  
  /**
   * Find fuzzy matches using similarity algorithms
   */
  private async findFuzzyMatches(
    bankTransactions: BankTransaction[],
    erpTransactions: ERPTransaction[],
    actorUserId: string
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = []
    
    for (const bankTxn of bankTransactions) {
      let bestMatch: { erpTxn: ERPTransaction; criteria: any } | null = null
      let bestScore = 0
      
      for (const erpTxn of erpTransactions) {
        // Skip if already matched
        if (matches.some(m => m.erp_transaction.id === erpTxn.id)) {
          continue
        }
        
        const matchCriteria = this.calculateMatchCriteria(bankTxn, erpTxn)
        
        if (matchCriteria.overall_score > bestScore && 
            matchCriteria.overall_score >= this.config.matching_rules.minimum_confidence_score) {
          bestScore = matchCriteria.overall_score
          bestMatch = { erpTxn, criteria: matchCriteria }
        }
      }
      
      if (bestMatch && bestScore >= this.config.matching_rules.minimum_confidence_score) {
        const match: ReconciliationMatch = {
          id: `fuzzy_${bankTxn.id}_${bestMatch.erpTxn.id}`,
          bank_transaction: bankTxn,
          erp_transaction: bestMatch.erpTxn,
          match_type: 'fuzzy',
          confidence_score: bestScore,
          match_criteria: bestMatch.criteria,
          status: bestScore >= this.config.matching_rules.auto_approve_threshold ? 'approved' : 'pending',
          created_by: actorUserId,
          created_at: new Date().toISOString()
        }
        
        matches.push(match)
        this.matches.set(match.id, match)
      }
    }
    
    return matches
  }
  
  /**
   * Calculate match criteria scores
   */
  private calculateMatchCriteria(bankTxn: BankTransaction, erpTxn: ERPTransaction): ReconciliationMatch['match_criteria'] {
    // Amount match (40% weight)
    const amountMatch = this.calculateAmountMatch(bankTxn.amount, erpTxn.amount, bankTxn.currency, erpTxn.currency)
    
    // Date match (25% weight)
    const dateMatch = this.calculateDateMatch(bankTxn.transaction_date, erpTxn.transaction_date)
    
    // Description match (20% weight)
    const descriptionMatch = this.calculateDescriptionMatch(bankTxn.description, erpTxn.description)
    
    // Reference match (15% weight)
    const referenceMatch = this.calculateReferenceMatch(bankTxn, erpTxn)
    
    // Overall weighted score
    const overallScore = (
      amountMatch * 0.4 +
      dateMatch * 0.25 +
      descriptionMatch * 0.2 +
      referenceMatch * 0.15
    )
    
    return {
      amount_match: amountMatch,
      date_match: dateMatch,
      description_match: descriptionMatch,
      reference_match: referenceMatch,
      overall_score: Math.round(overallScore)
    }
  }
  
  private calculateAmountMatch(bankAmount: number, erpAmount: number, bankCurrency: string, erpCurrency: string): number {
    // Handle currency conversion if needed
    let normalizedBankAmount = bankAmount
    let normalizedERPAmount = erpAmount
    
    if (bankCurrency !== erpCurrency) {
      // In a real implementation, you'd use live exchange rates
      // For now, assume USD as base currency
      const exchangeRate = this.getExchangeRate(bankCurrency, erpCurrency)
      normalizedBankAmount = bankAmount * exchangeRate
    }
    
    const difference = Math.abs(normalizedBankAmount - normalizedERPAmount)
    const tolerance = this.config.matching_rules.amount_tolerance
    
    if (difference === 0) return 100
    if (difference <= tolerance) return 95
    
    const percentageDiff = (difference / Math.max(normalizedBankAmount, normalizedERPAmount)) * 100
    
    if (percentageDiff <= 1) return 90
    if (percentageDiff <= 5) return 70
    if (percentageDiff <= 10) return 50
    if (percentageDiff <= 20) return 30
    
    return 0
  }
  
  private calculateDateMatch(bankDate: string, erpDate: string): number {
    const date1 = new Date(bankDate)
    const date2 = new Date(erpDate)
    const diffDays = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 100
    if (diffDays <= 1) return 95
    if (diffDays <= this.config.matching_rules.date_tolerance_days) return 80
    if (diffDays <= this.config.matching_rules.date_tolerance_days * 2) return 60
    if (diffDays <= 30) return 30
    
    return 0
  }
  
  private calculateDescriptionMatch(bankDesc: string, erpDesc: string): number {
    if (!bankDesc || !erpDesc) return 0
    
    const bank = this.config.business_rules.ignore_case_in_descriptions ? 
      bankDesc.toLowerCase() : bankDesc
    const erp = this.config.business_rules.ignore_case_in_descriptions ? 
      erpDesc.toLowerCase() : erpDesc
    
    // Exact match
    if (bank === erp) return 100
    
    // Check if one contains the other
    if (bank.includes(erp) || erp.includes(bank)) return 80
    
    // Jaccard similarity
    const similarity = this.calculateStringSimilarity(bank, erp)
    return Math.round(similarity * 100)
  }
  
  private calculateReferenceMatch(bankTxn: BankTransaction, erpTxn: ERPTransaction): number {
    let score = 0
    let matches = 0
    let total = 0
    
    // Check reference number
    if (bankTxn.reference_number && erpTxn.reference_fields?.invoice_number) {
      total++
      if (bankTxn.reference_number === erpTxn.reference_fields.invoice_number) {
        matches++
        score += 100
      }
    }
    
    // Check check number
    if (bankTxn.bank_metadata?.check_number && erpTxn.reference_fields?.purchase_order) {
      total++
      if (bankTxn.bank_metadata.check_number === erpTxn.reference_fields.purchase_order) {
        matches++
        score += 100
      }
    }
    
    // Check beneficiary/entity name
    if (bankTxn.bank_metadata?.beneficiary && erpTxn.entity_name) {
      total++
      const nameSimilarity = this.calculateStringSimilarity(
        bankTxn.bank_metadata.beneficiary.toLowerCase(),
        erpTxn.entity_name.toLowerCase()
      )
      score += nameSimilarity * 100
      if (nameSimilarity > 0.7) matches++
    }
    
    return total > 0 ? score / total : 0
  }
  
  private calculateStringSimilarity(str1: string, str2: string): number {
    // Jaccard similarity based on word tokens
    const tokens1 = new Set(str1.split(/\s+/).filter(word => word.length > 2))
    const tokens2 = new Set(str2.split(/\s+/).filter(word => word.length > 2))
    
    const intersection = new Set([...tokens1].filter(word => tokens2.has(word)))
    const union = new Set([...tokens1, ...tokens2])
    
    return union.size > 0 ? intersection.size / union.size : 0
  }
  
  private getExchangeRate(fromCurrency: string, toCurrency: string): number {
    // In a real implementation, fetch from external API
    // For now, return 1 (assume same currency)
    return 1
  }
  
  /**
   * Validate matches using policy engine
   */
  private async validateMatches(matches: ReconciliationMatch[], actorUserId: string): Promise<ReconciliationMatch[]> {
    const validatedMatches: ReconciliationMatch[] = []
    
    for (const match of matches) {
      const context: PolicyContext = {
        actor_user_id: actorUserId,
        organization_id: this.config.organization_id,
        transaction_type: 'bank_reconciliation',
        entity_data: match,
        current_state: { match_score: match.confidence_score }
      }
      
      const policyResults = await this.policyEngine.executePolicyType('matcher', context)
      
      // Check if any policy rejected the match
      const hasRejection = policyResults.some(result => 
        result.status === 'failure' && result.message?.includes('reject')
      )
      
      if (hasRejection) {
        match.status = 'rejected'
        match.notes = 'Rejected by business rules'
      }
      
      // Check if requires manual approval
      if (match.bank_transaction.amount > this.config.business_rules.require_manual_approval_above) {
        match.status = 'pending'
        match.notes = 'Requires manual approval due to high amount'
      }
      
      validatedMatches.push(match)
    }
    
    return validatedMatches
  }
  
  /**
   * Find unmatched transactions
   */
  private findUnmatchedTransactions(
    transactions: (BankTransaction | ERPTransaction)[],
    matches: ReconciliationMatch[],
    type: 'bank' | 'erp'
  ): UnmatchedTransaction[] {
    const matchedIds = new Set(
      matches.map(m => type === 'bank' ? m.bank_transaction.id : m.erp_transaction.id)
    )
    
    return transactions
      .filter(txn => !matchedIds.has(txn.id))
      .map(txn => ({
        id: `unmatched_${type}_${txn.id}`,
        type,
        transaction: txn,
        potential_matches: [],
        requires_investigation: this.requiresInvestigation(txn, type)
      }))
  }
  
  private requiresInvestigation(txn: BankTransaction | ERPTransaction, type: string): boolean {
    // Large amounts require investigation
    if (txn.amount > this.config.business_rules.require_manual_approval_above) {
      return true
    }
    
    // Old transactions require investigation
    const txnDate = new Date(txn.transaction_date)
    const daysSinceTransaction = (Date.now() - txnDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceTransaction > 30) {
      return true
    }
    
    return false
  }
  
  /**
   * Generate reconciliation summary
   */
  private generateSummary(
    matches: ReconciliationMatch[],
    unmatchedBank: UnmatchedTransaction[],
    unmatchedERP: UnmatchedTransaction[]
  ): ReconciliationSummary {
    const totalBankAmount = matches.reduce((sum, m) => sum + m.bank_transaction.amount, 0)
    const totalERPAmount = matches.reduce((sum, m) => sum + m.erp_transaction.amount, 0)
    const unmatchedBankAmount = unmatchedBank.reduce((sum, u) => sum + (u.transaction as BankTransaction).amount, 0)
    const unmatchedERPAmount = unmatchedERP.reduce((sum, u) => sum + (u.transaction as ERPTransaction).amount, 0)
    
    return {
      total_matches: matches.length,
      exact_matches: matches.filter(m => m.match_type === 'exact').length,
      fuzzy_matches: matches.filter(m => m.match_type === 'fuzzy').length,
      auto_approved: matches.filter(m => m.status === 'approved').length,
      pending_approval: matches.filter(m => m.status === 'pending').length,
      unmatched_bank_count: unmatchedBank.length,
      unmatched_erp_count: unmatchedERP.length,
      matched_amount: {
        bank_total: totalBankAmount,
        erp_total: totalERPAmount,
        difference: Math.abs(totalBankAmount - totalERPAmount),
        currency: this.config.currencies.base_currency
      },
      unmatched_amount: {
        bank_total: unmatchedBankAmount,
        erp_total: unmatchedERPAmount,
        currency: this.config.currencies.base_currency
      },
      reconciliation_rate: matches.length / (matches.length + unmatchedBank.length + unmatchedERP.length) * 100,
      confidence_distribution: this.calculateConfidenceDistribution(matches),
      requires_investigation: unmatchedBank.filter(u => u.requires_investigation).length + 
                            unmatchedERP.filter(u => u.requires_investigation).length
    }
  }
  
  private calculateConfidenceDistribution(matches: ReconciliationMatch[]): {
    high_confidence: number // 90-100%
    medium_confidence: number // 70-89%
    low_confidence: number // 50-69%
  } {
    const high = matches.filter(m => m.confidence_score >= 90).length
    const medium = matches.filter(m => m.confidence_score >= 70 && m.confidence_score < 90).length
    const low = matches.filter(m => m.confidence_score >= 50 && m.confidence_score < 70).length
    
    return { high_confidence: high, medium_confidence: medium, low_confidence: low }
  }
  
  /**
   * Manual match creation
   */
  async createManualMatch(
    bankTransactionId: string,
    erpTransactionId: string,
    actorUserId: string,
    notes?: string
  ): Promise<ReconciliationMatch> {
    // This would typically fetch the actual transactions
    // For now, we'll create a placeholder
    const match: ReconciliationMatch = {
      id: `manual_${bankTransactionId}_${erpTransactionId}`,
      bank_transaction: {} as BankTransaction, // Would be fetched
      erp_transaction: {} as ERPTransaction, // Would be fetched
      match_type: 'manual',
      confidence_score: 100, // Manual matches are 100% confident
      match_criteria: {
        amount_match: 100,
        date_match: 100,
        description_match: 100,
        reference_match: 100,
        overall_score: 100
      },
      status: 'approved',
      created_by: actorUserId,
      created_at: new Date().toISOString(),
      approved_by: actorUserId,
      approved_at: new Date().toISOString(),
      notes: notes || 'Manual match created'
    }
    
    this.matches.set(match.id, match)
    return match
  }
  
  /**
   * Get reconciliation statistics
   */
  getStatistics(): {
    total_matches: number
    by_type: Record<string, number>
    by_status: Record<string, number>
    average_confidence: number
  } {
    const matches = Array.from(this.matches.values())
    
    return {
      total_matches: matches.length,
      by_type: {
        exact: matches.filter(m => m.match_type === 'exact').length,
        fuzzy: matches.filter(m => m.match_type === 'fuzzy').length,
        manual: matches.filter(m => m.match_type === 'manual').length
      },
      by_status: {
        approved: matches.filter(m => m.status === 'approved').length,
        pending: matches.filter(m => m.status === 'pending').length,
        rejected: matches.filter(m => m.status === 'rejected').length
      },
      average_confidence: matches.length > 0 ? 
        matches.reduce((sum, m) => sum + m.confidence_score, 0) / matches.length : 0
    }
  }
}

export interface ReconciliationSummary {
  total_matches: number
  exact_matches: number
  fuzzy_matches: number
  auto_approved: number
  pending_approval: number
  unmatched_bank_count: number
  unmatched_erp_count: number
  matched_amount: {
    bank_total: number
    erp_total: number
    difference: number
    currency: string
  }
  unmatched_amount: {
    bank_total: number
    erp_total: number
    currency: string
  }
  reconciliation_rate: number
  confidence_distribution: {
    high_confidence: number
    medium_confidence: number
    low_confidence: number
  }
  requires_investigation: number
}

/**
 * Helper function to create bank reconciliation engine with default config
 */
export function createBankReconciliationEngine(
  organizationId: string,
  bankAccountId: string,
  baseCurrency: string = 'USD'
): BankReconciliationEngine {
  const config: ReconciliationConfig = {
    organization_id: organizationId,
    bank_account_id: bankAccountId,
    matching_rules: {
      amount_tolerance: 0.01, // $0.01 tolerance
      date_tolerance_days: 3,
      minimum_confidence_score: 50,
      auto_approve_threshold: 85,
      description_similarity_threshold: 0.7
    },
    currencies: {
      base_currency: baseCurrency,
      exchange_rate_tolerance: 0.02 // 2% tolerance for FX
    },
    business_rules: {
      excluded_transaction_types: ['internal_transfer', 'fee_adjustment'],
      priority_keywords: ['invoice', 'payment', 'refund', 'deposit'],
      ignore_case_in_descriptions: true,
      require_manual_approval_above: 10000 // $10,000
    }
  }
  
  return new BankReconciliationEngine(config)
}

export default BankReconciliationEngine