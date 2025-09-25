'use client';

import { format } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CalendarDays, 
  CalendarClock, 
  List, 
  Activity,
  Download,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';

type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'heatmap';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onExport: (format: 'csv' | 'ics') => void;
  onPrint: () => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onNavigate,
  onExport,
  onPrint,
}: CalendarHeaderProps) {
  // Format display date based on view
  const getDisplayDate = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'agenda':
        return 'Upcoming Events';
      case 'heatmap':
        return 'Activity Heatmap';
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="border-b bg-card">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('prev')}
            disabled={view === 'agenda' || view === 'heatmap'}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate('today')}
            disabled={view === 'agenda' || view === 'heatmap'}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('next')}
            disabled={view === 'agenda' || view === 'heatmap'}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-4">{getDisplayDate()}</h2>
        </div>

        {/* View Toggle & Actions */}
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <ToggleGroup type="single" value={view} onValueChange={(value) => value && onViewChange(value as CalendarView)}>
            <ToggleGroupItem value="month" aria-label="Month view">
              <Calendar className="h-4 w-4 mr-1" />
              Month
            </ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Week view">
              <CalendarDays className="h-4 w-4 mr-1" />
              Week
            </ToggleGroupItem>
            <ToggleGroupItem value="day" aria-label="Day view">
              <CalendarClock className="h-4 w-4 mr-1" />
              Day
            </ToggleGroupItem>
            <ToggleGroupItem value="agenda" aria-label="Agenda view">
              <List className="h-4 w-4 mr-1" />
              Agenda
            </ToggleGroupItem>
            <ToggleGroupItem value="heatmap" aria-label="Heatmap view">
              <Activity className="h-4 w-4 mr-1" />
              Heatmap
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('ics')}>
                Export as ICS (Calendar)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Print */}
          <Button variant="outline" size="icon" onClick={onPrint}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}