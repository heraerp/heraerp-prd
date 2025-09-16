/**
 * HERA Universal Fiscal Year DNA
 * Reusable fiscal year and year-end closing functionality for ANY business
 */

import { universalApi } from '@/src/lib/universal-api'

export interface FiscalYearConfig {
  fiscalType: 'calendar' | 'fiscal' | 'custom'
  startMonth?: number // 1-12, defaults to 1 (January)
  periodsPerYear?: number // defaults to 12
  currentYear?: number // defaults to current year
  retainedEarningsAccount?: string // GL account code
  currentEarningsAccount?: string // GL account code
  customPeriodLength?: number // For custom fiscal types (e.g., 4-4-5 weeks)
}

export interface ClosingOptions {
  revenuePattern?: string // SQL LIKE pattern, defaults to '4%'
  expensePattern?: string // SQL LIKE pattern, defaults to '5%'
  closeByDepartment?: boolean
  closeByBranch?: boolean
  includeOtherIncome?: boolean // Include accounts starting with '6'
  includeOtherExpenses?: boolean // Include accounts starting with '7'
}

export interface FiscalPeriod {
  id: string
  code: string
  name: string
  periodNumber: number
  status: 'open' | 'current' | 'closed'
  startDate: string
  endDate: string
}

export interface ClosingResult {
  fiscalYear: number
  closingDate: string
  totalRevenue: number
  totalExpenses: number
  otherIncome?: number
  otherExpenses?: number
  netIncome: number
  closingEntryId: string
  periodsClosed: number
  status: 'completed' | 'failed'
}

/**
 * Universal Fiscal Year Manager
 */
export class UniversalFiscalYear {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Setup fiscal year for any organization
   */
  async setupFiscalYear(config: FiscalYearConfig = {}): Promise<{
    fiscalConfigId: string
    fiscalType: string
    periodsCreated: number
    currentYear: number
    status: string
  }> {
    // Set defaults
    const finalConfig: FiscalYearConfig = {
      fiscalType: 'calendar',
      startMonth: 1,
      periodsPerYear: 12,
      currentYear: new Date().getFullYear(),
      retainedEarningsAccount: '3200000',
      currentEarningsAccount: '3300000',
      ...config
    }

    // Create fiscal configuration
    const fiscalConfigEntity = await universalApi.createEntity({
      entity_type: 'fiscal_configuration',
      entity_code: `FISCAL-CONFIG-${finalConfig.currentYear}`,
      entity_name: `Fiscal Year Configuration ${finalConfig.currentYear}`,
      smart_code: `HERA.FISCAL.CONFIG.${finalConfig.fiscalType.toUpperCase()}.v1`
    })

    // Add configuration settings
    const settings = [
      { field: 'fiscal_type', value: finalConfig.fiscalType, type: 'text' },
      { field: 'start_month', value: finalConfig.startMonth, type: 'number' },
      { field: 'periods_per_year', value: finalConfig.periodsPerYear, type: 'number' },
      { field: 'current_year', value: finalConfig.currentYear, type: 'number' },
      {
        field: 'retained_earnings_account',
        value: finalConfig.retainedEarningsAccount,
        type: 'text'
      },
      { field: 'current_earnings_account', value: finalConfig.currentEarningsAccount, type: 'text' }
    ]

    for (const setting of settings) {
      await universalApi.setDynamicField(
        fiscalConfigEntity.id,
        setting.field,
        setting.value,
        `HERA.FISCAL.${setting.field.toUpperCase()}.v1`
      )
    }

    // Create fiscal periods
    const periods = await this.createFiscalPeriods(fiscalConfigEntity.id, finalConfig)

    // Create closing configuration
    await this.createClosingConfiguration(finalConfig)

    return {
      fiscalConfigId: fiscalConfigEntity.id,
      fiscalType: finalConfig.fiscalType,
      periodsCreated: periods.length,
      currentYear: finalConfig.currentYear!,
      status: 'success'
    }
  }

  /**
   * Create fiscal periods based on configuration
   */
  private async createFiscalPeriods(
    fiscalConfigId: string,
    config: FiscalYearConfig
  ): Promise<FiscalPeriod[]> {
    const periods: FiscalPeriod[] = []
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ]

