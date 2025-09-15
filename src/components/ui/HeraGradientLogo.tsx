import React from 'react'

interface HeraGradientLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm: { width: 120, height: 48, fontSize: 36 },
  md: { width: 160, height: 64, fontSize: 48 },
  lg: { width: 200, height: 80, fontSize: 60 },
  xl: { width: 240, height: 96, fontSize: 72 }
}

export function HeraGradientLogo({ className = '', size = 'lg' }: HeraGradientLogoProps) {
  const { width, height, fontSize } = sizeMap[size]

  const gradientId = `heraGradient-${Math.random().toString(36).substr(2, 9)}`

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
        {/* Purple to cyan gradient matching the Canva logo */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#7C3AED' }} />
          <stop offset="25%" style={{ stopColor: '#6366F1' }} />
          <stop offset="50%" style={{ stopColor: '#3B82F6' }} />
          <stop offset="75%" style={{ stopColor: '#0EA5E9' }} />
          <stop offset="100%" style={{ stopColor: '#06B6D4' }} />
        </linearGradient>
      </defs>

      {/* HERA text with bold letterforms */}
      <text
        x="50%"
        y="50%"
        fontFamily="'Inter', -apple-system, sans-serif"
        fontSize={fontSize}
        fontWeight="900"
        fill={`url(#${gradientId})`}
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing="-0.02em"
      >
        HERA
      </text>
    </svg>
  )
}

// Alternative version with individual letter control for perfect gradient
export function HeraGradientLogoAdvanced({ className = '', size = 'lg' }: HeraGradientLogoProps) {
  const { width, height } = sizeMap[size]
  const letterWidth = width / 4.5
  const letterHeight = height * 0.7

  const gradientId = `heraAdvGradient-${Math.random().toString(36).substr(2, 9)}`

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
        {/* Smooth gradient from purple through blue to cyan */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#7C3AED' }} />
          <stop offset="20%" style={{ stopColor: '#6D28D9' }} />
          <stop offset="40%" style={{ stopColor: '#4C1D95' }} />
          <stop offset="50%" style={{ stopColor: '#3730A3' }} />
          <stop offset="60%" style={{ stopColor: '#3B82F6' }} />
          <stop offset="80%" style={{ stopColor: '#0EA5E9' }} />
          <stop offset="100%" style={{ stopColor: '#06B6D4' }} />
        </linearGradient>
      </defs>

      <g>
        {/* H */}
        <path
          d={`
            M ${letterWidth * 0.2} ${height * 0.15}
            L ${letterWidth * 0.2} ${height * 0.85}
            L ${letterWidth * 0.4} ${height * 0.85}
            L ${letterWidth * 0.4} ${height * 0.55}
            L ${letterWidth * 0.6} ${height * 0.55}
            L ${letterWidth * 0.6} ${height * 0.85}
            L ${letterWidth * 0.8} ${height * 0.85}
            L ${letterWidth * 0.8} ${height * 0.15}
            L ${letterWidth * 0.6} ${height * 0.15}
            L ${letterWidth * 0.6} ${height * 0.4}
            L ${letterWidth * 0.4} ${height * 0.4}
            L ${letterWidth * 0.4} ${height * 0.15}
            Z
          `}
          fill={`url(#${gradientId})`}
        />

        {/* E */}
        <path
          d={`
            M ${letterWidth * 1.1} ${height * 0.15}
            L ${letterWidth * 1.1} ${height * 0.85}
            L ${letterWidth * 1.8} ${height * 0.85}
            L ${letterWidth * 1.8} ${height * 0.7}
            L ${letterWidth * 1.3} ${height * 0.7}
            L ${letterWidth * 1.3} ${height * 0.55}
            L ${letterWidth * 1.7} ${height * 0.55}
            L ${letterWidth * 1.7} ${height * 0.4}
            L ${letterWidth * 1.3} ${height * 0.4}
            L ${letterWidth * 1.3} ${height * 0.3}
            L ${letterWidth * 1.8} ${height * 0.3}
            L ${letterWidth * 1.8} ${height * 0.15}
            Z
          `}
          fill={`url(#${gradientId})`}
        />

        {/* R */}
        <path
          d={`
            M ${letterWidth * 2.0} ${height * 0.15}
            L ${letterWidth * 2.0} ${height * 0.85}
            L ${letterWidth * 2.2} ${height * 0.85}
            L ${letterWidth * 2.2} ${height * 0.55}
            L ${letterWidth * 2.3} ${height * 0.55}
            L ${letterWidth * 2.6} ${height * 0.85}
            L ${letterWidth * 2.85} ${height * 0.85}
            L ${letterWidth * 2.5} ${height * 0.5}
            Q ${letterWidth * 2.7} ${height * 0.45} ${letterWidth * 2.7} ${height * 0.32}
            Q ${letterWidth * 2.7} ${height * 0.15} ${letterWidth * 2.45} ${height * 0.15}
            L ${letterWidth * 2.0} ${height * 0.15}
            Z
            M ${letterWidth * 2.2} ${height * 0.3}
            L ${letterWidth * 2.45} ${height * 0.3}
            Q ${letterWidth * 2.55} ${height * 0.3} ${letterWidth * 2.55} ${height * 0.35}
            Q ${letterWidth * 2.55} ${height * 0.4} ${letterWidth * 2.45} ${height * 0.4}
            L ${letterWidth * 2.2} ${height * 0.4}
            Z
          `}
          fill={`url(#${gradientId})`}
        />

        {/* A */}
        <path
          d={`
            M ${letterWidth * 2.9} ${height * 0.85}
            L ${letterWidth * 3.2} ${height * 0.15}
            L ${letterWidth * 3.4} ${height * 0.15}
            L ${letterWidth * 3.7} ${height * 0.85}
            L ${letterWidth * 3.5} ${height * 0.85}
            L ${letterWidth * 3.45} ${height * 0.65}
            L ${letterWidth * 3.15} ${height * 0.65}
            L ${letterWidth * 3.1} ${height * 0.85}
            Z
            M ${letterWidth * 3.2} ${height * 0.5}
            L ${letterWidth * 3.4} ${height * 0.5}
            L ${letterWidth * 3.3} ${height * 0.3}
            Z
          `}
          fill={`url(#${gradientId})`}
        />
      </g>
    </svg>
  )
}

export default HeraGradientLogo
