import React from 'react'

interface HeraLogoRefinedProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'light' | 'dark' | 'mono'
  concept?: 'building-blocks' | 'molecular' | 'architectural' | 'minimal'
  animated?: boolean
}

const sizeMap = {
  sm: { width: 100, height: 32, fontSize: 20 },
  md: { width: 140, height: 44, fontSize: 28 },
  lg: { width: 180, height: 56, fontSize: 36 },
  xl: { width: 220, height: 68, fontSize: 44 }
}

export function HeraLogoRefined({
  className = '',
  size = 'md',
  variant = 'default',
  concept = 'architectural',
  animated = false
}: HeraLogoRefinedProps) {
  const { width, height, fontSize } = sizeMap[size]

  const gradientId = `heraRefinedGrad-${Math.random().toString(36).substr(2, 9)}`

  const colorSchemes = {
    default: ['#0F172A', '#1E40AF', '#0EA5E9', '#10B981'],
    light: ['#475569', '#3B82F6', '#06B6D4', '#34D399'],
    dark: ['#000000', '#1E3A8A', '#0C4A6E', '#047857'],
    mono: ['#000000', '#333333', '#666666', '#999999']
  }

  const colors = colorSchemes[variant]

  const renderScaleIcon = () => {
    const iconSize = height * 0.6
    const baseX = width * 0.75
    const baseY = height * 0.2

    switch (concept) {
      case 'building-blocks':
        // Stacked cubes representing scalable architecture
        return (
          <g transform={`translate(${baseX}, ${baseY})`}>
            {/* Micro - single cube */}
            <rect
              x="0"
              y={iconSize * 0.7}
              width={iconSize * 0.15}
              height={iconSize * 0.15}
              fill={colors[0]}
              rx="1"
              opacity="0.9"
              className={animated ? 'animate-pulse' : ''}
            />

            {/* Small - 2x2 cubes */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.2s' }}>
              <rect
                x={iconSize * 0.25}
                y={iconSize * 0.55}
                width={iconSize * 0.12}
                height={iconSize * 0.12}
                fill={colors[1]}
                rx="1"
                opacity="0.8"
              />
              <rect
                x={iconSize * 0.38}
                y={iconSize * 0.55}
                width={iconSize * 0.12}
                height={iconSize * 0.12}
                fill={colors[1]}
                rx="1"
                opacity="0.8"
              />
              <rect
                x={iconSize * 0.25}
                y={iconSize * 0.68}
                width={iconSize * 0.12}
                height={iconSize * 0.12}
                fill={colors[1]}
                rx="1"
                opacity="0.7"
              />
              <rect
                x={iconSize * 0.38}
                y={iconSize * 0.68}
                width={iconSize * 0.12}
                height={iconSize * 0.12}
                fill={colors[1]}
                rx="1"
                opacity="0.7"
              />
            </g>

            {/* Medium - pyramid structure */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.4s' }}>
              <rect
                x={iconSize * 0.6}
                y={iconSize * 0.35}
                width={iconSize * 0.1}
                height={iconSize * 0.1}
                fill={colors[2]}
                rx="1"
                opacity="0.8"
              />
              <rect
                x={iconSize * 0.55}
                y={iconSize * 0.46}
                width={iconSize * 0.1}
                height={iconSize * 0.1}
                fill={colors[2]}
                rx="1"
                opacity="0.7"
              />
              <rect
                x={iconSize * 0.65}
                y={iconSize * 0.46}
                width={iconSize * 0.1}
                height={iconSize * 0.1}
                fill={colors[2]}
                rx="1"
                opacity="0.7"
              />
              <rect
                x={iconSize * 0.5}
                y={iconSize * 0.57}
                width={iconSize * 0.1}
                height={iconSize * 0.1}
                fill={colors[2]}
                rx="1"
                opacity="0.6"
              />
              <rect
                x={iconSize * 0.6}
                y={iconSize * 0.57}
                width={iconSize * 0.1}
                height={iconSize * 0.1}
                fill={colors[2]}
                rx="1"
                opacity="0.6"
              />
              <rect
                x={iconSize * 0.7}
                y={iconSize * 0.57}
                width={iconSize * 0.1}
                height={iconSize * 0.1}
                fill={colors[2]}
                rx="1"
                opacity="0.6"
              />
            </g>

            {/* Enterprise - complex grid */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.6s' }}>
              {Array.from({ length: 12 }, (_, i) => {
                const row = Math.floor(i / 4)
                const col = i % 4
                return (
                  <rect
                    key={i}
                    x={iconSize * 0.85 + col * iconSize * 0.06}
                    y={iconSize * 0.25 + row * iconSize * 0.06}
                    width={iconSize * 0.045}
                    height={iconSize * 0.045}
                    fill={colors[3]}
                    rx="0.5"
                    opacity={0.6 - row * 0.1}
                  />
                )
              })}
            </g>
          </g>
        )

      case 'molecular':
        // Molecular/network structure representing connections
        return (
          <g transform={`translate(${baseX}, ${baseY})`}>
            {/* Micro - single node */}
            <circle
              cx={iconSize * 0.1}
              cy={iconSize * 0.7}
              r={iconSize * 0.04}
              fill={colors[0]}
              opacity="0.9"
              className={animated ? 'animate-pulse' : ''}
            />

            {/* Small - connected nodes */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.2s' }}>
              <circle
                cx={iconSize * 0.3}
                cy={iconSize * 0.6}
                r={iconSize * 0.035}
                fill={colors[1]}
                opacity="0.8"
              />
              <circle
                cx={iconSize * 0.45}
                cy={iconSize * 0.7}
                r={iconSize * 0.035}
                fill={colors[1]}
                opacity="0.8"
              />
              <line
                x1={iconSize * 0.3}
                y1={iconSize * 0.6}
                x2={iconSize * 0.45}
                y2={iconSize * 0.7}
                stroke={colors[1]}
                strokeWidth="1"
                opacity="0.4"
              />
            </g>

            {/* Medium - network cluster */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.4s' }}>
              <circle
                cx={iconSize * 0.6}
                cy={iconSize * 0.4}
                r={iconSize * 0.03}
                fill={colors[2]}
                opacity="0.7"
              />
              <circle
                cx={iconSize * 0.7}
                cy={iconSize * 0.5}
                r={iconSize * 0.03}
                fill={colors[2]}
                opacity="0.7"
              />
              <circle
                cx={iconSize * 0.65}
                cy={iconSize * 0.65}
                r={iconSize * 0.03}
                fill={colors[2]}
                opacity="0.7"
              />
              <circle
                cx={iconSize * 0.55}
                cy={iconSize * 0.55}
                r={iconSize * 0.03}
                fill={colors[2]}
                opacity="0.7"
              />
              <path
                d={`M ${iconSize * 0.6} ${iconSize * 0.4} L ${iconSize * 0.7} ${iconSize * 0.5} L ${iconSize * 0.65} ${iconSize * 0.65} L ${iconSize * 0.55} ${iconSize * 0.55} Z`}
                stroke={colors[2]}
                strokeWidth="0.8"
                fill="none"
                opacity="0.3"
              />
            </g>

            {/* Enterprise - complex network */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.6s' }}>
              {Array.from({ length: 8 }, (_, i) => {
                const angle = (i * Math.PI * 2) / 8
                const centerX = iconSize * 0.9
                const centerY = iconSize * 0.5
                const radius = iconSize * 0.12
                const x = centerX + Math.cos(angle) * radius
                const y = centerY + Math.sin(angle) * radius

                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={iconSize * 0.025} fill={colors[3]} opacity="0.5" />
                    <line
                      x1={centerX}
                      y1={centerY}
                      x2={x}
                      y2={y}
                      stroke={colors[3]}
                      strokeWidth="0.5"
                      opacity="0.2"
                    />
                  </g>
                )
              })}
              <circle
                cx={iconSize * 0.9}
                cy={iconSize * 0.5}
                r={iconSize * 0.03}
                fill={colors[3]}
                opacity="0.6"
              />
            </g>
          </g>
        )

      case 'architectural':
        // Architectural progression - foundation to skyscraper
        return (
          <g transform={`translate(${baseX}, ${baseY})`}>
            {/* Micro - foundation dot */}
            <circle
              cx={iconSize * 0.05}
              cy={iconSize * 0.8}
              r={iconSize * 0.03}
              fill={colors[0]}
              opacity="0.9"
              className={animated ? 'animate-pulse' : ''}
            />

            {/* Small - house shape */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.2s' }}>
              <rect
                x={iconSize * 0.2}
                y={iconSize * 0.65}
                width={iconSize * 0.15}
                height={iconSize * 0.15}
                fill={colors[1]}
                opacity="0.8"
                rx="1"
              />
              <polygon
                points={`${iconSize * 0.2},${iconSize * 0.65} ${iconSize * 0.275},${iconSize * 0.55} ${iconSize * 0.35},${iconSize * 0.65}`}
                fill={colors[1]}
                opacity="0.7"
              />
            </g>

            {/* Medium - office building */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.4s' }}>
              <rect
                x={iconSize * 0.5}
                y={iconSize * 0.45}
                width={iconSize * 0.12}
                height={iconSize * 0.35}
                fill={colors[2]}
                opacity="0.7"
                rx="1"
              />
              {/* Windows */}
              <rect
                x={iconSize * 0.52}
                y={iconSize * 0.5}
                width={iconSize * 0.02}
                height={iconSize * 0.02}
                fill="white"
                opacity="0.8"
              />
              <rect
                x={iconSize * 0.57}
                y={iconSize * 0.5}
                width={iconSize * 0.02}
                height={iconSize * 0.02}
                fill="white"
                opacity="0.8"
              />
              <rect
                x={iconSize * 0.52}
                y={iconSize * 0.58}
                width={iconSize * 0.02}
                height={iconSize * 0.02}
                fill="white"
                opacity="0.8"
              />
              <rect
                x={iconSize * 0.57}
                y={iconSize * 0.58}
                width={iconSize * 0.02}
                height={iconSize * 0.02}
                fill="white"
                opacity="0.8"
              />
            </g>

            {/* Enterprise - skyscraper */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.6s' }}>
              <rect
                x={iconSize * 0.8}
                y={iconSize * 0.15}
                width={iconSize * 0.1}
                height={iconSize * 0.65}
                fill={colors[3]}
                opacity="0.6"
                rx="1"
              />
              {/* Multiple floors */}
              {Array.from({ length: 6 }, (_, i) => (
                <g key={i}>
                  <rect
                    x={iconSize * 0.82}
                    y={iconSize * 0.2 + i * iconSize * 0.08}
                    width={iconSize * 0.015}
                    height={iconSize * 0.015}
                    fill="white"
                    opacity="0.7"
                  />
                  <rect
                    x={iconSize * 0.855}
                    y={iconSize * 0.2 + i * iconSize * 0.08}
                    width={iconSize * 0.015}
                    height={iconSize * 0.015}
                    fill="white"
                    opacity="0.7"
                  />
                </g>
              ))}
            </g>
          </g>
        )

      case 'minimal':
        // Minimal geometric progression
        return (
          <g transform={`translate(${baseX}, ${baseY})`}>
            {/* Simple geometric progression without WiFi similarity */}
            <circle
              cx={iconSize * 0.1}
              cy={iconSize * 0.7}
              r={iconSize * 0.025}
              fill={colors[0]}
              opacity="0.9"
              className={animated ? 'animate-pulse' : ''}
            />

            <rect
              x={iconSize * 0.3}
              y={iconSize * 0.65}
              width={iconSize * 0.08}
              height={iconSize * 0.08}
              fill={colors[1]}
              opacity="0.8"
              rx="1"
              className={animated ? 'animate-pulse' : ''}
              style={{ animationDelay: '0.2s' }}
            />

            <polygon
              points={`${iconSize * 0.55},${iconSize * 0.75} ${iconSize * 0.62},${iconSize * 0.55} ${iconSize * 0.69},${iconSize * 0.75}`}
              fill={colors[2]}
              opacity="0.7"
              className={animated ? 'animate-pulse' : ''}
              style={{ animationDelay: '0.4s' }}
            />

            <rect
              x={iconSize * 0.85}
              y={iconSize * 0.45}
              width={iconSize * 0.06}
              height={iconSize * 0.3}
              fill={colors[3]}
              opacity="0.6"
              rx="2"
              className={animated ? 'animate-pulse' : ''}
              style={{ animationDelay: '0.6s' }}
            />
          </g>
        )
    }
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
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          {colors.map((color, i) => (
            <stop key={i} offset={`${(i * 100) / (colors.length - 1)}%`} stopColor={color} />
          ))}
        </linearGradient>
      </defs>

      {/* HERA Text */}
      <text
        x="0"
        y={height * 0.65}
        fontFamily="Inter, -apple-system, system-ui, sans-serif"
        fontSize={fontSize}
        fontWeight="800"
        fill={variant === 'mono' ? colors[0] : `url(#${gradientId})`}
        letterSpacing="-0.03em"
      >
        HERA
      </text>

      {/* Scale Icon */}
      {renderScaleIcon()}

      {/* Baseline */}
      <line
        x1="0"
        y1={height * 0.85}
        x2={width * 0.7}
        y2={height * 0.85}
        stroke={variant === 'mono' ? colors[1] : `url(#${gradientId})`}
        strokeWidth="0.5"
        opacity="0.3"
      />
    </svg>
  )
}

export default HeraLogoRefined
