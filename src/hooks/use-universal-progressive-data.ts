import { useState, useEffect, useCallback } from 'react'
import { useProgressiveAuth } from '@/components/auth/ProgressiveAuthProvider'

export interface UniversalProgressiveDataOptions<T = any> {
  key: string
  initialData?: T
  autoSave?: boolean
  debounceMs?: number
  smartCode?: string
  transform?: {
    serialize?: (data: T) => any
    deserialize?: (data: any) => T
  }
  metadata?: {
    version?: string
    module?: string
    description?: string
  }
}

export interface UniversalDataStats {
  totalSize: number
  lastModified: Date | null
  recordCount: number
  backupCount: number
  interactions: number
}

/**
 * Enhanced progressive data hook with universal module support
 * Provides comprehensive data management with smart code integration
 */
export function useUniversalProgressiveData<T = any>(options: UniversalProgressiveDataOptions<T>) {
  const { workspace } = useProgressiveAuth()
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [stats, setStats] = useState<UniversalDataStats>({
    totalSize: 0,
    lastModified: null,
    recordCount: 0,
    backupCount: 0,
    interactions: 0
  })
  
  const {
    key,
    initialData = null,
    autoSave = true,
    debounceMs = 1000,
    smartCode,
    transform,
    metadata
  } = options

  // Enhanced data loading with stats calculation
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
          
          // Apply transform if provided
          const finalData = transform?.deserialize ? transform.deserialize(dataForKey) : dataForKey
          setData(finalData)
          
          // Calculate stats
          calculateStats(parsedData, finalData)
        } else {
          // Initialize with default data
          setData(initialData)
          if (initialData && autoSave) {
            const newData = { [key]: transform?.serialize ? transform.serialize(initialData) : initialData }
            localStorage.setItem(storageKey, JSON.stringify(newData))
            setLastSaved(new Date())
            
            // Add metadata
            if (metadata || smartCode) {
              const metadataKey = `${storageKey}_metadata`
              const existingMeta = JSON.parse(localStorage.getItem(metadataKey) || '{}')
              existingMeta[key] = {
                ...metadata,
                smartCode,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
              }
              localStorage.setItem(metadataKey, JSON.stringify(existingMeta))
            }
          }
        }
      } catch (error) {
        console.error('Failed to load universal progressive data:', error)
        setData(initialData)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [workspace, key, initialData, autoSave, transform, smartCode, metadata])

  // Calculate comprehensive stats
  const calculateStats = useCallback((allData: any, currentData: T) => {
    const dataString = JSON.stringify(allData)
    const backupKeys = Object.keys(localStorage).filter(k => 
      k.includes(`hera_data_${workspace?.organization_id}_backup_`)
    )
    
    // Calculate record count (assumes arrays or objects with countable items)
    let recordCount = 0
    if (Array.isArray(currentData)) {
      recordCount = currentData.length
    } else if (currentData && typeof currentData === 'object') {
      recordCount = Object.keys(currentData).length
    } else if (currentData) {
      recordCount = 1
    }
    
    // Get interactions from metadata
    const metadataKey = `hera_data_${workspace?.organization_id}_metadata`
    const metadata = JSON.parse(localStorage.getItem(metadataKey) || '{}')
    const keyMetadata = metadata[key] || {}
    
    setStats({
      totalSize: dataString.length,
      lastModified: lastSaved,
      recordCount,
      backupCount: backupKeys.length,
      interactions: keyMetadata.interactions || 0
    })
  }, [workspace, key, lastSaved])

  // Enhanced save with metadata and smart code tracking
  const saveData = useCallback((newData: T) => {
    if (!workspace) return

    try {
      const storageKey = `hera_data_${workspace.organization_id}`
      const existingData = localStorage.getItem(storageKey)
      const allData = existingData ? JSON.parse(existingData) : {}
      
      // Apply transform if provided
      const serializedData = transform?.serialize ? transform.serialize(newData) : newData
      
      // Update the specific key
      allData[key] = serializedData
      
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(allData))
      setData(newData)
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      
      // Update metadata with smart code and interaction tracking
      const metadataKey = `${storageKey}_metadata`
      const existingMeta = JSON.parse(localStorage.getItem(metadataKey) || '{}')
      const currentMeta = existingMeta[key] || {}
      
      existingMeta[key] = {
        ...currentMeta,
        ...metadata,
        smartCode,
        lastModified: new Date().toISOString(),
        interactions: (currentMeta.interactions || 0) + 1,
        version: metadata?.version || '1.0.0',
        dataSize: JSON.stringify(serializedData).length
      }
      
      localStorage.setItem(metadataKey, JSON.stringify(existingMeta))
      
      // Create versioned backup
      const backupKey = `${storageKey}_backup_${Date.now()}`
      localStorage.setItem(backupKey, JSON.stringify({
        timestamp: new Date().toISOString(),
        workspace: workspace,
        data: allData,
        metadata: existingMeta,
        smartCode,
        key
      }))
      
      // Clean up old backups (keep only last 10 per key)
      const backups = Object.keys(localStorage)
        .filter(k => k.startsWith(`${storageKey}_backup_`))
        .map(k => ({
          key: k,
          timestamp: parseInt(k.split('_').pop() || '0')
        }))
        .sort((a, b) => b.timestamp - a.timestamp)
      
      if (backups.length > 10) {
        backups.slice(10).forEach(backup => localStorage.removeItem(backup.key))
      }
      
      // Update stats
      calculateStats(allData, newData)
    } catch (error) {
      console.error('Failed to save universal progressive data:', error)
    }
  }, [workspace, key, transform, smartCode, metadata, calculateStats])

  // Enhanced update with unsaved changes tracking
  const updateData = useCallback((updater: (current: T | null) => T) => {
    const newData = updater(data)
    setData(newData)
    setHasUnsavedChanges(true)
    
    if (autoSave && workspace) {
      // Debounced save
      const timeoutId = setTimeout(() => {
        saveData(newData)
      }, debounceMs)
      
      return () => clearTimeout(timeoutId)
    }
  }, [data, autoSave, workspace, saveData, debounceMs])

  // Batch operations for performance
  const batchUpdate = useCallback((updates: Array<(current: T | null) => T>) => {
    let currentData = data
    updates.forEach(updater => {
      currentData = updater(currentData)
    })
    setData(currentData)
    setHasUnsavedChanges(true)
    
    if (autoSave && workspace) {
      saveData(currentData)
    }
  }, [data, autoSave, workspace, saveData])

  // Clear data with confirmation
  const clearData = useCallback(() => {
    if (!workspace) return

    try {
      const storageKey = `hera_data_${workspace.organization_id}`
      const existingData = localStorage.getItem(storageKey)
      
      if (existingData) {
        const allData = JSON.parse(existingData)
        delete allData[key]
        localStorage.setItem(storageKey, JSON.stringify(allData))
        
        // Clear metadata
        const metadataKey = `${storageKey}_metadata`
        const metadata = JSON.parse(localStorage.getItem(metadataKey) || '{}')
        delete metadata[key]
        localStorage.setItem(metadataKey, JSON.stringify(metadata))
      }
      
      setData(null)
      setHasUnsavedChanges(false)
      setLastSaved(null)
    } catch (error) {
      console.error('Failed to clear universal progressive data:', error)
    }
  }, [workspace, key])

  // Export with enhanced metadata and smart code information
  const exportModuleData = useCallback(() => {
    if (!workspace) return

    try {
      const storageKey = `hera_data_${workspace.organization_id}`
      const metadataKey = `${storageKey}_metadata`
      
      const allData = JSON.parse(localStorage.getItem(storageKey) || '{}')
      const metadata = JSON.parse(localStorage.getItem(metadataKey) || '{}')
      
      const exportData = {
        workspace: {
          id: workspace.id,
          type: workspace.type,
          created_at: workspace.created_at,
          organization_id: workspace.organization_id,
          organization_name: workspace.organization_name
        },
        module: {
          key,
          smartCode,
          metadata: metadata[key],
          data: allData[key]
        },
        export_info: {
          exported_at: new Date().toISOString(),
          export_type: 'universal_progressive_module',
          version: '2.0.0',
          stats
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hera-${key}-${workspace.id}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export module data:', error)
    }
  }, [workspace, key, smartCode, stats])

  // Import data with validation
  const importModuleData = useCallback((importedData: any) => {
    try {
      if (importedData.module && importedData.module.key === key) {
        const data = transform?.deserialize ? 
          transform.deserialize(importedData.module.data) : 
          importedData.module.data
        
        saveData(data)
        return { success: true }
      } else {
        return { success: false, error: 'Invalid module data format' }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Import failed' }
    }
  }, [key, transform, saveData])

  return {
    // Data
    data,
    isLoading,
    lastSaved,
    hasUnsavedChanges,
    stats,
    
    // Operations
    saveData,
    updateData,
    batchUpdate,
    clearData,
    
    // Advanced features
    exportModuleData,
    importModuleData,
    
    // Metadata
    smartCode,
    workspace,
    
    // Utilities
    forceSync: () => data && saveData(data),
    getMetadata: () => {
      if (!workspace) return null
      const metadataKey = `hera_data_${workspace.organization_id}_metadata`
      const metadata = JSON.parse(localStorage.getItem(metadataKey) || '{}')
      return metadata[key] || null
    }
  }
}

// Predefined hooks for common data types
export function useUniversalFinancialData() {
  return useUniversalProgressiveData({
    key: 'financial',
    smartCode: 'HERA.FIN.UNIV.DATA.v1',
    metadata: {
      version: '2.0.0',
      module: 'financial',
      description: 'Universal financial management data'
    },
    initialData: {
      transactions: [],
      accounts: [
        { id: 'acc-001', name: 'Cash', type: 'Asset', balance: 87293 },
        { id: 'acc-002', name: 'Accounts Receivable', type: 'Asset', balance: 32567 },
        { id: 'acc-003', name: 'Revenue', type: 'Income', balance: 147592 }
      ],
      invoices: [],
      bills: [],
      budgets: [],
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

export function useUniversalCRMData() {
  return useUniversalProgressiveData({
    key: 'crm',
    smartCode: 'HERA.CRM.UNIV.DATA.v1',
    metadata: {
      version: '2.0.0',
      module: 'crm',
      description: 'Universal customer relationship management data'
    },
    initialData: {
      contacts: [],
      opportunities: [],
      activities: [],
      tasks: [],
      pipeline: {
        totalValue: 0,
        averageDealSize: 0,
        conversionRate: 0,
        activeDealCount: 0
      }
    }
  })
}

export function useUniversalInventoryData() {
  return useUniversalProgressiveData({
    key: 'inventory',
    smartCode: 'HERA.INV.UNIV.DATA.v1',
    metadata: {
      version: '2.0.0',
      module: 'inventory',
      description: 'Universal inventory management data'
    },
    initialData: {
      products: [],
      categories: [],
      suppliers: [],
      stockMovements: [],
      analytics: {
        totalProducts: 0,
        totalValue: 0,
        lowStockItems: 0,
        turnoverRate: 0
      }
    }
  })
}