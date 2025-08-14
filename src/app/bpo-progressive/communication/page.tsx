'use client'

import React, { useState, useRef, useEffect } from 'react'
import { BPOManagementSidebar } from '@/components/bpo-progressive/BPOManagementSidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MessageSquare, Send, Paperclip, Search, Filter,
  User, Building, Clock, AlertCircle, CheckCircle,
  FileText, Download, Eye, Sparkles, Phone, Video,
  MoreVertical, Archive, Star, Flag, RefreshCw
} from 'lucide-react'
import { BPOCommunicationEntity, BPOMessageEntity, BPOUserRole } from '@/lib/bpo/bpo-entities'

interface CommunicationThread extends BPOCommunicationEntity {
  invoice_number: string
  vendor_name: string
  last_message: string
  participants: Array<{ id: string; name: string; role: BPOUserRole }>
}

interface Message extends BPOMessageEntity {
  sender_name: string
  sender_avatar?: string
}

// Mock communication threads
const mockThreads: CommunicationThread[] = [
  {
    entity_id: 'thread-001',
    entity_type: 'bpo_communication',
    entity_name: 'INV-2024-001 Processing Query',
    smart_code: 'HERA.BPO.COMM.THREAD.v1',
    invoice_id: 'inv-001',
    invoice_number: 'INV-2024-001',
    vendor_name: 'Office Supplies Inc.',
    thread_status: 'active',
    priority: 'medium',
    head_office_user_id: 'ho-user-1',
    back_office_user_id: 'bo-user-1',
    created_by: 'bo-user-1',
    created_at: new Date('2024-08-11T10:30:00'),
    last_message_at: new Date('2024-08-11T11:45:00'),
    last_message: 'Could you clarify the PO number? The format seems unusual.',
    message_count: 4,
    unread_count_ho: 1,
    unread_count_bo: 0,
    participants: [
      { id: 'ho-user-1', name: 'Sarah Johnson', role: 'head-office' },
      { id: 'bo-user-1', name: 'Priya Sharma', role: 'back-office' }
    ]
  },
  {
    entity_id: 'thread-002',
    entity_type: 'bpo_communication',
    entity_name: 'INV-2024-004 Missing Documentation',
    smart_code: 'HERA.BPO.COMM.THREAD.v1',
    invoice_id: 'inv-004',
    invoice_number: 'INV-2024-004',
    vendor_name: 'Industrial Equipment Co',
    thread_status: 'active',
    priority: 'high',
    head_office_user_id: 'ho-user-4',
    back_office_user_id: 'bo-user-1',
    created_by: 'bo-user-1',
    created_at: new Date('2024-08-11T11:15:00'),
    last_message_at: new Date('2024-08-11T11:30:00'),
    last_message: 'We need the delivery receipt and inspection report for this equipment purchase.',
    message_count: 2,
    unread_count_ho: 2,
    unread_count_bo: 0,
    participants: [
      { id: 'ho-user-4', name: 'David Wilson', role: 'head-office' },
      { id: 'bo-user-1', name: 'Priya Sharma', role: 'back-office' }
    ]
  },
  {
    entity_id: 'thread-003',
    entity_type: 'bpo_communication',
    entity_name: 'INV-2024-002 Verification Complete',
    smart_code: 'HERA.BPO.COMM.THREAD.v1',
    invoice_id: 'inv-002',
    invoice_number: 'INV-2024-002',
    vendor_name: 'Software Licensing Corp',
    thread_status: 'resolved',
    priority: 'medium',
    head_office_user_id: 'ho-user-2',
    back_office_user_id: 'bo-user-2',
    created_by: 'bo-user-2',
    created_at: new Date('2024-08-11T09:30:00'),
    last_message_at: new Date('2024-08-11T10:45:00'),
    last_message: 'Thank you for the confirmation. Processing is now complete.',
    message_count: 6,
    unread_count_ho: 0,
    unread_count_bo: 0,
    participants: [
      { id: 'ho-user-2', name: 'Michael Chen', role: 'head-office' },
      { id: 'bo-user-2', name: 'James Wilson', role: 'back-office' }
    ]
  }
]

