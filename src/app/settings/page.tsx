'use client'
import React from 'react'

import { useState } from 'react'
import { useOrgStore } from '@/state/org'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import type { OrgId } from '@/types/common'

export default function SettingsPage() {
  const { currentOrgId, setCurrentOrgId, isHydrated } = useOrgStore()
  const [inputOrgId, setInputOrgId] = useState(currentOrgId || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleOrgChange = async () => {
    if (!inputOrgId.trim()) {
      toast({
        title: 'Invalid Organization ID',
        description: 'Please enter a valid organization ID.',
        variant: 'destructive'
      })
      return
    }

    setIsUpdating(true)

    try {
      // Update the organization via the store (which persists via setOrgId)
      setCurrentOrgId(inputOrgId.trim() as OrgId)

      // Show success message
      toast({
        title: 'Organization Updated',
        description: `Switched to organization: ${inputOrgId.trim()}`
      })

      // Trigger a soft refetch of active queries
      await queryClient.refetchQueries({ type: 'active' })
    } catch (error) {
      console.error('Error updating organization:', error)
      toast({
        title: 'Update Failed',
        description: 'Failed to update organization. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClearOrg = () => {
    setCurrentOrgId(null)
    setInputOrgId('')
    toast({
      title: 'Organization Cleared',
      description: 'No organization is currently selected.'
    })
  }

  if (!isHydrated) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 mb-8">
          Manage your application settings and organization context.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Organization Context</CardTitle>
            <CardDescription>
              Set the organization ID for multi-tenant data access. All API calls will be scoped to
              this organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgId">Organization ID</Label>
              <Input
                id="orgId"
                type="text"
                placeholder="Enter organization ID (e.g., org_123456)"
                value={inputOrgId}
                onChange={e => setInputOrgId(e.target.value)}
                disabled={isUpdating}
              />
              {currentOrgId && (
                <p className="text-sm text-gray-500">
                  Current: <code className="bg-gray-100 px-1 rounded">{currentOrgId}</code>
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleOrgChange}
                disabled={isUpdating || inputOrgId.trim() === currentOrgId}
              >
                {isUpdating ? 'Updating...' : 'Update Organization'}
              </Button>

              {currentOrgId && (
                <Button variant="outline" onClick={handleClearOrg} disabled={isUpdating}>
                  Clear
                </Button>
              )}
            </div>

            <div className="text-sm text-gray-500 border-t pt-4">
              <p>
                <strong>Note:</strong> Changing the organization will:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Clear all cached data</li>
                <li>Reload all active queries with the new organization context</li>
                <li>Persist the selection in browser storage</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
