'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, RefreshCw, Clock, User, Hash, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Message {
  id: string
  text: string
  direction: 'inbound' | 'outbound'
  wa_id: string
  phone: string
  customerName: string
  conversationId: string
  conversationName: string
  waba_message_id: string
  created_at: string
  occurred_at: string
  smart_code: string
  metadata: any
}

interface ConversationData {
  conversation: {
    id: string
    entity_code: string
    entity_name: string
    metadata: any
    created_at: string
  }
  messages: Message[]
  messageCount: number
  lastMessage: Message | null
}

export default function WhatsAppCanonical() {
  const [conversations, setConversations] = useState<ConversationData[]>([])
  const [allMessages, setAllMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [totalCount, setTotalCount] = useState(0)
  const [activeView, setActiveView] = useState<'timeline' | 'conversations'>('timeline')
  
  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/whatsapp/messages-simple')
      const result = await response.json()
      
      if (result.status === 'success') {
        setConversations(result.data.conversationsWithMessages)
        setAllMessages(result.data.allMessages)
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
    const interval = setInterval(fetchMessages, 10000) // Refresh every 10 seconds
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
  
  const renderMessage = (msg: Message, index: number) => (
    <Card key={msg.id} className={index === 0 && activeView === 'timeline' ? 'ring-2 ring-green-500' : ''}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium text-sm">{msg.customerName}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="w-3 h-3" />
                  <span>{msg.phone}</span>
                </div>
              </div>
            </div>
            <Badge variant={msg.direction === 'inbound' ? 'default' : 'secondary'}>
              {msg.direction}
            </Badge>
          </div>
          
          {/* Message Content */}
          <div className={`p-3 rounded-lg ${
            msg.direction === 'inbound' 
              ? 'bg-gray-100 dark:bg-gray-800' 
              : 'bg-green-100 dark:bg-green-900'
          }`}>
            <p className="text-sm">{msg.text}</p>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTime(msg.occurred_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                <span className="font-mono text-xs">{msg.waba_message_id?.slice(-8)}</span>
              </div>
            </div>
            {index === 0 && activeView === 'timeline' && (
              <span className="text-green-600 font-medium">Latest</span>
            )}
          </div>
          
          {/* Smart Code */}
          <div className="text-xs text-gray-400 font-mono">
            {msg.smart_code}
          </div>
        </div>
      </CardContent>
    </Card>
  )
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">WhatsApp Messages (HERA Canonical)</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Following universal 6-table architecture
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border">
                  <Button
                    variant={activeView === 'timeline' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('timeline')}
                    className="rounded-r-none"
                  >
                    Timeline
                  </Button>
                  <Button
                    variant={activeView === 'conversations' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('conversations')}
                    className="rounded-l-none"
                  >
                    Conversations
                  </Button>
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-green-600">{totalCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{conversations.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conversations</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600">
                  {allMessages.filter(m => m.direction === 'inbound').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inbound</p>
              </div>
              <div>
                <p className="text-sm font-medium">{lastUpdate.toLocaleTimeString()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Update</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Content */}
        <div className="space-y-4">
          {activeView === 'timeline' ? (
            // Timeline View - All messages chronologically
            <>
              <h3 className="text-lg font-semibold mb-3">All Messages (Newest First)</h3>
              {allMessages.map((msg, index) => renderMessage(msg, index))}
            </>
          ) : (
            // Conversations View - Grouped by conversation
            <>
              <h3 className="text-lg font-semibold mb-3">Conversations</h3>
              {conversations.map((conv) => (
                <Card key={conv.conversation.id} className="mb-6">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">{conv.conversation.entity_name}</h4>
                          <p className="text-xs text-gray-500">
                            {conv.messageCount} messages • Started {formatTime(conv.conversation.created_at)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{conv.conversation.entity_code}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {conv.messages.slice(0, 5).map((msg, index) => (
                      <div key={msg.id} className={`p-3 rounded-lg ${
                        msg.direction === 'inbound' 
                          ? 'bg-gray-100 dark:bg-gray-800 mr-12' 
                          : 'bg-green-100 dark:bg-green-900 ml-12'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(msg.occurred_at)}
                        </p>
                      </div>
                    ))}
                    {conv.messageCount > 5 && (
                      <p className="text-center text-sm text-gray-500">
                        +{conv.messageCount - 5} more messages
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
        
        {/* Empty State */}
        {allMessages.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No messages found</p>
            </CardContent>
          </Card>
        )}
        
        {/* Architecture Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">HERA Architecture Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Entities:</p>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                  <li>• Customer entities (wa_id as entity_code)</li>
                  <li>• Channel entity (WABA number)</li>
                  <li>• Conversation entities (24hr windows)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Transactions:</p>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                  <li>• Messages as universal_transactions</li>
                  <li>• Transaction lines for content parts</li>
                  <li>• Dynamic data for message metadata</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="text-xs">
                <strong>Smart Codes:</strong> HERA.BEAUTY.COMMS.MESSAGE.{'{RECEIVED|SENT}'}.V1
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}