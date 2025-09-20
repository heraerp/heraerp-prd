'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  AlertTriangle,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  Hash,
  Brain,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react'

interface DuplicateMatch {
  transaction_id: string
  invoice_number?: string
  amount: number
  date: string
  vendor_name?: string
  confidence_factors: {
    amount_match: boolean
    date_proximity: boolean
    invoice_number_match: boolean
    vendor_match: boolean
    description_similarity?: number
  }
}

interface DuplicateCheckResult {
  is_duplicate: boolean
  confidence: number
  matches: DuplicateMatch[]
  recommendation: string
  ai_analysis?: {
    risk_level: 'high' | 'medium' | 'low'
    explanation: string
    suggested_action: string
  }
}

interface DuplicateAlertProps {
  open: boolean
  onClose: () => void
  onProceed?: () => void
  onCancel?: () => void
  checkResult: DuplicateCheckResult | null
  transactionDetails?: {
    amount: number
    vendor_name?: string
    invoice_number?: string
    date: string
    description?: string
  }
}

export function DuplicateAlert({
  open,
  onClose,
  onProceed,
  onCancel,
  checkResult,
  transactionDetails
}: DuplicateAlertProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [userDecision, setUserDecision] = useState<'proceed' | 'cancel' | null>(null)

  useEffect(() => {
    if (open && checkResult) {
      setIsAnalyzing(true)
      // Simulate AI analysis
      setTimeout(() => setIsAnalyzing(false), 1500)
    }
  }, [open, checkResult])

  if (!checkResult) return null

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-red-600 bg-red-100'
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleProceed = () => {
    setUserDecision('proceed')
    onProceed?.()
    onClose()
  }

  const handleCancel = () => {
    setUserDecision('cancel')
    onCancel?.()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Potential Duplicate Transaction Detected
          </DialogTitle>
          <DialogDescription>
            HERA DNA's AI analysis has detected a potential duplicate transaction. Please review the
            details below before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Confidence Score */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">AI Confidence Score</span>
                  </div>
                  <Badge className={getConfidenceColor(checkResult.confidence)}>
                    {(checkResult.confidence * 100).toFixed(0)}% Match
                  </Badge>
                </div>
                <Progress value={checkResult.confidence * 100} className="h-2" />
                {isAnalyzing && (
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Analyzing transaction patterns...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Transaction */}
          {transactionDetails && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Current Transaction</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{formatAmount(transactionDetails.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{formatDate(transactionDetails.date)}</span>
                  </div>
                  {transactionDetails.vendor_name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Vendor:</span>
                      <span className="font-medium">{transactionDetails.vendor_name}</span>
                    </div>
                  )}
                  {transactionDetails.invoice_number && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Invoice:</span>
                      <span className="font-medium">{transactionDetails.invoice_number}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Matching Transactions */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Potential Duplicates Found</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Match Factors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkResult.matches.map((match, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(match.date)}</TableCell>
                        <TableCell className="font-medium">{match.invoice_number || '-'}</TableCell>
                        <TableCell>{match.vendor_name || '-'}</TableCell>
                        <TableCell className="text-right">{formatAmount(match.amount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {match.confidence_factors.amount_match && (
                              <Badge variant="outline" className="text-xs">
                                <DollarSign className="h-3 w-3 mr-1" />
                                Amount
                              </Badge>
                            )}
                            {match.confidence_factors.invoice_number_match && (
                              <Badge variant="outline" className="text-xs">
                                <Hash className="h-3 w-3 mr-1" />
                                Invoice
                              </Badge>
                            )}
                            {match.confidence_factors.date_proximity && (
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                Date
                              </Badge>
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

          {/* AI Analysis */}
          {checkResult.ai_analysis && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Risk Level:</span>
                    <Badge variant={getRiskBadgeVariant(checkResult.ai_analysis.risk_level)}>
                      {checkResult.ai_analysis.risk_level.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm">{checkResult.ai_analysis.explanation}</p>
                  <p className="text-sm font-medium">
                    Recommendation: {checkResult.ai_analysis.suggested_action}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* System Recommendation */}
          <Alert variant={checkResult.confidence >= 0.8 ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {checkResult.recommendation}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>This analysis is powered by HERA DNA AI</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Posting
            </Button>
            <Button
              variant={checkResult.confidence >= 0.8 ? 'destructive' : 'default'}
              onClick={handleProceed}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Proceed Anyway
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
