// ============================================================================
// HERA • Kanban Board Component - Enterprise Edition
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
      <div className="flex h-full gap-4 p-6 overflow-x-auto animate-fadeIn">
        {KANBAN_COLUMNS.map((column, index) => (
          <div
            key={column.key}
            className="w-80 flex-shrink-0 animate-slideUp"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className="h-12 w-full mb-4 rounded-lg animate-pulse"
              style={{
                backgroundColor: `${LUXE_COLORS.gold}20`,
                boxShadow: `0 4px 16px ${LUXE_COLORS.gold}10`
              }}
            />
            <div className="space-y-3">
              <div
                className="h-32 w-full rounded-lg animate-pulse"
                style={{ backgroundColor: `${LUXE_COLORS.charcoal}40` }}
              />
              <div
                className="h-32 w-full rounded-lg animate-pulse"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}40`,
                  animationDelay: '0.2s'
                }}
              />
              <div
                className="h-32 w-full rounded-lg animate-pulse"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}40`,
                  animationDelay: '0.4s'
                }}
              />
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
      <div
        className="flex h-full gap-4 p-6 overflow-x-auto animate-fadeIn kanban-board-scroll transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.black} 0%, ${LUXE_COLORS.charcoal} 50%, ${LUXE_COLORS.black} 100%)`,
          backgroundImage: `
            linear-gradient(135deg, ${LUXE_COLORS.black} 0%, ${LUXE_COLORS.charcoal} 50%, ${LUXE_COLORS.black} 100%),
            repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212, 175, 55, 0.02) 10px, rgba(212, 175, 55, 0.02) 20px)
          `,
          backdropFilter: 'blur(5px)'
        }}
      >
        {KANBAN_COLUMNS.map((column, index) => (
          <div
            key={column.key}
            className="animate-slideUp"
            style={{
              animationDelay: `${index * 0.05}s`,
              animationFillMode: 'backwards'
            }}
          >
            <Column
              id={column.key}
              title={column.label}
              cards={cardsByColumn[column.key] || []}
              onCardAction={onCardAction}
              isDraft={column.key === 'DRAFT'}
            />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="animate-pulse" style={{ transform: 'scale(1.05)' }}>
            <Card
              card={activeCard}
              onConfirm={() => {}}
              onEdit={() => {}}
              onReschedule={() => {}}
              onCancel={() => {}}
              onProcessPayment={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
