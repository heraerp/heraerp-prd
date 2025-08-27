'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageCircle, 
  Send, 
  Search, 
  Phone,
  Clock,
  CheckCheck,
  AlertCircle,
  Users,
  TrendingUp,
  Calendar,
  ChevronLeft
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Conversation {
  id: string
  phone: string
  name: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  customerType: 'new' | 'existing' | 'vip'
}

interface Message {
  id: string
  text: string
  direction: 'inbound' | 'outbound'
  timestamp: string
  status?: 'sent' | 'delivered' | 'read'
  intent?: string
}

export default function WhatsAppDashboard() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    totalConversations: 0,
    todayMessages: 0,
    bookingRate: 0,
    responseTime: '< 1 min'
  })
  
  useEffect(() => {
    if (currentOrganization) {
      fetchConversations()
      fetchStats()
    }
  }, [currentOrganization])
  
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])
  
  const fetchConversations = async () => {
    if (!currentOrganization) return
    
    try {
      // Get WhatsApp conversations
      const { data: convos } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('entity_type', 'whatsapp_conversation')
        .order('updated_at', { ascending: false })
      
      // Get last message for each conversation
      console.log(`Found ${convos?.length || 0} conversations`)
      
      for (const conv of convos || []) {
        const { data: lastMsg, error: msgError } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('transaction_type', 'whatsapp_message')
          .eq('organization_id', currentOrganization.id)
          .or(`source_entity_id.eq.${conv.id},target_entity_id.eq.${conv.id}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (msgError) {
          console.log(`No messages found for conversation ${conv.id}`)
        } else if (lastMsg) {
          console.log(`Found message for conversation ${conv.id}:`, lastMsg.metadata?.text)
          conv.lastMessage = lastMsg
        }
      }
      
      const formattedConversations: Conversation[] = (convos || []).map(conv => {
        const lastMsg = conv.lastMessage
        return {
          id: conv.id,
          phone: conv.metadata?.phone || conv.entity_code.replace('WA-', ''),
          name: conv.metadata?.sender_name || conv.entity_name.replace('WhatsApp: ', ''),
          lastMessage: lastMsg?.metadata?.text || 'No messages',
          lastMessageTime: lastMsg?.created_at || conv.created_at,
          unreadCount: conv.metadata?.unread_count || 0,
          customerType: conv.metadata?.customer_type || 'new'
        }
      })
      
      setConversations(formattedConversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }
  
  const fetchMessages = async (conversationId: string) => {
    if (!currentOrganization) return
    
    try {
      // Get messages for conversation
      const { data: msgs } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .or(`source_entity_id.eq.${conversationId},target_entity_id.eq.${conversationId}`)
        .eq('transaction_type', 'whatsapp_message')
        .order('created_at', { ascending: true })
      
      const formattedMessages: Message[] = (msgs || []).map(msg => ({
        id: msg.id,
        text: msg.metadata?.text || '',
        direction: msg.source_entity_id === conversationId ? 'inbound' : 'outbound',
        timestamp: msg.created_at,
        status: msg.metadata?.status || 'sent',
        intent: msg.metadata?.intent
      }))
      
      setMessages(formattedMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }
  
  const fetchStats = async () => {
    if (!currentOrganization) return
    
    try {
      // Get today's stats
      const today = new Date().toISOString().split('T')[0]
      
      const { count: todayCount } = await supabase
        .from('universal_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .eq('transaction_type', 'whatsapp_message')
        .gte('created_at', today)
      
      const { count: totalConvos } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .eq('entity_type', 'whatsapp_conversation')
      
      setStats({
        totalConversations: totalConvos || 0,
        todayMessages: todayCount || 0,
        bookingRate: 45, // Would calculate from actual data
        responseTime: '< 1 min'
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) {
      const mins = Math.floor(diff / (1000 * 60))
      return `${mins}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }
  
  const getCustomerBadge = (type: string) => {
    switch (type) {
      case 'vip':
        return <Badge variant="default" className="bg-purple-600">VIP</Badge>
      case 'existing':
        return <Badge variant="secondary">Customer</Badge>
      default:
        return <Badge variant="outline">New</Badge>
    }
  }
  
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin mx-auto mb-4 border-4 border-purple-600 border-t-transparent rounded-full" />
          <p className="text-gray-600">Loading WhatsApp dashboard...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/salon')}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  WhatsApp Business
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage customer conversations and bookings
                </p>
              </div>
              <Button 
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Send Broadcast
              </Button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Chats</p>
                    <p className="text-2xl font-bold">{stats.totalConversations}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Today's Messages</p>
                    <p className="text-2xl font-bold">{stats.todayMessages}</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Booking Rate</p>
                    <p className="text-2xl font-bold">{stats.bookingRate}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Response</p>
                    <p className="text-2xl font-bold">{stats.responseTime}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <Card className="h-[600px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Conversations</CardTitle>
                    <Badge variant="outline">{conversations.length}</Badge>
                  </div>
                  <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[480px]">
                    {conversations
                      .filter(conv => 
                        conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        conv.phone.includes(searchTerm)
                      )
                      .map(conv => (
                        <div
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedConversation?.id === conv.id ? 'bg-purple-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{conv.name}</p>
                                {getCustomerBadge(conv.customerType)}
                              </div>
                              <p className="text-sm text-gray-600">{conv.phone}</p>
                              <p className="text-sm text-gray-500 mt-1 truncate">
                                {conv.lastMessage}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {formatTime(conv.lastMessageTime)}
                              </p>
                              {conv.unreadCount > 0 && (
                                <Badge className="mt-1" variant="destructive">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            
            {/* Chat View */}
            <div className="lg:col-span-2">
              <Card className="h-[600px]">
                {selectedConversation ? (
                  <>
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold">{selectedConversation.name}</h3>
                            <p className="text-sm text-gray-600">{selectedConversation.phone}</p>
                          </div>
                          {getCustomerBadge(selectedConversation.customerType)}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                          <Button size="sm" variant="outline">
                            <Calendar className="w-4 h-4 mr-1" />
                            Book
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[400px] p-4">
                        <div className="space-y-4">
                          {messages.map(msg => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  msg.direction === 'outbound'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm">{msg.text}</p>
                                <div className={`flex items-center gap-2 mt-1 ${
                                  msg.direction === 'outbound' ? 'text-green-200' : 'text-gray-500'
                                }`}>
                                  <p className="text-xs">
                                    {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {msg.direction === 'outbound' && (
                                    <CheckCheck className="w-3 h-3" />
                                  )}
                                  {msg.intent && (
                                    <Badge variant="outline" className="text-xs">
                                      {msg.intent}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="border-t p-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type a message..."
                            className="flex-1"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                // Send message
                              }
                            }}
                          />
                          <Button className="bg-green-600 hover:bg-green-700">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline">
                            Send Appointment Times
                          </Button>
                          <Button size="sm" variant="outline">
                            Send Service Menu
                          </Button>
                          <Button size="sm" variant="outline">
                            Send Location
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Select a conversation to view messages</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
          
          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Today's Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">New Bookings</p>
                  <p className="text-xl font-semibold text-green-600">12</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cancellations</p>
                  <p className="text-xl font-semibold text-red-600">2</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inquiries</p>
                  <p className="text-xl font-semibold text-blue-600">18</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reminders Sent</p>
                  <p className="text-xl font-semibold text-purple-600">25</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}