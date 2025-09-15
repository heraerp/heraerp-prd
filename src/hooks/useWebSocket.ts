'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface UseWebSocketOptions {
  url: string
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
  protocols?: string[]
}

interface UseWebSocketReturn {
  socket: WebSocket | null
  connectionState: 'Connecting' | 'Open' | 'Closing' | 'Closed'
  sendMessage: (message: WebSocketMessage) => void
  connect: () => void
  disconnect: () => void
  reconnect: () => void
  isConnected: boolean
}

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
  protocols
}: UseWebSocketOptions): UseWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [connectionState, setConnectionState] = useState<
    'Connecting' | 'Open' | 'Closing' | 'Closed'
  >('Closed')
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const reconnectAttemptsRef = useRef(0)
  const shouldReconnectRef = useRef(true)

  const connect = useCallback(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      setConnectionState('Connecting')
      const newSocket = new WebSocket(url, protocols)

      newSocket.onopen = () => {
        setConnectionState('Open')
        reconnectAttemptsRef.current = 0
        onConnect?.()
      }

      newSocket.onmessage = event => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      newSocket.onclose = event => {
        setConnectionState('Closed')
        setSocket(null)
        onDisconnect?.()

        // Attempt to reconnect if not manually closed
        if (shouldReconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1
          console.log(
            `WebSocket reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      newSocket.onerror = error => {
        setConnectionState('Closed')
        onError?.(error)
      }

      setSocket(newSocket)
    } catch (error) {
      setConnectionState('Closed')
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [
    url,
    protocols,
    onConnect,
    onMessage,
    onDisconnect,
    onError,
    reconnectInterval,
    maxReconnectAttempts
  ])

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      setConnectionState('Closing')
      socket.close(1000, 'Manual disconnect')
    }
  }, [socket])

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true
    reconnectAttemptsRef.current = 0
    disconnect()
    setTimeout(connect, 100)
  }, [connect, disconnect])

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message))
      } else {
        console.warn('WebSocket is not connected. Message not sent:', message)
      }
    },
    [socket]
  )

  useEffect(() => {
    connect()

    return () => {
      shouldReconnectRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      socket?.close()
    }
  }, [connect])

  return {
    socket,
    connectionState,
    sendMessage,
    connect,
    disconnect,
    reconnect,
    isConnected: connectionState === 'Open'
  }
}
