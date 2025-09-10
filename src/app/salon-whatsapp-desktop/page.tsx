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
  CalendarDays
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Placeholder components while we fix import issues
function SalonWhatsAppSidebar() {
  return (
    <div className="w-20 bg-gray-800 p-2">
      <div className="text-white text-xs">Sidebar temporarily disabled</div>
    </div>
  )
}

function BookingAutomationPanel({ organizationId, onScenarioSelect, onFlowStart }: any) {
  return (
    <div className="p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
      <p className="text-yellow-400 text-sm">
        BookingAutomationPanel temporarily disabled - fixing import issues
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

export default function SalonWhatsAppDesktop() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCallAlert, setShowCallAlert] = useState(false)
  const [costMetrics, setCostMetrics] = useState<CostMetrics>({
    dailySpend: 12.45,
    dailyBudget: 50.00,
    paidSendRate: 0.23,
    costPerAppointment: 0.85,
    windowUtilization: 0.78
  })
  const [selectedTab, setSelectedTab] = useState('chat')
  const [activeAutomations, setActiveAutomations] = useState<Record<string, string>>({
    '1': 'quick_booking', // Sarah has quick booking active
    '3': 'smart_rebooking' // Alex has smart rebooking active
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock data
  useEffect(() => {
    const mockContacts: Contact[] = [
      {
        id: '1',
        waContactId: 'wa_447700900123',
        name: 'Sarah Johnson',
        phone: '+447700900123',
        lastMessage: 'can i do color + blow dry tomorrow after 3 with sara?',
        lastMessageTime: new Date(Date.now() - 5 * 60 * 1000),
        unreadCount: 1,
        windowState: 'open',
        windowExpiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000),
        tags: ['VIP', 'Regular'],
        conversationCost: 0 // Free within window
      },
      {
        id: '2',
        waContactId: 'wa_447700900456',
        name: 'Emma Wilson',
        phone: '+447700900456',
        lastMessage: 'Appointment confirmed ✅',
        lastMessageTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        unreadCount: 0,
        windowState: 'closed',
        tags: ['New'],
        conversationCost: 0.05 // Last template cost
      },
      {
        id: '3',
        waContactId: 'wa_447700900789',
        name: 'Alex Morgan',
        phone: '+447700900789',
        lastMessage: 'Thanks!',
        lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
        unreadCount: 0,
        windowState: 'open',
        windowExpiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
        tags: ['Pending'],
        conversationCost: 0
      }
    ]
    setContacts(mockContacts)
    if (mockContacts.length > 0) {
      setSelectedContact(mockContacts[0])
    }
  }, [])

  // Load messages for selected contact
  useEffect(() => {
    if (selectedContact) {
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Hi, I\'d like to book an appointment',
          type: 'text',
          direction: 'inbound',
          timestamp: new Date(Date.now() - 30 * 60 * 1000)
        },
        {
          id: '2',
          content: 'Hello! I\'d be happy to help you book an appointment. What service are you looking for?',
          type: 'text',
          direction: 'outbound',
          timestamp: new Date(Date.now() - 29 * 60 * 1000),
          status: 'read',
          cost: 0 // Free within window
        },
        {
          id: '3',
          content: 'can i do color + blow dry tomorrow after 3 with sara?',
          type: 'text',
          direction: 'inbound',
          timestamp: new Date(Date.now() - 5 * 60 * 1000)
        }
      ]
      setMessages(mockMessages)
    }
  }, [selectedContact])

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
    <>
      {/* Sidebar */}
      <SalonWhatsAppSidebar />
      
      {/* Main Content with adjusted margin for sidebar */}
      <div className="ml-20 h-screen flex flex-col bg-[#111b21]">
        {/* Header */}
        <div className="bg-[#202c33] text-white p-4 border-b border-[#2a3942]">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            HERA WhatsApp Business
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
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

        <div className="flex-1 flex overflow-hidden">
          {/* Chat List Sidebar */}
          <div className="w-96 bg-[#111b21] border-r border-[#2a3942] flex flex-col">
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
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-4 w-full rounded-none bg-[#202c33] border-b border-[#2a3942]">
              <TabsTrigger value="chat" className="text-xs text-[#8696a0] data-[state=active]:text-[#00a884]">CHATS</TabsTrigger>
              <TabsTrigger value="automation" className="text-xs text-[#8696a0] data-[state=active]:text-[#00a884]">AUTOMATION</TabsTrigger>
              <TabsTrigger value="costs" className="text-xs text-[#8696a0] data-[state=active]:text-[#00a884]">COSTS</TabsTrigger>
              <TabsTrigger value="tools" className="text-xs text-[#8696a0] data-[state=active]:text-[#00a884]">TOOLS</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 m-0">
              <ScrollArea className="h-full">
                {filteredContacts.map(contact => {
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
                })}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="automation" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <BookingAutomationPanel 
                    organizationId={process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || ''}
                    onScenarioSelect={(scenario) => {
                      console.log('Selected scenario:', scenario)
                      // Could show scenario details or configuration
                    }}
                    onFlowStart={(flow) => {
                      console.log('Starting flow:', flow)
                      // Could start the conversation flow with selected contact
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

            <TabsContent value="costs" className="flex-1 m-0 p-4">
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
            </TabsContent>

            <TabsContent value="tools" className="flex-1 m-0 p-4">
              <div className="space-y-3">
                <div className="text-sm text-[#8696a0] mb-4">
                  MCP Tools Available:
                </div>
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area */}
        {selectedContact ? (
          <div className="flex-1 flex flex-col bg-[#0b141a]">
            {/* Chat Header */}
            <div className="bg-[#202c33] p-4 border-b border-[#2a3942] flex items-center justify-between">
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
            <ScrollArea className="flex-1 p-4">
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

            {/* Input Area */}
            <div className="bg-[#202c33] p-4">
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
          <div className="flex-1 flex items-center justify-center bg-[#0b141a]">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-[#8696a0] mx-auto mb-4" />
              <p className="text-[#8696a0]">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  )
}