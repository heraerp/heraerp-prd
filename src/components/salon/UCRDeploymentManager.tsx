'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUCRMCP } from '@/lib/hooks/use-ucr-mcp'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useToast } from '@/components/ui/use-toast'
import {
  Rocket,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  GitBranch,
  RotateCcw,
  Eye,
  Sparkles,
  Info,
  TrendingUp,
  Activity,
  ChevronRight,
  Loader2,
  FileText,
  UserCheck,
  CalendarClock,
  MapPin,
  Zap
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/date-utils'
import { addDays, addMonths } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'

interface UCRDeploymentManagerProps {
  ruleId: string
  rule?: any
  testResults?: any
  onClose?: () => void
}

interface DeploymentScope {
  apps: string[]
  locations: string[]
  segments?: any
}

interface Approval {
  user_id: string
  user_name: string
  role: string
  approved_at: string
  notes?: string
}

export function UCRDeploymentManager({
  ruleId,
  rule,
  testResults,
  onClose
}: UCRDeploymentManagerProps) {
  const { currentOrganization } = useMultiOrgAuth()
  const { getRule, deployRule, validateRule, getAuditLog, simulateRule } = useUCRMCP()
  const { toast } = useToast()
  const [currentRule, setCurrentRule] = useState<any>(rule)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [deploying, setDeploying] = useState(false)
  const [deploymentProgress, setDeploymentProgress] = useState(0)

  // Deployment settings
  const [deploymentScope, setDeploymentScope] = useState<DeploymentScope>({
    apps: ['salon'],
    locations: ['all']
  })
  const [effectiveFrom, setEffectiveFrom] = useState(formatDate(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [effectiveTo, setEffectiveTo] = useState('')
  const [deploymentNotes, setDeploymentNotes] = useState('')
  const [requiresApproval, setRequiresApproval] = useState(true)
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [deploymentHistory, setDeploymentHistory] = useState<any[]>([])

  // Pre-deployment checklist
  const [checklist, setChecklist] = useState({
    tested: false,
    reviewed: false,
    approved: false,
    documented: false,
    backupPlan: false
  })

  useEffect(() => {
    if (ruleId && !rule) {
      loadRule()
    }
    loadDeploymentHistory()
  }, [ruleId])

  const loadRule = async () => {
    setLoading(true)
    try {
      const ruleData = await getRule(ruleId)
      setCurrentRule(ruleData)
    } catch (err) {
      console.error('Failed to load rule:', err)
      toast({
        title: 'Failed to load rule',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadDeploymentHistory = async () => {
    try {
      const events = await getAuditLog(ruleId)
      const deployments = events.filter(
        (e: any) => e.transaction_type === 'ucr_deployment' || e.smart_code?.includes('DEPLOY')
      )
      setDeploymentHistory(deployments)
    } catch (err) {
      console.error('Failed to load deployment history:', err)
    }
  }

  const handleApproval = () => {
    if (!currentOrganization) return

    const approval: Approval = {
      user_id: 'current-user-id', // In real app, get from auth
      user_name: currentOrganization.name || 'Manager',
      role: 'manager',
      approved_at: new Date().toISOString(),
      notes: deploymentNotes
    }

    setApprovals([...approvals, approval])
    setChecklist({ ...checklist, approved: true })
    setShowApprovalDialog(false)

    toast({
      title: 'Approval Recorded',
      description: 'Your approval has been recorded successfully'
    })
  }

  const handleDeploy = async () => {
    if (!currentOrganization || !currentRule) return

    // Validate checklist
    const checklistComplete = Object.values(checklist).every(v => v === true)
    if (!checklistComplete) {
      toast({
        title: 'Incomplete Checklist',
        description: 'Please complete all pre-deployment checks',
        variant: 'destructive'
      })
      return
    }

    if (requiresApproval && approvals.length === 0) {
      toast({
        title: 'Approval Required',
        description: 'This deployment requires at least one approval',
        variant: 'destructive'
      })
      return
    }

    setDeploying(true)
    setDeploymentProgress(0)

    try {
      // Simulate deployment progress
      const progressInterval = setInterval(() => {
        setDeploymentProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 300)

      // Validate rule one more time
      const validationResult = await validateRule({
        organization_id: currentOrganization.id,
        smart_code: currentRule.smart_code,
        title: currentRule.title,
        status: 'active',
        tags: (currentRule.metadata as any)?.tags || [],
        owner: (currentRule.metadata as any)?.owner || currentOrganization.name,
        version: (currentRule.metadata as any)?.rule_version || 1,
        schema_version: (currentRule.metadata as any)?.schema_version || 1,
        rule_payload: currentRule.rule_payload
      })

      if (!validationResult.ok) {
        clearInterval(progressInterval)
        throw new Error('Rule validation failed')
      }

      setDeploymentProgress(50)

      // Deploy the rule
      const result = await deployRule(
        ruleId,
        deploymentScope,
        effectiveFrom,
        effectiveTo || undefined,
        approvals
      )

      clearInterval(progressInterval)
      setDeploymentProgress(100)

      toast({
        title: 'Deployment Successful!',
        description: `Rule is now active in production`
      })

      // Refresh deployment history
      setTimeout(() => {
        loadDeploymentHistory()
        if (onClose) onClose()
      }, 1500)
    } catch (err: any) {
      setDeploymentProgress(0)
      toast({
        title: 'Deployment Failed',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setDeploying(false)
    }
  }

  const renderOverview = () => {
    if (!currentRule) return null

    const hasTestResults = testResults && testResults.passed > 0
    const testPassRate = hasTestResults
      ? (testResults.passed / (testResults.passed + testResults.failed)) * 100
      : 0

    return (
      <div className="space-y-6">
        {/* Rule Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Rule Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Rule Name</Label>
                <p className="font-medium">{currentRule.title || currentRule.entity_name}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Smart Code</Label>
                <code className="text-xs bg-muted dark:bg-muted px-2 py-1 rounded">
                  {currentRule.smart_code}
                </code>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Current Status</Label>
                <Badge variant={currentRule.status === 'draft' ? 'secondary' : 'default'}>
                  {currentRule.status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Version</Label>
                <Badge variant="outline">v{(currentRule.metadata as any)?.rule_version || 1}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deployment Readiness */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Deployment Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Validation Status */}
              <div className="flex items-center gap-3 p-4 bg-muted dark:bg-muted rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-medium">Validation Status</p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Rule structure is valid
                  </p>
                </div>
              </div>

              {/* Test Results */}
              <div className="flex items-center gap-3 p-4 bg-muted dark:bg-muted rounded-lg">
                {hasTestResults && testPassRate >= 80 ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : hasTestResults ? (
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                ) : (
                  <XCircle className="w-8 h-8 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Test Results</p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {hasTestResults
                      ? `${testPassRate.toFixed(0)}% tests passing`
                      : 'No test results available'}
                  </p>
                </div>
              </div>

              {/* Previous Deployments */}
              <div className="flex items-center gap-3 p-4 bg-muted dark:bg-muted rounded-lg">
                <Activity className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="font-medium">Deployment History</p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {deploymentHistory.length} previous deployments
                  </p>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="flex items-center gap-3 p-4 bg-muted dark:bg-muted rounded-lg">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="font-medium">Risk Level</p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Low - Isolated rule change
                  </p>
                </div>
              </div>
            </div>

            {(!hasTestResults || testPassRate < 80) && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Testing Recommended</AlertTitle>
                <AlertDescription>
                  {!hasTestResults
                    ? 'Consider running tests before deployment to ensure rule behavior.'
                    : 'Some tests are failing. Review and fix issues before deployment.'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderDeploymentSettings = () => {
    return (
      <div className="space-y-6">
        {/* Deployment Scope */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Deployment Scope
            </CardTitle>
            <CardDescription>Choose where this rule will be active</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Applications</Label>
              <div className="mt-2 space-y-2">
                {['salon', 'booking_app', 'pos_system'].map(app => (
                  <div key={app} className="flex items-center gap-2">
                    <Checkbox
                      checked={deploymentScope.apps.includes(app)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setDeploymentScope({
                            ...deploymentScope,
                            apps: [...deploymentScope.apps, app]
                          })
                        } else {
                          setDeploymentScope({
                            ...deploymentScope,
                            apps: deploymentScope.apps.filter(a => a !== app)
                          })
                        }
                      }}
                    />
                    <Label className="font-normal capitalize">{app.replace('_', ' ')}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <Label>Locations</Label>
              <Select
                value={deploymentScope.locations[0]}
                onValueChange={value =>
                  setDeploymentScope({
                    ...deploymentScope,
                    locations: [value]
                  })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="main_branch">Main Branch Only</SelectItem>
                  <SelectItem value="downtown">Downtown Branch</SelectItem>
                  <SelectItem value="mall">Mall Branch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                The rule will be active in {deploymentScope.apps.length} application(s) across{' '}
                {deploymentScope.locations[0] === 'all' ? 'all' : 'selected'} locations.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Deployment Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5" />
              Deployment Schedule
            </CardTitle>
            <CardDescription>When should this rule become active?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="effective_from">Effective From</Label>
                <Input
                  id="effective_from"
                  type="datetime-local"
                  value={effectiveFrom}
                  onChange={e => setEffectiveFrom(e.target.value)}
                  className="mt-2"
                  min={formatDate(new Date(), "yyyy-MM-dd'T'HH:mm")}
                />
              </div>
              <div>
                <Label htmlFor="effective_to">Effective To (Optional)</Label>
                <Input
                  id="effective_to"
                  type="datetime-local"
                  value={effectiveTo}
                  onChange={e => setEffectiveTo(e.target.value)}
                  className="mt-2"
                  min={effectiveFrom}
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty for permanent deployment</p>
              </div>
            </div>

            {/* Quick Schedule Options */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEffectiveFrom(formatDate(new Date(), "yyyy-MM-dd'T'HH:mm"))}
              >
                Deploy Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEffectiveFrom(formatDate(addDays(new Date(), 1), "yyyy-MM-dd'T'09:00"))
                }
              >
                Tomorrow 9 AM
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEffectiveFrom(formatDate(addDays(new Date(), 7), "yyyy-MM-dd'T'09:00"))
                }
              >
                Next Week
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deployment Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Deployment Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={deploymentNotes}
              onChange={e => setDeploymentNotes(e.target.value)}
              placeholder="Describe what's changing and why..."
              rows={4}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              These notes will be included in the deployment history
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderApprovals = () => {
    return (
      <div className="space-y-6">
        {/* Approval Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Approval Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted dark:bg-muted rounded-lg">
              <div>
                <Label htmlFor="requires_approval">Require Approval</Label>
                <p className="text-sm text-muted-foreground">Manager approval needed before deployment</p>
              </div>
              <Switch
                id="requires_approval"
                checked={requiresApproval}
                onCheckedChange={setRequiresApproval}
              />
            </div>

            {requiresApproval && (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  At least one manager approval is required to deploy this rule.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Current Approvals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Approvals</CardTitle>
              {requiresApproval && (
                <Button onClick={() => setShowApprovalDialog(true)} size="sm">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Add Approval
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {approvals.length > 0 ? (
              <div className="space-y-3">
                {approvals.map((approval, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                  >
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{approval.user_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {approval.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Approved on{' '}
                        {formatDate(new Date(approval.approved_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {approval.notes && <p className="text-sm mt-1">{approval.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No approvals yet</p>
                {requiresApproval && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Add an approval to proceed with deployment
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pre-deployment Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Pre-deployment Checklist
            </CardTitle>
            <CardDescription>Ensure all items are checked before deployment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries({
                tested: 'Rule has been thoroughly tested',
                reviewed: 'Changes have been reviewed',
                approved: 'Required approvals obtained',
                documented: 'Deployment notes added',
                backupPlan: 'Rollback plan is ready'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    checked={checklist[key as keyof typeof checklist]}
                    onCheckedChange={checked =>
                      setChecklist({
                        ...checklist,
                        [key]: checked as boolean
                      })
                    }
                  />
                  <Label className="font-normal cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>

            {Object.values(checklist).every(v => v) && (
              <Alert className="mt-4">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  All pre-deployment checks complete. Ready to deploy!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderHistory = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Deployment History
            </CardTitle>
            <CardDescription>Previous deployments and rollbacks</CardDescription>
          </CardHeader>
          <CardContent>
            {deploymentHistory.length > 0 ? (
              <div className="space-y-4">
                {deploymentHistory.map((event, index) => (
                  <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        event.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-yellow-100 dark:bg-yellow-900/30'
                      }`}
                    >
                      {event.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {(event.metadata as any)?.action || 'Deployment'}
                      </p>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        {formatDate(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {(event.metadata as any)?.notes && (
                        <p className="text-sm mt-1">{event.metadata.notes}</p>
                      )}
                      <div className="mt-2 flex gap-2">
                        {(event.metadata as any)?.scope?.apps?.map((app: string) => (
                          <Badge key={app} variant="outline" className="text-xs">
                            {app}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {index === 0 && <Badge className="bg-green-100 text-green-800">Current</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No deployment history</p>
                <p className="text-sm text-muted-foreground mt-1">This will be the first deployment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rollback Options */}
        {deploymentHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Rollback Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  If issues arise after deployment, you can quickly rollback to a previous version.
                  Rollback is available for 30 days after deployment.
                </AlertDescription>
              </Alert>
              <Button variant="outline" className="mt-4" disabled>
                <RotateCcw className="w-4 h-4 mr-2" />
                Rollback to Previous Version
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Rocket className="w-12 h-12 animate-pulse mx-auto text-purple-600 mb-4" />
          <p className="text-muted-foreground dark:text-muted-foreground">Loading deployment manager...</p>
        </div>
      </div>
    )
  }

  if (!currentRule) {
    return (
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>No rule selected for deployment</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <CardTitle>Deploy Rule to Production</CardTitle>
                <CardDescription>{currentRule.title || currentRule.entity_name}</CardDescription>
              </div>
            </div>
            <Button
              onClick={handleDeploy}
              disabled={deploying || !Object.values(checklist).every(v => v)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-foreground"
            >
              {deploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy Now
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Deployment Progress */}
      {deploying && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Deployment Progress</p>
                <span className="text-sm">{deploymentProgress}%</span>
              </div>
              <Progress value={deploymentProgress} className="h-2" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>
                  {deploymentProgress < 30 && 'Validating rule...'}
                  {deploymentProgress >= 30 && deploymentProgress < 60 && 'Preparing deployment...'}
                  {deploymentProgress >= 60 && deploymentProgress < 90 && 'Applying changes...'}
                  {deploymentProgress >= 90 && 'Finalizing deployment...'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Zap className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="approvals">
            <UserCheck className="w-4 h-4 mr-2" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">{renderOverview()}</TabsContent>

          <TabsContent value="settings">{renderDeploymentSettings()}</TabsContent>

          <TabsContent value="approvals">{renderApprovals()}</TabsContent>

          <TabsContent value="history">{renderHistory()}</TabsContent>
        </div>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Approval</DialogTitle>
            <DialogDescription>Approve this rule for deployment to production</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                By approving, you confirm that this rule has been reviewed and is ready for
                production use.
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="approval_notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approval_notes"
                value={deploymentNotes}
                onChange={e => setDeploymentNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproval} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
