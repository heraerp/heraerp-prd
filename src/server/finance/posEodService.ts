/**
 * HERA POS End-of-Day (EOD) Summary Service
 * 
 * Handles complex POS daily summary postings with:
 * - Sales revenue breakdown (services vs products)
 * - VAT calculations (input and output)
 * - Tips allocation and processing
 * - Card processing fees
 * - Cash vs card settlement splits
 * - Staff commission accruals
 * 
 * Integrates with Auto-Posting Engine for balanced GL entries
 */

import { z } from 'zod'
import { UniversalFinanceEvent, SALON_FINANCE_SMART_CODES, FINANCE_TRANSACTION_TYPES } from '@/types/universal-finance-event'
import { processUniversalFinanceEvent } from './autoPostingEngine'
import { heraCode } from '@/lib/smart-codes'

/**
 * POS Daily Summary Data Schema
 */
export const POSDailySummarySchema = z.object({
  organization_id: z.string().uuid(),
  branch_id: z.string().uuid().optional(),
  terminal_id: z.string().optional(),
  summary_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shift_id: z.string().uuid().optional(),
  
  // Sales breakdown
  sales: z.object({
    services: z.object({
      gross_amount: z.number().min(0),
      vat_amount: z.number().min(0),
      net_amount: z.number().min(0),
      transaction_count: z.number().int().min(0)
    }),
    products: z.object({
      gross_amount: z.number().min(0),
      vat_amount: z.number().min(0),
      net_amount: z.number().min(0),
      transaction_count: z.number().int().min(0)
    }),
    packages: z.object({
      gross_amount: z.number().min(0),
      vat_amount: z.number().min(0),
      net_amount: z.number().min(0),
      transaction_count: z.number().int().min(0)
    }).optional()
  }),
  
  // Payment methods
  payments: z.object({
    cash: z.object({
      collected: z.number().min(0),
      tips: z.number().min(0).optional()
    }),
    cards: z.object({
      settlement: z.number().min(0),
      processing_fees: z.number().min(0),
      tips: z.number().min(0).optional()
    }),
    vouchers: z.object({
      redeemed: z.number().min(0),
      fees: z.number().min(0).optional()
    }).optional(),
    other: z.object({
      amount: z.number().min(0),
      method: z.string()
    }).optional()
  }),
  
  // Staff information
  staff: z.array(z.object({
    staff_id: z.string().uuid(),
    staff_name: z.string(),
    services_revenue: z.number().min(0),
    commission_rate: z.number().min(0).max(1),
    commission_amount: z.number().min(0),
    tips_allocated: z.number().min(0).optional()
  })).optional(),
  
  // Adjustments and discounts
  adjustments: z.object({
    discounts: z.number().min(0).optional(),
    refunds: z.number().min(0).optional(),
    voids: z.number().min(0).optional(),
    promotions: z.number().min(0).optional()
  }).optional(),
  
  // System reconciliation
  reconciliation: z.object({
    expected_total: z.number(),
    actual_total: z.number(),
    difference: z.number(),
    variance_percentage: z.number(),
    notes: z.string().optional()
  }).optional(),
  
  // Currency
  currency_code: z.string().length(3).default('AED'),
  
  // Additional metadata
  metadata: z.object({
    pos_system: z.string().optional(),
    software_version: z.string().optional(),
    processed_by: z.string().uuid().optional(),
    auto_generated: z.boolean().default(false)
  }).optional()
})

export type POSDailySummary = z.infer<typeof POSDailySummarySchema>

/**
 * POS EOD Processing Result
 */
export interface POSEODProcessingResult {
  success: boolean
  summary_id?: string
  journal_entries: Array<{
    transaction_id: string
    journal_entry_id: string
    posting_period: string
    description: string
    total_amount: number
    line_count: number
  }>
  totals: {
    gross_sales: number
    net_sales: number
    total_vat: number
    total_tips: number
    total_commission: number
    total_fees: number
    cash_collected: number
    card_settlement: number
    variance: number
  }
  commission_accruals: Array<{
    staff_id: string
    staff_name: string
    commission_amount: number
    accrual_transaction_id?: string
  }>
  validation_errors?: string[]
  processing_errors?: string[]
  warnings?: string[]
  message?: string
}

