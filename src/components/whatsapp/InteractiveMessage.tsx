'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronRight, Calendar, Clock, User, MapPin } from 'lucide-react'

interface InteractiveButton {
  id: string
  title: string
  type: 'quick_reply' | 'url' | 'phone'
}

interface InteractiveListSection {
  title: string
  rows: Array<{
    id: string
    title: string
    description?: string
  }>
}

interface InteractiveMessageProps {
  type: 'button' | 'list'
  header?: string
  body: string
  footer?: string
  buttons?: InteractiveButton[]
  listButton?: string
  sections?: InteractiveListSection[]
  onAction?: (actionId: string, actionType: string) => void
}

export function InteractiveMessage({
  type,
  header,
  body,
  footer,
  buttons,
  listButton,
  sections,
  onAction
}: InteractiveMessageProps) {
  const [showList, setShowList] = React.useState(false)
  
  const handleButtonClick = (button: InteractiveButton) => {
    if (onAction) {
      onAction(button.id, button.type)
    }
  }
  
  const handleListItemClick = (itemId: string) => {
    if (onAction) {
      onAction(itemId, 'list_reply')
    }
    setShowList(false)
  }
  
  return (
    <div className="max-w-sm">
      {header && (
        <div className="font-semibold text-sm mb-2">{header}</div>
      )}
      
      <div className="text-sm mb-3">{body}</div>
      
      {footer && (
        <div className="text-xs text-gray-500 mb-3">{footer}</div>
      )}
      
      {type === 'button' && buttons && (
        <div className="space-y-2">
          {buttons.map((button) => (
            <Button
              key={button.id}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleButtonClick(button)}
            >
              {button.title}
            </Button>
          ))}
        </div>
      )}
      
      {type === 'list' && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            onClick={() => setShowList(!showList)}
          >
            {listButton || 'Select an option'}
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          {showList && sections && (
            <Card className="mt-2 p-2 max-h-64 overflow-y-auto">
              {sections.map((section, idx) => (
                <div key={idx}>
                  {section.title && (
                    <div className="font-medium text-xs text-gray-600 px-2 py-1">
                      {section.title}
                    </div>
                  )}
                  <div className="space-y-1">
                    {section.rows.map((row) => (
                      <button
                        key={row.id}
                        className="w-full text-left px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        onClick={() => handleListItemClick(row.id)}
                      >
                        <div className="font-medium text-sm">{row.title}</div>
                        {row.description && (
                          <div className="text-xs text-gray-500">{row.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// Predefined interactive templates
export const interactiveTemplates = {
  mainMenu: {
    type: 'button' as const,
    header: 'Welcome to HERA Salon! 💇‍♀️',
    body: 'How can we help you today?',
    buttons: [
      { id: 'book_appointment', title: '📅 Book Appointment', type: 'quick_reply' as const },
      { id: 'view_services', title: '💅 View Services', type: 'quick_reply' as const },
      { id: 'contact_salon', title: '📞 Contact Us', type: 'quick_reply' as const }
    ]
  },
  
  serviceSelection: {
    type: 'list' as const,
    header: 'Our Services',
    body: 'Choose from our range of beauty services',
    listButton: 'View Services',
    sections: [
      {
        title: 'Hair Services',
        rows: [
          { id: 'haircut', title: 'Haircut', description: 'Professional cut & style - AED 80' },
          { id: 'hair_color', title: 'Hair Color', description: 'Full color treatment - AED 250' },
          { id: 'highlights', title: 'Highlights', description: 'Partial/Full highlights - AED 350' },
          { id: 'treatment', title: 'Hair Treatment', description: 'Deep conditioning - AED 150' }
        ]
      },
      {
        title: 'Nail Services',
        rows: [
          { id: 'manicure', title: 'Manicure', description: 'Classic manicure - AED 60' },
          { id: 'pedicure', title: 'Pedicure', description: 'Spa pedicure - AED 80' },
          { id: 'gel_nails', title: 'Gel Nails', description: 'Long-lasting gel - AED 120' }
        ]
      }
    ]
  },
  
  timeSelection: {
    type: 'list' as const,
    header: 'Available Times',
    body: 'Select your preferred appointment time',
    listButton: 'Choose Time',
    sections: [
      {
        title: 'Morning',
        rows: [
          { id: 'time_0900', title: '9:00 AM', description: 'Available' },
          { id: 'time_1000', title: '10:00 AM', description: 'Available' },
          { id: 'time_1100', title: '11:00 AM', description: 'Available' }
        ]
      },
      {
        title: 'Afternoon',
        rows: [
          { id: 'time_1400', title: '2:00 PM', description: 'Available' },
          { id: 'time_1500', title: '3:00 PM', description: 'Available' },
          { id: 'time_1600', title: '4:00 PM', description: 'Available' }
        ]
      }
    ]
  },
  
  appointmentActions: {
    type: 'button' as const,
    body: 'What would you like to do with your appointment?',
    buttons: [
      { id: 'confirm_appointment', title: '✅ Confirm', type: 'quick_reply' as const },
      { id: 'reschedule', title: '📅 Reschedule', type: 'quick_reply' as const },
      { id: 'cancel', title: '❌ Cancel', type: 'quick_reply' as const }
    ]
  },
  
  feedbackRequest: {
    type: 'button' as const,
    header: 'Rate Your Experience',
    body: 'How was your visit to HERA Salon?',
    footer: 'Your feedback helps us improve',
    buttons: [
      { id: 'feedback_5', title: '⭐⭐⭐⭐⭐ Excellent', type: 'quick_reply' as const },
      { id: 'feedback_4', title: '⭐⭐⭐⭐ Good', type: 'quick_reply' as const },
      { id: 'feedback_3', title: '⭐⭐⭐ Average', type: 'quick_reply' as const }
    ]
  }
}

// Helper function to create custom interactive messages
export function createInteractiveMessage(
  type: 'button' | 'list',
  body: string,
  options: {
    header?: string
    footer?: string
    buttons?: Array<{ id: string; title: string }>
    sections?: Array<{
      title?: string
      rows: Array<{ id: string; title: string; description?: string }>
    }>
  }
) {
  const message: any = {
    type: 'interactive',
    interactive: {
      type,
      body: { text: body }
    }
  }
  
  if (options.header) {
    message.interactive.header = { type: 'text', text: options.header }
  }
  
  if (options.footer) {
    message.interactive.footer = { text: options.footer }
  }
  
  if (type === 'button' && options.buttons) {
    message.interactive.action = {
      buttons: options.buttons.map(btn => ({
        type: 'reply',
        reply: {
          id: btn.id,
          title: btn.title
        }
      }))
    }
  }
  
  if (type === 'list' && options.sections) {
    message.interactive.action = {
      button: 'Select',
      sections: options.sections.map(section => ({
        title: section.title,
        rows: section.rows.map(row => ({
          id: row.id,
          title: row.title,
          description: row.description
        }))
      }))
    }
  }
  
  return message
}