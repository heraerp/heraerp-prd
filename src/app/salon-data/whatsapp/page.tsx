'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'
import { 
  MessageCircle,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Mic,
  Send,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  Zap,
  DollarSign,
  Calendar,
  User,
  Settings,
  X,
  Filter,
  Download,
  Globe,
  Shield,
  Bot,
  TrendingUp,
  AlertTriangle,
  Info,
  FileText,
  CalendarDays,
  ArrowLeft,
  Scissors,
  Users,
  Package,
  CreditCard,
  Sparkles,
  Scale,
  TrendingDown,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Placeholder components while we fix import issues
function BookingAutomationPanel({ organizationId, onScenarioSelect, onFlowStart }: any) {
  return (
    <div className="p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
      <p className="text-yellow-400 text-sm">
        BookingAutomationPanel temporarily disabled - fixing import issues
      </p>
    </div>
  )
}

function WhatsAppCampaignManager({ organizationId, onCampaignCreate, onCampaignRun }: any) {
  return (
    <div className="p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
      <p className="text-yellow-400 text-sm">
        WhatsAppCampaignManager temporarily disabled - fixing import issues
      </p>
    </div>
  )
}

class BookingAutomationService {
  constructor(orgId: string, apiKey: string) {}
}

// Types
interface Contact {
  id: string
  waContactId: string
  name: string
  phone: string
  avatar?: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  windowState: 'open' | 'closed'
  windowExpiresAt?: Date
  customerEntityId?: string
  tags: string[]
  conversationCost: number
}

interface Message {
  id: string
  content: string
  type: 'text' | 'template' | 'interactive' | 'media'
  direction: 'inbound' | 'outbound'
  timestamp: Date
  status?: 'sent' | 'delivered' | 'read' | 'failed'
  cost?: number
  templateUsed?: string
  metadata?: any
}

interface CostMetrics {
  dailySpend: number
  dailyBudget: number
  paidSendRate: number
  costPerAppointment: number
  windowUtilization: number
}

// MCP API client
const mcpApi = {
  async callTool(tool: string, input: any) {
    const response = await fetch('/api/v1/mcp/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || ''
      },
      body: JSON.stringify({ tool, input })
    })
    return response.json()
  }
}

