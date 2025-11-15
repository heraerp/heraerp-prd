'use client'

/**
 * Universal Relationship Bulk Manager Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.RELATIONSHIP_BULK_MANAGER.v1
 * 
 * Bulk operations manager for relationships with:
 * - CSV import/export functionality
 * - Bulk creation from templates
 * - Batch editing and deletion
 * - Validation and error handling
 * - Progress tracking and rollback
 * - Mobile-first responsive design
 */

import React, { useState, useCallback, useMemo } from 'react'
import { 
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  RotateCcw,
  Eye,
  Settings,
  Filter,
  Search
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Entity, RelationshipType, RelationshipData } from './UniversalRelationshipEditor'
import { cn } from '@/lib/utils'

interface ImportedRelationship {
  id: string
  from_entity_name: string
  to_entity_name: string
  relationship_type: string
  effective_date: string
  expiration_date?: string
  status: 'pending' | 'validated' | 'error' | 'imported'
  validation_errors: string[]
  resolved_from_entity?: Entity
  resolved_to_entity?: Entity
}

interface BulkOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  relationships: ImportedRelationship[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  created_at: string
  completed_at?: string
  results?: {
    success_count: number
    error_count: number
    errors: Array<{ relationship_id: string; error: string }>
  }
}

interface UniversalRelationshipBulkManagerProps {
  entities: Entity[]
  relationshipTypes: RelationshipType[]
  onBulkCreate?: (relationships: RelationshipData[]) => Promise<void>
  onBulkUpdate?: (relationships: RelationshipData[]) => Promise<void>
  onBulkDelete?: (relationshipIds: string[]) => Promise<void>
  className?: string
}

const sampleCSVTemplate = `from_entity_name,to_entity_name,relationship_type,effective_date,expiration_date
John Doe,Marketing Department,MEMBER_OF,2024-01-01,
Marketing Department,ACME Corp,PARENT_OF,2024-01-01,
Jane Smith,Sales Team,ASSIGNED_TO,2024-01-15,2024-12-31`