/**
 * POS End-of-Day Service
 */
export class POSEODService {
  private organizationId: string
  
  constructor(organizationId: string) {
    this.organizationId = organizationId
  }
  
  /**
   * Process complete POS daily summary
   */
  async processDailySummary(summary: POSDailySummary): Promise<POSEODProcessingResult> {
    try {
      console.log(`[POS EOD] Processing daily summary for ${summary.summary_date}`)
      
      // 1. Validate summary data
      const validation = this.validateSummary(summary)
      if (!validation.isValid) {
        return {
          success: false,
          journal_entries: [],
          totals: this.calculateTotals(summary),
          commission_accruals: [],
          validation_errors: validation.errors,
          message: 'Summary validation failed'
        }
      }
      
      const journalEntries: any[] = []
      const commissionAccruals: any[] = []
      const warnings: string[] = []
      
      // 2. Process main sales summary
      const salesJournalResult = await this.processSalesSummary(summary)
      if (salesJournalResult.success && salesJournalResult.transaction_id) {
        journalEntries.push({
          transaction_id: salesJournalResult.transaction_id,
          journal_entry_id: salesJournalResult.journal_entry_id!,
          posting_period: salesJournalResult.posting_period!,
          description: 'Daily sales summary',
          total_amount: this.getTotalSales(summary),
          line_count: salesJournalResult.gl_lines?.length || 0
        })
      } else {
        return {
          success: false,
          journal_entries: [],
          totals: this.calculateTotals(summary),
          commission_accruals: [],
          processing_errors: salesJournalResult.posting_errors || ['Sales summary posting failed'],
          message: 'Failed to post sales summary'
        }
      }
      
      // 3. Process staff commissions
      if (summary.staff && summary.staff.length > 0) {
        for (const staff of summary.staff) {
          if (staff.commission_amount > 0) {
            const commissionResult = await this.processStaffCommission(summary, staff)
            if (commissionResult.success && commissionResult.transaction_id) {
              journalEntries.push({
                transaction_id: commissionResult.transaction_id,
                journal_entry_id: commissionResult.journal_entry_id!,
                posting_period: commissionResult.posting_period!,
                description: `Commission accrual - ${staff.staff_name}`,
                total_amount: staff.commission_amount,
                line_count: commissionResult.gl_lines?.length || 0
              })
              
              commissionAccruals.push({
                staff_id: staff.staff_id,
                staff_name: staff.staff_name,
                commission_amount: staff.commission_amount,
                accrual_transaction_id: commissionResult.transaction_id
              })
            } else {
              warnings.push(`Failed to accrue commission for ${staff.staff_name}: ${commissionResult.message}`)
            }
          }
        }
      }
      
      // 4. Process payment method fees
      if (summary.payments.cards.processing_fees > 0) {
        const feesResult = await this.processPaymentFees(summary)
        if (feesResult.success && feesResult.transaction_id) {
          journalEntries.push({
            transaction_id: feesResult.transaction_id,
            journal_entry_id: feesResult.journal_entry_id!,
            posting_period: feesResult.posting_period!,
            description: 'Card processing fees',
            total_amount: summary.payments.cards.processing_fees,
            line_count: feesResult.gl_lines?.length || 0
          })
        } else {
          warnings.push(`Failed to post processing fees: ${feesResult.message}`)
        }
      }
      
      // 5. Create summary record
      const summaryId = await this.createSummaryRecord(summary, journalEntries)
      
      console.log(`[POS EOD] ✅ Successfully processed daily summary: ${journalEntries.length} journal entries`)
      
      return {
        success: true,
        summary_id: summaryId,
        journal_entries,
        totals: this.calculateTotals(summary),
        commission_accruals: commissionAccruals,
        warnings: warnings.length > 0 ? warnings : undefined,
        message: `Successfully processed ${journalEntries.length} journal entries for daily summary`
      }
      
    } catch (error) {
      console.error('[POS EOD] Error processing daily summary:', error)
      
      return {
        success: false,
        journal_entries: [],
        totals: this.calculateTotals(summary),
        commission_accruals: [],
        processing_errors: [error instanceof Error ? error.message : 'Unknown processing error'],
        message: 'Internal error processing daily summary'
      }
    }
  }
  
