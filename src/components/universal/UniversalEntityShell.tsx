'use client'

/**
 * Universal Entity Shell - Foundation for all entity creation/management pages
 * Smart Code: HERA.UNIVERSAL.ENTITY.SHELL.v1
 * 
 * Provides a three-panel layout similar to UniversalTransactionShell but optimized
 * for master data management with enhanced relationship handling and AI insights
 */

import React, { useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Save,
  Clock,
  Sparkles,
  X,
  CheckCircle,
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Professional Toast Component
const Toast = ({ message, type, isVisible, onClose }: {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  isVisible: boolean
  onClose: () => void
}) => {
  if (!isVisible) return null

  const getToastStyles = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'info': return <Building2 className="w-5 h-5 text-blue-600" />
      default: return null
    }
  }

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right duration-300">
      <div className={`${getToastStyles()} rounded-xl border p-4 shadow-lg backdrop-blur-xl bg-white/90 min-w-[320px] max-w-md`}>
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-relaxed">{message}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Breadcrumb Interface
interface Breadcrumb {
  label: string
  href?: string
}

// Universal Entity Shell Props
interface UniversalEntityShellProps {
  title: string
  subtitle?: string
  breadcrumbs: Breadcrumb[]
  leftPanelContent: ReactNode
  centerPanelContent: ReactNode  
  rightPanelContent?: ReactNode
  showAIPanel?: boolean
  onToggleAIPanel?: () => void
  allowFullscreen?: boolean
  showAutoSave?: boolean
  lastSaved?: string
  mobileLayout?: 'stacked' | 'tabs'
  className?: string
  onSave?: () => Promise<void>
  onCancel?: () => void
  saveButtonText?: string
  isLoading?: boolean
}

// Custom hook for entity shell state management
export const useEntityShell = () => {
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [lastSaved, setLastSaved] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info' | 'warning'
  })

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ isVisible: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 5000)
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }, [])

  const updateLastSaved = useCallback(() => {
    setLastSaved(new Date().toLocaleTimeString())
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  return {
    showAIPanel,
    setShowAIPanel,
    lastSaved,
    updateLastSaved,
    isFullscreen,
    toggleFullscreen,
    toast,
    showToast,
    hideToast
  }
}

export function UniversalEntityShell({
  title,
  subtitle,
  breadcrumbs,
  leftPanelContent,
  centerPanelContent,
  rightPanelContent,
  showAIPanel = false,
  onToggleAIPanel,
  allowFullscreen = true,
  showAutoSave = true,
  lastSaved,
  mobileLayout = 'stacked',
  className = '',
  onSave,
  onCancel,
  saveButtonText = 'Save Entity',
  isLoading = false
}: UniversalEntityShellProps) {
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Internal state management
  const { toast, showToast, hideToast } = useEntityShell()

  const handleSave = useCallback(async () => {
    if (onSave) {
      try {
        await onSave()
        showToast('Entity saved successfully!', 'success')
      } catch (error) {
        console.error('Save error:', error)
        showToast('Failed to save entity. Please try again.', 'error')
      }
    }
  }, [onSave, showToast])

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }, [onCancel, router])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  // Authentication checks
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access entity management.</p>
        </div>
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Organization Context Required</h2>
          <p className="text-gray-600">Please select an organization to continue.</p>
        </div>
      </div>
    )
  }

  const shouldShowRightPanel = showAIPanel && rightPanelContent

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${className} ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      
      {/* Mobile header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      
      <div className="md:hidden sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{title}</h1>
              <p className="text-xs text-gray-600">HERA Entity Manager</p>
            </div>
          </div>
          <button 
            onClick={handleCancel}
            className="min-w-[44px] min-h-[44px] rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleCancel}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span className="text-gray-400">/</span>}
                    <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                      {crumb.label}
                    </span>
                  </React.Fragment>
                ))}
              </nav>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-3">
              {showAutoSave && lastSaved && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1">
                  <Clock size={14} />
                  Last saved: {lastSaved}
                </div>
              )}
              
              {allowFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              )}

              {onToggleAIPanel && (
                <button
                  onClick={onToggleAIPanel}
                  className={`p-2 rounded-lg transition-colors ${
                    showAIPanel 
                      ? 'text-purple-600 bg-purple-100 hover:bg-purple-200' 
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                  title="Toggle AI Assistant"
                >
                  <Sparkles size={16} />
                </button>
              )}

              {onSave && (
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {saveButtonText}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-full mx-auto p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          
          {/* Left panel - Entity navigation and info */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden">
                <div className="p-6">
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
                    {subtitle && (
                      <p className="text-gray-600 text-sm">{subtitle}</p>
                    )}
                  </div>
                  
                  {leftPanelContent}
                </div>
              </div>
            </div>
          </div>

          {/* Center panel - Main entity form */}
          <div className={`flex-1 ${shouldShowRightPanel ? 'lg:max-w-2xl' : ''}`}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl">
              {centerPanelContent}
            </div>
          </div>

          {/* Right panel - AI assistant (conditionally shown) */}
          {shouldShowRightPanel && (
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="sticky top-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden">
                  <div className="p-6 border-b border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        AI Assistant
                      </h3>
                      <button
                        onClick={onToggleAIPanel}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    {rightPanelContent}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom spacing */}
      <div className="h-24 lg:h-0" />

      {/* Mobile save button */}
      {onSave && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full min-h-[56px] bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {saveButtonText}
              </>
            )}
          </button>
        </div>
      )}

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}

export default UniversalEntityShell