'use client'

/**
 * WaveBackground Component
 *
 * A theme-aware SVG wave background that automatically adapts to light/dark mode
 * Uses CSS variables for colors so transitions are smooth and instant
 * GPU-optimized with no layout thrashing
 */

export default function WaveBackground({
  className = '',
  height = 520,
  position = 'top',
  blur = true
}: {
  className?: string
  height?: number
  position?: 'top' | 'bottom'
  blur?: boolean
}) {
  const positionClass =
    position === 'bottom' ? 'absolute inset-x-0 bottom-0' : 'absolute inset-x-0 -top-10'

  const blurClass = blur ? 'blur-2xl' : ''

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none ${positionClass} ${className}`}
      style={{ height }}
    >
      <svg
        fill="none"
        stroke="currentColor"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
        className={`h-full w-full ${blurClass}`}
      >
        <defs>
          {/* Gradient 1: wave-1 to wave-2 diagonal blend */}
          <linearGradient id="waveGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--wave-1)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="var(--wave-2)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--wave-2)" stopOpacity="0.7" />
          </linearGradient>

          {/* Gradient 2: wave-2 to wave-3 opposite diagonal */}
          <linearGradient id="waveGrad2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--wave-2)" stopOpacity="0.7" />
            <stop offset="50%" stopColor="var(--wave-3)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--wave-3)" stopOpacity="0.6" />
          </linearGradient>

          {/* Gradient 3: wave-1 to wave-3 vertical blend for highlights */}
          <linearGradient id="waveGrad3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--wave-1)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--wave-3)" stopOpacity="0.2" />
          </linearGradient>

          {/* Radial mask for edge fading */}
          <radialGradient id="fadeMask" cx="50%" cy="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {/* Base layer - largest wave */}
        <path
          d="M0,200 C240,120 360,280 600,220 C840,160 960,260 1200,200 C1320,168 1380,140 1440,120 L1440,600 L0,600 Z"
          fill="currentColor"
          opacity="0.9"
        />

        {/* Middle layer - offset wave for depth */}
        <path
          d="M0,260 C200,200 420,340 720,280 C960,230 1120,310 1440,260 L1440,600 L0,600 Z"
          fill="currentColor"
          opacity="0.85"
        />

        {/* Top layer - subtle highlight wave */}
        <path
          d="M0,160 C160,120 320,120 520,170 C760,230 1040,110 1440,180 L1440,600 L0,600 Z"
          fill="currentColor"
          opacity="0.35"
        />

        {/* Optional accent wave for more variation */}
        <path
          d="M0,320 C300,280 500,360 800,320 C1100,280 1300,340 1440,320 L1440,600 L0,600 Z"
          fill="currentColor"
          opacity="0.15"
        />
      </svg>
    </div>
  )
}
