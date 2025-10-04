'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useToast } from './use-toast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, removeToast } = useToast()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render global toaster on salon routes - they use StatusToastProvider
  if (pathname?.startsWith('/salon')) {
    return null
  }

  if (!mounted || typeof window === 'undefined') {
    return null
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>,
    document.body
  )
}

function ToastCard({ toast, onClose }: { toast: any; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.duration, onClose])

  const variants = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  return (
    <div
      className={cn(
        'min-w-[300px] max-w-md p-4 border rounded-lg shadow-lg transition-all duration-300',
        'animate-in slide-in-from-right-full',
        variants[toast.type] || variants.info
      )}
      onClick={onClose}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {toast.title && <div className="font-medium mb-1">{toast.title}</div>}
          {toast.description && <div className="text-sm">{toast.description}</div>}
        </div>
        <button
          onClick={e => {
            e.stopPropagation()
            onClose()
          }}
          className="ml-2 text-lg hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  )
}
