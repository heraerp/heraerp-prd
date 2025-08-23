'use client'

import React, { useState } from 'react'
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HeraMCPChat } from './HeraMCPChat'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface HeraChatWidgetProps {
  apiUrl?: string
  position?: 'bottom-right' | 'bottom-left'
  defaultOpen?: boolean
  mode?: 'internal' | 'customer'
}

export function HeraChatWidget({ 
  apiUrl,
  position = 'bottom-right',
  defaultOpen = false,
  mode = 'customer'
}: HeraChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isMinimized, setIsMinimized] = useState(false)

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  if (!isOpen) {
    return (
      <div className={cn("fixed z-50", positionClasses[position])}>
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all"
        >
          <MessageCircle size={24} />
        </Button>
        <Badge 
          className="absolute -top-2 -right-2 h-6 w-6 p-0 items-center justify-center"
          variant="destructive"
        >
          AI
        </Badge>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "fixed z-50 transition-all duration-300",
        positionClasses[position],
        isMinimized ? "w-80" : "w-full max-w-2xl"
      )}
    >
      {isMinimized ? (
        <div className="bg-background border rounded-lg shadow-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">HERA Assistant</h3>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
                className="h-6 w-6 p-0"
              >
                <Maximize2 size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Click to expand and continue chatting
          </p>
        </div>
      ) : (
        <div className="bg-background border rounded-lg shadow-2xl">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-medium">HERA AI Assistant</h3>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0"
              >
                <Minimize2 size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
          <div className="h-[500px]">
            <HeraMCPChat 
              apiUrl={apiUrl}
              mode={mode}
              className="h-full border-0 shadow-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}