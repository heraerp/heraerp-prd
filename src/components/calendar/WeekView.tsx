'use client';

import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  addHours,
  startOfDay,
} from 'date-fns';
import { CalendarItem } from '@/types/calendar';
import { cn } from '@/lib/utils';

interface WeekViewProps {
  currentDate: Date;
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
}

const SOURCE_COLORS = {
  grants: 'bg-blue-500',
  cases: 'bg-green-500',
  playbooks: 'bg-purple-500',
  payments: 'bg-yellow-500',
  consultations: 'bg-pink-500',
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeekView({ currentDate, items, onItemClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Calculate item positions
  const getItemStyle = (item: CalendarItem) => {
    const itemDate = new Date(item.date);
    const hour = itemDate.getHours();
    const minutes = itemDate.getMinutes();
    const top = (hour + minutes / 60) * 60; // 60px per hour
    const duration = item.duration || 60; // default 60 minutes
    const height = (duration / 60) * 60;

    return {
      top: `${top}px`,
      height: `${height}px`,
      minHeight: '20px',
    };
  };

  // Group items by day
  const itemsByDay = items.reduce((acc, item) => {
    const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, CalendarItem[]>);

  return (
    <div className="h-full flex flex-col">
      {/* Header with day labels */}
      <div className="border-b sticky top-0 z-10 bg-background">
        <div className="grid grid-cols-8 gap-1">
          <div className="w-20" /> {/* Time column spacer */}
          {weekDays.map((day) => {
            const isDayToday = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'text-center py-2 px-2 rounded-t-md',
                  isDayToday && 'bg-primary/10'
                )}
              >
                <div className="text-sm font-medium">
                  {format(day, 'EEE')}
                </div>
                <div className={cn(
                  'text-2xl font-bold',
                  isDayToday && 'text-primary'
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8 gap-1 min-h-[1440px]"> {/* 24 hours * 60px */}
          {/* Time labels */}
          <div className="w-20 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-xs text-muted-foreground text-right pr-2"
                style={{ top: `${hour * 60 - 8}px` }}
              >
                {format(addHours(startOfDay(new Date()), hour), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayItems = itemsByDay[dateKey] || [];
            const isDayToday = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'relative border border-muted/20 rounded-md',
                  isDayToday && 'bg-primary/5 border-primary/20'
                )}
              >
                {/* Hour lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-muted/30"
                    style={{ top: `${hour * 60}px` }}
                  />
                ))}

                {/* Events */}
                {dayItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className={cn(
                      'absolute left-1 right-1 rounded px-2 py-1 overflow-hidden',
                      'hover:opacity-80 transition-opacity text-white text-xs',
                      SOURCE_COLORS[item.source as keyof typeof SOURCE_COLORS]
                    )}
                    style={getItemStyle(item)}
                  >
                    <div className="font-medium">
                      {format(new Date(item.date), 'h:mm a')}
                    </div>
                    <div className="truncate">{item.title}</div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}