'use client'

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Filter,
  Users,
  Bot,
  User,
  MessageSquare,
  RefreshCw
} from 'lucide-react'
import { formatDate, isTodaySafe, isYesterdaySafe, differenceInHoursSafe } from '@/src/lib/date-utils'
import { cn } from '@/src/lib/utils'
import { MessageStatusHistory } from '@/src/components/whatsapp/MessageStatusHistory'

interface Conversation {
  id: string
  entity_code: string
  entity_name: string
  metadata: {
    phone: string
    wa_id?: string
    status?: string
    last_activity?: string
    customer_id?: string
    agent_id?: string
    unread_count?: number
  }
  created_at: string
}

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
  metadata: {
    message_type?: string
    status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
    status_history?: Array<{
      status: string
      timestamp: string
      error?: any
    }>
    agent_id?: string
    template_name?: string
    interactive?: any
  }
}

export default function EnterpriseWhatsApp() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'assigned' | 'bot'>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [statusHistoryOpen, setStatusHistoryOpen] = useState(false)
  const [selectedMessageForStatus, setSelectedMessageForStatus] = useState<Message | null>(null)

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/v1/whatsapp/messages-simple')
      const result = await response.json()

      if (result.status === 'success') {
        // Extract unique conversations with metadata
        const convMap = new Map<string, Conversation>()

        result.data.conversationsWithMessages.forEach((item: any) => {
          const conv = item.conversation
          // Calculate unread count and last activity
          const unreadCount = item.messages.filter(
            (m: Message) => m.direction === 'inbound' && (m.metadata as any)?.status !== 'read'
          ).length

          conv.metadata = {
            ...conv.metadata,
            unread_count: unreadCount,
            last_activity: item.lastMessage?.occurred_at || conv.created_at
          }

          convMap.set(conv.id, conv)
        })

        setConversations(
          Array.from(convMap.values()).sort(
            (a, b) =>
              new Date(b.metadata.last_activity || b.created_at).getTime() -
              new Date(a.metadata.last_activity || a.created_at).getTime()
          )
        )
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/whatsapp/messages-simple')
      const result = await response.json()

      if (result.status === 'success') {
        const convData = result.data.conversationsWithMessages.find(
          (c: any) => c.conversation.id === conversationId
        )
        if (convData) {
          setMessages(
            convData.messages.sort(
              (a: Message, b: Message) =>
                new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
            )
          )
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return

    try {
      setSending(true)

      // Check 24-hour window
      const lastInboundMessage = messages
        .filter(m => m.direction === 'inbound')
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0]

      const hoursSinceLastInbound = lastInboundMessage
        ? differenceInHoursSafe(new Date(), new Date(lastInboundMessage.occurred_at))
        : 25

      if (hoursSinceLastInbound > 24) {
        alert(
          'Cannot send message: Outside 24-hour customer service window. Use a template message instead.'
        )
        return
      }

      // In production, this would call the actual WhatsApp API
      // For now, we'll create a local message
      const response = await fetch('/api/v1/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          text: messageText,
          to: selectedConversation.metadata.phone
        })
      })

      if (response.ok) {
        setMessageText('')
        // Refresh messages
        await fetchMessages(selectedConversation.id)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchConversations()
  }, [])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Only fetch data, don't trigger any page reloads
      const fetchInBackground = async () => {
        setIsRefreshing(true)
        try {
          // Fetch conversations without showing loading state
          const convResponse = await fetch('/api/v1/whatsapp/messages-simple')
          const convResult = await convResponse.json()

          if (convResult.status === 'success') {
            // Update conversations without triggering re-renders unless data changed
            const convMap = new Map<string, Conversation>()

            convResult.data.conversationsWithMessages.forEach((item: any) => {
              const conv = item.conversation
              const unreadCount = item.messages.filter(
                (m: Message) => m.direction === 'inbound' && (m.metadata as any)?.status !== 'read'
              ).length

              conv.metadata = {
                ...conv.metadata,
                unread_count: unreadCount,
                last_activity: item.lastMessage?.occurred_at || conv.created_at
              }

              convMap.set(conv.id, conv)
            })

            setConversations(prev => {
              const newConvs = Array.from(convMap.values()).sort(
                (a, b) =>
                  new Date(b.metadata.last_activity || b.created_at).getTime() -
                  new Date(a.metadata.last_activity || a.created_at).getTime()
              )

              // Only update if data actually changed
              if (JSON.stringify(prev) !== JSON.stringify(newConvs)) {
                return newConvs
              }
              return prev
            })

            // Update messages for selected conversation
            if (selectedConversation) {
              const convData = convResult.data.conversationsWithMessages.find(
                (c: any) => c.conversation.id === selectedConversation.id
              )
              if (convData) {
                setMessages(prev => {
                  const newMessages = convData.messages.sort(
                    (a: Message, b: Message) =>
                      new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
                  )

                  // Only update if messages changed
                  if (JSON.stringify(prev) !== JSON.stringify(newMessages)) {
                    // Check if there are new messages
                    if (newMessages.length > prev.length) {
                      // Play a subtle sound or show notification (optional)
                      // You can add a sound effect here if needed
                    }
                    return newMessages
                  }
                  return prev
                })
              }
            }
          }
        } catch (error) {
          console.error('Background refresh error:', error)
        } finally {
          setIsRefreshing(false)
        }
      }

      fetchInBackground()
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh, selectedConversation?.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        conv.entity_name.toLowerCase().includes(query) ||
        conv.metadata.phone.includes(query) ||
        conv.entity_code.toLowerCase().includes(query)
      )
    }

    // Status filter
    switch (filter) {
      case 'unread':
        return (conv.metadata.unread_count || 0) > 0
      case 'assigned':
        return conv.metadata.agent_id !== undefined
      case 'bot':
        return conv.metadata.agent_id === undefined
      default:
        return true
    }
  })

  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isTodaySafe(date)) {
      return formatDate(date, 'HH:mm')
    } else if (isYesterdaySafe(date)) {
      return 'Yesterday ' + formatDate(date, 'HH:mm')
    }
    return formatDate(date, 'dd/MM/yyyy HH:mm')
  }

  // Format last seen
  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isTodaySafe(date)) {
      return formatDate(date, "'Today at' HH:mm")
    } else if (isYesterdaySafe(date)) {
      return formatDate(date, "'Yesterday at' HH:mm")
    }
    return formatDate(date, 'dd MMM yyyy')
  }

  // Message status icon
  const MessageStatus = ({ status, onClick }: { status?: string; onClick?: () => void }) => {
    const content = (() => {
      switch (status) {
        case 'sent':
          return (
            <div className="flex items-center gap-0.5">
              <Check className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Sent</span>
            </div>
          )
        case 'delivered':
          return (
            <div className="flex items-center gap-0.5">
              <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Delivered</span>
            </div>
          )
        case 'read':
          return (
            <div className="flex items-center gap-0.5">
              <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] text-blue-500">Read</span>
            </div>
          )
        case 'failed':
          return (
            <div className="flex items-center gap-0.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[10px] text-red-500">Failed</span>
            </div>
          )
        default:
          return (
            <div className="flex items-center gap-0.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Pending</span>
            </div>
          )
      }
    })()

    return onClick ? (
      <button
        onClick={onClick}
        className="hover:bg-background/5 dark:hover:bg-background/5 rounded px-1 transition-colors"
      >
        {content}
      </button>
    ) : (
      content
    )
  }

  return (
    <div className="flex h-screen bg-muted dark:bg-background">
      {/* Sidebar - Conversations List */}
      <div className="w-96 bg-background dark:bg-muted border-r border-border dark:border-border">
        {/* Header */}
        <div className="p-4 border-b border-border dark:border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">WhatsApp Business</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {conversations.length} active
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setAutoRefresh(!autoRefresh)}
                title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              >
                <RefreshCw
                  className={cn(
                    'w-4 h-4',
                    autoRefresh && 'text-green-600 dark:text-green-400',
                    isRefreshing && 'animate-spin'
                  )}
                />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === 'unread' ? 'default' : 'outline'}
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
            <Button
              size="sm"
              variant={filter === 'assigned' ? 'default' : 'outline'}
              onClick={() => setFilter('assigned')}
            >
              <User className="w-3 h-3 mr-1" />
              Assigned
            </Button>
            <Button
              size="sm"
              variant={filter === 'bot' ? 'default' : 'outline'}
              onClick={() => setFilter('bot')}
            >
              <Bot className="w-3 h-3 mr-1" />
              Bot
            </Button>
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="h-[calc(100vh-180px)]">
          {filteredConversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => {
                setSelectedConversation(conv)
                fetchMessages(conv.id)
              }}
              className={cn(
                'p-4 border-b border-gray-100 dark:border-border cursor-pointer hover:bg-muted dark:hover:bg-muted-foreground/10/50',
                selectedConversation?.id === conv.id && 'bg-muted dark:bg-muted-foreground/10'
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${conv.metadata.phone}`}
                  />
                  <AvatarFallback>
                    {conv.entity_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate">{conv.entity_name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {formatLastSeen(conv.metadata.last_activity || conv.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground truncate">
                      {conv.metadata.phone}
                    </p>
                    <div className="flex items-center gap-2">
                      {conv.metadata.agent_id ? (
                        <User className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Bot className="w-4 h-4 text-green-500" />
                      )}
                      {(conv.metadata.unread_count || 0) > 0 && (
                        <Badge className="text-xs px-2 py-0">{conv.metadata.unread_count}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-background dark:bg-muted p-4 border-b border-border dark:border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedConversation.metadata.phone}`}
                  />
                  <AvatarFallback>
                    {selectedConversation.entity_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{selectedConversation.entity_name}</h2>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {selectedConversation.metadata.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fetchMessages(selectedConversation.id)}
                  disabled={loading}
                  title="Refresh messages"
                >
                  <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.direction === 'inbound' ? 'justify-start' : 'justify-end'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-lg px-4 py-2',
                        message.direction === 'inbound'
                          ? 'bg-gray-700 dark:bg-muted-foreground/10'
                          : 'bg-green-500 text-foreground'
                      )}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-xs opacity-70">
                          {formatMessageTime(message.occurred_at)}
                        </span>
                        {message.direction === 'outbound' && (
                          <MessageStatus
                            status={(message.metadata as any)?.status}
                            onClick={() => {
                              setSelectedMessageForStatus(message)
                              setStatusHistoryOpen(true)
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="bg-background dark:bg-muted p-4 border-t border-border dark:border-border">
            <div className="flex items-end gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <Textarea
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  className="min-h-[40px] max-h-[120px] resize-none"
                  rows={1}
                />
              </div>
              <Button variant="ghost" size="icon">
                <Smile className="w-5 h-5" />
              </Button>
              <Button onClick={sendMessage} disabled={sending || !messageText.trim()} size="icon">
                <Send className="w-5 h-5" />
              </Button>
            </div>

            {/* 24-hour window warning */}
            {messages.length > 0 &&
              (() => {
                const lastInbound = messages
                  .filter(m => m.direction === 'inbound')
                  .sort(
                    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
                  )[0]

                const hours = lastInbound
                  ? differenceInHoursSafe(new Date(), new Date(lastInbound.occurred_at))
                  : 25

                return hours > 20 && hours < 24 ? (
                  <div className="flex items-center gap-2 mt-2 text-xs text-orange-600 dark:text-orange-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>24-hour window expires in {24 - hours} hours</span>
                  </div>
                ) : hours >= 24 ? (
                  <div className="flex items-center gap-2 mt-2 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>Outside 24-hour window - use template messages only</span>
                  </div>
                ) : null
              })()}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground dark:text-muted-foreground">
              Select a conversation to start chatting
            </h3>
          </div>
        </div>
      )}

      {/* Message Status History Dialog */}
      <MessageStatusHistory
        open={statusHistoryOpen}
        onOpenChange={setStatusHistoryOpen}
        messageId={selectedMessageForStatus?.waba_message_id || ''}
        statusHistory={selectedMessageForStatus?.metadata?.status_history}
        currentStatus={selectedMessageForStatus?.metadata?.status}
      />
    </div>
  )
}
