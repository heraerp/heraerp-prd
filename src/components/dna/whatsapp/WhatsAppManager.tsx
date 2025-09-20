'use client'

/**
 * HERA DNA WhatsApp Manager Component
 * Universal WhatsApp messaging interface for any industry
 */

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  MessageCircle,
  Send,
  Phone,
  Search,
  Filter,
  Star,
  Clock,
  Users,
  Settings,
  Image,
  FileText,
  Video,
  MapPin,
  Plus,
  MoreVertical,
  CheckCheck,
  Check,
  AlertCircle,
  Zap,
  Bot
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { WhatsAppDNA, WHATSAPP_SMART_CODES } from '@/lib/dna/whatsapp/whatsapp-dna'

interface Conversation {
  id: string
  customerName: string
  customerPhone: string
  lastMessage: string
  lastMessageAt: Date
  unreadCount: number
  status: 'open' | 'closed' | 'archived'
  tags: string[]
  assignedTo?: string
}

interface Message {
  id: string
  conversationId: string
  content: string
  type: 'text' | 'image' | 'document' | 'template'
  direction: 'inbound' | 'outbound'
  timestamp: Date
  status: 'sent' | 'delivered' | 'read' | 'failed'
  metadata?: {
    templateName?: string
    mediaUrl?: string
    fileName?: string
  }
}

interface WhatsAppManagerProps {
  className?: string
  organizationId: string
  industryType?: 'salon' | 'healthcare' | 'retail' | 'restaurant' | 'generic'
}

