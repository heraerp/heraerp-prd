'use client'

/**
 * Universal Transaction Shell - Three-Panel Layout Standard
 * Smart Code: HERA.UNIVERSAL.COMPONENT.TRANSACTION_SHELL.v1
 * 
 * Provides consistent transaction interface across all modules:
 * - LEFT: Status, amounts, workflow controls
 * - CENTER: Header → Lines → Review tabs with fullscreen toggle  
 * - RIGHT: AI Assistant with contextual insights
 */

import React, { useState, ReactNode } from 'react'
import { 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff, 
  ChevronRight,
  Clock,
  Search,
  RefreshCw
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { OrganizationSelector } from '@/components/transaction/OrganizationSelector'

interface UniversalTransactionShellProps {
  // Header content
  title: string
  subtitle?: string
  breadcrumbs: Array<{ label: string; href?: string }>
  
  // Main content areas
  leftPanelContent: ReactNode
  centerPanelContent: ReactNode  
  rightPanelContent?: ReactNode
  
  // Configuration
  showAIPanel?: boolean
  onToggleAIPanel?: () => void
  allowFullscreen?: boolean
  showAutoSave?: boolean
  lastSaved?: string
  
  // Mobile behavior
  mobileLayout?: 'stacked' | 'tabs'
  
  // Styling
  className?: string
}

export function UniversalTransactionShell({
  title,
  subtitle,
  breadcrumbs,
  leftPanelContent,
  centerPanelContent,
  rightPanelContent,
  showAIPanel = true,
  onToggleAIPanel,
  allowFullscreen = true,
  showAutoSave = true,
  lastSaved,
  mobileLayout = 'stacked',
  className = ''
}: UniversalTransactionShellProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mobilePanelOpen, setMobilePanelOpen] = useState<'left' | 'right' | null>(null)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleAIToggle = () => {
    if (onToggleAIPanel) {
      onToggleAIPanel()
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${className}`}>
      {/* Top Navigation Bar - Consistent across all transactions */}
      <nav className="h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left side - Breadcrumbs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-semibold text-slate-800">HERA</span>
            </div>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                <ChevronRight size={16} className="text-slate-400" />
                <span className={`text-sm ${
                  index === breadcrumbs.length - 1 
                    ? 'font-medium text-slate-800' 
                    : 'text-slate-600 hover:text-slate-800 cursor-pointer'
                }`}>
                  {item.label}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Right side - Controls and status */}
          <div className="flex items-center gap-3">
            {/* Organization Selector */}
            <OrganizationSelector showFullName={true} showId={true} />
            
            {/* Auto-save indicator */}
            {showAutoSave && lastSaved && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                <Clock size={14} className="text-slate-600" />
                <span className="text-xs font-medium text-slate-700">
                  Auto-save: {lastSaved}
                </span>
              </div>
            )}
            
            <div className="h-6 w-px bg-slate-200" />
            
            {/* Action buttons */}
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Search size={18} className="text-slate-600" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <RefreshCw size={18} className="text-slate-600" />
            </button>

            {/* Fullscreen toggle */}
            {allowFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 size={18} className="text-slate-600" />
                ) : (
                  <Maximize2 size={18} className="text-slate-600" />
                )}
              </button>
            )}

            {/* AI Panel toggle */}
            {rightPanelContent && (
              <button
                onClick={handleAIToggle}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title={showAIPanel ? 'Hide AI Assistant' : 'Show AI Assistant'}
              >
                {showAIPanel ? (
                  <EyeOff size={18} className="text-slate-600" />
                ) : (
                  <Eye size={18} className="text-slate-600" />
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Page Title Section */}
      <div className="px-6 py-4 bg-white/60 backdrop-blur-xl border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="text-slate-600 mt-1">{subtitle}</p>
            )}
          </div>
          
          {/* Mobile panel toggles */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobilePanelOpen(mobilePanelOpen === 'left' ? null : 'left')}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg"
            >
              Status
            </button>
            {rightPanelContent && (
              <button
                onClick={() => setMobilePanelOpen(mobilePanelOpen === 'right' ? null : 'right')}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg"
              >
                AI
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Three Panel Layout */}
      <div className={`flex transition-all duration-300 ${
        isFullscreen ? 'h-screen' : 'h-[calc(100vh-9rem)]'
      } overflow-hidden`}>
        
        {/* LEFT Panel - Status & Controls */}
        <div className={`
          w-80 bg-white/70 backdrop-blur-xl border-r border-slate-200/50 overflow-y-auto
          transition-all duration-300
          ${isFullscreen ? 'md:w-0 md:opacity-0 md:pointer-events-none' : 'md:w-80'}
          ${mobileLayout === 'stacked' ? 'block' : 'hidden md:block'}
          ${mobilePanelOpen === 'left' ? 'fixed inset-0 z-40 w-full' : 'hidden md:block'}
        `}>
          <div className="p-4">
            {/* Mobile close button */}
            {mobilePanelOpen === 'left' && (
              <button
                onClick={() => setMobilePanelOpen(null)}
                className="md:hidden mb-4 p-2 bg-slate-100 rounded-lg"
              >
                ← Back
              </button>
            )}
            {leftPanelContent}
          </div>
        </div>

        {/* CENTER Panel - Main Content */}
        <div className={`
          flex-1 overflow-y-auto transition-all duration-300
          ${isFullscreen ? 'mx-0' : ''}
          ${mobileLayout === 'stacked' ? 'w-full' : 'flex-1'}
        `}>
          <div className="p-6">
            {centerPanelContent}
          </div>
        </div>

        {/* RIGHT Panel - AI Assistant */}
        {rightPanelContent && showAIPanel && (
          <div className={`
            w-96 bg-gradient-to-br from-indigo-50 to-purple-50 border-l border-slate-200/50 overflow-y-auto
            transition-all duration-300
            ${isFullscreen ? 'md:w-0 md:opacity-0 md:pointer-events-none' : 'md:w-96'}
            ${mobileLayout === 'stacked' ? 'block' : 'hidden md:block'}
            ${mobilePanelOpen === 'right' ? 'fixed inset-0 z-40 w-full' : 'hidden md:block'}
          `}>
            <div className="p-6">
              {/* Mobile close button */}
              {mobilePanelOpen === 'right' && (
                <button
                  onClick={() => setMobilePanelOpen(null)}
                  className="md:hidden mb-4 p-2 bg-white rounded-lg"
                >
                  ← Back
                </button>
              )}
              {rightPanelContent}
            </div>
          </div>
        )}
      </div>

      {/* Mobile overlay backdrop */}
      {mobilePanelOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobilePanelOpen(null)}
        />
      )}

      {/* Fullscreen mode indicator */}
      {isFullscreen && (
        <div className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-black/80 text-white text-sm rounded-lg">
          Fullscreen mode • Press ESC or click minimize to exit
        </div>
      )}
    </div>
  )
}

// Export utility hook for managing transaction shell state
export function useTransactionShell() {
  const [showAIPanel, setShowAIPanel] = useState(true)
  const [lastSaved, setLastSaved] = useState<string>('')

  const updateLastSaved = () => {
    const now = new Date()
    setLastSaved(`${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
  }

  return {
    showAIPanel,
    setShowAIPanel,
    lastSaved,
    updateLastSaved
  }
}