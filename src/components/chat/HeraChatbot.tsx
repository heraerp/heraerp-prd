'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { MessageCircle, Send, Bot, User, Loader2, X, Sparkles, AlertCircle } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
  timestamp: Date
  interpretation?: any
  result?: any
}

interface HeraChatbotProps {
  apiUrl?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme?: 'light' | 'dark'
}

export function HeraChatbot({
  apiUrl = process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:3000',
  position = 'bottom-right',
  theme = 'light'
}: HeraChatbotProps) {
  const { currentOrganization } = useHERAAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Default organization for testing
  const DEFAULT_ORG_ID =
    process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content:
            "Hello! I'm your HERA AI assistant. I can help you with:\n\n• Creating customers, appointments, and transactions\n• Checking your business data\n• Generating reports and insights\n• Managing your operations\n\nWhat would you like to do today?",
          timestamp: new Date()
        }
      ])
    }
  }, [isOpen, messages.length])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          organizationId,
          context: {
            module: window.location.pathname.includes('salon') ? 'salon' : 'general',
            user: currentOrganization?.name || 'User'
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process message')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I've completed that action.",
        timestamp: new Date(),
        interpretation: data.interpretation,
        result: data.result
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'error',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClasses[position]} z-50 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700`}
        >
          <MessageCircle className="w-6 h-6 text-foreground" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card
          className={`fixed ${positionClasses[position]} z-50 w-96 h-[600px] flex flex-col shadow-2xl ${theme ==='dark' ? 'bg-background text-foreground' : 'bg-background'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-background/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">HERA AI Assistant</h3>
                <p className="text-xs">Powered by Universal Architecture</p>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-background/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.role ==='user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role !== 'user' && (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${ message.role ==='error' ? 'bg-red-100' : 'bg-purple-100'
                      }`}
                    >
                      {message.role === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Bot className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                  )}

                  <div className={`max-w-[80%] ${message.role ==='user' ? 'order-1' : 'order-2'}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${ message.role ==='user'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-foreground'
                          : message.role === 'error'
                            ? 'bg-red-50 text-red-900 border border-red-200'
                            : theme === 'dark'
                              ? 'bg-muted text-gray-100'
                              : 'bg-muted text-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>
                    <p
                      className={`text-xs mt-1 ${theme ==='dark' ? 'text-muted-foreground' : 'text-muted-foreground'}`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 order-2">
                      <User className="w-5 h-5 text-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-purple-600" />
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 ${theme ==='dark' ? 'bg-muted' : 'bg-muted'}`}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className={theme === 'dark' ? 'bg-muted border-border' : ''}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p
              className={`text-xs mt-2 ${theme ==='dark' ? 'text-muted-foreground' : 'text-muted-foreground'}`}
            >
              Powered by HERA Universal Architecture •{' '}
              {organizationId === DEFAULT_ORG_ID ? 'Test Mode' : currentOrganization?.name}
            </p>
          </div>
        </Card>
      )}
    </>
  )
}
