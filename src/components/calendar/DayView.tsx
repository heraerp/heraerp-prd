'use client'

import { format, isToday, addHours, startOfDay } from 'date-fns'
import { CalendarItem } from '@/types/calendar'
import { cn } from '@/lib/utils'

interface DayViewProps {
  currentDate: Date
  items: CalendarItem[]
  onItemClick: (item: CalendarItem) => void
}

const SOURCE_COLORS = {
  grants: 'bg-blue-500',
  cases: 'bg-green-500',
  playbooks: 'bg-purple-500',
  payments: 'bg-yellow-500',
  consultations: 'bg-pink-500'
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function DayView({ currentDate, items, onItemClick }: DayViewProps) {
  const isDayToday = isToday(currentDate)

  // Filter items for current day
  const dayItems = items.filter(item => {
    const itemDate = format(new Date(item.date), 'yyyy-MM-dd')
    const currentDateStr = format(currentDate, 'yyyy-MM-dd')
    return itemDate === currentDateStr
  })

  // Calculate item positions
  const getItemStyle = (item: CalendarItem) => {
    const itemDate = new Date(item.date)
    const hour = itemDate.getHours()
    const minutes = itemDate.getMinutes()
    const top = (hour + minutes / 60) * 80 // 80px per hour
    const duration = item.duration || 60 // default 60 minutes
    const height = (duration / 60) * 80

    return {
      top: `${top}px`,
      height: `${height}px`,
      minHeight: '30px'
    }
  }

  // Check for overlapping items
  const getItemColumns = () => {
    const columns: CalendarItem[][] = []

    dayItems.forEach(item => {
      const itemStart = new Date(item.date).getTime()
      const itemEnd = itemStart + (item.duration || 60) * 60 * 1000

      let placed = false
      for (let i = 0; i < columns.length; i++) {
        const canPlace = columns[i].every(existingItem => {
          const existingStart = new Date(existingItem.date).getTime()
          const existingEnd = existingStart + (existingItem.duration || 60) * 60 * 1000
          return itemEnd <= existingStart || itemStart >= existingEnd
        })

        if (canPlace) {
          columns[i].push(item)
          placed = true
          break
        }
      }

      if (!placed) {
        columns.push([item])
      }
    })

    return columns
  }

  const columns = getItemColumns()
  const columnWidth = columns.length > 0 ? 100 / columns.length : 100

  return (
    <div className="h-full flex p-4">
      {/* Time labels */}
      <div className="w-20 pr-2">
        <div className="relative" style={{ height: `${24 * 80}px` }}>
          {HOURS.map(hour => (
            <div
              key={hour}
              className="absolute w-full text-xs text-muted-foreground text-right"
              style={{ top: `${hour * 80 - 8}px` }}
            >
              {format(addHours(startOfDay(new Date()), hour), 'h a')}
            </div>
          ))}
        </div>
      </div>

      {/* Day content */}
      <div className="flex-1 overflow-auto">
        <div
          className={cn(
            'relative border border-muted/20 rounded-lg min-h-[1920px]', // 24 hours * 80px
            isDayToday && 'bg-primary/5 border-primary/20'
          )}
        >
          {/* Hour lines */}
          {HOURS.map(hour => (
            <div
              key={hour}
              className="absolute w-full border-t border-muted/30"
              style={{ top: `${hour * 80}px` }}
            />
          ))}

          {/* Events */}
          {columns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              className="absolute h-full"
              style={{
                left: `${columnIndex * columnWidth}%`,
                width: `${columnWidth}%`
              }}
            >
              {column.map(item => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className={cn(
                    'absolute left-1 right-1 rounded px-3 py-2 overflow-hidden',
                    'hover:opacity-80 transition-opacity text-white',
                    SOURCE_COLORS[item.source as keyof typeof SOURCE_COLORS]
                  )}
                  style={getItemStyle(item)}
                >
                  <div className="text-sm font-medium">
                    {format(new Date(item.date), 'h:mm a')}
                    {item.duration && item.duration !== 60 && (
                      <span className="ml-1 text-xs">({item.duration} min)</span>
                    )}
                  </div>
                  <div className="text-sm font-medium mt-1">{item.title}</div>
                  {item.location && <div className="text-xs truncate">{item.location}</div>}
                  {item.participants && item.participants.length > 0 && (
                    <div className="text-xs truncate mt-1">
                      {item.participants
                        .slice(0, 2)
                        .map(p => p.name)
                        .join(', ')}
                      {item.participants.length > 2 && ` +${item.participants.length - 2}`}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ))}

          {/* All-day events */}
          {dayItems.some(item => item.all_day) && (
            <div className="absolute top-0 left-0 right-0 bg-muted/20 p-2 border-b border-muted/30">
              <div className="text-xs font-medium text-muted-foreground mb-1">All-day events</div>
              <div className="space-y-1">
                {dayItems
                  .filter(item => item.all_day)
                  .map(item => (
                    <button
                      key={item.id}
                      onClick={() => onItemClick(item)}
                      className={cn(
                        'w-full text-left px-2 py-1 rounded text-sm',
                        'hover:opacity-80 transition-opacity text-white',
                        SOURCE_COLORS[item.source as keyof typeof SOURCE_COLORS]
                      )}
                    >
                      {item.title}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
