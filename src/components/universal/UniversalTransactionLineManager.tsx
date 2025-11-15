'use client'

/**
 * Universal Transaction Line Manager Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.TRANSACTION_LINE_MANAGER.v1
 * 
 * Enterprise-grade line item management for transactions with:
 * - Drag & drop reordering
 * - Real-time calculations and totaling
 * - Bulk operations (add, edit, delete, duplicate)
 * - Mobile-first responsive design
 * - SAP Fiori UX patterns
 * - Advanced validation and error handling
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  GripVertical,
  Calculator,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Hash,
  Package,
  FileText,
  Search,
  Filter,
  Download,
  MoreHorizontal
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface TransactionLine {
  id: string
  line_number: number
  line_type: string
  description: string
  entity_id?: string
  entity_name?: string
  quantity: number
  unit_amount: number
  line_amount: number
  currency?: string
  account_code?: string
  cost_center?: string
  gl_account?: string
  tax_amount?: number
  tax_rate?: number
  smart_code: string
  metadata?: Record<string, any>
  validation_errors?: string[]
}

export interface LineManagerConfig {
  allow_reordering: boolean
  allow_bulk_operations: boolean
  required_fields: string[]
  default_line_type: string
  currency: string
  calculation_rules: {
    auto_calculate_line_amount: boolean
    include_tax_in_total: boolean
    round_to_decimal_places: number
  }
  line_types: Array<{
    code: string
    label: string
    icon: string
    required_fields: string[]
    default_values?: Record<string, any>
  }>
}

interface UniversalTransactionLineManagerProps {
  lines: TransactionLine[]
  config: LineManagerConfig
  onChange: (lines: TransactionLine[]) => void
  onValidation?: (errors: { line_id: string; errors: string[] }[]) => void
  readonly?: boolean
  className?: string
}

export function UniversalTransactionLineManager({
  lines,
  config,
  onChange,
  onValidation,
  readonly = false,
  className = ''
}: UniversalTransactionLineManagerProps) {
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set())
  const [editingLine, setEditingLine] = useState<TransactionLine | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [lineTypeFilter, setLineTypeFilter] = useState('all')
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.line_amount, 0)
    const tax_total = lines.reduce((sum, line) => sum + (line.tax_amount || 0), 0)
    const total = config.calculation_rules.include_tax_in_total ? subtotal + tax_total : subtotal
    
    return {
      line_count: lines.length,
      subtotal: Number(subtotal.toFixed(config.calculation_rules.round_to_decimal_places)),
      tax_total: Number(tax_total.toFixed(config.calculation_rules.round_to_decimal_places)),
      total: Number(total.toFixed(config.calculation_rules.round_to_decimal_places))
    }
  }, [lines, config.calculation_rules])

  // Filter lines
  const filteredLines = useMemo(() => {
    let filtered = lines

    if (searchFilter) {
      filtered = filtered.filter(line => 
        line.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        line.entity_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        line.account_code?.toLowerCase().includes(searchFilter.toLowerCase())
      )
    }

    if (lineTypeFilter !== 'all') {
      filtered = filtered.filter(line => line.line_type === lineTypeFilter)
    }

    return filtered
  }, [lines, searchFilter, lineTypeFilter])

  // Validate line
  const validateLine = useCallback((line: TransactionLine): string[] => {
    const errors: string[] = []

    // Required fields validation
    config.required_fields.forEach(field => {
      if (!line[field as keyof TransactionLine] && line[field as keyof TransactionLine] !== 0) {
        errors.push(`${field} is required`)
      }
    })

    // Amount validation
    if (line.quantity <= 0) {
      errors.push('Quantity must be greater than 0')
    }

    if (config.calculation_rules.auto_calculate_line_amount) {
      const expectedAmount = line.quantity * line.unit_amount
      if (Math.abs(line.line_amount - expectedAmount) > 0.01) {
        errors.push('Line amount does not match quantity × unit amount')
      }
    }

    return errors
  }, [config])

  // Handle drag and drop reordering
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || readonly) return

    const newLines = Array.from(lines)
    const [reorderedLine] = newLines.splice(result.source.index, 1)
    newLines.splice(result.destination.index, 0, reorderedLine)

    // Update line numbers
    const updatedLines = newLines.map((line, index) => ({
      ...line,
      line_number: index + 1
    }))

    onChange(updatedLines)
  }, [lines, onChange, readonly])

  // Add new line
  const addNewLine = useCallback((lineType?: string) => {
    const defaultLineType = config.line_types.find(lt => 
      lt.code === (lineType || config.default_line_type)
    )

    const newLine: TransactionLine = {
      id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      line_number: lines.length + 1,
      line_type: lineType || config.default_line_type,
      description: '',
      quantity: 1,
      unit_amount: 0,
      line_amount: 0,
      currency: config.currency,
      smart_code: `HERA.UNIVERSAL.TXN_LINE.${(lineType || config.default_line_type).toUpperCase()}.v1`,
      ...(defaultLineType?.default_values || {})
    }

    onChange([...lines, newLine])
    setEditingLine(newLine)
  }, [lines, config, onChange])

  // Edit line
  const editLine = useCallback((line: TransactionLine) => {
    setEditingLine(line)
  }, [])

  // Save line
  const saveLine = useCallback((updatedLine: TransactionLine) => {
    // Auto-calculate line amount if enabled
    if (config.calculation_rules.auto_calculate_line_amount) {
      updatedLine.line_amount = updatedLine.quantity * updatedLine.unit_amount
    }

    // Validate line
    const errors = validateLine(updatedLine)
    updatedLine.validation_errors = errors

    const updatedLines = lines.map(line => 
      line.id === updatedLine.id ? updatedLine : line
    )

    onChange(updatedLines)
    setEditingLine(null)

    // Trigger validation callback
    if (onValidation) {
      const allErrors = updatedLines.map(line => ({
        line_id: line.id,
        errors: validateLine(line)
      })).filter(result => result.errors.length > 0)

      onValidation(allErrors)
    }
  }, [lines, config, onChange, validateLine, onValidation])

  // Delete line(s)
  const deleteLines = useCallback((lineIds: string[]) => {
    const remainingLines = lines.filter(line => !lineIds.includes(line.id))
    
    // Renumber remaining lines
    const renumberedLines = remainingLines.map((line, index) => ({
      ...line,
      line_number: index + 1
    }))

    onChange(renumberedLines)
    setSelectedLines(new Set())
  }, [lines, onChange])

  // Duplicate line(s)
  const duplicateLines = useCallback((lineIds: string[]) => {
    const linesToDuplicate = lines.filter(line => lineIds.includes(line.id))
    const duplicatedLines = linesToDuplicate.map(line => ({
      ...line,
      id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      line_number: lines.length + 1,
      description: `Copy of ${line.description}`
    }))

    onChange([...lines, ...duplicatedLines])
    setSelectedLines(new Set())
  }, [lines, onChange])

  // Export lines to CSV
  const exportToCSV = useCallback(() => {
    const headers = ['Line #', 'Type', 'Description', 'Quantity', 'Unit Amount', 'Line Amount', 'Currency']
    const csvData = [
      headers,
      ...filteredLines.map(line => [
        line.line_number.toString(),
        line.line_type,
        line.description,
        line.quantity.toString(),
        line.unit_amount.toString(),
        line.line_amount.toString(),
        line.currency || config.currency
      ])
    ]

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'transaction_lines.csv'
    link.click()
    URL.revokeObjectURL(url)
  }, [filteredLines, config.currency])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with totals and actions */}
      <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Calculator className="text-blue-600" size={24} />
              Transaction Lines
              <Badge variant="outline" className="ml-2">
                {totals.line_count} {totals.line_count === 1 ? 'line' : 'lines'}
              </Badge>
            </CardTitle>
            
            {!readonly && (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Line
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {config.line_types.map(lineType => (
                      <DropdownMenuItem
                        key={lineType.code}
                        onClick={() => addNewLine(lineType.code)}
                      >
                        <span className="mr-2">{lineType.icon}</span>
                        {lineType.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {selectedLines.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4 mr-1" />
                        Actions ({selectedLines.size})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => duplicateLines(Array.from(selectedLines))}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => deleteLines(Array.from(selectedLines))}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Totals Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
              <div className="text-sm text-blue-600 font-medium">Subtotal</div>
              <div className="text-xl font-bold text-blue-700">
                {config.currency} {totals.subtotal.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl">
              <div className="text-sm text-emerald-600 font-medium">Tax Total</div>
              <div className="text-xl font-bold text-emerald-700">
                {config.currency} {totals.tax_total.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl">
              <div className="text-sm text-purple-600 font-medium">Grand Total</div>
              <div className="text-2xl font-bold text-purple-700">
                {config.currency} {totals.total.toLocaleString()}
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl">
              <div className="text-sm text-slate-600 font-medium">Line Count</div>
              <div className="text-xl font-bold text-slate-700">
                {totals.line_count}
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search lines by description, entity, or account..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={lineTypeFilter}
              onChange={(e) => setLineTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">All Types</option>
              {config.line_types.map(lineType => (
                <option key={lineType.code} value={lineType.code}>
                  {lineType.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lines List */}
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardContent className="p-0">
          {filteredLines.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500">No transaction lines found</p>
              {!readonly && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => addNewLine()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Line
                </Button>
              )}
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="transaction-lines">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {filteredLines.map((line, index) => (
                      <TransactionLineRow
                        key={line.id}
                        line={line}
                        index={index}
                        config={config}
                        selected={selectedLines.has(line.id)}
                        onSelect={(selected) => {
                          const newSelected = new Set(selectedLines)
                          if (selected) {
                            newSelected.add(line.id)
                          } else {
                            newSelected.delete(line.id)
                          }
                          setSelectedLines(newSelected)
                        }}
                        onEdit={() => editLine(line)}
                        onDelete={() => deleteLines([line.id])}
                        onDuplicate={() => duplicateLines([line.id])}
                        readonly={readonly}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Line Edit Dialog */}
      {editingLine && (
        <TransactionLineEditDialog
          line={editingLine}
          config={config}
          onSave={saveLine}
          onCancel={() => setEditingLine(null)}
        />
      )}
    </div>
  )
}

// Individual Line Row Component
interface TransactionLineRowProps {
  line: TransactionLine
  index: number
  config: LineManagerConfig
  selected: boolean
  onSelect: (selected: boolean) => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  readonly: boolean
}

function TransactionLineRow({
  line,
  index,
  config,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  readonly
}: TransactionLineRowProps) {
  const hasErrors = line.validation_errors && line.validation_errors.length > 0

  return (
    <Draggable draggableId={line.id} index={index} isDragDisabled={readonly}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "border-b border-slate-100 p-4 hover:bg-slate-50 transition-colors",
            snapshot.isDragging && "bg-blue-50 shadow-lg rounded-lg",
            selected && "bg-blue-50",
            hasErrors && "bg-red-50 border-red-200"
          )}
        >
          <div className="flex items-center gap-4">
            {/* Selection checkbox */}
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              className="flex-shrink-0"
            />

            {/* Drag handle */}
            {!readonly && config.allow_reordering && (
              <div {...provided.dragHandleProps} className="flex-shrink-0">
                <GripVertical className="text-slate-400 cursor-grab" size={16} />
              </div>
            )}

            {/* Line content */}
            <div className="flex-1 grid grid-cols-12 gap-4 items-center">
              {/* Line number */}
              <div className="col-span-1 text-sm font-medium text-slate-600">
                #{line.line_number}
              </div>

              {/* Line type badge */}
              <div className="col-span-2">
                <Badge variant="outline" className="text-xs">
                  {config.line_types.find(lt => lt.code === line.line_type)?.label || line.line_type}
                </Badge>
              </div>

              {/* Description */}
              <div className="col-span-4">
                <div className="font-medium text-slate-900">{line.description}</div>
                {line.entity_name && (
                  <div className="text-xs text-slate-500">{line.entity_name}</div>
                )}
              </div>

              {/* Quantity */}
              <div className="col-span-1 text-right text-sm">
                {line.quantity}
              </div>

              {/* Unit Amount */}
              <div className="col-span-2 text-right text-sm">
                {config.currency} {line.unit_amount.toLocaleString()}
              </div>

              {/* Line Amount */}
              <div className="col-span-2 text-right font-medium">
                {config.currency} {line.line_amount.toLocaleString()}
                {hasErrors && (
                  <AlertTriangle className="inline ml-1 text-red-500" size={14} />
                )}
              </div>
            </div>

            {/* Actions */}
            {!readonly && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="p-1 h-8 w-8"
                >
                  <Edit3 size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDuplicate}
                  className="p-1 h-8 w-8"
                >
                  <Copy size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </div>

          {/* Error display */}
          {hasErrors && (
            <div className="mt-2 ml-8 text-xs text-red-600">
              <ul className="list-disc list-inside space-y-1">
                {line.validation_errors?.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}

// Line Edit Dialog Component
interface TransactionLineEditDialogProps {
  line: TransactionLine
  config: LineManagerConfig
  onSave: (line: TransactionLine) => void
  onCancel: () => void
}

function TransactionLineEditDialog({
  line,
  config,
  onSave,
  onCancel
}: TransactionLineEditDialogProps) {
  const [editedLine, setEditedLine] = useState<TransactionLine>(line)

  const handleSave = () => {
    onSave(editedLine)
  }

  const updateField = (field: keyof TransactionLine, value: any) => {
    setEditedLine(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction Line #{line.line_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Line Type */}
          <div>
            <Label htmlFor="line_type">Line Type</Label>
            <select
              id="line_type"
              value={editedLine.line_type}
              onChange={(e) => updateField('line_type', e.target.value)}
              className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
            >
              {config.line_types.map(lineType => (
                <option key={lineType.code} value={lineType.code}>
                  {lineType.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={editedLine.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Line description"
              className="mt-1"
            />
          </div>

          {/* Quantity and Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={editedLine.quantity}
                onChange={(e) => updateField('quantity', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="unit_amount">Unit Amount *</Label>
              <Input
                id="unit_amount"
                type="number"
                value={editedLine.unit_amount}
                onChange={(e) => updateField('unit_amount', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="mt-1"
              />
            </div>
          </div>

          {/* Line Amount */}
          <div>
            <Label htmlFor="line_amount">Line Amount</Label>
            <Input
              id="line_amount"
              type="number"
              value={editedLine.line_amount}
              onChange={(e) => updateField('line_amount', parseFloat(e.target.value) || 0)}
              disabled={config.calculation_rules.auto_calculate_line_amount}
              className="mt-1"
            />
            {config.calculation_rules.auto_calculate_line_amount && (
              <p className="text-xs text-slate-500 mt-1">
                Auto-calculated: {editedLine.quantity} × {editedLine.unit_amount} = {(editedLine.quantity * editedLine.unit_amount).toFixed(2)}
              </p>
            )}
          </div>

          {/* Account Code */}
          <div>
            <Label htmlFor="account_code">Account Code</Label>
            <Input
              id="account_code"
              value={editedLine.account_code || ''}
              onChange={(e) => updateField('account_code', e.target.value)}
              placeholder="GL Account code"
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UniversalTransactionLineManager