    for (let i = 0; i < (config.periodsPerYear || 12); i++) {
      let periodStart: Date
      let periodEnd: Date
      let periodName: string

      if (config.fiscalType === 'calendar') {
        // Standard calendar year
        periodStart = new Date(config.currentYear!, i, 1)
        periodEnd = new Date(config.currentYear!, i + 1, 0)
        periodName = `${monthNames[i]} ${config.currentYear}`
      } else if (config.fiscalType === 'fiscal') {
        // Fiscal year starting from specified month
        const monthIndex = (config.startMonth! - 1 + i) % 12
        const year = config.currentYear! + Math.floor((config.startMonth! - 1 + i) / 12)
        periodStart = new Date(year, monthIndex, 1)
        periodEnd = new Date(year, monthIndex + 1, 0)
        periodName = `${monthNames[monthIndex]} ${year}`
      } else {
        // Custom periods (simplified - real implementation would be more complex)
        const daysPerPeriod = Math.floor(365 / (config.periodsPerYear || 12))
        periodStart = new Date(config.currentYear!, 0, 1 + i * daysPerPeriod)
        periodEnd = new Date(config.currentYear!, 0, (i + 1) * daysPerPeriod)
        periodName = `Period ${i + 1} FY${config.currentYear}`
      }

      const periodCode = `FY${config.currentYear}-P${String(i + 1).padStart(2, '0')}`

      // Create period entity
      const periodEntity = await universalApi.createEntity({
        entity_type: 'fiscal_period',
        entity_code: periodCode,
        entity_name: periodName,
        smart_code: `HERA.FISCAL.PERIOD.${i + 1}.v1`
      })

      // Add period details
      await universalApi.setDynamicField(periodEntity.id, 'period_number', i + 1)
      await universalApi.setDynamicField(
        periodEntity.id,
        'period_status',
        i === 11 ? 'current' : 'open'
      )
      await universalApi.setDynamicField(
        periodEntity.id,
        'start_date',
        periodStart.toISOString().split('T')[0]
      )
      await universalApi.setDynamicField(
        periodEntity.id,
        'end_date',
        periodEnd.toISOString().split('T')[0]
      )

      // Create relationship to fiscal config
      await universalApi.createRelationship({
        from_entity_id: fiscalConfigId,
        to_entity_id: periodEntity.id,
        relationship_type: 'has_period',
        smart_code: 'HERA.FISCAL.REL.CONFIG.PERIOD.v1'
      })

      periods.push({
        id: periodEntity.id,
        code: periodCode,
        name: periodName,
        periodNumber: i + 1,
        status: i === 11 ? 'current' : 'open',
        startDate: periodStart.toISOString().split('T')[0],
        endDate: periodEnd.toISOString().split('T')[0]
      })
    }

