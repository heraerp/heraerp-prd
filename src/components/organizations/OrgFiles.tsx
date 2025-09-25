import { useState } from 'react'
import { useOrgDocuments, useAddDocumentUrl } from '@/hooks/use-organizations'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FileText,
  Download,
  ExternalLink,
  Upload,
  AlertCircle,
  Filter,
  File,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  Plus
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface OrgFilesProps {
  organizationId: string
}

export default function OrgFiles({ organizationId }: OrgFilesProps) {
  const [filterType, setFilterType] = useState<string>('all')
  const [showAddUrl, setShowAddUrl] = useState(false)
  const [urlForm, setUrlForm] = useState({
    document_name: '',
    file_url: '',
    description: '',
    document_type: 'other'
  })

  const { currentOrgId } = useOrgStore()
  const { data, isLoading, error } = useOrgDocuments(organizationId, {
    document_type: filterType !== 'all' ? filterType : undefined
  })
  const addDocumentMutation = useAddDocumentUrl(organizationId)

  const handleAddUrl = async () => {
    if (!urlForm.document_name || !urlForm.file_url) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      await addDocumentMutation.mutateAsync(urlForm)
      toast.success('Document added successfully')
      setShowAddUrl(false)
      setUrlForm({
        document_name: '',
        file_url: '',
        description: '',
        document_type: 'other'
      })
    } catch (error) {
      toast.error('Failed to add document')
    }
  }

  if (isLoading) {
    return <FilesSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load documents. Please try again.</AlertDescription>
      </Alert>
    )
  }

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return File
    if (mimeType.includes('image')) return FileImage
    if (mimeType.includes('pdf')) return FileText
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet
    if (mimeType.includes('zip') || mimeType.includes('archive')) return FileArchive
    return File
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const documentTypeColors = {
    report: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    contract: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    proposal: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    evidence: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
    case_study: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents & Files ({data?.total || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="report">Reports</SelectItem>
                  <SelectItem value="contract">Contracts</SelectItem>
                  <SelectItem value="proposal">Proposals</SelectItem>
                  <SelectItem value="evidence">Evidence</SelectItem>
                  <SelectItem value="case_study">Case Studies</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowAddUrl(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add URL
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data?.data && data.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.data.map(doc => {
                const FileIcon = getFileIcon(doc.mime_type)

                return (
                  <div
                    key={doc.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <FileIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" title={doc.document_name}>
                            {doc.document_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {doc.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {doc.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs capitalize',
                          documentTypeColors[doc.document_type as keyof typeof documentTypeColors]
                        )}
                      >
                        {doc.document_type.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open document"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={doc.file_url} download title="Download document">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      <p>
                        Uploaded by {doc.uploaded_by} {'\u2022'}{' '}
                        {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
                      </p>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {doc.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No documents found</p>
              <Button onClick={() => setShowAddUrl(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddUrl} onOpenChange={setShowAddUrl}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Document URL</DialogTitle>
            <DialogDescription>
              Add a link to an external document for this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document_name">Document Name*</Label>
              <Input
                id="document_name"
                value={urlForm.document_name}
                onChange={e => setUrlForm({ ...urlForm, document_name: e.target.value })}
                placeholder="e.g. Annual Report 2023"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file_url">Document URL*</Label>
              <Input
                id="file_url"
                value={urlForm.file_url}
                onChange={e => setUrlForm({ ...urlForm, file_url: e.target.value })}
                placeholder="https://example.com/document.pdf"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_type">Document Type</Label>
              <Select
                value={urlForm.document_type}
                onValueChange={value => setUrlForm({ ...urlForm, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="evidence">Evidence</SelectItem>
                  <SelectItem value="case_study">Case Study</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={urlForm.description}
                onChange={e => setUrlForm({ ...urlForm, description: e.target.value })}
                placeholder="Brief description of the document"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUrl(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUrl} disabled={addDocumentMutation.isPending}>
              Add Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function FilesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
