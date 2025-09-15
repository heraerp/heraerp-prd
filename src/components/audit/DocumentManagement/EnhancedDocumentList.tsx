'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DocumentUpload } from './DocumentUpload'
import {
  FileText,
  Search,
  Filter,
  Upload,
  Download,
  Eye,
  MessageSquare,
  Check,
  X,
  Clock,
  AlertCircle,
  Paperclip,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

interface DocumentFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploaded_at: string
  uploaded_by: string
}

interface EnhancedDocument {
  id: string
  organization_id: string
  client_id: string
  requisition_id: string
  document_code: string
  document_name: string
  category: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  priority: 'critical' | 'high' | 'medium' | 'low'
  status:
    | 'pending'
    | 'received'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'resubmission_required'
  due_date: string
  received_date?: string
  reviewed_date?: string
  approved_date?: string
  files: DocumentFile[]
  review_notes?: string
  rejection_reason?: string
  version: number
  created_at: string
  updated_at: string
}

interface EnhancedDocumentListProps {
  clientId: string
  clientName: string
  organizationId: string
  requisitionId?: string
}

export function EnhancedDocumentList({
  clientId,
  clientName,
  organizationId,
  requisitionId
}: EnhancedDocumentListProps) {
  const [documents, setDocuments] = useState<EnhancedDocument[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<EnhancedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedDocument, setSelectedDocument] = useState<EnhancedDocument | null>(null)
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set())
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    received: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    overdue: 0,
    completion_percentage: 0
  })

  // Fetch documents
  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        action: 'search_documents',
        organization_id: organizationId,
        client_id: clientId,
        ...(requisitionId && { requisition_id: requisitionId })
      })

      const response = await fetch(`/api/v1/audit/documents?${params}`)
      const result = await response.json()

      if (result.success) {
        setDocuments(result.data || [])
      } else {
        console.error('Failed to fetch documents:', result.message)
        setDocuments([])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams({
        action: 'get_statistics',
        organization_id: organizationId,
        client_id: clientId
      })

      const response = await fetch(`/api/v1/audit/documents?${params}`)
      const result = await response.json()

      if (result.success) {
        setStatistics(result.data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchDocuments()
    fetchStatistics()
  }, [clientId, organizationId, requisitionId])

  // Apply filters
  useEffect(() => {
    let filtered = documents

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        doc =>
          doc.document_name.toLowerCase().includes(search) ||
          doc.document_code.toLowerCase().includes(search) ||
          doc.review_notes?.toLowerCase().includes(search)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(doc => doc.category === categoryFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(doc => doc.priority === priorityFilter)
    }

    setFilteredDocuments(filtered)
  }, [documents, searchTerm, statusFilter, categoryFilter, priorityFilter])

  // Update document status
  const updateDocumentStatus = async (
    documentId: string,
    status: string,
    notes?: string,
    rejectionReason?: string
  ) => {
    try {
      const response = await fetch('/api/v1/audit/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_document_status',
          data: {
            document_id: documentId,
            status,
            organization_id: organizationId,
            review_notes: notes,
            rejection_reason: rejectionReason,
            received_date: status === 'received' ? new Date().toISOString() : undefined
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        await fetchDocuments()
        await fetchStatistics()
      } else {
        console.error('Failed to update document status:', result.message)
      }
    } catch (error) {
      console.error('Error updating document status:', error)
    }
  }

  // Handle file upload completion
  const handleFilesUpdate = async (documentId: string, files: DocumentFile[]) => {
    // Update the local state immediately
    setDocuments(prevDocs =>
      prevDocs.map(doc =>
        doc.id === documentId
          ? {
              ...doc,
              files,
              status: files.length > 0 && doc.status === 'pending' ? 'received' : doc.status
            }
          : doc
      )
    )

    // Refresh data from server
    await fetchDocuments()
    await fetchStatistics()
  }

  // Toggle document expansion
  const toggleDocumentExpansion = (documentId: string) => {
    setExpandedDocuments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(documentId)) {
        newSet.delete(documentId)
      } else {
        newSet.add(documentId)
      }
      return newSet
    })
  }

  // Get status styling
  const getStatusStyling = (status: string) => {
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

  const getPriorityStyling = (priority: string) => {
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

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'pending' && new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading documents...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-primary mb-1">Total Documents</p>
                <p className="text-2xl font-bold text-blue-900">{statistics.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 mb-1">Approved</p>
                <p className="text-2xl font-bold text-green-900">{statistics.approved}</p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{statistics.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">Overdue</p>
                <p className="text-2xl font-bold text-red-900">{statistics.overdue}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Overall Progress</h3>
            <span className="text-2xl font-bold text-primary">
              {statistics.completion_percentage}%
            </span>
          </div>
          <Progress value={statistics.completion_percentage} className="w-full h-3" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>{statistics.approved} completed</span>
            <span>{statistics.total - statistics.approved} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
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

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="A">A - Company Formation</SelectItem>
                <SelectItem value="B">B - Financial Documents</SelectItem>
                <SelectItem value="C">C - Audit Planning</SelectItem>
                <SelectItem value="D">D - Audit Execution</SelectItem>
                <SelectItem value="E">E - VAT Documentation</SelectItem>
                <SelectItem value="F">F - Related Parties</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                fetchDocuments()
                fetchStatistics()
              }}
              className="px-3"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.map(document => {
          const isExpanded = expandedDocuments.has(document.id)
          const overdue = isOverdue(document.due_date, document.status)

          return (
            <Card
              key={document.id}
              className={`border-0 shadow-lg ${overdue ? 'border-l-4 border-red-500' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {document.category}.{document.document_code.split('.')[1] || '1'}
                      </Badge>
                      <Badge className={getPriorityStyling(document.priority)} variant="outline">
                        {document.priority}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                        {document.document_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mb-2">
                        Due: {new Date(document.due_date).toLocaleDateString()}
                        {overdue && (
                          <span className="text-red-600 font-medium ml-2">(OVERDUE)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusStyling(document.status)}>
                          {document.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {document.files.length > 0 && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Paperclip className="w-4 h-4" />
                            <span>
                              {document.files.length} file{document.files.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Action Buttons */}
                    {document.status === 'received' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateDocumentStatus(document.id, 'under_review')}
                      >
                        Start Review
                      </Button>
                    )}

                    {document.status === 'under_review' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => updateDocumentStatus(document.id, 'approved')}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() =>
                            updateDocumentStatus(
                              document.id,
                              'rejected',
                              undefined,
                              'Requires clarification'
                            )
                          }
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDocumentExpansion(document.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <Tabs defaultValue="files" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="files">Files</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="files" className="mt-4">
                      <DocumentUpload
                        documentId={document.id}
                        documentName={document.document_name}
                        organizationId={organizationId}
                        currentFiles={document.files}
                        onFilesUpdate={files => handleFilesUpdate(document.id, files)}
                        onStatusChange={status => updateDocumentStatus(document.id, status)}
                      />
                    </TabsContent>

                    <TabsContent value="details" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              Document Code
                            </label>
                            <p className="text-sm text-gray-900 font-mono">
                              {document.document_code}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Category</label>
                            <p className="text-sm text-gray-900">
                              {document.category} -{' '}
                              {document.category === 'A'
                                ? 'Company Formation'
                                : document.category === 'B'
                                  ? 'Financial Documents'
                                  : 'Other'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Priority</label>
                            <Badge
                              className={getPriorityStyling(document.priority)}
                              variant="outline"
                            >
                              {document.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Due Date</label>
                            <p className="text-sm text-gray-900">
                              {new Date(document.due_date).toLocaleDateString()}
                            </p>
                          </div>
                          {document.received_date && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">
                                Received Date
                              </label>
                              <p className="text-sm text-gray-900">
                                {new Date(document.received_date).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-gray-700">Version</label>
                            <p className="text-sm text-gray-900">v{document.version}</p>
                          </div>
                        </div>
                      </div>

                      {document.review_notes && (
                        <div className="mt-4">
                          <label className="text-sm font-medium text-gray-700">Review Notes</label>
                          <div className="mt-1 p-3 bg-muted rounded-lg">
                            <p className="text-sm text-gray-900">{document.review_notes}</p>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-muted-foreground">
                            Created: {new Date(document.created_at).toLocaleString()}
                          </span>
                        </div>
                        {document.received_date && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-muted-foreground">
                              Received: {new Date(document.received_date).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {document.reviewed_date && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-muted-foreground">
                              Reviewed: {new Date(document.reviewed_date).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {document.approved_date && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span className="text-muted-foreground">
                              Approved: {new Date(document.approved_date).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No documents have been created yet'}
          </p>
        </div>
      )}
    </div>
  )
}
