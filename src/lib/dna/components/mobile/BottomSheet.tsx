'use client'

import React, { useCallback, useEffect, useImperativeHandle, useState } from 'react'

import * as React from 'react'
import { useEffect, useRef, useState, useCallback, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

// Types
export interface BottomSheetProps {
  /** Control visibility state */
  open?: boolean
  /** Callback when sheet requests to close */
  onClose?: () => void
  /** Sheet content */
  children: React.ReactNode
  /** Sheet title for accessibility */
  title?: string
  /** Sheet description for accessibility */
  description?: string
  /** Snap points - can be specific heights or percentages */
  snapPoints?: (number | string)[]
  /** Default snap point index */
  defaultSnapPoint?: number
  /** Enable drag to dismiss */
  enableDrag?: boolean
  /** Enable backdrop click to dismiss */
  enableBackdropDismiss?: boolean
  /** Backdrop opacity (0-1) */
  backdropOpacity?: number
  /** Custom class name for the sheet container */
  className?: string
  /** Custom class name for the content wrapper */
  contentClassName?: string
  /** Callback when snap point changes */
  onSnapChange?: (snapPoint: number) => void
  /** Show drag handle indicator */
  showHandle?: boolean
  /** Close button variant */
  closeButton?: 'none' | 'icon' | 'text'
  /** Custom header content */
  header?: React.ReactNode
  /** Custom footer content */
  footer?: React.ReactNode
  /** Keyboard close on Escape */
  closeOnEscape?: boolean
  /** Lock body scroll when open */
  lockBodyScroll?: boolean
  /** Animation duration in ms */
  animationDuration?: number
  /** Disable animations for testing/accessibility */
  disableAnimation?: boolean
}

export interface BottomSheetRef {
  /** Programmatically snap to a point */
  snapTo: (index: number) => void
  /** Get current snap point index */
  getCurrentSnapPoint: () => number
  /** Expand to full height */
  expand: () => void
  /** Collapse to minimum height */
  collapse: () => void
}

// Helper to convert snap points to pixels
const getSnapPointInPixels = (point: number | string, containerHeight: number): number => {
  if (typeof point === 'number') {
    return point
  }
  if (typeof point === 'string' && point.endsWith('%')) {
    const percentage = parseFloat(point) / 100
    return containerHeight * (1 - percentage)
  }
  if (point === 'auto') {
    return containerHeight * 0.5 // Default to 50%
  }
  return parseFloat(point)
}

// Main component
export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      open = false,
      onClose,
      children,
      title,
      description,
      snapPoints = ['25%', '50%', '90%'],
      defaultSnapPoint = 1,
      enableDrag = true,
      enableBackdropDismiss = true,
      backdropOpacity = 0.5,
      className,
      contentClassName,
      onSnapChange,
      showHandle = true,
      closeButton = 'icon',
      header,
      footer,
      closeOnEscape = true,
      lockBodyScroll = true,
      animationDuration = 300,
      disableAnimation = false
    },
    ref
  ) => {
    // State
    const [mounted, setMounted] = useState(false)
    const [currentSnapPoint, setCurrentSnapPoint] = useState(defaultSnapPoint)
    const [containerHeight, setContainerHeight] = useState(0)
    const [isDragging, setIsDragging] = useState(false)

    // Refs
    const sheetRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const dragConstraintsRef = useRef<HTMLDivElement>(null)

    // Motion values
    const y = useMotionValue(0)
    const opacity = useTransform(y, [0, containerHeight], [1, 0])
    const backdropOpacityTransform = useTransform(opacity, [0, 1], [0, backdropOpacity])

    // Mount portal container
    useEffect(() => {
      setMounted(true)
      return () => setMounted(false)
    }, [])

    // Handle container resize
    useEffect(() => {
      const updateContainerHeight = () => {
        setContainerHeight(window.innerHeight)
      }
      updateContainerHeight()
      window.addEventListener('resize', updateContainerHeight)
      return () => window.removeEventListener('resize', updateContainerHeight)
    }, [])

    // Lock body scroll
    useEffect(() => {
      if (!lockBodyScroll || !open) return

      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = originalStyle
      }
    }, [open, lockBodyScroll])

    // Keyboard handler
    useEffect(() => {
      if (!closeOnEscape || !open) return

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose?.()
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }, [closeOnEscape, open, onClose])

    // Focus trap
    useEffect(() => {
      if (!open || !sheetRef.current) return

      const sheet = sheetRef.current
      const focusableElements = sheet.querySelectorAll(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
      const firstFocusable = focusableElements[0] as HTMLElement
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

      // Focus first element
      firstFocusable?.focus()

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable?.focus()
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable?.focus()
          }
        }
      }

      sheet.addEventListener('keydown', handleTabKey)
      return () => sheet.removeEventListener('keydown', handleTabKey)
    }, [open])

    // Get current snap point in pixels
    const getSnapPixels = useCallback(
      (index: number) => {
        if (!containerHeight || index < 0 || index >= snapPoints.length) return 0
        return getSnapPointInPixels(snapPoints[index], containerHeight)
      },
      [snapPoints, containerHeight]
    )

    // Snap to point
    const snapTo = useCallback(
      (index: number) => {
        if (index < 0 || index >= snapPoints.length) return
        const snapY = getSnapPixels(index)
        y.set(snapY)
        setCurrentSnapPoint(index)
        onSnapChange?.(index)
      },
      [snapPoints.length, getSnapPixels, y, onSnapChange]
    )

    // Initial snap
    useEffect(() => {
      if (open && containerHeight) {
        snapTo(defaultSnapPoint)
      }
    }, [open, containerHeight, defaultSnapPoint, snapTo])

    // Handle drag end
    const handleDragEnd = useCallback(
      (_: any, info: PanInfo) => {
        const velocity = info.velocity.y
        const currentY = y.get()

        // Find closest snap point
        let closestIndex = 0
        let closestDistance = Infinity

        snapPoints.forEach((_, index) => {
          const snapY = getSnapPixels(index)
          const distance = Math.abs(currentY - snapY)
          if (distance < closestDistance) {
            closestDistance = distance
            closestIndex = index
          }
        })

        // Adjust for velocity
        if (velocity > 500 && closestIndex < snapPoints.length - 1) {
          closestIndex += 1
        } else if (velocity < -500 && closestIndex > 0) {
          closestIndex -= 1
        }

        // Check if should dismiss
        if (currentY > containerHeight * 0.8 && velocity > 0) {
          onClose?.()
        } else {
          snapTo(closestIndex)
        }

        setIsDragging(false)
      },
      [y, snapPoints, getSnapPixels, containerHeight, snapTo, onClose]
    )

    // Imperative handle
    React.useImperativeHandle(
      ref,
      () => ({
        snapTo,
        getCurrentSnapPoint: () => currentSnapPoint,
        expand: () => snapTo(0),
        collapse: () => snapTo(snapPoints.length - 1)
      }),
      [snapTo, currentSnapPoint, snapPoints.length]
    )

    // Don't render until mounted
    if (!mounted) return null

    const content = (
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: backdropOpacity }}
              exit={{ opacity: 0 }}
              transition={{ duration: disableAnimation ? 0 : animationDuration / 1000 }}
              onClick={enableBackdropDismiss ? onClose : undefined}
              className="fixed inset-0 bg-black z-[9998]"
              style={{
                opacity: enableDrag ? backdropOpacityTransform : backdropOpacity
              }}
              aria-hidden="true"
            />

            {/* Drag constraints */}
            <div
              ref={dragConstraintsRef}
              className="fixed inset-x-0 bottom-0 top-0 z-[9999] pointer-events-none"
            />

            {/* Sheet */}
            <motion.div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'bottom-sheet-title' : undefined}
              aria-describedby={description ? 'bottom-sheet-description' : undefined}
              initial={{ y: containerHeight }}
              animate={{ y: getSnapPixels(currentSnapPoint) }}
              exit={{ y: containerHeight }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 300,
                duration: disableAnimation ? 0 : undefined
              }}
              drag={enableDrag ? 'y' : false}
              dragConstraints={dragConstraintsRef}
              dragElastic={0.2}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              style={{ y }}
              className={cn(
                'fixed inset-x-0 bottom-0 z-[9999]',
                'bg-white dark:bg-gray-900',
                'rounded-t-[1.5rem]',
                'shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]',
                'max-h-screen',
                'flex flex-col',
                'pointer-events-auto',
                className
              )}
            >
              {/* Handle */}
              {showHandle && (
                <div
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full cursor-grab active:cursor-grabbing"
                  aria-hidden="true"
                />
              )}

              {/* Header */}
              <div className="flex-shrink-0 px-6 pt-6 pb-4">
                {header ? (
                  header
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {title && (
                        <h2
                          id="bottom-sheet-title"
                          className="text-xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p
                          id="bottom-sheet-description"
                          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                        >
                          {description}
                        </p>
                      )}
                    </div>
                    {closeButton !== 'none' && (
                      <button
                        onClick={onClose}
                        className={cn(
                          'flex-shrink-0 ml-4',
                          closeButton === 'icon'
                            ? 'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                            : 'px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                        )}
                        aria-label="Close"
                      >
                        {closeButton === 'icon' ? <X className="h-5 w-5" /> : 'Close'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div
                ref={contentRef}
                className={cn(
                  'flex-1 overflow-y-auto overscroll-contain',
                  'px-6 pb-6',
                  contentClassName
                )}
              >
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  {footer}
                </div>
              )}

              {/* Safe area for mobile */}
              <div className="pb-safe" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    )

    return createPortal(content, document.body)
  }
)

BottomSheet.displayName = 'BottomSheet'

// Preset configurations for common use cases
export const BottomSheetPresets = {
  fullScreen: {
    snapPoints: ['100%'],
    defaultSnapPoint: 0,
    showHandle: false
  },
  halfScreen: {
    snapPoints: ['50%', '90%'],
    defaultSnapPoint: 0
  },
  drawer: {
    snapPoints: ['25%', '75%'],
    defaultSnapPoint: 0
  },
  picker: {
    snapPoints: ['auto'],
    defaultSnapPoint: 0,
    enableBackdropDismiss: true
  }
}

// Hook for managing bottom sheet state
export function useBottomSheet(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const sheetRef = useRef<BottomSheetRef>(null)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  return {
    isOpen,
    open,
    close,
    toggle,
    sheetRef,
    sheetProps: {
      open: isOpen,
      onClose: close,
      ref: sheetRef
    }
  }
}
