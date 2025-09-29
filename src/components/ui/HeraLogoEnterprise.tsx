import React from 'react'

interface HeraLogoEnterpriseProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'light' | 'dark' | 'enterprise'
  animated?: boolean
}

const sizeMap = {
  sm: { width: 100, height: 32, fontSize: 20 },
  md: { width: 140, height: 44, fontSize: 28 },
  lg: { width: 180, height: 56, fontSize: 36 },
  xl: { width: 220, height: 68, fontSize: 44 }
}

export function HeraLogoEnterprise({
  className = '',
  size = 'md',
  variant = 'default',
  animated = false
}: HeraLogoEnterpriseProps) {
  const { width, height, fontSize } = sizeMap[size]

  const gradientId = `heraEnterpriseGradient-${Math.random().toString(36).substr(2, 9)}`
  const glowId = `enterpriseGlow-${Math.random().toString(36).substr(2, 9)}`

  const gradientStops = {
    default: ['#0F172A', '#1E40AF', '#0EA5E9', '#10B981'],
    light: ['#475569', '#3B82F6', '#06B6D4', '#34D399'],
    dark: ['#000000', '#1E3A8A', '#0C4A6E', '#047857'],
    enterprise: ['#1E293B', '#3730A3', '#0369A1', '#059669']
  }

  const stops = gradientStops[variant]

  return (
    <svg stroke="currentColor"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Multi-stop gradient representing scale */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: stops[0] }} />
          <stop offset="33%" style={{ stopColor: stops[1] }} />
          <stop offset="66%" style={{ stopColor: stops[2] }} />
          <stop offset="100%" style={{ stopColor: stops[3] }} />
        </linearGradient>

        {/* Enterprise glow */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Scaling pattern mask */}
        <mask id="scaleMask">
          <rect width="100%" height="100%" fill="currentColor" />
        </mask>
      </defs>

      {/* HERA Text with enhanced typography */}
      <text
        x="0"
        y={height * 0.65}
        fontFamily="Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize={fontSize}
        fontWeight="800"
        fill={`url(#${gradientId})`}
        filter={`url(#${glowId})`}
        letterSpacing="-0.03em"
      >
        HERA
      </text>

      {/* Scalability Icon: Growing geometric progression */}
      <g transform={`translate(${width * 0.78}, ${height * 0.15})`}>
        {/* Micro business - single dot */}
        <circle
          cx={0}
          cy={height * 0.65}
          r={width * 0.008}
          fill={stops[0]}
          opacity="0.9"
          className={animated ? 'animate-pulse' : ''}
        />

        {/* Small business - small bar */}
        <rect
          x={width * 0.025}
          y={height * 0.55}
          width={width * 0.012}
          height={height * 0.2}
          fill={stops[1]}
          rx={width * 0.006}
          opacity="0.8"
          className={animated ? 'animate-pulse' : ''}
          style={{ animationDelay: animated ? '0.2s' : undefined }}
        />

        {/* Medium business - medium bar */}
        <rect
          x={width * 0.055}
          y={height * 0.4}
          width={width * 0.016}
          height={height * 0.35}
          fill={stops[2]}
          rx={width * 0.008}
          opacity="0.7"
          className={animated ? 'animate-pulse' : ''}
          style={{ animationDelay: animated ? '0.4s' : undefined }}
        />

        {/* Large enterprise - tall bar */}
        <rect
          x={width * 0.09}
          y={height * 0.15}
          width={width * 0.02}
          height={height * 0.6}
          fill={stops[3]}
          rx={width * 0.01}
          opacity="0.6"
          className={animated ? 'animate-pulse' : ''}
          style={{ animationDelay: animated ? '0.6s' : undefined }}
        />

        {/* Connection lines showing scalability */}
        <path
          d={`M ${width * 0.008} ${height * 0.65} Q ${width * 0.031} ${height * 0.6} ${width * 0.031} ${height * 0.65} Q ${width * 0.063} ${height * 0.52} ${width * 0.063} ${height * 0.575} Q ${width * 0.1} ${height * 0.35} ${width * 0.1} ${height * 0.45}`}
          stroke={`url(#${gradientId})`}
          strokeWidth="0.5"
          strokeOpacity="0.3"
          fill="none"
          strokeDasharray="2,2"
          className={animated ? 'animate-pulse' : ''}
          style={{ animationDelay: animated ? '0.8s' : undefined }}
        />
      </g>

      {/* Subtle baseline showing foundation */}
      <line
        x1="0"
        y1={height * 0.88}
        x2={width * 0.75}
        y2={height * 0.88}
        stroke={`url(#${gradientId})`}
        strokeWidth="0.8"
        opacity="0.2"
      />

      {/* Enterprise indicator - subtle */}
      <text
        x={width * 0.78}
        y={height * 0.95}
        fontFamily="Inter, system-ui, sans-serif"
        fontSize={fontSize * 0.2}
        fontWeight="500"
        fill={stops[2]}
        opacity="0.6"
        letterSpacing="0.1em"
      >
        UNIVERSAL
      </text>
    </svg>
  )
}

export default HeraLogoEnterprise
