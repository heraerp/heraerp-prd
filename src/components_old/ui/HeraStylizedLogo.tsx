import React from 'react'

interface HeraStylizedLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm: { width: 100, height: 36, fontSize: 24 },
  md: { width: 140, height: 50, fontSize: 34 },
  lg: { width: 180, height: 64, fontSize: 44 },
  xl: { width: 220, height: 78, fontSize: 54 }
}

export function HeraStylizedLogo({ className = '', size = 'lg' }: HeraStylizedLogoProps) {
  const { width, height, fontSize } = sizeMap[size]

  const gradientId = `heraStylizedGradient-${Math.random().toString(36).substr(2, 9)}`
  const maskId = `heraMask-${Math.random().toString(36).substr(2, 9)}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Canva-inspired gradient with stronger colors */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#7c3aed' }} />
          <stop offset="50%" style={{ stopColor: '#a855f7' }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4' }} />
        </linearGradient>

        {/* Text mask for effects */}
        <mask id={maskId}>
          <text
            x="50%"
            y="50%"
            fontFamily="'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            fontSize={fontSize}
            fontWeight="900"
            fill="white"
            textAnchor="middle"
            dominantBaseline="middle"
            letterSpacing="0.08em"
          >
            HERA
          </text>
        </mask>

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

      {/* White background for contrast */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx={height * 0.15}
        fill="white"
        fillOpacity="0.95"
      />

      {/* Border */}
      <rect
        x="2"
        y="2"
        width={width - 4}
        height={height - 4}
        rx={height * 0.15}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        opacity="0.3"
      />

      {/* Main text with gradient */}
      <text
        x="50%"
        y="50%"
        fontFamily="'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize={fontSize}
        fontWeight="900"
        fill={`url(#${gradientId})`}
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing="0.08em"
        filter="url(#softShadow)"
      >
        HERA
      </text>

      {/* Decorative dot */}
      <circle cx={width - 15} cy="15" r="4" fill={`url(#${gradientId})`} opacity="0.8" />

      {/* Subtle line decoration */}
      <line
        x1="10"
        y1={height - 10}
        x2="30"
        y2={height - 10}
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  )
}

export default HeraStylizedLogo
