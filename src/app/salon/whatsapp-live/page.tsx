'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, RefreshCw, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WhatsAppLive() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [totalCount, setTotalCount] = useState(0)
  
  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/whatsapp/debug-dashboard')
      const result = await response.json()
      
      if (result.status === 'success') {
        // Get all messages from all conversations
        const allMessages = []
        result.data.conversationsWithMessages.forEach((conv: any) => {
          conv.messages.forEach((msg: any) => {
            allMessages.push({
              ...msg,
              phone: conv.conversation.metadata.phone,
              conversationName: conv.conversation.entity_name
            })
          })
        })
        
        // Sort by created_at descending (newest first)
        allMessages.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        setMessages(allMessages)
        setTotalCount(result.data.totalMessages)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchMessages()
    // Auto refresh every 5 seconds
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [])
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">WhatsApp Live Messages</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Real-time view • Auto-refreshes every 5 seconds
                </p>
              </div>
              <Button 
                onClick={fetchMessages}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-green-600">{totalCount}</p>
                <p className="text-sm text-gray-600">Total Messages</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{messages.length}</p>
                <p className="text-sm text-gray-600">Displayed</p>
              </div>
              <div>
                <p className="text-sm font-medium">{lastUpdate.toLocaleTimeString()}</p>
                <p className="text-sm text-gray-600">Last Update</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Messages List */}
        <div className="space-y-3">
          {messages.map((msg, index) => (
            <Card key={msg.id} className={index === 0 ? 'ring-2 ring-green-500' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className={`w-4 h-4 ${
                        msg.direction === 'inbound' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                      <span className="font-medium text-sm">
                        {msg.phone}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        msg.direction === 'inbound' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {msg.direction}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{msg.text}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(msg.created_at)}</span>
                      {index === 0 && (
                        <span className="ml-2 text-green-600 font-medium">
                          • Latest Message
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {messages.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No messages found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}