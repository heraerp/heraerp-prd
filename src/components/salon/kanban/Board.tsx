// ============================================================================
// HERA • Kanban Board Component - Enterprise Edition
// ============================================================================

import React from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision
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
  onMoveToNext?: (card: KanbanCard) => void
  loading?: boolean
  isMoving?: boolean
}

export function Board({
  cardsByColumn,
  onMove,
  onCardAction,
  onMoveToNext,
  loading = false,
  isMoving = false
}: BoardProps) {
  const [activeCard, setActiveCard] = React.useState<KanbanCard | null>(null)

  // 🎯 ENTERPRISE: Custom collision detection for smooth drag and drop with soft landing
  const customCollisionDetection = React.useCallback((args: any) => {
    // First priority: Check if pointer is within any droppable area (most accurate)
    const pointerCollisions = pointerWithin(args)

    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    // Second priority: Use rect intersection with increased tolerance (more forgiving)
    const rectCollisions = rectIntersection(args)

    if (rectCollisions.length > 0) {
      return rectCollisions
    }

    // Third priority: Find closest droppable by center point (soft landing)
    const centerCollisions = closestCenter(args)

    // 🎨 ENTERPRISE: Always return at least one collision for smooth experience
    return centerCollisions.length > 0 ? centerCollisions : pointerCollisions
  }, [])

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

    // Determine target column - ENTERPRISE: More accurate detection
    let targetColumn: KanbanStatus | null = null
    let targetIndex = 0

    // Priority 1: Check if dropped directly on a column container
    if (KANBAN_COLUMNS.some(col => col.key === over.id)) {
      targetColumn = over.id as KanbanStatus
      // 🎯 ENTERPRISE: Safe array access with optional chaining
      targetIndex = cardsByColumn[targetColumn]?.length ?? 0
      console.log(`[Board] ✅ Dropped on column: ${targetColumn}, index: ${targetIndex}`)
    } else {
      // Priority 2: Dropped on a card - find which column that card belongs to
      for (const [column, cards] of Object.entries(cardsByColumn)) {
        const index = cards?.findIndex(c => c.id === over.id) ?? -1
        if (index !== -1) {
          targetColumn = column as KanbanStatus
          // 🎨 ENTERPRISE: Insert at the same position as target card (not after)
          targetIndex = index
          console.log(`[Board] ✅ Dropped on card in column: ${targetColumn}, index: ${targetIndex}`)
          break
        }
      }
    }

    // Only move if we found a valid target column AND it's different from current
    if (targetColumn && targetColumn !== activeCard.status) {
      console.log(`[Board] 🚀 Moving card from ${activeCard.status} to ${targetColumn}`)
      await onMove(activeCard.id, targetColumn, targetIndex)
    } else if (targetColumn === activeCard.status) {
      console.log(`[Board] ℹ️ Card already in ${targetColumn}, no move needed`)
    } else {
      console.log(`[Board] ⚠️ No valid target column found`)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full gap-4 p-6 overflow-x-auto animate-fadeIn">
        {KANBAN_COLUMNS.map((column, index) => (
          <div
            key={column.key}
            className="w-80 flex-shrink-0 animate-slideUp"
            style={{
              animationDelay: `${index * 0.1}s`,
              animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // 🎨 ENTERPRISE: Spring easing
            }}
          >
            <div
              className="h-12 w-full mb-4 animate-pulse"
              style={{
                borderRadius: '1rem 1rem 0 0', // 🎨 ENTERPRISE: Soft edges
                backgroundColor: `${LUXE_COLORS.gold}20`,
                boxShadow: `0 4px 16px ${LUXE_COLORS.gold}10`
              }}
            />
            <div className="space-y-3">
              <div
                className="h-32 w-full animate-pulse"
                style={{
                  borderRadius: '0.75rem', // 🎨 ENTERPRISE: Soft edges
                  backgroundColor: `${LUXE_COLORS.charcoal}40`
                }}
              />
              <div
                className="h-32 w-full animate-pulse"
                style={{
                  borderRadius: '0.75rem', // 🎨 ENTERPRISE: Soft edges
                  backgroundColor: `${LUXE_COLORS.charcoal}40`,
                  animationDelay: '0.2s'
                }}
              />
              <div
                className="h-32 w-full animate-pulse"
                style={{
                  borderRadius: '0.75rem', // 🎨 ENTERPRISE: Soft edges
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
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex h-full gap-4 p-6 overflow-x-auto animate-fadeIn kanban-board-scroll"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.black} 0%, ${LUXE_COLORS.charcoal} 50%, ${LUXE_COLORS.black} 100%)`,
          backgroundImage: `
            linear-gradient(135deg, ${LUXE_COLORS.black} 0%, ${LUXE_COLORS.charcoal} 50%, ${LUXE_COLORS.black} 100%),
            repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212, 175, 55, 0.02) 10px, rgba(212, 175, 55, 0.02) 20px)
          `,
          backdropFilter: 'blur(5px)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' // 🎨 ENTERPRISE: Spring easing
        }}
      >
        {KANBAN_COLUMNS.map((column, index) => (
          <div
            key={column.key}
            className="animate-slideUp"
            style={{
              animationDelay: `${index * 0.05}s`,
              animationFillMode: 'backwards',
              animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // 🎨 ENTERPRISE: Spring easing
            }}
          >
            <Column
              id={column.key}
              title={column.label}
              cards={cardsByColumn[column.key] || []}
              onCardAction={onCardAction}
              onMoveToNext={onMoveToNext}
              isDraft={column.key === 'DRAFT'}
            />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <div
            style={{
              transform: 'scale(1.1) rotate(3deg)', // 🎨 ENTERPRISE: Dynamic lift effect
              filter: 'drop-shadow(0 25px 50px rgba(212, 175, 55, 0.5))', // 🎨 ENTERPRISE: Luxury glow
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', // 🎨 ENTERPRISE: Spring easing
              opacity: 0.95, // 🎨 ENTERPRISE: Slightly transparent for better visibility
              cursor: 'grabbing'
            }}
          >
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
