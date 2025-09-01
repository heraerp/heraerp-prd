'use client'

import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventInput } from '@fullcalendar/core'
import '@/styles/fullcalendar.css'

interface SimpleCalendarProps {
  events?: EventInput[]
  onDateSelect?: (selectInfo: any) => void
  onEventClick?: (clickInfo: any) => void
  className?: string
}

export function SimpleCalendar({ 
  events = [], 
  onDateSelect, 
  onEventClick,
  className = ''
}: SimpleCalendarProps) {
  return (
    <div className={className}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        selectable={true}
        selectMirror={true}
        select={onDateSelect}
        eventClick={onEventClick}
        editable={true}
        dayMaxEvents={true}
        weekends={true}
        height="auto"
        slotMinTime="08:00"
        slotMaxTime="20:00"
        slotDuration="00:30:00"
      />
    </div>
  )
}