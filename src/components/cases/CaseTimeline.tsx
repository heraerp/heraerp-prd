/**
 * Case Timeline Component
 * Displays chronological events for a case
 */

import React from 'react';
import { format } from 'date-fns';
import { 
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  DollarSign,
  Download,
  MessageSquare,
  User
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { CaseTimelineProps } from '@/types/cases';

const eventIcons: Record<string, React.ElementType> = {
  created: Clock,
  approved: CheckCircle,
  variation: Edit,
  waiver: FileText,
  breach: AlertTriangle,
  closed: XCircle,
  payment: DollarSign,
  export: Download,
  note: MessageSquare,
  unknown: FileText,
};

const eventColors: Record<string, string> = {
  created: 'text-blue-600 bg-blue-100',
  approved: 'text-green-600 bg-green-100',
  variation: 'text-yellow-600 bg-yellow-100',
  waiver: 'text-purple-600 bg-purple-100',
  breach: 'text-red-600 bg-red-100',
  closed: 'text-gray-600 bg-gray-100',
  payment: 'text-emerald-600 bg-emerald-100',
  export: 'text-indigo-600 bg-indigo-100',
  note: 'text-cyan-600 bg-cyan-100',
  unknown: 'text-slate-600 bg-slate-100',
};

export function CaseTimeline({ events, loading }: CaseTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No timeline events yet
      </Card>
    );
  }

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = format(new Date(event.event_date), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, typeof events>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date}>
          <div className="sticky top-0 bg-background z-10 py-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {format(new Date(date), 'MMMM d, yyyy')}
            </h4>
          </div>
          <div className="relative pl-10 space-y-4">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
            
            {dateEvents.map((event, idx) => {
              const Icon = eventIcons[event.event_type] || eventIcons.unknown;
              const colorClass = eventColors[event.event_type] || eventColors.unknown;
              
              return (
                <div key={event.id} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute -left-5 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-medium capitalize">
                          {event.event_type.replace('_', ' ')}
                        </h5>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <User className="h-3 w-3" />
                          <span>{event.user_name}</span>
                          <span>•</span>
                          <span>{format(new Date(event.event_date), 'h:mm a')}</span>
                        </div>
                      </div>
                      {event.metadata?.severity && (
                        <Badge variant="destructive">
                          {event.metadata.severity}
                        </Badge>
                      )}
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                    
                    {/* Metadata details */}
                    {event.metadata && (
                      <div className="mt-3 space-y-1">
                        {event.metadata.change_type && (
                          <div className="text-sm">
                            <span className="font-medium">Change Type:</span> {event.metadata.change_type}
                          </div>
                        )}
                        {event.metadata.budget_delta && (
                          <div className="text-sm">
                            <span className="font-medium">Budget Change:</span> ${event.metadata.budget_delta.toLocaleString()}
                          </div>
                        )}
                        {event.metadata.category && (
                          <div className="text-sm">
                            <span className="font-medium">Category:</span> {event.metadata.category}
                          </div>
                        )}
                        {event.metadata.outcome && (
                          <div className="text-sm">
                            <span className="font-medium">Outcome:</span> {event.metadata.outcome}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}