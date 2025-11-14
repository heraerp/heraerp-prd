'use client'

import React, { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface NavItem {
  label: string
  href: string
}

interface FurnitureNavDropdownProps {
  label: string
  items: NavItem[]
}

export function FurnitureNavDropdown({ label, items }: FurnitureNavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Calculate position for fixed positioning
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      })
    }
    
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={dropdownRef}
    >
      <button 
        ref={buttonRef}
        className="flex items-center gap-1 px-4 py-2 text-sm font-medium jewelry-text-luxury hover:jewelry-text-gold transition-colors whitespace-nowrap jewelry-nav-item rounded-lg"
        style={{ position: 'relative' }}
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
        {isOpen && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}
      </button>

      {isOpen && (
        <div 
          className="fixed w-72 rounded-lg jewelry-glass-dropdown"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 99999,
            minHeight: '200px'
          }}
        >
          <div className="py-3">
            {items.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="block px-4 py-3 text-sm jewelry-text-luxury hover:jewelry-text-gold hover:bg-white/5 transition-all duration-200 rounded-md mx-2"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}