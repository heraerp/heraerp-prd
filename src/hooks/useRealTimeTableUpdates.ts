'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWebSocketFallback, WebSocketMessage } from './useWebSocketFallback'
import { toast } from 'sonner'

interface Table {
  id: string
  table_number: string
  capacity: number
  location: string
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance'
  current_party_size?: number
  seated_at?: string
  server_name?: string
  current_order_id?: string
  next_reservation_time?: string
}

interface TableStatusUpdate {
  table_id: string
  old_status: string
  new_status: string
  party_size?: number
  server_id?: string
  order_id?: string
  timestamp: string
  updated_by?: string
}

interface UseRealTimeTableUpdatesOptions {
  onTableUpdate?: (update: TableStatusUpdate) => void
  onConnectionChange?: (connected: boolean) => void
  enableNotifications?: boolean
  enableSoundAlerts?: boolean
}

interface UseRealTimeTableUpdatesReturn {
  isConnected: boolean
  connectionState: string
  lastUpdate: TableStatusUpdate | null
  connect: () => void
  disconnect: () => void
  sendTableUpdate: (update: Partial<TableStatusUpdate>) => void
  subscribeToTable: (tableId: string) => void
  unsubscribeFromTable: (tableId: string) => void
  updateTableStatus: (tableId: string, status: string, additionalData?: any) => void
  isFallback: boolean
}

