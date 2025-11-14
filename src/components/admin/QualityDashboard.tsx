'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Shield,
  Zap,
  Code,
  Database,
  Globe,
  DollarSign,
  RefreshCw,
  FileText,
  GitBranch
} from 'lucide-react'

interface QualityMetrics {
  codeQuality: {
    score: number
    issues: string[]
  }
  security: {
    score: number
    vulnerabilities: number
  }
  performance: {
    score: number
    loadTime: number
    bundleSize: number
  }
  architecture: {
    compliance: number
    violations: string[]
  }
  currency: {
    hardcoded: number
    dynamic: number
  }
}

export function QualityDashboard() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  useEffect(() => {
    checkQuality()
  }, [])

  const checkQuality = async () => {
    setLoading(true)
    try {
      // In production, this would call an API endpoint
      // For now, we'll simulate the data
      const mockMetrics: QualityMetrics = {
        codeQuality: {
          score: 92,
          issues: ['5 TypeScript warnings', '2 unused variables']
        },
        security: {
          score: 98,
          vulnerabilities: 0
        },
        performance: {
          score: 88,
          loadTime: 1.2,
          bundleSize: 245
        },
        architecture: {
          compliance: 100,
          violations: []
        },
        currency: {
          hardcoded: 0,
          dynamic: 47
        }
      }

      setMetrics(mockMetrics)
      setLastCheck(new Date())
    } catch (error) {
      console.error('Failed to load quality metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (score >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    return <XCircle className="h-5 w-5 text-red-600" />
  }

  if (loading) {
    return <div className="animate-pulse">Loading quality metrics...</div>
  }

  if (!metrics) {
    return <Alert>Failed to load quality metrics</Alert>
  }

  const overallScore = Math.round(
    (metrics.codeQuality.score +
      metrics.security.score +
      metrics.performance.score +
      metrics.architecture.compliance) /
      4
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quality Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and maintain enterprise-grade code quality
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastCheck && (
            <span className="text-sm text-muted-foreground">
              Last check: {lastCheck.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={checkQuality} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Quality Score</span>
            {getScoreIcon(overallScore)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </span>
              <Badge
                variant={
                  overallScore >= 90 ? 'default' : overallScore >= 70 ? 'secondary' : 'destructive'
                }
              >
                {overallScore >= 90
                  ? 'Excellent'
                  : overallScore >= 70
                    ? 'Good'
                    : 'Needs Improvement'}
              </Badge>
            </div>
            <Progress value={overallScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Code Quality */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Quality</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.codeQuality.score}%</div>
            <Progress value={metrics.codeQuality.score} className="h-1 mt-2" />
            {metrics.codeQuality.issues.length > 0 && (
              <div className="mt-2 space-y-1">
                {metrics.codeQuality.issues.map((issue, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    • {issue}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.security.score}%</div>
            <Progress value={metrics.security.score} className="h-1 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.security.vulnerabilities === 0
                ? 'No vulnerabilities found'
                : `${metrics.security.vulnerabilities} vulnerabilities`}
            </p>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.performance.score}%</div>
            <Progress value={metrics.performance.score} className="h-1 mt-2" />
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>• Load time: {metrics.performance.loadTime}s</p>
              <p>• Bundle: {metrics.performance.bundleSize}KB</p>
            </div>
          </CardContent>
        </Card>

        {/* Architecture Compliance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Architecture</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.architecture.compliance}%</div>
            <Progress value={metrics.architecture.compliance} className="h-1 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.architecture.violations.length === 0
                ? 'Universal architecture compliant'
                : `${metrics.architecture.violations.length} violations`}
            </p>
          </CardContent>
        </Card>

        {/* Currency Implementation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currency</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.currency.hardcoded === 0
                ? '100%'
                : Math.round(
                    (metrics.currency.dynamic /
                      (metrics.currency.dynamic + metrics.currency.hardcoded)) *
                      100
                  ) + '%'}
            </div>
            <Progress
              value={
                metrics.currency.hardcoded === 0
                  ? 100
                  : Math.round(
                      (metrics.currency.dynamic /
                        (metrics.currency.dynamic + metrics.currency.hardcoded)) *
                        100
                    )
              }
              className="h-1 mt-2"
            />
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>• Dynamic: {metrics.currency.dynamic}</p>
              {metrics.currency.hardcoded > 0 && (
                <p className="text-red-600">• Hardcoded: {metrics.currency.hardcoded}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Build Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Build Status</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Passing</span>
            </div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>• Last build: 2 min ago</p>
              <p>• Duration: 45s</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      {(metrics.codeQuality.issues.length > 0 ||
        metrics.architecture.violations.length > 0 ||
        metrics.currency.hardcoded > 0) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Action Items:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              {metrics.codeQuality.issues.length > 0 && (
                <li>Fix {metrics.codeQuality.issues.length} code quality issues</li>
              )}
              {metrics.architecture.violations.length > 0 && (
                <li>Resolve {metrics.architecture.violations.length} architecture violations</li>
              )}
              {metrics.currency.hardcoded > 0 && (
                <li>Replace {metrics.currency.hardcoded} hardcoded currency values</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              View Full Report
            </Button>
            <Button variant="outline" size="sm">
              Run Quality Check
            </Button>
            <Button variant="outline" size="sm">
              Fix Issues
            </Button>
            <Button variant="outline" size="sm">
              Export Metrics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
