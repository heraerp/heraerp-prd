'use client'

import React, { useCallback, useContext } from 'react'

import * as React from 'react'
import { usePathname } from 'next/navigation'

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: 'default' | 'destructive'
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => void
  dismiss: (toastId?: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const pathname = usePathname()

  const toast = React.useCallback((props: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    const newToast = { ...props, id }

    setToasts(prev => [...prev, newToast])

    // Auto dismiss after duration (default 5 seconds)
    const duration = props.duration || 5000
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const dismiss = React.useCallback((toastId?: string) => {
    setToasts(prev => {
      if (toastId) {
        return prev.filter(t => t.id !== toastId)
      }
      return []
    })
  }, [])

  // Don't render toast container on salon routes - they use StatusToastProvider
  const shouldRenderToasts = !pathname?.startsWith('/salon')

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {shouldRenderToasts && (
        <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`relative flex items-start gap-3 p-4 pr-8 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform translate-x-0 ${
                toast.variant === 'destructive'
                  ? 'bg-red-600 text-foreground'
                  : 'bg-background text-gray-100 border border-border'
              }
              `}
            >
              <div className="flex-1">
                {toast.title && <div className="font-semibold">{toast.title}</div>}
                {toast.description && (
                  <div
                    className={`text-sm ${toast.variant === 'destructive' ? 'text-red-100' : 'text-muted-foreground'}`}
                  >
                    {toast.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className={`absolute top-2 right-2 p-1 rounded-md ${toast.variant === 'destructive' ? 'hover:bg-red-700' : 'hover:bg-muted'}
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Export toast function directly for convenience
export const toast = (props: Omit<Toast, 'id'>) => {
  // This will only work within a ToastProvider context
  // For usage outside context, consider using a global toast system
  throw new Error('toast() must be used within useToast() hook inside ToastProvider')
}
