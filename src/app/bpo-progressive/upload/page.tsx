'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { BPOManagementSidebar } from '@/components/bpo-progressive/BPOManagementSidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Upload, FileText, X, Check, AlertTriangle, Clock,
  DollarSign, Calendar, Building, Package, Sparkles,
  Plus, Trash2, Download, Eye, RefreshCw
} from 'lucide-react'
import { BPOPriority, BPOComplexity } from '@/lib/bpo/bpo-entities'

interface UploadedFile {
  id: string
  file: File
  preview: string
  status: 'pending' | 'processing' | 'success' | 'error'
  error?: string
}

interface InvoiceFormData {
  invoiceNumber: string
  vendorName: string
  invoiceDate: string
  dueDate: string
  totalAmount: string
  currency: string
  poNumber: string
  description: string
  priority: BPOPriority
  complexity: BPOComplexity
}

export default function BPOInvoiceUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: '',
    vendorName: '',
    invoiceDate: '',
    dueDate: '',
    totalAmount: '',
    currency: 'USD',
    poNumber: '',
    description: '',
    priority: 'medium',
    complexity: 'standard'
  })

  // File upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending'
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB max
    maxFiles: 10
  })

  // Remove uploaded file
  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  // Submit invoice
  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one invoice file')
      return
    }

    if (!formData.invoiceNumber || !formData.vendorName || !formData.totalAmount) {
      alert('Please fill in required fields: Invoice Number, Vendor Name, and Total Amount')
      return
    }

    setIsUploading(true)

    try {
      // Simulate file processing
      for (let i = 0; i < uploadedFiles.length; i++) {
        setUploadedFiles(prev => 
          prev.map(f => f.id === uploadedFiles[i].id ? { ...f, status: 'processing' } : f)
        )
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Simulate success/error
        const success = Math.random() > 0.1 // 90% success rate
        
        setUploadedFiles(prev => 
          prev.map(f => f.id === uploadedFiles[i].id ? { 
            ...f, 
            status: success ? 'success' : 'error',
            error: success ? undefined : 'Failed to process file'
          } : f)
        )
      }

      // Create invoice entity using HERA universal tables
      const invoiceEntity = {
        entity_type: 'bpo_invoice',
        entity_name: formData.invoiceNumber,
        entity_code: `INV-${Date.now()}`,
        status: 'submitted',
        organization_id: 'org-demo-client', // Would come from auth
        smart_code: 'HERA.BPO.INVOICE.SUBMITTED.v1',
        
        // Store in core_dynamic_data
        dynamic_data: {
          invoice_number: formData.invoiceNumber,
          vendor_name: formData.vendorName,
          invoice_date: formData.invoiceDate,
          due_date: formData.dueDate,
          total_amount: parseFloat(formData.totalAmount),
          currency: formData.currency,
          po_number: formData.poNumber,
          description: formData.description,
          priority: formData.priority,
          complexity: formData.complexity,
          submitted_date: new Date().toISOString(),
          attachments: uploadedFiles.map(f => f.file.name)
        }
      }

      console.log('Invoice submitted:', invoiceEntity)

      // Reset form
      setFormData({
        invoiceNumber: '',
        vendorName: '',
        invoiceDate: '',
        dueDate: '',
        totalAmount: '',
        currency: 'USD',
        poNumber: '',
        description: '',
        priority: 'medium',
        complexity: 'standard'
      })
      setUploadedFiles([])

      alert('Invoice submitted successfully! It has been added to the processing queue.')

    } catch (error) {
      console.error('Upload error:', error)
      alert('Error submitting invoice. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

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
                  Invoice Upload Center
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Head Office
                  </Badge>
                </h1>
                <p className="text-gray-600 mt-1">Submit invoices for BPO processing with secure file upload</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Upload Zone */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Upload className="w-6 h-6 text-blue-600" />
                Upload Invoice Documents
              </h2>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-700 mb-2">
                  {isDragActive ? 'Drop files here' : 'Drag & drop invoice files here'}
                </p>
                <p className="text-gray-500 mb-4">
                  or click to select files
                </p>
                <p className="text-sm text-gray-400">
                  Supports: PDF, JPG, PNG, XLSX, XLS • Max 10MB per file • Up to 10 files
                </p>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Uploaded Files</h3>
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{file.file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {file.status === 'pending' && <Clock className="w-5 h-5 text-gray-400" />}
                        {file.status === 'processing' && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />}
                        {file.status === 'success' && <Check className="w-5 h-5 text-green-500" />}
                        {file.status === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          disabled={file.status === 'processing'}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Invoice Details Form */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-green-600" />
                Invoice Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                    placeholder="INV-2024-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorName">Vendor Name *</Label>
                  <Input
                    id="vendorName"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                    placeholder="ABC Supply Company"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Invoice Date</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="totalAmount"
                      type="number"
                      step="0.01"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                      placeholder="1,250.00"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="hera-select-content">
                      <SelectItem className="hera-select-item" value="USD">USD - US Dollar</SelectItem>
                      <SelectItem className="hera-select-item" value="EUR">EUR - Euro</SelectItem>
                      <SelectItem className="hera-select-item" value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem className="hera-select-item" value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem className="hera-select-item" value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poNumber">PO Number</Label>
                  <Input
                    id="poNumber"
                    value={formData.poNumber}
                    onChange={(e) => setFormData({...formData, poNumber: e.target.value})}
                    placeholder="PO-2024-456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: BPOPriority) => setFormData({...formData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="hera-select-content">
                      <SelectItem className="hera-select-item" value="low">Low Priority</SelectItem>
                      <SelectItem className="hera-select-item" value="medium">Medium Priority</SelectItem>
                      <SelectItem className="hera-select-item" value="high">High Priority</SelectItem>
                      <SelectItem className="hera-select-item" value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complexity">Complexity</Label>
                  <Select value={formData.complexity} onValueChange={(value: BPOComplexity) => setFormData({...formData, complexity: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="hera-select-content">
                      <SelectItem className="hera-select-item" value="simple">Simple</SelectItem>
                      <SelectItem className="hera-select-item" value="standard">Standard</SelectItem>
                      <SelectItem className="hera-select-item" value="complex">Complex</SelectItem>
                      <SelectItem className="hera-select-item" value="expert">Expert Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Additional notes or special instructions for processing..."
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    invoiceNumber: '',
                    vendorName: '',
                    invoiceDate: '',
                    dueDate: '',
                    totalAmount: '',
                    currency: 'USD',
                    poNumber: '',
                    description: '',
                    priority: 'medium',
                    complexity: 'standard'
                  })
                  setUploadedFiles([])
                }}
              >
                Clear Form
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isUploading || uploadedFiles.length === 0}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Invoice
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}