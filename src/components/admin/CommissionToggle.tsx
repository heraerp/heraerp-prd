'use client'

import React from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { universalApi } from '@/lib/universal-api-v2'
import { useToast } from '@/hooks/use-toast'
import { toggleCommissionsAction } from '@/app/admin/settings/salon/actions'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface CommissionToggleProps {
  organizationId: string
}

export function CommissionToggle({ organizationId }: CommissionToggleProps) {
  const [commissionsEnabled, setCommissionsEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showReasonDialog, setShowReasonDialog] = useState(false)
  const [pendingEnabled, setPendingEnabled] = useState(false)
  const [reason, setReason] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadCommissionStatus()
  }, [organizationId])

  const loadCommissionStatus = async () => {
    try {
      setLoading(true)
      universalApi.setOrganizationId(organizationId)

      const orgResponse = await universalApi.getEntity(organizationId)
      if (orgResponse.success && orgResponse.data) {
        const settings = orgResponse.data.settings || {}
        const enabled = settings?.salon?.commissions?.enabled ?? true
        setCommissionsEnabled(enabled)
      }
    } catch (error) {
      console.error('Error loading commission status:', error)
      toast({
        title: 'Error',
        description: 'Failed to load commission settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRequest = (enabled: boolean) => {
    setPendingEnabled(enabled)
    setShowReasonDialog(true)
  }

  const toggleCommissions = async () => {
    try {
      setUpdating(true)
      setShowReasonDialog(false)

      // Use server action for secure update
      const result = await toggleCommissionsAction(organizationId, pendingEnabled, reason)

      if (!result.success) {
        throw new Error(result.error || 'Failed to update settings')
      }

      setCommissionsEnabled(pendingEnabled)

      // Success toast with icon
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Commission Settings Updated</span>
          </div>
        ) as any,
        description: result.message,
        duration: 5000
      })
    } catch (error) {
      console.error('Error updating commission status:', error)
      toast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Update Failed</span>
          </div>
        ) as any,
        description:
          error instanceof Error ? error.message : 'Failed to update commission settings',
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
      setReason('')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commission Settings</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Commission Settings</CardTitle>
          <CardDescription>
            Control whether the POS system requires stylist assignment and calculates commissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="commission-toggle"
              checked={commissionsEnabled}
              onCheckedChange={handleToggleRequest}
              disabled={updating}
            />
            <Label htmlFor="commission-toggle" className="text-sm font-medium">
              {commissionsEnabled ? 'Commissions Enabled' : 'Commissions Disabled'}
            </Label>
          </div>

          <div className="text-sm text-muted-foreground">
            {commissionsEnabled ? (
              <>
                <strong>Current Mode:</strong> Full commission tracking
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>Services require stylist assignment</li>
                  <li>Commission lines automatically generated</li>
                  <li>Full audit trail and reporting</li>
                </ul>
              </>
            ) : (
              <>
                <strong>Current Mode:</strong> Simple POS
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>Services can be sold without stylist assignment</li>
                  <li>No commission calculations or lines</li>
                  <li>Faster checkout process</li>
                </ul>
              </>
            )}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-950 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Changes take effect immediately. Existing transactions are not
              affected.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reason Dialog */}
      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Commission Settings Change</DialogTitle>
            <DialogDescription>
              You are about to {pendingEnabled ? 'enable' : 'disable'} commissions for this
              organization. Please provide a reason for this change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for change (optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Simplifying operations, Staff request, Testing new workflow..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              This change will be logged for audit purposes. The system enforces a 30-second
              cooldown between changes.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReasonDialog(false)
                setReason('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={toggleCommissions} disabled={updating}>
              {updating ? 'Updating...' : 'Confirm Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
