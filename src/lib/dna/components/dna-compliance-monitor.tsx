/**
 * HERA DNA Compliance Monitor Component
 * Smart Code: HERA.DNA.COMPONENTS.COMPLIANCE.MONITOR.V1
 * 
 * REVOLUTIONARY: Real-time visual DNA compliance monitoring for developers.
 * Shows live compliance status, violations, and provides auto-fix suggestions.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Zap, Bug, Shield } from 'lucide-react'
import { 
  useDnaCompliance, 
  useDnaSmartCode, 
  useDnaViolationReporting,
  useDnaMemoryPersistence,
  DnaComplianceProvider 
} from '../hooks/use-dna-compliance'
import { HeraDnaViolation } from '../core/standardization-dna'

// ============================================================================
// DNA COMPLIANCE MONITOR COMPONENTS
// ============================================================================

interface DnaComplianceMonitorProps {
  componentSmartCode?: string
  showDetailed?: boolean
  autoFix?: boolean
  position?: 'fixed' | 'relative'
  className?: string
}

export function DnaComplianceMonitor({
  componentSmartCode = 'HERA.DNA.MONITOR.DEFAULT.V1',
  showDetailed = false,
  autoFix = true,
  position = 'fixed',
  className = ''
}: DnaComplianceMonitorProps) {
  return (
    <DnaComplianceProvider componentSmartCode={componentSmartCode}>
      <DnaComplianceMonitorInternal 
        showDetailed={showDetailed}
        autoFix={autoFix}
        position={position}
        className={className}
      />
    </DnaComplianceProvider>
  )
}

function DnaComplianceMonitorInternal({
  showDetailed,
  autoFix,
  position,
  className
}: Omit<DnaComplianceMonitorProps, 'componentSmartCode'>) {
  const {
    dnaStatus,
    violations,
    complianceScore,
    lastCheck,
    checkDnaCompliance,
    isCompliant
  } = useDnaCompliance()

  const { reportViolation, getViolationReport } = useDnaViolationReporting()
  const { memoryEngravementStatus, engraveStandardizationDna } = useDnaMemoryPersistence()
  const [isExpanded, setIsExpanded] = useState(showDetailed)

  const getStatusIcon = () => {
    switch (dnaStatus) {
      case 'COMPLIANT':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'VIOLATIONS':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = () => {
    switch (dnaStatus) {
      case 'COMPLIANT':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'VIOLATIONS':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    }
  }

  const handleAutoFix = async () => {
    try {
      // In a real implementation, this would apply auto-fixes
      await engraveStandardizationDna()
      await checkDnaCompliance()
    } catch (error) {
      console.error('Auto-fix failed:', error)
    }
  }

  if (position === 'fixed' && !showDetailed && isCompliant) {
    // Show minimal indicator when compliant
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        >
          {getStatusIcon()}
          <span className="ml-2">DNA {complianceScore}%</span>
        </Button>
      </div>
    )
  }

  const containerClasses = position === 'fixed' 
    ? `fixed bottom-4 right-4 z-50 w-96 ${className}`
    : `w-full ${className}`

  return (
    <div className={containerClasses}>
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <CardTitle className="text-lg">HERA DNA Monitor</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor()}>
                {dnaStatus}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={checkDnaCompliance}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Real-time architectural compliance monitoring
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Compliance Score */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Compliance Score</span>
              <span className="font-semibold">{complianceScore}%</span>
            </div>
            <Progress 
              value={complianceScore} 
              className="h-2"
              // @ts-ignore - Progress component color customization
              color={complianceScore >= 90 ? 'green' : complianceScore >= 70 ? 'yellow' : 'red'}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">{violations.filter(v => v.severity === 'WARNING').length}</div>
              <div className="text-xs text-muted-foreground">Warnings</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">{violations.filter(v => v.severity === 'ERROR').length}</div>
              <div className="text-xs text-muted-foreground">Errors</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">{violations.filter(v => v.severity === 'CRITICAL').length}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
          </div>

          {/* Violations */}
          {violations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Active Violations</h4>
                {autoFix && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoFix}
                    className="h-7 text-xs"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Auto-fix
                  </Button>
                )}
              </div>
              
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {violations.slice(0, 3).map((violation, index) => (
                  <DnaViolationAlert key={index} violation={violation} />
                ))}
                {violations.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{violations.length - 3} more violations
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Memory Status */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>DNA Memory:</span>
            <Badge variant={memoryEngravementStatus === 'SUCCESS' ? 'default' : 'destructive'}>
              {memoryEngravementStatus}
            </Badge>
          </div>

          {/* Last Check */}
          {lastCheck && (
            <div className="text-xs text-muted-foreground text-center">
              Last check: {lastCheck.toLocaleTimeString()}
            </div>
          )}

          {/* Expand for detailed view */}
          {!showDetailed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full h-8 text-xs"
            >
              {isExpanded ? 'Collapse' : 'View Details'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Detailed View */}
      {(showDetailed || isExpanded) && (
        <Card className="mt-2 shadow-lg">
          <CardContent className="p-4">
            <DnaDetailedMonitor />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DnaViolationAlert({ violation }: { violation: HeraDnaViolation }) {
  const getSeverityIcon = () => {
    switch (violation.severity) {
      case 'CRITICAL':
        return <XCircle className="h-3 w-3 text-red-500" />
      case 'ERROR':
        return <AlertTriangle className="h-3 w-3 text-orange-500" />
      default:
        return <Bug className="h-3 w-3 text-yellow-500" />
    }
  }

  return (
    <Alert className="py-2">
      <div className="flex items-start space-x-2">
        {getSeverityIcon()}
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-xs font-semibold leading-tight">
            {violation.type.replace(/_/g, ' ')}
          </AlertTitle>
          <AlertDescription className="text-xs leading-tight">
            {violation.message}
          </AlertDescription>
          {violation.fix && (
            <div className="text-xs text-green-600 mt-1">
              Fix: {violation.fix}
            </div>
          )}
        </div>
      </div>
    </Alert>
  )
}

function DnaDetailedMonitor() {
  const { validateSmartCode, generateSmartCode } = useDnaSmartCode()
  const { getViolationReport } = useDnaViolationReporting()
  const [testSmartCode, setTestSmartCode] = useState('')
  const [smartCodeValidation, setSmartCodeValidation] = useState<any>(null)

  const violationReport = getViolationReport()

  const handleSmartCodeTest = () => {
    if (testSmartCode) {
      const validation = validateSmartCode(testSmartCode)
      setSmartCodeValidation(validation)
    }
  }

  const generateSampleSmartCode = () => {
    try {
      const sampleCode = generateSmartCode('SALON', 'POS', 'CART', 'ACTIVE', 1)
      setTestSmartCode(sampleCode)
      setSmartCodeValidation(null)
    } catch (error) {
      console.error('Failed to generate smart code:', error)
    }
  }

  return (
    <Tabs defaultValue="violations" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="violations">Violations</TabsTrigger>
        <TabsTrigger value="smartcode">Smart Codes</TabsTrigger>
        <TabsTrigger value="report">Report</TabsTrigger>
      </TabsList>

      <TabsContent value="violations" className="space-y-2">
        <h3 className="text-sm font-semibold">Violation Details</h3>
        {violationReport.totalViolations === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
            No violations detected
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(violationReport.violationsByType).map(([type, count]) => (
              <div key={type} className="flex justify-between text-sm">
                <span>{type.replace(/_/g, ' ')}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="smartcode" className="space-y-3">
        <h3 className="text-sm font-semibold">Smart Code Validator</h3>
        
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter smart code to validate..."
              value={testSmartCode}
              onChange={(e) => setTestSmartCode(e.target.value)}
              className="flex-1 px-3 py-1 text-sm border rounded"
            />
            <Button size="sm" onClick={handleSmartCodeTest}>
              Test
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={generateSampleSmartCode}
            className="w-full"
          >
            Generate Sample
          </Button>
        </div>

        {smartCodeValidation && (
          <Alert className={smartCodeValidation.dnaCompliant ? 'border-green-200' : 'border-red-200'}>
            <AlertTitle className="text-sm">
              {smartCodeValidation.dnaCompliant ? '✅ Valid' : '❌ Invalid'}
            </AlertTitle>
            <AlertDescription className="text-xs">
              {smartCodeValidation.dnaCompliant 
                ? `Family: ${smartCodeValidation.family || 'Unknown'}`
                : smartCodeValidation.error
              }
              {smartCodeValidation.fix && (
                <div className="mt-1 text-green-600">
                  Suggested fix: {smartCodeValidation.fix}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>

      <TabsContent value="report" className="space-y-2">
        <h3 className="text-sm font-semibold">Compliance Report</h3>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <div className="font-semibold">By Severity:</div>
            {Object.entries(violationReport.violationsByActivity).map(([severity, count]) => (
              <div key={severity} className="flex justify-between">
                <span>{severity}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-1">
            <div className="font-semibold">By Type:</div>
            {Object.entries(violationReport.violationsByType).slice(0, 3).map(([type, count]) => (
              <div key={type} className="flex justify-between">
                <span className="truncate">{type.split('_')[0]}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {violationReport.recentViolations.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold">Recent:</div>
            <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
              {violationReport.recentViolations.slice(0, 3).map((violation, index) => (
                <div key={index}>{violation.type}</div>
              ))}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

// ============================================================================
// DNA COMPLIANCE INDICATOR (MINIMAL)
// ============================================================================

export function DnaComplianceIndicator({ className = '' }: { className?: string }) {
  const { dnaStatus, complianceScore, isCompliant } = useDnaCompliance()

  if (isCompliant) {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`}>
        <CheckCircle className="h-3 w-3 text-green-500" />
        <span className="text-xs text-green-600 font-medium">DNA {complianceScore}%</span>
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center space-x-1 ${className}`}>
      <XCircle className="h-3 w-3 text-red-500" />
      <span className="text-xs text-red-600 font-medium">DNA {complianceScore}%</span>
    </div>
  )
}

// ============================================================================
// DNA COMPLIANCE BADGE
// ============================================================================

export function DnaComplianceBadge({ className = '' }: { className?: string }) {
  const { dnaStatus, complianceScore } = useDnaCompliance()

  const getVariant = () => {
    switch (dnaStatus) {
      case 'COMPLIANT':
        return 'default'
      case 'VIOLATIONS':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <Badge variant={getVariant()} className={className}>
      🧬 DNA {complianceScore}%
    </Badge>
  )
}

export default DnaComplianceMonitor