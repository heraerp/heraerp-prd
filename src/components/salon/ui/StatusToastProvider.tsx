'use client'

import React, { createContext, useContext } from 'react'
import { StatusToast, useStatusToast } from './StatusToast'

interface StatusToastContextType {
  showSuccess: (title: string, message?: string) => string
  showError: (title: string, message?: string) => string
  showWarning: (title: string, message?: string) => string
  showLoading: (title: string, message?: string) => string
  removeToast: (id: string) => void
}

const StatusToastContext = createContext<StatusToastContextType | null>(null)

export function StatusToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, showSuccess, showError, showWarning, showLoading, removeToast } = useStatusToast()

  return (
    <StatusToastContext.Provider
      value={{ showSuccess, showError, showWarning, showLoading, removeToast }}
    >
      {children}
      <StatusToast toasts={toasts} onRemove={removeToast} />
    </StatusToastContext.Provider>
  )
}

export function useSalonToast() {
  const context = useContext(StatusToastContext)
  if (!context) {
    throw new Error('useSalonToast must be used within StatusToastProvider')
  }
  return context
}
