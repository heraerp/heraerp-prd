import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useCreateEvent } from '@/hooks/use-events'
import type { CreateEventRequest, EventType } from '@/types/events'

interface NewEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NewEventModal({ open, onOpenChange, onSuccess }: NewEventModalProps) {
  const createEvent = useCreateEvent()

  const [formData, setFormData] = useState<Partial<CreateEventRequest>>({
    event_type: 'webinar',
    is_online: false,
    is_hybrid: false
  })
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.entity_name || !startDate || !endDate) {
      return
    }

    // Combine date and time
    const startDateTime = new Date(startDate)
    const [startHour, startMinute] = startTime.split(':')
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute))

    const endDateTime = new Date(endDate)
    const [endHour, endMinute] = endTime.split(':')
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute))

    const data: CreateEventRequest = {
      entity_name: formData.entity_name,
      event_type: formData.event_type as EventType,
      description: formData.description,
      start_datetime: startDateTime.toISOString(),
      end_datetime: endDateTime.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      venue_name: formData.venue_name,
      venue_address: formData.venue_address,
      online_url: formData.online_url,
      is_online: formData.is_online || false,
      is_hybrid: formData.is_hybrid,
      capacity: formData.capacity,
      tags: formData.tags
    }

    await createEvent.mutateAsync(data)
    onSuccess?.()
    onOpenChange(false)

    // Reset form
    setFormData({
      event_type: 'webinar',
      is_online: false,
      is_hybrid: false
    })
    setStartDate(undefined)
    setEndDate(undefined)
    setStartTime('10:00')
    setEndTime('11:00')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-panel border-border overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="text-text-100">Create New Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-text-200">
              Event Name
            </Label>
            <Input
              id="name"
              required
              value={formData.entity_name || ''}
              onChange={e => setFormData({ ...formData, entity_name: e.target.value })}
              placeholder="Annual Community Summit"
              className="bg-panel-alt border-border text-text-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-text-200">
              Event Type
            </Label>
            <Select
              value={formData.event_type}
              onValueChange={value => setFormData({ ...formData, event_type: value as EventType })}
            >
              <SelectTrigger id="type" className="bg-panel-alt border-border text-text-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-panel border-border">
                <SelectItem value="webinar">Webinar</SelectItem>
                <SelectItem value="roundtable">Roundtable</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-text-200">Start Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-panel-alt border-border',
                      !startDate && 'text-text-500',
                      startDate && 'text-text-100'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-panel border-border">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="bg-panel-alt border-border text-text-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-text-200">End Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-panel-alt border-border',
                      !endDate && 'text-text-500',
                      endDate && 'text-text-100'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-panel border-border">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="bg-panel-alt border-border text-text-100"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="online"
                checked={formData.is_online}
                onCheckedChange={checked =>
                  setFormData({
                    ...formData,
                    is_online: checked,
                    is_hybrid: checked && formData.is_hybrid ? false : formData.is_hybrid
                  })
                }
              />
              <Label htmlFor="online" className="text-text-200">
                Online Event
              </Label>
            </div>

            {!formData.is_online && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="hybrid"
                  checked={formData.is_hybrid}
                  onCheckedChange={checked => setFormData({ ...formData, is_hybrid: checked })}
                />
                <Label htmlFor="hybrid" className="text-text-200">
                  Hybrid Event (In-person + Online)
                </Label>
              </div>
            )}
          </div>

          {(formData.is_online || formData.is_hybrid) && (
            <div className="space-y-2">
              <Label htmlFor="url" className="text-text-200">
                Online URL
              </Label>
              <Input
                id="url"
                type="url"
                value={formData.online_url || ''}
                onChange={e => setFormData({ ...formData, online_url: e.target.value })}
                placeholder="https://zoom.us/..."
                className="bg-panel-alt border-border text-text-100"
              />
            </div>
          )}

          {(!formData.is_online || formData.is_hybrid) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="venue" className="text-text-200">
                  Venue Name
                </Label>
                <Input
                  id="venue"
                  value={formData.venue_name || ''}
                  onChange={e => setFormData({ ...formData, venue_name: e.target.value })}
                  placeholder="Community Center Main Hall"
                  className="bg-panel-alt border-border text-text-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-text-200">
                  Venue Address
                </Label>
                <Input
                  id="address"
                  value={formData.venue_address || ''}
                  onChange={e => setFormData({ ...formData, venue_address: e.target.value })}
                  placeholder="123 Main St, City, State"
                  className="bg-panel-alt border-border text-text-100"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="capacity" className="text-text-200">
              Capacity (optional)
            </Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity || ''}
              onChange={e =>
                setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })
              }
              placeholder="100"
              className="bg-panel-alt border-border text-text-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-text-200">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Join us for an engaging discussion about..."
              rows={3}
              className="bg-panel-alt border-border text-text-100"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEvent.isPending}
              className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
            >
              {createEvent.isPending ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
