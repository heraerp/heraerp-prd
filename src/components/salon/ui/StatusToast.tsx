'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'loading'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface StatusToastProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  emeraldDark: '#0A5447',
  rose: '#E8B4B8',
  roseDark: '#D69FA3',
  danger: '#FF6B6B',
  dangerDark: '#CC5555',
  lightText: '#E0E0E0'
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: `${COLORS.emerald}20`,
    borderColor: COLORS.emerald,
    iconColor: COLORS.emerald,
    titleColor: COLORS.champagne
  },
  error: {
    icon: XCircle,
    bgColor: `${COLORS.danger}20`,
    borderColor: COLORS.danger,
    iconColor: COLORS.danger,
    titleColor: COLORS.champagne
  },
  warning: {
    icon: AlertCircle,
    bgColor: `${COLORS.gold}20`,
    borderColor: COLORS.gold,
    iconColor: COLORS.gold,
    titleColor: COLORS.champagne
  },
  loading: {
    icon: Loader2,
    bgColor: `${COLORS.bronze}20`,
    borderColor: COLORS.bronze,
    iconColor: COLORS.bronze,
    titleColor: COLORS.champagne
  }
}

export function StatusToast({ toasts, onRemove }: StatusToastProps) {
  React.useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    toasts.forEach(toast => {
      if (toast.type !== 'loading' && toast.duration !== 0) {
        const timer = setTimeout(() => {
          onRemove(toast.id)
        }, toast.duration || 3000)
        timers.push(timer)
      }
    })

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [toasts, onRemove])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map(toast => {
          const config = toastConfig[toast.type]
          const Icon = config.icon

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto"
            >
              <div
                className={cn(
                  'flex items-start gap-3 px-4 py-3 rounded-lg shadow-2xl',
                  'min-w-[320px] max-w-[420px]',
                  'backdrop-blur-md'
                )}
                style={{
                  backgroundColor: COLORS.charcoal + 'F5',
                  border: `1px solid ${config.borderColor}40`,
                  boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${config.borderColor}20`
                }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: config.bgColor,
                    border: `1px solid ${config.borderColor}40`
                  }}
                >
                  <Icon
                    className={cn('w-5 h-5', toast.type === 'loading' && 'animate-spin')}
                    style={{ color: config.iconColor }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm" style={{ color: config.titleColor }}>
                    {toast.title}
                  </h4>
                  {toast.message && (
                    <p className="text-sm mt-0.5" style={{ color: COLORS.lightText }}>
                      {toast.message}
                    </p>
                  )}
                </div>

                {toast.type !== 'loading' && (
                  <button
                    onClick={() => onRemove(toast.id)}
                    className="flex-shrink-0 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" style={{ color: COLORS.lightText }} />
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// Hook for managing toasts
export function useStatusToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)

    setToasts(prev => {
      // Deduplicate: Check if a toast with same type, title, and message already exists
      const duplicate = prev.find(
        t =>
          t.type === toast.type &&
          t.title === toast.title &&
          t.message === toast.message
      )

      // If duplicate found within last second, don't add new toast
      if (duplicate) {
        return prev
      }

      return [...prev, { ...toast, id }]
    })
    return id
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = React.useCallback(
    (title: string, message?: string) => {
      return addToast({ type: 'success', title, message })
    },
    [addToast]
  )

  const showError = React.useCallback(
    (title: string, message?: string) => {
      return addToast({ type: 'error', title, message })
    },
    [addToast]
  )

  const showWarning = React.useCallback(
    (title: string, message?: string) => {
      return addToast({ type: 'warning', title, message })
    },
    [addToast]
  )

  const showLoading = React.useCallback(
    (title: string, message?: string) => {
      return addToast({ type: 'loading', title, message, duration: 0 })
    },
    [addToast]
  )

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showLoading
  }
}