export function WhatsAppManager({
  className,
  organizationId,
  industryType = 'generic'
}: WhatsAppManagerProps) {
  const { currentOrganization } = useMultiOrgAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize WhatsApp DNA
  const [whatsappDNA, setWhatsappDNA] = useState<WhatsAppDNA | null>(null)

  useEffect(() => {
    if (organizationId) {
      const dna = new WhatsAppDNA({
        organizationId,
        businessId: process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_ID || '',
        phoneNumberId: process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID || '',
        accessToken: process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN || '',
        webhookVerifyToken: process.env.NEXT_PUBLIC_WHATSAPP_WEBHOOK_VERIFY_TOKEN || ''
      })
      setWhatsappDNA(dna)
      loadConversations()
    }
  }, [organizationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    setLoading(true)
    try {
      // Mock conversations - in production, fetch from HERA universal API
      const mockConversations: Conversation[] = [
        {
          id: '1',
          customerName: 'Sarah Johnson',
          customerPhone: '+971501234567',
          lastMessage: 'Can I reschedule my appointment?',
          lastMessageAt: new Date(Date.now() - 30 * 60 * 1000),
          unreadCount: 2,
          status: 'open',
          tags: ['VIP', 'Regular'],
          assignedTo: 'Rocky'
        },
        {
          id: '2',
          customerName: 'Emma Davis',
          customerPhone: '+971507654321',
          lastMessage: 'Thank you for the amazing service!',
          lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          unreadCount: 0,
          status: 'open',
          tags: ['New Client']
        },
        {
          id: '3',
          customerName: 'Aisha Khan',
          customerPhone: '+971509876543',
          lastMessage: 'Appointment confirmed for tomorrow ✅',
          lastMessageAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          unreadCount: 0,
          status: 'closed',
          tags: ['Bridal']
        }
      ]
      setConversations(mockConversations)
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0])
        loadMessages(mockConversations[0].id)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      // Mock messages - in production, fetch from HERA universal API
      const mockMessages: Message[] = [
        {
          id: '1',
          conversationId,
          content: 'Hi! I would like to book an appointment for Brazilian Blowout',
          type: 'text',
          direction: 'inbound',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: 'read'
        },
        {
          id: '2',
          conversationId,
          content:
            'Of course! I can book you with Rocky for tomorrow at 2 PM. The service takes about 4 hours and costs AED 500. Would that work for you?',
          type: 'text',
          direction: 'outbound',
          timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
          status: 'read'
        },
        {
          id: '3',
          conversationId,
          content: 'Perfect! Please confirm my booking.',
          type: 'text',
          direction: 'inbound',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          status: 'read'
        },
        {
          id: '4',
          conversationId,
          content:
            'Your appointment for Brazilian Blowout on Dec 25, 2024 at 2:00 PM with Rocky has been confirmed. Total: AED 500. We look forward to seeing you!',
          type: 'template',
          direction: 'outbound',
          timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
          status: 'delivered',
          metadata: {
            templateName: 'booking_confirmation'
          }
        },
        {
          id: '5',
          conversationId,
          content: 'Can I reschedule my appointment?',
          type: 'text',
          direction: 'inbound',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          status: 'read'
        }
      ]
      setMessages(mockMessages)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !whatsappDNA) return

    setSending(true)
    try {
      const newMessage: Message = {
        id: Date.now().toString(),
        conversationId: selectedConversation.id,
        content: messageInput,
        type: 'text',
        direction: 'outbound',
        timestamp: new Date(),
        status: 'sent'
      }

      // Optimistically add message to UI
      setMessages(prev => [...prev, newMessage])
      setMessageInput('')

      // Send via WhatsApp DNA
      await whatsappDNA.sendMessage({
        from: whatsappDNA.whatsappConfig.phoneNumberId,
        to: selectedConversation.customerPhone,
        type: 'text',
        content: { text: messageInput }
      })

      // Update conversation last message
      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: messageInput, lastMessageAt: new Date() }
            : conv
        )
      )
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const sendTemplate = async (templateName: string, params: Record<string, string>) => {
    if (!selectedConversation || !whatsappDNA) return

    try {
      await whatsappDNA.sendTemplateMessage(
        selectedConversation.customerPhone,
        templateName,
        'en',
        params
      )

      const templateMessage: Message = {
        id: Date.now().toString(),
        conversationId: selectedConversation.id,
        content: `Template: ${templateName} sent`,
        type: 'template',
        direction: 'outbound',
        timestamp: new Date(),
        status: 'sent',
        metadata: { templateName }
      }

      setMessages(prev => [...prev, templateMessage])
    } catch (error) {
      console.error('Failed to send template:', error)
    }
  }

  const filteredConversations = conversations.filter(
    conv =>
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customerPhone.includes(searchQuery)
  )

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-muted-foreground" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />
      case 'document':
        return <FileText className="w-4 h-4" />
      case 'template':
        return <Zap className="w-4 h-4" />
      default:
        return <MessageCircle className="w-4 h-4" />
    }
  }

  const getIndustryTemplates = () => {
    switch (industryType) {
      case 'salon':
        return [
          {
            name: 'appointment_reminder',
            label: 'Appointment Reminder',
            params: ['customer_name', 'service', 'time', 'stylist']
          },
          {
            name: 'booking_confirmation',
            label: 'Booking Confirmation',
            params: ['service', 'date', 'time', 'stylist', 'price']
          },
          {
            name: 'service_followup',
            label: 'Service Follow-up',
            params: ['customer_name', 'service']
          }
        ]
      case 'healthcare':
        return [
          {
            name: 'appointment_reminder',
            label: 'Appointment Reminder',
            params: ['patient_name', 'doctor', 'time']
          },
          { name: 'test_results', label: 'Test Results Ready', params: ['patient_name'] },
          {
            name: 'medication_reminder',
            label: 'Medication Reminder',
            params: ['patient_name', 'medication']
          }
        ]
      default:
        return [
          { name: 'welcome_message', label: 'Welcome Message', params: ['business_name'] },
          { name: 'business_hours', label: 'Business Hours', params: [] }
        ]
    }
  }

  return (
    <div
      className={cn(
        'h-full flex flex-col lg:flex-row bg-background dark:bg-background rounded-lg border overflow-hidden',
        className
      )}
    >
      {/* Conversations Sidebar */}
      <div className="w-full lg:w-1/3 border-r border-border dark:border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border dark:border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              WhatsApp
            </h2>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.map(conversation => (
              <div
                key={conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation)
                  loadMessages(conversation.id)
                }}
                className={cn(
                  'p-3 rounded-lg cursor-pointer transition-colors mb-2',
                  selectedConversation?.id === conversation.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-muted dark:hover:bg-muted'
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-green-500 text-foreground">
                      {conversation.customerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{conversation.customerName}</p>
                      <span className="text-xs text-muted-foreground">
                        {conversation.lastMessageAt.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-1">
                        {conversation.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-green-500 text-foreground">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border dark:border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-green-500 text-foreground">
                    {selectedConversation.customerName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedConversation.customerName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.customerPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-xs lg:max-w-md px-4 py-2 rounded-2xl',
                        message.direction === 'outbound'
                          ? 'bg-blue-500 text-foreground'
                          : 'bg-muted dark:bg-muted'
                      )}
                    >
                      {message.type === 'template' && (
                        <div className="flex items-center gap-1 mb-1 text-xs opacity-75">
                          <Zap className="w-3 h-3" />
                          Template: {(message.metadata as any)?.templateName}
                        </div>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-xs opacity-75">
                          {message.timestamp.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                        {message.direction === 'outbound' && getStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border dark:border-border">
              <Tabs defaultValue="message" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="message" className="text-xs">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Message
                  </TabsTrigger>
                  <TabsTrigger value="templates" className="text-xs">
                    <Zap className="w-4 h-4 mr-1" />
                    Templates
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="message">
                  <div className="flex items-end gap-2">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Textarea
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      className="min-h-[40px] max-h-[120px]"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || sending}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="templates">
                  <div className="space-y-2">
                    {getIndustryTemplates().map(template => (
                      <Button
                        key={template.name}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          // In production, show parameter form
                          const params: Record<string, string> = {}
                          template.params.forEach((param, idx) => {
                            params[`${idx + 1}`] = `Sample ${param}`
                          })
                          sendTemplate(template.name, params)
                        }}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {template.label}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
