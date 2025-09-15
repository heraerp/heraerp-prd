'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { X, Maximize2, Minimize2, Move, Sparkles } from 'lucide-react'
import { Button } from './button'

export interface ModernModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'default' | 'glassmorphism' | 'enterprise' | 'premium'
  showCloseButton?: boolean
  closable?: boolean
  resizable?: boolean
  draggable?: boolean
  fullScreenEnabled?: boolean
  headerActions?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  overlayClassName?: string
}

const sizeClasses = {
  sm: 'max-w-sm w-full mx-2 sm:mx-4',
  md: 'max-w-md w-full mx-2 sm:mx-4 sm:max-w-lg',
  lg: 'max-w-lg w-full mx-2 sm:mx-4 sm:max-w-2xl',
  xl: 'max-w-xl w-full mx-2 sm:mx-4 sm:max-w-4xl',
  full: 'max-w-full w-full mx-1 sm:mx-4 sm:max-w-7xl'
}

const variantClasses = {
  default: 'bg-background border border-border shadow-2xl',
  glassmorphism: 'bg-background/95 backdrop-blur-xl border border-border/20 shadow-2xl',
  enterprise: 'bg-gradient-to-br from-slate-50 to-white border border-border shadow-2xl',
  premium:
    'bg-gradient-to-br from-blue-50 via-white to-purple-50 border border-blue-200/50 shadow-2xl'
}

export function ModernModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  variant = 'enterprise',
  showCloseButton = true,
  closable = true,
  resizable = false,
  draggable = false,
  fullScreenEnabled = false,
  headerActions,
  footer,
  className,
  overlayClassName
}: ModernModalProps) {
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closable) {
      onClose()
    }
  }

  if (!mounted || !isOpen) return null

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-start sm:items-center justify-center',
        'p-2 sm:p-4 md:p-6',
        'bg-background/70 backdrop-blur-md',
        'animate-in fade-in-0 duration-300',
        'overflow-y-auto',
        overlayClassName
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'relative rounded-xl sm:rounded-2xl overflow-hidden',
          'animate-in zoom-in-95 slide-in-from-bottom-8 duration-300',
          'transform-gpu transition-all',
          'mt-4 sm:mt-0 mb-4 sm:mb-0',
          'min-h-fit max-h-[95vh] sm:max-h-[90vh]',
          isFullScreen ? 'w-full h-[95vh] m-2 sm:m-4 max-w-none' : sizeClasses[size],
          variantClasses[variant],
          className
        )}
        onClick={e => e.stopPropagation()}
        data-testid="crm-form-modal"
      >
        {/* Enhanced Header */}
        <div className="relative">
          {/* Premium Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-indigo-600/10 opacity-50" />

          <div className="relative flex items-center justify-between p-4 sm:p-6 border-b border-border/50">
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
              {/* Modern Icon - smaller on mobile */}
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              {headerActions}

              {/* Window Controls - responsive */}
              <div className="flex items-center space-x-1">
                {fullScreenEnabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-muted/80 text-muted-foreground hover:text-foreground hidden sm:flex"
                  >
                    {isFullScreen ? (
                      <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                )}

                {showCloseButton && closable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    data-testid="close-modal"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Body - mobile-first */}
        <div
          className={cn(
            'relative overflow-y-auto',
            isFullScreen
              ? 'max-h-[calc(95vh-100px)] sm:max-h-[calc(95vh-140px)]'
              : 'max-h-[75vh] sm:max-h-[70vh]'
          )}
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }}
            />
          </div>

          <div className="relative p-4 sm:p-6">{children}</div>
        </div>

        {/* Enhanced Footer - mobile-first */}
        {footer && (
          <div className="relative">
            {/* Subtle Divider */}
            <div className="absolute top-0 left-4 right-4 sm:left-6 sm:right-6 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            <div className="p-4 sm:p-6 bg-muted/50">{footer}</div>
          </div>
        )}

        {/* Modern Focus Ring */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5 pointer-events-none" />
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

// Enhanced Form Modal specifically for CRM
export interface CRMFormModalProps extends Omit<ModernModalProps, 'children'> {
  isLoading?: boolean
  onSubmit?: () => void
  onCancel?: () => void
  submitText?: string
  cancelText?: string
  submitVariant?: 'default' | 'destructive' | 'success'
  children: React.ReactNode
}

export function CRMFormModal({
  isLoading = false,
  onSubmit,
  onCancel,
  submitText = 'Save',
  cancelText = 'Cancel',
  submitVariant = 'default',
  children,
  ...modalProps
}: CRMFormModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.()
  }

  const submitButtonClass = {
    default:
      'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-foreground shadow-lg',
    destructive:
      'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-foreground shadow-lg',
    success:
      'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-foreground shadow-lg'
  }

  const footer = (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel || modalProps.onClose}
        disabled={isLoading}
        data-testid="cancel-btn"
        className="w-full sm:w-auto px-4 sm:px-6 h-11 sm:h-10 border-border hover:bg-muted"
      >
        {cancelText}
      </Button>
      <Button
        type="submit"
        onClick={handleSubmit}
        disabled={isLoading}
        data-testid="submit-btn"
        className={cn(
          'w-full sm:w-auto px-4 sm:px-6 h-11 sm:h-10 font-medium transition-all duration-200',
          submitButtonClass[submitVariant]
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-border/20 border-t-white rounded-full animate-spin" />
            <span>Saving...</span>
          </div>
        ) : (
          submitText
        )}
      </Button>
    </div>
  )

  return (
    <ModernModal {...modalProps} footer={footer} variant="premium" fullScreenEnabled>
      <form onSubmit={handleSubmit} className="space-y-6">
        {children}
      </form>
    </ModernModal>
  )
}
