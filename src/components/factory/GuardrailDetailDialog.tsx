/**
 * Guardrail Detail Dialog
 * Shows comprehensive information about guardrail violations with waiver options
 */

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  TrendingUp,
  Info,
  Package,
  TestTube,
  FileCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Progress } from '@/components/ui/progress'

interface GuardrailDetailDialogProps {
  open?: boolean
  moduleCode?: string
  transactions?: any[]
  onClose: () => void
  onCreateWaiver: (policy: string, reason: string) => void
}

export function GuardrailDetailDialog({
  open = false,
  moduleCode = '',
  transactions = [],
  onClose,
  onCreateWaiver
}: GuardrailDetailDialogProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<string>('')
  const [waiverReason, setWaiverReason] = useState('')
  const [activeTab, setActiveTab] = useState('violations')

  // Process guardrail data
  const guardrailData = React.useMemo(() => {
    const policies = new Map<
      string,
      {
        violations: any[]
        severity: 'error' | 'warning' | 'info'
        description: string
        count: number
        waivable: boolean
      }
    >()

    const stats = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      coverageAvg: 0,
      coverageCount: 0
    }

    transactions.forEach(txn => {
      // Mock data - in real implementation, this would come from transaction lines
      const violations = (txn.metadata as any)?.violations || []
      violations.forEach((v: any) => {
        if (!policies.has(v.policy)) {
          policies.set(v.policy, {
            violations: [],
            severity: v.severity || 'warning',
            description: v.description || 'Policy violation',
            count: 0,
            waivable: v.waivable !== false
          })
        }
        const policy = policies.get(v.policy)!
        policy.violations.push({ ...v, transaction: txn })
        policy.count++
        stats.total++

        if (v.severity === 'error') stats.failed++
        else stats.warnings++
      })

      // Coverage data
      if ((txn.metadata as any)?.coverage) {
        stats.coverageAvg += txn.metadata.coverage
        stats.coverageCount++
      }
    })

    stats.passed = stats.total - stats.failed - stats.warnings
    if (stats.coverageCount > 0) {
      stats.coverageAvg = (stats.coverageAvg / stats.coverageCount) * 100
    }

    return { policies, stats }
  }, [transactions])

  const handleCreateWaiver = () => {
    if (selectedPolicy && waiverReason.trim()) {
      onCreateWaiver(selectedPolicy, waiverReason)
      setSelectedPolicy('')
      setWaiverReason('')
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return XCircle
      case 'warning':
        return AlertTriangle
      case 'info':
        return Info
      default:
        return CheckCircle
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-500'
      case 'warning':
        return 'text-orange-500'
      case 'info':
        return 'text-blue-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle>Guardrail Analysis</DialogTitle>
              <DialogDescription>
                {moduleCode ? `Module: ${moduleCode}` : 'All Modules'} • {transactions.length}{' '}
                transactions analyzed
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6 pt-4">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="violations">Violations</TabsTrigger>
                <TabsTrigger value="coverage">Coverage Analysis</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[500px]">
              <TabsContent value="violations" className="px-6 py-4 space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                            Total Checks
                          </p>
                          <p className="text-xl font-bold">{guardrailData.stats.total}</p>
                        </div>
                        <Shield className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                            Passed
                          </p>
                          <p className="text-xl font-bold text-green-600">
                            {guardrailData.stats.passed}
                          </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                            Warnings
                          </p>
                          <p className="text-xl font-bold text-orange-600">
                            {guardrailData.stats.warnings}
                          </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                            Failed
                          </p>
                          <p className="text-xl font-bold text-red-600">
                            {guardrailData.stats.failed}
                          </p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Policy Violations */}
                <div className="space-y-4">
                  {Array.from(guardrailData.policies.entries()).map(([policyName, policy]) => {
                    const SeverityIcon = getSeverityIcon(policy.severity)

                    return (
                      <Card key={policyName} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <SeverityIcon
                                className={cn('w-5 h-5', getSeverityColor(policy.severity))}
                              />
                              <div>
                                <h3 className="font-semibold">{policyName}</h3>
                                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                                  {policy.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={policy.severity === 'error' ? 'destructive' : 'secondary'}
                              >
                                {policy.count} violations
                              </Badge>
                              {policy.waivable && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPolicy(policyName)
                                    setWaiverReason('')
                                  }}
                                >
                                  Create Waiver
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {policy.violations.slice(0, 3).map((violation, idx) => (
                              <div
                                key={idx}
                                className="text-sm p-2 bg-muted dark:bg-background rounded"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {violation.message || 'Policy violation detected'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {violation.transaction?.smart_code}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {policy.violations.length > 3 && (
                              <p className="text-xs text-muted-foreground text-center pt-1">
                                +{policy.violations.length - 3} more violations
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="coverage" className="px-6 py-4 space-y-4">
                {/* Coverage Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Test Coverage Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Coverage</span>
                        <span className="text-sm text-muted-foreground">
                          {guardrailData.stats.coverageAvg.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={guardrailData.stats.coverageAvg} className="h-2" />
                    </div>

                    {/* Coverage by Stage */}
                    <div className="space-y-3">
                      {['BUILD', 'TEST', 'COMPLY'].map(stage => {
                        const stageCoverage = Math.random() * 30 + 60 // Mock data
                        return (
                          <div key={stage} className="flex items-center gap-4">
                            <span className="text-sm font-medium w-20">{stage}</span>
                            <div className="flex-1">
                              <Progress value={stageCoverage} className="h-2" />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {stageCoverage.toFixed(0)}%
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Coverage Recommendations */}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-primary mt-0.5" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          <p className="font-medium">Recommendation</p>
                          <p className="mt-1">
                            Increase test coverage in the BUILD stage to meet the 85% target. Focus
                            on critical paths and edge cases.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Coverage Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Coverage Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      {/* Chart would go here */}
                      <TrendingUp className="w-8 h-8" />
                      <span className="ml-2">Coverage trending upward</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="px-6 py-4 space-y-4">
                {/* Recommendations */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <CardTitle>Critical Issues</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="font-medium text-sm">Security Vulnerability Detected</p>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                          CORS policy violations found in 3 endpoints. Update security headers
                          immediately.
                        </p>
                        <Button variant="link" className="p-0 h-auto mt-2">
                          View affected files <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <TestTube className="w-5 h-5 text-orange-500" />
                        <CardTitle>Testing Improvements</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-3">
                        <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Add integration tests for API endpoints
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                            Current coverage: 45% → Target: 85%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Implement performance benchmarks</p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                            Establish baseline metrics for critical paths
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-500" />
                        <CardTitle>Dependency Updates</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        3 dependencies have security updates available. Run `npm audit fix` to apply
                        patches.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Waiver Creation */}
        <AnimatePresence>
          {selectedPolicy && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t"
            >
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Create Waiver for: {selectedPolicy}</h3>
                  <Label htmlFor="waiver-reason">Waiver Reason</Label>
                  <Textarea
                    id="waiver-reason"
                    value={waiverReason}
                    onChange={e => setWaiverReason(e.target.value)}
                    placeholder="Provide justification for this waiver..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateWaiver} disabled={!waiverReason.trim()}>
                    Create Waiver
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPolicy('')
                      setWaiverReason('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
