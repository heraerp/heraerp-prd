// ============================================================================
// HERA • Reschedule Side Panel Component
// ============================================================================

import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, AlertCircle, MapPin, User } from 'lucide-react';
import { KanbanCard } from '@/schemas/kanban';
import * as playbook from '@/lib/playbook/appointments';
import { between, rankByTime } from '@/lib/kanban/rank';
import { useToast } from '@/hooks/use-toast';

const TIMEZONE = 'Europe/London';

interface ReschedulePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: KanbanCard | null;
  organization_id: string;
  branch_id: string;
  branches?: Array<{ id: string; name: string }>;
  staff?: Array<{ id: string; name: string }>;
  currentUserId: string;
}

export function ReschedulePanel({
  open,
  onOpenChange,
  appointment,
  organization_id,
  branch_id,
  branches = [],
  staff = [],
  currentUserId
}: ReschedulePanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  
  // Form state
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(branch_id);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [reason, setReason] = useState('');

  // Initialize form when appointment changes
  useEffect(() => {
    if (appointment) {
      const apptDate = parseISO(appointment.start);
      setDate(apptDate);
      setStartTime(format(apptDate, 'HH:mm'));
      setEndTime(format(parseISO(appointment.end), 'HH:mm'));
      setSelectedBranch(appointment.branch_id);
      setSelectedStaff(appointment.metadata?.staff_id || '');
    }
  }, [appointment]);

  // Check for conflicts
  const checkConflicts = async () => {
    if (!selectedStaff || !date || !startTime || !endTime) return;

    try {
      // Combine date and time
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const newStart = new Date(date);
      newStart.setHours(startHour, startMin, 0, 0);
      const newEnd = new Date(date);
      newEnd.setHours(endHour, endMin, 0, 0);

      // Convert to timezone
      const zonedStart = fromZonedTime(newStart, TIMEZONE);
      const zonedEnd = fromZonedTime(newEnd, TIMEZONE);

      // Check for conflicts (mock - replace with actual API)
      const response = await fetch('/api/v1/appointments/conflicts?' + new URLSearchParams({
        organization_id,
        staff_id: selectedStaff,
        start: zonedStart.toISOString(),
        end: zonedEnd.toISOString(),
        exclude_id: appointment?.id || ''
      }));

      if (response.ok) {
        const data = await response.json();
        setConflicts(data.conflicts || []);
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkConflicts, 500);
    return () => clearTimeout(timer);
  }, [selectedStaff, date, startTime, endTime]);

  const handleSubmit = async () => {
    if (!appointment || !date || !startTime || !endTime) return;

    setLoading(true);
    
    try {
      // Build from/to payload
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const newStart = new Date(date);
      newStart.setHours(startHour, startMin, 0, 0);
      const newEnd = new Date(date);
      newEnd.setHours(endHour, endMin, 0, 0);

      const zonedStart = fromZonedTime(newStart, TIMEZONE);
      const zonedEnd = fromZonedTime(newEnd, TIMEZONE);

      const from = {
        start: appointment.start,
        end: appointment.end,
        branch_id: appointment.branch_id,
        staff_id: appointment.metadata?.staff_id
      };

      const to = {
        start: zonedStart.toISOString(),
        end: zonedEnd.toISOString(),
        branch_id: selectedBranch,
        staff_id: selectedStaff || undefined
      };

      // Post reschedule event
      await playbook.postReschedule({
        organization_id,
        appointment_id: appointment.id,
        reason,
        from,
        to
      });

      // Update appointment
      await playbook.updateAppointment(appointment.id, {
        when_ts: zonedStart.toISOString(),
        branch_id: selectedBranch,
        metadata: {
          start: zonedStart.toISOString(),
          end: zonedEnd.toISOString(),
          staff_id: selectedStaff || undefined
        }
      });

      // Update rank for new position
      const newDate = format(date, 'yyyy-MM-dd');
      const newRank = rankByTime(newDate, startTime);
      
      await playbook.upsertKanbanRank({
        appointment_id: appointment.id,
        column: appointment.status,
        rank: newRank,
        branch_id: selectedBranch,
        date: newDate,
        organization_id
      });

      toast({
        title: 'Appointment rescheduled',
        description: `Moved to ${format(date, 'MMM d')} at ${startTime}`
      });

      onOpenChange(false);
      // Trigger reload in parent (better way would be to pass a callback)
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error rescheduling:', error);
      toast({
        title: 'Failed to reschedule',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Reschedule Appointment</SheetTitle>
          <SheetDescription>
            Change the date, time, branch, or staff member for this appointment
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Date picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < startOfDay(new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>End time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Branch select */}
          {branches.length > 0 && (
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {branch.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Staff select */}
          {staff.length > 0 && (
            <div className="space-y-2">
              <Label>Staff member</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Conflicts alert */}
          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Conflicts detected with existing appointments.
                {conflicts.map((c, i) => (
                  <div key={i} className="mt-1 text-xs">
                    {format(parseISO(c.start), 'HH:mm')} - {format(parseISO(c.end), 'HH:mm')} 
                    {' '}with {c.customer_name}
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason for rescheduling (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Customer requested, Staff availability..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              disabled={loading || !date || !startTime || !endTime}
            >
              {conflicts.length > 0 ? 'Override & Reschedule' : 'Reschedule'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}