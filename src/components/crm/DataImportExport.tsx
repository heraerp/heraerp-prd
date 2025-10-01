/**
 * HERA CRM Data Import/Export Component
 * Professional data migration tools for customer onboarding
 *
 * Project Manager Task: Data Import/Export UI
 */

'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Database,
  Users,
  Target,
  CheckSquare,
  Loader2,
  Eye,
  Settings,
  Filter,
  Calendar,
  RefreshCw,
  ArrowRight,
  FileSpreadsheet,
  FileText as FileJson,
  File as FileCsv
} from 'lucide-react'
import {
  createImportExportService,
  ImportTemplate,
  ImportResult,
  ExportOptions
} from '@/lib/crm/import-export-service'

interface DataImportExportProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  onImportComplete?: (result: ImportResult) => void
}

export function DataImportExport({
  isOpen,
  onClose,
  organizationId,
  onImportComplete
}: DataImportExportProps) {
  const [importExportService] = useState(() => createImportExportService(organizationId))
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [importEntityType, setImportEntityType] = useState<'contact' | 'opportunity' | 'task'>(
    'contact'
  )
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [parsedData, setParsedData] = useState<any[] | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Export state
  const [exportEntityType, setExportEntityType] = useState<
    'contact' | 'opportunity' | 'task' | 'all'
  >('contact')
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'excel'>('csv')
  const [isExporting, setIsExporting] = useState(false)
  const [exportFilters, setExportFilters] = useState({
    dateRange: { start: '', end: '' },
    status: [] as string[],
    includeNotes: true,
    includeHistory: false
  })

  // Get available import templates
  const importTemplates = importExportService.getImportTemplates()

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setImportResult(null)
    setShowPreview(false)

    // Parse file for preview
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      parseCSVFile(file)
    } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
      parseJSONFile(file)
    }
  }

  // Parse CSV file
  const parseCSVFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const csvText = e.target?.result as string
        const parsed = importExportService.parseCSV(csvText)
        setParsedData(parsed.slice(0, 10)) // Preview first 10 rows
      } catch (error) {
        console.error('Error parsing CSV:', error)
        alert('Error parsing CSV file')
      }
    }
    reader.readAsText(file)
  }

  // Parse JSON file
  const parseJSONFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const jsonText = e.target?.result as string
        const parsed = JSON.parse(jsonText)
        setParsedData(Array.isArray(parsed) ? parsed.slice(0, 10) : [parsed])
      } catch (error) {
        console.error('Error parsing JSON:', error)
        alert('Error parsing JSON file')
      }
    }
    reader.readAsText(file)
  }

  // Handle data import
  const handleImport = async () => {
    if (!selectedFile || !parsedData) return

    setIsImporting(true)
    setImportProgress(0)
    setImportResult(null)

    try {
      // Get full data for import
      const reader = new FileReader()
      reader.onload = async e => {
        try {
          let fullData: any[]

          if (selectedFile.name.endsWith('.csv')) {
            const csvText = e.target?.result as string
            fullData = importExportService.parseCSV(csvText)
          } else {
            const jsonText = e.target?.result as string
            fullData = JSON.parse(jsonText)
            if (!Array.isArray(fullData)) fullData = [fullData]
          }

          // Get selected template
          const template = selectedTemplate
            ? importTemplates.find(t => t.id === selectedTemplate)
            : undefined

          // Simulate progress
          const progressInterval = setInterval(() => {
            setImportProgress(prev => Math.min(prev + 5, 90))
          }, 200)

          let result: ImportResult

          // Import based on entity type
          if (importEntityType === 'contact') {
            result = await importExportService.importContacts(fullData, template, {
              skipDuplicates: true,
              updateExisting: false
            })
          } else if (importEntityType === 'opportunity') {
            result = await importExportService.importOpportunities(fullData, template, {
              linkToContacts: true
            })
          } else {
            // For tasks, use contact import logic for now
            result = await importExportService.importContacts(fullData, template)
          }

          clearInterval(progressInterval)
          setImportProgress(100)
          setImportResult(result)
          onImportComplete?.(result)
        } catch (error) {
          console.error('Import error:', error)
          setImportResult({
            success: false,
            totalRecords: 0,
            importedRecords: 0,
            failedRecords: 0,
            errors: [{ row: 0, error: error instanceof Error ? error.message : 'Import failed' }],
            importedIds: []
          })
        } finally {
          setIsImporting(false)
        }
      }
      reader.readAsText(selectedFile)
    } catch (error) {
      console.error('Import error:', error)
      setIsImporting(false)
    }
  }

  // Handle data export
  const handleExport = async () => {
    setIsExporting(true)

    try {
      const options: ExportOptions = {
        entityType: exportEntityType,
        format: exportFormat,
        filters: {
          dateRange:
            exportFilters.dateRange.start && exportFilters.dateRange.end
              ? exportFilters.dateRange
              : undefined,
          status: exportFilters.status.length > 0 ? exportFilters.status : undefined
        }
      }

      const result = await importExportService.exportData(options)

      if (result.success && result.data && result.filename) {
        // Create download link
        const blob = new Blob([result.data], {
          type: exportFormat === 'json' ? 'application/json' : 'text/csv'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        a.click()
        URL.revokeObjectURL(url)
      } else {
        alert(result.error || 'Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data Import/Export
              <Badge variant="outline" className="ml-2">
                Customer Migration Tools
              </Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 flex-1 overflow-y-auto">
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Data
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </TabsTrigger>
            </TabsList>

            {/* Import Tab */}
            <TabsContent value="import" className="space-y-6">
              {/* Import Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Import Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Entity Type */}
                    <div>
                      <Label>Data Type</Label>
                      <Select
                        value={importEntityType}
                        onValueChange={value => setImportEntityType(value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contact">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Contacts
                            </div>
                          </SelectItem>
                          <SelectItem value="opportunity">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Opportunities
                            </div>
                          </SelectItem>
                          <SelectItem value="task">
                            <div className="flex items-center gap-2">
                              <CheckSquare className="h-4 w-4" />
                              Tasks
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Template Selection */}
                    <div>
                      <Label>Import Template</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Custom/No Template
                            </div>
                          </SelectItem>
                          {importTemplates
                            .filter(t => t.entityType === importEntityType)
                            .map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                <div className="flex items-center gap-2">
                                  <Database className="h-4 w-4" />
                                  {template.name}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* File Upload */}
                    <div>
                      <Label>Select File</Label>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full justify-start"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {selectedFile ? selectedFile.name : 'Choose CSV/JSON file'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Template Info */}
                  {selectedTemplate && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-blue-800 mb-2">
                          {importTemplates.find(t => t.id === selectedTemplate)?.name}
                        </h4>
                        <p className="text-sm text-primary mb-2">
                          Pre-configured for{' '}
                          {importTemplates.find(t => t.id === selectedTemplate)?.sourceSystem} data
                        </p>
                        <div className="text-xs text-primary">
                          <strong>Field Mappings:</strong>{' '}
                          {importTemplates
                            .find(t => t.id === selectedTemplate)
                            ?.fieldMappings.map(m => `${m.sourceField} → ${m.targetField}`)
                            .join(', ')}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Data Preview */}
              {parsedData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Data Preview ({parsedData.length} rows shown)
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        variant="outline"
                      >
                        {showPreview ? 'Hide' : 'Show'} Preview
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  {showPreview && (
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              {parsedData[0] &&
                                Object.keys(parsedData[0]).map(key => (
                                  <th key={key} className="text-left p-2 font-medium bg-muted">
                                    {key}
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {parsedData.map((row, idx) => (
                              <tr key={idx} className="border-b hover:bg-muted">
                                {Object.values(row).map((value, cellIdx) => (
                                  <td key={cellIdx} className="p-2 border-r max-w-32 truncate">
                                    {String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Import Progress */}
              {isImporting && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      <span className="text-blue-800 font-medium">Importing data...</span>
                    </div>
                    <Progress value={importProgress} className="w-full" />
                  </CardContent>
                </Card>
              )}

              {/* Import Results */}
              {importResult && (
                <Card
                  className={`border ${importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {importResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      Import Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-100">
                          {importResult.totalRecords}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Records</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {importResult.importedRecords}
                        </div>
                        <div className="text-sm text-muted-foreground">Imported</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {importResult.failedRecords}
                        </div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </div>
                    </div>

                    {/* Error Details */}
                    {importResult.errors.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-800 mb-2">
                          Import Errors ({importResult.errors.length})
                        </h4>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {importResult.errors.slice(0, 10).map((error, idx) => (
                            <div
                              key={idx}
                              className="text-sm p-2 bg-red-100 border border-red-200 rounded"
                            >
                              <strong>Row {error.row}:</strong> {error.error}
                              {error.field && (
                                <span className="text-red-600"> (Field: {error.field})</span>
                              )}
                            </div>
                          ))}
                          {importResult.errors.length > 10 && (
                            <div className="text-sm text-red-600">
                              ... and {importResult.errors.length - 10} more errors
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Import Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Supported formats: CSV, JSON • Maximum file size: 10MB
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile || !parsedData || isImporting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Start Import
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Export Tab */}
            <TabsContent value="export" className="space-y-6">
              {/* Export Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Export Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Data Type */}
                    <div>
                      <Label>Data Type</Label>
                      <Select
                        value={exportEntityType}
                        onValueChange={value => setExportEntityType(value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              All Data
                            </div>
                          </SelectItem>
                          <SelectItem value="contact">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Contacts Only
                            </div>
                          </SelectItem>
                          <SelectItem value="opportunity">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Opportunities Only
                            </div>
                          </SelectItem>
                          <SelectItem value="task">
                            <div className="flex items-center gap-2">
                              <CheckSquare className="h-4 w-4" />
                              Tasks Only
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Format */}
                    <div>
                      <Label>Export Format</Label>
                      <Select
                        value={exportFormat}
                        onValueChange={value => setExportFormat(value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">
                            <div className="flex items-center gap-2">
                              <FileCsv className="h-4 w-4" />
                              CSV Format
                            </div>
                          </SelectItem>
                          <SelectItem value="json">
                            <div className="flex items-center gap-2">
                              <FileJson className="h-4 w-4" />
                              JSON Format
                            </div>
                          </SelectItem>
                          <SelectItem value="excel" disabled>
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4" />
                              Excel (Coming Soon)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Range */}
                    <div>
                      <Label>Date Range (Optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={exportFilters.dateRange.start}
                          onChange={e =>
                            setExportFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, start: e.target.value }
                            }))
                          }
                          className="text-xs"
                        />
                        <Input
                          type="date"
                          value={exportFilters.dateRange.end}
                          onChange={e =>
                            setExportFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, end: e.target.value }
                            }))
                          }
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Export Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Export includes all organization data with applied filters
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
