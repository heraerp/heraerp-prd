import React from 'react'

interface HeraAnimatedLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm: { width: 100, height: 36, fontSize: 24 },
  md: { width: 140, height: 50, fontSize: 34 },
  lg: { width: 180, height: 64, fontSize: 44 },
  xl: { width: 220, height: 78, fontSize: 54 }
}

export function HeraAnimatedLogo({ className = '', size = 'lg' }: HeraAnimatedLogoProps) {
  const { width, height, fontSize } = sizeMap[size]

  const gradientId = `heraAnimatedGradient-${Math.random().toString(36).substr(2, 9)}`
  const glowId = `heraGlow-${Math.random().toString(36).substr(2, 9)}`
  const waveId = `heraWave-${Math.random().toString(36).substr(2, 9)}`

  return (
    <svg
      stroke="currentColor"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Animated gradient wave */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#7c3aed' }}>
            <animate
              attributeName="stop-color"
              values="#7c3aed;#a855f7;#06b6d4;#7dd3fc;#a855f7;#7c3aed"
              dur="12s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="33%" style={{ stopColor: '#a855f7' }}>
            <animate
              attributeName="stop-color"
              values="#a855f7;#06b6d4;#7dd3fc;#7c3aed;#7c3aed;#a855f7"
              dur="12s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="66%" style={{ stopColor: '#06b6d4' }}>
            <animate
              attributeName="stop-color"
              values="#06b6d4;#7dd3fc;#7c3aed;#a855f7;#06b6d4;#06b6d4"
              dur="12s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" style={{ stopColor: '#7dd3fc' }}>
            <animate
              attributeName="stop-color"
              values="#7dd3fc;#7c3aed;#a855f7;#06b6d4;#7dd3fc;#7dd3fc"
              dur="12s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        {/* Animated wave gradient for text effect */}
        <linearGradient id={waveId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
          <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.3 }}>
            <animate attributeName="offset" values="0;1;0" dur="6s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
        </linearGradient>

        {/* Glow filter */}
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur">
            <animate
              attributeName="stdDeviation"
              values="2;3;2"
              dur="4s"
              repeatCount="indefinite"
            />
          </feGaussianBlur>
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft shadow */}
        <filter id="softShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feFlood floodColor="#000000" floodOpacity="0.1" />
          <feComposite in2="offsetblur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Animated background */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx={height * 0.15}
        fill="currentColor"
        fillOpacity="0.95"
      />

      {/* Animated glowing border */}
      <rect
        x="2"
        y="2"
        width={width - 4}
        height={height - 4}
        rx={height * 0.15}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        filter={`url(#${glowId})`}
        opacity="0.8"
      >
        <animate attributeName="stroke-width" values="2;2.5;2" dur="4s" repeatCount="indefinite" />
      </rect>

      {/* Main text with gradient */}
      <text
        x="50%"
        y="50%"
        fontFamily="'Montserrat', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize={fontSize}
        fontWeight="800"
        fill={`url(#${gradientId})`}
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing="0.08em"
        filter="url(#softShadow)"
      >
        HERA
      </text>

      {/* Wave overlay effect */}
      <text
        x="50%"
        y="50%"
        fontFamily="'Montserrat', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize={fontSize}
        fontWeight="800"
        fill={`url(#${waveId})`}
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing="0.08em"
        opacity="0.6"
      >
        HERA
      </text>

      {/* Animated decorative dots */}
      <circle cx={width - 15} cy="15" r="4" fill={`url(#${gradientId})`}>
        <animate attributeName="r" values="3;5;3" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0.4;0.8" dur="4s" repeatCount="indefinite" />
      </circle>

      <circle cx="15" cy={height - 15} r="3" fill={`url(#${gradientId})`}>
        <animate attributeName="r" values="2;4;2" dur="4s" begin="2s" repeatCount="indefinite" />
        <animate
          attributeName="opacity"
          values="0.8;0.4;0.8"
          dur="4s"
          begin="2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Subtle line decoration with animation */}
      <line
        x1="10"
        y1={height - 10}
        x2="30"
        y2={height - 10}
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      >
        <animate attributeName="x2" values="30;40;30" dur="6s" repeatCount="indefinite" />
      </line>
    </svg>
  )
}

export default HeraAnimatedLogo
