// ============================================================================
// HERA • Kanban Column Component
// ============================================================================

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { KanbanCard } from '@/schemas/kanban'
import { Card } from './Card'

interface ColumnProps {
  id: string
  title: string
  cards: KanbanCard[]
  onCardAction: (card: KanbanCard, action: string) => void
  isDraft?: boolean
}

export function Column({ id, title, cards, onCardAction, isDraft = false }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full">
      {/* Column header */}
      <div
        className="px-4 py-3 rounded-t-lg font-medium flex items-center justify-between transition-all duration-300"
        style={{
          background: isDraft
            ? 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)'
            : 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
          color: isDraft ? '#0B0B0B' : '#F5E6C8',
          borderBottom: `2px solid ${isDraft ? '#D4AF37' : '#8C7853'}`,
          boxShadow: isDraft
            ? '0 4px 12px rgba(212, 175, 55, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.4)'
        }}
      >
        <span className="tracking-wide">{title}</span>
        <span
          className="text-sm font-normal px-2 py-1 rounded-full transition-all duration-300"
          style={{
            background: isDraft ? 'rgba(11, 11, 11, 0.2)' : 'rgba(212, 175, 55, 0.15)',
            color: isDraft ? '#0B0B0B' : '#D4AF37'
          }}
        >
          {cards.length}
        </span>
      </div>

      {/* Column content */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-3 overflow-y-auto rounded-b-lg transition-all duration-300"
        style={{
          background: isOver
            ? 'linear-gradient(135deg, #0F0F0F 0%, #1A1A1A 100%)'
            : 'linear-gradient(135deg, #0B0B0B 0%, #141414 100%)',
          borderLeft: '1px solid #8C785340',
          borderRight: '1px solid #8C785340',
          borderBottom: '1px solid #8C785340',
          boxShadow: isOver
            ? 'inset 0 0 20px rgba(212, 175, 55, 0.1)'
            : 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
        }}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <Card
              key={card.id}
              card={card}
              onConfirm={() => onCardAction(card, 'confirm')}
              onEdit={() => onCardAction(card, 'edit')}
              onReschedule={() => onCardAction(card, 'reschedule')}
              onCancel={() => onCardAction(card, 'cancel')}
              onProcessPayment={() => onCardAction(card, 'process_payment')}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: '#8C7853' }}>
            {isDraft ? 'No draft appointments' : 'Drop appointments here'}
          </div>
        )}
      </div>
    </div>
  )
}