// Mock messages for selected thread
const mockMessages: Message[] = [
  {
    entity_id: 'msg-001',
    entity_type: 'bpo_message',
    entity_name: 'Initial Query',
    smart_code: 'HERA.BPO.COMM.MESSAGE.v1',
    thread_id: 'thread-001',
    sender_id: 'bo-user-1',
    sender_name: 'Priya Sharma',
    sender_role: 'back-office',
    message_content: 'Hi Sarah, I\'m processing INV-2024-001 and noticed the PO number format "PO-OFF-2024-Q3-001" is different from the usual format. Can you confirm this is correct?',
    message_type: 'query',
    created_at: new Date('2024-08-11T10:30:00'),
    is_read: true
  },
  {
    entity_id: 'msg-002',
    entity_type: 'bpo_message',
    entity_name: 'Response',
    smart_code: 'HERA.BPO.COMM.MESSAGE.v1',
    thread_id: 'thread-001',
    sender_id: 'ho-user-1',
    sender_name: 'Sarah Johnson',
    sender_role: 'head-office',
    message_content: 'Yes, that\'s correct. We changed the PO numbering system in Q3 to include the quarter for better tracking. You can proceed with processing.',
    message_type: 'response',
    created_at: new Date('2024-08-11T10:45:00'),
    is_read: true
  },
  {
    entity_id: 'msg-003',
    entity_type: 'bpo_message',
    entity_name: 'Follow-up',
    smart_code: 'HERA.BPO.COMM.MESSAGE.v1',
    thread_id: 'thread-001',
    sender_id: 'bo-user-1',
    sender_name: 'Priya Sharma',
    sender_role: 'back-office',
    message_content: 'Perfect, thank you for the clarification. I\'ll update our internal guidelines to reflect the new PO format. Processing will be completed within the hour.',
    message_type: 'text',
    created_at: new Date('2024-08-11T11:00:00'),
    is_read: true
  },
  {
    entity_id: 'msg-004',
    entity_type: 'bpo_message',
    entity_name: 'Status Update',
    smart_code: 'HERA.BPO.COMM.MESSAGE.v1',
    thread_id: 'thread-001',
    sender_id: 'bo-user-1',
    sender_name: 'Priya Sharma',
    sender_role: 'back-office',
    message_content: 'Could you clarify the PO number? The format seems unusual.',
    message_type: 'status_update',
    created_at: new Date('2024-08-11T11:45:00'),
    is_read: false
  }
]

export default function BPOCommunicationPage() {
  const [threads, setThreads] = useState<CommunicationThread[]>(mockThreads)
  const [selectedThread, setSelectedThread] = useState<CommunicationThread | null>(threads[0])
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Current user (simplified)
  const currentUserId = 'bo-user-1'
  const currentUserRole: BPOUserRole = 'back-office'

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedThread) return

    const message: Message = {
      entity_id: `msg-${Date.now()}`,
      entity_type: 'bpo_message',
      entity_name: newMessage.substring(0, 50) + '...',
      smart_code: 'HERA.BPO.COMM.MESSAGE.v1',
      thread_id: selectedThread.entity_id,
      sender_id: currentUserId,
      sender_name: currentUserRole === 'head-office' ? 'Sarah Johnson' : 'Priya Sharma',
      sender_role: currentUserRole,
      message_content: newMessage,
      message_type: 'text',
      created_at: new Date(),
      is_read: false
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // Update thread last message
    setThreads(prev => prev.map(thread => 
      thread.entity_id === selectedThread.entity_id 
        ? { 
            ...thread, 
            last_message: newMessage,
            last_message_at: new Date(),
            message_count: (thread.message_count || 0) + 1
          }
        : thread
    ))
  }

  // Filter threads
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = !searchTerm || 
      thread.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || thread.thread_status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
      <BPOManagementSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  Communication Hub
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Collaboration Center
                  </Badge>
                </h1>
                <p className="text-gray-600 mt-1">Real-time invoice discussion and query resolution</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Thread List */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Search and Filter */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'resolved') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem className="hera-select-item" value="all">All Threads</SelectItem>
                  <SelectItem className="hera-select-item" value="active">Active</SelectItem>
                  <SelectItem className="hera-select-item" value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-auto">
              {filteredThreads.map((thread) => {
                const unreadCount = currentUserRole === 'head-office' ? thread.unread_count_ho : thread.unread_count_bo
                const isSelected = selectedThread?.entity_id === thread.entity_id
                
                return (
                  <div
                    key={thread.entity_id}
                    onClick={() => setSelectedThread(thread)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{thread.invoice_number}</h3>
                        {thread.thread_status === 'active' ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700 text-xs">Resolved</Badge>
                        )}
                        {thread.priority === 'high' && (
                          <Flag className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <Badge className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">{thread.vendor_name}</p>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{thread.last_message}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{thread.last_message_at?.toLocaleTimeString()}</span>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {thread.message_count || 0}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Chat Area */}
          {selectedThread ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-bold text-gray-900">{selectedThread.invoice_number}</h2>
                      <Badge className={selectedThread.thread_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {selectedThread.thread_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{selectedThread.vendor_name} • {selectedThread.participants.length} participants</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isMine = message.sender_id === currentUserId
                  
                  return (
                    <div key={message.entity_id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md ${isMine ? 'order-2' : 'order-1'}`}>
                        {!isMine && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {message.sender_name[0]}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{message.sender_name}</span>
                            <Badge className="text-xs bg-blue-100 text-blue-700 capitalize">
                              {message.sender_role.replace('-', ' ')}
                            </Badge>
                          </div>
                        )}
                        
                        <div className={`p-3 rounded-lg ${
                          isMine 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.message_content}</p>
                          {message.message_type === 'query' && (
                            <div className="mt-2 pt-2 border-t border-opacity-20 border-white">
                              <Badge className={`text-xs ${isMine ? 'bg-blue-500 text-white' : 'bg-orange-100 text-orange-700'}`}>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Query
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        <div className={`text-xs text-gray-500 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                          {message.created_at.toLocaleTimeString()}
                          {!message.is_read && isMine && (
                            <span className="ml-1">• Sent</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-end gap-3">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 text-white px-6"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <span>{newMessage.length}/1000</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a thread from the left to start communicating</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}