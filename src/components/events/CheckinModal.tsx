import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { QrCode, CheckCircle, Search } from 'lucide-react'
import { useRecordCheckin, useEventInvites } from '@/hooks/use-events'
import { useTrackEngagement } from '@/hooks/use-engagement'
import { useToast } from '@/components/ui/use-toast'
import type { EventInvite } from '@/types/events'

interface CheckinModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  inviteId?: string | null
}

export function CheckinModal({ open, onOpenChange, eventId, inviteId }: CheckinModalProps) {
  const { toast } = useToast()
  const recordCheckin = useRecordCheckin()
  const { trackAction } = useTrackEngagement()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvite, setSelectedInvite] = useState<EventInvite | null>(null)
  const [notes, setNotes] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  const { data: invitesData } = useEventInvites({
    event_id: eventId,
    status: 'registered'
  })

  useEffect(() => {
    if (inviteId && invitesData) {
      const invite = invitesData.items.find(i => i.id === inviteId)
      if (invite) {
        setSelectedInvite(invite)
      }
    }
  }, [inviteId, invitesData])

  const filteredInvites =
    invitesData?.items.filter(
      invite =>
        invite.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invite.ticket_number?.includes(searchTerm)
    ) || []

  const handleCheckin = async () => {
    if (!selectedInvite) return

    await recordCheckin.mutateAsync({
      event_id: eventId,
      invite_id: selectedInvite.id,
      notes
    })

    // Track engagement
    if (selectedInvite.subject_id) {
      trackAction(selectedInvite.subject_id, 'event_attend', {
        event_id: eventId
      })
    }

    toast({
      title: 'Check-in successful',
      description: `${selectedInvite.subject_name} has been checked in.`
    })

    // Reset
    setSelectedInvite(null)
    setSearchTerm('')
    setNotes('')

    // Keep modal open for next check-in
  }

  const handleScanQR = () => {
    setIsScanning(true)
    toast({
      title: 'QR scanning coming soon',
      description: 'This feature will be available in a future update.'
    })
    setTimeout(() => setIsScanning(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Event Check-in</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Scanner Button */}
          <Button
            className="w-full h-32"
            variant="outline"
            onClick={handleScanQR}
            disabled={isScanning}
          >
            <div className="flex flex-col items-center gap-2">
              <QrCode className="h-12 w-12" />
              <span>{isScanning ? 'Scanning...' : 'Scan QR Code'}</span>
            </div>
          </Button>

          <div className="text-center text-sm text-muted-foreground">OR</div>

          {/* Manual Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search by Name or Ticket Number</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="John Doe or TKT-123456"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchTerm && filteredInvites.length > 0 && (
            <div className="border rounded-md max-h-48 overflow-y-auto">
              {filteredInvites.map(invite => (
                <button
                  key={invite.id}
                  className="w-full text-left p-3 hover:bg-muted/50 border-b last:border-b-0"
                  onClick={() => setSelectedInvite(invite)}
                >
                  <p className="font-medium">{invite.subject_name}</p>
                  {invite.ticket_number && (
                    <p className="text-sm text-muted-foreground">Ticket: {invite.ticket_number}</p>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Selected Attendee */}
          {selectedInvite && (
            <div className="bg-muted/50 p-4 rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedInvite.subject_name}</p>
                  {selectedInvite.ticket_number && (
                    <p className="text-sm text-muted-foreground">
                      Ticket: {selectedInvite.ticket_number}
                    </p>
                  )}
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Special accommodations, late arrival, etc."
                  rows={2}
                />
              </div>

              <Button className="w-full" onClick={handleCheckin} disabled={recordCheckin.isPending}>
                {recordCheckin.isPending ? 'Processing...' : 'Confirm Check-in'}
              </Button>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
