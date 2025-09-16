'use client'

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic'
/**
 * HERA Financial Document Viewer (Similar to SAP FB03)
 * Smart Code: HERA.FIN.DOC.VIEWER.v1
 *
 * Display financial documents with organization and fiscal year filtering
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  FileText,
  Calendar,
  Building2,
  Filter,
  Download,
  Printer,
  Eye,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Hash,
  User,
  CalendarDays,
  Globe,
  RefreshCw,
  FileSpreadsheet,
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, parseDateSafe } from '@/lib/date-utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface Organization {
  id: string
  organization_name: string
  organization_code: string
}

interface FinancialDocument {
  id: string
  transaction_code: string
  transaction_type: string
  transaction_date: string
  total_amount: number
  currency: string
  status: string
  description?: string
  reference_number?: string
  smart_code?: string
  created_by?: string
  created_at: string
  fiscal_year?: string
  fiscal_period?: string
  posting_date?: string
  lines?: DocumentLine[]
  metadata?: any
}

interface DocumentLine {
  id: string
  line_number: number
  account_code?: string
  account_name?: string
  description?: string
  debit_amount?: number
  credit_amount?: number
  quantity?: number
  unit_amount?: number
  line_amount: number
  cost_center?: string
  profit_center?: string
}

interface SearchCriteria {
  organizationId: string
  documentNumber?: string
  fiscalYear?: string
  dateFrom?: string
  dateTo?: string
  documentType?: string
  minAmount?: number
  maxAmount?: number
  status?: string
}

export default function FinancialDocumentViewer() {
  const router = useRouter()
  const { user, organizations, currentOrganization, isAuthenticated, contextLoading } =
    useMultiOrgAuth()

  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    organizationId: currentOrganization?.id || '',
    fiscalYear: new Date().getFullYear().toString()
  })

  const [documents, setDocuments] = useState<FinancialDocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<FinancialDocument | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchMode, setSearchMode] = useState<'simple' | 'advanced'>('simple')
  const [sortField, setSortField] = useState<string>('transaction_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Update organization when context changes
  useEffect(() => {
    if (currentOrganization?.id) {
      setSearchCriteria(prev => ({
        ...prev,
        organizationId: currentOrganization.id
      }))
    }
  }, [currentOrganization])

  // Search for documents
  const searchDocuments = async () => {
    if (!searchCriteria.organizationId) {
      alert('Please select an organization')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('organizationId', searchCriteria.organizationId)

      if (searchCriteria.documentNumber) {
        params.append('documentNumber', searchCriteria.documentNumber)
      }
      if (searchCriteria.fiscalYear) {
        params.append('fiscalYear', searchCriteria.fiscalYear)
      }
      if (searchCriteria.dateFrom) {
        params.append('dateFrom', searchCriteria.dateFrom)
      }
      if (searchCriteria.dateTo) {
        params.append('dateTo', searchCriteria.dateTo)
      }
      if (searchCriteria.documentType) {
        params.append('documentType', searchCriteria.documentType)
      }
      if (searchCriteria.minAmount) {
        params.append('minAmount', searchCriteria.minAmount.toString())
      }
      if (searchCriteria.maxAmount) {
        params.append('maxAmount', searchCriteria.maxAmount.toString())
      }
      if (searchCriteria.status) {
        params.append('status', searchCriteria.status)
      }

      params.append('sortField', sortField)
      params.append('sortDirection', sortDirection)

      const response = await fetch(`/api/v1/finance/documents?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setDocuments(data.documents || [])
        if (data.documents?.length > 0) {
          setSelectedDocument(data.documents[0])
        }
      } else {
        console.error('Failed to fetch documents:', data.error)
        setDocuments([])
      }
    } catch (error) {
      console.error('Error searching documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  // Load document details
  const loadDocumentDetails = async (documentId: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/v1/finance/documents/${documentId}?organizationId=${searchCriteria.organizationId}`
      )
      const data = await response.json()

      if (data.success) {
        setSelectedDocument(data.document)
      }
    } catch (error) {
      console.error('Error loading document details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Get document type badge color
  const getDocumentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      journal_entry: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      sale: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      purchase: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      payment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      receipt: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      transfer: 'bg-muted text-gray-200 dark:bg-background dark:text-gray-200'
    }
    return colors[type] || 'bg-muted text-gray-200'
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'posted':
        return (
          <Badge className="bg-green-500 text-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Posted
          </Badge>
        )
      case 'draft':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground dark:text-muted-foreground">Loading financial documents...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the financial document viewer.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted dark:bg-background">
      <div className="max-w-[1600px] mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 dark:text-foreground flex items-center gap-2">
              <FileText className="w-7 h-7 text-primary" />
              Financial Document Display
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground text-sm mt-1">
              View and analyze financial documents across organizations and fiscal years
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/finance')}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Finance
            </Button>
          </div>
        </div>

        {/* Search Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Document Search
              </span>
              <Tabs value={searchMode} onValueChange={v => setSearchMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="simple">Simple</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Organization and Fiscal Year Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4" />
                    Organization
                  </Label>
                  <Select
                    value={searchCriteria.organizationId}
                    onValueChange={value =>
                      setSearchCriteria({ ...searchCriteria, organizationId: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.organization_name} ({org.organization_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Fiscal Year
                  </Label>
                  <Select
                    value={searchCriteria.fiscalYear}
                    onValueChange={value =>
                      setSearchCriteria({ ...searchCriteria, fiscalYear: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fiscal year" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2025, 2024, 2023, 2022, 2021].map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4" />
                    Document Number
                  </Label>
                  <Input
                    placeholder="e.g., JE-001234"
                    value={searchCriteria.documentNumber || ''}
                    onChange={e =>
                      setSearchCriteria({ ...searchCriteria, documentNumber: e.target.value })
                    }
                    onKeyPress={e => e.key === 'Enter' && searchDocuments()}
                  />
                </div>
              </div>

              {/* Advanced Search Options */}
              {searchMode === 'advanced' && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Document Type</Label>
                      <Select
                        value={searchCriteria.documentType || ''}
                        onValueChange={value =>
                          setSearchCriteria({ ...searchCriteria, documentType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All types</SelectItem>
                          <SelectItem value="journal_entry">Journal Entry</SelectItem>
                          <SelectItem value="sale">Sales Invoice</SelectItem>
                          <SelectItem value="purchase">Purchase Invoice</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="receipt">Receipt</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Date From</Label>
                      <Input
                        type="date"
                        value={searchCriteria.dateFrom || ''}
                        onChange={e =>
                          setSearchCriteria({ ...searchCriteria, dateFrom: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label>Date To</Label>
                      <Input
                        type="date"
                        value={searchCriteria.dateTo || ''}
                        onChange={e =>
                          setSearchCriteria({ ...searchCriteria, dateTo: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label>Min Amount</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={searchCriteria.minAmount || ''}
                        onChange={e =>
                          setSearchCriteria({
                            ...searchCriteria,
                            minAmount: parseFloat(e.target.value) || undefined
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>Max Amount</Label>
                      <Input
                        type="number"
                        placeholder="999,999.99"
                        value={searchCriteria.maxAmount || ''}
                        onChange={e =>
                          setSearchCriteria({
                            ...searchCriteria,
                            maxAmount: parseFloat(e.target.value) || undefined
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>Status</Label>
                      <Select
                        value={searchCriteria.status || ''}
                        onValueChange={value =>
                          setSearchCriteria({ ...searchCriteria, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All statuses</SelectItem>
                          <SelectItem value="posted">Posted</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchCriteria({
                      organizationId: currentOrganization?.id || '',
                      fiscalYear: new Date().getFullYear().toString()
                    })
                    setDocuments([])
                    setSelectedDocument(null)
                  }}
                >
                  Clear
                </Button>
                <Button onClick={searchDocuments} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {documents.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Document List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Documents ({documents.length})</span>
                  <Badge variant="secondary">{searchCriteria.fiscalYear}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {documents.map(doc => (
                      <div
                        key={doc.id}
                        className={cn(
                          'p-4 cursor-pointer hover:bg-muted dark:hover:bg-muted transition-colors',
                          selectedDocument?.id === doc.id && 'bg-blue-50 dark:bg-blue-900/20'
                        )}
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm text-gray-100 dark:text-foreground">
                              {doc.transaction_code}
                            </p>
                            <Badge
                              className={cn('mt-1', getDocumentTypeBadge(doc.transaction_type))}
                            >
                              {doc.transaction_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          {getStatusBadge(doc.status || 'draft')}
                        </div>

                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground dark:text-muted-foreground">
                            <CalendarDays className="w-3 h-3 inline mr-1" />
                            {formatDate(new Date(doc.transaction_date), 'dd MMM yyyy')}
                          </p>
                          <p className="font-medium text-gray-100 dark:text-foreground">
                            {formatCurrency(doc.total_amount, doc.currency)}
                          </p>
                          {doc.description && (
                            <p className="text-muted-foreground dark:text-muted-foreground truncate">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Document Details */}
            <Card className="lg:col-span-2">
              {selectedDocument ? (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Document Details
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Printer className="w-4 h-4 mr-1" />
                          Print
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="header" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="header">Header</TabsTrigger>
                        <TabsTrigger value="lines">Line Items</TabsTrigger>
                        <TabsTrigger value="metadata">Additional Info</TabsTrigger>
                      </TabsList>

                      <TabsContent value="header" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Document Number</Label>
                            <p className="font-medium">{selectedDocument.transaction_code}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Document Type</Label>
                            <Badge
                              className={getDocumentTypeBadge(selectedDocument.transaction_type)}
                            >
                              {selectedDocument.transaction_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Transaction Date</Label>
                            <p className="font-medium">
                              {formatDate(
                                new Date(selectedDocument.transaction_date),
                                'dd MMM yyyy'
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Posting Date</Label>
                            <p className="font-medium">
                              {selectedDocument.posting_date
                                ? formatDate(new Date(selectedDocument.posting_date), 'dd MMM yyyy')
                                : formatDate(
                                    new Date(selectedDocument.transaction_date),
                                    'dd MMM yyyy'
                                  )}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Total Amount</Label>
                            <p className="font-medium text-lg">
                              {formatCurrency(
                                selectedDocument.total_amount,
                                selectedDocument.currency
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <div className="mt-1">
                              {getStatusBadge(selectedDocument.status || 'draft')}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Reference Number</Label>
                            <p className="font-medium">
                              {selectedDocument.reference_number || '-'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Fiscal Period</Label>
                            <p className="font-medium">
                              {selectedDocument.fiscal_year ||
                                new Date(selectedDocument.transaction_date).getFullYear()}{' '}
                              /
                              {selectedDocument.fiscal_period ||
                                formatDate(new Date(selectedDocument.transaction_date), 'MM')}
                            </p>
                          </div>
                        </div>

                        {selectedDocument.description && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <p className="font-medium mt-1">{selectedDocument.description}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <Label className="text-xs text-muted-foreground">Created By</Label>
                            <p className="font-medium">{selectedDocument.created_by || 'System'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Created At</Label>
                            <p className="font-medium">
                              {formatDate(
                                new Date(selectedDocument.created_at),
                                'dd MMM yyyy HH:mm'
                              )}
                            </p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="lines" className="mt-4">
                        {selectedDocument.lines && selectedDocument.lines.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50px]">Line</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                                <TableHead>Cost Center</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedDocument.lines.map(line => (
                                <TableRow key={line.id}>
                                  <TableCell className="font-medium">{line.line_number}</TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{line.account_code}</p>
                                      <p className="text-xs text-muted-foreground">{line.account_name}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>{line.description || '-'}</TableCell>
                                  <TableCell className="text-right">
                                    {line.debit_amount
                                      ? formatCurrency(line.debit_amount, selectedDocument.currency)
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {line.credit_amount
                                      ? formatCurrency(
                                          line.credit_amount,
                                          selectedDocument.currency
                                        )
                                      : '-'}
                                  </TableCell>
                                  <TableCell>{line.cost_center || '-'}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="font-medium bg-muted dark:bg-muted">
                                <TableCell colSpan={3} className="text-right">
                                  Total
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(
                                    selectedDocument.lines.reduce(
                                      (sum, line) => sum + (line.debit_amount || 0),
                                      0
                                    ),
                                    selectedDocument.currency
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(
                                    selectedDocument.lines.reduce(
                                      (sum, line) => sum + (line.credit_amount || 0),
                                      0
                                    ),
                                    selectedDocument.currency
                                  )}
                                </TableCell>
                                <TableCell />
                              </TableRow>
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No line items available
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="metadata" className="mt-4">
                        <div className="space-y-4">
                          {selectedDocument.smart_code && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Smart Code</Label>
                              <p className="font-mono text-sm mt-1">
                                {selectedDocument.smart_code}
                              </p>
                            </div>
                          )}

                          {selectedDocument.metadata && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Additional Metadata</Label>
                              <pre className="mt-2 p-4 bg-muted dark:bg-muted rounded-lg text-xs overflow-auto">
                                {JSON.stringify(selectedDocument.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-[600px] text-muted-foreground">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Select a document to view details</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* No Results */}
        {documents.length === 0 && !loading && searchCriteria.organizationId && (
          <Card>
            <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No documents found</p>
                <p className="text-sm mt-2">Try adjusting your search criteria</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
