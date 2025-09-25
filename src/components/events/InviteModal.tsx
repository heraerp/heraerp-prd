import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Search, Users, Building2 } from 'lucide-react'
import { useSendInvitations } from '@/hooks/use-events'
import { useConstituents } from '@/hooks/use-constituents'
import { useOrganizations } from '@/hooks/use-civicflow-organizations'
import { useTrackEngagement } from '@/hooks/use-engagement'
import { useToast } from '@/components/ui/use-toast'

interface InviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  eventName: string
}

export function InviteModal({ open, onOpenChange, eventId, eventName }: InviteModalProps) {
  const { toast } = useToast()
  const sendInvitations = useSendInvitations()
  const { trackAction } = useTrackEngagement()

  const [subjectType, setSubjectType] = useState<'constituent' | 'organization'>('constituent')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Queries
  const { data: constituentsData } = useConstituents({ search: searchTerm })
  const { data: organizationsData } = useOrganizations({ search: searchTerm })

  const subjects =
    subjectType === 'constituent' ? constituentsData?.items : organizationsData?.items

  const handleSend = async () => {
    if (selectedIds.length === 0) {
      toast({ title: 'Please select at least one recipient', variant: 'destructive' })
      return
    }

    await sendInvitations.mutateAsync({
      event_id: eventId,
      subject_ids: selectedIds,
      subject_type: subjectType,
      message
    })

    // Track engagement for each invited subject
    for (const subjectId of selectedIds) {
      trackAction(subjectId, 'event_register', {
        event_id: eventId,
        event_name: eventName
      })
    }

    onOpenChange(false)
    setSelectedIds([])
    setMessage('')
  }

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const selectAll = () => {
    if (subjects) {
      setSelectedIds(subjects.map(s => s.id))
    }
  }

  const deselectAll = () => {
    setSelectedIds([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Send Event Invitations</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Inviting to: <span className="font-medium">{eventName}</span>
            </p>
          </div>

          <Tabs
            value={subjectType}
            onValueChange={v => setSubjectType(v as 'constituent' | 'organization')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="constituent">
                <Users className="h-4 w-4 mr-2" />
                Constituents
              </TabsTrigger>
              <TabsTrigger value="organization">
                <Building2 className="h-4 w-4 mr-2" />
                Organizations
              </TabsTrigger>
            </TabsList>

            <TabsContent value={subjectType} className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${subjectType}s...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Selection info */}
              {selectedIds.length > 0 && (
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                  <span className="text-sm">{selectedIds.length} selected</span>
                  <div className="space-x-2">
                    <Button size="sm" variant="outline" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button size="sm" variant="outline" onClick={deselectAll}>
                      Deselect All
                    </Button>
                  </div>
                </div>
              )}

              {/* Subject list */}
              <div className="max-h-64 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects?.map((subject: any) => (
                      <TableRow
                        key={subject.id}
                        className="cursor-pointer"
                        onClick={() => toggleSelection(subject.id)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(subject.id)}
                            onCheckedChange={() => toggleSelection(subject.id)}
                            onClick={e => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{subject.entity_name}</TableCell>
                        <TableCell>{subject.email || '-'}</TableCell>
                        <TableCell>
                          {subject.tags?.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="mr-1">
                              {tag}
                            </Badge>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Custom Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={selectedIds.length === 0 || sendInvitations.isPending}
            >
              {sendInvitations.isPending
                ? 'Sending...'
                : `Send ${selectedIds.length} Invitation${selectedIds.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
