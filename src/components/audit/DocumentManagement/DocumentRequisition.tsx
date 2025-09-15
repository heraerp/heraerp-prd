'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Send,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageSquare,
  Calendar,
  Filter,
  Search,
  Plus,
  Mail,
  Paperclip,
  Building2
} from 'lucide-react'
import {
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
  type DocumentLineItem
} from '@/types/audit.types'
import { EnhancedDocumentList } from './EnhancedDocumentList'

interface DocumentRequisitionProps {
  clientId: string
  clientName: string
  auditYear: string
  organizationId: string
}

export function DocumentRequisition({
  clientId,
  clientName,
  auditYear,
  organizationId
}: DocumentRequisitionProps) {
  const [requisition, setRequisition] = useState({
    id: '',
    reference_number: `DOC-REQ-${auditYear}-001`,
    client_id: clientId,
    organization_id: organizationId,
    audit_year: auditYear,
    status: 'draft' as const,
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    workflow_state: 'requisition_preparation' as const
  })

  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('A')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Generate document line items from GSPU categories
  const [documentItems, setDocumentItems] = useState<DocumentLineItem[]>(() => {
    const items: DocumentLineItem[] = []
    Object.entries(DOCUMENT_CATEGORIES).forEach(([categoryKey, category]) => {
      category.items.forEach(item => {
        items.push({
          id: `doc_${categoryKey.toLowerCase()}_${item.code.toLowerCase().replace('.', '_')}`,
          requisition_id: requisition.id,
          document_code: item.code,
          document_name: item.name,
          category: categoryKey as DocumentCategory,
          subcategory: item.code.split('.')[1],
          priority: item.priority as any,
          status: 'pending',
          due_date: requisition.due_date,
          file_attachments: [],
          metadata: {
            document_type: category.title,
            retention_period_years: 7,
            validation_rules: []
          }
        })
      })
    })
    return items
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-muted text-gray-800'
      case 'received':
        return 'bg-blue-100 text-blue-800'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'resubmission_required':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-muted text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  const filteredItems = documentItems.filter(item => {
    const matchesSearch =
      item.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.document_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatistics = () => {
    const stats = {
      total_documents: documentItems.length,
      pending: documentItems.filter(item => item.status === 'pending').length,
      received: documentItems.filter(item => item.status === 'received').length,
      approved: documentItems.filter(item => item.status === 'approved').length,
      overdue: documentItems.filter(
        item => item.status === 'pending' && new Date(item.due_date) < new Date()
      ).length
    }

    const completion_percentage = Math.round((stats.approved / stats.total_documents) * 100)

    return { ...stats, completion_percentage }
  }

  const stats = getStatistics()

  const sendRequisition = async () => {
    setRequisition({ ...requisition, status: 'sent', workflow_state: 'client_notification' })
    // API call to send requisition
  }

  const updateDocumentStatus = (docId: string, status: DocumentLineItem['status']) => {
    setDocumentItems(items =>
      items.map(item =>
        item.id === docId
          ? {
              ...item,
              status,
              received_date: status === 'received' ? new Date().toISOString() : item.received_date
            }
          : item
      )
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Requisition</h2>
            <p className="text-muted-foreground">
              {clientName} - FY{auditYear}
            </p>
            <p className="text-xs text-muted-foreground font-mono">Org: {organizationId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={
              requisition.status === 'draft'
                ? 'bg-muted text-gray-800'
                : 'bg-blue-100 text-blue-800'
            }
          >
            {requisition.status.replace('_', ' ').toUpperCase()}
          </Badge>
          {requisition.status === 'draft' && (
            <Button
              onClick={sendRequisition}
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Requisition
            </Button>
          )}
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-primary mb-1">Total Documents</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total_documents}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-primary mb-1">Received</p>
                <p className="text-2xl font-bold text-blue-900">{stats.received}</p>
              </div>
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 mb-1">Approved</p>
                <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">Overdue</p>
                <p className="text-2xl font-bold text-red-900">{stats.overdue}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Completion</span>
            <span className="text-sm font-bold text-gray-900">{stats.completion_percentage}%</span>
          </div>
          <Progress value={stats.completion_percentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={value => setSelectedCategory(value as DocumentCategory)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                  <SelectItem key={key} value={key}>
                    Section {key}: {category.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Document Categories Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={value => setSelectedCategory(value as DocumentCategory)}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-6">
          {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {key}: {category.title.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(DOCUMENT_CATEGORIES).map(([categoryKey, category]) => (
          <TabsContent key={categoryKey} value={categoryKey} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    Section {categoryKey}: {category.title}
                  </span>
                  <Badge variant="outline">
                    {
                      documentItems.filter(
                        item => item.category === categoryKey && item.status === 'approved'
                      ).length
                    }{' '}
                    / {category.items.length} Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.items.map(item => {
                    const docItem = documentItems.find(d => d.document_code === item.code)
                    if (!docItem) return null

                    return (
                      <div
                        key={item.code}
                        className="border rounded-lg p-4 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-sm text-primary bg-blue-50 px-2 py-1 rounded">
                                {item.code}
                              </span>
                              <Badge className={getPriorityColor(item.priority)}>
                                {item.priority}
                              </Badge>
                              <Badge className={getStatusColor(docItem.status)}>
                                {docItem.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {new Date(docItem.due_date).toLocaleDateString()}
                              </span>
                              {docItem.received_date && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Received: {new Date(docItem.received_date).toLocaleDateString()}
                                </span>
                              )}
                              {docItem.file_attachments.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Paperclip className="w-3 h-3" />
                                  {docItem.file_attachments.length} files
                                </span>
                              )}
                            </div>
                            {docItem.remarks && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                <MessageSquare className="w-3 h-3 inline mr-1" />
                                {docItem.remarks}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Select
                              value={docItem.status}
                              onValueChange={status =>
                                updateDocumentStatus(
                                  docItem.id,
                                  status as DocumentLineItem['status']
                                )
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="received">Received</SelectItem>
                                <SelectItem value="under_review">Under Review</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="resubmission_required">Resubmission</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Enhanced Document Management */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Enhanced Document Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedDocumentList
            clientId={clientId}
            clientName={clientName}
            organizationId={organizationId}
            requisitionId={requisition.id}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Send Reminder
              </Button>
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
