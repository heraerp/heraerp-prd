// ============================================================================
// HERA • Kanban Column Component - Enterprise Edition
// ============================================================================

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { format, isSameDay, startOfDay, isToday, isTomorrow, isYesterday } from 'date-fns'
import { Calendar } from 'lucide-react'
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
  onMoveToNext?: (card: KanbanCard) => void
  isDraft?: boolean
}

export function Column({ id, title, cards, onCardAction, onMoveToNext, isDraft = false }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const [headerHovered, setHeaderHovered] = React.useState(false)
  const [mousePosition, setMousePosition] = React.useState({ x: 50, y: 50 })

  // 🎨 ENTERPRISE: Mouse movement animation handler for header
  const handleHeaderMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePosition({ x, y })
  }

  // 🎯 ENTERPRISE: Group cards by date for better organization
  const cardsByDate = React.useMemo(() => {
    const groups: { date: Date; dateLabel: string; cards: KanbanCard[] }[] = []

    // Sort cards by start time
    const sortedCards = [...cards].sort((a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime()
    )

    sortedCards.forEach(card => {
      const cardDate = startOfDay(new Date(card.start))
      const existingGroup = groups.find(g => isSameDay(g.date, cardDate))

      if (existingGroup) {
        existingGroup.cards.push(card)
      } else {
        // Format date label with enterprise context
        let dateLabel: string
        if (isToday(cardDate)) {
          dateLabel = `Today, ${format(cardDate, 'MMMM d, yyyy')}`
        } else if (isTomorrow(cardDate)) {
          dateLabel = `Tomorrow, ${format(cardDate, 'MMMM d, yyyy')}`
        } else if (isYesterday(cardDate)) {
          dateLabel = `Yesterday, ${format(cardDate, 'MMMM d, yyyy')}`
        } else {
          dateLabel = format(cardDate, 'EEEE, MMMM d, yyyy')
        }

        groups.push({ date: cardDate, dateLabel, cards: [card] })
      }
    })

    return groups
  }, [cards, id, title])

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full" style={{
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' // 🎨 ENTERPRISE: Spring easing
    }}>
      {/* Column header */}
      <div
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => {
          setHeaderHovered(false)
          setMousePosition({ x: 50, y: 50 })
        }}
        onMouseMove={handleHeaderMouseMove}
        className="px-4 py-3 font-medium flex items-center justify-between cursor-pointer"
        style={{
          borderRadius: '1rem 1rem 0 0', // 🎨 ENTERPRISE: Soft edges (top corners only)
          // 🎨 ENTERPRISE: Mouse-following radial gradient for header
          background: headerHovered && !isDraft
            ? `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%,
                 rgba(212, 175, 55, 0.2) 0%,
                 rgba(212, 175, 55, 0.1) 30%,
                 rgba(26, 26, 26, 0.95) 60%,
                 rgba(11, 11, 11, 1) 100%)`
            : isDraft
              ? `linear-gradient(135deg, rgba(212, 175, 55, 0.4) 0%, rgba(184, 134, 11, 0.35) 100%)`
              : `linear-gradient(135deg, ${LUXE_COLORS.charcoal} 0%, ${LUXE_COLORS.black} 100%)`,
          color: isDraft ? LUXE_COLORS.champagne : LUXE_COLORS.champagne,
          borderBottom: `2px solid ${isDraft ? LUXE_COLORS.gold : LUXE_COLORS.bronze}`,
          boxShadow: headerHovered
            ? isDraft
              ? `0 6px 16px ${LUXE_COLORS.gold}60`
              : `0 4px 12px rgba(212, 175, 55, 0.3), inset 0 0 20px rgba(212, 175, 55, 0.05)`
            : isDraft
              ? `0 4px 12px ${LUXE_COLORS.gold}50`
              : `0 2px 8px ${LUXE_COLORS.black}60`,
          transform: headerHovered ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' // 🎨 ENTERPRISE: Spring easing
        }}
      >
        <span className="tracking-wide text-lg">{title}</span>
        <span
          className="text-sm font-semibold px-3 py-1.5 rounded-full"
          style={{
            background: isDraft ? `${LUXE_COLORS.gold}50` : `${LUXE_COLORS.gold}20`,
            color: isDraft ? LUXE_COLORS.black : LUXE_COLORS.gold,
            boxShadow: `0 2px 8px ${isDraft ? LUXE_COLORS.black : LUXE_COLORS.gold}20`,
            transform: headerHovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' // 🎨 ENTERPRISE: Spring easing
          }}
        >
          {cards.length}
        </span>
      </div>

      {/* Column content */}
      <div
        ref={setNodeRef}
        data-column-id={id}
        data-column-content="true"
        className="flex-1 p-3 space-y-3 overflow-y-auto"
        style={{
          borderRadius: '0 0 1rem 1rem', // 🎨 ENTERPRISE: Soft edges (bottom corners only)
          background: isOver
            ? 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.08) 100%)' // 🎨 ENTERPRISE: Highlighted drop zone
            : 'linear-gradient(135deg, #0B0B0B 0%, #141414 100%)',
          borderLeft: `1px solid ${isOver ? LUXE_COLORS.gold + '80' : '#8C785340'}`,
          borderRight: `1px solid ${isOver ? LUXE_COLORS.gold + '80' : '#8C785340'}`,
          borderBottom: `1px solid ${isOver ? LUXE_COLORS.gold + '80' : '#8C785340'}`,
          boxShadow: isOver
            ? `inset 0 0 40px rgba(212, 175, 55, 0.2), 0 0 0 3px ${LUXE_COLORS.gold}60, 0 8px 24px rgba(212,175,55,0.3)` // 🎨 ENTERPRISE: Enhanced glow
            : 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', // 🎨 ENTERPRISE: Spring easing
          minHeight: '400px' // 🎯 ENTERPRISE: Larger drop zone
        }}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cardsByDate.length > 0 ? (
            cardsByDate.map((group, groupIndex) => (
              <div key={group.date.toISOString()} className="space-y-3">
                {/* 🎯 ENTERPRISE: Luxe Date Header - Always visible with emerald accent */}
                <div
                  className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 mb-1 animate-in fade-in duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.emerald}18 0%, ${LUXE_COLORS.emerald}0A 100%)`,
                    borderRadius: '0.75rem',
                    border: `1px solid ${LUXE_COLORS.emerald}50`,
                    boxShadow: `0 2px 8px ${LUXE_COLORS.emerald}15, inset 0 1px 0 ${LUXE_COLORS.emerald}30`,
                    backdropFilter: 'blur(10px)',
                    animation: `slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${groupIndex * 0.1}s both`
                  }}
                >
                  <Calendar className="w-4 h-4" style={{ color: LUXE_COLORS.emerald }} />
                  <span
                    className="text-sm font-semibold tracking-wide"
                    style={{ color: LUXE_COLORS.champagne }}
                  >
                    {group.dateLabel}
                  </span>
                  <span
                    className="ml-auto text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      background: `${LUXE_COLORS.emerald}30`,
                      color: LUXE_COLORS.champagne,
                      border: `1px solid ${LUXE_COLORS.emerald}60`,
                      boxShadow: `0 1px 4px ${LUXE_COLORS.emerald}20`
                    }}
                  >
                    {group.cards.length}
                  </span>
                </div>
                {/* Render cards for this date */}
                {group.cards.map(card => (
                  <Card
                    key={card.id}
                    card={card}
                    onConfirm={() => onCardAction(card, 'confirm')}
                    onEdit={() => onCardAction(card, 'edit')}
                    onReschedule={() => onCardAction(card, 'reschedule')}
                    onCancel={() => onCardAction(card, 'cancel')}
                    onProcessPayment={() => onCardAction(card, 'process_payment')}
                    onMoveToNext={onMoveToNext ? () => onMoveToNext(card) : undefined}
                  />
                ))}
              </div>
            ))
          ) : null}
        </SortableContext>

        {cards.length === 0 && (
          <div
            className="text-center py-12 text-sm rounded-lg border-2 border-dashed transition-all duration-300"
            style={{
              color: isOver ? LUXE_COLORS.gold : '#8C7853',
              borderColor: isOver ? `${LUXE_COLORS.gold}80` : '#8C785340',
              background: isOver ? 'rgba(212,175,55,0.08)' : 'transparent',
              transform: isOver ? 'scale(1.02)' : 'scale(1)'
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: isOver ? `${LUXE_COLORS.gold}30` : 'rgba(140,120,83,0.2)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                <span className="text-2xl">{isOver ? '✨' : '📋'}</span>
              </div>
              <div className="font-medium">
                {isDraft ? 'No draft appointments' : isOver ? 'Drop here!' : 'Drop appointments here'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