    return periods
  }

  /**
   * Create year-end closing configuration
   */
  private async createClosingConfiguration(config: FiscalYearConfig): Promise<void> {
    const closingConfig = await universalApi.createEntity({
      entity_type: 'closing_configuration',
      entity_code: 'YEAR-END-CONFIG',
      entity_name: 'Year-End Closing Configuration',
      smart_code: 'HERA.CLOSING.CONFIG.v1'
    })

    // Add closing steps configuration
    const steps = [
      { field: 'step_1_reconcile', value: true },
      { field: 'step_2_adjustments', value: true },
      { field: 'step_3_close_revenue', value: true },
      { field: 'step_4_close_expenses', value: true },
      { field: 'step_5_calculate_pl', value: true },
      { field: 'step_6_transfer_retained', value: true },
      { field: 'retained_earnings_account', value: config.retainedEarningsAccount },
      { field: 'current_earnings_account', value: config.currentEarningsAccount }
    ]

    for (const step of steps) {
      await universalApi.setDynamicField(closingConfig.id, step.field, step.value)
    }

    // Create universal closing checklist
    await this.createClosingChecklist()
  }

  /**
   * Create universal closing checklist
   */
  private async createClosingChecklist(): Promise<void> {
    const checklistItems = [
      { code: 'YEC-01', name: 'Reconcile all bank accounts', category: 'reconciliation' },
      { code: 'YEC-02', name: 'Complete physical inventory count', category: 'inventory' },
      { code: 'YEC-03', name: 'Review and adjust prepaid expenses', category: 'adjustments' },
      { code: 'YEC-04', name: 'Accrue unpaid expenses', category: 'adjustments' },
      { code: 'YEC-05', name: 'Calculate and book depreciation', category: 'adjustments' },
      { code: 'YEC-06', name: 'Review accounts receivable aging', category: 'receivables' },
      { code: 'YEC-07', name: 'Review accounts payable', category: 'payables' },
      { code: 'YEC-08', name: 'Reconcile intercompany accounts', category: 'reconciliation' },
      { code: 'YEC-09', name: 'Review tax accounts and liabilities', category: 'tax' },
      { code: 'YEC-10', name: 'Generate trial balance', category: 'reporting' },
      { code: 'YEC-11', name: 'Close revenue accounts', category: 'closing' },
      { code: 'YEC-12', name: 'Close expense accounts', category: 'closing' },
      { code: 'YEC-13', name: 'Transfer net income/loss', category: 'closing' },
      { code: 'YEC-14', name: 'Generate financial statements', category: 'reporting' },
      { code: 'YEC-15', name: 'Backup all financial data', category: 'backup' }
    ]

    for (const item of checklistItems) {
      await universalApi.createEntity({
        entity_type: 'closing_checklist_item',
        entity_code: item.code,
        entity_name: item.name,
        smart_code: `HERA.CLOSING.CHECKLIST.${item.code}.v1`,
        metadata: {
          category: item.category,
          status: 'pending',
          required: true
        }
      })
    }
  }

  /**
   * Execute year-end closing
   */
  async executeYearEndClosing(
    fiscalYear: number,
    closingDate: Date = new Date(),
    options: ClosingOptions = {}
  ): Promise<ClosingResult> {
    // This would call the database function via API
    const result = await universalApi.customQuery({
      query: 'SELECT hera_universal_year_end_closing($1, $2, $3, $4) as result',
      params: [
        this.organizationId,
        fiscalYear,
        closingDate.toISOString().split('T')[0],
        JSON.stringify(options)
      ]
    })

    return result.data[0].result
  }

  /**
   * Get fiscal periods for a year
   */
  async getFiscalPeriods(fiscalYear: number): Promise<FiscalPeriod[]> {
    const periods = await universalApi.getEntities(this.organizationId, 'fiscal_period', {
      filter: { entity_code: { $like: `FY${fiscalYear}%` } }
    })

    // Enrich with dynamic data
    const enrichedPeriods: FiscalPeriod[] = []
    for (const period of periods) {
      const dynamicData = await universalApi.getDynamicData(period.id)

      enrichedPeriods.push({
        id: period.id,
        code: period.entity_code,
        name: period.entity_name,
        periodNumber: dynamicData.period_number,
        status: dynamicData.period_status,
        startDate: dynamicData.start_date,
        endDate: dynamicData.end_date
      })
    }

    return enrichedPeriods.sort((a, b) => a.periodNumber - b.periodNumber)
  }

  /**
   * Update period status
   */
  async updatePeriodStatus(
    periodId: string,
    newStatus: 'open' | 'current' | 'closed'
  ): Promise<void> {
    await universalApi.setDynamicField(periodId, 'period_status', newStatus)
  }

  /**
   * Check if posting is allowed for a date
   */
  async canPostToDate(transactionDate: Date): Promise<boolean> {
    const periods = await this.getFiscalPeriods(transactionDate.getFullYear())

    const period = periods.find(p => {
      const start = new Date(p.startDate)
      const end = new Date(p.endDate)
      return transactionDate >= start && transactionDate <= end
    })

    return period ? period.status !== 'closed' : false
  }

  /**
   * Rollover to new fiscal year
   */
  async rolloverFiscalYear(fromYear: number, toYear: number): Promise<void> {
    // Get configuration from current year
    const currentConfig = await universalApi.getEntities(
      this.organizationId,
      'fiscal_configuration',
      {
        filter: { entity_code: `FISCAL-CONFIG-${fromYear}` }
      }
    )

    if (currentConfig.length === 0) {
      throw new Error(`No fiscal configuration found for year ${fromYear}`)
    }

    // Get dynamic data for configuration
    const configData = await universalApi.getDynamicData(currentConfig[0].id)

    // Create new year with same configuration
    await this.setupFiscalYear({
      fiscalType: configData.fiscal_type,
      startMonth: configData.start_month,
      periodsPerYear: configData.periods_per_year,
      currentYear: toYear,
      retainedEarningsAccount: configData.retained_earnings_account,
      currentEarningsAccount: configData.current_earnings_account
    })
  }
}

/**
 * Factory function to create fiscal year manager
 */
export function createFiscalYearManager(organizationId: string): UniversalFiscalYear {
  return new UniversalFiscalYear(organizationId)
}
