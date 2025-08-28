# WhatsApp HERA Canonical Architecture - Complete Bundle

## 🎯 Overview

This bundle contains the complete WhatsApp integration following HERA's canonical 6-table architecture with all fixes and working implementation.

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Implementation Files](#implementation-files)
3. [API Endpoints](#api-endpoints)
4. [Display Components](#display-components)
5. [Test Scripts](#test-scripts)
6. [Setup Guide](#setup-guide)
7. [Testing Instructions](#testing-instructions)

## 🏗️ Architecture Overview

### HERA 6-Table Mapping
```
1. core_organizations       → Multi-tenant business isolation
2. core_entities           → Conversations, Customers, Channels
3. core_dynamic_data       → Custom fields (phone numbers, etc.)
4. core_relationships      → Links between entities
5. universal_transactions  → WhatsApp messages
6. universal_transaction_lines → Message content parts (future)
```

### Key Design Decisions
- **Conversations**: Stored as entities with `entity_type = 'whatsapp_conversation'`
- **Messages**: Stored as transactions with `transaction_type = 'whatsapp_message'`
- **Direction**: Determined by `source_entity_id` (inbound) or `target_entity_id` (outbound)
- **Metadata**: Message text and details stored in transaction metadata field
- **Timestamps**: Using `transaction_date` as the primary timestamp

## 📁 Implementation Files

### 1. WhatsApp Processor V2
```typescript
// File: /src/lib/whatsapp/processor-v2.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import axios from 'axios'

interface WhatsAppConfig {
  organizationId: string
  supabase: SupabaseClient
}

interface WhatsAppMessage {
  from: string
  text: string
  message_id: string
  type: 'text' | 'interactive' | 'image' | 'document'
  interactive?: any
  timestamp: string
  media?: {
    id: string
    mime_type: string
    sha256?: string
    caption?: string
  }
}

interface ProcessingResult {
  success: boolean
  transactionId?: string
  error?: string
}

export class WhatsAppProcessorV2 {
  private supabase: SupabaseClient
  private organizationId: string
  private channelId?: string // WABA Channel entity ID
  private whatsapp: {
    phoneNumberId: string
    accessToken: string
    apiUrl: string
  }
  
  constructor(config: WhatsAppConfig) {
    this.supabase = config.supabase
    this.organizationId = config.organizationId
    
    this.whatsapp = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      apiUrl: 'https://graph.facebook.com/v18.0'
    }
  }
  
  async initialize() {
    // Ensure Channel entity exists for WABA number
    this.channelId = await this.ensureChannelEntity()
  }
  
  async processMessage(message: WhatsAppMessage): Promise<ProcessingResult> {
    try {
      console.log(`Processing WhatsApp message from ${message.from}: ${message.text}`)
      
      // 1. Ensure Customer entity exists
      const customerId = await this.ensureCustomerEntity(message.from)
      
      // 2. Get or create Conversation entity
      const conversationId = await this.ensureConversationEntity(message.from, customerId)
      
      // 3. Create message transaction with proper smart codes
      const transactionId = await this.createMessageTransaction(
        message,
        customerId,
        conversationId,
        'inbound'
      )
      
      // 4. Process intent and generate response
      const responseText = await this.generateResponse(message, customerId, conversationId)
      
      // 5. Send and store response
      if (responseText) {
        await this.sendAndStoreResponse(message.from, responseText, conversationId, customerId)
      }
      
      return { success: true, transactionId }
      
    } catch (error) {
      console.error('WhatsApp processing error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  private async ensureChannelEntity(): Promise<string> {
    const channelCode = `WABA-${this.whatsapp.phoneNumberId}`
    
    // Check if channel already exists
    const { data: existing } = await this.supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'channel')
      .eq('entity_code', channelCode)
      .single()
    
    if (existing) {
      return existing.id
    }
    
    // Create new channel entity
    const { data: channel, error } = await this.supabase
      .from('core_entities')
      .insert({
        organization_id: this.organizationId,
        entity_type: 'channel',
        entity_name: `WhatsApp Business ${this.whatsapp.phoneNumberId}`,
        entity_code: channelCode,
        smart_code: 'HERA.BEAUTY.COMMS.CHANNEL.WHATSAPP.V1',
        metadata: {
          phone_number_id: this.whatsapp.phoneNumberId,
          channel_type: 'whatsapp_business'
        }
      })
      .select()
      .single()
    
    if (error) throw error
    return channel!.id
  }
  
  private async ensureCustomerEntity(waId: string): Promise<string> {
    // Check if customer entity exists for this WhatsApp ID
    const { data: existing } = await this.supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'customer')
      .eq('entity_code', `WA-${waId}`)
      .single()
    
    if (existing) {
      return existing.id
    }
    
    // Create new customer entity
    const { data: customer, error } = await this.supabase
      .from('core_entities')
      .insert({
        organization_id: this.organizationId,
        entity_type: 'customer',
        entity_name: `WhatsApp User ${waId}`,
        entity_code: `WA-${waId}`,
        smart_code: 'HERA.BEAUTY.CRM.CUSTOMER.PERSON.V1',
        metadata: {
          wa_id: waId,
          phone: waId,
          source: 'whatsapp'
        }
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Store phone number in dynamic data for searchability
    await this.supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: this.organizationId,
        entity_id: customer!.id,
        field_name: 'phone',
        field_value_text: waId,
        smart_code: 'HERA.BEAUTY.CRM.CUSTOMER.DYN.PHONE.V1'
      })
    
    return customer!.id
  }
  
  private async ensureConversationEntity(waId: string, customerId: string): Promise<string> {
    const conversationCode = `CONV-${waId}-${new Date().toISOString().split('T')[0]}`
    
    // Look for active conversation (within 24 hours)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
    
    const { data: existing } = await this.supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'whatsapp_conversation')
      .eq('metadata->wa_id', waId)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .single()
    
    if (existing) {
      return existing.id
    }
    
    // Create new conversation entity
    const { data: conversation, error } = await this.supabase
      .from('core_entities')
      .insert({
        organization_id: this.organizationId,
        entity_type: 'whatsapp_conversation',
        entity_name: `WhatsApp Chat with ${waId}`,
        entity_code: conversationCode,
        smart_code: 'HERA.BEAUTY.COMMS.CONVERSATION.WHATSAPP.V1',
        metadata: {
          wa_id: waId,
          phone: waId,
          customer_id: customerId,
          channel_id: this.channelId,
          status: 'active',
          started_at: new Date().toISOString()
        }
      })
      .select()
      .single()
    
    if (error) throw error
    return conversation!.id
  }
  
  private async createMessageTransaction(
    message: WhatsAppMessage,
    customerId: string,
    conversationId: string,
    direction: 'inbound' | 'outbound'
  ): Promise<string> {
    const smartCode = direction === 'inbound' 
      ? 'HERA.WHATSAPP.MSG.INBOUND.v1'
      : 'HERA.WHATSAPP.MSG.OUTBOUND.v1'
    
    const { data: transaction, error } = await this.supabase
      .from('universal_transactions')
      .insert({
        organization_id: this.organizationId,
        transaction_type: 'whatsapp_message',
        transaction_code: `MSG-${Date.now()}`,
        transaction_date: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        total_amount: 0,
        external_reference: message.message_id,
        smart_code: smartCode,
        source_entity_id: direction === 'inbound' ? conversationId : null,
        target_entity_id: direction === 'outbound' ? conversationId : null,
        metadata: {
          message_id: message.message_id,
          text: message.text,
          direction: direction,
          message_type: message.type,
          wa_id: message.from,
          timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString()
        }
      })
      .select()
      .single()
    
    if (error) throw error
    return transaction!.id
  }
  
  private async generateResponse(
    message: WhatsAppMessage,
    customerId: string,
    conversationId: string
  ): Promise<string | null> {
    const lowerText = message.text.toLowerCase()
    
    // Simple intent detection for demo
    if (lowerText.includes('book') || lowerText.includes('appointment')) {
      return "I'd be happy to help you book an appointment! What service are you interested in? We offer haircuts, coloring, styling, and more."
    }
    
    if (lowerText.includes('price') || lowerText.includes('cost')) {
      return "Our services start at AED 50 for a basic haircut. Would you like to see our full price list?"
    }
    
    if (lowerText.includes('hours') || lowerText.includes('open')) {
      return "We're open Monday-Saturday from 9 AM to 7 PM, and Sunday from 10 AM to 6 PM."
    }
    
    // Default response
    return "Thank you for your message! How can I help you today? You can ask about our services, prices, or book an appointment."
  }
  
  private async sendAndStoreResponse(
    toNumber: string,
    text: string,
    conversationId: string,
    customerId: string
  ) {
    try {
      // Send via WhatsApp API
      const response = await axios.post(
        `${this.whatsapp.apiUrl}/${this.whatsapp.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: toNumber,
          type: 'text',
          text: { body: text }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.whatsapp.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      // Store outbound message
      const outboundMessage: WhatsAppMessage = {
        from: this.whatsapp.phoneNumberId,
        text: text,
        message_id: response.data.messages[0].id,
        type: 'text',
        timestamp: Math.floor(Date.now() / 1000).toString()
      }
      
      await this.createMessageTransaction(
        outboundMessage,
        customerId,
        conversationId,
        'outbound'
      )
      
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error)
    }
  }
}
```

### 2. Webhook Handler V2
```typescript
// File: /src/app/api/v1/whatsapp/webhook-v2/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WhatsAppProcessorV2 } from '@/lib/whatsapp/processor-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Webhook verification for WhatsApp
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_TOKEN) {
    console.log('WhatsApp webhook verified successfully')
    return new Response(challenge, { status: 200 })
  }
  
  return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 })
}

