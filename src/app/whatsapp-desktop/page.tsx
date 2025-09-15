'use client'

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Check,
  CheckCheck,
  Archive,
  Pin,
  Star,
  Copy,
  Forward,
  Reply,
  Trash2,
  Sun,
  Moon,
  Settings,
  MessageCircle,
  Phone,
  Video,
  Camera,
  File,
  MapPin,
  User as UserIcon,
  Clock,
  ChevronDown,
  ArrowLeft,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
import { formatDate, isTodaySafe, isYesterdaySafe, differenceInMinutesSafe } from '@/lib/date-utils'

interface Message {
  id: string
  text: string
  direction: 'inbound' | 'outbound'
  created_at: string
  status?: 'sent' | 'delivered' | 'read'
  replyTo?: string
  isStarred?: boolean
  metadata?: any
}

interface Conversation {
  id: string
  entity_name: string
  entity_code: string
  metadata: {
    phone: string
    wa_id?: string
    profile_pic?: string
    last_seen?: string
    is_online?: boolean
    about?: string
  }
  lastMessage?: Message
  unreadCount?: number
  isPinned?: boolean
  isArchived?: boolean
  messages?: Message[]
}

export default function WhatsAppDesktop() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [showStarred, setShowStarred] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { theme, setTheme } = useTheme()

  // Fetch conversations and messages
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/whatsapp/conversations')
      const result = await response.json()

      if (result.status === 'success') {
        setConversations(result.data.conversations)

        // If a conversation is selected, update its messages
        if (selectedConversation) {
          const updated = result.data.conversations.find(
            (c: Conversation) => c.id === selectedConversation.id
          )
          if (updated) {
            setMessages(updated.messages || [])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedConversation])

  useEffect(() => {
    fetchConversations()
    // Auto refresh every 5 seconds
    const interval = setInterval(fetchConversations, 5000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return

    try {
      const payload: any = {
        conversationId: selectedConversation.id,
        text: messageInput,
        to: selectedConversation.metadata.phone
      }

      if (replyingTo) {
        payload.replyTo = replyingTo.id
      }

      const response = await fetch('/api/v1/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      if (result.success) {
        setMessageInput('')
        setReplyingTo(null)
        fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Send media
  const sendMedia = async (file: File) => {
    if (!selectedConversation) return

    // In a real implementation, you would upload the file first
    // For now, we'll just show the structure
    try {
      const mediaUrl = 'https://example.com/uploaded-file.jpg' // Upload file and get URL
      const mediaType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : 'document'

      const response = await fetch('/api/v1/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          to: selectedConversation.metadata.phone,
          mediaUrl,
          mediaType,
          text: messageInput || undefined // Caption if any
        })
      })

      const result = await response.json()
      if (result.success) {
        setMessageInput('')
        fetchConversations()
      }
    } catch (error) {
      console.error('Error sending media:', error)
    }
  }

  // Global search
  const searchMessages = async (query: string, type: 'all' | 'starred' | 'media' = 'all') => {
    try {
      const response = await fetch(
        `/api/v1/whatsapp/search?q=${encodeURIComponent(query)}&type=${type}`
      )
      const result = await response.json()

      if (result.status === 'success') {
        return result.data.results
      }
      return []
    } catch (error) {
      console.error('Error searching messages:', error)
      return []
    }
  }

  // Format timestamps
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isTodaySafe(date)) return formatDate(date, 'HH:mm')
    if (isYesterdaySafe(date)) return 'Yesterday'
    return formatDate(date, 'dd/MM/yyyy')
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return formatDate(date, 'HH:mm')
  }

  const formatDateSeparator = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isTodaySafe(date)) return 'Today'
    if (isYesterdaySafe(date)) return 'Yesterday'
    return formatDate(date, 'MMMM d, yyyy')
  }

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}

    messages.forEach(msg => {
      const date = formatDate(new Date(msg.created_at), 'yyyy-MM-dd')
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })

    return groups
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '/':
            e.preventDefault()
            document.getElementById('search-input')?.focus()
            break
          case 'n':
            e.preventDefault()
            // New chat functionality
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [])

  // Toggle conversation actions
  const togglePin = async (convId: string) => {
    const conv = conversations.find(c => c.id === convId)
    if (!conv) return

    try {
      await fetch('/api/v1/whatsapp/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          action: conv.isPinned ? 'unpin' : 'pin'
        })
      })

      setConversations(prev =>
        prev.map(c => (c.id === convId ? { ...c, isPinned: !c.isPinned } : c))
      )
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  const toggleArchive = async (convId: string) => {
    const conv = conversations.find(c => c.id === convId)
    if (!conv) return

    try {
      await fetch('/api/v1/whatsapp/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          action: conv.isArchived ? 'unarchive' : 'archive'
        })
      })

      setConversations(prev =>
        prev.map(c => (c.id === convId ? { ...c, isArchived: !c.isArchived } : c))
      )
    } catch (error) {
      console.error('Error toggling archive:', error)
    }
  }

  const toggleStar = async (messageId: string) => {
    const msg = messages.find(m => m.id === messageId)
    if (!msg) return

    try {
      await fetch(`/api/v1/whatsapp/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: msg.isStarred ? 'unstar' : 'star'
        })
      })

      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, isStarred: !m.isStarred } : m))
      )
    } catch (error) {
      console.error('Error toggling star:', error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/v1/whatsapp/messages/${messageId}`, {
        method: 'DELETE'
      })

      setMessages(prev => prev.filter(m => m.id !== messageId))
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const markMessageAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/v1/whatsapp/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markRead'
        })
      })

      setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, status: 'read' } : m)))
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch =
      conv.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.metadata.phone.includes(searchQuery) ||
      conv.lastMessage?.text.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesArchive = showArchived ? conv.isArchived : !conv.isArchived
    return matchesSearch && matchesArchive
  })

  // Sort conversations (pinned first)
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return 0
  })

  // Filter messages
  const filteredMessages = showStarred
    ? messages.filter(m => m.isStarred)
    : messageSearchQuery
      ? messages.filter(m => m.text.toLowerCase().includes(messageSearchQuery.toLowerCase()))
      : messages

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-[30%] min-w-[320px] flex flex-col border-r">
        {/* User Profile Header */}
        <div className="p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder-avatar.png" />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">My Business</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowStarred(!showStarred)}>
                <Star className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowArchived(!showArchived)}>
                <Archive className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    Toggle theme
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-input"
              placeholder="Search or start new chat"
              className="pl-10 pr-4"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          <div className="space-y-px">
            {sortedConversations.map(conv => (
              <div
                key={conv.id}
                className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-muted' : ''
                }`}
                onClick={async () => {
                  setSelectedConversation(conv)
                  setMessages(conv.messages || [])
                  setMessageSearchQuery('')
                  setShowStarred(false)

                  // Mark all inbound messages as read
                  const unreadMessages =
                    conv.messages?.filter(m => m.direction === 'inbound' && m.status !== 'read') ||
                    []

                  for (const msg of unreadMessages) {
                    await markMessageAsRead(msg.id)
                  }

                  // Update conversation unread count
                  setConversations(prev =>
                    prev.map(c => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                  )
                }}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conv.metadata.profile_pic} />
                  <AvatarFallback>
                    {conv.entity_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{conv.entity_name}</p>
                      {conv.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {conv.lastMessage && formatTime(conv.lastMessage.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage?.direction === 'outbound' && (
                        <span className="inline-flex items-center mr-1">
                          {conv.lastMessage.status === 'read' ? (
                            <CheckCheck className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                      )}
                      {conv.lastMessage?.text || 'No messages yet'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-green-500 text-white">{conv.unreadCount}</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.metadata.profile_pic} />
                  <AvatarFallback>
                    {selectedConversation.entity_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedConversation.entity_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.metadata.is_online
                      ? 'online'
                      : selectedConversation.metadata.last_seen
                        ? `last seen ${formatTime(selectedConversation.metadata.last_seen)}`
                        : selectedConversation.metadata.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <div className="relative">
                  <Input
                    placeholder="Search in chat"
                    className="w-[200px] h-8 text-sm"
                    value={messageSearchQuery}
                    onChange={e => setMessageSearchQuery(e.target.value)}
                    onFocus={e => e.target.select()}
                  />
                  {messageSearchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-8 w-8"
                      onClick={() => setMessageSearchQuery('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsSelectionMode(!isSelectionMode)}>
                      Select messages
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleArchive(selectedConversation.id)}>
                      {selectedConversation.isArchived ? 'Unarchive' : 'Archive'} chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => togglePin(selectedConversation.id)}>
                      {selectedConversation.isPinned ? 'Unpin' : 'Pin'} chat
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Delete chat</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Selection Mode Header */}
            {isSelectionMode && (
              <div className="flex items-center justify-between p-2 bg-muted border-b">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsSelectionMode(false)
                      setSelectedMessages(new Set())
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <span className="text-sm">{selectedMessages.size} selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Forward className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {Object.entries(groupMessagesByDate(filteredMessages)).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-muted px-3 py-1 rounded-full text-xs">
                        {formatDateSeparator(msgs[0].created_at)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {msgs.map(message => (
                        <ContextMenu key={message.id}>
                          <ContextMenuTrigger>
                            <div
                              className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                              onClick={() => {
                                if (isSelectionMode) {
                                  const newSelected = new Set(selectedMessages)
                                  if (newSelected.has(message.id)) {
                                    newSelected.delete(message.id)
                                  } else {
                                    newSelected.add(message.id)
                                  }
                                  setSelectedMessages(newSelected)
                                }
                              }}
                            >
                              <div
                                className={`
                                  max-w-[70%] p-3 rounded-lg relative
                                  ${
                                    message.direction === 'outbound'
                                      ? 'bg-green-500 text-white dark:bg-green-600'
                                      : 'bg-muted'
                                  }
                                  ${selectedMessages.has(message.id) ? 'ring-2 ring-blue-500' : ''}
                                  ${message.isStarred ? 'shadow-lg' : ''}
                                `}
                              >
                                {/* Reply indicator */}
                                {message.replyTo && (
                                  <div
                                    className={`mb-2 p-2 rounded ${
                                      message.direction === 'outbound'
                                        ? 'bg-green-600 dark:bg-green-700'
                                        : 'bg-muted-foreground/10'
                                    }`}
                                  >
                                    <p className="text-xs opacity-70">Replying to</p>
                                    <p className="text-sm truncate">Original message text...</p>
                                  </div>
                                )}

                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.text}
                                </p>

                                <div className="flex items-center justify-end gap-1 mt-1">
                                  {message.isStarred && <Star className="h-3 w-3 fill-current" />}
                                  <span
                                    className={`text-xs ${
                                      message.direction === 'outbound'
                                        ? 'text-white/70'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    {formatMessageTime(message.created_at)}
                                  </span>
                                  {message.direction === 'outbound' && (
                                    <span>
                                      {message.status === 'read' ? (
                                        <CheckCheck className="h-3 w-3 text-blue-200" />
                                      ) : message.status === 'delivered' ? (
                                        <CheckCheck className="h-3 w-3" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem onClick={() => setReplyingTo(message)}>
                              <Reply className="mr-2 h-4 w-4" />
                              Reply
                            </ContextMenuItem>
                            <ContextMenuItem>
                              <Forward className="mr-2 h-4 w-4" />
                              Forward
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() => navigator.clipboard.writeText(message.text)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => toggleStar(message.id)}>
                              <Star
                                className={`mr-2 h-4 w-4 ${message.isStarred ? 'fill-current' : ''}`}
                              />
                              {message.isStarred ? 'Unstar' : 'Star'}
                            </ContextMenuItem>
                            <ContextMenuItem
                              className="text-destructive"
                              onClick={() => deleteMessage(message.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              {/* Reply indicator */}
              {replyingTo && (
                <div className="flex items-center justify-between mb-2 p-2 bg-muted rounded">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Replying to</p>
                    <p className="text-sm truncate">{replyingTo.text}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-end gap-2">
                {/* Emoji Picker */}
                <DropdownMenu open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Smile className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[300px] p-2">
                    <div className="grid grid-cols-8 gap-1">
                      {[
                        '😀',
                        '😂',
                        '😍',
                        '🤔',
                        '😎',
                        '😭',
                        '😊',
                        '🙏',
                        '👍',
                        '❤️',
                        '🎉',
                        '🔥',
                        '💯',
                        '👏',
                        '😁',
                        '🤗'
                      ].map(emoji => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setMessageInput(prev => prev + emoji)
                            setShowEmojiPicker(false)
                          }}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Attachment Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                      <Camera className="mr-2 h-4 w-4" />
                      Photos & Videos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
                        input.onchange = e => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) sendMedia(file)
                        }
                        input.click()
                      }}
                    >
                      <File className="mr-2 h-4 w-4" />
                      Document
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <UserIcon className="mr-2 h-4 w-4" />
                      Contact
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MapPin className="mr-2 h-4 w-4" />
                      Location
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  multiple
                  onChange={e => {
                    const files = Array.from(e.target.files || [])
                    files.forEach(file => sendMedia(file))
                    e.target.value = '' // Reset input
                  }}
                />

                {/* Message Input */}
                <Input
                  placeholder="Type a message"
                  className="flex-1"
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />

                {/* Send/Voice Button */}
                {messageInput.trim() ? (
                  <Button size="icon" onClick={sendMessage}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant={isRecording ? 'destructive' : 'default'}
                    onClick={() => setIsRecording(!isRecording)}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">WhatsApp Desktop</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Select a conversation to start messaging or use Ctrl+N to start a new chat
              </p>
              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <p>
                  <kbd className="px-2 py-1 bg-muted rounded">Ctrl+/</kbd> Search conversations
                </p>
                <p>
                  <kbd className="px-2 py-1 bg-muted rounded">Ctrl+N</kbd> New chat
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
