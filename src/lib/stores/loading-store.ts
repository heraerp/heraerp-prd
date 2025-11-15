/**
 * Global Loading Store
 * Manages persistent loading overlay across route changes
 * Smart Code: HERA.UI.LOADING.GLOBAL.v1
 */

import { create } from 'zustand'

interface LoadingState {
  isLoading: boolean
  progress: number
  message: string
  subtitle: string
  hasError: boolean
  timeoutId: NodeJS.Timeout | null
  startLoading: (message: string, subtitle?: string) => void
  updateProgress: (progress: number, message?: string, subtitle?: string) => void
  finishLoading: () => void
  reset: () => void
  startTimeout: () => void
  clearTimeout: () => void
  setError: (message: string, subtitle: string) => void
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  isLoading: false,
  progress: 0,
  message: '',
  subtitle: '',
  hasError: false,
  timeoutId: null,

  startLoading: (message, subtitle = '') => {
    set({
      isLoading: true,
      progress: 0,
      message,
      subtitle,
      hasError: false
    })
    // Start safety timeout
    get().startTimeout()
  },

  updateProgress: (progress, message, subtitle) => {
    set((state) => ({
      progress,
      message: message !== undefined ? message : state.message,
      subtitle: subtitle !== undefined ? subtitle : state.subtitle,
      hasError: false
    }))

    // Reset timeout on any progress update
    get().clearTimeout()
    get().startTimeout()
  },

  finishLoading: () => {
    get().clearTimeout()
    set({
      isLoading: false,
      progress: 100,
      hasError: false
    })
  },

  reset: () => {
    get().clearTimeout()
    set({
      isLoading: false,
      progress: 0,
      message: '',
      subtitle: '',
      hasError: false,
      timeoutId: null
    })
  },

  setError: (message, subtitle) => {
    get().clearTimeout()
    set({
      isLoading: true,
      progress: 100,
      message,
      subtitle,
      hasError: true
    })
  },

  // ⏱️ Safety timeout: Auto-complete loading after 8 seconds
  startTimeout: () => {
    const timeoutId = setTimeout(() => {
      const state = get()
      if (state.isLoading && state.progress < 100 && !state.hasError) {
        console.warn('⚠️ Loading timeout: Page did not complete loading hook within 8 seconds')
        console.warn('🔧 Showing error message for better UX')

        // Show error state
        get().setError(
          'Page Not Found',
          'The page failed to load or does not exist. Please check the URL and try again.'
        )

        // Auto-hide error after 5 seconds
        setTimeout(() => {
          set({
            isLoading: false,
            hasError: false
          })
        }, 5000)
      }
    }, 8000) // 8 second timeout

    set({ timeoutId })
  },

  clearTimeout: () => {
    const { timeoutId } = get()
    if (timeoutId) {
      clearTimeout(timeoutId)
      set({ timeoutId: null })
    }
  }
}))
