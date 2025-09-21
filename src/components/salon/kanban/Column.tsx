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
        className={cn(
          'px-4 py-3 rounded-t-lg font-medium flex items-center justify-between',
          isDraft && 'bg-amber-100 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100',
          !isDraft && 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
        )}
      >
        <span>{title}</span>
        <span className="text-sm font-normal opacity-60">{cards.length}</span>
      </div>

      {/* Column content */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-2 space-y-3 overflow-y-auto rounded-b-lg transition-colors',
          'bg-zinc-50 dark:bg-zinc-900/50',
          isOver && 'bg-zinc-100 dark:bg-zinc-800/50'
        )}
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
          <div className="text-center py-8 text-sm text-muted-foreground">
            {isDraft ? 'No draft appointments' : 'Drop appointments here'}
          </div>
        )}
      </div>
    </div>
  )
}
