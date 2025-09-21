/**
 * HERA Finance DNA - Daily Sales Posting Scheduler
 *
 * Automated daily posting at 23:59 Europe/London timezone
 * Uses cron-style scheduling for production deployment
 */

import {
  summarizeSalesByBranchDay,
  buildDailyJournalPayload,
  postDailySalesJournal
} from './dailySales'
import { getSalesPostingPolicy } from './policy'
import { universalApi } from '@/lib/universal-api-v2'

interface SchedulerConfig {
  enabled: boolean
  timezone: string
  time: string // HH:MM format
  organizations: string[]
  retryAttempts: number
  retryDelayMs: number
}

interface PostingResult {
  organization_id: string
  branch_id: string
  day: string
  success: boolean
  transaction_id?: string
  error?: string
  posted_at: string
  total_amount?: number
  transaction_count?: number
}

/**
 * Default scheduler configuration
 */
export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  enabled: true,
  timezone: 'Europe/London',
  time: '23:59',
  organizations: [], // Populated from active organizations
  retryAttempts: 3,
  retryDelayMs: 30000 // 30 seconds
}

/**
 * Gets scheduler configuration from database
 */
export async function getSchedulerConfig(): Promise<SchedulerConfig> {
  try {
    // In a real implementation, this would fetch from core_dynamic_data
    // For now, return default config with active organizations
    const orgsResponse = await universalApi.read({
      table: 'core_entities',
      filters: [{ field: 'entity_type', operator: 'eq', value: 'organization' }]
    })

    const organizations = (orgsResponse?.data || []).map((org: any) => org.id)

    return {
      ...DEFAULT_SCHEDULER_CONFIG,
      organizations
    }
  } catch (error) {
    console.error('Error getting scheduler config:', error)
    return DEFAULT_SCHEDULER_CONFIG
  }
}

/**
 * Posts daily sales for a single organization/branch
 */
export async function postDailySalesForBranch(
  organization_id: string,
  branch_id: string,
  day: string,
  retryAttempts: number = 3
): Promise<PostingResult> {
  const result: PostingResult = {
    organization_id,
    branch_id,
    day,
    success: false,
    posted_at: new Date().toISOString()
  }

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      // Get sales posting policy
      const policy = await getSalesPostingPolicy(organization_id)
      if (!policy) {
        throw new Error('Sales posting policy not configured')
      }

      // Create day boundaries
      const dayStart = day + 'T00:00:00.000Z'
      const dayEnd = day + 'T23:59:59.999Z'

      // Summarize sales for the day
      const summary = await summarizeSalesByBranchDay({
        organization_id,
        branch_id,
        dayStart,
        dayEnd
      })

      // Check if there are any sales to post
      const hasSales = Object.values(summary.totals).some(amount => amount > 0)
      if (!hasSales) {
        result.success = true
        result.error = 'No sales found for the day - skipped'
        return result
      }

      // Build journal payload
      const postingDateTime = day + 'T23:59:00.000Z'
      const journalPayload = buildDailyJournalPayload(summary, policy, postingDateTime)

      // Post to GL
      const postResult = await postDailySalesJournal(journalPayload)

      if (postResult.success) {
        result.success = true
        result.transaction_id = postResult.transaction_id
        result.total_amount = journalPayload.header.total_amount
        result.transaction_count = summary.transactionCount
        return result
      } else {
        throw new Error(postResult.error || 'Failed to post journal')
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      if (attempt < retryAttempts) {
        console.warn(
          `Attempt ${attempt} failed for ${organization_id}/${branch_id}/${day}, retrying...`,
          error
        )
        await new Promise(resolve => setTimeout(resolve, 30000)) // 30 second delay
      }
    }
  }

  result.error = lastError?.message || 'Failed after all retry attempts'
  return result
}

/**
 * Posts daily sales for all configured organizations
 */
