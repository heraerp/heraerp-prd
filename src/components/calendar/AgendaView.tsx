'use client';

import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import { CalendarItem } from '@/types/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgendaViewProps {
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
}

const SOURCE_COLORS = {
  grants: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-100' },
  cases: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100' },
  playbooks: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-100' },
  payments: { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100' },
  consultations: { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-100' },
};

const CATEGORY_ICONS = {
  deadline: AlertCircle,
  meeting: Users,
  review: Clock,
  milestone: Calendar,
  payment: AlertCircle,
  submission: AlertCircle,
};

export function AgendaView({ items, onItemClick }: AgendaViewProps) {
  // Sort items by date
  const sortedItems = [...items].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Group items by date
  const groupedItems = sortedItems.reduce((groups, item) => {
    const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {} as Record<string, CalendarItem[]>);

  // Get date label
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return format(date, 'EEEE, MMMM d') + ' (Past)';
    
    const daysFromNow = differenceInDays(date, new Date());
    if (daysFromNow <= 7) {
      return format(date, 'EEEE, MMMM d') + ` (in ${daysFromNow} days)`;
    }
    
    return format(date, 'EEEE, MMMM d');
  };

  // Get item status
  const getItemStatus = (item: CalendarItem) => {
    const itemDate = new Date(item.date);
    const now = new Date();
    
    if (item.status === 'completed') return 'completed';
    if (item.status === 'cancelled') return 'cancelled';
    if (isPast(itemDate) && !item.all_day) return 'overdue';
    
    const hoursUntil = (itemDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntil <= 24 && hoursUntil > 0) return 'upcoming';
    
    return 'future';
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {Object.entries(groupedItems).length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
            <p className="text-muted-foreground">
              Your calendar is clear for the selected period.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([dateKey, dateItems]) => {
              const date = new Date(dateKey);
              const isPastDate = isPast(date) && !isToday(date);
              
              return (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className={cn(
                    'flex items-center gap-3 mb-4',
                    isPastDate && 'opacity-60'
                  )}>
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {format(date, 'd')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {getDateLabel(dateKey)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {dateItems.length} {dateItems.length === 1 ? 'event' : 'events'}
                      </p>
                    </div>
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-3">
                    {dateItems.map((item) => {
                      const status = getItemStatus(item);
                      const colors = SOURCE_COLORS[item.source as keyof typeof SOURCE_COLORS];
                      const CategoryIcon = CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || Calendar;

                      return (
                        <Button
                          key={item.id}
                          variant="outline"
                          className={cn(
                            'w-full justify-start p-4 h-auto',
                            status === 'overdue' && 'border-red-500 bg-red-50 dark:bg-red-950/20',
                            status === 'upcoming' && 'border-primary bg-primary/5',
                            status === 'completed' && 'opacity-50',
                            status === 'cancelled' && 'opacity-50 line-through'
                          )}
                          onClick={() => onItemClick(item)}
                        >
                          <div className="flex items-start gap-4 w-full">
                            {/* Time & Icon */}
                            <div className="flex-shrink-0">
                              <div className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                colors.light
                              )}>
                                <CategoryIcon className={cn('h-5 w-5', colors.text)} />
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-left">
                              {/* Title & Time */}
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-semibold line-clamp-1">
                                  {item.title}
                                </h4>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {!item.all_day && (
                                    <span className="text-sm text-muted-foreground">
                                      {format(new Date(item.date), 'h:mm a')}
                                    </span>
                                  )}
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      'text-xs',
                                      colors.bg,
                                      'text-white'
                                    )}
                                  >
                                    {item.source}
                                  </Badge>
                                </div>
                              </div>

                              {/* Description */}
                              {item.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {item.description}
                                </p>
                              )}

                              {/* Meta Information */}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {item.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {item.location}
                                  </div>
                                )}
                                {item.participants && item.participants.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {item.participants.length} participants
                                  </div>
                                )}
                                {item.duration && item.duration !== 60 && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {item.duration} min
                                  </div>
                                )}
                              </div>

                              {/* Status Indicators */}
                              {(status === 'overdue' || status === 'upcoming') && (
                                <div className="flex items-center gap-2 mt-2">
                                  {status === 'overdue' && (
                                    <Badge variant="destructive" className="text-xs">
                                      Overdue
                                    </Badge>
                                  )}
                                  {status === 'upcoming' && (
                                    <Badge variant="default" className="text-xs">
                                      Due soon
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Action Arrow */}
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}