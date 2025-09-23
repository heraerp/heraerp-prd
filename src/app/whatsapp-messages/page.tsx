'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * WhatsApp Messages Viewer with MCP Integration
 * Display all WhatsApp conversations and messages with analytics
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MessageCircle,
  RefreshCw,
  Search,
  Download,
  ChevronRight,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  User,
  Phone,
  Star,
  Archive,
  Pin,
  MoreVertical,
  Settings,
  TrendingUp,
  Users,
  Activity,
  Calendar,
  BarChart3,
  Send,
  Paperclip,
  Smile
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WhatsAppSetup } from '@/components/whatsapp/WhatsAppSetup'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

interface Conversation {
  id: string
  entity_name: string
  entity_code: string
  metadata: any
  lastMessage: Message | null
  messages: Message[]
  unreadCount: number
  isPinned: boolean
  isArchived: boolean
  updated_at: string
}

interface Message {
  id: string
  transaction_type: string
  transaction_code: string
  metadata: any
  created_at: string
  isStarred?: boolean
  source_entity_id: string
  target_entity_id: string
}

interface Analytics {
  totalMessages: number
  uniqueContacts: number
  avgResponseTime: string
  engagementRate: number
  popularTimeSlots: Array<{ hour: number; count: number }>
  topContacts: Array<{ name: string; messageCount: number }>
}