  /**
   * Validate POS summary data
   */
  private validateSummary(summary: POSDailySummary): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    try {
      // Schema validation
      POSDailySummarySchema.parse(summary)
      
      // Business validation
      const totals = this.calculateTotals(summary)
      
      // Check payment total matches sales total
      const paymentTotal = summary.payments.cash.collected + summary.payments.cards.settlement
      const variance = Math.abs(totals.gross_sales - paymentTotal)
      
      if (variance > 1.0) { // Allow 1 AED variance for rounding
        errors.push(`Payment total (${paymentTotal}) does not match sales total (${totals.gross_sales}), variance: ${variance}`)
      }
      
      // Check VAT calculations
      const servicesTotalVat = summary.sales.services.vat_amount
      const productsTotalVat = summary.sales.products.vat_amount
      const expectedVat = (summary.sales.services.net_amount + summary.sales.products.net_amount) * 0.05 // Assume 5% VAT
      
      if (Math.abs((servicesTotalVat + productsTotalVat) - expectedVat) > 0.5) {
        errors.push('VAT calculation appears incorrect - check VAT amounts')
      }
      
      // Check commission calculations
      if (summary.staff) {
        for (const staff of summary.staff) {
          const expectedCommission = staff.services_revenue * staff.commission_rate
          if (Math.abs(staff.commission_amount - expectedCommission) > 0.5) {
            errors.push(`Commission calculation incorrect for ${staff.staff_name}`)
          }
        }
      }
      
      // Check date is not in future
      const summaryDate = new Date(summary.summary_date)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today
      
      if (summaryDate > today) {
        errors.push('Summary date cannot be in the future')
      }
      
      return {
        isValid: errors.length === 0,
        errors
      }
      
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        errors.push(...zodError.errors.map(e => `${e.path.join('.')}: ${e.message}`))
      } else {
        errors.push('Schema validation failed')
      }
      
