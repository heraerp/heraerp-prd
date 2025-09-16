'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader,
  TableRow
} from '@/src/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/src/components/ui/dropdown-menu'
import { FileText, Upload, Download, Search, Filter, MoreVertical, Eye, Trash2, Copy, FileCheck, FileX, FolderOpen, FileSpreadsheet, FileImage, File, Calendar, User,
  AlertCircle
} from 'lucide-react'
import { useFurnitureOrg } from '@/src/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/src/components/furniture/FurniturePageHeader'
import { universalApi } from '@/src/lib/universal-api'
import { useToast } from '@/src/hooks/use-toast'
import { format } from 'date-fns'
import { cn } from '@/src/lib/utils'


export const dynamic = 'force-dynamic'

interface Document {
  id: string
  entity_code: string
  entity_name: string
metadata: {
    file_name: string
    file_size: number
    file_type: string
    category: string tender_code?: string description?: string
    uploaded_by: string version?: number tags?: string[]
    is_template: boolean
  }
  created_at: string updated_at: string
}

const documentCategories = [ { value: 'tender_notice', label: 'Tender Notices' }, { value: 'bid_template', label: 'Bid Templates' }, { value: 'technical_docs', label: 'Technical Documents' }, { value: 'financial_docs', label: 'Financial Documents' }, { value: 'compliance', label: 'Compliance Certificates' }, { value: 'experience', label: 'Experience Certificates' }, { value: 'other', label: 'Other' }
] const getFileIcon = (fileType: string) => { if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" /> if (fileType.includes('sheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-500" /> if (fileType.includes('image')) return <FileImage className="h-5 w-5 text-[#37353E]" /> if (fileType.includes('word') || fileType.includes('doc')) return <FileText className="h-5 w-5 text-primary" /> return <File className="h-5 w-5 text-[#37353E]" />
}

