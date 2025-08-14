'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface UseWebSocketFallbackOptions {
  wsUrl: string
  httpUrl: string
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event | Error) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
  fallbackPollingInterval?: number
}

interface UseWebSocketFallbackReturn {
  socket: WebSocket | null
  connectionState: 'Connecting' | 'Open' | 'Closing' | 'Closed' | 'Fallback'
  sendMessage: (message: WebSocketMessage) => void
  connect: () => void
  disconnect: () => void
  isConnected: boolean
  isFallback: boolean
}

export function useWebSocketFallback({
  wsUrl,
  httpUrl,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 3,
  fallbackPollingInterval = 10000
}: UseWebSocketFallbackOptions): UseWebSocketFallbackReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [connectionState, setConnectionState] = useState<'Connecting' | 'Open' | 'Closing' | 'Closed' | 'Fallback'>('Closed')
  const [isFallback, setIsFallback] = useState(false)
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const fallbackIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const reconnectAttemptsRef = useRef(0)
  const shouldReconnectRef = useRef(true)

  const startFallbackPolling = useCallback(() => {
    console.log('Starting HTTP fallback polling')
    setConnectionState('Fallback')
    setIsFallback(true)
    onConnect?.()

    const poll = async () => {
      try {
        const response = await fetch(`${httpUrl}?action=status`)
        const result = await response.json()
        
        if (result.success) {
          // Simulate periodic updates for demo
          if (Math.random() < 0.1) { // 10% chance of update
            const mockUpdate: WebSocketMessage = {
              type: 'table_status_update',
              data: {
                table_id: `table_${Math.floor(Math.random() * 10) + 1}`,
                old_status: 'available',
                new_status: ['occupied', 'available', 'reserved'][Math.floor(Math.random() * 3)],
                timestamp: new Date().toISOString()
              },
              timestamp: new Date().toISOString()
            }
            onMessage?.(mockUpdate)
          }
        }
      } catch (error) {
        console.error('Fallback polling error:', error)
        onError?.(error as Error)
      }
    }

    // Start polling
    poll()
    fallbackIntervalRef.current = setInterval(poll, fallbackPollingInterval)
  }, [httpUrl, onConnect, onMessage, onError, fallbackPollingInterval])

  const stopFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current)
      fallbackIntervalRef.current = undefined
    }
    setIsFallback(false)
  }, [])

  const connect = useCallback(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      return
    }

    // Stop fallback polling if active
    stopFallbackPolling()

    try {
      setConnectionState('Connecting')
      const newSocket = new WebSocket(wsUrl)

      const connectionTimeout = setTimeout(() => {
        if (newSocket.readyState === WebSocket.CONNECTING) {
          console.log('WebSocket connection timeout, falling back to HTTP polling')
          newSocket.close()
          startFallbackPolling()
        }
      }, 5000) // 5 second timeout

      newSocket.onopen = () => {
        clearTimeout(connectionTimeout)
        setConnectionState('Open')
        setIsFallback(false)
        reconnectAttemptsRef.current = 0
        onConnect?.()
      }

      newSocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      newSocket.onclose = (event) => {
        clearTimeout(connectionTimeout)
        setConnectionState('Closed')
        setSocket(null)
        onDisconnect?.()

        // Try fallback or reconnect
        if (shouldReconnectRef.current) {
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current += 1
            console.log(`WebSocket reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`)
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect()
            }, reconnectInterval)
          } else {
            console.log('Max WebSocket reconnection attempts reached, falling back to HTTP polling')
            startFallbackPolling()
          }
        }
      }

      newSocket.onerror = (error) => {
        clearTimeout(connectionTimeout)
        console.error('WebSocket error:', error)
        onError?.(error)
        
        // Immediately try fallback on error
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          startFallbackPolling()
        }
      }

      setSocket(newSocket)
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      startFallbackPolling()
    }
  }, [wsUrl, onConnect, onMessage, onDisconnect, onError, reconnectInterval, maxReconnectAttempts, startFallbackPolling, stopFallbackPolling])

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    stopFallbackPolling()

    if (socket && socket.readyState === WebSocket.OPEN) {
      setConnectionState('Closing')
      socket.close(1000, 'Manual disconnect')
    } else {
      setConnectionState('Closed')
      onDisconnect?.()
    }
  }, [socket, stopFallbackPolling, onDisconnect])

  const sendMessage = useCallback(async (message: WebSocketMessage) => {
    if (isFallback) {
      // Send via HTTP API when in fallback mode
      try {
        const response = await fetch(httpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        })
        
        const result = await response.json()
        if (!result.success) {
          console.error('HTTP fallback message failed:', result.message)
        }
      } catch (error) {
        console.error('HTTP fallback error:', error)
      }
    } else if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    } else {
      console.warn('Cannot send message: not connected via WebSocket or fallback')
    }
  }, [socket, isFallback, httpUrl])

  useEffect(() => {
    connect()

    return () => {
      shouldReconnectRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      stopFallbackPolling()
      socket?.close()
    }
  }, [connect, stopFallbackPolling])

  return {
    socket,
    connectionState,
    sendMessage,
    connect,
    disconnect,
    isConnected: connectionState === 'Open' || connectionState === 'Fallback',
    isFallback
  }
}