import React from 'react'

interface HeraCanvaLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm: { width: 100, height: 40, strokeWidth: 8 },
  md: { width: 140, height: 56, strokeWidth: 10 },
  lg: { width: 180, height: 72, strokeWidth: 12 },
  xl: { width: 220, height: 88, strokeWidth: 14 }
}

export function HeraCanvaLogo({ className = '', size = 'lg' }: HeraCanvaLogoProps) {
  const { width, height, strokeWidth } = sizeMap[size]

  const gradientId = `heraCanva-${Math.random().toString(36).substr(2, 9)}`

  // Calculate letter dimensions
  const letterSpacing = width * 0.03
  const letterWidth = (width - letterSpacing * 3) / 4
  const letterHeight = height * 0.8
  const yOffset = (height - letterHeight) / 2

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
        {/* Canva-style gradient - purple to blue to cyan */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#8B5CF6' }} />
          <stop offset="20%" style={{ stopColor: '#7C3AED' }} />
          <stop offset="40%" style={{ stopColor: '#6366F1' }} />
          <stop offset="60%" style={{ stopColor: '#3B82F6' }} />
          <stop offset="80%" style={{ stopColor: '#0EA5E9' }} />
          <stop offset="100%" style={{ stopColor: '#06B6D4' }} />
        </linearGradient>
      </defs>

      {/* H */}
      <g transform={`translate(0, ${yOffset})`}>
        <rect x="0" y="0" width={strokeWidth} height={letterHeight} fill={`url(#${gradientId})`} />
        <rect
          x={letterWidth - strokeWidth}
          y="0"
          width={strokeWidth}
          height={letterHeight}
          fill={`url(#${gradientId})`}
        />
        <rect
          x="0"
          y={(letterHeight - strokeWidth) / 2}
          width={letterWidth}
          height={strokeWidth}
          fill={`url(#${gradientId})`}
        />
      </g>

      {/* E */}
      <g transform={`translate(${letterWidth + letterSpacing}, ${yOffset})`}>
        <rect x="0" y="0" width={strokeWidth} height={letterHeight} fill={`url(#${gradientId})`} />
        <rect x="0" y="0" width={letterWidth} height={strokeWidth} fill={`url(#${gradientId})`} />
        <rect
          x="0"
          y={(letterHeight - strokeWidth) / 2}
          width={letterWidth * 0.8}
          height={strokeWidth}
          fill={`url(#${gradientId})`}
        />
        <rect
          x="0"
          y={letterHeight - strokeWidth}
          width={letterWidth}
          height={strokeWidth}
          fill={`url(#${gradientId})`}
        />
      </g>

      {/* R */}
      <g transform={`translate(${(letterWidth + letterSpacing) * 2}, ${yOffset})`}>
        <rect x="0" y="0" width={strokeWidth} height={letterHeight} fill={`url(#${gradientId})`} />
        <rect x="0" y="0" width={letterWidth} height={strokeWidth} fill={`url(#${gradientId})`} />
        <rect
          x={letterWidth - strokeWidth}
          y="0"
          width={strokeWidth}
          height={letterHeight / 2}
          fill={`url(#${gradientId})`}
        />
        <rect
          x="0"
          y={(letterHeight - strokeWidth) / 2}
          width={letterWidth}
          height={strokeWidth}
          fill={`url(#${gradientId})`}
        />
        <path
          d={`M ${strokeWidth} ${(letterHeight + strokeWidth) / 2} L ${letterWidth} ${letterHeight}`}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="square"
        />
      </g>

      {/* A */}
      <g transform={`translate(${(letterWidth + letterSpacing) * 3}, ${yOffset})`}>
        <path
          d={`M 0 ${letterHeight} L ${letterWidth / 2} 0 L ${letterWidth} ${letterHeight}`}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />
        <rect
          x={letterWidth * 0.2}
          y={letterHeight * 0.6}
          width={letterWidth * 0.6}
          height={strokeWidth}
          fill={`url(#${gradientId})`}
        />
      </g>
    </svg>
  )
}

export default HeraCanvaLogo
