'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

interface SalonLuxeModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}

export function SalonLuxeModal({
  open,
  onClose,
  title,
  children,
  maxWidth = '48rem'
}: SalonLuxeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{
        backgroundColor: 'rgba(11, 11, 11, 0.92)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full overflow-hidden"
        style={{
          maxWidth,
          maxHeight: 'calc(100vh - 2rem)',
          backgroundColor: COLORS.charcoal,
          border: `2px solid ${COLORS.gold}`,
          borderRadius: '1rem',
          boxShadow: `
            0 25px 50px -12px rgba(212, 175, 55, 0.3),
            0 0 0 1px ${COLORS.gold}20,
            inset 0 1px 0 0 ${COLORS.gold}10
          `,
          animation: 'scaleIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold accent line */}
        <div
          style={{
            height: '3px',
            background: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 50%, ${COLORS.gold} 100%)`,
            boxShadow: `0 0 20px ${COLORS.gold}40`
          }}
        />

        {/* Header */}
        <div
          className="relative px-8 py-6"
          style={{
            borderBottom: `1px solid ${COLORS.gold}30`,
            background: `linear-gradient(180deg, ${COLORS.charcoalDark} 0%, ${COLORS.charcoal} 100%)`
          }}
        >
          <h2
            className="text-2xl font-bold pr-12"
            style={{
              background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: `0 2px 10px ${COLORS.gold}20`
            }}
          >
            {title}
          </h2>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2"
            style={{
              backgroundColor: `${COLORS.gold}20`,
              border: `1px solid ${COLORS.gold}40`,
              color: COLORS.gold,
              padding: '0.5rem',
              cursor: 'pointer'
            }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto"
          style={{
            maxHeight: 'calc(100vh - 12rem)',
            padding: '2rem',
            scrollbarWidth: 'thin',
            scrollbarColor: `${COLORS.gold}40 ${COLORS.charcoalLight}`
          }}
        >
          {children}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Custom scrollbar for webkit browsers */
        div::-webkit-scrollbar {
          width: 8px;
        }

        div::-webkit-scrollbar-track {
          background: ${COLORS.charcoalLight};
          border-radius: 4px;
        }

        div::-webkit-scrollbar-thumb {
          background: ${COLORS.gold}40;
          border-radius: 4px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: ${COLORS.gold}60;
        }
      `}</style>
    </div>
  )
}
