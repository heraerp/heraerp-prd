'use client'

import { useState, useEffect } from 'react'
import { UniversalWorkflow } from '@/lib/universal-workflow'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MoreHorizontal,
  ArrowRight,
  History
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface WorkflowTrackerProps {
  transactionId: string
  organizationId: string
  userId: string
  onStatusChange?: (newStatus: any) => void
  compact?: boolean
}

export function UniversalWorkflowTracker({ 
  transactionId, 
  organizationId,
  userId,
  onStatusChange,
  compact = false
}: WorkflowTrackerProps) {
  const [currentStatus, setCurrentStatus] = useState<any>(null)
  const [availableTransitions, setAvailableTransitions] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const [showTransitionDialog, setShowTransitionDialog] = useState(false)
  const [selectedTransition, setSelectedTransition] = useState<any>(null)
  const [transitionReason, setTransitionReason] = useState('')
  
  const { toast } = useToast()
  const workflow = new UniversalWorkflow(organizationId)
  
  useEffect(() => {
    loadWorkflowData()
  }, [transactionId])
  
  const loadWorkflowData = async () => {
    try {
      setLoading(true)
      const [status, transitions, workflowHistory] = await Promise.all([
        workflow.getCurrentStatus(transactionId),
        workflow.getAvailableTransitions(transactionId),
        workflow.getWorkflowHistory(transactionId)
      ])
      
      setCurrentStatus(status)
      setAvailableTransitions(transitions)
      setHistory(workflowHistory)
    } catch (error) {
      console.error('Failed to load workflow data:', error)
      toast({
        title: "Error",
        description: "Failed to load workflow status",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleTransition = async () => {
    if (!selectedTransition) return
    
    try {
      setTransitioning(true)
      await workflow.transitionStatus(transactionId, selectedTransition.id, {
        userId,
        reason: transitionReason,
        metadata: {
          transition_type: 'manual',
          from_status: currentStatus?.entity_code,
          to_status: selectedTransition.code
        }
      })
      
      toast({
        title: "Status Updated",
        description: `Changed to ${selectedTransition.name}`
      })
      
      await loadWorkflowData()
      onStatusChange?.(selectedTransition)
      setShowTransitionDialog(false)
      setSelectedTransition(null)
      setTransitionReason('')
    } catch (error) {
      console.error('Transition failed:', error)
      toast({
        title: "Transition Failed",
        description: error.message || "Failed to update status",
        variant: "destructive"
      })
    } finally {
      setTransitioning(false)
    }
  }
  
  const getStatusIcon = (statusCode: string) => {
    if (statusCode?.includes('COMPLETED') || statusCode?.includes('PAID')) {
      return <CheckCircle className="w-4 h-4" />
    }
    if (statusCode?.includes('CANCELLED') || statusCode?.includes('FAILED')) {
      return <XCircle className="w-4 h-4" />
    }
    if (statusCode?.includes('PROCESSING') || statusCode?.includes('SERVICE')) {
      return <Clock className="w-4 h-4" />
    }
    return <AlertCircle className="w-4 h-4" />
  }
  
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    )
  }
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {currentStatus && (
          <>
            <Badge 
              style={{ backgroundColor: currentStatus.metadata?.color || '#6B7280' }}
              className="text-white"
            >
              {getStatusIcon(currentStatus.entity_code)}
              <span className="ml-1">{currentStatus.entity_name}</span>
            </Badge>
            
            {availableTransitions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableTransitions.map(transition => (
                    <DropdownMenuItem
                      key={transition.id}
                      onClick={() => {
                        setSelectedTransition(transition)
                        setShowTransitionDialog(true)
                      }}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      {transition.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </div>
    )
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Workflow Status</span>
            {history.length > 0 && (
              <Badge variant="outline" className="font-normal">
                <History className="mr-1 h-3 w-3" />
                {history.length} changes
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Status</p>
              {currentStatus ? (
                <div className="flex items-center gap-2">
                  <Badge 
                    style={{ backgroundColor: currentStatus.metadata?.color || '#6B7280' }}
                    className="text-white"
                  >
                    {getStatusIcon(currentStatus.entity_code)}
                    <span className="ml-1">{currentStatus.entity_name}</span>
                  </Badge>
                  {currentStatus.metadata?.is_final && (
                    <Badge variant="outline" className="text-xs">Final</Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No status assigned</p>
              )}
            </div>
            
            {/* Status Actions */}
            {availableTransitions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    Change Status
                    <MoreHorizontal className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Available Transitions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableTransitions.map(transition => (
                    <DropdownMenuItem
                      key={transition.id}
                      onClick={() => {
                        setSelectedTransition(transition)
                        setShowTransitionDialog(true)
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{transition.name}</span>
                        {transition.metadata?.transition?.requiresApproval && (
                          <Badge variant="outline" className="text-xs ml-2">
                            Approval
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Workflow Timeline */}
          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Status History</p>
              <div className="space-y-2">
                {history.slice(0, 5).map((item, index) => (
                  <div 
                    key={index} 
                    className={`flex items-start gap-3 text-sm p-2 rounded-lg ${
                      item.isActive ? 'bg-muted' : ''
                    }`}
                  >
                    <div 
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: item.metadata?.color || '#6B7280' }}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.statusName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.assignedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {item.reason && (
                        <p className="text-xs text-muted-foreground">
                          {item.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {history.length > 5 && (
                <Button variant="link" size="sm" className="h-auto p-0">
                  View all {history.length} changes
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Transition Dialog */}
      <Dialog open={showTransitionDialog} onOpenChange={setShowTransitionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              {currentStatus && selectedTransition && (
                <>
                  Changing from <strong>{currentStatus.entity_name}</strong> to{' '}
                  <strong>{selectedTransition.name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for change (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for status change..."
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                rows={3}
              />
            </div>
            {selectedTransition?.metadata?.transition?.requiresApproval && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">
                  This transition requires approval. The request will be sent for review.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTransitionDialog(false)
                setSelectedTransition(null)
                setTransitionReason('')
              }}
              disabled={transitioning}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleTransition}
              disabled={transitioning}
            >
              {transitioning ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}