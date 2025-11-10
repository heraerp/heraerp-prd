'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * 🎯 Enterprise-Grade Dropdown Menu for Salon Pages
 *
 * Solves mobile overflow issues by grouping actions into organized dropdowns
 * Follows HERA mobile-first design principles
 */

interface ActionItem {
  label: string
  icon?: LucideIcon
  onClick: () => void
  color?: string
  textColor?: string
  disabled?: boolean
  loading?: boolean
  badge?: string | number
  divider?: boolean // Add divider after this item
}

interface ActionGroup {
  label: string
  items: ActionItem[]
}

interface SalonActionsDropdownProps {
  label: string
  icon?: LucideIcon
  groups?: ActionGroup[] // Organized into sections
  items?: ActionItem[]    // Flat list (legacy support)
  buttonColor?: string
  buttonTextColor?: string
  align?: 'left' | 'right'
  className?: string
}

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

export function SalonActionsDropdown({
  label,
  icon: Icon,
  groups,
  items,
  buttonColor = COLORS.charcoalLight,
  buttonTextColor = COLORS.champagne,
  align = 'right',
  className = ''
}: SalonActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Support both grouped and flat item structures
  const renderContent = () => {
    if (groups) {
      return groups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {/* Group Label */}
          <div
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wide"
            style={{ color: COLORS.bronze }}
          >
            {group.label}
          </div>

          {/* Group Items */}
          {group.items.map((item, itemIndex) => renderItem(item, `${groupIndex}-${itemIndex}`))}

          {/* Divider between groups */}
          {groupIndex < groups.length - 1 && (
            <div
              className="my-1 border-t"
              style={{ borderColor: COLORS.bronze + '20' }}
            />
          )}
        </div>
      ))
    }

    if (items) {
      return items.map((item, index) => renderItem(item, index.toString()))
    }

    return null
  }

  const renderItem = (item: ActionItem, key: string) => {
    const ItemIcon = item.icon

    return (
      <React.Fragment key={key}>
        <button
          onClick={() => {
            item.onClick()
            setIsOpen(false)
          }}
          disabled={item.disabled || item.loading}
          className="w-full px-3 py-2.5 flex items-center gap-3 transition-all hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: item.disabled ? COLORS.bronze : item.textColor || COLORS.champagne
          }}
        >
          {/* Icon */}
          {ItemIcon && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: item.color ? item.color + '20' : COLORS.charcoalDark,
                border: item.color ? `1px solid ${item.color}40` : 'none'
              }}
            >
              <ItemIcon
                className="w-4 h-4"
                style={{ color: item.color || COLORS.champagne }}
              />
            </div>
          )}

          {/* Label */}
          <span className="flex-1 text-left text-sm font-medium">
            {item.loading ? 'Loading...' : item.label}
          </span>

          {/* Badge */}
          {item.badge && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: COLORS.gold + '20',
                color: COLORS.gold
              }}
            >
              {item.badge}
            </span>
          )}
        </button>

        {/* Divider */}
        {item.divider && (
          <div
            className="my-1 border-t"
            style={{ borderColor: COLORS.bronze + '20' }}
          />
        )}
      </React.Fragment>
    )
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          backgroundColor: buttonColor,
          color: buttonTextColor,
          border: `1px solid ${COLORS.bronze}40`
        }}
      >
        {Icon && <Icon className="w-4 h-4" />}
        <span>{label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-64 rounded-xl border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: COLORS.bronze + '40',
            boxShadow: '0 20px 30px rgba(0,0,0,0.5)'
          }}
        >
          <div className="py-2 max-h-[400px] overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 🎯 Mobile-Optimized Actions Menu
 *
 * Bottom sheet style for mobile devices
 */
interface MobileActionsMenuProps {
  isOpen: boolean
  onClose: () => void
  title: string
  groups?: ActionGroup[]
  items?: ActionItem[]
}

export function MobileActionsMenu({
  isOpen,
  onClose,
  title,
  groups,
  items
}: MobileActionsMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const renderContent = () => {
    if (groups) {
      return groups.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-4">
          {/* Group Label */}
          <div
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
            style={{ color: COLORS.bronze }}
          >
            {group.label}
          </div>

          {/* Group Items */}
          {group.items.map((item, itemIndex) => renderItem(item, `${groupIndex}-${itemIndex}`))}
        </div>
      ))
    }

    if (items) {
      return items.map((item, index) => renderItem(item, index.toString()))
    }

    return null
  }

  const renderItem = (item: ActionItem, key: string) => {
    const ItemIcon = item.icon

    return (
      <button
        key={key}
        onClick={() => {
          item.onClick()
          onClose()
        }}
        disabled={item.disabled || item.loading}
        className="w-full px-4 py-4 flex items-center gap-4 transition-all active:bg-white/5 disabled:opacity-50"
        style={{
          color: item.disabled ? COLORS.bronze : item.textColor || COLORS.champagne,
          borderBottom: `1px solid ${COLORS.bronze}20`
        }}
      >
        {/* Icon */}
        {ItemIcon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: item.color ? item.color + '20' : COLORS.charcoalDark,
              border: item.color ? `1px solid ${item.color}40` : 'none'
            }}
          >
            <ItemIcon
              className="w-6 h-6"
              style={{ color: item.color || COLORS.champagne }}
            />
          </div>
        )}

        {/* Label */}
        <div className="flex-1 text-left">
          <div className="text-base font-medium">
            {item.loading ? 'Loading...' : item.label}
          </div>
        </div>

        {/* Badge */}
        {item.badge && (
          <span
            className="px-2 py-1 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: COLORS.gold + '20',
              color: COLORS.gold
            }}
          >
            {item.badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t animate-in slide-in-from-bottom duration-300"
        style={{
          backgroundColor: COLORS.charcoal,
          borderColor: COLORS.bronze + '40',
          maxHeight: '80vh'
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-12 h-1 rounded-full"
            style={{ backgroundColor: COLORS.bronze }}
          />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b" style={{ borderColor: COLORS.bronze + '20' }}>
          <h3 className="text-lg font-semibold" style={{ color: COLORS.champagne }}>
            {title}
          </h3>
        </div>

        {/* Content */}
        <div className="overflow-y-auto pb-safe" style={{ maxHeight: 'calc(80vh - 100px)' }}>
          {renderContent()}
        </div>
      </div>
    </>
  )
}
