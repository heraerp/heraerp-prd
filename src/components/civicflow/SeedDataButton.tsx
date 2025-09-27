'use client'

import { useState } from 'react'
import { Database, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { useOrgStore } from '@/state/org'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export function SeedDataButton() {
  const { currentOrgId } = useOrgStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)

  // Only show for CivicFlow demo organization
  if (currentOrgId !== CIVICFLOW_ORG_ID) {
    return null
  }

  const handleSeed = async () => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/civicflow/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': currentOrgId
        },
        body: JSON.stringify({ action: 'seed' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create seed data')
      }

      toast({
        title: 'Success',
        description: `Created ${data.cases_created || 0} demo cases`
      })

      // Reload the page to show new data
      window.location.reload()
    } catch (error) {
      console.error('Seed error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create seed data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = async () => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/civicflow/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': currentOrgId
        },
        body: JSON.stringify({ action: 'clear' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear data')
      }

      toast({
        title: 'Success',
        description: 'All cases cleared successfully'
      })

      setShowClearDialog(false)

      // Reload the page to show empty state
      window.location.reload()
    } catch (error) {
      console.error('Clear error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to clear data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeed}
          disabled={isLoading}
          className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
        >
          <Database className="mr-2 h-4 w-4" />
          {isLoading ? 'Creating...' : 'Create Demo Data'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowClearDialog(true)}
          disabled={isLoading}
          className="border-[rgb(0,166,166)] text-destructive hover:text-destructive hover:bg-[rgb(0,166,166)]/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </div>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="bg-panel border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-100">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-300">
              This will permanently delete all cases in the CivicFlow demo organization. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              className="bg-destructive hover:bg-destructive/90"
            >
              Clear All Cases
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