export async function postDailySalesForAllOrganizations(day?: string): Promise<PostingResult[]> {
  const targetDay = day || getPreviousDay()
  const config = await getSchedulerConfig()

  if (!config.enabled) {
    console.log('Scheduler is disabled')
    return []
  }

  console.log(
    `Starting daily posting for ${targetDay} across ${config.organizations.length} organizations`
  )

  const results: PostingResult[] = []

  for (const organizationId of config.organizations) {
    try {
      // Get branches for organization (for now, use org as branch)
      const branchIds = [organizationId]

      for (const branchId of branchIds) {
        const result = await postDailySalesForBranch(
          organizationId,
          branchId,
          targetDay,
          config.retryAttempts
        )

        results.push(result)

        if (result.success) {
          console.log(
            `✓ Posted daily sales for ${organizationId}/${branchId}/${targetDay}: ${result.total_amount} ${result.transaction_count} txns`
          )
        } else {
          console.error(
            `✗ Failed to post daily sales for ${organizationId}/${branchId}/${targetDay}: ${result.error}`
          )
        }
      }
    } catch (error) {
      console.error(`Error processing organization ${organizationId}:`, error)
      results.push({
        organization_id: organizationId,
        branch_id: organizationId,
        day: targetDay,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        posted_at: new Date().toISOString()
      })
    }
  }

  // Log summary
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const totalAmount = results
    .filter(r => r.success && r.total_amount)
    .reduce((sum, r) => sum + (r.total_amount || 0), 0)

  console.log(
    `Daily posting completed for ${targetDay}: ${successful} successful, ${failed} failed, total ${totalAmount.toFixed(2)}`
  )

  return results
}

/**
 * Gets previous day in YYYY-MM-DD format
 */
export function getPreviousDay(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString().slice(0, 10)
}

/**
 * Checks if it's time to run the scheduler (23:59 Europe/London)
 */
export function isScheduledTime(): boolean {
  const now = new Date()
  const londonTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now)

  return londonTime === '23:59'
}

/**
 * Runs the scheduled posting job
 * This would be called by a cron job or serverless function
 */
export async function runScheduledPosting(): Promise<void> {
  try {
    const config = await getSchedulerConfig()

    if (!config.enabled) {
      console.log('Scheduled posting is disabled')
      return
    }

    if (!isScheduledTime()) {
      console.log('Not scheduled time for posting')
      return
    }

    console.log('Starting scheduled daily posting...')

    const results = await postDailySalesForAllOrganizations()

    // Store results in database for audit trail
    await storePostingResults(results)

    console.log('Scheduled daily posting completed')
  } catch (error) {
    console.error('Error in scheduled posting:', error)
    throw error
  }
}

/**
 * Stores posting results in universal tables for audit trail
 */
async function storePostingResults(results: PostingResult[]): Promise<void> {
  try {
    for (const result of results) {
      // Store in universal_transactions as audit record
      await universalApi.create({
        table: 'universal_transactions',
        data: {
          organization_id: result.organization_id,
          transaction_type: 'scheduler_log',
          smart_code: 'HERA.FINANCE.SCHEDULER.DAILY_POST.LOG.v1',
          when_ts: result.posted_at,
          branch_id: result.branch_id,
          status: result.success ? 'completed' : 'failed',
          total_amount: result.total_amount || 0,
          memo: result.success
            ? `Daily posting successful: ${result.transaction_count} transactions, ${result.total_amount} total`
            : `Daily posting failed: ${result.error}`,
          metadata: {
            day: result.day,
            transaction_id: result.transaction_id,
            error: result.error,
            transaction_count: result.transaction_count
          }
        }
      })
    }
  } catch (error) {
    console.error('Error storing posting results:', error)
    // Don't throw - this is audit trail only
  }
}

/**
 * API endpoint handler for manual scheduler execution
 */
export async function handleSchedulerAPI(request: any): Promise<any> {
  try {
    const body = await request.json()
    const { action, day, organization_ids } = body

    switch (action) {
      case 'run_now':
        const results = await postDailySalesForAllOrganizations(day)
        return {
          success: true,
          data: {
            results,
            summary: {
              total: results.length,
              successful: results.filter(r => r.success).length,
              failed: results.filter(r => !r.success).length,
              total_amount: results
                .filter(r => r.success && r.total_amount)
                .reduce((sum, r) => sum + (r.total_amount || 0), 0)
            }
          }
        }

      case 'get_config':
        const config = await getSchedulerConfig()
        return {
          success: true,
          data: { config }
        }

      default:
        return {
          success: false,
          error: 'Invalid action. Use: run_now, get_config'
        }
    }
  } catch (error) {
    console.error('Error in scheduler API:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Example cron job setup for production:
 *
 * // In your deployment (e.g., Vercel cron, AWS Lambda)
 * export async function handler() {
 *   await runScheduledPosting();
 * }
 *
 * // Cron expression: 59 23 * * * (every day at 23:59 UTC)
 * // Adjust for Europe/London timezone handling
 */
