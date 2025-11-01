/**
 * HERA Expenses Hook V1
 *
 * ✅ Enterprise-grade expense management using useUniversalEntityV1
 * ✅ Thin wrapper over useUniversalEntityV1 for expense tracking
 * ✅ Provides expense-specific helpers and category management
 */

import { useMemo } from 'react'
import { useUniversalEntityV1 } from './useUniversalEntityV1'
import { EXPENSE_PRESET } from './entityPresets'
import type { DynamicFieldDef, RelationshipDef } from './useUniversalEntityV1'

export interface ExpenseEntity {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  dynamic_fields?: {
    vendor?: { value: string }
    amount?: { value: number }
    expense_date?: { value: string }
    category?: { value: string }
    payment_method?: { value: string }
    status?: { value: string }
    description?: { value: string }
    receipt_url?: { value: string }
    reference_number?: { value: string }
  }
  relationships?: {
    category?: { to_entity: any }
    vendor?: { to_entity: any }
  }
  created_at: string
  updated_at: string
}

export interface UseHeraExpensesOptions {
  organizationId?: string
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    limit?: number
    offset?: number
    status?: string
    search?: string
    category?: string
    date_from?: string
    date_to?: string
  }
}

export function useHeraExpenses(options?: UseHeraExpensesOptions) {
  // 🔍 DEBUG: Log what we're fetching
  if (process.env.NODE_ENV === 'development') {
    console.log('[useHeraExpenses] 🔍 Fetching expenses:', {
      organizationId: options?.organizationId,
      entity_type: 'EXPENSE',
      filters: options?.filters
    })
  }

  const {
    entities: expenses,
    isLoading,
    error,
    refetch,
    create: baseCreate,
    update: baseUpdate,
    delete: baseDelete,
    archive: baseArchive,
    restore: baseRestore,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntityV1({
    entity_type: 'EXPENSE',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      limit: options?.filters?.limit || 100,
      ...options?.filters
    },
    dynamicFields: EXPENSE_PRESET.dynamicFields as DynamicFieldDef[],
    relationships: EXPENSE_PRESET.relationships as RelationshipDef[]
  })

  // 🔍 DEBUG: Log what we got
  if (process.env.NODE_ENV === 'development') {
    console.log('[useHeraExpenses] 📦 Expenses loaded:', {
      count: expenses?.length || 0,
      isLoading,
      hasError: !!error,
      organizationId: options?.organizationId
    })
  }

  // Map expenses to flatten dynamic fields
  const expensesFlattened = useMemo(() => {
    if (!expenses) return expenses as ExpenseEntity[]

    return (expenses as ExpenseEntity[]).map(expense => {
      // ✅ ENTERPRISE: Start with base expense fields
      const flattenedExpense: any = {
        ...expense
      }

      // ✅ CRITICAL: Flatten dynamic_fields if they exist in nested format
      if (expense.dynamic_fields && typeof expense.dynamic_fields === 'object') {
        Object.entries(expense.dynamic_fields).forEach(([key, field]) => {
          if (field && typeof field === 'object' && 'value' in field) {
            flattenedExpense[key] = field.value
          }
        })
      }

      return flattenedExpense
    })
  }, [expenses])

  // Filter expenses by category and date range
  const filteredExpenses = useMemo(() => {
    if (!expensesFlattened) return expensesFlattened

    let filtered = expensesFlattened

    // Filter by category
    if (options?.filters?.category) {
      filtered = filtered.filter(e => e.category === options.filters?.category)
    }

    // Filter by date range
    if (options?.filters?.date_from || options?.filters?.date_to) {
      filtered = filtered.filter(e => {
        const expenseDate = new Date(e.expense_date)
        if (options?.filters?.date_from && expenseDate < new Date(options.filters.date_from)) {
          return false
        }
        if (options?.filters?.date_to && expenseDate > new Date(options.filters.date_to)) {
          return false
        }
        return true
      })
    }

    // Filter by status
    if (options?.filters?.status) {
      filtered = filtered.filter(e => e.status === options.filters?.status)
    }

    return filtered
  }, [expensesFlattened, options?.filters?.category, options?.filters?.date_from, options?.filters?.date_to, options?.filters?.status])

  // Helper to create expense with proper smart codes
  const createExpense = async (data: {
    name: string
    vendor: string
    amount: number
    expense_date: string
    category: string
    payment_method?: string
    status?: string
    description?: string
    receipt_url?: string
    reference_number?: string
  }) => {
    // Map all provided fields to dynamic_fields
    const dynamic_fields: Record<string, any> = {}

    for (const def of EXPENSE_PRESET.dynamicFields) {
      let value = undefined

      if (def.name in data && (data as any)[def.name] !== undefined) {
        value = (data as any)[def.name]
      }

      if (value !== undefined) {
        dynamic_fields[def.name] = {
          value: value,
          type: def.type,
          smart_code: def.smart_code
        }
      }
    }

    return baseCreate({
      entity_type: 'EXPENSE',
      entity_name: data.name,
      smart_code: 'HERA.SALON.EXPENSE.ENTITY.EXPENSE.v1',
      dynamic_fields,
      relationships: {}
    } as any)
  }

  // Helper to update expense
  const updateExpense = async (
    id: string,
    data: Partial<Parameters<typeof createExpense>[0]>
  ) => {
    const expense = (expenses as ExpenseEntity[])?.find(e => e.id === id)
    if (!expense) throw new Error('Expense not found')

    // Build dynamic patch from provided fields
    const dynamic_patch: Record<string, any> = {}

    for (const def of EXPENSE_PRESET.dynamicFields) {
      let value = undefined

      if (def.name in data && (data as any)[def.name] !== undefined) {
        value = (data as any)[def.name]
      }

      if (value !== undefined) {
        dynamic_patch[def.name] = value
      }
    }

    const payload: any = {
      entity_id: id,
      entity_name: data.name || expense.entity_name,
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {})
    }

    return baseUpdate(payload)
  }

  // Helper to archive expense (soft delete)
  const archiveExpense = async (id: string) => {
    const expense = (expenses as ExpenseEntity[])?.find(e => e.id === id)
    if (!expense) throw new Error('Expense not found')

    return baseArchive(id)
  }

  // Helper to restore expense
  const restoreExpense = async (id: string) => {
    return baseRestore(id)
  }

  // Helper to delete expense with fallback to archive
  const deleteExpense = async (
    id: string,
    reason?: string
  ): Promise<{
    success: boolean
    archived: boolean
    message?: string
  }> => {
    const expense = (expenses as ExpenseEntity[])?.find(e => e.id === id)
    if (!expense) throw new Error('Expense not found')

    try {
      await baseDelete({
        entity_id: id,
        hard_delete: true,
        cascade: true,
        reason: reason || 'Permanently delete expense',
        smart_code: 'HERA.SALON.EXPENSE.DELETE.v1'
      })

      return {
        success: true,
        archived: false
      }
    } catch (error: any) {
      const is409Conflict =
        error.message?.includes('409') ||
        error.message?.includes('Conflict') ||
        error.message?.includes('referenced') ||
        error.message?.includes('foreign key')

      if (is409Conflict) {
        await baseUpdate({
          entity_id: id,
          entity_name: expense.entity_name,
          status: 'deleted'
        })

        return {
          success: true,
          archived: true,
          message:
            'Expense is referenced in financial records and cannot be deleted. It has been marked as deleted instead.'
        }
      }

      throw error
    }
  }

  // Helper to calculate expense totals by category
  const calculateExpenseTotals = () => {
    if (!filteredExpenses) return { total: 0, byCategory: {} }

    const total = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const byCategory: Record<string, number> = {}

    filteredExpenses.forEach(e => {
      const category = e.category || 'Uncategorized'
      byCategory[category] = (byCategory[category] || 0) + (e.amount || 0)
    })

    return { total, byCategory }
  }

  return {
    expenses: filteredExpenses,
    isLoading,
    error,
    refetch,
    createExpense,
    updateExpense,
    archiveExpense,
    restoreExpense,
    deleteExpense,
    calculateExpenseTotals,
    isCreating,
    isUpdating,
    isDeleting
  }
}
