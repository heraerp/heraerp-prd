// ================================================================================
// YEAR-END CLOSING DASHBOARD PAGE
// Smart Code: HERA.UI.FINANCE.CLOSING.v1
// Production-ready closing dashboard with workflow visualization
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { 
  Calendar,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Building,
  TrendingUp,
  DollarSign,
  Info
} from 'lucide-react'
import { useOrganization } from '@/src/components/organization/OrganizationProvider'
import { useClosingApi } from '@/src/lib/api/closing'
import { useFiscalApi } from '@/src/lib/api/fiscal'
import { ClosingWorkflowSteps } from '@/src/components/fiscal/ClosingWorkflowSteps'
import { ClosingChecklistPanel } from '@/src/components/fiscal/ClosingChecklistPanel'
import { ClosingJournalDrilldown } from '@/src/components/fiscal/ClosingJournalDrilldown'
import { useToast } from '@/src/components/ui/use-toast'

export default function ClosingDashboardPage() {
  const { currentOrganization } = useOrganization()
  const { toast } = useToast()
  const [showJournals, setShowJournals] = React.useState(false)

  const closing = useClosingApi(currentOrganization?.id || '')
  const fiscal = useFiscalApi(currentOrganization?.id || '')

  const handleStartClosing = async () => {
    if (!fiscal.config?.fiscal_year_start) {
      toast({
        title: "Configuration Missing",
        description: "Please configure fiscal year settings first",
        variant: "destructive"
      })
      return
    }

    const year = new Date(fiscal.config.fiscal_year_start).getFullYear().toString()
    
    try {
      await closing.startClosingWorkflow.mutateAsync(year)
      toast({
        title: "Closing Process Started",
        description: `Year-end closing workflow initiated for fiscal year ${year}`,
        variant: "default"
      })

      // Start simulating the first step
      if (closing.workflow?.steps[0]) {
        setTimeout(() => {
          closing.simulateClosingStep(closing.workflow!.steps[0].id)
        }, 1000)
      }
    } catch (error) {
      toast({
        title: "Failed to Start",
        description: error instanceof Error ? error.message : "Failed to start closing workflow",
        variant: "destructive"
      })
    }
  }

  const workflowStats = React.useMemo(() => {
    const workflow = closing.workflow
    if (!workflow) return null

    const doneSteps = workflow.steps.filter(s => s.status === 'done').length
    const errorSteps = workflow.steps.filter(s => s.status === 'error').length
    const currentStep = workflow.steps.find(s => s.status === 'in_progress')

    return {
      totalSteps: workflow.steps.length,
      completedSteps: doneSteps,
      errorSteps,
      currentStep,
      progress: closing.getStepProgress(),
      canStart: closing.canStartClosing(
        fiscal.isChecklistComplete(),
        fiscal.areAllPeriodsClosed()
      )
    }
  }, [closing.workflow, closing.getStepProgress, fiscal, closing.canStartClosing])

  const branchSummary = React.useMemo(() => {
    const branches = closing.branchStatus
    return {
      total: branches.length,
      completed: branches.filter(b => b.closing_status === 'done').length,
      inProgress: branches.filter(b => b.closing_status === 'in_progress').length,
      errors: branches.filter(b => b.has_errors).length,
      avgCompletion: branches.length > 0 
        ? Math.round(branches.reduce((sum, b) => sum + b.checklist_completion, 0) / branches.length)
        : 0
    }
  }, [closing.branchStatus])

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please select an organization to view the closing dashboard.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Content Area - 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="h-7 w-7 text-violet-600" />
                Year-End Closing Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Automated fiscal year closing workflow for {currentOrganization.name}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-violet-700 border-violet-300">
                  {closing.workflow?.fiscal_year || new Date().getFullYear()}
                </Badge>
                {closing.workflow?.status && closing.workflow.status !== 'pending' && (
                  <Badge 
                    className={
                      closing.workflow.status === 'done' 
                        ? "bg-green-100 text-green-800 border-green-300"
                        : closing.workflow.status === 'error'
                        ? "bg-red-100 text-red-800 border-red-300"
                        : "bg-blue-100 text-blue-800 border-blue-300"
                    }
                  >
                    {closing.workflow.status === 'in_progress' && <Clock className="h-3 w-3 mr-1 animate-pulse" />}
                    {closing.workflow.status.charAt(0).toUpperCase() + closing.workflow.status.slice(1).replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {showJournals ? (
                <Button
                  variant="outline"
                  onClick={() => setShowJournals(false)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Back to Workflow
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowJournals(true)}
                    disabled={closing.closingJournals.length === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Journals ({closing.closingJournals.length})
                  </Button>
                  
                  <Button
                    onClick={handleStartClosing}
                    disabled={!workflowStats?.canStart || closing.startClosingWorkflow.isPending}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {closing.startClosingWorkflow.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Closing
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Progress Overview */}
          {workflowStats && closing.workflow?.status === 'in_progress' && (
            <Card>
              <CardContent className="py-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Workflow Progress
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {workflowStats.completedSteps} of {workflowStats.totalSteps} steps completed
                      </div>
                      {workflowStats.currentStep && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Current: {workflowStats.currentStep.name}
                        </div>
                      )}
                    </div>
                    <div className="text-4xl font-bold text-violet-600">
                      {workflowStats.progress}%
                    </div>
                  </div>
                  <Progress value={workflowStats.progress} className="h-3" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workflow Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</div>
                    <div className="text-xl font-bold">
                      {closing.workflow?.status === 'done' ? 'Complete' : 
                       closing.workflow?.status === 'error' ? 'Error' :
                       closing.workflow?.status === 'in_progress' ? 'Running' : 'Ready'}
                    </div>
                  </div>
                  {closing.workflow?.status === 'done' ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : closing.workflow?.status === 'error' ? (
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  ) : closing.workflow?.status === 'in_progress' ? (
                    <Clock className="h-8 w-8 text-blue-500 animate-pulse" />
                  ) : (
                    <Calendar className="h-8 w-8 text-gray-400" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-violet-50 dark:bg-violet-950/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Checklist</div>
                    <div className="text-xl font-bold text-violet-700 dark:text-violet-300">
                      {fiscal.isChecklistComplete() ? 'Complete' : 'Pending'}
                    </div>
                  </div>
                  <FileText className="h-8 w-8 text-violet-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Journal Entries</div>
                    <div className="text-xl font-bold text-green-700 dark:text-green-300">
                      {closing.closingJournals.length}
                    </div>
                  </div>
                  <FileText className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Branches</div>
                    <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                      {branchSummary.completed}/{branchSummary.total}
                    </div>
                  </div>
                  <Building className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Main Content - Workflow or Journal View */}
          {showJournals ? (
            <ClosingJournalDrilldown
              journals={closing.closingJournals}
              isLoading={closing.isJournalsLoading}
              error={closing.journalsError}
            />
          ) : (
            <ClosingWorkflowSteps
              workflow={closing.workflow}
              isLoading={closing.isWorkflowLoading}
              error={closing.workflowError}
              onStepClick={(step) => {
                if (step.journal_entry_id) {
                  setShowJournals(true)
                }
              }}
            />
          )}

          {/* Branch Consolidation Status */}
          {closing.branchStatus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Branch Closing Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {closing.branchStatus.map((branch) => (
                    <div key={branch.branch_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          branch.closing_status === 'done' ? 'bg-green-500' :
                          branch.closing_status === 'in_progress' ? 'bg-blue-500 animate-pulse' :
                          branch.has_errors ? 'bg-red-500' : 'bg-gray-300'
                        }`} />
                        <div>
                          <div className="font-medium">{branch.branch_name}</div>
                          <div className="text-sm text-gray-500">Code: {branch.branch_code}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">Checklist</div>
                          <div className="text-sm text-gray-500">{branch.checklist_completion}%</div>
                        </div>
                        <Badge variant={
                          branch.closing_status === 'done' ? 'default' :
                          branch.closing_status === 'in_progress' ? 'outline' :
                          branch.has_errors ? 'destructive' : 'secondary'
                        }>
                          {branch.closing_status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Sidebar - Checklist */}
        <div className="space-y-6">
          
          <ClosingChecklistPanel
            checklist={fiscal.checklist}
            isLoading={fiscal.isChecklistLoading}
            error={fiscal.checklistError}
            onItemToggle={fiscal.updateChecklistItem}
            isUpdating={fiscal.saveChecklist.isPending}
            isCompact={true}
          />

          {/* Smart Code Info */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  Finance DNA Integration
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <div>• Revenue: HERA.FIN.FISCAL.CLOSING.REVENUE.CALC.v1</div>
                  <div>• Expense: HERA.FIN.FISCAL.CLOSING.EXPENSE.CALC.v1</div>
                  <div>• RE Transfer: HERA.FIN.FISCAL.CLOSING.RE.TRANSFER.v1</div>
                  <div>• Consolidation: HERA.FIN.FISCAL.CLOSING.CONSOLIDATE.v1</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Prerequisites */}
          {!workflowStats?.canStart && closing.workflow?.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Prerequisites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {fiscal.isChecklistComplete() ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={fiscal.isChecklistComplete() ? 'text-green-700' : 'text-gray-600'}>
                      Complete closing checklist
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {fiscal.areAllPeriodsClosed() ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={fiscal.areAllPeriodsClosed() ? 'text-green-700' : 'text-gray-600'}>
                      Close all fiscal periods
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {fiscal.config?.retained_earnings_account ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={fiscal.config?.retained_earnings_account ? 'text-green-700' : 'text-gray-600'}>
                      Configure RE account
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

      </div>

    </div>
  )
}