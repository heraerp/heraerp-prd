/**
 * HERA CRM Document Manager Component
 * Complete file upload and document management interface
 *
 * Project Manager Task: File Upload & Document Management UI
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  File,
  FileText,
  Image,
  Download,
  Trash2,
  Eye,
  Edit,
  X,
  Plus,
  Search,
  Filter,
  Calendar,
  Paperclip,
  CheckCircle,
  AlertCircle,
  Loader2,
  FolderOpen,
  Tag,
  User
} from 'lucide-react'
import { createDocumentService, CRMDocument, DocumentFilter } from '@/lib/crm/document-service'
import { CRMContact } from '@/lib/crm/production-api'

interface DocumentManagerProps {
  contact?: CRMContact
  opportunityId?: string | number
  isOpen: boolean
  onClose: () => void
  organizationId: string
}

export function DocumentManager({
  contact,
  opportunityId,
  isOpen,
  onClose,
  organizationId
}: DocumentManagerProps) {
  const [documentService] = useState(() => createDocumentService(organizationId))
  const [documents, setDocuments] = useState<CRMDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<CRMDocument['category']>('other')
  const [documentTags, setDocumentTags] = useState('')
  const [documentNotes, setDocumentNotes] = useState('')
  const [isPublicDocument, setIsPublicDocument] = useState(false)

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showUploadForm, setShowUploadForm] = useState(false)

  // Load documents on mount
  useEffect(() => {
    if (isOpen) {
      loadDocuments()
    }
  }, [isOpen, contact?.id, opportunityId])

  const loadDocuments = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filter: DocumentFilter = {}
      if (contact?.id) filter.contactId = contact.id
      if (opportunityId) filter.opportunityId = opportunityId

      const docs = await documentService.getDocuments(filter)
      setDocuments(docs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  // File upload handling
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files.length) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(((i + 1) / files.length) * 100)

        const result = await documentService.uploadDocument(
          file,
          {
            contactId: contact?.id,
            opportunityId,
            category: selectedCategory,
            tags: documentTags
              .split(',')
              .map(t => t.trim())
              .filter(Boolean),
            notes: documentNotes,
            isPublic: isPublicDocument
          },
          'current_user@company.com' // TODO: Get from auth context
        )

        if (result.success && result.document) {
          setDocuments(prev => [...prev, result.document!])
        } else {
          throw new Error(result.error || 'Upload failed')
        }
      }

      // Reset form
      setShowUploadForm(false)
      setDocumentTags('')
      setDocumentNotes('')
      setSelectedCategory('other')
      setIsPublicDocument(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Drag and drop handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  // Document actions
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const success = await documentService.deleteDocument(documentId)
      if (success) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      } else {
        throw new Error('Failed to delete document')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  const handleDownload = async (document: CRMDocument) => {
    try {
      const downloadUrl = await documentService.getDownloadUrl(document.id)
      window.open(downloadUrl, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document')
    }
  }

  // File type icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-green-600" />
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-red-600" />
    if (mimeType.includes('word') || mimeType.includes('document'))
      return <FileText className="h-5 w-5 text-blue-600" />
    return <File className="h-5 w-5 text-gray-600" />
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.notes && doc.notes.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              Document Manager
              {contact && (
                <Badge variant="outline" className="ml-2">
                  {contact.name}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 flex-1 overflow-y-auto">
          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="ml-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <Card className="border-blue-200 bg-blue-50 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="text-blue-800 font-medium">Uploading documents...</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </CardContent>
            </Card>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="contract">Contracts</SelectItem>
                  <SelectItem value="proposal">Proposals</SelectItem>
                  <SelectItem value="presentation">Presentations</SelectItem>
                  <SelectItem value="invoice">Invoices</SelectItem>
                  <SelectItem value="correspondence">Correspondence</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
          </div>

          {/* Upload Form */}
          {showUploadForm && (
            <Card className="mb-6 border-dashed border-2 border-blue-200">
              <CardContent className="p-6">
                {/* Drag & Drop Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Support for PDF, DOC, XLS, PPT, images, and more. Max 10MB per file.
                  </p>
                  <Button variant="outline">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv"
                  onChange={e => e.target.files && handleFileUpload(e.target.files)}
                />

                {/* Upload Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={value => setSelectedCategory(value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="presentation">Presentation</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="correspondence">Correspondence</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={documentTags}
                      onChange={e => setDocumentTags(e.target.value)}
                      placeholder="proposal, q1, important"
                    />
                  </div>

                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublicDocument}
                      onChange={e => setIsPublicDocument(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="isPublic" className="text-sm">
                      Public document
                    </Label>
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={documentNotes}
                    onChange={e => setDocumentNotes(e.target.value)}
                    placeholder="Add notes about these documents..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Documents ({filteredDocuments.length})</span>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || categoryFilter !== 'all'
                      ? 'No documents match your search criteria.'
                      : 'Start by uploading your first document.'}
                  </p>
                  <Button onClick={() => setShowUploadForm(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map(document => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {getFileIcon(document.mimeType)}

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{document.originalName}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span>{formatFileSize(document.size)}</span>
                            <Badge variant="outline" className="text-xs">
                              {document.category}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(document.uploadedAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {document.uploadedBy}
                            </span>
                          </div>

                          {document.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <Tag className="h-3 w-3 text-gray-400" />
                              {document.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {document.notes && (
                            <p className="text-sm text-gray-600 mt-1 truncate">{document.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDocument(document.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
