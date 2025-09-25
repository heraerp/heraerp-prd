'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useCampaignSchedule } from '@/hooks/use-communications';
import { isDemoMode } from '@/lib/demo-guard';
import { useOrgStore } from '@/state/org';
import { cn } from '@/lib/utils';
import type { Campaign } from '@/types/communications';

interface ScheduleCampaignModalProps {
  campaign: Campaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduled?: () => void;
}

export function ScheduleCampaignModal({ 
  campaign, 
  open, 
  onOpenChange,
  onScheduled 
}: ScheduleCampaignModalProps) {
  const { toast } = useToast();
  const { currentOrgId } = useOrgStore();
  const isDemo = isDemoMode(currentOrgId);
  
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [throttlePerMin, setThrottlePerMin] = useState<number | undefined>(undefined);
  
  const scheduleMutation = useCampaignSchedule();
  
  const handleSchedule = async () => {
    if (!scheduleDate) {
      toast({
        title: 'Schedule date required',
        description: 'Please select a date and time for the campaign',
        variant: 'destructive',
      });
      return;
    }
    
    // Combine date and time
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const scheduleDateTime = new Date(scheduleDate);
    scheduleDateTime.setHours(hours, minutes, 0, 0);
    
    try {
      await scheduleMutation.mutateAsync({
        campaignId: campaign.id,
        schedule_at: scheduleDateTime.toISOString(),
        throttle_per_min: throttlePerMin,
      });
      
      toast({
        title: isDemo ? 'Campaign scheduled (demo)' : 'Campaign scheduled',
        description: isDemo 
          ? 'Campaign scheduled in demo mode - no messages will be sent'
          : `Campaign scheduled for ${format(scheduleDateTime, 'PPp')}`,
      });
      
      onScheduled?.();
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handleSendNow = async () => {
    try {
      await scheduleMutation.mutateAsync({
        campaignId: campaign.id,
        schedule_at: new Date().toISOString(),
        throttle_per_min: throttlePerMin,
      });
      
      toast({
        title: isDemo ? 'Campaign started (demo)' : 'Campaign started',
        description: isDemo 
          ? 'Campaign started in demo mode - no messages will be sent'
          : 'Campaign is now sending to recipients',
      });
      
      onScheduled?.();
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Schedule Campaign</DialogTitle>
          <DialogDescription>
            Choose when to send "{campaign.entity_name}" to {campaign.audience_size.toLocaleString()} recipients.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'col-span-3 justify-start text-left font-normal',
                    !scheduleDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduleDate ? format(scheduleDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={scheduleDate}
                  onSelect={setScheduleDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">
              Time
            </Label>
            <Select value={scheduleTime} onValueChange={setScheduleTime}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return (
                    <SelectItem key={i} value={`${hour}:00`}>
                      {hour}:00
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="throttle" className="text-right">
              Throttle
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="throttle"
                type="number"
                placeholder="Messages per minute (optional)"
                value={throttlePerMin || ''}
                onChange={(e) => setThrottlePerMin(e.target.value ? Number(e.target.value) : undefined)}
              />
              <p className="text-xs text-muted-foreground">
                Limit sending rate to avoid overwhelming recipients
              </p>
            </div>
          </div>
          
          {campaign.channel === 'email' && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Scheduling in recipient's timezone ensures optimal open rates. 
                Messages will be sent at the scheduled time in each recipient's local timezone.
              </AlertDescription>
            </Alert>
          )}
          
          {isDemo && (
            <Alert className="border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription>
                <strong>Demo Mode:</strong> Campaign will be scheduled but no actual messages will be sent.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={handleSendNow}
            disabled={scheduleMutation.isPending}
          >
            Send Now
          </Button>
          <Button 
            onClick={handleSchedule} 
            disabled={scheduleMutation.isPending || !scheduleDate}
          >
            {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}