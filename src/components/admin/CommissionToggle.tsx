'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { universalApi } from '@/lib/universal-api-v2'
import { useToast } from '@/hooks/use-toast'

interface CommissionToggleProps {
  organizationId: string
}

export function CommissionToggle({ organizationId }: CommissionToggleProps) {
  const [commissionsEnabled, setCommissionsEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
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

  const toggleCommissions = async (enabled: boolean) => {
    try {
      setUpdating(true)
      universalApi.setOrganizationId(organizationId)

      // Get current organization data
      const orgResponse = await universalApi.getEntity(organizationId)
      if (!orgResponse.success || !orgResponse.data) {
        throw new Error('Failed to load organization data')
      }

      const currentSettings = orgResponse.data.settings || {}
      const updatedSettings = {
        ...currentSettings,
        salon: {
          ...currentSettings.salon,
          commissions: {
            ...currentSettings.salon?.commissions,
            enabled
          }
        }
      }

      // Update organization settings
      const updateResponse = await universalApi.updateEntity(organizationId, {
        settings: updatedSettings
      })

      if (!updateResponse.success) {
        throw new Error(updateResponse.error || 'Failed to update settings')
      }

      setCommissionsEnabled(enabled)
      toast({
        title: 'Success',
        description: `Commissions ${enabled ? 'enabled' : 'disabled'} successfully`,
      })
    } catch (error) {
      console.error('Error updating commission status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update commission settings',
        variant: 'destructive'
      })
      // Revert the UI state
      setCommissionsEnabled(!enabled)
    } finally {
      setUpdating(false)
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
            onCheckedChange={toggleCommissions}
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
            <strong>Note:</strong> Changes take effect immediately. Existing transactions are not affected.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}