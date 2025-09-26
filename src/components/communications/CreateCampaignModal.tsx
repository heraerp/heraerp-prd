'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'
import { useCreateCampaign, useTemplateList, useAudienceList } from '@/hooks/use-communications'
import { isDemoMode } from '@/lib/demo-guard'
import { useOrgStore } from '@/state/org'
import { cn } from '@/lib/utils'

interface CreateCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCampaignModal({ open, onOpenChange }: CreateCampaignModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrgId } = useOrgStore()
  const isDemo = isDemoMode(currentOrgId)

  const [campaignData, setCampaignData] = useState({
    name: '',
    channel: 'email',
    template_id: '',
    audience_id: '',
    schedule_at: undefined as Date | undefined
  })

  const { data: templates } = useTemplateList({ channel: [campaignData.channel], is_active: true })
  const { data: audiences } = useAudienceList({})
  const createMutation = useCreateCampaign()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!campaignData.name || !campaignData.template_id || !campaignData.audience_id) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      const campaign = await createMutation.mutateAsync({
        ...campaignData,
        schedule_at: campaignData.schedule_at?.toISOString()
      })

      toast({
        title: 'Campaign created',
        description: isDemo
          ? 'Campaign created in demo mode (no messages will be sent)'
          : 'Campaign created successfully'
      })

      onOpenChange(false)
      router.push(`/civicflow/communications/campaigns/${campaign.id}`)
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-panel border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-text-100">Create Campaign</DialogTitle>
            <DialogDescription className="text-text-300">
              Create a new communication campaign to reach your audience.
              {isDemo && ' (Demo mode - messages will not be sent)'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-text-200">
                Name
              </Label>
              <Input
                id="name"
                value={campaignData.name}
                onChange={e => setCampaignData({ ...campaignData, name: e.target.value })}
                className="col-span-3 bg-panel-alt border-border text-text-100"
                placeholder="e.g., Holiday Newsletter 2024"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="channel" className="text-right text-text-200">
                Channel
              </Label>
              <Select
                value={campaignData.channel}
                onValueChange={value =>
                  setCampaignData({
                    ...campaignData,
                    channel: value,
                    template_id: '' // Reset template when channel changes
                  })
                }
              >
                <SelectTrigger className="col-span-3 bg-panel-alt border-border text-text-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-panel border-border">
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template" className="text-right text-text-200">
                Template
              </Label>
              <Select
                value={campaignData.template_id}
                onValueChange={value => setCampaignData({ ...campaignData, template_id: value })}
              >
                <SelectTrigger className="col-span-3 bg-panel-alt border-border text-text-100">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent className="bg-panel border-border">
                  {templates?.items?.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="audience" className="text-right text-text-200">
                Audience
              </Label>
              <Select
                value={campaignData.audience_id}
                onValueChange={value => setCampaignData({ ...campaignData, audience_id: value })}
              >
                <SelectTrigger className="col-span-3 bg-panel-alt border-border text-text-100">
                  <SelectValue placeholder="Select an audience" />
                </SelectTrigger>
                <SelectContent className="bg-panel border-border">
                  {audiences?.items?.map(audience => (
                    <SelectItem key={audience.id} value={audience.id}>
                      {audience.entity_name} ({audience.size_estimate} recipients)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="schedule" className="text-right text-text-200">
                Schedule
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'col-span-3 justify-start text-left font-normal bg-panel-alt border-border',
                      !campaignData.schedule_at && 'text-text-500',
                      campaignData.schedule_at && 'text-text-100'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {campaignData.schedule_at ? (
                      format(campaignData.schedule_at, 'PPP')
                    ) : (
                      <span>Send immediately</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-panel border-border">
                  <Calendar
                    mode="single"
                    selected={campaignData.schedule_at}
                    onSelect={date => setCampaignData({ ...campaignData, schedule_at: date })}
                    initialFocus
                    disabled={date => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10">
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white">
              {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
