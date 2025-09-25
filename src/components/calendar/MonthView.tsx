'use client';

import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { CalendarItem } from '@/types/calendar';
import { cn } from '@/lib/utils';

interface MonthViewProps {
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

export function MonthView({ currentDate, items, onItemClick }: MonthViewProps) {
  // Calculate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Group items by date
  const itemsByDate = items.reduce((acc, item) => {
    const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, CalendarItem[]>);

  return (
    <div className="h-full p-4">
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {calendarDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayItems = itemsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div
              key={dateKey}
              className={cn(
                'border border-muted/20 rounded-md p-2 min-h-[120px] cursor-pointer transition-colors',
                'hover:border-muted/40 hover:bg-muted/5',
                !isCurrentMonth && 'bg-muted/10 opacity-50',
                isDayToday && 'border-primary bg-primary/5'
              )}
            >
              {/* Date Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-sm font-medium',
                    !isCurrentMonth && 'text-muted-foreground',
                    isDayToday && 'text-primary font-bold'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayItems.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{dayItems.length - 3}
                  </span>
                )}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className={cn(
                      'w-full text-left px-1 py-0.5 rounded text-xs truncate',
                      'hover:opacity-80 transition-opacity',
                      SOURCE_COLORS[item.source as keyof typeof SOURCE_COLORS],
                      'text-white'
                    )}
                  >
                    <span className="font-medium">{format(new Date(item.date), 'h:mm a')}</span>
                    <span className="ml-1">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}