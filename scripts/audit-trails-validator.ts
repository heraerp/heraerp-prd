/**
 * HERA Actor Tracing and GL Audit Trail Validation Script
 * Validates actor coverage, GL balance integrity, and audit trails
 * 
 * Week 3: Enhanced Observability Infrastructure
 * Usage: npm run audit:trails
 */

import { createClient } from '@supabase/supabase-js'

interface AuditConfig {
  supabaseUrl: string
  supabaseKey: string
  organizationId?: string
  timeRange?: {
    start: string
    end: string
  }
  checks: {
    actorCoverage: boolean
    glBalance: boolean
    auditTrails: boolean
    smartCodeCompliance: boolean
  }
}

interface AuditResult {
  timestamp: string
  organizationId?: string
  checks: {
    actorCoverage: ActorCoverageResult
    glBalance: GLBalanceResult
    auditTrails: AuditTrailsResult
    smartCodeCompliance: SmartCodeComplianceResult
  }
  summary: {
    totalIssues: number
    criticalIssues: number
    warnings: number
    passed: boolean
  }
}

interface ActorCoverageResult {
  totalRecords: number
  missingActor: number
  orphanedRecords: number
  actorCoverage: number // percentage
  issues: Array<{
    table: string
    record_id: string
    issue: string
    severity: 'critical' | 'warning'
  }>
}

interface GLBalanceResult {
  totalTransactions: number
  unbalancedTransactions: number
  unbalancedAmount: number
  currencies: Record<string, {
    transactions: number
    unbalanced: number
    totalVariance: number
  }>
  issues: Array<{
    transactionId: string
    currency: string
    debitTotal: number
    creditTotal: number
    variance: number
    severity: 'critical' | 'warning'
  }>
}

interface AuditTrailsResult {
  tablesChecked: number
  missingAuditFields: number
  auditFieldCoverage: number // percentage
  recentActivity: {
    entities: number
    transactions: number
    relationships: number
  }
  issues: Array<{
    table: string
    record_id: string
    issue: string
    severity: 'critical' | 'warning'
  }>
}

interface SmartCodeComplianceResult {
  totalRecords: number
  missingSmartCodes: number
  invalidSmartCodes: number
  complianceRate: number // percentage
  issues: Array<{
    table: string
    record_id: string
    smartCode: string
    issue: string
    severity: 'critical' | 'warning'
  }>
}

export class HERAAuditTrailsValidator {
  private supabase: ReturnType<typeof createClient>
  private config: AuditConfig

  constructor(config: AuditConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
  }

  async validateAuditTrails(): Promise<AuditResult> {
    console.log('🔍 Starting HERA audit trails validation...')
    
    const result: AuditResult = {
      timestamp: new Date().toISOString(),
      organizationId: this.config.organizationId,
      checks: {
        actorCoverage: await this.validateActorCoverage(),
        glBalance: await this.validateGLBalance(),
        auditTrails: await this.validateAuditFields(),
        smartCodeCompliance: await this.validateSmartCodeCompliance()
      },
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        warnings: 0,
        passed: false
      }
    }

    // Calculate summary
    result.summary.totalIssues = 
      result.checks.actorCoverage.issues.length +
      result.checks.glBalance.issues.length +
      result.checks.auditTrails.issues.length +
      result.checks.smartCodeCompliance.issues.length

    result.summary.criticalIssues = 
      result.checks.actorCoverage.issues.filter(i => i.severity === 'critical').length +
      result.checks.glBalance.issues.filter(i => i.severity === 'critical').length +
      result.checks.auditTrails.issues.filter(i => i.severity === 'critical').length +
      result.checks.smartCodeCompliance.issues.filter(i => i.severity === 'critical').length

    result.summary.warnings = result.summary.totalIssues - result.summary.criticalIssues

    result.summary.passed = result.summary.criticalIssues === 0 &&
      result.checks.actorCoverage.actorCoverage >= 95 &&
      result.checks.glBalance.unbalancedTransactions === 0 &&
      result.checks.auditTrails.auditFieldCoverage >= 98 &&
      result.checks.smartCodeCompliance.complianceRate >= 95

