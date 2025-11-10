import { useState, useEffect } from 'react'

interface MousePosition {
  x: number
  y: number
}

/**
 * useMousePosition Hook
 *
 * Tracks mouse position across the viewport and returns normalized coordinates (0-100%)
 * Optimized with throttling to prevent excessive re-renders
 *
 * @param throttleMs - Milliseconds to throttle updates (default: 50ms for 20fps)
 * @returns Object with x,y coordinates as percentages (0-100)
 *
 * @example
 * const { x, y } = useMousePosition()
 * // Use in transform: `translate(${x * 0.02}px, ${y * 0.02}px)`
 */
export function useMousePosition(throttleMs: number = 50): MousePosition {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 50, y: 50 })

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    let lastUpdate = 0

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()

      // Throttle updates for performance
      if (now - lastUpdate < throttleMs) {
        // Schedule update for later
        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            updatePosition(e)
            timeoutId = null
          }, throttleMs - (now - lastUpdate))
        }
        return
      }

      updatePosition(e)
      lastUpdate = now
    }

    const updatePosition = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }

    // Add event listener
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [throttleMs])

  return mousePosition
}

/**
 * useMousePositionSmooth Hook
 *
 * Similar to useMousePosition but with easing for smoother movement
 * Best for large, slow-moving gradient orbs
 *
 * @param easing - Easing factor (0-1, default: 0.1 for smooth follow)
 * @returns Object with x,y coordinates as percentages (0-100)
 */
export function useMousePositionSmooth(easing: number = 0.1): MousePosition {
  const [targetPosition, setTargetPosition] = useState<MousePosition>({ x: 50, y: 50 })
  const [currentPosition, setCurrentPosition] = useState<MousePosition>({ x: 50, y: 50 })

  // Track mouse position (raw)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setTargetPosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Smooth follow with easing
  useEffect(() => {
    let animationFrameId: number

    const updatePosition = () => {
      setCurrentPosition(prev => ({
        x: prev.x + (targetPosition.x - prev.x) * easing,
        y: prev.y + (targetPosition.y - prev.y) * easing,
      }))

      animationFrameId = requestAnimationFrame(updatePosition)
    }

    animationFrameId = requestAnimationFrame(updatePosition)

    return () => cancelAnimationFrame(animationFrameId)
  }, [targetPosition, easing])

  return currentPosition
}
