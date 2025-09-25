'use client';

import { 
  startOfYear, 
  endOfYear, 
  eachDayOfInterval,
  format,
  getDay,
  getWeek,
  startOfWeek,
  isToday,
} from 'date-fns';
import { CalendarItem } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HeatmapViewProps {
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HeatmapView({ items, onItemClick }: HeatmapViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Calculate the date range (last 365 days)
  const today = new Date();
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const allDays = eachDayOfInterval({ start: yearAgo, end: today });

  // Count items per day
  const itemsByDate = items.reduce((acc, item) => {
    const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, CalendarItem[]>);

  // Calculate max count for intensity scaling
  const maxCount = Math.max(...Object.values(itemsByDate).map(items => items.length), 1);

  // Group days by week for grid layout
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  let currentWeekNumber = -1;

  allDays.forEach(day => {
    const weekNumber = getWeek(day);
    const dayOfWeek = getDay(day);

    if (weekNumber !== currentWeekNumber) {
      if (currentWeek.length > 0) {
        // Fill in missing days at start of week
        while (currentWeek.length < 7 && currentWeek[0] && getDay(currentWeek[0]) > 0) {
          currentWeek.unshift(null as any);
        }
        // Fill in missing days at end of week
        while (currentWeek.length < 7) {
          currentWeek.push(null as any);
        }
        weeks.push(currentWeek);
      }
      currentWeek = [];
      currentWeekNumber = weekNumber;
    }

    currentWeek.push(day);
  });

  // Add the last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null as any);
    }
    weeks.push(currentWeek);
  }

  // Get intensity level for a date
  const getIntensity = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const count = itemsByDate[dateKey]?.length || 0;
    
    if (count === 0) return 0;
    const intensity = Math.ceil((count / maxCount) * 4);
    return Math.min(intensity, 4);
  };

  // Get color class based on intensity
  const getColorClass = (intensity: number) => {
    const colors = [
      'bg-muted',
      'bg-green-200 dark:bg-green-900',
      'bg-green-400 dark:bg-green-700',
      'bg-green-600 dark:bg-green-500',
      'bg-green-800 dark:bg-green-300',
    ];
    return colors[intensity];
  };

  // Get items for selected date
  const selectedDateItems = selectedDate ? itemsByDate[selectedDate] || [] : [];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <TooltipProvider>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Activity Overview</h2>
            
            {/* Month labels */}
            <div className="flex items-start gap-1 mb-2">
              <div className="w-8" /> {/* Spacer for day labels */}
              <div className="flex gap-1">
                {MONTHS.map((month, index) => {
                  const monthStart = new Date(today.getFullYear(), index, 1);
                  const isCurrentYear = monthStart <= today && monthStart >= yearAgo;
                  
                  return isCurrentYear ? (
                    <div
                      key={month}
                      className="text-xs text-muted-foreground"
                      style={{ width: `${(weeks.length / 12) * 12}px` }}
                    >
                      {month}
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Heatmap grid */}
            <div className="flex items-start gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-1">
                {DAYS.map((day, index) => (
                  <div
                    key={day}
                    className={cn(
                      "text-xs text-muted-foreground h-3 flex items-center",
                      index % 2 === 1 && "opacity-0"
                    )}
                  >
                    {day[0]}
                  </div>
                ))}
              </div>

              {/* Weeks grid */}
              <div className="flex gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => {
                      if (!day) {
                        return <div key={dayIndex} className="w-3 h-3" />;
                      }

                      const dateKey = format(day, 'yyyy-MM-dd');
                      const intensity = getIntensity(day);
                      const dayItems = itemsByDate[dateKey] || [];
                      const isDayToday = isToday(day);

                      return (
                        <Tooltip key={dayIndex}>
                          <TooltipTrigger asChild>
                            <button
                              className={cn(
                                "w-3 h-3 rounded-sm transition-all",
                                getColorClass(intensity),
                                isDayToday && "ring-2 ring-primary ring-offset-1",
                                "hover:opacity-80"
                              )}
                              onClick={() => setSelectedDate(dateKey)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <div className="font-medium">
                                {format(day, 'MMM d, yyyy')}
                              </div>
                              <div className="text-muted-foreground">
                                {dayItems.length} {dayItems.length === 1 ? 'event' : 'events'}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-6">
              <span className="text-sm text-muted-foreground">Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(intensity => (
                  <div
                    key={intensity}
                    className={cn(
                      "w-3 h-3 rounded-sm",
                      getColorClass(intensity)
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">More</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold">{items.length}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">
                {Object.keys(itemsByDate).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Days</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">
                {Math.round((Object.keys(itemsByDate).length / allDays.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Activity Rate</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{maxCount}</div>
              <div className="text-sm text-muted-foreground">Max Events/Day</div>
            </Card>
          </div>

          {/* Selected date details */}
          {selectedDate && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Events on {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
              </h3>
              {selectedDateItems.length === 0 ? (
                <p className="text-muted-foreground">No events on this date</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => onItemClick(item)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {item.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {item.source}
                            </Badge>
                            {!item.all_day && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.date), 'h:mm a')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}