      return {
        isValid: false,
        errors
      }
    }
  }
  
  /**
   * Process main sales summary UFE
   */
  private async processSalesSummary(summary: POSDailySummary) {
    const totals = this.calculateTotals(summary)
    
    const ufe: UniversalFinanceEvent = {
      organization_id: this.organizationId,
      transaction_type: FINANCE_TRANSACTION_TYPES.POS_EOD,
      smart_code: SALON_FINANCE_SMART_CODES.POS.DAILY_SUMMARY,
      transaction_date: summary.summary_date,
      total_amount: totals.gross_sales,
      transaction_currency_code: summary.currency_code,
      base_currency_code: summary.currency_code,
      exchange_rate: 1.0,
      business_context: {
        channel: 'POS',
        note: `Daily sales summary - ${summary.summary_date}`,
        branch_id: summary.branch_id,
        is_eod_summary: true,
        vat_inclusive: true
      },
      metadata: {
        ingest_source: 'POS_EOD_Service',
        original_ref: `EOD-${summary.summary_date}`,
        correlation_id: crypto.randomUUID(),
        pos_terminal: summary.terminal_id,
        shift_id: summary.shift_id
      },
      totals: {
        gross_sales: totals.gross_sales,
        vat: totals.total_vat,
        tips: totals.total_tips,
        fees: summary.payments.cards.processing_fees,
        cash_collected: summary.payments.cash.collected,
        card_settlement: summary.payments.cards.settlement,
        discounts: summary.adjustments?.discounts || 0
      },
      lines: []
    }
    
    return await processUniversalFinanceEvent(this.organizationId, ufe)
  }
  
  /**
   * Process individual staff commission accrual
   */
  private async processStaffCommission(summary: POSDailySummary, staff: any) {
    const ufe: UniversalFinanceEvent = {
      organization_id: this.organizationId,
      transaction_type: FINANCE_TRANSACTION_TYPES.EXPENSE,
      smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.COMMISSION,
      transaction_date: summary.summary_date,
      source_entity_id: staff.staff_id,
      total_amount: staff.commission_amount,
      transaction_currency_code: summary.currency_code,
      base_currency_code: summary.currency_code,
      exchange_rate: 1.0,
      business_context: {
        channel: 'POS',
        note: `Commission accrual - ${staff.staff_name} (${(staff.commission_rate * 100).toFixed(1)}%)`,
        category: 'Commission'
      },
      metadata: {
        ingest_source: 'POS_EOD_Service',
        original_ref: `COMM-${summary.summary_date}-${staff.staff_id}`,
        correlation_id: crypto.randomUUID(),
        staff_id: staff.staff_id,
        commission_rate: staff.commission_rate,
        services_revenue: staff.services_revenue
      },
      lines: []
    }
    
    return await processUniversalFinanceEvent(this.organizationId, ufe)
  }
  
  /**
   * Process payment processing fees
   */
  private async processPaymentFees(summary: POSDailySummary) {
    const ufe: UniversalFinanceEvent = {
      organization_id: this.organizationId,
      transaction_type: FINANCE_TRANSACTION_TYPES.BANK_FEE,
      smart_code: SALON_FINANCE_SMART_CODES.BANK.FEE,
      transaction_date: summary.summary_date,
      total_amount: summary.payments.cards.processing_fees,
      transaction_currency_code: summary.currency_code,
      base_currency_code: summary.currency_code,
      exchange_rate: 1.0,
      business_context: {
        channel: 'BANK',
        note: `Card processing fees - ${summary.summary_date}`,
        category: 'ProcessingFees'
      },
      metadata: {
        ingest_source: 'POS_EOD_Service',
        original_ref: `FEES-${summary.summary_date}`,
        correlation_id: crypto.randomUUID(),
        card_settlement: summary.payments.cards.settlement
      },
      lines: []
    }
    
    return await processUniversalFinanceEvent(this.organizationId, ufe)
  }
  
  /**
   * Calculate summary totals for validation and reporting
   */
  private calculateTotals(summary: POSDailySummary) {
    const gross_sales = summary.sales.services.gross_amount + 
                       summary.sales.products.gross_amount + 
                       (summary.sales.packages?.gross_amount || 0)
    
    const net_sales = summary.sales.services.net_amount + 
                     summary.sales.products.net_amount + 
                     (summary.sales.packages?.net_amount || 0)
    
    const total_vat = summary.sales.services.vat_amount + 
                     summary.sales.products.vat_amount + 
                     (summary.sales.packages?.vat_amount || 0)
    
    const total_tips = (summary.payments.cash.tips || 0) + 
                      (summary.payments.cards.tips || 0)
    
    const total_commission = summary.staff?.reduce((sum, staff) => sum + staff.commission_amount, 0) || 0
    
    const total_fees = summary.payments.cards.processing_fees + 
                      (summary.payments.vouchers?.fees || 0)
    
    const cash_collected = summary.payments.cash.collected
    const card_settlement = summary.payments.cards.settlement
    
    const variance = summary.reconciliation?.difference || 0
    
    return {
      gross_sales,
      net_sales,
      total_vat,
      total_tips,
      total_commission,
      total_fees,
      cash_collected,
      card_settlement,
      variance
    }
  }
  
  private getTotalSales(summary: POSDailySummary): number {
    return summary.sales.services.gross_amount + 
           summary.sales.products.gross_amount + 
           (summary.sales.packages?.gross_amount || 0)
  }
  
  /**
   * Create summary record in HERA for audit trail
   */
  private async createSummaryRecord(summary: POSDailySummary, journalEntries: any[]): Promise<string> {
    try {
      const { apiV2 } = await import('@/lib/client/fetchV2')
      
      // Create POS summary entity
      const { data: summaryEntity } = await apiV2.post('entities', {
        organization_id: this.organizationId,
        entity_type: 'pos_daily_summary',
        entity_name: `POS Summary ${summary.summary_date}`,
        entity_code: `POS-EOD-${summary.summary_date}`,
        smart_code: heraCode('HERA.SALON.POS.SUMMARY.ENTITY.V1'),
        description: `Daily POS summary for ${summary.summary_date}`,
        metadata: {
          summary_date: summary.summary_date,
          branch_id: summary.branch_id,
          terminal_id: summary.terminal_id,
          journal_entry_count: journalEntries.length,
          processed_at: new Date().toISOString()
        }
      })
      
      if (summaryEntity?.id) {
        // Store complete summary data as dynamic data
        await apiV2.post('entities/dynamic-data', {
          entity_id: summaryEntity.id,
          field_name: 'summary_data',
          field_type: 'json',
          field_value_json: summary,
          smart_code: heraCode('HERA.SALON.POS.SUMMARY.DATA.V1'),
          field_description: 'Complete POS daily summary data'
        })
        
        // Store journal entry references
        await apiV2.post('entities/dynamic-data', {
          entity_id: summaryEntity.id,
          field_name: 'journal_entries',
          field_type: 'json',
          field_value_json: journalEntries,
          smart_code: heraCode('HERA.SALON.POS.SUMMARY.JOURNALS.V1'),
          field_description: 'References to generated journal entries'
        })
        
        return summaryEntity.id
      }
      
      throw new Error('Failed to create summary entity')
      
    } catch (error) {
      console.error('[POS EOD] Error creating summary record:', error)
      return `error-${Date.now()}`
    }
  }
}

