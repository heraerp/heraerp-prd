// ================================================================================
// HISTORY TABLE - WHATSAPP MESSAGE HISTORY TABLE
// Smart Code: HERA.UI.WHATSAPP.HISTORY_TABLE.v1
// Production-ready message history table with filtering and status tracking
// ================================================================================

'use client'

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { 
  Eye, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Send,
  Phone,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { WaMessage, MessageFilters } from '@/src/lib/schemas/whatsapp'

interface HistoryTableProps {
  messages: WaMessage[]
  isLoading: boolean
  filters: MessageFilters
  onFiltersChange: (filters: MessageFilters) => void
}

export function HistoryTable({ messages, isLoading, filters, onFiltersChange }: HistoryTableProps) {
  const filteredMessages = React.useMemo(() => {
    let filtered = [...messages]

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(msg => msg.status === filters.status)
    }
    if (filters.template_name) {
      filtered = filtered.filter(msg => msg.template_name === filters.template_name)
    }
    if (filters.customer_code) {
      filtered = filtered.filter(msg => 
        msg.to_customer_code?.toLowerCase().includes(filters.customer_code!.toLowerCase())
      )
    }
    if (filters.date_from) {
      const fromDate = new Date(filters.date_from)
      filtered = filtered.filter(msg => new Date(msg.created_at!) >= fromDate)
    }
    if (filters.date_to) {
      const toDate = new Date(filters.date_to + 'T23:59:59') // End of day
      filtered = filtered.filter(msg => new Date(msg.created_at!) <= toDate)
    }

    // Sort by most recent first
    filtered.sort((a, b) => 
      new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
    )

    return filtered
  }, [messages, filters])

  // Pagination
  const totalMessages = filteredMessages.length
  const startIndex = filters.offset || 0
  const endIndex = startIndex + (filters.limit || 50)
  const paginatedMessages = filteredMessages.slice(startIndex, endIndex)
  const hasNextPage = endIndex < totalMessages
  const hasPrevPage = startIndex > 0

  const handleNextPage = () => {
    onFiltersChange({
      ...filters,
      offset: startIndex + (filters.limit || 50)
    })
  }

  const handlePrevPage = () => {
    onFiltersChange({
      ...filters,
      offset: Math.max(0, startIndex - (filters.limit || 50))
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued':
        return <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">
          <Clock className="h-3 w-3 mr-1" />
          Queued
        </Badge>
      case 'sent':
        return <Badge variant="outline" className="text-violet-700 border-violet-300 bg-violet-50">
          <Send className="h-3 w-3 mr-1" />
          Sent
        </Badge>
      case 'delivered':
        return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
          <CheckCircle className="h-3 w-3 mr-1" />
          Delivered
        </Badge>
      case 'read':
        return <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
          <CheckCircle className="h-3 w-3 mr-1" />
          Read
        </Badge>
      case 'failed':
        return <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      default:
        return <Badge variant="outline" className="text-gray-700 border-gray-300 bg-gray-50">
          Unknown
        </Badge>
    }
  }

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display (remove country code if UAE)
    if (phone.startsWith('+971')) {
      return phone.replace('+971', '0')
    }
    return phone
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-green-600 mr-3" />
            <span className="text-gray-600 dark:text-gray-400">Loading message history...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (paginatedMessages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No messages found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredMessages.length === 0 && messages.length > 0 
                ? 'No messages match your current filters. Try adjusting your search criteria.'
                : 'No WhatsApp messages have been sent yet.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        
        {/* Results Summary */}
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, totalMessages)} of {totalMessages} messages
              {filteredMessages.length !== messages.length && (
                <span className="ml-2 text-blue-600">
                  (filtered from {messages.length} total)
                </span>
              )}
            </div>
            
            {/* Pagination */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={!hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Message Preview</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMessages.map((message) => (
                <TableRow key={message.entity_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  
                  {/* Status */}
                  <TableCell>
                    {getStatusBadge(message.status)}
                  </TableCell>
                  
                  {/* Recipient */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-sm">
                          {message.entity_name || message.to_customer_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />
                        <span className="font-mono">
                          {formatPhoneNumber(message.to_phone)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Template */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-mono text-sm">
                        {message.template_name}
                      </div>
                      {message.hera_template_id && (
                        <div className="text-xs text-gray-500">
                          MSP ID: {message.hera_template_id}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Message Preview */}
                  <TableCell>
                    <div className="max-w-xs">
                      {message.message_body ? (
                        <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {message.message_body.substring(0, 60)}
                          {message.message_body.length > 60 && '...'}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic">
                          Template message
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Sent At */}
                  <TableCell>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {message.created_at ? (
                        <>
                          <div>
                            {new Date(message.created_at).toLocaleDateString('en-AE')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleTimeString('en-AE', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </>
                      ) : (
                        'Unknown'
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Show message details dialog
                        console.log('View message details:', message)
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TableCell>
                  
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Bottom Pagination */}
        {(hasNextPage || hasPrevPage) && (
          <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {Math.floor(startIndex / (filters.limit || 50)) + 1} of {Math.ceil(totalMessages / (filters.limit || 50))}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={!hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}