'use client'

/**
 * Universal Transaction Page Component
 * Smart Code: HERA.UNIVERSAL.PAGE.TRANSACTION_CRUD.v1
 * 
 * Complete enterprise-grade transaction CRUD interface with:
 * - Three-panel layout (status | main | AI assistant)
 * - Transaction header form with validation
 * - Line item management with drag & drop
 * - Workflow status integration
 * - Real-time calculations and validation
 * - Mobile-first responsive design
 * - Auto-save functionality
 */

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Save, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  Calculator,
  Workflow,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Send,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'
import { UniversalTransactionShell, useTransactionShell } from './UniversalTransactionShell'
import { UniversalTransactionHeader } from './UniversalTransactionHeader'
import UniversalTransactionLineManager, { 
  TransactionLine, 
  LineManagerConfig 
} from './UniversalTransactionLineManager'
import { UniversalWorkflowTracker } from './UniversalWorkflowTracker'
import { TransactionAIPanel } from './TransactionAIPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import type { TransactionTypeConfig } from '@/lib/config/transaction-types'
import { cn } from '@/lib/utils'

export interface TransactionData {
  id?: string
  transaction_type: string
  transaction_number?: string
  transaction_date: string
  due_date?: string
  status: string
  source_entity_id?: string
  target_entity_id?: string
  total_amount: number
  currency: string
  description?: string
  reference_number?: string
  smart_code: string
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

interface UniversalTransactionPageProps {
  // Transaction configuration
  transactionConfig: TransactionTypeConfig
  lineManagerConfig: LineManagerConfig
  
  // Data
  transactionId?: string
  initialData?: Partial<TransactionData>
  initialLines?: TransactionLine[]
  
  // Behavior
  mode: 'create' | 'edit' | 'view'
  onSave?: (transaction: TransactionData, lines: TransactionLine[]) => Promise<void>
  onDelete?: (transactionId: string) => Promise<void>
  onSubmit?: (transactionId: string) => Promise<void>
  onCancel?: () => void
  
