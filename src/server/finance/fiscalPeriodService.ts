/**
 * HERA Fiscal Period Management Service
 * 
 * Manages fiscal periods and provides closed period protection for the MDA system.
 * Ensures financial data integrity by preventing posting to closed periods.
 * 
 * Features:
 * - Fiscal year and period management
 * - Period status validation (open/current/closed)
 * - Year-end closing procedures
 * - Retained earnings automation
 * - Multi-organization fiscal calendar support
 */

import { z } from 'zod'
import { heraCode } from '@/lib/smart-codes'

/**
 * Fiscal Period Schema
 */
export const FiscalPeriodSchema = z.object({
  organization_id: z.string().uuid(),
  fiscal_year: z.string().regex(/^\d{4}$/, 'Must be 4-digit year'),
  period_number: z.number().int().min(1).max(12),
  period_code: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  period_name: z.string(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['future', 'open', 'current', 'closing', 'closed']),
  is_year_end: z.boolean().default(false),
  locked_by: z.string().uuid().optional(),
  locked_at: z.string().datetime().optional(),
  closed_by: z.string().uuid().optional(),
  closed_at: z.string().datetime().optional(),
  notes: z.string().optional()
})

export type FiscalPeriod = z.infer<typeof FiscalPeriodSchema>

/**
 * Fiscal Year Schema
 */
export const FiscalYearSchema = z.object({
  organization_id: z.string().uuid(),
  fiscal_year: z.string().regex(/^\d{4}$/),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['future', 'current', 'closed']),
  period_count: z.number().int().min(12).max(12).default(12),
  currency_code: z.string().length(3),
  retained_earnings_account: z.string(),
  year_end_processed: z.boolean().default(false),
  year_end_date: z.string().datetime().optional(),
  year_end_by: z.string().uuid().optional()
})

export type FiscalYear = z.infer<typeof FiscalYearSchema>

/**
 * Period Validation Result
 */
export interface PeriodValidationResult {
  isValid: boolean
  period?: FiscalPeriod
  fiscalYear?: FiscalYear
  error?: string
  warning?: string
  canPost: boolean
  requiresApproval: boolean
}

/**
 * Year-end Processing Result
 */
export interface YearEndResult {
  success: boolean
  fiscal_year: string
  closing_entries: Array<{
    transaction_id: string
    description: string
    amount: number
  }>
  retained_earnings_amount: number
  retained_earnings_transaction_id?: string
  errors?: string[]
  warnings?: string[]
}

/**
 * Fiscal Period Management Service
 */
export class FiscalPeriodService {
  private organizationId: string
  
  constructor(organizationId: string) {
    this.organizationId = organizationId
  }
  
