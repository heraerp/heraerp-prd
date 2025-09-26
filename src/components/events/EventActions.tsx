'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { RefreshCw } from 'lucide-react'

interface EventActionsProps {
  organizationId: string
  onSyncComplete?: () => void
}

export function EventActions({ organizationId, onSyncComplete }: EventActionsProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()
  
  const handleSyncFromEventbrite = async () => {
    setIsSyncing(true)
    
    try {
      // Use demo sync endpoint for now
      const response = await fetch('/api/integration-hub/demo-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': organizationId
        },
        body: JSON.stringify({
          vendor: 'eventbrite',
          domain: 'events'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Sync failed')
      }

      const result = await response.json()

      if (result.success && result.data) {
        // For demo sync, we get the data directly
        const { events, attendees } = result.data
        const { stats } = result

        toast({
          title: 'Sync completed',
          description: `Successfully synced ${stats.eventsProcessed} events and ${stats.attendeesProcessed} attendees from Eventbrite`
        })
        
        // Store the synced data in localStorage for the events page to pick up
        localStorage.setItem('eventbrite_sync_data', JSON.stringify({
          events,
          attendees,
          syncedAt: new Date().toISOString()
        }))
        
        setIsSyncing(false)
        if (onSyncComplete) onSyncComplete()
      } else {
        throw new Error(result.error || 'Sync failed')
      }

    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to start sync',
        variant: 'destructive'
      })
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={handleSyncFromEventbrite}
        disabled={isSyncing}
        variant="outline"
        size="sm"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Sync from Eventbrite'}
      </Button>
    </div>
  )
}