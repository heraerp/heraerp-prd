import React from 'react'

interface HeraBrandMarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showScale?: boolean
  animated?: boolean
  variant?: 'full' | 'compact' | 'icon'
}

const sizeMap = {
  sm: { width: 120, height: 40, fontSize: 22, scaleSize: 0.6 },
  md: { width: 180, height: 60, fontSize: 32, scaleSize: 0.8 },
  lg: { width: 240, height: 80, fontSize: 42, scaleSize: 1.0 },
  xl: { width: 300, height: 100, fontSize: 52, scaleSize: 1.2 }
}

export function HeraBrandMark({
  className = '',
  size = 'md',
  showScale = true,
  animated = true,
  variant = 'full'
}: HeraBrandMarkProps) {
  const { width, height, fontSize, scaleSize } = sizeMap[size]

  const gradientId = `heraBrandGradient-${Math.random().toString(36).substr(2, 9)}`
  const shadowId = `brandShadow-${Math.random().toString(36).substr(2, 9)}`

  // Pentagram-inspired scale progression
  const scaleStops = ['#0F172A', '#1E40AF', '#0EA5E9', '#10B981', '#F59E0B']
  const scaleLabels = ['MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']

  if (variant === 'icon') {
    return (
      <svg width={height} height={height} viewBox={`0 0 ${height} ${height}`} className={className}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {scaleStops.map((color, i) => (
              <stop key={i} offset={`${(i * 100) / (scaleStops.length - 1)}%`} stopColor={color} />
            ))}
          </linearGradient>
        </defs>

        {/* Icon version: Just the scale visualization */}
        <g transform={`translate(${height * 0.2}, ${height * 0.3})`}>
          {scaleStops.map((color, i) => (
            <rect
              key={i}
              x={i * (height * 0.12)}
              y={height * 0.6 - i * height * 0.1}
              width={height * 0.1}
              height={(i + 1) * height * 0.1}
              fill={color}
              rx={height * 0.02}
              opacity={0.8 - i * 0.1}
              className={animated ? 'animate-pulse' : ''}
              style={{ animationDelay: animated ? `${i * 0.2}s` : undefined }}
            />
          ))}
        </g>
      </svg>
    )
  }

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
        {/* Universal scale gradient */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          {scaleStops.map((color, i) => (
            <stop key={i} offset={`${(i * 100) / (scaleStops.length - 1)}%`} stopColor={color} />
          ))}
        </linearGradient>

        {/* Enterprise-grade shadow */}
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* HERA Wordmark */}
      <text
        x={width * 0.08}
        y={height * 0.65}
        fontFamily="Inter, -apple-system, system-ui, sans-serif"
        fontSize={fontSize}
        fontWeight="800"
        fill={`url(#${gradientId})`}
        filter={`url(#${shadowId})`}
        letterSpacing="-0.04em"
      >
        HERA
      </text>

      {/* Scale Visualization */}
      {showScale && (
        <g transform={`translate(${width * 0.7}, ${height * 0.2})`}>
          {scaleStops.map((color, i) => {
            const barWidth = width * 0.015 * scaleSize
            const maxHeight = height * 0.5 * scaleSize
            const barHeight = maxHeight * (0.3 + i * 0.175)
            const x = i * (width * 0.04) * scaleSize
            const y = maxHeight - barHeight + height * 0.1

            return (
              <g key={i}>
                {/* Scale bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  rx={barWidth / 2}
                  opacity={0.9 - i * 0.15}
                  className={animated ? 'animate-pulse' : ''}
                  style={{
                    animationDelay: animated ? `${i * 0.3}s` : undefined,
                    animationDuration: animated ? '2s' : undefined
                  }}
                />

                {/* Scale label (compact version only) */}
                {variant === 'compact' && size !== 'sm' && (
                  <text
                    x={x + barWidth / 2}
                    y={maxHeight + height * 0.25}
                    fontSize={fontSize * 0.15}
                    fill="#64748B"
                    textAnchor="middle"
                    fontWeight="500"
                    fontFamily="Inter"
                  >
                    {scaleLabels[i]}
                  </text>
                )}
              </g>
            )
          })}

          {/* Connection flow */}
          {animated && (
            <path
              d={`M ${width * 0.02 * scaleSize} ${height * 0.45} ${scaleStops
                .map(
                  (_, i) =>
                    `Q ${i * width * 0.04 * scaleSize + width * 0.01} ${height * 0.35} ${i * width * 0.04 * scaleSize + width * 0.015} ${height * 0.45}`
                )
                .join(' ')}`}
              stroke={`url(#${gradientId})`}
              strokeWidth="0.5"
              fill="none"
              opacity="0.4"
              strokeDasharray="2,3"
              className="animate-pulse"
              style={{ animationDuration: '3s' }}
            />
          )}
        </g>
      )}

      {/* Foundation line */}
      <line
        x1={width * 0.08}
        y1={height * 0.85}
        x2={width * (showScale ? 0.65 : 0.85)}
        y2={height * 0.85}
        stroke={`url(#${gradientId})`}
        strokeWidth="1"
        opacity="0.25"
      />

      {/* Universal promise (full version only) */}
      {variant === 'full' && size !== 'sm' && (
        <text
          x={width * 0.08}
          y={height * 0.95}
          fontFamily="Inter"
          fontSize={fontSize * 0.18}
          fontWeight="600"
          fill="#64748B"
          letterSpacing="0.1em"
          opacity="0.7"
        >
          ONE SYSTEM • ANY SCALE • EVERY BUSINESS
        </text>
      )}
    </svg>
  )
}

export default HeraBrandMark
