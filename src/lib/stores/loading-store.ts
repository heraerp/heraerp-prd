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
  startLoading: (message: string, subtitle?: string) => void
  updateProgress: (progress: number, message?: string, subtitle?: string) => void
  finishLoading: () => void
  reset: () => void
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  progress: 0,
  message: '',
  subtitle: '',

  startLoading: (message, subtitle = '') =>
    set({
      isLoading: true,
      progress: 0,
      message,
      subtitle
    }),

  updateProgress: (progress, message, subtitle) =>
    set((state) => ({
      progress,
      message: message !== undefined ? message : state.message,
      subtitle: subtitle !== undefined ? subtitle : state.subtitle
    })),

  finishLoading: () =>
    set({
      isLoading: false,
      progress: 100
    }),

  reset: () =>
    set({
      isLoading: false,
      progress: 0,
      message: '',
      subtitle: ''
    })
}))