// Handle incoming WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2))
    
    // Extract message data from webhook
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages
    const statuses = value?.statuses
    
    // Get organization ID
    const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c'
    
    if (!organizationId) {
      console.error('No organization ID configured')
      return NextResponse.json({ status: 'error', message: 'Organization not configured' })
    }
    
    // Initialize processor
    const processor = new WhatsAppProcessorV2({
      organizationId,
      supabase
    })
    
    await processor.initialize()
    
    // Process messages
    if (messages && messages.length > 0) {
      for (const message of messages) {
        const messageData = {
          from: message.from,
          text: message.text?.body || '',
          message_id: message.id,
          type: message.type,
          timestamp: message.timestamp,
          interactive: message.interactive,
          media: message.image || message.document || message.audio || message.video
        }
        
        const result = await processor.processMessage(messageData)
        
        if (!result.success) {
          console.error('Message processing failed:', result.error)
        } else {
          console.log('Message processed successfully:', result.transactionId)
        }
      }
    }
    
    // Process status updates (delivery receipts)
    if (statuses && statuses.length > 0) {
      for (const status of statuses) {
        // TODO: Implement status updates as separate transactions
        console.log('Status update:', status)
      }
    }
    
    // Always return 200 OK to WhatsApp
    return NextResponse.json({ status: 'ok' })
    
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    // Still return 200 to prevent WhatsApp retries
    return NextResponse.json({ status: 'ok' })
  }
}
```

### 3. Messages API (Simple Version)
```typescript
// File: /src/app/api/v1/whatsapp/messages-simple/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c'
  
  try {
    // Get all WhatsApp conversations
    const { data: conversations, error: convError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'whatsapp_conversation')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    
    if (convError) throw convError
    
    // Get all WhatsApp messages
    const { data: messages, error: msgError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (msgError) throw msgError
    
    // Format messages for display
    const formattedMessages = messages?.map(msg => {
      const direction = msg.source_entity_id ? 'inbound' : 'outbound'
      const conversationId = msg.source_entity_id || msg.target_entity_id
      const conversation = conversations?.find(c => c.id === conversationId)
      
      return {
        id: msg.id,
        text: msg.metadata?.text || '',
        direction,
        wa_id: msg.metadata?.wa_id || conversation?.metadata?.phone || '',
        phone: conversation?.metadata?.phone || '',
        customerName: conversation?.entity_name || 'Unknown Customer',
        conversationId,
        conversationName: conversation?.entity_name || 'Unknown',
        waba_message_id: msg.metadata?.message_id || msg.external_reference || '',
        created_at: msg.created_at,
        occurred_at: msg.transaction_date || msg.created_at, // Use transaction_date as occurred_at
        smart_code: msg.smart_code,
        metadata: msg.metadata
      }
    }) || []
    
    // Group by conversation
    const conversationsWithMessages = conversations?.map(conv => {
      const convMessages = formattedMessages.filter(msg => 
        msg.conversationId === conv.id
      )
      
      return {
        conversation: {
          id: conv.id,
          entity_code: conv.entity_code,
          entity_name: conv.entity_name,
          metadata: conv.metadata,
          created_at: conv.created_at
        },
        messages: convMessages,
        messageCount: convMessages.length,
        lastMessage: convMessages[0] || null
      }
    }) || []
    
    return NextResponse.json({
      status: 'success',
      data: {
        totalConversations: conversations?.length || 0,
        totalMessages: formattedMessages.length,
        conversationsWithMessages,
        allMessages: formattedMessages
      }
    })
    
  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

### 4. Display Component (Canonical)
```tsx
// File: /src/app/salon/whatsapp-canonical/page.tsx
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
                  <li>• Smart codes for message types</li>
                  <li>• Metadata for message content</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="text-xs">
                <strong>Smart Codes:</strong> HERA.WHATSAPP.MSG.{'{INBOUND|OUTBOUND}'}.v1
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

## 🧪 Test Scripts

### 1. Simple Message Test
```javascript
// File: test-whatsapp-simple.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleMessage() {
  console.log('🚀 Testing WhatsApp Message Storage (Simplified)\n');
  
  try {
    // Create a simple WhatsApp message following the current working pattern
    const messageId = `wamid.TEST_${Date.now()}`;
    const messageText = "Hello! Testing the WhatsApp canonical API.";
    const waId = '971501234567';
    
    // 1. Create/find conversation entity
    const { data: conversation, error: convError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'whatsapp_conversation',
        entity_name: `Chat with ${waId}`,
        entity_code: `CONV-${waId}`,
        smart_code: 'HERA.BEAUTY.COMMS.CONVERSATION.WHATSAPP.V1',
        metadata: {
          phone: waId,
          channel: 'whatsapp',
          started_at: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (convError) throw convError;
    console.log('✅ Created Conversation:', conversation.entity_name);
    
    // 2. Create message transaction
    const { data: transaction, error: txnError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'whatsapp_message',
        transaction_code: `MSG-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        source_entity_id: conversation.id, // Inbound message
        smart_code: 'HERA.WHATSAPP.MSG.INBOUND.v1',
        metadata: {
          message_id: messageId,
          text: messageText,
          direction: 'inbound',
          wa_id: waId,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (txnError) throw txnError;
    console.log('✅ Created Message Transaction:', transaction.transaction_code);
    console.log('  - Message ID:', messageId);
    console.log('  - Text:', messageText);
    
    // 3. Test the retrieval API
    console.log('\n📥 Testing retrieval...');
    
    // Get conversations
    const { data: conversations } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'whatsapp_conversation')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log(`Found ${conversations?.length || 0} conversations`);
    
    // Get messages
    const { data: messages } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'whatsapp_message')
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log(`Found ${messages?.length || 0} messages`);
    
    if (messages && messages.length > 0) {
      console.log('\nLatest messages:');
      messages.slice(0, 3).forEach(msg => {
        const direction = msg.source_entity_id ? 'inbound' : 'outbound';
        console.log(`  - ${msg.metadata?.text || 'No text'} [${direction}]`);
      });
    }
    
    console.log('\n✅ Test complete!');
    console.log('View messages at: http://localhost:3000/salon/whatsapp-canonical');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSimpleMessage();
```

### 2. Outbound Message Test
```javascript
// File: test-whatsapp-outbound.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOutboundMessage() {
  console.log('🚀 Creating outbound WhatsApp message...\n');
  
  try {
    // Find an existing conversation
    const { data: conversations } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'whatsapp_conversation')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!conversations || conversations.length === 0) {
      console.error('No conversations found. Run test-whatsapp-simple.js first.');
      return;
    }
    
    const conversation = conversations[0];
    console.log('Using conversation:', conversation.entity_name);
    
    // Create outbound message
    const messageId = `wamid.OUTBOUND_${Date.now()}`;
    const messageText = "Thank you for your message! Our team will get back to you soon about your appointment request.";
    
    const { data: transaction, error: txnError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'whatsapp_message',
        transaction_code: `MSG-OUT-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        target_entity_id: conversation.id, // Outbound message
        smart_code: 'HERA.WHATSAPP.MSG.OUTBOUND.v1',
        metadata: {
          message_id: messageId,
          text: messageText,
          direction: 'outbound',
          wa_id: conversation.metadata.phone,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (txnError) throw txnError;
    console.log('✅ Created Outbound Message:', transaction.transaction_code);
    console.log('  - Text:', messageText);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOutboundMessage();
```

### 3. API Test
```javascript
// File: test-api-direct.js
const axios = require('axios');

async function testAPI() {
  try {
    console.log('📡 Testing WhatsApp Messages API...\n');
    
    // Test the simple API
    console.log('Testing /api/v1/whatsapp/messages-simple...');
    const response = await axios.get('http://localhost:3000/api/v1/whatsapp/messages-simple');
    
    if (response.data.status === 'success') {
      const { data } = response.data;
      console.log('✅ API Response:');
      console.log(`- Total Conversations: ${data.totalConversations}`);
      console.log(`- Total Messages: ${data.totalMessages}`);
      
      if (data.allMessages.length > 0) {
        console.log('\n📱 Recent Messages:');
        data.allMessages.slice(0, 5).forEach((msg, i) => {
          console.log(`\n${i + 1}. ${msg.direction.toUpperCase()} - ${msg.phone}`);
          console.log(`   Text: ${msg.text}`);
          console.log(`   Time: ${new Date(msg.created_at).toLocaleString()}`);
        });
      }
      
      if (data.conversationsWithMessages.length > 0) {
        console.log('\n💬 Conversations:');
        data.conversationsWithMessages.forEach(conv => {
          console.log(`- ${conv.conversation.entity_name}: ${conv.messageCount} messages`);
        });
      }
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Error: Dev server is not running!');
      console.error('Please start with: npm run dev');
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
}

testAPI();
```

### 4. Date Validation Test
```javascript
// File: test-whatsapp-dates.js
const axios = require('axios');

async function testDates() {
  try {
    console.log('🕐 Testing WhatsApp Message Dates...\n');
    
    // Test the API
    const response = await axios.get('http://localhost:3000/api/v1/whatsapp/messages-simple');
    
    if (response.data.status === 'success') {
      const { allMessages } = response.data.data;
      
      if (allMessages.length > 0) {
        console.log('📱 Messages with proper dates:');
        allMessages.forEach((msg, i) => {
          console.log(`\n${i + 1}. ${msg.direction.toUpperCase()}`);
          console.log(`   Text: ${msg.text}`);
          console.log(`   Phone: ${msg.phone}`);
          console.log(`   Customer: ${msg.customerName}`);
          console.log(`   WhatsApp ID: ${msg.waba_message_id}`);
          console.log(`   Created At: ${msg.created_at}`);
          console.log(`   Occurred At: ${msg.occurred_at}`);
          
          // Check if dates are valid
          const date = new Date(msg.occurred_at);
          if (isNaN(date.getTime())) {
            console.log('   ❌ INVALID DATE!');
          } else {
            console.log(`   ✅ Valid Date: ${date.toLocaleString()}`);
          }
        });
      } else {
        console.log('No messages found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDates();
```

### 5. Database Check
```javascript
// File: test-whatsapp-direct.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCanonicalStructure() {
  console.log('🧪 Testing WhatsApp Canonical HERA Architecture\n');
  console.log('Organization ID:', organizationId);
  console.log('-------------------------------------------\n');
  
  try {
    // 1. Check for conversations
    console.log('1️⃣ Checking Conversation Entities...');
    const { data: conversations, error: convError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'whatsapp_conversation')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (convError) throw convError;
    
    console.log(`✅ Found ${conversations?.length || 0} WhatsApp conversations`);
    if (conversations && conversations.length > 0) {
      console.log('Latest conversation:', {
        name: conversations[0].entity_name,
        code: conversations[0].entity_code,
        created: new Date(conversations[0].created_at).toLocaleString()
      });
    }
    
    // 2. Check for messages
    console.log('\n2️⃣ Checking Message Transactions...');
    const { data: messages, error: msgError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'whatsapp_message')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (msgError) throw msgError;
    
    console.log(`✅ Found ${messages?.length || 0} WhatsApp messages`);
    
    const inbound = messages?.filter(m => m.source_entity_id).length || 0;
    const outbound = messages?.filter(m => m.target_entity_id).length || 0;
    
    console.log(`  - Inbound messages: ${inbound}`);
    console.log(`  - Outbound messages: ${outbound}`);
    
    if (messages && messages.length > 0) {
      console.log('\nLatest message:', {
        code: messages[0].transaction_code,
        smart_code: messages[0].smart_code,
        text: messages[0].metadata?.text?.substring(0, 50) + '...',
        created: new Date(messages[0].created_at).toLocaleString()
      });
    }
    
    console.log('\n✅ Canonical Architecture Test Complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test and show viewer info
testCanonicalStructure().then(() => {
  console.log('\n🌐 View WhatsApp messages at:');
  console.log('- Canonical viewer: http://localhost:3000/salon/whatsapp-canonical');
  console.log('- API endpoint: http://localhost:3000/api/v1/whatsapp/messages-simple');
});
```

## 🚀 Setup Guide

### 1. Environment Variables
```bash
# Required in .env file
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEFAULT_ORGANIZATION_ID=your-org-id
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_WEBHOOK_TOKEN=your-webhook-verify-token
```

### 2. Installation
```bash
# Clone the repository
git clone [repository-url]
cd heraerp-prd

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Webhook Configuration
Configure your WhatsApp Business API webhook URL:
```
https://your-domain.com/api/v1/whatsapp/webhook-v2
```

## 🧪 Testing Instructions

### 1. Create Test Data
```bash
# Create a test conversation and inbound message
node test-whatsapp-simple.js

# Create an outbound message
node test-whatsapp-outbound.js

# Check database structure
node test-whatsapp-direct.js

# Validate dates are displaying correctly
node test-whatsapp-dates.js
```

### 2. Test API
```bash
# Test the API directly
node test-api-direct.js

# Or use curl
curl http://localhost:3000/api/v1/whatsapp/messages-simple | jq '.'
```

### 3. View Messages
Open your browser to:
```
http://localhost:3000/salon/whatsapp-canonical
```

## 📊 Architecture Validation

### ✅ HERA Compliance
- **No custom tables** - Uses only the 6 universal tables
- **Multi-tenant ready** - Organization ID isolation enforced
- **Smart codes** - Proper business intelligence tagging
- **Infinite extensibility** - Can add fields via metadata
- **Perfect audit trail** - All messages timestamped and tracked

### 📈 Benefits
1. **Zero schema changes** - New features require no migrations
2. **Universal patterns** - Same structure works for SMS, Email, Slack
3. **Production ready** - Handles real WhatsApp webhook data
4. **Scalable** - Efficient querying with proper indexes
5. **Maintainable** - Clear separation of concerns

## 🔧 Troubleshooting

### Invalid Date Issues
- Fixed by ensuring API returns `occurred_at` field
- Maps `transaction_date` to `occurred_at` for display

### Missing Messages
- Check organization ID matches in environment
- Ensure conversations exist before creating messages
- Verify transaction_type = 'whatsapp_message'

### API Errors
- Verify Supabase credentials are correct
- Check RLS policies allow access
- Ensure all required fields are provided

---

This complete bundle provides a working WhatsApp integration following HERA's canonical 6-table architecture. All components have been tested and validated to work together seamlessly.