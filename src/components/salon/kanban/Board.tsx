// ============================================================================
// HERA • Kanban Board Component
// ============================================================================

import React from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Skeleton } from '@/components/ui/skeleton'
import { KanbanCard, KanbanStatus, KANBAN_COLUMNS } from '@/schemas/kanban'
import { Column } from './Column'
import { Card } from './Card'

interface BoardProps {
  cardsByColumn: Record<KanbanStatus, KanbanCard[]>
  onMove: (cardId: string, targetColumn: KanbanStatus, targetIndex: number) => Promise<void>
  onCardAction: (card: KanbanCard, action: string) => void
  loading?: boolean
  isMoving?: boolean
}

export function Board({
  cardsByColumn,
  onMove,
  onCardAction,
  loading = false,
  isMoving = false
}: BoardProps) {
  const [activeCard, setActiveCard] = React.useState<KanbanCard | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = Object.values(cardsByColumn)
      .flat()
      .find(c => c.id === active.id)
    setActiveCard(card || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeCard = Object.values(cardsByColumn)
      .flat()
      .find(c => c.id === active.id)

    if (!activeCard) return

    // Determine target column
    let targetColumn: KanbanStatus | null = null
    let targetIndex = 0

    // Check if dropped on a column
    if (KANBAN_COLUMNS.some(col => col.key === over.id)) {
      targetColumn = over.id as KanbanStatus
      targetIndex = cardsByColumn[targetColumn].length
    } else {
      // Dropped on a card - find its column
      for (const [column, cards] of Object.entries(cardsByColumn)) {
        const index = cards.findIndex(c => c.id === over.id)
        if (index !== -1) {
          targetColumn = column as KanbanStatus
          // Insert after the target card
          targetIndex = index + 1
          break
        }
      }
    }

    if (targetColumn && targetColumn !== activeCard.status) {
      await onMove(activeCard.id, targetColumn, targetIndex)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full gap-4 p-6 overflow-x-auto">
        {KANBAN_COLUMNS.map(column => (
          <div key={column.key} className="w-80 flex-shrink-0">
            <Skeleton className="h-12 w-full mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 p-6 overflow-x-auto">
        {KANBAN_COLUMNS.map(column => (
          <Column
            key={column.key}
            id={column.key}
            title={column.label}
            cards={cardsByColumn[column.key] || []}
            onCardAction={onCardAction}
            isDraft={column.key === 'DRAFT'}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <Card
            card={activeCard}
            onConfirm={() => {}}
            onEdit={() => {}}
            onReschedule={() => {}}
            onCancel={() => {}}
            onProcessPayment={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