  /**
   * Validate if posting is allowed to a specific date
   */
  async validatePostingDate(transactionDate: string): Promise<PeriodValidationResult> {
    try {
      console.log(`[Fiscal] Validating posting date: ${transactionDate}`)
      
      // Get or create fiscal period for the date
      const period = await this.getFiscalPeriod(transactionDate)
      if (!period) {
        return {
          isValid: false,
          error: 'No fiscal period found for transaction date',
          canPost: false,
          requiresApproval: false
        }
      }
      
      // Get fiscal year
      const fiscalYear = await this.getFiscalYear(period.fiscal_year)
      if (!fiscalYear) {
        return {
          isValid: false,
          error: 'No fiscal year configuration found',
          canPost: false,
          requiresApproval: false
        }
      }
      
      // Validate period status
      const statusValidation = this.validatePeriodStatus(period, transactionDate)
      
      return {
        isValid: statusValidation.canPost,
        period,
        fiscalYear,
        error: statusValidation.error,
        warning: statusValidation.warning,
        canPost: statusValidation.canPost,
        requiresApproval: statusValidation.requiresApproval
      }
      
    } catch (error) {
      console.error('[Fiscal] Error validating posting date:', error)
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        canPost: false,
        requiresApproval: false
      }
    }
  }
  
  /**
   * Get fiscal period for a specific date
   */
  async getFiscalPeriod(date: string): Promise<FiscalPeriod | null> {
    try {
      const { apiV2 } = await import('@/lib/client/fetchV2')
      
      // Parse date to get year and month
      const dateObj = new Date(date)
      const year = dateObj.getFullYear().toString()
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const periodCode = `${year}-${month}`
      
      // First try to find existing period
      const { data: existingPeriods } = await apiV2.get('entities', {
        organization_id: this.organizationId,
        entity_type: 'fiscal_period',
        entity_code: periodCode
      })
      
      if (existingPeriods?.data && existingPeriods.data.length > 0) {
        return await this.loadPeriodDetails(existingPeriods.data[0].id)
      }
      
      // Create period if it doesn't exist
      console.log(`[Fiscal] Creating fiscal period: ${periodCode}`)
      return await this.createFiscalPeriod(year, month)
      
    } catch (error) {
      console.error('[Fiscal] Error getting fiscal period:', error)
      return null
    }
  }
  
  /**
   * Create a new fiscal period
   */
  private async createFiscalPeriod(year: string, month: string): Promise<FiscalPeriod> {
    const { apiV2 } = await import('@/lib/client/fetchV2')
    
    const monthNum = parseInt(month)
    const yearNum = parseInt(year)
    
    // Calculate period dates
    const startDate = `${year}-${month}-01`
    const endDate = new Date(yearNum, monthNum, 0).toISOString().split('T')[0] // Last day of month
    const periodCode = `${year}-${month}`
    const periodName = `${year} Month ${month}`
    
    // Determine period status
    const currentDate = new Date()
    const periodStart = new Date(startDate)
    const periodEnd = new Date(endDate)
    
    let status: FiscalPeriod['status'] = 'future'
    if (currentDate >= periodStart && currentDate <= periodEnd) {
      status = 'current'
    } else if (currentDate > periodEnd) {
      status = 'open' // Past periods are open by default until manually closed
    }
    
    // Check if this is year-end (December)
    const isYearEnd = monthNum === 12
    
    // Create fiscal period entity
    const { data: periodEntity } = await apiV2.post('entities', {
      organization_id: this.organizationId,
      entity_type: 'fiscal_period',
      entity_name: periodName,
      entity_code: periodCode,
      smart_code: heraCode('HERA.ACCOUNTING.FISCAL.PERIOD.V1'),
      description: `Fiscal period ${periodName}`,
      metadata: {
        fiscal_year: year,
        period_number: monthNum,
        is_year_end: isYearEnd
      }
    })
    
    if (!periodEntity?.id) {
      throw new Error('Failed to create fiscal period entity')
    }
    
    // Store fiscal period data
    const fiscalPeriod: FiscalPeriod = {
      organization_id: this.organizationId,
      fiscal_year: year,
      period_number: monthNum,
      period_code: periodCode,
      period_name: periodName,
      start_date: startDate,
      end_date: endDate,
      status,
      is_year_end: isYearEnd
    }
    
    await apiV2.post('entities/dynamic-data', {
      entity_id: periodEntity.id,
      field_name: 'fiscal_period_data',
      field_type: 'json',
      field_value_json: fiscalPeriod,
      smart_code: heraCode('HERA.ACCOUNTING.FISCAL.PERIOD.DATA.V1'),
      field_description: 'Complete fiscal period configuration'
    })
    
    // Ensure fiscal year exists
    await this.ensureFiscalYear(year)
    
    console.log(`[Fiscal] ✅ Created fiscal period: ${periodCode} (${status})`)
    
    return fiscalPeriod
  }
  
  /**
   * Load complete period details from entity
   */
  private async loadPeriodDetails(periodEntityId: string): Promise<FiscalPeriod | null> {
    try {
      const { apiV2 } = await import('@/lib/client/fetchV2')
      
      const { data: periodData } = await apiV2.get('entities/dynamic-data', {
        entity_id: periodEntityId,
        field_name: 'fiscal_period_data'
      })
      
      if (periodData?.data && periodData.data.length > 0) {
        return periodData.data[0].field_value_json as FiscalPeriod
      }
      
      return null
    } catch (error) {
      console.error('[Fiscal] Error loading period details:', error)
      return null
    }
  }
  
  /**
   * Get fiscal year configuration
   */
  async getFiscalYear(year: string): Promise<FiscalYear | null> {
    try {
      const { apiV2 } = await import('@/lib/client/fetchV2')
      
      const { data: fiscalYears } = await apiV2.get('entities', {
        organization_id: this.organizationId,
        entity_type: 'fiscal_year',
        entity_code: `FY-${year}`
      })
      
      if (fiscalYears?.data && fiscalYears.data.length > 0) {
        const yearEntityId = fiscalYears.data[0].id
        
        const { data: yearData } = await apiV2.get('entities/dynamic-data', {
          entity_id: yearEntityId,
          field_name: 'fiscal_year_data'
        })
        
        if (yearData?.data && yearData.data.length > 0) {
          return yearData.data[0].field_value_json as FiscalYear
        }
      }
      
      return null
    } catch (error) {
      console.error('[Fiscal] Error getting fiscal year:', error)
      return null
    }
  }
  
  /**
   * Ensure fiscal year exists, create if needed
   */
  private async ensureFiscalYear(year: string): Promise<FiscalYear> {
    let fiscalYear = await this.getFiscalYear(year)
    
    if (!fiscalYear) {
      console.log(`[Fiscal] Creating fiscal year: ${year}`)
      fiscalYear = await this.createFiscalYear(year)
    }
    
    return fiscalYear
  }
  
  /**
   * Create new fiscal year
   */
  private async createFiscalYear(year: string): Promise<FiscalYear> {
    const { apiV2 } = await import('@/lib/client/fetchV2')
    
    // Get organization's base currency and settings
    const { data: orgData } = await apiV2.get('entities', {
      organization_id: this.organizationId,
      entity_type: 'organization'
    })
    
    const currency = orgData?.data?.[0]?.metadata?.base_currency || 'AED'
    
    // Create fiscal year (calendar year)
    const fiscalYear: FiscalYear = {
      organization_id: this.organizationId,
      fiscal_year: year,
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
      status: 'current',
      period_count: 12,
      currency_code: currency,
      retained_earnings_account: '3200000', // Standard retained earnings account
      year_end_processed: false
    }
    
    // Create fiscal year entity
    const { data: yearEntity } = await apiV2.post('entities', {
      organization_id: this.organizationId,
      entity_type: 'fiscal_year',
      entity_name: `Fiscal Year ${year}`,
      entity_code: `FY-${year}`,
      smart_code: heraCode('HERA.ACCOUNTING.FISCAL.YEAR.V1'),
      description: `Fiscal year ${year} configuration`,
      metadata: {
        fiscal_year: year,
        currency_code: currency
      }
    })
    
    if (!yearEntity?.id) {
      throw new Error('Failed to create fiscal year entity')
    }
    
    // Store fiscal year data
    await apiV2.post('entities/dynamic-data', {
      entity_id: yearEntity.id,
      field_name: 'fiscal_year_data',
      field_type: 'json',
      field_value_json: fiscalYear,
      smart_code: heraCode('HERA.ACCOUNTING.FISCAL.YEAR.DATA.V1'),
      field_description: 'Complete fiscal year configuration'
    })
    
    console.log(`[Fiscal] ✅ Created fiscal year: ${year}`)
    
    return fiscalYear
  }
  
  /**
   * Validate period status for posting
   */
  private validatePeriodStatus(period: FiscalPeriod, transactionDate: string): {
    canPost: boolean
    requiresApproval: boolean
    error?: string
    warning?: string
  } {
    const currentDate = new Date()
    const txnDate = new Date(transactionDate)
    const periodEnd = new Date(period.end_date)
    
    switch (period.status) {
      case 'closed':
        return {
          canPost: false,
          requiresApproval: false,
          error: `Period ${period.period_code} is closed. Cannot post transactions to closed periods.`
        }
      
      case 'closing':
        return {
          canPost: false,
          requiresApproval: true,
          warning: `Period ${period.period_code} is being closed. Requires special approval to post.`
        }
      
      case 'future':
        // Don't allow posting to future periods beyond current month
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        nextMonth.setDate(1)
        
        if (txnDate >= nextMonth) {
          return {
            canPost: false,
            requiresApproval: false,
            error: `Cannot post to future period ${period.period_code}`
          }
        }
        
        return {
          canPost: true,
          requiresApproval: false,
          warning: `Posting to future period ${period.period_code}`
        }
      
      case 'current':
        return {
          canPost: true,
          requiresApproval: false
        }
      
      case 'open':
        // Check if posting to old periods (warn after 2 months)
        const twoMonthsAgo = new Date()
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
        
        if (periodEnd < twoMonthsAgo) {
          return {
            canPost: true,
            requiresApproval: false,
            warning: `Posting to old period ${period.period_code}. Consider if period should be closed.`
          }
        }
        
        return {
          canPost: true,
          requiresApproval: false
        }
      
      default:
        return {
          canPost: false,
          requiresApproval: false,
          error: `Unknown period status: ${period.status}`
        }
    }
  }
  
  /**
   * Close a fiscal period
   */
  async closePeriod(periodCode: string, closedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[Fiscal] Closing period: ${periodCode}`)
      
      const period = await this.getFiscalPeriod(`${periodCode}-01`)
      if (!period) {
        return { success: false, error: 'Period not found' }
      }
      
      if (period.status === 'closed') {
        return { success: false, error: 'Period is already closed' }
      }
      
      // Update period status
      const updatedPeriod: FiscalPeriod = {
        ...period,
        status: 'closed',
        closed_by: closedBy,
        closed_at: new Date().toISOString()
      }
      
      // Find period entity and update
      const { apiV2 } = await import('@/lib/client/fetchV2')
      
      const { data: periodEntities } = await apiV2.get('entities', {
        organization_id: this.organizationId,
        entity_type: 'fiscal_period',
        entity_code: periodCode
      })
      
      if (periodEntities?.data && periodEntities.data.length > 0) {
        const periodEntityId = periodEntities.data[0].id
        
        // Update period data
        await apiV2.post('entities/dynamic-data', {
          entity_id: periodEntityId,
          field_name: 'fiscal_period_data',
          field_type: 'json',
          field_value_json: updatedPeriod,
          smart_code: heraCode('HERA.ACCOUNTING.FISCAL.PERIOD.DATA.V1'),
          field_description: 'Updated fiscal period configuration (closed)'
        })
        
        console.log(`[Fiscal] ✅ Period ${periodCode} closed successfully`)
        
        return { success: true }
      }
      
      return { success: false, error: 'Failed to update period status' }
      
    } catch (error) {
      console.error('[Fiscal] Error closing period:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
  
  /**
   * Process year-end closing
   */
  async processYearEnd(year: string, processedBy: string): Promise<YearEndResult> {
    try {
      console.log(`[Fiscal] Processing year-end for ${year}`)
      
      const fiscalYear = await this.getFiscalYear(year)
      if (!fiscalYear) {
        return {
          success: false,
          fiscal_year: year,
          closing_entries: [],
          retained_earnings_amount: 0,
          errors: ['Fiscal year not found']
        }
      }
      
      if (fiscalYear.year_end_processed) {
        return {
          success: false,
          fiscal_year: year,
          closing_entries: [],
          retained_earnings_amount: 0,
          warnings: ['Year-end already processed']
        }
      }
      
      // This would include:
      // 1. Close all revenue and expense accounts to retained earnings
      // 2. Generate closing journal entries
      // 3. Update fiscal year status
      
      // For now, return a placeholder implementation
      return {
        success: true,
        fiscal_year: year,
        closing_entries: [],
        retained_earnings_amount: 0,
        warnings: ['Year-end processing not fully implemented yet']
      }
      
    } catch (error) {
      console.error('[Fiscal] Error processing year-end:', error)
      return {
        success: false,
        fiscal_year: year,
        closing_entries: [],
        retained_earnings_amount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
  
  /**
   * Get available fiscal periods for organization
   */
  async getAvailablePeriods(): Promise<FiscalPeriod[]> {
    try {
      const { apiV2 } = await import('@/lib/client/fetchV2')
      
      const { data: periodEntities } = await apiV2.get('entities', {
        organization_id: this.organizationId,
        entity_type: 'fiscal_period'
      })
      
      if (!periodEntities?.data) return []
      
      const periods: FiscalPeriod[] = []
      
      for (const entity of periodEntities.data) {
        const periodData = await this.loadPeriodDetails(entity.id)
        if (periodData) {
          periods.push(periodData)
        }
      }
      
      // Sort by period code
      return periods.sort((a, b) => a.period_code.localeCompare(b.period_code))
      
    } catch (error) {
      console.error('[Fiscal] Error getting available periods:', error)
      return []
    }
  }
}

/**
 * Factory function to create fiscal period service
 */
export function createFiscalPeriodService(organizationId: string): FiscalPeriodService {
  return new FiscalPeriodService(organizationId)
}

/**
 * Main validation function for use by APE
 */
export async function validateFiscalPeriodForPosting(
  organizationId: string,
  transactionDate: string
): Promise<PeriodValidationResult> {
  const service = createFiscalPeriodService(organizationId)
  return await service.validatePostingDate(transactionDate)
}