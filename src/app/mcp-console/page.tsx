'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Send, Terminal, Database, Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system' | 'error'
  content: string
  timestamp: Date
  data?: any
}

interface MCPTool {
  name: string
  description: string
  category: string
}

const MCP_TOOLS: MCPTool[] = [
  { name: 'POS Sale', description: 'Create sales transaction', category: 'pos' },
  { name: 'Inventory', description: 'Add/remove/adjust stock', category: 'inventory' },
  { name: 'Appointments', description: 'Book/reschedule appointments', category: 'appointment' },
  { name: 'Reports', description: 'Generate business reports', category: 'report' },
  { name: 'Customer', description: 'Manage customer data', category: 'pos' },
  { name: 'Products', description: 'Manage product catalog', category: 'inventory' },
]

const ORGANIZATIONS = [
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Dubai Luxury Salon & Spa' },
  { id: '3df8cc52-3d81-42d5-b088-7736ae26cc7c', name: "Mario's Restaurant" },
  { id: '7b4f0f90-49af-4b98-9a07-953c0eef7c17', name: 'HERA Vibe Coding' },
  { id: '44d2d8f8-167d-46a7-a704-c0e5435863d6', name: 'HERA Software Inc' },
  { id: 'd56e8661-228e-4351-b391-5a36785dcc37', name: 'Default Organization' },
]