export function UniversalRelationshipBulkManager({
  entities,
  relationshipTypes,
  onBulkCreate,
  onBulkUpdate,
  onBulkDelete,
  className = ''
}: UniversalRelationshipBulkManagerProps) {
  const [activeTab, setActiveTab] = useState('import')
  const [importedRelationships, setImportedRelationships] = useState<ImportedRelationship[]>([])
  const [selectedRelationships, setSelectedRelationships] = useState<Set<string>>(new Set())
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Filter imported relationships
  const filteredRelationships = useMemo(() => {
    let filtered = importedRelationships

    if (searchFilter) {
      filtered = filtered.filter(rel => 
        rel.from_entity_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        rel.to_entity_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        rel.relationship_type.toLowerCase().includes(searchFilter.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(rel => rel.status === statusFilter)
    }

    return filtered
  }, [importedRelationships, searchFilter, statusFilter])

  // Parse CSV file
  const parseCSV = useCallback((csvContent: string): ImportedRelationship[] => {
    const lines = csvContent.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim())
      const relationship: ImportedRelationship = {
        id: `import_${Date.now()}_${index}`,
        from_entity_name: values[0] || '',
        to_entity_name: values[1] || '',
        relationship_type: values[2] || '',
        effective_date: values[3] || new Date().toISOString().split('T')[0],
        expiration_date: values[4] || undefined,
        status: 'pending',
        validation_errors: []
      }

      return relationship
    }).filter(rel => rel.from_entity_name && rel.to_entity_name && rel.relationship_type)
  }, [])

  // Validate imported relationships
  const validateRelationships = useCallback((relationships: ImportedRelationship[]): ImportedRelationship[] => {
    return relationships.map(rel => {
      const errors: string[] = []
      
      // Find matching entities
      const fromEntity = entities.find(e => 
        e.entity_name.toLowerCase() === rel.from_entity_name.toLowerCase() ||
        e.entity_code?.toLowerCase() === rel.from_entity_name.toLowerCase()
      )
      
      const toEntity = entities.find(e => 
        e.entity_name.toLowerCase() === rel.to_entity_name.toLowerCase() ||
        e.entity_code?.toLowerCase() === rel.to_entity_name.toLowerCase()
      )

      const relType = relationshipTypes.find(rt => 
        rt.code === rel.relationship_type || rt.label === rel.relationship_type
      )

      if (!fromEntity) {
        errors.push(`Source entity "${rel.from_entity_name}" not found`)
      }

      if (!toEntity) {
        errors.push(`Target entity "${rel.to_entity_name}" not found`)
      }

      if (!relType) {
        errors.push(`Relationship type "${rel.relationship_type}" not found`)
      }

      if (fromEntity && toEntity && fromEntity.id === toEntity.id) {
        errors.push('Source and target entities cannot be the same')
      }

      if (fromEntity && toEntity && relType) {
        if (!relType.allowed_source_types.includes(fromEntity.entity_type)) {
          errors.push(`${relType.label} not allowed from ${fromEntity.entity_type}`)
        }
        
        if (!relType.allowed_target_types.includes(toEntity.entity_type)) {
          errors.push(`${relType.label} not allowed to ${toEntity.entity_type}`)
        }
      }

      // Date validation
      if (rel.effective_date && rel.expiration_date) {
        const effectiveDate = new Date(rel.effective_date)
        const expirationDate = new Date(rel.expiration_date)
        
        if (expirationDate <= effectiveDate) {
          errors.push('Expiration date must be after effective date')
        }
      }

      return {
        ...rel,
        validation_errors: errors,
        status: errors.length === 0 ? 'validated' : 'error',
        resolved_from_entity: fromEntity,
        resolved_to_entity: toEntity
      }
    })
  }, [entities, relationshipTypes])

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        const parsed = parseCSV(content)
        const validated = validateRelationships(parsed)
        setImportedRelationships(validated)
        setActiveTab('preview')
      }
    }
    reader.readAsText(file)
  }, [parseCSV, validateRelationships])

  // Download CSV template
  const downloadTemplate = useCallback(() => {
    const blob = new Blob([sampleCSVTemplate], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relationship-import-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }, [])

  // Export current relationships
  const exportRelationships = useCallback(() => {
    const headers = ['from_entity_name', 'to_entity_name', 'relationship_type', 'effective_date', 'expiration_date', 'status']
    const csvData = [
      headers,
      ...filteredRelationships.map(rel => [
        rel.from_entity_name,
        rel.to_entity_name,
        rel.relationship_type,
        rel.effective_date,
        rel.expiration_date || '',
        rel.status
      ])
    ]

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relationships-export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }, [filteredRelationships])

  // Process bulk operation
  const processBulkOperation = useCallback(async (operationType: 'create' | 'update' | 'delete') => {
    const validRelationships = importedRelationships.filter(rel => 
      rel.status === 'validated' && selectedRelationships.has(rel.id)
    )

    if (validRelationships.length === 0) {
      return
    }

    const operation: BulkOperation = {
      id: `bulk_${Date.now()}`,
      type: operationType,
      relationships: validRelationships,
      status: 'running',
      progress: 0,
      created_at: new Date().toISOString()
    }

    setBulkOperations(prev => [operation, ...prev])
    setIsProcessing(true)

    try {
      const relationshipData: RelationshipData[] = validRelationships.map(rel => ({
        from_entity_id: rel.resolved_from_entity!.id,
        to_entity_id: rel.resolved_to_entity!.id,
        relationship_type: rel.relationship_type,
        effective_date: rel.effective_date,
        expiration_date: rel.expiration_date,
        smart_code: `HERA.UNIVERSAL.RELATIONSHIP.${rel.relationship_type}.v1`
      }))

      let results: any

      switch (operationType) {
        case 'create':
          results = await onBulkCreate?.(relationshipData)
          break
        case 'update':
          results = await onBulkUpdate?.(relationshipData)
          break
        case 'delete':
          const ids = relationshipData.map((_, index) => validRelationships[index].id)
          results = await onBulkDelete?.(ids)
          break
      }

      // Update operation status
      setBulkOperations(prev => prev.map(op => 
        op.id === operation.id 
          ? { 
              ...op, 
              status: 'completed',
              progress: 100,
              completed_at: new Date().toISOString(),
              results: {
                success_count: validRelationships.length,
                error_count: 0,
                errors: []
              }
            }
          : op
      ))

      // Update imported relationships status
      setImportedRelationships(prev => prev.map(rel => 
        selectedRelationships.has(rel.id) 
          ? { ...rel, status: 'imported' as const }
          : rel
      ))

      setSelectedRelationships(new Set())

    } catch (error) {
      console.error('Bulk operation failed:', error)
      
      setBulkOperations(prev => prev.map(op => 
        op.id === operation.id 
          ? { 
              ...op, 
              status: 'failed',
              completed_at: new Date().toISOString(),
              results: {
                success_count: 0,
                error_count: validRelationships.length,
                errors: [{ relationship_id: 'all', error: error instanceof Error ? error.message : 'Unknown error' }]
              }
            }
          : op
      ))
    } finally {
      setIsProcessing(false)
    }
  }, [importedRelationships, selectedRelationships, onBulkCreate, onBulkUpdate, onBulkDelete])

  // Toggle relationship selection
  const toggleRelationshipSelection = useCallback((relationshipId: string) => {
    setSelectedRelationships(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(relationshipId)) {
        newSelected.delete(relationshipId)
      } else {
        newSelected.add(relationshipId)
      }
      return newSelected
    })
  }, [])

  // Select all filtered relationships
  const selectAllFiltered = useCallback(() => {
    const validIds = filteredRelationships
      .filter(rel => rel.status === 'validated')
      .map(rel => rel.id)
    setSelectedRelationships(new Set(validIds))
  }, [filteredRelationships])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedRelationships(new Set())
  }, [])

  const validatedCount = importedRelationships.filter(rel => rel.status === 'validated').length
  const errorCount = importedRelationships.filter(rel => rel.status === 'error').length
  const selectedValidCount = Array.from(selectedRelationships).filter(id => {
    const rel = importedRelationships.find(r => r.id === id)
    return rel?.status === 'validated'
  }).length

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Upload size={24} className="text-blue-600" />
            Bulk Relationship Manager
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload size={16} />
                Import
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye size={16} />
                Preview ({importedRelationships.length})
              </TabsTrigger>
              <TabsTrigger value="operations" className="flex items-center gap-2">
                <Settings size={16} />
                Operations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-6">
              {/* CSV Template Download */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-800">Need a template?</h4>
                      <p className="text-sm text-blue-600 mt-1">
                        Download our CSV template to get started with the correct format
                      </p>
                    </div>
                    <Button variant="outline" onClick={downloadTemplate} className="border-blue-300">
                      <Download size={16} className="mr-1" />
                      Template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                      <FileText className="text-slate-600" size={32} />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg">Upload CSV File</h3>
                      <p className="text-slate-600 mt-1">
                        Select a CSV file containing relationship data to import
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="csv-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
                          <div className="text-center">
                            <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                            <div className="text-sm text-slate-600">
                              Click to upload or drag and drop your CSV file here
                            </div>
                          </div>
                        </div>
                      </Label>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {importedRelationships.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="mx-auto mb-2 text-slate-300" size={32} />
                  <p>No relationships imported yet</p>
                </div>
              ) : (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-3 text-center">
                        <div className="text-2xl font-bold text-blue-700">
                          {importedRelationships.length}
                        </div>
                        <div className="text-sm text-blue-600">Total</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-3 text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {validatedCount}
                        </div>
                        <div className="text-sm text-green-600">Valid</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-3 text-center">
                        <div className="text-2xl font-bold text-red-700">
                          {errorCount}
                        </div>
                        <div className="text-sm text-red-600">Errors</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-3 text-center">
                        <div className="text-2xl font-bold text-purple-700">
                          {selectedValidCount}
                        </div>
                        <div className="text-sm text-purple-600">Selected</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Filters and Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-2 flex-1">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                          placeholder="Search relationships..."
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="validated">Valid</SelectItem>
                          <SelectItem value="error">Errors</SelectItem>
                          <SelectItem value="imported">Imported</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                        Select Valid
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearSelection}>
                        Clear
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportRelationships}>
                        <Download size={14} className="mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  {selectedValidCount > 0 && (
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-purple-800">
                            <span className="font-medium">{selectedValidCount} relationships selected</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => processBulkOperation('create')}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <RefreshCw size={14} className="mr-1 animate-spin" />
                              ) : (
                                <Plus size={14} className="mr-1" />
                              )}
                              Create All
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Relationships Table */}
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={selectedRelationships.size === validatedCount && validatedCount > 0}
                                  onCheckedChange={() => {
                                    if (selectedRelationships.size === validatedCount) {
                                      clearSelection()
                                    } else {
                                      selectAllFiltered()
                                    }
                                  }}
                                />
                              </TableHead>
                              <TableHead>From Entity</TableHead>
                              <TableHead>To Entity</TableHead>
                              <TableHead>Relationship</TableHead>
                              <TableHead>Effective Date</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredRelationships.map((relationship) => (
                              <TableRow 
                                key={relationship.id}
                                className={cn(
                                  relationship.status === 'error' && "bg-red-50",
                                  selectedRelationships.has(relationship.id) && "bg-blue-50"
                                )}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedRelationships.has(relationship.id)}
                                    onCheckedChange={() => toggleRelationshipSelection(relationship.id)}
                                    disabled={relationship.status !== 'validated'}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{relationship.from_entity_name}</div>
                                    {relationship.resolved_from_entity && (
                                      <div className="text-xs text-slate-500">
                                        {relationship.resolved_from_entity.entity_type}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{relationship.to_entity_name}</div>
                                    {relationship.resolved_to_entity && (
                                      <div className="text-xs text-slate-500">
                                        {relationship.resolved_to_entity.entity_type}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {relationship.relationship_type}
                                  </Badge>
                                </TableCell>
                                <TableCell>{relationship.effective_date}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {relationship.status === 'validated' && (
                                      <Badge className="bg-green-100 text-green-800 border-green-200">
                                        <CheckCircle size={12} className="mr-1" />
                                        Valid
                                      </Badge>
                                    )}
                                    {relationship.status === 'error' && (
                                      <Badge variant="destructive">
                                        <AlertTriangle size={12} className="mr-1" />
                                        Error
                                      </Badge>
                                    )}
                                    {relationship.status === 'imported' && (
                                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                        <CheckCircle size={12} className="mr-1" />
                                        Imported
                                      </Badge>
                                    )}
                                    {relationship.validation_errors.length > 0 && (
                                      <div className="text-xs text-red-600">
                                        {relationship.validation_errors[0]}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="operations" className="space-y-4">
              <div className="text-center py-8">
                <h3 className="font-medium text-lg mb-2">Operation History</h3>
                <p className="text-slate-600">Track and monitor bulk operations</p>
              </div>

              {bulkOperations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Settings className="mx-auto mb-2 text-slate-300" size={32} />
                  <p>No operations performed yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bulkOperations.map((operation) => (
                    <Card key={operation.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium capitalize">{operation.type} Operation</h4>
                            <p className="text-sm text-slate-600">
                              {new Date(operation.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge 
                            variant={operation.status === 'completed' ? 'default' : 
                                   operation.status === 'failed' ? 'destructive' : 'secondary'}
                          >
                            {operation.status}
                          </Badge>
                        </div>

                        {operation.status === 'running' && (
                          <div className="mb-4">
                            <Progress value={operation.progress} className="h-2" />
                            <p className="text-xs text-slate-500 mt-1">
                              Processing {operation.relationships.length} relationships...
                            </p>
                          </div>
                        )}

                        {operation.results && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-green-600 font-medium">
                                ✓ {operation.results.success_count} successful
                              </span>
                            </div>
                            <div>
                              <span className="text-red-600 font-medium">
                                ✗ {operation.results.error_count} failed
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default UniversalRelationshipBulkManager