  // UI Configuration
  showWorkflow?: boolean
  showAIPanel?: boolean
  allowEdit?: boolean
  className?: string
}

export function UniversalTransactionPage({
  transactionConfig,
  lineManagerConfig,
  transactionId,
  initialData = {},
  initialLines = [],
  mode = 'create',
  onSave,
  onDelete,
  onSubmit,
  onCancel,
  showWorkflow = true,
  showAIPanel = true,
  allowEdit = true,
  className = ''
}: UniversalTransactionPageProps) {
  const router = useRouter()
  const { user, organization } = useHERAAuth()
  const { showAIPanel: aiPanelVisible, setShowAIPanel, lastSaved, updateLastSaved } = useTransactionShell()

  // State
  const [transactionData, setTransactionData] = useState<TransactionData>({
    transaction_type: transactionConfig.code,
    transaction_date: new Date().toISOString().split('T')[0],
    status: 'DRAFT',
    total_amount: 0,
    currency: lineManagerConfig.currency,
    smart_code: transactionConfig.smart_code,
    ...initialData
  })
  
  const [lines, setLines] = useState<TransactionLine[]>(initialLines)
  const [headerValidationErrors, setHeaderValidationErrors] = useState<ValidationError[]>([])
  const [lineValidationErrors, setLineValidationErrors] = useState<{ line_id: string; errors: string[] }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('header')
  const [isDirty, setIsDirty] = useState(false)

  // Computed values
  const isReadonly = mode === 'view' || !allowEdit
  const canEdit = mode !== 'view' && allowEdit
  const canDelete = mode === 'edit' && transactionId
  const canSubmit = mode === 'edit' && transactionData.status === 'DRAFT'
  const hasErrors = headerValidationErrors.length > 0 || lineValidationErrors.length > 0

  // Update transaction totals when lines change
  useEffect(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.line_amount, 0)
    const taxTotal = lines.reduce((sum, line) => sum + (line.tax_amount || 0), 0)
    const total = lineManagerConfig.calculation_rules.include_tax_in_total 
      ? subtotal + taxTotal 
      : subtotal

    setTransactionData(prev => ({
      ...prev,
      total_amount: Number(total.toFixed(lineManagerConfig.calculation_rules.round_to_decimal_places))
    }))
  }, [lines, lineManagerConfig.calculation_rules])

  // Handle header field changes
  const handleHeaderChange = useCallback((field: string, value: any) => {
    setTransactionData(prev => ({
      ...prev,
      [field]: value
    }))
    setIsDirty(true)
  }, [])

  // Handle header validation
  const handleHeaderValidation = useCallback((errors: ValidationError[]) => {
    setHeaderValidationErrors(errors)
  }, [])

  // Handle line changes
  const handleLinesChange = useCallback((updatedLines: TransactionLine[]) => {
    setLines(updatedLines)
    setIsDirty(true)
  }, [])

  // Handle line validation
  const handleLineValidation = useCallback((errors: { line_id: string; errors: string[] }[]) => {
    setLineValidationErrors(errors)
  }, [])

  // Save transaction
  const handleSave = useCallback(async () => {
    if (!onSave || isSaving || hasErrors) return

    setIsSaving(true)
    try {
      await onSave(transactionData, lines)
      setIsDirty(false)
      updateLastSaved()
    } catch (error) {
      console.error('Error saving transaction:', error)
    } finally {
      setIsSaving(false)
    }
  }, [onSave, isSaving, hasErrors, transactionData, lines, updateLastSaved])

  // Delete transaction
  const handleDelete = useCallback(async () => {
    if (!onDelete || !transactionId) return

    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await onDelete(transactionId)
        router.back()
      } catch (error) {
        console.error('Error deleting transaction:', error)
      }
    }
  }, [onDelete, transactionId, router])

  // Submit transaction
  const handleSubmit = useCallback(async () => {
    if (!onSubmit || !transactionId || isSubmitting || hasErrors) return

    setIsSubmitting(true)
    try {
      await onSubmit(transactionId)
      setTransactionData(prev => ({ ...prev, status: 'SUBMITTED' }))
    } catch (error) {
      console.error('Error submitting transaction:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [onSubmit, transactionId, isSubmitting, hasErrors])

  // Auto-save functionality
  useEffect(() => {
    if (!isDirty || mode === 'view' || !onSave) return

    const autoSaveTimer = setTimeout(() => {
      if (!hasErrors) {
        handleSave()
      }
    }, 30000) // Auto-save after 30 seconds of inactivity

    return () => clearTimeout(autoSaveTimer)
  }, [isDirty, mode, onSave, hasErrors, handleSave])

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Dashboard' },
    { label: 'Transactions' },
    { 
      label: mode === 'create' 
        ? `New ${transactionConfig.name}` 
        : transactionData.transaction_number || 'Transaction'
    }
  ]

  // Left panel content (Status & Summary)
  const leftPanelContent = (
    <div className="space-y-4">
      {/* Transaction Status */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Workflow size={16} />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Badge 
                variant={transactionData.status === 'DRAFT' ? 'secondary' : 
                        transactionData.status === 'SUBMITTED' ? 'default' : 
                        transactionData.status === 'APPROVED' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {transactionData.status}
              </Badge>
            </div>
            
            {transactionData.transaction_number && (
              <div>
                <div className="text-xs text-slate-500">Transaction #</div>
                <div className="font-medium">{transactionData.transaction_number}</div>
              </div>
            )}
            
            <div>
              <div className="text-xs text-slate-500">Date</div>
              <div className="text-sm">{transactionData.transaction_date}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign size={16} />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Lines:</span>
              <span className="font-medium">{lines.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-medium">
                {transactionData.currency} {(transactionData.total_amount || 0).toLocaleString()}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span className="text-lg">
                  {transactionData.currency} {(transactionData.total_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {canEdit && (
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || hasErrors}
                className="w-full text-xs"
                size="sm"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={14} className="mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} className="mr-1" />
                    Save
                  </>
                )}
              </Button>

              {canSubmit && (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || hasErrors}
                  variant="outline"
                  className="w-full text-xs"
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="mr-1 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={14} className="mr-1" />
                      Submit
                    </>
                  )}
                </Button>
              )}

              {canDelete && (
                <Button 
                  onClick={handleDelete}
                  variant="destructive"
                  className="w-full text-xs"
                  size="sm"
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {hasErrors && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-sm">
            {headerValidationErrors.length + lineValidationErrors.length} validation error(s) found
          </AlertDescription>
        </Alert>
      )}
    </div>
  )

  // Center panel content (Main transaction form)
  const centerPanelContent = (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="header" className="flex items-center gap-2">
            <FileText size={16} />
            Header
          </TabsTrigger>
          <TabsTrigger value="lines" className="flex items-center gap-2">
            <Calculator size={16} />
            Lines ({lines.length})
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Eye size={16} />
            Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="header">
          <UniversalTransactionHeader
            config={transactionConfig}
            data={transactionData}
            onChange={handleHeaderChange}
            onValidation={handleHeaderValidation}
            readonly={isReadonly}
          />
        </TabsContent>

        <TabsContent value="lines">
          <UniversalTransactionLineManager
            lines={lines}
            config={lineManagerConfig}
            onChange={handleLinesChange}
            onValidation={handleLineValidation}
            readonly={isReadonly}
          />
        </TabsContent>

        <TabsContent value="review">
          <Card className="bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle size={20} />
                Transaction Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Header Summary */}
                <div>
                  <h4 className="font-medium mb-3">Transaction Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Type:</span>
                      <span className="ml-2 font-medium">{transactionConfig.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Date:</span>
                      <span className="ml-2 font-medium">{transactionData.transaction_date}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Status:</span>
                      <Badge variant="outline" className="ml-2">
                        {transactionData.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-slate-600">Total:</span>
                      <span className="ml-2 font-medium">
                        {transactionData.currency} {transactionData.total_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lines Summary */}
                <div>
                  <h4 className="font-medium mb-3">Line Items ({lines.length})</h4>
                  <div className="space-y-2">
                    {lines.map((line) => (
                      <div key={line.id} className="flex justify-between text-sm p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium">{line.description}</div>
                          <div className="text-slate-600">
                            Qty: {line.quantity} × {line.currency} {line.unit_amount}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {line.currency} {line.line_amount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  // Right panel content (AI Assistant)
  const rightPanelContent = showAIPanel ? (
    <TransactionAIPanel 
      transaction={transactionData}
      lines={lines}
      validationErrors={[...headerValidationErrors, ...lineValidationErrors.flatMap(le => le.errors.map(e => ({ field: le.line_id, message: e, severity: 'error' as const })))]}
      config={transactionConfig}
    />
  ) : null

  return (
    <div className={cn("h-screen", className)}>
      <UniversalTransactionShell
        title={mode === 'create' ? `New ${transactionConfig.name}` : transactionData.transaction_number || 'Transaction'}
        subtitle={transactionConfig.description}
        breadcrumbs={breadcrumbs}
        leftPanelContent={leftPanelContent}
        centerPanelContent={centerPanelContent}
        rightPanelContent={rightPanelContent}
        showAIPanel={aiPanelVisible && showAIPanel}
        onToggleAIPanel={() => setShowAIPanel(!aiPanelVisible)}
        allowFullscreen={true}
        showAutoSave={true}
        lastSaved={lastSaved}
      />
    </div>
  )
}

export default UniversalTransactionPage