// ============================================================================
// HERA • Kanban Column Component - Enterprise Edition
// ============================================================================

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { KanbanCard } from '@/schemas/kanban'
import { Card } from './Card'

// Luxury color palette
const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#5A2A40',
  rose: '#E8B4B8'
}

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
    <div className="w-80 flex-shrink-0 flex flex-col h-full transition-all duration-300">
      {/* Column header */}
      <div
        className="px-4 py-3 rounded-t-lg font-medium flex items-center justify-between transition-all duration-300 hover:shadow-xl"
        style={{
          background: isDraft
            ? `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`
            : `linear-gradient(135deg, ${LUXE_COLORS.charcoal} 0%, ${LUXE_COLORS.black} 100%)`,
          color: isDraft ? LUXE_COLORS.black : LUXE_COLORS.champagne,
          borderBottom: `2px solid ${isDraft ? LUXE_COLORS.gold : LUXE_COLORS.bronze}`,
          boxShadow: isDraft ? `0 4px 12px ${LUXE_COLORS.gold}50` : `0 2px 8px ${LUXE_COLORS.black}60`
        }}
      >
        <span className="tracking-wide text-lg">{title}</span>
        <span
          className="text-sm font-semibold px-3 py-1.5 rounded-full transition-all duration-300 hover:scale-110"
          style={{
            background: isDraft ? `${LUXE_COLORS.black}30` : `${LUXE_COLORS.gold}20`,
            color: isDraft ? LUXE_COLORS.black : LUXE_COLORS.gold,
            boxShadow: `0 2px 8px ${isDraft ? LUXE_COLORS.black : LUXE_COLORS.gold}20`
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
