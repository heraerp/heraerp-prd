'use client'

/**
 * Sidebar UI Components
 * Reusable sidebar components for navigation layouts
 */

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Sidebar Context
interface SidebarContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isMobile: boolean
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  setIsOpen: () => {},
  isMobile: false
})

// Sidebar Provider
interface SidebarProviderProps {
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export function SidebarProvider({ children, defaultOpen = true, className }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount (simplified)
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobile }}>
      <div className={cn("flex min-h-screen", className)}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

// Sidebar Hook
export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

// Main Sidebar Component
interface SidebarProps {
  children: ReactNode
  className?: string
  side?: 'left' | 'right'
}

export function Sidebar({ children, className, side = 'left' }: SidebarProps) {
  const { isOpen, isMobile } = useSidebar()

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => useSidebar().setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out",
          side === 'left' ? 'left-0' : 'right-0',
          isOpen ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full',
          isMobile ? 'md:relative md:translate-x-0' : 'relative translate-x-0',
          className
        )}
      >
        {children}
      </aside>
    </>
  )
}

// Sidebar Header
interface SidebarHeaderProps {
  children: ReactNode
  className?: string
}

export function SidebarHeader({ children, className }: SidebarHeaderProps) {
  return (
    <div className={cn("flex h-16 items-center border-b border-gray-200 px-4", className)}>
      {children}
    </div>
  )
}

// Sidebar Content
interface SidebarContentProps {
  children: ReactNode
  className?: string
}

export function SidebarContent({ children, className }: SidebarContentProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto py-4", className)}>
      {children}
    </div>
  )
}

// Sidebar Menu
interface SidebarMenuProps {
  children: ReactNode
  className?: string
}

export function SidebarMenu({ children, className }: SidebarMenuProps) {
  return (
    <nav className={cn("space-y-1 px-2", className)}>
      {children}
    </nav>
  )
}

// Sidebar Menu Item
interface SidebarMenuItemProps {
  children: ReactNode
  className?: string
}

export function SidebarMenuItem({ children, className }: SidebarMenuItemProps) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  )
}

// Sidebar Menu Button
interface SidebarMenuButtonProps {
  children: ReactNode
  className?: string
  isActive?: boolean
  onClick?: () => void
  asChild?: boolean
}

export function SidebarMenuButton({ 
  children, 
  className, 
  isActive = false, 
  onClick,
  asChild = false 
}: SidebarMenuButtonProps) {
  const baseClasses = cn(
    "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive 
      ? "bg-gray-100 text-gray-900" 
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
    className
  )

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      className: baseClasses
    })
  }

  return (
    <button className={baseClasses} onClick={onClick}>
      {children}
    </button>
  )
}

// Sidebar Toggle Button (for mobile)
interface SidebarToggleProps {
  className?: string
}

export function SidebarToggle({ className }: SidebarToggleProps) {
  const { isOpen, setIsOpen } = useSidebar()

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow-sm",
        className
      )}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  )
}