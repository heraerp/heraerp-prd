/**
 * HERA Enterprise Loading Completion Hook - Test Suite
 *
 * Comprehensive test coverage for useLoadingCompletion hook
 * Ensures production reliability and error handling
 *
 * @author HERA Engineering Team
 * @version 1.0.0
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useLoadingCompletion, getLoadingMetrics, clearLoadingMetrics } from '../useLoadingCompletion'
import { useLoadingStore } from '@/lib/stores/loading-store'

// Mock the loading store
jest.mock('@/lib/stores/loading-store', () => ({
  useLoadingStore: jest.fn(),
}))

// Mock window.location
const mockLocation = {
  search: '',
  pathname: '/test-page',
}

const mockReplaceState = jest.fn()

describe('useLoadingCompletion', () => {
  let mockUpdateProgress: jest.Mock
  let mockCompleteLoading: jest.Mock

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockUpdateProgress = jest.fn()
    mockCompleteLoading = jest.fn()

    // Mock loading store functions
    ;(useLoadingStore as jest.Mock).mockReturnValue({
      updateProgress: mockUpdateProgress,
      completeLoading: mockCompleteLoading,
    })

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    })

    // Mock history.replaceState
    Object.defineProperty(window.history, 'replaceState', {
      value: mockReplaceState,
      writable: true,
    })

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initialization Detection', () => {
    it('should detect initializing parameter and start animation', () => {
      mockLocation.search = '?initializing=true'

      renderHook(() => useLoadingCompletion({ debug: true }))

      // Fast-forward through intervals
      act(() => {
        jest.advanceTimersByTime(300) // 6 intervals at 50ms = 300ms
      })

      // Should have called updateProgress multiple times
      expect(mockUpdateProgress).toHaveBeenCalled()
      expect(mockUpdateProgress.mock.calls.length).toBeGreaterThan(0)
    })

    it('should skip animation when initializing parameter is missing', () => {
      mockLocation.search = ''

      renderHook(() => useLoadingCompletion())

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Should NOT have called updateProgress
      expect(mockUpdateProgress).not.toHaveBeenCalled()
    })

    it('should skip animation when initializing=false', () => {
      mockLocation.search = '?initializing=false'

      renderHook(() => useLoadingCompletion())

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(mockUpdateProgress).not.toHaveBeenCalled()
    })
  })

  describe('Progress Animation', () => {
    it('should animate from 70% to 100% by default', () => {
      mockLocation.search = '?initializing=true'

      renderHook(() => useLoadingCompletion())

      act(() => {
        jest.advanceTimersByTime(350) // Enough time to reach 100%
      })

      // Check progress values
      const progressValues = mockUpdateProgress.mock.calls.map(call => call[0])
      expect(progressValues).toContain(70)
      expect(progressValues).toContain(75)
      expect(progressValues).toContain(80)
      expect(progressValues).toContain(100)
    })

    it('should respect custom startProgress', () => {
      mockLocation.search = '?initializing=true'

      renderHook(() => useLoadingCompletion({ startProgress: 80 }))

      act(() => {
        jest.advanceTimersByTime(250)
      })

      const progressValues = mockUpdateProgress.mock.calls.map(call => call[0])
      expect(progressValues[0]).toBe(85) // 80 + 5 increment
    })

    it('should respect custom progressIncrement', () => {
      mockLocation.search = '?initializing=true'

      renderHook(() => useLoadingCompletion({ progressIncrement: 10 }))

      act(() => {
        jest.advanceTimersByTime(200)
      })

      const progressValues = mockUpdateProgress.mock.calls.map(call => call[0])
      expect(progressValues).toContain(80) // 70 + 10
      expect(progressValues).toContain(90) // 80 + 10
      expect(progressValues).toContain(100) // 90 + 10
    })

    it('should use custom loading messages', () => {
      mockLocation.search = '?initializing=true'

      renderHook(() =>
        useLoadingCompletion({
          loadingMessage: 'Custom loading...',
          completionMessage: 'Custom done!',
        })
      )

      act(() => {
        jest.advanceTimersByTime(350)
      })

      // Check messages
      const messages = mockUpdateProgress.mock.calls.map(call => call[2])
      expect(messages).toContain('Custom loading...')
      expect(messages[messages.length - 1]).toBe('Custom done!')
    })
  })

  describe('Completion Behavior', () => {
    it('should call completeLoading after reaching 100%', () => {
      mockLocation.search = '?initializing=true'

      renderHook(() => useLoadingCompletion({ completionDelayMs: 500 }))

      act(() => {
        jest.advanceTimersByTime(350) // Reach 100%
        jest.advanceTimersByTime(500) // Wait for completion delay
      })

      expect(mockCompleteLoading).toHaveBeenCalledTimes(1)
    })

    it('should respect custom completionDelayMs', () => {
      mockLocation.search = '?initializing=true'

      renderHook(() => useLoadingCompletion({ completionDelayMs: 1000 }))

      act(() => {
        jest.advanceTimersByTime(350) // Reach 100%
      })

      // Should NOT have completed yet
      expect(mockCompleteLoading).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(1000) // Wait for custom delay
      })

      // Should have completed now
      expect(mockCompleteLoading).toHaveBeenCalledTimes(1)
    })

    it('should clean up URL parameter by default', () => {
      mockLocation.search = '?initializing=true'
      mockLocation.pathname = '/salon/dashboard'

      renderHook(() => useLoadingCompletion())

      act(() => {
        jest.advanceTimersByTime(850) // Complete animation + delay
      })

      expect(mockReplaceState).toHaveBeenCalledWith({}, '', '/salon/dashboard')
    })

    it('should skip URL cleanup when cleanupUrl=false', () => {
      mockLocation.search = '?initializing=true'

      renderHook(() => useLoadingCompletion({ cleanupUrl: false }))

      act(() => {
        jest.advanceTimersByTime(850)
      })

      expect(mockReplaceState).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle updateProgress errors gracefully', () => {
      mockLocation.search = '?initializing=true'
      mockUpdateProgress.mockImplementation(() => {
        throw new Error('Update progress failed')
      })

      // Should not throw
      expect(() => {
        renderHook(() => useLoadingCompletion())
        act(() => {
          jest.advanceTimersByTime(100)
        })
      }).not.toThrow()
    })

    it('should handle completeLoading errors gracefully', () => {
      mockLocation.search = '?initializing=true'
      mockCompleteLoading.mockImplementation(() => {
        throw new Error('Complete loading failed')
      })

      // Should not throw
      expect(() => {
        renderHook(() => useLoadingCompletion())
        act(() => {
          jest.advanceTimersByTime(850)
        })
      }).not.toThrow()
    })

    it('should handle URL cleanup errors gracefully', () => {
      mockLocation.search = '?initializing=true'
      mockReplaceState.mockImplementation(() => {
        throw new Error('ReplaceState failed')
      })

      // Should not throw
      expect(() => {
        renderHook(() => useLoadingCompletion())
        act(() => {
          jest.advanceTimersByTime(850)
        })
      }).not.toThrow()

      // Should still complete loading
      expect(mockCompleteLoading).toHaveBeenCalled()
    })
  })

  describe('Performance Monitoring', () => {
    it('should record metrics when enableMonitoring=true', () => {
      mockLocation.search = '?initializing=true'
      mockLocation.pathname = '/test-page'

      renderHook(() => useLoadingCompletion({ enableMonitoring: true }))

      act(() => {
        jest.advanceTimersByTime(850)
      })

      const metrics = getLoadingMetrics()
      expect(metrics.length).toBeGreaterThan(0)
      expect(metrics[0]).toMatchObject({
        wasInitializing: true,
        pagePath: '/test-page',
      })
      expect(metrics[0].duration).toBeGreaterThan(0)
    })

    it('should not record metrics when enableMonitoring=false', () => {
      mockLocation.search = '?initializing=true'

      renderHook(() => useLoadingCompletion({ enableMonitoring: false }))

      act(() => {
        jest.advanceTimersByTime(850)
      })

      const metrics = getLoadingMetrics()
      expect(metrics.length).toBe(0)
    })

    it('should limit metrics to 50 entries', () => {
      mockLocation.search = '?initializing=true'

      // Record 60 metrics
      for (let i = 0; i < 60; i++) {
        const { unmount } = renderHook(() => useLoadingCompletion({ enableMonitoring: true }))
        act(() => {
          jest.advanceTimersByTime(850)
        })
        unmount()
      }

      const metrics = getLoadingMetrics()
      expect(metrics.length).toBeLessThanOrEqual(50)
    })

    it('should clear metrics', () => {
      mockLocation.search = '?initializing=true'

      renderHook(() => useLoadingCompletion({ enableMonitoring: true }))

      act(() => {
        jest.advanceTimersByTime(850)
      })

      expect(getLoadingMetrics().length).toBeGreaterThan(0)

      clearLoadingMetrics()

      expect(getLoadingMetrics().length).toBe(0)
    })
  })

  describe('React Strict Mode Compatibility', () => {
    it('should not run twice in strict mode', () => {
      mockLocation.search = '?initializing=true'

      const { rerender } = renderHook(() => useLoadingCompletion())

      // Simulate strict mode double render
      rerender()

      act(() => {
        jest.advanceTimersByTime(850)
      })

      // Should only complete once despite double render
      expect(mockCompleteLoading).toHaveBeenCalledTimes(1)
    })
  })

  describe('Memory Leak Prevention', () => {
    it('should cleanup interval on unmount', () => {
      mockLocation.search = '?initializing=true'

      const { unmount } = renderHook(() => useLoadingCompletion())

      // Start animation
      act(() => {
        jest.advanceTimersByTime(100)
      })

      const callsBeforeUnmount = mockUpdateProgress.mock.calls.length

      // Unmount before completion
      unmount()

      // Advance time - should not call updateProgress anymore
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(mockUpdateProgress.mock.calls.length).toBe(callsBeforeUnmount)
    })
  })

  describe('SSR Safety', () => {
    it('should handle SSR environment gracefully', () => {
      // Mock SSR environment
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      // Should not throw
      expect(() => {
        renderHook(() => useLoadingCompletion({ debug: true }))
      }).not.toThrow()

      // Restore window
      global.window = originalWindow
    })
  })
})
