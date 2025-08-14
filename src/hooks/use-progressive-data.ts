import { useState, useEffect, useCallback } from 'react'
import { useProgressiveAuth } from '@/components/auth/ProgressiveAuthProvider'

export interface ProgressiveDataOptions {
  key: string
  initialData?: any
  autoSave?: boolean
  debounceMs?: number
}

/**
 * Hook for managing progressive app data with localStorage persistence
 * Data is saved per workspace and persists for 30 days (anonymous) or 365 days (identified)
 */
export function useProgressiveData<T = any>(options: ProgressiveDataOptions) {
  const { workspace } = useProgressiveAuth()
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const {
    key,
    initialData = null,
    autoSave = true,
    debounceMs = 1000
  } = options

  // Load data from localStorage
  useEffect(() => {
    if (!workspace) {
      setIsLoading(false)
      return
    }

    const loadData = () => {
      try {
        const storageKey = `hera_data_${workspace.organization_id}`
        const storedData = localStorage.getItem(storageKey)
        
        if (storedData) {
          const parsedData = JSON.parse(storedData)
          const dataForKey = parsedData[key] || initialData
          setData(dataForKey)
        } else {
          // Initialize with default data
          setData(initialData)
          if (initialData && autoSave) {
            const newData = { [key]: initialData }
            localStorage.setItem(storageKey, JSON.stringify(newData))
            setLastSaved(new Date())
          }
        }
      } catch (error) {
        console.error('Failed to load progressive data:', error)
        setData(initialData)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [workspace, key, initialData, autoSave])

  // Save data to localStorage
  const saveData = useCallback((newData: T) => {
    if (!workspace) return

    try {
      const storageKey = `hera_data_${workspace.organization_id}`
      const existingData = localStorage.getItem(storageKey)
      const allData = existingData ? JSON.parse(existingData) : {}
      
      // Update the specific key
      allData[key] = newData
      
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(allData))
      setData(newData)
      setLastSaved(new Date())
      
      // Also save a backup with timestamp
      const backupKey = `${storageKey}_backup_${Date.now()}`
      localStorage.setItem(backupKey, JSON.stringify({
        timestamp: new Date().toISOString(),
        workspace: workspace,
        data: allData
      }))
      
      // Clean up old backups (keep only last 5)
      const backups = Object.keys(localStorage)
        .filter(k => k.startsWith(`${storageKey}_backup_`))
        .sort()
      
      if (backups.length > 5) {
        backups.slice(0, -5).forEach(k => localStorage.removeItem(k))
      }
    } catch (error) {
      console.error('Failed to save progressive data:', error)
    }
  }, [workspace, key])

  // Update data with debouncing
  const updateData = useCallback((updater: (current: T | null) => T) => {
    const newData = updater(data)
    setData(newData)
    
    if (autoSave && workspace) {
      // Debounced save
      const timeoutId = setTimeout(() => {
        saveData(newData)
      }, debounceMs)
      
      return () => clearTimeout(timeoutId)
    }
  }, [data, autoSave, workspace, saveData, debounceMs])

  // Clear data for this key
  const clearData = useCallback(() => {
    if (!workspace) return

    try {
      const storageKey = `hera_data_${workspace.organization_id}`
      const existingData = localStorage.getItem(storageKey)
      
      if (existingData) {
        const allData = JSON.parse(existingData)
        delete allData[key]
        localStorage.setItem(storageKey, JSON.stringify(allData))
      }
      
      setData(null)
    } catch (error) {
      console.error('Failed to clear progressive data:', error)
    }
  }, [workspace, key])

  // Get all data for the workspace
  const getAllData = useCallback(() => {
    if (!workspace) return null

    try {
      const storageKey = `hera_data_${workspace.organization_id}`
      const storedData = localStorage.getItem(storageKey)
      return storedData ? JSON.parse(storedData) : {}
    } catch (error) {
      console.error('Failed to get all progressive data:', error)
      return {}
    }
  }, [workspace])

  // Export data as JSON
  const exportData = useCallback(() => {
    if (!workspace) return

    const allData = getAllData()
    const exportData = {
      workspace: {
        id: workspace.id,
        type: workspace.type,
        created_at: workspace.created_at,
        organization_id: workspace.organization_id,
        organization_name: workspace.organization_name
      },
      data: allData,
      exported_at: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hera-workspace-${workspace.id}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [workspace, getAllData])

  return {
    data,
    isLoading,
    saveData,
    updateData,
    clearData,
    getAllData,
    exportData,
    lastSaved,
    workspace
  }
}

// Specific hooks for different data types
export function useProgressiveFinancialData() {
  return useProgressiveData({
    key: 'financial',
    initialData: {
      transactions: [
        {
          id: 'txn-001',
          type: 'Journal Entry',
          description: 'Monthly depreciation entries',
          amount: 2450,
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          smartCode: 'HERA.FIN.GL.TXN.JE.v1',
          status: 'completed'
        },
        {
          id: 'txn-002',
          type: 'Invoice',
          description: 'Invoice #INV-2024-1234 sent to TechCorp',
          amount: 5000,
          date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          smartCode: 'HERA.FIN.AR.TXN.INV.v1',
          status: 'sent'
        }
      ],
      accounts: [
        { id: 'acc-001', name: 'Cash', type: 'Asset', balance: 87293 },
        { id: 'acc-002', name: 'Accounts Receivable', type: 'Asset', balance: 32567 },
        { id: 'acc-003', name: 'Revenue', type: 'Income', balance: 147592 }
      ],
      invoices: [
        { id: 'inv-001', customer: 'TechCorp', amount: 5000, status: 'sent', date: new Date().toISOString() }
      ],
      bills: [
        { id: 'bill-001', vendor: 'Office Supplies Inc.', amount: 1250, status: 'paid', date: new Date().toISOString() }
      ],
      budgets: [
        { id: 'budget-001', category: 'Marketing', budgeted: 10000, actual: 8500, variance: 1500 }
      ],
      kpis: {
        revenue: 147592,
        profit: 27029,
        cashPosition: 87293,
        currentRatio: 2.4
      },
      moduleAccessCount: {},
      lastAccessedModule: null,
      lastAccessedAt: null,
      userInteractions: 0
    }
  })
}

export function useProgressiveCRMData() {
  return useProgressiveData({
    key: 'crm',
    initialData: {
      contacts: [],
      opportunities: [],
      activities: [],
      tasks: []
    }
  })
}

export function useProgressiveInventoryData() {
  return useProgressiveData({
    key: 'inventory',
    initialData: {
      products: [],
      categories: [],
      suppliers: [],
      stockMovements: []
    }
  })
}