    return result
  }

  private async validateActorCoverage(): Promise<ActorCoverageResult> {
    console.log('   👤 Validating actor coverage...')

    const issues: ActorCoverageResult['issues'] = []
    let totalRecords = 0
    let missingActor = 0
    let orphanedRecords = 0

    // Check core_entities
    const entitiesQuery = `
      SELECT id, entity_name, created_by, updated_by
      FROM core_entities
      ${this.config.organizationId ? 'WHERE organization_id = $1' : ''}
    `
    const { data: entities, error: entitiesError } = await this.supabase.rpc('direct_query', {
      query_text: entitiesQuery,
      params: this.config.organizationId ? [this.config.organizationId] : []
    })

    if (entities && !entitiesError) {
      totalRecords += entities.length
      for (const entity of entities) {
        if (!entity.created_by) {
          missingActor++
          issues.push({
            table: 'core_entities',
            record_id: entity.id,
            issue: 'Missing created_by field',
            severity: 'critical'
          })
        }
        if (!entity.updated_by) {
          issues.push({
            table: 'core_entities',
            record_id: entity.id,
            issue: 'Missing updated_by field',
            severity: 'critical'
          })
        }
      }
    }

    // Check universal_transactions
    const transactionsQuery = `
      SELECT id, transaction_number, created_by, updated_by
      FROM universal_transactions
      ${this.config.organizationId ? 'WHERE organization_id = $1' : ''}
    `
    const { data: transactions, error: transactionsError } = await this.supabase.rpc('direct_query', {
      query_text: transactionsQuery,
      params: this.config.organizationId ? [this.config.organizationId] : []
    })

    if (transactions && !transactionsError) {
      totalRecords += transactions.length
      for (const transaction of transactions) {
        if (!transaction.created_by) {
          missingActor++
          issues.push({
            table: 'universal_transactions',
            record_id: transaction.id,
            issue: 'Missing created_by field',
            severity: 'critical'
          })
        }
        if (!transaction.updated_by) {
          issues.push({
            table: 'universal_transactions',
            record_id: transaction.id,
            issue: 'Missing updated_by field',
            severity: 'critical'
          })
        }
      }
    }

    // Check for orphaned records (actors that don't exist)
    const orphanCheckQuery = `
      SELECT COUNT(*) as orphaned_count
      FROM core_entities ce
      LEFT JOIN core_entities creator ON creator.id = ce.created_by
      WHERE ce.created_by IS NOT NULL AND creator.id IS NULL
      ${this.config.organizationId ? 'AND ce.organization_id = $1' : ''}
    `
    const { data: orphanedData } = await this.supabase.rpc('direct_query', {
      query_text: orphanCheckQuery,
      params: this.config.organizationId ? [this.config.organizationId] : []
    })

    if (orphanedData && orphanedData.length > 0) {
      orphanedRecords = orphanedData[0].orphaned_count
      if (orphanedRecords > 0) {
        issues.push({
          table: 'core_entities',
          record_id: 'multiple',
          issue: `${orphanedRecords} records reference non-existent actors`,
          severity: 'critical'
        })
      }
    }

    const actorCoverage = totalRecords > 0 ? ((totalRecords - missingActor) / totalRecords) * 100 : 100

    return {
      totalRecords,
      missingActor,
      orphanedRecords,
      actorCoverage,
      issues
    }
  }

  private async validateGLBalance(): Promise<GLBalanceResult> {
    console.log('   📊 Validating GL balance integrity...')

    const issues: GLBalanceResult['issues'] = []
    const currencies: Record<string, { transactions: number; unbalanced: number; totalVariance: number }> = {}

    // Check GL balance for all transactions with GL lines
    const glBalanceQuery = `
      WITH gl_lines AS (
        SELECT 
          utl.transaction_id,
          utl.transaction_currency_code as currency,
          utl.line_data->>'side' as side,
          utl.line_amount::numeric as amount
        FROM universal_transaction_lines utl
        JOIN universal_transactions ut ON ut.id = utl.transaction_id
        WHERE utl.smart_code LIKE '%GL%'
        ${this.config.organizationId ? 'AND ut.organization_id = $1' : ''}
        ${this.config.timeRange ? 'AND ut.transaction_date >= $2 AND ut.transaction_date <= $3' : ''}
      ),
      transaction_balances AS (
        SELECT
          transaction_id,
          currency,
          SUM(CASE WHEN side = 'DR' THEN amount ELSE 0 END) as debit_total,
          SUM(CASE WHEN side = 'CR' THEN amount ELSE 0 END) as credit_total,
          ABS(SUM(CASE WHEN side = 'DR' THEN amount ELSE -amount END)) as variance
        FROM gl_lines
        GROUP BY transaction_id, currency
      )
      SELECT 
        transaction_id,
        currency,
        debit_total,
        credit_total,
        variance
      FROM transaction_balances
      WHERE variance > 0.01
    `

    const params = []
    if (this.config.organizationId) params.push(this.config.organizationId)
    if (this.config.timeRange) {
      params.push(this.config.timeRange.start, this.config.timeRange.end)
    }

    const { data: unbalancedTransactions, error } = await this.supabase.rpc('direct_query', {
      query_text: glBalanceQuery,
      params
    })

    let totalTransactions = 0
    let unbalancedTransactions_count = 0
    let unbalancedAmount = 0

    if (unbalancedTransactions && !error) {
      unbalancedTransactions_count = unbalancedTransactions.length
      
      for (const txn of unbalancedTransactions) {
        const currency = txn.currency || 'DOC'
        
        if (!currencies[currency]) {
          currencies[currency] = { transactions: 0, unbalanced: 0, totalVariance: 0 }
        }
        
        currencies[currency].unbalanced++
        currencies[currency].totalVariance += txn.variance
        unbalancedAmount += txn.variance

        issues.push({
          transactionId: txn.transaction_id,
          currency: currency,
          debitTotal: txn.debit_total,
          creditTotal: txn.credit_total,
          variance: txn.variance,
          severity: txn.variance > 1.0 ? 'critical' : 'warning'
        })
      }
    }

    // Get total transaction count
    const totalQuery = `
      SELECT COUNT(DISTINCT ut.id) as total_count
      FROM universal_transactions ut
      JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
      WHERE utl.smart_code LIKE '%GL%'
      ${this.config.organizationId ? 'AND ut.organization_id = $1' : ''}
    `
    
    const { data: totalData } = await this.supabase.rpc('direct_query', {
      query_text: totalQuery,
      params: this.config.organizationId ? [this.config.organizationId] : []
    })

    if (totalData && totalData.length > 0) {
      totalTransactions = totalData[0].total_count
    }

    return {
      totalTransactions,
      unbalancedTransactions: unbalancedTransactions_count,
      unbalancedAmount,
      currencies,
      issues
    }
  }

  private async validateAuditFields(): Promise<AuditTrailsResult> {
    console.log('   📝 Validating audit field coverage...')

    const issues: AuditTrailsResult['issues'] = []
    const tables = ['core_entities', 'universal_transactions', 'universal_transaction_lines', 'core_relationships', 'core_dynamic_data']
    
    let totalRecords = 0
    let missingAuditFields = 0
    let recentActivity = { entities: 0, transactions: 0, relationships: 0 }

    for (const table of tables) {
      const auditQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(created_by) as has_created_by,
          COUNT(updated_by) as has_updated_by,
          COUNT(created_at) as has_created_at,
          COUNT(updated_at) as has_updated_at
        FROM ${table}
        ${this.config.organizationId ? 'WHERE organization_id = $1' : ''}
      `

      const { data: auditData, error } = await this.supabase.rpc('direct_query', {
        query_text: auditQuery,
        params: this.config.organizationId ? [this.config.organizationId] : []
      })

      if (auditData && !error && auditData.length > 0) {
        const data = auditData[0]
        totalRecords += data.total
        
        const missingCreatedBy = data.total - data.has_created_by
        const missingUpdatedBy = data.total - data.has_updated_by
        const missingCreatedAt = data.total - data.has_created_at
        const missingUpdatedAt = data.total - data.has_updated_at
        
        missingAuditFields += missingCreatedBy + missingUpdatedBy + missingCreatedAt + missingUpdatedAt

        if (missingCreatedBy > 0) {
          issues.push({
            table,
            record_id: 'multiple',
            issue: `${missingCreatedBy} records missing created_by`,
            severity: 'critical'
          })
        }

        if (missingUpdatedBy > 0) {
          issues.push({
            table,
            record_id: 'multiple',
            issue: `${missingUpdatedBy} records missing updated_by`,
            severity: 'critical'
          })
        }
      }
    }

    // Check recent activity (last 24 hours)
    const recentQuery = `
      SELECT 
        'entities' as type, COUNT(*) as count
      FROM core_entities 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ${this.config.organizationId ? 'AND organization_id = $1' : ''}
      UNION ALL
      SELECT 
        'transactions' as type, COUNT(*) as count
      FROM universal_transactions
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ${this.config.organizationId ? 'AND organization_id = $1' : ''}
      UNION ALL
      SELECT 
        'relationships' as type, COUNT(*) as count
      FROM core_relationships
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ${this.config.organizationId ? 'AND organization_id = $1' : ''}
    `

    const { data: recentData } = await this.supabase.rpc('direct_query', {
      query_text: recentQuery,
      params: this.config.organizationId ? [this.config.organizationId] : []
    })

    if (recentData) {
      for (const row of recentData) {
        if (row.type === 'entities') recentActivity.entities = row.count
        if (row.type === 'transactions') recentActivity.transactions = row.count
        if (row.type === 'relationships') recentActivity.relationships = row.count
      }
    }

    const expectedAuditFields = totalRecords * 4 // created_by, updated_by, created_at, updated_at
    const auditFieldCoverage = expectedAuditFields > 0 
      ? ((expectedAuditFields - missingAuditFields) / expectedAuditFields) * 100 
      : 100

    return {
      tablesChecked: tables.length,
      missingAuditFields,
      auditFieldCoverage,
      recentActivity,
      issues
    }
  }

  private async validateSmartCodeCompliance(): Promise<SmartCodeComplianceResult> {
    console.log('   🧬 Validating Smart Code compliance...')

    const issues: SmartCodeComplianceResult['issues'] = []
    const smartCodeRegex = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/

    // Check core_entities Smart Codes
    const entitiesQuery = `
      SELECT id, entity_name, smart_code
      FROM core_entities
      WHERE smart_code IS NOT NULL
      ${this.config.organizationId ? 'AND organization_id = $1' : ''}
    `

    const { data: entities } = await this.supabase.rpc('direct_query', {
      query_text: entitiesQuery,
      params: this.config.organizationId ? [this.config.organizationId] : []
    })

    let totalRecords = 0
    let missingSmartCodes = 0
    let invalidSmartCodes = 0

    if (entities) {
      totalRecords += entities.length
      
      for (const entity of entities) {
        if (!entity.smart_code) {
          missingSmartCodes++
          issues.push({
            table: 'core_entities',
            record_id: entity.id,
            smartCode: '',
            issue: 'Missing Smart Code',
            severity: 'critical'
          })
        } else if (!smartCodeRegex.test(entity.smart_code)) {
          invalidSmartCodes++
          issues.push({
            table: 'core_entities',
            record_id: entity.id,
            smartCode: entity.smart_code,
            issue: 'Invalid Smart Code format',
            severity: 'critical'
          })
        }
      }
    }

    // Check universal_transactions Smart Codes
    const transactionsQuery = `
      SELECT id, transaction_number, smart_code
      FROM universal_transactions
      WHERE smart_code IS NOT NULL
      ${this.config.organizationId ? 'AND organization_id = $1' : ''}
    `

    const { data: transactions } = await this.supabase.rpc('direct_query', {
      query_text: transactionsQuery,
      params: this.config.organizationId ? [this.config.organizationId] : []
    })

    if (transactions) {
      totalRecords += transactions.length
      
      for (const transaction of transactions) {
        if (!transaction.smart_code) {
          missingSmartCodes++
          issues.push({
            table: 'universal_transactions',
            record_id: transaction.id,
            smartCode: '',
            issue: 'Missing Smart Code',
            severity: 'critical'
          })
        } else if (!smartCodeRegex.test(transaction.smart_code)) {
          invalidSmartCodes++
          issues.push({
            table: 'universal_transactions',
            record_id: transaction.id,
            smartCode: transaction.smart_code,
            issue: 'Invalid Smart Code format',
            severity: 'critical'
          })
        }
      }
    }

    const complianceRate = totalRecords > 0 
      ? ((totalRecords - missingSmartCodes - invalidSmartCodes) / totalRecords) * 100 
      : 100

    return {
      totalRecords,
      missingSmartCodes,
      invalidSmartCodes,
      complianceRate,
      issues
    }
  }

  generateReport(result: AuditResult): string {
    const { checks, summary } = result

    let report = `
# HERA Audit Trails Validation Report
Generated: ${result.timestamp}
Organization: ${result.organizationId || 'All Organizations'}

## Summary
- Overall Status: ${summary.passed ? '✅ PASSED' : '❌ FAILED'}
- Total Issues: ${summary.totalIssues}
- Critical Issues: ${summary.criticalIssues}
- Warnings: ${summary.warnings}

## Actor Coverage
- Total Records: ${checks.actorCoverage.totalRecords}
- Missing Actor: ${checks.actorCoverage.missingActor}
- Orphaned Records: ${checks.actorCoverage.orphanedRecords}
- Coverage: ${checks.actorCoverage.actorCoverage.toFixed(2)}%

## GL Balance Integrity
- Total Transactions: ${checks.glBalance.totalTransactions}
- Unbalanced: ${checks.glBalance.unbalancedTransactions}
- Total Variance: $${checks.glBalance.unbalancedAmount.toFixed(2)}

## Audit Fields Coverage
- Tables Checked: ${checks.auditTrails.tablesChecked}
- Missing Audit Fields: ${checks.auditTrails.missingAuditFields}
- Coverage: ${checks.auditTrails.auditFieldCoverage.toFixed(2)}%

## Smart Code Compliance
- Total Records: ${checks.smartCodeCompliance.totalRecords}
- Missing Smart Codes: ${checks.smartCodeCompliance.missingSmartCodes}
- Invalid Smart Codes: ${checks.smartCodeCompliance.invalidSmartCodes}
- Compliance Rate: ${checks.smartCodeCompliance.complianceRate.toFixed(2)}%

## Critical Issues
`
    
    const allIssues = [
      ...checks.actorCoverage.issues.filter(i => i.severity === 'critical'),
      ...checks.glBalance.issues.filter(i => i.severity === 'critical'),
      ...checks.auditTrails.issues.filter(i => i.severity === 'critical'),
      ...checks.smartCodeCompliance.issues.filter(i => i.severity === 'critical')
    ]

    if (allIssues.length === 0) {
      report += '✅ No critical issues found!\n'
    } else {
      for (const issue of allIssues.slice(0, 10)) { // Show first 10
        report += `- ${issue.table}: ${issue.issue}\n`
      }
      if (allIssues.length > 10) {
        report += `... and ${allIssues.length - 10} more critical issues.\n`
      }
    }

    return report
  }
}

// CLI interface for script
if (import.meta.main) {
  const config: AuditConfig = {
    supabaseUrl: Deno.env.get('SUPABASE_URL') || '',
    supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    organizationId: Deno.env.get('AUDIT_ORGANIZATION_ID'),
    checks: {
      actorCoverage: true,
      glBalance: true,
      auditTrails: true,
      smartCodeCompliance: true
    }
  }

  if (!config.supabaseUrl || !config.supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
    Deno.exit(1)
  }

  const validator = new HERAAuditTrailsValidator(config)
  const result = await validator.validateAuditTrails()
  const report = validator.generateReport(result)
  
  console.log(report)
  
  // Exit with error code if critical issues found
  if (!result.summary.passed) {
    Deno.exit(1)
  }
}