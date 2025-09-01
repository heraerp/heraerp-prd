'use client'

import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventInput } from '@fullcalendar/core'
import '@/styles/salon-calendar.css'

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
  // Custom event content renderer
  const renderEventContent = (eventInfo: any) => {
    const { event } = eventInfo
    const props = event.extendedProps || {}
    
    return (
      <div className="fc-event-main">
        <div className="fc-event-time">{eventInfo.timeText}</div>
        <div className="fc-event-title">{event.title}</div>
        {props.client && props.price && (
          <div className="fc-event-desc">
            {props.vip && props.vip !== 'regular' && (
              <span className="text-yellow-300">★</span>
            )}
            <span>{props.price}</span>
          </div>
        )}
      </div>
    )
  }
  
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
        eventContent={renderEventContent}
        eventClassNames={(arg) => {
          const classes = []
          if (arg.event.extendedProps?.service) {
            classes.push(`fc-event-${arg.event.extendedProps.service}`)
          }
          if (arg.event.extendedProps?.vip) {
            classes.push(`fc-event-vip-${arg.event.extendedProps.vip}`)
          }
          return classes
        }}
        eventDataTransform={(event) => {
          // Add data attributes for CSS styling
          if (event.extendedProps?.service) {
            event.classNames = [`service-${event.extendedProps.service}`]
          }
          return event
        }}
        slotLabelFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        nowIndicator={true}
        businessHours={{
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '09:00',
          endTime: '21:00'
        }}
      />
    </div>
  )
}