# MCP WhatsApp Integration Guide

## Overview
This guide explains how to integrate MCP (Model Context Protocol) tools with the WhatsApp desktop application at http://localhost:3002/salon-whatsapp-desktop

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│            WhatsApp Desktop UI                       │
│         (localhost:3002/salon-whatsapp-desktop)      │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────┐
│              MCP Server Integration                  │
│                                                      │
│  ┌─────────────────┐  ┌──────────────────────────┐ │
│  │   MCP Server     │  │    WhatsApp Business     │ │
│  │  (Port 3003)     │  │        API               │ │
│  │                  │  │                          │ │
│  │  Tools:          │  │  - Send Messages         │ │
│  │  - Calendar      │  │  - Receive Webhooks      │ │
│  │  - WhatsApp      │  │  - Manage Templates      │ │
│  │  - HERA DB       │  │                          │ │
│  └─────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Set Up Environment Variables

Create or update `.env.local`:

```bash
# WhatsApp Business API
WHATSAPP_BUSINESS_ID=your_business_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Claude AI (for intelligent routing)
CLAUDE_API_KEY=your_claude_api_key

# MCP Server
MCP_SERVER_PORT=3003
MCP_SERVER_URL=http://localhost:3003

# HERA Configuration
DEFAULT_ORGANIZATION_ID=your_org_uuid
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Start MCP Server

```bash
cd mcp-server
npm install
npm start

# The MCP server will start on port 3003
# You should see: "MCP Server running on http://localhost:3003"
```

### 3. Create API Routes for MCP Integration

Create `/src/app/api/v1/mcp/tools/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { MCPTools } from '@/lib/mcp/whatsapp-mcp-tools'

export async function POST(request: NextRequest) {
  try {
    const { tool, input } = await request.json()
    const organizationId = request.headers.get('x-organization-id') || process.env.DEFAULT_ORGANIZATION_ID!
    
    const mcp = new MCPTools(organizationId)
    
    // Route to appropriate tool
    let result
    switch (tool) {
      case 'calendar.find_slots':
        result = await mcp.findSlots(input)
        break
      case 'calendar.book':
        result = await mcp.bookSlot(input)
        break
      case 'wa.send':
        result = await mcp.waSend(input)
        break
      case 'wa.window_state':
        result = await mcp.waWindowState(input)
        break
      case 'hera.txn.write':
        result = await mcp.heraTxnWrite(input)
        break
      case 'hera.entity.upsert':
        result = await mcp.heraEntityUpsert(input)
        break
      case 'consent.get':
        result = await mcp.consentGet(input)
        break
      case 'budget.check':
        result = await mcp.budgetCheck(input)
        break
      case 'pricing.estimate':
        result = await mcp.pricingEstimate(input)
        break
      default:
        throw new Error(`Unknown tool: ${tool}`)
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('MCP tool error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

### 4. Create WhatsApp Webhook Handler

Create `/src/app/api/v1/whatsapp/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppMessageRouter } from '@/lib/whatsapp/message-router'

// Webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified')
    return new NextResponse(challenge, { status: 200 })
  }
  
  return new NextResponse('Forbidden', { status: 403 })
}

// Message handling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract message from WhatsApp webhook format
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'ok' })
    }
    
    const message = messages[0]
    const from = message.from // WhatsApp ID
    const text = message.text?.body
    
    // Get organization ID (you might want to map phone numbers to organizations)
    const organizationId = process.env.DEFAULT_ORGANIZATION_ID!
    
    // Initialize message router
    const router = new WhatsAppMessageRouter(
      organizationId,
      process.env.CLAUDE_API_KEY!
    )
    
    // Route the message
    const result = await router.routeMessage({
      organizationId,
      waContactId: from,
      text: text || '',
      // Add any additional context here
    })
    
    return NextResponse.json({ 
      status: 'ok',
      processed: result.success,
      messagesSent: result.messagesSent
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
```

### 5. Update Frontend to Use Real Data

Update `/src/app/salon-whatsapp-desktop/page.tsx` to fetch real data:

```typescript
// Add API client functions
const mcpApi = {
  async callTool(tool: string, input: any) {
    const response = await fetch('/api/v1/mcp/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': organizationId // Add your org ID
      },
      body: JSON.stringify({ tool, input })
    })
    return response.json()
  }
}

// Update sendMessage function to use real API
const sendMessage = async () => {
  if (!messageInput.trim() || !selectedContact || isProcessing) return
  
  setIsProcessing(true)
  
  try {
    // Check window state
    const windowState = await mcpApi.callTool('wa.window_state', {
      organization_id: organizationId,
      wa_contact_id: selectedContact.waContactId
    })
    
    // Send message
    const sendResult = await mcpApi.callTool('wa.send', {
      organization_id: organizationId,
      to: selectedContact.waContactId,
      kind: windowState.data?.state === 'open' ? 'freeform' : 'template',
      body: messageInput,
      template_id: windowState.data?.state === 'closed' ? 'GENERAL_RESPONSE_v1' : undefined
    })
    
    if (sendResult.success) {
      // Add message to UI
      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageInput,
        type: 'text',
        direction: 'outbound',
        timestamp: new Date(),
        status: 'sent',
        cost: sendResult.data?.cost_estimate || 0
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
    }
  } catch (error) {
    console.error('Failed to send message:', error)
  } finally {
    setIsProcessing(false)
  }
}
```

### 6. Set Up Real-Time Updates

Add WebSocket connection for real-time messages:

```typescript
useEffect(() => {
  // Connect to WebSocket for real-time updates
  const ws = new WebSocket('ws://localhost:3003/ws')
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    if (data.type === 'new_message') {
      // Add incoming message to the conversation
      const newMessage: Message = {
        id: data.id,
        content: data.content,
        type: 'text',
        direction: 'inbound',
        timestamp: new Date(data.timestamp)
      }
      
      setMessages(prev => [...prev, newMessage])
      
      // Update unread count
      setContacts(prev => prev.map(contact => 
        contact.waContactId === data.from
          ? { ...contact, unreadCount: contact.unreadCount + 1, lastMessage: data.content }
          : contact
      ))
    }
  }
  
  return () => ws.close()
}, [])
```

## 🔧 MCP Server Setup (mcp-server directory)

### 1. Create MCP Server

Create `/mcp-server/server.js`:

```javascript
const express = require('express')
const cors = require('cors')
const WebSocket = require('ws')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const port = process.env.MCP_SERVER_PORT || 3003

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

app.use(cors())
app.use(express.json())

// MCP tool endpoints
app.post('/tools/:toolName', async (req, res) => {
  const { toolName } = req.params
  const input = req.body
  
  try {
    // Route to appropriate tool handler
    const result = await handleTool(toolName, input)
    res.json(result)
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 3004 })

wss.on('connection', (ws) => {
  console.log('New WebSocket connection')
  
  ws.on('message', (message) => {
    console.log('Received:', message.toString())
  })
})

// Start server
app.listen(port, () => {
  console.log(`MCP Server running on http://localhost:${port}`)
})
```

### 2. Create Tool Handlers

Create `/mcp-server/tools/calendar.js`:

```javascript
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function findSlots(input) {
  const { organization_id, service_id, duration, date_range } = input
  
  // Query available slots from database
  const { data: appointments } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organization_id)
    .eq('transaction_type', 'appointment')
    .gte('transaction_date', date_range.start)
    .lte('transaction_date', date_range.end)
  
  // Calculate available slots (simplified logic)
  const slots = []
  const startDate = new Date(date_range.start)
  const endDate = new Date(date_range.end)
  
  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    for (let hour = 9; hour < 18; hour++) {
      const slotStart = new Date(d)
      slotStart.setHours(hour, 0, 0, 0)
      
      // Check if slot is available
      const isBooked = appointments?.some(apt => {
        const aptDate = new Date(apt.transaction_date)
        return aptDate.getTime() === slotStart.getTime()
      })
      
      if (!isBooked) {
        slots.push({
          start: slotStart.toISOString(),
          end: new Date(slotStart.getTime() + duration * 60000).toISOString(),
          available: true
        })
      }
    }
  }
  
  return { success: true, data: { slots } }
}

