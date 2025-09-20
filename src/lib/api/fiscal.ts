// ================================================================================
// FISCAL API WRAPPER - SACRED SIX IMPLEMENTATION
// Smart Code: HERA.API.FISCAL.v1
// Production-ready fiscal API using Sacred Six storage only
// ================================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  FiscalConfig, 
  FiscalPeriod, 
  CloseChecklist,
  CloseChecklistItem,
  YearCloseRequest,
  FISCAL_SMART_CODES,
  FISCAL_DYNAMIC_DATA_KEYS,
  DEFAULT_CHECKLIST_ITEMS
} from '@/lib/schemas/fiscal'
import { universalApi } from '@/lib/universal-api'

export function useFiscalApi(organizationId: string) {
  const queryClient = useQueryClient()

  // Query keys
  const keys = {
    config: ['fiscal', 'config', organizationId],
    periods: ['fiscal', 'periods', organizationId],
    checklist: ['fiscal', 'checklist', organizationId]
  }

  // ==================== FISCAL CONFIG ====================

  const getConfig = useQuery({
    queryKey: keys.config,
    queryFn: async (): Promise<FiscalConfig> => {
      try {
        const result = await universalApi.getDynamicData(organizationId, FISCAL_DYNAMIC_DATA_KEYS.CONFIG)
        return result ? FiscalConfig.parse(result) : FiscalConfig.parse({
          fiscal_year_start: `${new Date().getFullYear()}-01-01`,
          retained_earnings_account: '3200',
          lock_after_days: 7
        })
      } catch (error) {
        console.error('Failed to get fiscal config:', error)
        return FiscalConfig.parse({
          fiscal_year_start: `${new Date().getFullYear()}-01-01`,
          retained_earnings_account: '3200',
          lock_after_days: 7
        })
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  const saveConfig = useMutation({
    mutationFn: async (config: FiscalConfig): Promise<void> => {
      const parsedConfig = FiscalConfig.parse({
        ...config,
        updated_at: new Date().toISOString(),
        updated_by: 'current_user' // TODO: Get from auth context
      })

      await universalApi.setDynamicData(
        organizationId,
        FISCAL_DYNAMIC_DATA_KEYS.CONFIG,
        parsedConfig,
        FISCAL_SMART_CODES.CONFIG_UPDATE
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.config })
    }
  })

  // ==================== FISCAL PERIODS ====================

  const getPeriods = useQuery({
    queryKey: keys.periods,
    queryFn: async (): Promise<FiscalPeriod[]> => {
      try {
        const result = await universalApi.getDynamicData(organizationId, FISCAL_DYNAMIC_DATA_KEYS.PERIODS)
        return Array.isArray(result) ? result.map(p => FiscalPeriod.parse(p)) : []
      } catch (error) {
        console.error('Failed to get fiscal periods:', error)
        return []
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  })

  const savePeriods = useMutation({
    mutationFn: async (periods: FiscalPeriod[]): Promise<void> => {
      const parsedPeriods = periods.map(p => FiscalPeriod.parse(p))

      await universalApi.setDynamicData(
        organizationId,
        FISCAL_DYNAMIC_DATA_KEYS.PERIODS,
        parsedPeriods,
        FISCAL_SMART_CODES.PERIODS_UPDATE
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.periods })
    }
  })

  const generatePeriods = async (fiscalYearStart: string) => {
    const startDate = new Date(fiscalYearStart)
    const year = startDate.getFullYear()
    const periods: FiscalPeriod[] = []

    for (let month = 0; month < 12; month++) {
      const periodStart = new Date(year, month, 1)
      const periodEnd = new Date(year, month + 1, 0) // Last day of month

      periods.push({
        code: `${year}-${String(month + 1).padStart(2, '0')}`,
        from: periodStart.toISOString().split('T')[0],
        to: periodEnd.toISOString().split('T')[0],
        status: 'open'
      })
    }

    await savePeriods.mutateAsync(periods)
    return periods
  }

  // ==================== CLOSE CHECKLIST ====================

  const getChecklist = useQuery({
    queryKey: keys.checklist,
    queryFn: async (): Promise<CloseChecklist> => {
      try {
        const result = await universalApi.getDynamicData(organizationId, FISCAL_DYNAMIC_DATA_KEYS.CHECKLIST)
        if (Array.isArray(result) && result.length > 0) {
          return result.map(item => CloseChecklistItem.parse(item))
        }
        // Return default checklist if none exists
        return DEFAULT_CHECKLIST_ITEMS.map(item => ({
          ...item,
          completed: false
        }))
      } catch (error) {
        console.error('Failed to get close checklist:', error)
        return DEFAULT_CHECKLIST_ITEMS.map(item => ({
          ...item,
          completed: false
        }))
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  })

  const saveChecklist = useMutation({
    mutationFn: async (checklist: CloseChecklist): Promise<void> => {
      const parsedChecklist = checklist.map(item => CloseChecklistItem.parse(item))

      await universalApi.setDynamicData(
        organizationId,
        FISCAL_DYNAMIC_DATA_KEYS.CHECKLIST,
        parsedChecklist,
        FISCAL_SMART_CODES.CHECKLIST_UPDATE
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.checklist })
    }
  })

  const updateChecklistItem = async (key: string, completed: boolean) => {
    const currentChecklist = getChecklist.data || []
    const updatedChecklist = currentChecklist.map(item => {
      if (item.key === key) {
        return {
          ...item,
          completed,
          completed_at: completed ? new Date().toISOString() : undefined,
          completed_by: completed ? 'current_user' : undefined // TODO: Get from auth context
        }
      }
      return item
    })

    await saveChecklist.mutateAsync(updatedChecklist)
  }

  // ==================== FISCAL PROCEDURES ====================

  const lockPeriod = useMutation({
    mutationFn: async (periodCode: string): Promise<void> => {
      // Create a transaction to record the lock action
      await universalApi.createTransaction({
        organization_id: organizationId,
        transaction_type: 'fiscal_action',
        smart_code: FISCAL_SMART_CODES.PERIOD_LOCK,
        total_amount: 0,
        metadata: {
          action: 'lock_period',
          period_code: periodCode,
          performed_by: 'current_user', // TODO: Get from auth context
          performed_at: new Date().toISOString()
        }
      })

      // Update the period status locally
      const currentPeriods = getPeriods.data || []
      const updatedPeriods = currentPeriods.map(period => {
        if (period.code === periodCode && period.status === 'open') {
          return {
            ...period,
            status: 'locked' as const,
            locked_at: new Date().toISOString(),
            locked_by: 'current_user' // TODO: Get from auth context
          }
        }
        return period
      })

      await savePeriods.mutateAsync(updatedPeriods)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.periods })
    }
  })

  const closePeriod = useMutation({
    mutationFn: async (periodCode: string): Promise<void> => {
      // Create a transaction to record the close action
      await universalApi.createTransaction({
        organization_id: organizationId,
        transaction_type: 'fiscal_action',
        smart_code: FISCAL_SMART_CODES.PERIOD_CLOSE,
        total_amount: 0,
        metadata: {
          action: 'close_period',
          period_code: periodCode,
          performed_by: 'current_user', // TODO: Get from auth context
          performed_at: new Date().toISOString()
        }
      })

      // Update the period status locally
      const currentPeriods = getPeriods.data || []
      const updatedPeriods = currentPeriods.map(period => {
        if (period.code === periodCode && (period.status === 'open' || period.status === 'locked')) {
          return {
            ...period,
            status: 'closed' as const,
            closed_at: new Date().toISOString(),
            closed_by: 'current_user' // TODO: Get from auth context
          }
        }
        return period
      })

      await savePeriods.mutateAsync(updatedPeriods)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.periods })
    }
  })

  const closeYear = useMutation({
    mutationFn: async (request: YearCloseRequest): Promise<void> => {
      const parsedRequest = YearCloseRequest.parse(request)

      // Create a transaction to record the year close action
      await universalApi.createTransaction({
        organization_id: organizationId,
        transaction_type: 'fiscal_action',
        smart_code: FISCAL_SMART_CODES.YEAR_CLOSE,
        total_amount: 0,
        metadata: {
          action: 'close_year',
          fiscal_year: parsedRequest.fiscal_year,
          retained_earnings_account: parsedRequest.retained_earnings_account,
          notes: parsedRequest.notes,
          performed_by: 'current_user', // TODO: Get from auth context
          performed_at: new Date().toISOString()
        }
      })
    }
  })

  // ==================== HELPER FUNCTIONS ====================

  const getCurrentPeriod = () => {
    const periods = getPeriods.data || []
    const today = new Date().toISOString().split('T')[0]
    
    return periods.find(period => 
      period.from <= today && period.to >= today
    )
  }

  const isChecklistComplete = () => {
    const checklist = getChecklist.data || []
    return checklist.length > 0 && checklist.every(item => item.completed)
  }

  const areAllPeriodsClosed = (year?: string) => {
    const periods = getPeriods.data || []
    const filteredPeriods = year 
      ? periods.filter(p => p.code.startsWith(year))
      : periods

    return filteredPeriods.length > 0 && filteredPeriods.every(p => p.status === 'closed')
  }

  const canClosePeriod = (periodCode: string) => {
    const period = getPeriods.data?.find(p => p.code === periodCode)
    return period && (period.status === 'open' || period.status === 'locked') && isChecklistComplete()
  }

  const canLockPeriod = (periodCode: string) => {
    const period = getPeriods.data?.find(p => p.code === periodCode)
    return period && period.status === 'open'
  }

  const canCloseYear = (year: string) => {
    return areAllPeriodsClosed(year) && getConfig.data?.retained_earnings_account
  }

  return {
    // Config
    config: getConfig.data,
    isConfigLoading: getConfig.isLoading,
    configError: getConfig.error,
    saveConfig,

    // Periods
    periods: getPeriods.data || [],
    isPeriodsLoading: getPeriods.isLoading,
    periodsError: getPeriods.error,
    savePeriods,
    generatePeriods,

    // Checklist
    checklist: getChecklist.data || [],
    isChecklistLoading: getChecklist.isLoading,
    checklistError: getChecklist.error,
    saveChecklist,
    updateChecklistItem,

    // Procedures
    lockPeriod,
    closePeriod,
    closeYear,

    // Helpers
    getCurrentPeriod,
    isChecklistComplete,
    areAllPeriodsClosed,
    canClosePeriod,
    canLockPeriod,
    canCloseYear,

    // Refresh
    refetch: {
      config: () => queryClient.invalidateQueries({ queryKey: keys.config }),
      periods: () => queryClient.invalidateQueries({ queryKey: keys.periods }),
      checklist: () => queryClient.invalidateQueries({ queryKey: keys.checklist }),
      all: () => queryClient.invalidateQueries({ queryKey: ['fiscal', organizationId] })
    }
  }
}