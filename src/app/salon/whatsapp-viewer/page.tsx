'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, User, Clock } from 'lucide-react'

interface DebugData {
  totalMessages: number
  totalConversations: number
  conversationsWithMessages: Array<{
    conversation: {
      id: string
      entity_code: string
      entity_name: string
      metadata: {
        phone: string
        sender_type: string
      }
    }
    messages: Array<{
      id: string
      text: string
      direction: string
      created_at: string
    }>
  }>
}

export default function WhatsAppViewer() {
  const [data, setData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchData()
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])
  
  const fetchData = async () => {
    try {
      const response = await fetch('/api/v1/whatsapp/debug-dashboard')
      const result = await response.json()
      if (result.status === 'success') {
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 animate-pulse mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading WhatsApp messages...</p>
        </div>
      </div>
    )
  }
  
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WhatsApp Message Viewer
          </h1>
          <p className="text-gray-600">
            Real-time view of WhatsApp conversations (No login required)
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Messages</p>
                  <p className="text-3xl font-bold text-green-600">{data.totalMessages}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversations</p>
                  <p className="text-3xl font-bold text-blue-600">{data.totalConversations}</p>
                </div>
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Conversations */}
        <div className="space-y-6">
          {data.conversationsWithMessages.map(conv => (
            <Card key={conv.conversation.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-8 h-8 text-gray-400" />
                    <div>
                      <h3 className="font-semibold">{conv.conversation.entity_name}</h3>
                      <p className="text-sm text-gray-600">{conv.conversation.metadata.phone}</p>
                    </div>
                  </div>
                  <Badge>{conv.messages.length} messages</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conv.messages.slice(0, 5).map(msg => (
                    <div 
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.direction === 'inbound' 
                          ? 'bg-gray-100' 
                          : 'bg-green-100 ml-auto max-w-[80%]'
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">{msg.text}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  ))}
                  {conv.messages.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      ... and {conv.messages.length - 5} more messages
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Auto-refreshes every 10 seconds</p>
          <p>Total: {data.totalMessages} messages across {data.totalConversations} conversations</p>
        </div>
      </div>
    </div>
  )
}