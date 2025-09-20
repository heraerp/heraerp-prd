// ================================================================================
// WHATSAPP HISTORY PAGE - MESSAGE HISTORY
// Smart Code: HERA.UI.WHATSAPP.HISTORY.v1
// Production-ready message history with filters and status tracking
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  History, 
  Search, 
  Filter,
  Calendar,
  MessageCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { useWhatsappApi } from '@/lib/api/whatsapp'
import { HistoryTable } from '@/components/whatsapp/HistoryTable'
import { SendMessageDialog } from '@/components/whatsapp/SendMessageDialog'
import { MessageFilters } from '@/lib/schemas/whatsapp'

export default function WhatsAppHistoryPage() {
  const { currentOrganization } = useOrganization()
  const [sendDialogOpen, setSendDialogOpen] = React.useState(false)
  const [filters, setFilters] = React.useState<MessageFilters>({
    organization_id: currentOrganization?.id || '',
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    date_to: new Date().toISOString().split('T')[0], // Today
    limit: 50,
    offset: 0
  })

  const {
    messages,
    isMessagesLoading,
    messagesError,
    templates,
    config,
    refetch
  } = useWhatsappApi(currentOrganization?.id || '')

  // Update filters when organization changes
  React.useEffect(() => {
    if (currentOrganization?.id) {
      setFilters(prev => ({
        ...prev,
        organization_id: currentOrganization.id
      }))
    }
  }, [currentOrganization?.id])

  const handleFilterChange = (key: keyof MessageFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      organization_id: currentOrganization?.id || '',
      date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0],
      limit: 50,
      offset: 0
    })
  }

  const handleExport = () => {
    // TODO: Implement CSV export of message history
    console.log('Export messages:', filters)
  }

  const getStatusCounts = () => {
    const counts = {
      queued: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      total: messages.length
    }

    messages.forEach(message => {
      const status = message.status
      if (status in counts) {
        counts[status as keyof typeof counts]++
      }
    })

    return counts
  }

  const statusCounts = getStatusCounts()

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please select an organization to view WhatsApp message history.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <History className="h-7 w-7 text-green-600" />
            WhatsApp History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Message history and delivery tracking for {currentOrganization.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-violet-700 border-violet-300">
              {currentOrganization.name}
            </Badge>
            <Badge variant="outline">
              {statusCounts.total} message{statusCounts.total !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch.messages()}
            disabled={isMessagesLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isMessagesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={messages.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button
            onClick={() => setSendDialogOpen(true)}
            disabled={!config?.enabled}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>

      {/* WhatsApp Not Configured Warning */}
      {!config?.enabled && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            WhatsApp integration is not enabled. 
            <Button variant="link" className="px-2 h-auto font-normal underline">
              Configure WhatsApp settings
            </Button>
            to send and view messages.
          </AlertDescription>
        </Alert>
      )}

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</div>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-purple-600">Queued</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {statusCounts.queued}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-violet-600">Sent</div>
            <div className="text-2xl font-bold text-violet-900 dark:text-violet-100">
              {statusCounts.sent}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-green-600">Delivered</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {statusCounts.delivered}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-blue-600">Read</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {statusCounts.read}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-red-600">Failed</div>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {statusCounts.failed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            
            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="date_from">From Date</Label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_to">To Date</Label>
              <Input
                id="date_to"
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('status', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Filter */}
            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={filters.template_name || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('template_name', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.name} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Search */}
            <div className="space-y-2">
              <Label htmlFor="customer_code">Customer</Label>
              <Input
                id="customer_code"
                placeholder="Customer code..."
                value={filters.customer_code || ''}
                onChange={(e) => handleFilterChange('customer_code', e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      {messagesError ? (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Failed to load message history: {messagesError.message}
          </AlertDescription>
        </Alert>
      ) : (
        <HistoryTable
          messages={messages}
          isLoading={isMessagesLoading}
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}

      {/* Send Message Dialog */}
      <SendMessageDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        organizationId={currentOrganization.id}
        templates={templates}
      />
    </div>
  )
}