export default function SalonWhatsAppPage() {
  const router = useRouter()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCallAlert, setShowCallAlert] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string>('')
  const [costMetrics, setCostMetrics] = useState<CostMetrics>({
    dailySpend: 0,
    dailyBudget: 50.00,
    paidSendRate: 0,
    costPerAppointment: 0,
    windowUtilization: 0
  })
  const [selectedTab, setSelectedTab] = useState('chat')
  const [activeAutomations, setActiveAutomations] = useState<Record<string, string>>({
    '1': 'quick_booking', // Sarah has quick booking active
    '3': 'smart_rebooking' // Alex has smart rebooking active
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Test function to create sample messages
  const createTestMessage = async () => {
    try {
      setIsProcessing(true)
      const response = await fetch(`/api/v1/whatsapp/universal-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: organizationId,
          test_message: 'BOOK haircut tomorrow at 3pm',
          from_phone: '+91888333114'
        })
      })
      
      const result = await response.json()
      console.log('Test message result:', result)

      if (result.success) {
        // Refresh the conversation list to show the new message
        setTimeout(() => {
          window.location.reload() // Simple refresh to show new message
        }, 1000)
      }
    } catch (error) {
      console.error('Error creating test message:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Live message function - simulates actual webhook
  const createLiveMessage = async () => {
    try {
      setIsProcessing(true)
      const messages = [
        'I want to book a haircut for Friday at 2pm',
        'Hi! Can I get an appointment with Sara?',
        'What are your prices for hair coloring?',
        'Cancel my appointment for tomorrow please',
        'BOOK manicure Monday 11am',
        'Do you have any slots available this weekend?'
      ]
      const phones = ['+918885551234', '+971501234567', '+447515668004', '+918883333144']
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      const randomPhone = phones[Math.floor(Math.random() * phones.length)]
      
      const response = await fetch(`/api/v1/whatsapp/webhook-test-live`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: randomPhone,
          message: randomMessage,
          direction: 'inbound',
          organizationId: organizationId
        })
      })
      
      const result = await response.json()
      console.log('Live message result:', result)
      
      if (result.success) {
        // Refresh the conversation list to show the new message
        setTimeout(() => {
          window.location.reload() // Simple refresh to show new message
        }, 1000)
      }
    } catch (error) {
      console.error('Error creating live message:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Get organization ID - Use the salon demo organization from middleware
  useEffect(() => {
    // For salon routes, use the Hair Talkz demo organization
    const salonOrgId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' // Hair Talkz • Park Regis
    setOrganizationId(salonOrgId)

    // Check WhatsApp configuration
    if (!process.env.WHATSAPP_ACCESS_TOKEN && !process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN) {
      console.warn('WhatsApp credentials not configured. Set WHATSAPP_ACCESS_TOKEN in your .env file')
    }
  }, [])

  // Fetch real WhatsApp data
  const fetchWhatsAppData = async () => {
    if (!organizationId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
        const response = await fetch(`/api/v1/whatsapp/universal-messages?org_id=${organizationId}`)
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch messages')
        }
        
        if (result.data.conversationsWithMessages && result.data.conversationsWithMessages.length > 0) {
          console.log('WhatsApp Data:', result.data)
          console.log('Total conversations:', result.data.totalConversations)
          console.log('Total messages:', result.data.totalMessages)
          
          // Transform conversations to Contact format
          const formattedContacts: Contact[] = result.data.conversationsWithMessages.map((item: any) => {
            return {
              id: item.id,
              waContactId: item.waContactId,
              name: item.name,
              phone: item.phone,
              lastMessage: item.lastMessage?.text || 'No messages yet',
              lastMessageTime: item.lastMessageTime ? new Date(item.lastMessageTime) : new Date(),
              unreadCount: item.unreadCount || 0,
              windowState: item.windowState || 'closed',
              windowExpiresAt: item.windowExpiresAt ? new Date(item.windowExpiresAt) : undefined,
              tags: item.tags || [],
              conversationCost: item.conversationCost || 0
            }
          })
          
          setContacts(formattedContacts)
          if (formattedContacts.length > 0 && !selectedContact) {
            setSelectedContact(formattedContacts[0])
            // Also set messages for the first contact
            if (result.data.conversationsWithMessages[0].messages) {
              const formattedMessages = result.data.conversationsWithMessages[0].messages.map((msg: any) => ({
                id: msg.id,
                content: msg.text || '',
                type: 'text' as const,
                direction: msg.direction || 'inbound',
                timestamp: new Date(msg.timestamp || msg.occurred_at || msg.created_at),
                status: msg.status || 'delivered',
                cost: msg.cost || 0,
                templateUsed: msg.provider,
                metadata: msg.metadata
              }))
              console.log('📱 Setting messages for first contact:', formattedMessages)
              setMessages(formattedMessages)
            }
          }
          
          // Calculate cost metrics
          const totalCost = formattedContacts.reduce((sum, c) => sum + c.conversationCost, 0)
          const openWindows = formattedContacts.filter(c => c.windowState === 'open').length
          setCostMetrics(prev => ({
            ...prev,
            dailySpend: totalCost,
            windowUtilization: formattedContacts.length > 0 ? openWindows / formattedContacts.length : 0
          }))
        } else {
          // No conversations found - don't show dummy data
          setContacts([])
          setSelectedContact(null)
        }
      } catch (error) {
        console.error('Error fetching WhatsApp data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load conversations')
      } finally {
        setIsLoading(false)
      }
  }
  
  useEffect(() => {
    if (!organizationId) return
    
    fetchWhatsAppData()
    // Refresh every 5 seconds for better real-time experience
    const interval = setInterval(fetchWhatsAppData, 5000)
    return () => clearInterval(interval)
  }, [organizationId])

  // Load messages for selected contact
  useEffect(() => {
    if (selectedContact && selectedContact.id !== 'demo' && organizationId) {
      // Messages are already loaded with conversations
      // But we can fetch more detailed messages here if needed
      const fetchMessages = async () => {
        try {
          const response = await fetch(`/api/v1/whatsapp/universal-messages?org_id=${organizationId}`)
          const result = await response.json()
          
          if (result.success) {
            const conversationData = result.data.conversationsWithMessages.find((c: any) => c.id === selectedContact.id)
            if (conversationData && conversationData.messages) {
              const formattedMessages = conversationData.messages.map((msg: any) => ({
                id: msg.id,
                content: msg.text || '',
                type: 'text' as const,
                direction: msg.direction || 'inbound',
                timestamp: new Date(msg.timestamp || msg.occurred_at || msg.created_at),
                status: msg.status || 'delivered',
                cost: msg.cost || 0,
                templateUsed: msg.provider,
                metadata: msg.metadata
              }))
              console.log('💬 Messages for', selectedContact.name, ':', formattedMessages)
              console.log('📨 Incoming messages:', formattedMessages.filter((m: any) => m.direction === 'inbound'))
              setMessages(formattedMessages)
            }
          }
        } catch (error) {
          console.error('Error fetching messages:', error)
        }
      }
      
      fetchMessages()
    }
  }, [selectedContact, organizationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-hide call alert after 5 seconds
  useEffect(() => {
    if (showCallAlert) {
      const timer = setTimeout(() => {
        setShowCallAlert(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showCallAlert])

  const getWindowStatus = (contact: Contact) => {
    if (contact.windowState === 'open') {
      const hoursLeft = contact.windowExpiresAt ? 
        Math.round((contact.windowExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60)) : 0
      return {
        text: `${hoursLeft}h left`,
        color: hoursLeft > 12 ? 'text-green-600' : hoursLeft > 6 ? 'text-orange-600' : 'text-red-600',
        bgColor: hoursLeft > 12 ? 'bg-green-50' : hoursLeft > 6 ? 'bg-orange-50' : 'bg-red-50'
      }
    }
    return {
      text: 'Closed',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedContact || isProcessing) return

    setIsProcessing(true)

    // Check if automation should handle this
    const automationScenarioId = activeAutomations[selectedContact.id]
    if (automationScenarioId) {
      // Show automation is handling
      const automationService = new BookingAutomationService(
        process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '',
        process.env.NEXT_PUBLIC_CLAUDE_API_KEY
      )
      
      // Simulate automation response
      setTimeout(() => {
        const autoMessage: Message = {
          id: Date.now().toString(),
          content: "🤖 I see you're interested in booking! Let me find the best available slots for you...",
          type: 'text',
          direction: 'outbound',
          timestamp: new Date(),
          status: 'delivered',
          cost: 0,
          metadata: { automated: true }
        }
        setMessages(prev => [...prev, autoMessage])
        
        // Simulate calendar invite being sent
        setTimeout(() => {
          const calendarMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: "📅 I've sent you a calendar invite for tomorrow at 2:00 PM!\n\n✨ Add it to your calendar\n⏰ Automatic reminders set\n📍 Location included\n\nReply 'CONFIRM' to secure your appointment.",
            type: 'interactive',
            direction: 'outbound',
            timestamp: new Date(),
            status: 'delivered',
            cost: 0.05,
            templateUsed: 'CALENDAR_INVITE_v1',
            metadata: { 
              automated: true,
              hasAttachment: true,
              attachmentType: 'calendar',
              attachmentName: 'appointment.ics'
            }
          }
          setMessages(prev => [...prev, calendarMessage])
        }, 2500)
      }, 1000)
    }

    try {
      // Check window state first
      const windowStateResult = await mcpApi.callTool('wa.window_state', {
        organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID,
        wa_contact_id: selectedContact.waContactId
      })

      const isWindowOpen = windowStateResult.success && windowStateResult.data?.state === 'open'

      // Send message using appropriate method
      const sendResult = await mcpApi.callTool('wa.send', {
        organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID,
        to: selectedContact.waContactId,
        kind: isWindowOpen ? 'freeform' : 'template',
        body: messageInput,
        template_id: !isWindowOpen ? 'GENERAL_RESPONSE_v1' : undefined
      })

      if (sendResult.success) {
        const newMessage: Message = {
          id: Date.now().toString(),
          content: messageInput,
          type: 'text',
          direction: 'outbound',
          timestamp: new Date(),
          status: 'sent',
          cost: sendResult.data?.cost_estimate || 0,
          templateUsed: sendResult.data?.template_category
        }

        setMessages(prev => [...prev, newMessage])
        setMessageInput('')

        // Update cost metrics if message was paid
        if (sendResult.data?.cost_estimate > 0) {
          setCostMetrics(prev => ({
            ...prev,
            dailySpend: prev.dailySpend + sendResult.data.cost_estimate
          }))
        }

        // Update message status after a delay
        setTimeout(() => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
            )
          )
        }, 1500)
      } else {
        console.error('Failed to send message:', sendResult.error)
        alert('Failed to send message: ' + sendResult.error)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message. Please check your configuration.')
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  )

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Header with Menu Button */}
      <header className="bg-gray-800/90 backdrop-blur-lg border-b border-gray-700 flex-shrink-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">Hair Talkz WhatsApp</h1>
                  <p className="text-xs text-gray-400">Business Messaging</p>
                </div>
              </div>
            </div>

            {/* Budget Info & Test Buttons */}
            <div className="flex items-center gap-3">
              {/* Test Seed Message Button */}
              <Button
                onClick={createTestMessage}
                disabled={isProcessing}
                variant="outline"
                size="sm"
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 mr-1" />
                    Test Seed
                  </>
                )}
              </Button>

              {/* Live Message Button */}
              <Button
                onClick={createLiveMessage}
                disabled={isProcessing}
                variant="outline"
                size="sm"
                className="text-xs bg-green-600 hover:bg-green-700 text-white border-green-600"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 mr-1" />
                    Live Msg
                  </>
                )}
              </Button>
              
              <Button
                onClick={fetchWhatsAppData}
                size="sm"
                variant="outline"
                className="bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] border-[#2a3942]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Refreshing
                  </>
                ) : (
                  <>
                    <ArrowLeft className="w-3 h-3 mr-1 rotate-180" />
                    Refresh
                  </>
                )}
              </Button>
              
              <div className="text-sm text-gray-300">
                <span className="opacity-75">Daily Budget:</span>{' '}
                <span className="font-semibold">
                  ${costMetrics.dailySpend.toFixed(2)} / ${costMetrics.dailyBudget.toFixed(2)}
                </span>
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs",
                  costMetrics.dailySpend / costMetrics.dailyBudget > 0.8 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                )}
              >
                {((costMetrics.dailySpend / costMetrics.dailyBudget) * 100).toFixed(0)}% used
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Chat List Sidebar */}
        <div className="w-96 bg-[#111b21] border-r border-[#2a3942] flex flex-col h-full overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-[#2a3942]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
              <Input
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#202c33] border-0 text-white placeholder:text-[#8696a0] focus:ring-0 focus:outline-none"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-4 w-full rounded-none bg-[#202c33] border-b border-[#2a3942] flex-shrink-0">
              <TabsTrigger value="chat" className="text-xs text-[#8696a0] data-[state=active]:text-[#00a884]">CHATS</TabsTrigger>
              <TabsTrigger value="automation" className="text-xs text-[#8696a0] data-[state=active]:text-[#00a884]">AUTOMATION</TabsTrigger>
              <TabsTrigger value="costs" className="text-xs text-[#8696a0] data-[state=active]:text-[#00a884]">COSTS</TabsTrigger>
              <TabsTrigger value="tools" className="text-xs text-[#8696a0] data-[state=active]:text-[#00a884]">TOOLS</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                {filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <MessageCircle className="w-12 h-12 text-[#8696a0] mb-3" />
                    <p className="text-sm text-[#8696a0]">
                      {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                    </p>
                    {!searchQuery && (
                      <div className="text-xs text-[#8696a0] mt-2 space-y-2">
                        <p>Messages will appear here once customers send WhatsApp messages</p>
                        <div className="space-y-1">
                          <p className="font-medium">To test:</p>
                          <p>1. Click "Test Message" above, or</p>
                          <p>2. Send "BOOK" to +918883333144</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredContacts.map(contact => {
                  const windowStatus = getWindowStatus(contact)
                  return (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-[#202c33] cursor-pointer border-b border-[#2a3942]",
                        selectedContact?.id === contact.id && "bg-[#2a3942]"
                      )}
                    >
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarFallback className="bg-[#6a7175] text-white">
                          {contact.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-[#e9edef] truncate pr-2">
                            {contact.name}
                          </p>
                          <span className="text-xs text-[#8696a0] ml-2 flex-shrink-0">
                            {contact.lastMessageTime.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-[#8696a0] line-clamp-2 pr-2">
                          {contact.lastMessage}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                windowStatus.color,
                                windowStatus.bgColor
                              )}
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {windowStatus.text}
                            </Badge>
                            {activeAutomations[contact.id] && (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-[#00a884]/10 text-[#00a884] border-[#00a884]/50"
                              >
                                <Bot className="w-3 h-3 mr-1" />
                                Auto
                              </Badge>
                            )}
                            {contact.conversationCost > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <DollarSign className="w-3 h-3" />
                                {contact.conversationCost.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                          {contact.unreadCount > 0 && (
                            <Badge className="bg-[#00a884] text-white text-xs rounded-full min-w-[20px] h-5">
                              {contact.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="automation" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <BookingAutomationPanel 
                    organizationId={process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || ''}
                    onScenarioSelect={(scenario) => {
                      console.log('Selected scenario:', scenario)
                    }}
                    onFlowStart={(flow) => {
                      console.log('Starting flow:', flow)
                      if (selectedContact) {
                        const autoService = new BookingAutomationService(
                          process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '',
                          process.env.NEXT_PUBLIC_CLAUDE_API_KEY
                        )
                        // Start the flow execution
                      }
                    }}
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="costs" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                <Card className="bg-[#202c33] border-[#2a3942]">
                  <div className="p-4">
                    <h3 className="font-semibold mb-3 text-[#e9edef]">Cost Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#8696a0]">Paid Send Rate</span>
                        <span className="font-medium text-[#e9edef]">{(costMetrics.paidSendRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#8696a0]">Cost per Appointment</span>
                        <span className="font-medium text-[#e9edef]">${costMetrics.costPerAppointment.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#8696a0]">Window Utilization</span>
                        <span className="font-medium text-[#e9edef]">{(costMetrics.windowUtilization * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Alert className="border-[#2a3942] bg-[#202c33]">
                  <AlertTriangle className="w-4 h-4 text-[#f9b82f]" />
                  <AlertDescription className="text-[#e9edef]">
                    <strong>Cost Optimization Tip:</strong><br />
                    Try to close bookings within the 24h window to avoid template costs.
                  </AlertDescription>
                </Alert>
              </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tools" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-6">
                  {/* WhatsApp Campaign Manager */}
                  <div>
                    <WhatsAppCampaignManager 
                      organizationId={organizationId}
                      onCampaignCreate={(campaign) => {
                        console.log('Creating campaign:', campaign)
                        // Handle campaign creation
                      }}
                      onCampaignRun={(campaignId) => {
                        console.log('Running campaign:', campaignId)
                        // Handle campaign execution
                      }}
                    />
                  </div>

                  {/* MCP Tools */}
                  <div>
                    <h3 className="text-sm font-medium text-[#e9edef] mb-3">
                      MCP Tools Available
                    </h3>
                    <div className="space-y-2">
                      {[
                        { name: 'calendar.find_slots', status: 'ready', icon: Calendar },
                        { name: 'wa.send', status: 'ready', icon: Send },
                        { name: 'wa.window_state', status: 'ready', icon: Clock },
                        { name: 'hera.txn.write', status: 'ready', icon: FileText },
                        { name: 'pricing.estimate', status: 'ready', icon: DollarSign },
                        { name: 'ics.generate', status: 'ready', icon: Download }
                      ].map(tool => (
                        <div key={tool.name} className="flex items-center justify-between p-3 bg-[#202c33] border border-[#2a3942] rounded-lg">
                          <div className="flex items-center gap-3">
                            <tool.icon className="w-4 h-4 text-[#8696a0]" />
                            <code className="text-xs text-[#e9edef]">{tool.name}</code>
                          </div>
                          <Badge variant="outline" className="text-xs bg-[#00a884]/20 text-[#00a884] border-[#00a884]/50">
                            {tool.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area */}
        {selectedContact ? (
          <div className="flex-1 flex flex-col bg-[#0b141a] h-full overflow-hidden">
            {/* Chat Header */}
            <div className="bg-[#202c33] p-4 border-b border-[#2a3942] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-[#6a7175] text-white">
                    {selectedContact.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-[#e9edef]">{selectedContact.name}</p>
                  <p className="text-xs text-[#8696a0]">{selectedContact.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline"
                  className={cn(
                    "text-xs",
                    getWindowStatus(selectedContact).color,
                    getWindowStatus(selectedContact).bgColor
                  )}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Window: {getWindowStatus(selectedContact).text}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-[#aebac1] hover:bg-[#2a3942]"
                  onClick={() => setShowCallAlert(true)}
                >
                  <Phone className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-[#aebac1] hover:bg-[#2a3942]"
                  onClick={() => setShowCallAlert(true)}
                >
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-[#aebac1] hover:bg-[#2a3942]">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Call Alert */}
            {showCallAlert && (
              <Alert className="m-4 mb-0 border-[#2a3942] bg-[#202c33]">
                <Phone className="w-4 h-4 text-[#8696a0]" />
                <AlertDescription className="text-[#e9edef]">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>Voice & Video calls not available</strong>
                      <p className="text-sm text-[#8696a0] mt-1">
                        WhatsApp Business API only supports messaging. For calls, please use the customer's phone number directly: {selectedContact.phone}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setShowCallAlert(false)}
                      className="text-[#8696a0] hover:bg-[#2a3942]"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm",
                        message.direction === 'outbound'
                          ? "bg-[#005c4b]"
                          : "bg-[#202c33]"
                      )}
                    >
                      {message.templateUsed && (
                        <div className="flex items-center gap-1 mb-1 text-xs opacity-75 text-[#8696a0]">
                          <Zap className="w-3 h-3" />
                          Template: {message.templateUsed}
                        </div>
                      )}
                      {message.metadata?.automated && (
                        <div className="flex items-center gap-1 mb-1 text-xs opacity-75 text-[#00a884]">
                          <Bot className="w-3 h-3" />
                          Automated Response
                        </div>
                      )}
                      {message.metadata?.hasAttachment && message.metadata?.attachmentType === 'calendar' && (
                        <div className="flex items-center gap-2 mb-2 p-2 bg-[#005c4b] rounded-lg">
                          <CalendarDays className="w-5 h-5 text-[#e9edef]" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-[#e9edef]">Calendar Invite</p>
                            <p className="text-xs text-[#8696a0]">{message.metadata.attachmentName}</p>
                          </div>
                          <Download className="w-4 h-4 text-[#8696a0]" />
                        </div>
                      )}
                      <p className="text-sm text-[#e9edef] whitespace-pre-wrap">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-[#8696a0]">
                          {message.timestamp.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {message.direction === 'outbound' && (
                          <div className="flex items-center gap-1 ml-2">
                            {message.cost !== undefined && message.cost > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <DollarSign className="w-3 h-3" />
                                {message.cost.toFixed(2)}
                              </Badge>
                            )}
                            {message.status === 'sent' && <Check className="w-3 h-3 text-gray-400" />}
                            {message.status === 'delivered' && <CheckCheck className="w-3 h-3 text-gray-400" />}
                            {message.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                            {message.status === 'failed' && <AlertCircle className="w-3 h-3 text-red-500" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="bg-[#202c33] p-4 flex-shrink-0">
              {selectedContact.windowState === 'closed' && (
                <Alert className="mb-3 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                  <Info className="w-4 h-4" />
                  <AlertDescription className="text-xs">
                    24h window closed. Next message will use a paid template ($0.05 estimated).
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon" className="text-[#aebac1] hover:bg-[#2a3942]">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  placeholder={
                    selectedContact.windowState === 'open' 
                      ? "Type a message..." 
                      : "Template will be selected automatically..."
                  }
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  className="flex-1 bg-[#2a3942] border-0 text-white placeholder:text-[#8696a0] focus:ring-0"
                />
                <Button variant="ghost" size="icon" className="text-[#aebac1] hover:bg-[#2a3942]">
                  <Mic className="w-5 h-5" />
                </Button>
                <Button 
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || isProcessing}
                  className="bg-[#00a884] hover:bg-[#00957a] text-white"
                >
                  {isProcessing ? (
                    <Bot className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {isProcessing && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                  <Bot className="w-3 h-3 animate-pulse" />
                  Processing with Claude + MCP tools...
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#0b141a] h-full overflow-hidden">
            <div className="text-center max-w-md mx-auto p-6">
              {contacts.length === 0 ? (
                <>
                  <MessageCircle className="w-16 h-16 text-[#8696a0] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No WhatsApp Conversations Yet</h3>
                  <p className="text-[#8696a0] mb-6">
                    To receive messages, you need to configure your WhatsApp webhook.
                  </p>
                  
                  <Alert className="mb-4 bg-[#202c33] border-[#2a3942]">
                    <Info className="w-4 h-4 text-[#00a884]" />
                    <AlertDescription className="text-left">
                      <strong className="text-white">Quick Setup:</strong>
                      <ol className="mt-2 space-y-1 text-sm text-[#8696a0]">
                        <li>1. Go to Meta Business Manager → WhatsApp → Configuration</li>
                        <li>2. Set Webhook URL to: <code className="text-xs bg-[#0b141a] px-1 py-0.5 rounded break-all">{typeof window !== 'undefined' ? `${window.location.origin}/api/v1/whatsapp/webhook` : 'https://your-app.com/api/v1/whatsapp/webhook'}</code></li>
                        <li>3. Use Verify Token: <code className="text-xs bg-[#0b141a] px-1 py-0.5 rounded">hera-whatsapp-webhook-2024-secure-token</code></li>
                        <li>4. Subscribe to: messages, message_status</li>
                        <li>5. Send a test message to your WhatsApp number: <code className="text-xs bg-[#0b141a] px-1 py-0.5 rounded">+919945896033</code></li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/v1/whatsapp/webhook-status')
                          const status = await response.json()
                          console.log('Webhook Status:', status)
                          alert('Check console for webhook status details')
                        } catch (error) {
                          console.error('Failed to check webhook status:', error)
                        }
                      }}
                      variant="outline"
                      className="bg-[#202c33] border-[#2a3942] text-white hover:bg-[#2a3942]"
                    >
                      <Info className="w-4 h-4 mr-2" />
                      Check Webhook Status
                    </Button>
                    
                    <Button
                      onClick={() => window.open('https://business.facebook.com/latest/whatsapp_manager', '_blank')}
                      className="bg-[#00a884] hover:bg-[#00957a] text-white"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Open Meta Business
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <MessageCircle className="w-16 h-16 text-[#8696a0] mx-auto mb-4" />
                  <p className="text-[#8696a0]">Select a conversation to start messaging</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}