/**
 * Factory function to create POS EOD service
 */
export function createPOSEODService(organizationId: string): POSEODService {
  return new POSEODService(organizationId)
}

/**
 * Main entry point for POS daily summary processing
 */
export async function processPOSDailySummary(
  organizationId: string,
  summary: POSDailySummary
): Promise<POSEODProcessingResult> {
  const service = createPOSEODService(organizationId)
  return await service.processDailySummary(summary)
}

/**
 * Helper function to create sample POS summary for testing
 */
export function createSamplePOSSummary(organizationId: string, date: string = new Date().toISOString().split('T')[0]): POSDailySummary {
  return {
    organization_id: organizationId,
    branch_id: 'demo-branch-downtown',
    terminal_id: 'POS-01',
    summary_date: date,
    
    sales: {
      services: {
        gross_amount: 8500,
        vat_amount: 404.76, // 8095.24 * 0.05
        net_amount: 8095.24,
        transaction_count: 25
      },
      products: {
        gross_amount: 1500,
        vat_amount: 71.43, // 1428.57 * 0.05  
        net_amount: 1428.57,
        transaction_count: 12
      }
    },
    
    payments: {
      cash: {
        collected: 2000,
        tips: 150
      },
      cards: {
        settlement: 8000,
        processing_fees: 120,
        tips: 200
      }
    },
    
    staff: [
      {
        staff_id: 'staff-sarah-uuid',
        staff_name: 'Sarah (Senior Stylist)',
        services_revenue: 4000,
        commission_rate: 0.15,
        commission_amount: 600,
        tips_allocated: 175
      },
      {
        staff_id: 'staff-maya-uuid', 
        staff_name: 'Maya (Stylist)',
        services_revenue: 3000,
        commission_rate: 0.12,
        commission_amount: 360,
        tips_allocated: 125
      }
    ],
    
    adjustments: {
      discounts: 50,
      refunds: 0,
      voids: 0
    },
    
    reconciliation: {
      expected_total: 10000,
      actual_total: 10000,
      difference: 0,
      variance_percentage: 0.0
    },
    
    currency_code: 'AED',
    
    metadata: {
      pos_system: 'HERA_POS',
      software_version: '2.1.0',
      auto_generated: false
    }
  }
}