const formatFileSize = (bytes: number) => { if (bytes < 1024) return bytes + ' B' if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB' return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Mock documents data
  const mockDocuments: Document[] = [ { id: '1', entity_code: 'DOC/001', entity_name: 'Standard Bid Template', metadata: { file_name: 'standard_bid_template_v3.docx', file_size: 245760, file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'bid_template', description: 'Standard template for furniture tender bids', uploaded_by: 'Admin', version: 3, tags: ['template', 'bid', 'standard'], is_template: true }, created_at: '2025-01-05T10:00:00Z', updated_at: '2025-01-10T14:30:00Z' }, { id: '2', entity_code: 'DOC/002', entity_name: 'Company Registration Certificate', metadata: { file_name: 'company_registration_2024.pdf', file_size: 1048576, file_type: 'application/pdf', category: 'compliance', description: 'Kerala Furniture Works registration certificate', uploaded_by: 'Admin', tags: ['compliance', 'registration'], is_template: false }, created_at: '2024-12-20T09:00:00Z', updated_at: '2024-12-20T09:00:00Z' }, { id: '3', entity_code: 'DOC/003', entity_name: 'GST Certificate', metadata: { file_name: 'gst_certificate.pdf', file_size: 524288, file_type: 'application/pdf', category: 'compliance', description: 'GST registration certificate', uploaded_by: 'Finance Team', tags: ['compliance', 'gst', 'tax'], is_template: false }, created_at: '2024-12-15T11:00:00Z', updated_at: '2024-12-15T11:00:00Z' }, { id: '4', entity_code: 'DOC/004', entity_name: 'Technical Capability Statement', metadata: { file_name: 'technical_capability_2025.pdf', file_size: 2097152, file_type: 'application/pdf', category: 'technical_docs', description: 'Detailed technical capabilities and machinery list', uploaded_by: 'Operations', tags: ['technical', 'capability'], is_template: false }, created_at: '2025-01-08T15:00:00Z', updated_at: '2025-01-08T15:00:00Z' }, { id: '5', entity_code: 'DOC/005', entity_name: 'Financial Statement Template', metadata: { file_name: 'financial_statement_template.xlsx', file_size: 327680, file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'financial_docs', description: 'Template for financial statements submission', uploaded_by: 'Finance Team', version: 2, tags: ['template', 'financial'], is_template: true }, created_at: '2025-01-02T10:00:00Z', updated_at: '2025-01-07T16:00:00Z' }
]

export default function DocumentsPage() {
  const { organizationId, orgLoading } = useFurnitureOrg()

const { toast } = useToast()

const [documents, setDocuments] = useState<Document[]>(mockDocuments)

const [searchTerm, setSearchTerm] = useState('')

const [activeTab, setActiveTab] = useState('all')

const [selectedCategory, setSelectedCategory] = useState('all')

const filteredDocuments = documents.filter(doc => {

const matchesSearch =doc.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.metadata.file_name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.metadata.description?.toLowerCase().includes(searchTerm.toLowerCase())

const matchesTab = activeTab === 'all' || (activeTab === 'templates' && doc.metadata.is_template) || (activeTab === 'documents' && !doc.metadata.is_template)

const matchesCategory = selectedCategory === 'all' || doc.metadata.category === selectedCategory return matchesSearch && matchesTab && matchesCategory })

const handleDelete = async (docId: string) => { setDocuments(prev => prev.filter(doc => doc.id !== docId)) toast({ title: 'Document Deleted', description: 'The document has been deleted.' }  )

const handleDuplicate = (doc: Document) => { const newDoc: Document = { ...doc, id: Date.now().toString(), entity_code: `DOC/${Date.now()}`, entity_name: `Copy of ${doc.entity_name}`, metadata: { ...doc.metadata, file_name: `copy_of_${doc.metadata.file_name}`, version: (doc.metadata.version || 1) + 1 }, created_at: new Date().toISOString(), updated_at: new Date().toISOString(  ) setDocuments(prev => [newDoc, ...prev]) toast({ title: 'Document Duplicated', description: 'A copy of the document has been created.' }  )

const categoryStats = documentCategories.map(cat => ({ ...cat, count: documents.filter(doc => doc.metadata.category === cat.value).length })) if (orgLoading) {
  return <div>Loading organization...</div> }

  return (
    <div> <FurniturePageHeader title="Document Management" subtitle="Centralized repository for all tender documents and templates" actions={ <Button> <Upload className="h-4 w-4 mr-2" /> Upload Document </Button> } /> 
        {/* Category Stats  */}
        <div className="bg-[var(--color-body)] grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6"> {categoryStats.map(cat => ( <Card key={cat.value} className={cn( 'p-4 cursor-pointer transition-colors', selectedCategory === cat.value && 'border-primary' )} onClick={() => setSelectedCategory(cat.value)}
        > <div className="bg-[var(--color-body)] text-center"> <p className="text-2xl font-bold">{cat.count}</p> <p className="text-sm text-[var(--color-text-secondary)]">{cat.label}</p> </div>
      </Card>
    ))} </div> 
        {/* Main Content  */}
        <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6"> <div className="bg-[var(--color-body)] flex items-center justify-between mb-6"> <div className="flex items-center gap-4"> <div className="relative w-96"> <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" /> <Input placeholder="Search documents..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-[var(--color-body)] pl-10" /> </div> <Button variant="outline" onClick={() => setSelectedCategory('all')}
        > <Filter className="h-4 w-4 mr-2" /> Clear Filters </Button> </div>
        <div className="flex items-center gap-2"> <Button variant="outline"> <Download className="h-4 w-4 mr-2" /> Export List </Button> </div> </div> <Tabs value={activeTab} onValueChange={setActiveTab}> <TabsList> <TabsTrigger value="all">All Documents ({documents.length})</TabsTrigger> <TabsTrigger value="templates"> Templates ({documents.filter(d => d.metadata.is_template).length}) </TabsTrigger> <TabsTrigger value="documents"> Documents ({documents.filter(d => !d.metadata.is_template).length}) </TabsTrigger> </TabsList> <TabsContent value={activeTab} className="bg-[var(--color-body)] mt-6"> {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">No documents found</div> )
          : (
            <Table> <TableHeader> <TableRow> <TableHead>Document</TableHead> <TableHead>Category</TableHead> <TableHead>Size</TableHead> <TableHead>Uploaded By</TableHead> <TableHead>Date</TableHead> <TableHead>Actions</TableHead> </TableRow> </TableHeader> <TableBody> {filteredDocuments.map(doc => ( <TableRow key={doc.id}> <TableCell> <div className="flex items-start gap-3"> {getFileIcon(doc.metadata.file_type)} <div> <p className="font-medium">{doc.entity_name}</p> <p className="text-sm text-[var(--color-text-secondary)]"> {doc.metadata.file_name} </p> {doc.metadata.description && ( <p className="text-sm text-[var(--color-text-secondary)] mt-1"> {doc.metadata.description} </p> )} <div className="flex gap-2 mt-2"> {doc.metadata.is_template && ( <Badge variant="secondary" className="bg-[var(--color-body)] text-xs">
          Template 
        </Badge> )} {doc.metadata.version && doc.metadata.version > 1 && ( <Badge variant="outline" className="bg-[var(--color-body)] text-xs">
          v{doc.metadata.version} 
        </Badge> )} {doc.metadata.tags?.map(tag => ( <Badge key={tag} variant="outline" className="bg-[var(--color-body)] text-xs">
          {tag} 
        </Badge> ))} </div> </div> </div> </TableCell> <TableCell> <Badge variant="outline">
          { documentCategories.find(cat => cat.value === doc.metadata.category) ?.label } 
        </Badge> </TableCell> <TableCell>{formatFileSize(doc.metadata.file_size)}</TableCell> <TableCell> <div className="bg-[var(--color-body)] flex items-center gap-2"> <User className="h-4 w-4 text-[#37353E]" /> {doc.metadata.uploaded_by} </div> </TableCell> <TableCell> <div className="text-sm"> <p>{format(new Date(doc.created_at), 'dd MMM yyyy')}</p> <p className="text-[var(--color-text-secondary)]"> {format(new Date(doc.created_at), 'HH:mm')} </p> </div> </TableCell> <TableCell> <DropdownMenu> <DropdownMenuTrigger asChild> <Button variant="ghost" size="sm"> <MoreVertical className="h-4 w-4" /> </Button> </DropdownMenuTrigger> <DropdownMenuContent align="end"> <DropdownMenuLabel>Actions</DropdownMenuLabel> <DropdownMenuSeparator /> <DropdownMenuItem> <Eye className="h-4 w-4 mr-2" /> View </DropdownMenuItem> <DropdownMenuItem> <Download className="h-4 w-4 mr-2" /> Download </DropdownMenuItem> <DropdownMenuItem onClick={() => handleDuplicate(doc)}
        > <Copy className="h-4 w-4 mr-2" /> Duplicate </DropdownMenuItem> <DropdownMenuSeparator /> <DropdownMenuItem onClick={() => handleDelete(doc.id)} className="bg-[var(--color-body)] text-red-600" > <Trash2 className="h-4 w-4 mr-2" /> Delete </DropdownMenuItem> </DropdownMenuContent> </DropdownMenu> </TableCell>
      </TableRow>
    ))} </TableBody>
      </Table>
    )} </TabsContent> </Tabs> </Card> 
        {/* Quick Actions  */}
        <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 mt-6"> <h3 className="bg-[var(--color-body)] text-lg font-semibold mb-4">Quick Actions</h3> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> <Button variant="outline" className="justify-start hover:bg-[var(--color-hover)]"> <FileCheck className="h-4 w-4 mr-2" /> Verify All Compliance Documents </Button>
        <Button variant="outline" className="justify-start hover:bg-[var(--color-hover)]"> <FolderOpen className="h-4 w-4 mr-2" /> Create Document Package for Bid </Button>
        <Button variant="outline" className="justify-start hover:bg-[var(--color-hover)]"> <AlertCircle className="h-4 w-4 mr-2" /> Check Document Expiry Dates </Button> </div> </Card>
      </div>
      )
}