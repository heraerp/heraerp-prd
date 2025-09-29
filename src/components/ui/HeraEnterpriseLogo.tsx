import React from 'react'

interface HeraEnterpriseLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'text'
  theme?: 'gradient' | 'solid' | 'outline'
}

const sizeMap = {
  sm: { width: 140, height: 48, fontSize: 24, iconSize: 32 },
  md: { width: 180, height: 60, fontSize: 32, iconSize: 40 },
  lg: { width: 220, height: 72, fontSize: 38, iconSize: 48 },
  xl: { width: 280, height: 88, fontSize: 46, iconSize: 56 }
}

export function HeraEnterpriseLogo({
  className = '',
  size = 'lg',
  variant = 'full',
  theme = 'gradient'
}: HeraEnterpriseLogoProps) {
  const { width, height, fontSize, iconSize } = sizeMap[size]

  const gradientId = `heraEnterpriseGrad-${Math.random().toString(36).substr(2, 9)}`
  const meshId = `heraEnterpriseMesh-${Math.random().toString(36).substr(2, 9)}`

  // Adjust width for icon-only variant
  const actualWidth = variant === 'icon' ? iconSize + 16 : width

  return (
    <svg stroke="currentColor"
      width={actualWidth}
      height={height}
      viewBox={`0 0 ${actualWidth} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* SAP-competitive gradient */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#5046e5' }} />
          <stop offset="33%" style={{ stopColor: '#7c3aed' }} />
          <stop offset="66%" style={{ stopColor: '#a855f7' }} />
          <stop offset="100%" style={{ stopColor: '#6366f1' }} />
        </linearGradient>

        {/* Mesh gradient for modern depth */}
        <radialGradient id={meshId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 0 }} />
        </radialGradient>

        {/* Professional shadow */}
        <filter id="enterpriseShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
        </filter>

        {/* Inner shadow for depth */}
        <filter id="innerShadow">
          <feOffset dx="0" dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feComposite operator="out" in="SourceGraphic" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
        </filter>
      </defs>

      {/* Icon Section - Always visible */}
      {(variant === 'full' || variant === 'icon') && (
        <g transform={`translate(8, ${(height - iconSize) / 2})`}>
          {/* Background circle with gradient */}
          <circle
            cx={iconSize / 2}
            cy={iconSize / 2}
            r={iconSize / 2}
            fill={theme === 'gradient' ? `url(#${gradientId})` : '#5046e5'}
            filter="url(#enterpriseShadow)"
          />

          {/* Mesh overlay for depth */}
          <circle cx={iconSize / 2} cy={iconSize / 2} r={iconSize / 2} fill={`url(#${meshId})`} />

          {/* HERA Symbol - Abstract H with data nodes */}
          <g transform={`translate(${iconSize * 0.2}, ${iconSize * 0.2})`}>
            {/* Main H structure */}
            <path
              d={`
                M 0 0
                L 0 ${iconSize * 0.6}
                M ${iconSize * 0.6} 0
                L ${iconSize * 0.6} ${iconSize * 0.6}
                M 0 ${iconSize * 0.3}
                L ${iconSize * 0.6} ${iconSize * 0.3}
              `}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            {/* Data nodes representing universal architecture */}
            <circle cx="0" cy="0" r="4" fill="currentColor" />
            <circle cx={iconSize * 0.6} cy="0" r="4" fill="currentColor" />
            <circle cx="0" cy={iconSize * 0.6} r="4" fill="currentColor" />
            <circle cx={iconSize * 0.6} cy={iconSize * 0.6} r="4" fill="currentColor" />
            <circle cx={iconSize * 0.3} cy={iconSize * 0.3} r="5" fill="currentColor" opacity="0.9" />

            {/* Connecting lines for network effect */}
            <line
              x1="0"
              y1="0"
              x2={iconSize * 0.3}
              y2={iconSize * 0.3}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.4"
            />
            <line
              x1={iconSize * 0.6}
              y1="0"
              x2={iconSize * 0.3}
              y2={iconSize * 0.3}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.4"
            />
            <line
              x1="0"
              y1={iconSize * 0.6}
              x2={iconSize * 0.3}
              y2={iconSize * 0.3}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.4"
            />
            <line
              x1={iconSize * 0.6}
              y1={iconSize * 0.6}
              x2={iconSize * 0.3}
              y2={iconSize * 0.3}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.4"
            />
          </g>
        </g>
      )}

      {/* Text Section */}
      {(variant === 'full' || variant === 'text') && (
        <g transform={variant === 'text' ? 'translate(0, 0)' : `translate(${iconSize + 24}, 0)`}>
          {/* Main HERA text */}
          <text
            x="0"
            y={height * 0.45}
            fontFamily="'Inter', -apple-system, sans-serif"
            fontSize={fontSize}
            fontWeight="800"
            fill={theme === 'gradient' ? `url(#${gradientId})` : '#5046e5'}
            letterSpacing="-0.03em"
          >
            HERA
          </text>

          {/* Subtitle for larger sizes */}
          {(size === 'lg' || size === 'xl') && (
            <text
              x="0"
              y={height * 0.7}
              fontFamily="'Inter', -apple-system, sans-serif"
              fontSize={fontSize * 0.35}
              fontWeight="500"
              fill="currentColor"
              letterSpacing="0.08em"
            >
              UNIVERSAL ERP
            </text>
          )}

          {/* Version indicator */}
          <text
            x={fontSize * 3.5}
            y={height * 0.35}
            fontFamily="'Inter', -apple-system, sans-serif"
            fontSize={fontSize * 0.25}
            fontWeight="600"
            fill="currentColor"
            opacity="0.8"
          >
            ™
          </text>
        </g>
      )}

      {/* Accent line for full variant */}
      {variant === 'full' && size !== 'sm' && (
        <rect
          x={iconSize + 24}
          y={height * 0.85}
          width={width - iconSize - 32}
          height="2"
          fill={theme === 'gradient' ? `url(#${gradientId})` : '#5046e5'}
          opacity="0.2"
          rx="1"
        />
      )}
    </svg>
  )
}

export default HeraEnterpriseLogo
