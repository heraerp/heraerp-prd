'use client'

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Send, Bot, User, Loader2, Settings, Copy, Check, Code, Eye, Sparkles, AlertCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  interpretation?: any
  result?: any
  metadata?: {
    organizationId?: string
    confidence?: number
    processingTime?: number
    error?: boolean
  }
}

interface HeraMCPChatProps {
  apiUrl?: string
  mode?: 'internal' | 'customer'
  className?: string
  showDebugInfo?: boolean
}

const EXAMPLE_PROMPTS = {
  internal: [
    "Show me all customers in the system",
    "Create a test customer named John Doe",
    "Query today's transactions",
    "Check system health status",
    "List all entity types",
    "Show database statistics"
  ],
  customer: [
    "Create a new customer for my business",
    "Show today's sales summary",
    "Add a new product to inventory",
    "Book an appointment for tomorrow",
    "Generate a financial report",
    "Update customer contact information"
  ]
}

export function HeraMCPChat({ 
  apiUrl = process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:3000',
  mode = 'customer',
  className,
  showDebugInfo = false
}: HeraMCPChatProps) {
  const { currentOrganization, organizations } = useMultiOrgAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState(currentOrganization?.id || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '')
  const [showRawResponse, setShowRawResponse] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: mode === 'internal' 
          ? "👋 Welcome to HERA MCP Debug Console! I can help you test database operations, query entities, and validate the universal architecture."
          : "👋 Hello! I'm your HERA assistant. I can help you manage customers, create transactions, generate reports, and more. What would you like to do today?",
        timestamp: new Date()
      }])
    }
  }, [mode])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Set default org ID
  useEffect(() => {
    if (currentOrganization && !selectedOrgId) {
      setSelectedOrgId(currentOrganization.id)
    }
  }, [currentOrganization])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    // Use a fallback organization ID if none is selected
    const orgId = selectedOrgId || '3df8cc52-3d81-42d5-b088-7736ae26cc7c' // Mario's Restaurant

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      metadata: { organizationId: orgId }
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const startTime = Date.now()

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          organizationId: orgId,
          context: { mode }
        })
      })

      const data = await response.json()
      const processingTime = Date.now() - startTime

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.error || 'No response received',
        timestamp: new Date(),
        interpretation: data.interpretation,
        result: data.result,
        metadata: {
          organizationId: selectedOrgId,
          confidence: data.interpretation?.confidence,
          processingTime,
          error: !data.success
        }
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to connect to MCP server'}`,
        timestamp: new Date(),
        metadata: { error: true }
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setIsLoading(false)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user'
    const hasDebugInfo = showDebugInfo && (message.interpretation || message.result)

    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-3 p-4 rounded-lg mx-2 my-2",
          isUser ? "bg-blue-50 dark:bg-blue-950/30" : "bg-gray-50 dark:bg-gray-900/50",
          (message.metadata as any)?.error && "bg-red-50 dark:bg-red-950/30",
          "border",
          isUser ? "border-blue-200 dark:border-blue-800" : "border-gray-200 dark:border-gray-800"
        )}
      >
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="max-w-none">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-900 dark:text-gray-100 font-medium">{message.content}</p>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              {(message.metadata as any)?.confidence && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(message.metadata.confidence * 100)}%
                </Badge>
              )}
              {(message.metadata as any)?.processingTime && (
                <Badge variant="outline" className="text-xs">
                  {message.metadata.processingTime}ms
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(message.content, message.id)}
                className="h-6 w-6 p-0"
              >
                {copiedId === message.id ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} />
                )}
              </Button>
            </div>
          </div>

          {hasDebugInfo && (
            <div className="mt-3 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRawResponse(!showRawResponse)}
                className="h-7 text-xs gap-1"
              >
                {showRawResponse ? <Eye size={12} /> : <Code size={12} />}
                {showRawResponse ? 'Hide' : 'Show'} Debug Info
              </Button>

              {showRawResponse && (
                <Tabs defaultValue="interpretation" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="interpretation" className="text-xs">Interpretation</TabsTrigger>
                    <TabsTrigger value="result" className="text-xs">Result</TabsTrigger>
                  </TabsList>
                  <TabsContent value="interpretation" className="mt-2">
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                      {JSON.stringify(message.interpretation, null, 2)}
                    </pre>
                  </TabsContent>
                  <TabsContent value="result" className="mt-2">
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                      {JSON.stringify(message.result, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span>{message.timestamp.toLocaleTimeString()}</span>
            {(message.metadata as any)?.organizationId && mode === 'internal' && (
              <span>Org: {message.metadata.organizationId.slice(0, 8)}...</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-lg", className)}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                HERA {mode === 'internal' ? 'MCP Debug Console' : 'AI Assistant'}
              </h2>
            </div>
            {mode === 'internal' && (
              <Badge variant="secondary" className="text-xs">
                Debug Mode
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(organizations.length > 0 || mode === 'internal') && (
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger className="w-[200px] h-8">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.length > 0 ? (
                    organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.organization_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="3df8cc52-3d81-42d5-b088-7736ae26cc7c">
                      Mario's Restaurant (Default)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}

            {mode === 'internal' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="gap-1"
              >
                <Settings size={16} />
                Debug
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 bg-white dark:bg-gray-950">
        <div className="py-4 space-y-1">
          {messages.map(renderMessage)}
          {isLoading && (
            <div className="flex gap-3 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot size={16} />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                Processing your request...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Example prompts */}
      {messages.length === 1 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
          <div className="grid grid-cols-2 gap-2">
            {EXAMPLE_PROMPTS[mode].slice(0, 4).map((prompt, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="justify-start text-xs h-8"
                onClick={() => {
                  setInput(prompt)
                  textareaRef.current?.focus()
                }}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'internal' 
              ? "Test a command... (e.g., 'create customer', 'query transactions')"
              : "Ask me anything about your business..."
            }
            className="min-h-[60px] max-h-[120px] resize-none text-base bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 border-gray-300 dark:border-gray-700"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-[60px] w-[60px]"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </Button>
        </form>

        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
          {apiUrl.includes('localhost') && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle size={12} />
              Local development mode
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}