export function useRealTimeTableUpdates({
  onTableUpdate,
  onConnectionChange,
  enableNotifications = true,
  enableSoundAlerts = false
}: UseRealTimeTableUpdatesOptions = {}): UseRealTimeTableUpdatesReturn {
  const [lastUpdate, setLastUpdate] = useState<TableStatusUpdate | null>(null)
  const [subscribedTables, setSubscribedTables] = useState<Set<string>>(new Set())

  // WebSocket URL - in production this would be from environment variables
  const wsUrl = process.env.NODE_ENV === 'development' 
    ? 'ws://localhost:3001/ws/table-updates'
    : 'wss://your-domain.com/ws/table-updates'
  
  const httpUrl = '/api/v1/restaurant/table-updates'

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'table_status_update':
        const update = message.data as TableStatusUpdate
        setLastUpdate(update)
        onTableUpdate?.(update)
        
        if (enableNotifications) {
          showUpdateNotification(update)
        }
        
        if (enableSoundAlerts) {
          playNotificationSound(update.new_status)
        }
        break
        
      case 'table_assignment_update':
        const assignment = message.data
        if (enableNotifications) {
          toast.info(`Table ${assignment.table_number} assigned to ${assignment.server_name}`)
        }
        break
        
      case 'reservation_update':
        const reservation = message.data
        if (enableNotifications) {
          toast.info(`Reservation update for Table ${reservation.table_number}`)
        }
        break
        
      case 'error':
        console.error('WebSocket error:', message.data)
        toast.error('Real-time connection error')
        break
        
      default:
        console.log('Unknown message type:', message.type)
    }
  }, [onTableUpdate, enableNotifications, enableSoundAlerts])

  const handleConnect = useCallback(() => {
    console.log('Real-time table updates connected')
    onConnectionChange?.(true)
    
    // Re-subscribe to previously subscribed tables
    subscribedTables.forEach(tableId => {
      sendMessage({
        type: 'subscribe_table',
        data: { table_id: tableId },
        timestamp: new Date().toISOString()
      })
    })
  }, [subscribedTables, onConnectionChange])

  const handleDisconnect = useCallback(() => {
    console.log('Real-time table updates disconnected')
    onConnectionChange?.(false)
  }, [onConnectionChange])

  const handleError = useCallback((error: Event | Error) => {
    console.error('WebSocket connection error:', error)
    toast.error('Connection to real-time updates failed')
  }, [])

  const { 
    socket, 
    connectionState, 
    sendMessage, 
    connect, 
    disconnect, 
    isConnected,
    isFallback
  } = useWebSocketFallback({
    wsUrl,
    httpUrl,
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
    reconnectInterval: 3000,
    maxReconnectAttempts: 3,
    fallbackPollingInterval: 10000
  })

  const subscribeToTable = useCallback((tableId: string) => {
    setSubscribedTables(prev => new Set([...prev, tableId]))
    
    if (isConnected) {
      sendMessage({
        type: 'subscribe_table',
        data: { table_id: tableId },
        timestamp: new Date().toISOString()
      })
    }
  }, [isConnected, sendMessage])

  const unsubscribeFromTable = useCallback((tableId: string) => {
    setSubscribedTables(prev => {
      const newSet = new Set(prev)
      newSet.delete(tableId)
      return newSet
    })
    
    if (isConnected) {
      sendMessage({
        type: 'unsubscribe_table',
        data: { table_id: tableId },
        timestamp: new Date().toISOString()
      })
    }
  }, [isConnected, sendMessage])

  const updateTableStatus = useCallback((
    tableId: string, 
    status: string, 
    additionalData: any = {}
  ) => {
    if (isConnected) {
      sendMessage({
        type: 'update_table_status',
        data: {
          table_id: tableId,
          new_status: status,
          timestamp: new Date().toISOString(),
          ...additionalData
        },
        timestamp: new Date().toISOString()
      })
    }
  }, [isConnected, sendMessage])

  const sendTableUpdate = useCallback((update: Partial<TableStatusUpdate>) => {
    if (isConnected) {
      sendMessage({
        type: 'table_update',
        data: {
          timestamp: new Date().toISOString(),
          ...update
        },
        timestamp: new Date().toISOString()
      })
    }
  }, [isConnected, sendMessage])

  // Show notification for table updates
  const showUpdateNotification = (update: TableStatusUpdate) => {
    const statusMessages = {
      available: 'is now available',
      occupied: 'has been seated',
      reserved: 'has been reserved',
      cleaning: 'is being cleaned',
      maintenance: 'needs maintenance'
    }

    const message = statusMessages[update.new_status as keyof typeof statusMessages] || 'status updated'
    
    toast.info(`Table ${getTableNumber(update.table_id)} ${message}`, {
      duration: 4000,
      action: {
        label: 'View',
        onClick: () => {
          // Navigate to table or show details
          console.log('Navigate to table:', update.table_id)
        }
      }
    })
  }

  // Play notification sound based on status
  const playNotificationSound = (status: string) => {
    // Create audio context for sound alerts
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Different frequencies for different statuses
      const frequencies = {
        occupied: 800,
        available: 400,
        reserved: 600,
        cleaning: 300,
        maintenance: 200
      }
      
      oscillator.frequency.value = frequencies[status as keyof typeof frequencies] || 500
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.log('Audio notifications not supported:', error)
    }
  }

  // Helper function to get table number from ID
  const getTableNumber = (tableId: string): string => {
    // In a real implementation, this would look up the table number
    // For now, return a placeholder
    return `#${tableId.slice(-4)}`
  }

  // Subscribe to all tables on mount (for general updates)
  useEffect(() => {
    if (isConnected) {
      sendMessage({
        type: 'subscribe_all',
        data: {},
        timestamp: new Date().toISOString()
      })
    }
  }, [isConnected, sendMessage])

  return {
    isConnected,
    connectionState,
    lastUpdate,
    connect,
    disconnect,
    sendTableUpdate,
    subscribeToTable,
    unsubscribeFromTable,
    updateTableStatus,
    isFallback
  }
}

// Helper hook for managing connection status display
export function useConnectionStatus() {
  const [showStatus, setShowStatus] = useState(false)
  const [lastConnectionChange, setLastConnectionChange] = useState<Date | null>(null)

  const handleConnectionChange = useCallback((connected: boolean) => {
    setLastConnectionChange(new Date())
    setShowStatus(true)
    
    // Hide status after 3 seconds
    setTimeout(() => setShowStatus(false), 3000)
    
    if (connected) {
      toast.success('Connected to real-time updates')
    } else {
      toast.error('Disconnected from real-time updates')
    }
  }, [])

  return {
    showStatus,
    lastConnectionChange,
    handleConnectionChange
  }
}