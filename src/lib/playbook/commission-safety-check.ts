import { universalApi } from '@/lib/universal-api-v2'

export interface CommissionSafetyResult {
  hasViolations: boolean
  violationCount: number
  details: Array<{
    transactionId: string
    transactionCode: string
    createdAt: Date
    commissionAmount: number
  }>
}

/**
 * Check for commission lines created while commissions are disabled
 * This helps identify data inconsistencies and potential configuration issues
 */
export async function checkCommissionSafety(organizationId: string): Promise<CommissionSafetyResult> {
  try {
    universalApi.setOrganizationId(organizationId)
    
    // Get organization settings
    const orgResponse = await universalApi.getEntity(organizationId)
    if (!orgResponse.success || !orgResponse.data) {
      throw new Error('Failed to load organization')
    }
    
    const settings = orgResponse.data.settings || {}
    const commissionsEnabled = settings?.salon?.commissions?.enabled ?? true
    
    // If commissions are enabled, no violations possible
    if (commissionsEnabled) {
      return {
        hasViolations: false,
        violationCount: 0,
        details: []
      }
    }
    
    // Check for commission lines in recent transactions
    const transactionsResponse = await universalApi.read('universal_transactions')
    if (!transactionsResponse.success || !transactionsResponse.data) {
      throw new Error('Failed to load transactions')
    }
    
    const violations: CommissionSafetyResult['details'] = []
    
    // Filter for sales transactions from this org
    const salesTransactions = transactionsResponse.data.filter((t: any) => 
      t.organization_id === organizationId && 
      t.transaction_type === 'sale'
    )
    
    // Check each transaction for commission lines
    for (const transaction of salesTransactions) {
      // Check metadata for commission_lines
      if (transaction.metadata?.commission_lines?.length > 0) {
        const totalCommission = transaction.metadata.commission_lines.reduce(
          (sum: number, line: any) => sum + (line.line_amount || 0), 
          0
        )
        
        violations.push({
          transactionId: transaction.id,
          transactionCode: transaction.transaction_code,
          createdAt: new Date(transaction.created_at),
          commissionAmount: totalCommission
        })
      }
    }
    
    return {
      hasViolations: violations.length > 0,
      violationCount: violations.length,
      details: violations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }
  } catch (error) {
    console.error('Error checking commission safety:', error)
    throw error
  }
}

/**
 * Get a summary of commission safety across all time periods
 */
export async function getCommissionSafetySummary(organizationId: string) {
  try {
    const result = await checkCommissionSafety(organizationId)
    
    if (!result.hasViolations) {
      return {
        status: 'healthy',
        message: 'No commission violations found',
        totalViolations: 0,
        totalAmount: 0,
        lastViolation: null
      }
    }
    
    const totalAmount = result.details.reduce((sum, v) => sum + v.commissionAmount, 0)
    
    return {
      status: 'warning',
      message: `Found ${result.violationCount} transactions with commission lines while commissions are disabled`,
      totalViolations: result.violationCount,
      totalAmount,
      lastViolation: result.details[0]?.createdAt || null,
      recentViolations: result.details.slice(0, 5) // Show last 5
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to check commission safety',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}