export default function WhatsAppMessagesPage() {
  const { currentOrganization } = useHERAAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('messages')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    unreadMessages: 0,
    archivedConversations: 0
  })

  const fetchConversations = async () => {
    if (!currentOrganization?.id) return

    setLoading(true)
    try {
      const response = await fetch('/api/v1/whatsapp/six-tables?action=conversations')
      const data = await response.json()

      if (data.status === 'success' && data.data) {
        setConversations(data.data.conversations)
        setStats({
          totalConversations: data.data.totalConversations,
          totalMessages: data.data.totalMessages,
          unreadMessages: data.data.conversations.reduce(
            (sum: number, conv: Conversation) => sum + conv.unreadCount,
            0
          ),
          archivedConversations: data.data.conversations.filter(
            (conv: Conversation) => conv.isArchived
          ).length
        })

        // Select first conversation if none selected
        if (!selectedConversation && data.data.conversations.length > 0) {
          setSelectedConversation(data.data.conversations[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    if (!currentOrganization?.id) return

    try {
      const response = await fetch('/api/v1/whatsapp/six-tables?action=analytics')
      const data = await response.json()

      if (data.status === 'success' && data.data) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  useEffect(() => {
    fetchConversations()
    fetchAnalytics()

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchConversations()
      fetchAnalytics()
    }, 30000)

    return () => clearInterval(interval)
  }, [currentOrganization])

  const filteredConversations = conversations.filter(conv => {
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        conv.entity_name.toLowerCase().includes(query) ||
        conv.entity_code.toLowerCase().includes(query) ||
        conv.messages.some(m => (m.metadata as any)?.text?.toLowerCase().includes(query))
      )
    }

    return true
  })

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getMessageStatusIcon = (message: Message) => {
    const status = (message.metadata as any)?.latest_status

    if (status === 'read') {
      return <CheckCheck className="w-4 h-4 text-blue-500" />
    } else if (status === 'delivered') {
      return <CheckCheck className="w-4 h-4 text-muted-foreground" />
    } else if (status === 'sent') {
      return <Check className="w-4 h-4 text-muted-foreground" />
    } else if (status === 'failed') {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }

    return null
  }

  const togglePin = async (conversationId: string, isPinned: boolean) => {
    try {
      await fetch('/api/v1/whatsapp/six-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'togglePin',
          threadId: conversationId,
          shouldPin: !isPinned
        })
      })
      fetchConversations()
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  const toggleArchive = async (conversationId: string, isArchived: boolean) => {
    try {
      await fetch('/api/v1/whatsapp/six-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleArchive',
          threadId: conversationId,
          shouldArchive: !isArchived
        })
      })
      fetchConversations()
    } catch (error) {
      console.error('Failed to toggle archive:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 !text-foreground">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                <MessageCircle className="w-6 h-6 text-foreground" />
              </div>
              WhatsApp Business Hub
            </h1>
            <p className="!text-gray-300 mt-1">
              Conversations, analytics, and automation powered by HERA MCP
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSetup(!showSetup)}
              className="border-border !text-gray-300 hover:!bg-muted"
            >
              <Settings className="w-4 h-4 mr-2" />
              Setup
            </Button>
            <Button
              onClick={() => {
                fetchConversations()
                fetchAnalytics()
              }}
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-foreground"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Setup Section */}
        {showSetup && <WhatsAppSetup onClose={() => setShowSetup(false)} />}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-gray-800 to-gray-800/95 border border-border shadow-sm hover:shadow-md transform hover:scale-105 transition-all cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 opacity-20 blur-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold !text-foreground">{stats.totalConversations}</p>
                {stats.unreadMessages > 0 && (
                  <Badge className="bg-red-500 text-foreground border-0">
                    {stats.unreadMessages} new
                  </Badge>
                )}
              </div>
              <p className="text-sm !text-gray-300 mt-1 font-medium">conversations</p>
              <p className="text-xs !text-muted-foreground mt-2">Active Chats</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-gray-800 to-gray-800/95 border border-border shadow-sm hover:shadow-md transform hover:scale-105 transition-all cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 opacity-20 blur-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-foreground" />
              </div>
              <p className="text-3xl font-bold !text-foreground">{stats.totalMessages}</p>
              <p className="text-sm !text-gray-300 mt-1 font-medium">all time</p>
              <p className="text-xs !text-muted-foreground mt-2">Total Messages</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-gray-800 to-gray-800/95 border border-border shadow-sm hover:shadow-md transform hover:scale-105 transition-all cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 opacity-20 blur-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-foreground" />
              </div>
              <p className="text-3xl font-bold !text-foreground">
                {analytics ? `${analytics.engagementRate}%` : '-'}
              </p>
              <p className="text-sm !text-gray-300 mt-1 font-medium">engagement</p>
              <p className="text-xs !text-muted-foreground mt-2">Response Rate</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-gray-800 to-gray-800/95 border border-border shadow-sm hover:shadow-md transform hover:scale-105 transition-all cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 opacity-20 blur-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-foreground" />
              </div>
              <p className="text-3xl font-bold !text-foreground">
                {analytics?.avgResponseTime || '-'}
              </p>
              <p className="text-sm !text-gray-300 mt-1 font-medium">time</p>
              <p className="text-xs !text-muted-foreground mt-2">Avg Response</p>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger
              value="messages"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-cyan-600 data-[state=active]:text-foreground"
            >
              Messages
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-cyan-600 data-[state=active]:text-foreground"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="automation"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-cyan-600 data-[state=active]:text-foreground"
            >
              Automation
            </TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversations List */}
              <Card className="lg:col-span-1 bg-muted border-border">
                <CardHeader>
                  <CardTitle className="!text-foreground">Conversations</CardTitle>
                  <div className="mt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 bg-muted-foreground/10 border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    {filteredConversations.map(conversation => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 border-b border-border cursor-pointer hover:bg-muted-foreground/10/50 transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? 'bg-gradient-to-r from-violet-600/20 to-cyan-600/20'
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="bg-gradient-to-br from-violet-600 to-cyan-600">
                            <AvatarFallback className="bg-transparent text-foreground">
                              {conversation.entity_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate !text-foreground">
                                {conversation.entity_name}
                              </p>
                              <span className="text-xs !text-muted-foreground">
                                {formatMessageTime(conversation.updated_at)}
                              </span>
                            </div>

                            {conversation.lastMessage && (
                              <div className="flex items-center gap-1 mt-1">
                                {conversation.lastMessage.source_entity_id === null &&
                                  getMessageStatusIcon(conversation.lastMessage)}
                                <p className="text-sm !text-muted-foreground truncate">
                                  {(conversation.lastMessage.metadata as any)?.text ||
                                    (conversation.lastMessage.metadata as any)?.caption ||
                                    `[${(conversation.lastMessage.metadata as any)?.type || 'message'}]`}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                {conversation.isPinned && (
                                  <Pin className="w-3 h-3 text-violet-400" />
                                )}
                                {(conversation.metadata as any)?.is_online && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-green-500 text-green-500"
                                  >
                                    Online
                                  </Badge>
                                )}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-foreground border-0">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Messages View */}
              <Card className="lg:col-span-2 bg-muted border-border">
                {selectedConversation ? (
                  <>
                    <CardHeader className="border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="bg-gradient-to-br from-violet-600 to-cyan-600">
                            <AvatarFallback className="bg-transparent text-foreground">
                              {selectedConversation.entity_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold !text-foreground">
                              {selectedConversation.entity_name}
                            </h3>
                            <p className="text-sm !text-muted-foreground">
                              {selectedConversation.entity_code}
                              {(selectedConversation.metadata as any)?.is_online && (
                                <span className="text-green-500 ml-2">● Online</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              togglePin(selectedConversation.id, selectedConversation.isPinned)
                            }
                            className="text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                          >
                            <Pin
                              className={`w-4 h-4 ${selectedConversation.isPinned ? 'fill-current text-violet-400' : ''}`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleArchive(
                                selectedConversation.id,
                                selectedConversation.isArchived
                              )
                            }
                            className="text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      <ScrollArea className="h-[500px] p-4 bg-background/50">
                        <div className="space-y-4">
                          {selectedConversation.messages.map(message => {
                            const isOutbound = message.source_entity_id === null

                            return (
                              <div
                                key={message.id}
                                className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                    isOutbound
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-foreground'
                                      : 'bg-muted-foreground/10 text-foreground'
                                  }`}
                                >
                                  {message.isStarred && (
                                    <Star className="w-3 h-3 fill-current float-right ml-2" />
                                  )}

                                  <p className="text-sm">
                                    {(message.metadata as any)?.text ||
                                      (message.metadata as any)?.caption ||
                                      `[${(message.metadata as any)?.type || 'message'}]`}
                                  </p>

                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className="text-xs opacity-75">
                                      {formatMessageTime(message.created_at)}
                                    </span>
                                    {isOutbound && getMessageStatusIcon(message)}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>

                      {/* Message Input */}
                      <div className="p-4 border-t border-border bg-muted">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                          >
                            <Paperclip className="w-5 h-5" />
                          </Button>
                          <Input
                            placeholder="Type a message..."
                            className="flex-1 bg-muted-foreground/10 border-border text-foreground placeholder:text-muted-foreground"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                          >
                            <Smile className="w-5 h-5" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-foreground"
                          >
                            <Send className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-10 h-10 text-foreground" />
                      </div>
                      <p className="!text-muted-foreground">
                        Select a conversation to view messages
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            {analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-muted border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 !text-foreground">
                      <BarChart3 className="w-5 h-5 text-violet-400" />
                      Message Activity by Hour
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.popularTimeSlots.map(slot => (
                        <div key={slot.hour} className="flex items-center gap-2">
                          <span className="text-sm w-16 !text-muted-foreground">
                            {slot.hour}:00
                          </span>
                          <div className="flex-1 bg-muted-foreground/10 rounded-full h-4">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full"
                              style={{
                                width: `${(slot.count / Math.max(...analytics.popularTimeSlots.map(s => s.count))) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-sm w-12 text-right !text-gray-300">
                            {slot.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 !text-foreground">
                      <Users className="w-5 h-5 text-cyan-400" />
                      Top Contacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topContacts.map((contact, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 bg-gradient-to-br from-violet-600 to-cyan-600">
                              <AvatarFallback className="bg-transparent text-foreground text-sm">
                                {contact.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium !text-foreground">{contact.name}</span>
                          </div>
                          <Badge className="bg-muted-foreground/10 text-gray-300 border-border">
                            {contact.messageCount} msgs
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Average Response Time</p>
                        <p className="text-2xl font-bold">{analytics.avgResponseTime}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Unique Contacts</p>
                        <p className="text-2xl font-bold">{analytics.uniqueContacts}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Engagement Rate</p>
                        <p className="text-2xl font-bold">{analytics.engagementRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>Loading analytics data...</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="mt-6">
            <Card className="bg-muted border-border">
              <CardHeader>
                <CardTitle className="!text-foreground">Booking Automation</CardTitle>
                <p className="text-sm !text-muted-foreground mt-1">
                  Set up automated booking flows for WhatsApp conversations
                </p>
              </CardHeader>
              <CardContent>
                <Alert className="bg-muted-foreground/10 border-border">
                  <Activity className="w-4 h-4 text-violet-400" />
                  <AlertDescription className="!text-gray-300">
                    Configure automatic booking responses, appointment confirmations, and reminder
                    messages through the HERA MCP WhatsApp integration.
                  </AlertDescription>
                </Alert>
                <div className="mt-4">
                  <Button
                    onClick={() => setShowSetup(true)}
                    className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-foreground"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Automation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