module.exports = { findSlots }
```

## 🎯 Testing the Integration

### 1. Test MCP Tools

```bash
# Test calendar.find_slots
curl -X POST http://localhost:3002/api/v1/mcp/tools \
  -H "Content-Type: application/json" \
  -H "x-organization-id: your-org-id" \
  -d '{
    "tool": "calendar.find_slots",
    "input": {
      "organization_id": "your-org-id",
      "duration": 60,
      "date_range": {
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-01-07T00:00:00Z"
      }
    }
  }'

# Test wa.send
curl -X POST http://localhost:3002/api/v1/mcp/tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "wa.send",
    "input": {
      "organization_id": "your-org-id",
      "to": "1234567890",
      "kind": "freeform",
      "body": "Hello from MCP!"
    }
  }'
```

### 2. Configure WhatsApp Webhook

In Facebook Developer Console:
1. Go to WhatsApp > Configuration
2. Set Webhook URL: `https://your-domain.com/api/v1/whatsapp/webhook`
3. Set Verify Token: `your_verify_token` (from .env)
4. Subscribe to messages webhook events

### 3. Test End-to-End Flow

1. Send a WhatsApp message to your business number
2. Check that it appears in the desktop UI
3. Reply from the desktop UI
4. Verify the message is sent via WhatsApp

## 🔒 Security Considerations

1. **API Authentication**: Add JWT tokens for API routes
2. **Rate Limiting**: Implement rate limiting for WhatsApp sends
3. **Webhook Validation**: Verify webhook signatures
4. **Organization Isolation**: Ensure proper multi-tenant security

## 📊 Monitoring

Add logging and metrics:

```typescript
// Log all MCP tool calls
console.log('MCP Tool Called:', {
  tool,
  organizationId,
  timestamp: new Date().toISOString(),
  input: JSON.stringify(input)
})

// Track costs
await supabase.from('core_dynamic_data').insert({
  entity_id: organizationId,
  field_name: 'whatsapp_daily_spend',
  field_value_number: dailySpend,
  smart_code: 'HERA.METRICS.WHATSAPP.SPEND.v1'
})
```

## 🚀 Production Deployment

1. **Environment Variables**: Set all production values
2. **SSL/TLS**: Use HTTPS for webhooks
3. **Error Handling**: Implement proper error recovery
4. **Scaling**: Use PM2 or similar for MCP server
5. **Monitoring**: Set up alerts for failures

## Next Steps

1. Implement all MCP tool handlers
2. Add authentication to API routes
3. Set up production WhatsApp Business account
4. Configure webhook URL with ngrok for local testing
5. Add comprehensive error handling and retry logic