export default function MCPConsolePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState(ORGANIZATIONS[0].id)
  const [selectedServer, setSelectedServer] = useState<'general' | 'salon'>('salon')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Get MCP server URLs
  const generalMcpUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3001'
  const salonMcpUrl = process.env.NEXT_PUBLIC_SALON_MCP_URL || 'http://localhost:3002'
  const mcpServerUrl = selectedServer === 'salon' ? salonMcpUrl : generalMcpUrl
  const serverHost = mcpServerUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

  // Initialize messages on client side only to avoid hydration mismatch
  useEffect(() => {
    if (!initialized) {
      setMessages([
        {
          id: '1',
          type: 'system',
          content: '✨ Welcome to HERA Salon Magic Console! Try these natural commands:\n\n📅 Appointments:\n• "Book Emma for highlights tomorrow at 2pm"\n• "Who\'s available for a haircut now?"\n• "Show me tomorrow\'s appointments"\n• "Cancel Sarah\'s appointment"\n\n👥 Clients:\n• "Create profile for Jennifer Smith"\n• "Show Emma\'s history"\n• "Birthday clients this month"\n• "Find clients who love balayage"\n\n💰 Business:\n• "How\'s business today?"\n• "Calculate Sarah\'s commission"\n• "Show revenue this week"\n• "Top services this month"\n\n📦 Inventory:\n• "Check blonde toner stock"\n• "What needs reordering?"\n• "Add 10 bottles of shampoo"\n\n🎯 Marketing:\n• "Create birthday campaign"\n• "Find inactive clients"\n• "Show VIP clients"',
          timestamp: new Date(),
        },
      ])
      setInitialized(true)
    }
  }, [initialized])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])


  const normalizeMessage = (message: string): string => {
    const lower = message.toLowerCase()
    
    // Convert common database queries to UAT format
    if (lower.includes('show tables') || lower.includes('database summary')) {
      return 'generate sales report for today'
    }
    if (lower.includes('list customers') || lower.includes('show customers')) {
      return 'generate customer report'
    }
    if (lower.includes('list products') || lower.includes('show products')) {
      return 'generate inventory report'
    }
    if (lower.includes('universal transaction') || lower.includes('show transactions')) {
      return 'generate sales report for today'
    }
    
    // Handle exact matches for report commands
    if (lower === 'generate sales summary report') {
      return 'generate sales report for today'
    }
    
    // Handle transaction details query
    if (lower.includes('transaction') && lower.includes('details')) {
      return 'generate sales report for today'
    }
    
    // Don't send button labels as commands
    if (lower === 'pos sale create sales tranaction' || lower === 'manage customer data') {
      return 'generate sales report for today'
    }
    
    return message
  }

  const callMCPServer = async (message: string) => {
    try {
      // Use selected organization ID
      const organizationId = selectedOrgId
      
      // Normalize message for UAT server
      const normalizedMessage = normalizeMessage(message)
      
      const endpoint = selectedServer === 'salon' ? '/api/salon/chat' : '/api/chat'
      console.log('Calling MCP server at:', `${mcpServerUrl}${endpoint}`)
      console.log('Normalized message:', normalizedMessage)
      console.log('Organization ID:', organizationId)
      const response = await fetch(`${mcpServerUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: normalizedMessage,
          organizationId: organizationId,
          context: {}
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('MCP server error:', response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('MCP server response:', data)
      return data
    } catch (error) {
      console.error('MCP call error:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted', { input, loading })
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Call MCP server with natural language
      const result = await callMCPServer(input)

      // Format response based on the result
      let responseContent = ''
      
      if (result.success && result.response) {
        responseContent = result.response
        
        // Add additional formatting based on interpretation
        if (result.interpretation?.action === 'database_summary' && result.result?.summary) {
          responseContent = '📊 Database Summary:\n\n'
          result.result.summary.forEach((table: any) => {
            responseContent += `• ${table.table}: ${table.count} records\n`
          })
        } else if (result.interpretation?.action === 'query' && result.result?.data) {
          const records = result.result.data
          responseContent = `Found ${records.length} record(s):\n\n`
          records.slice(0, 5).forEach((record: any, index: number) => {
            responseContent += `${index + 1}. ${record.entity_name || record.transaction_code || 'Record'}\n`
            if (record.entity_type) responseContent += `   Type: ${record.entity_type}\n`
            if (record.total_amount) responseContent += `   Amount: $${record.total_amount}\n`
          })
          if (records.length > 5) {
            responseContent += `\n... and ${records.length - 5} more`
          }
        } else if (result.interpretation?.action === 'create' && result.result?.entity) {
          const entity = result.result.entity
          responseContent = `✅ Successfully created ${entity.entity_type}: ${entity.entity_name}\n`
          if (entity.id) {
            responseContent += `ID: ${entity.id}`
          }
        }
      } else {
        responseContent = result.error || 'An error occurred processing your request'
      }

      const assistantMessage: Message = {
        id: Date.now().toString() + '-response',
        type: result.success ? 'assistant' : 'error',
        content: responseContent,
        timestamp: new Date(),
        data: result,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'user':
        return <Terminal className="h-4 w-4" />
      case 'assistant':
        return <Bot className="h-4 w-4" />
      case 'system':
        return <Database className="h-4 w-4" />
      case 'error':
        return <Sparkles className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="hera-card h-[80vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-primary" />
              <CardTitle>HERA MCP Console</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedServer} onValueChange={(value: 'general' | 'salon') => setSelectedServer(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salon">Salon Magic</SelectItem>
                  <SelectItem value="general">General MCP</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATIONS.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="outline" className="gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                {selectedServer === 'salon' ? '✨ Salon Magic' : '🔧 General'} - {serverHost}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="flex h-full">
            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        message.type === 'user' && 'justify-end'
                      )}
                    >
                      {message.type !== 'user' && (
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {getMessageIcon(message.type)}
                        </div>
                      )}
                      <div
                        className={cn(
                          'rounded-lg px-4 py-2 max-w-[80%]',
                          message.type === 'user' && 'bg-primary text-primary-foreground',
                          message.type === 'assistant' && 'bg-muted',
                          message.type === 'system' && 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
                          message.type === 'error' && 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                        )}
                      >
                        <pre className="whitespace-pre-wrap font-mono text-sm">
                          {message.content}
                        </pre>
                        {initialized && (
                          <div className="text-xs opacity-60 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                      {message.type === 'user' && (
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          {getMessageIcon(message.type)}
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Try: 'Show database summary' or 'Create a customer named Acme Corp'"
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button type="submit" disabled={loading || !input.trim()}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Tools Sidebar */}
            <div className="w-64 border-l p-4 bg-muted/10">
              <h3 className="font-semibold mb-3 text-sm">Example Commands</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    setInput('generate sales report for today')
                    inputRef.current?.focus()
                  }}
                >
                  Sales Summary
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    setInput('create pos transaction for $25')
                    inputRef.current?.focus()
                  }}
                >
                  Create Sale ($25)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    setInput('add 10 units to inventory for Product A')
                    inputRef.current?.focus()
                  }}
                >
                  Add Inventory
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    setInput('generate inventory report')
                    inputRef.current?.focus()
                  }}
                >
                  Inventory Report
                </Button>
              </div>
              
              <h3 className="font-semibold mb-3 text-sm mt-6">Available Features</h3>
              <div className="space-y-2">
                {MCP_TOOLS.map((tool) => (
                  <div key={tool.name} className="text-xs space-y-1">
                    <div className="font-mono text-primary">{tool.name}</div>
                    <div className="text-muted-foreground">{tool.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}