import React from 'react'

interface HeraLogoHexagonalProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'light' | 'dark' | 'mono'
  animated?: boolean
}

const sizeMap = {
  sm: { width: 100, height: 32, fontSize: 20 },
  md: { width: 140, height: 44, fontSize: 28 },
  lg: { width: 180, height: 56, fontSize: 36 },
  xl: { width: 220, height: 68, fontSize: 44 }
}

export function HeraLogoHexagonal({
  className = '',
  size = 'md',
  variant = 'default',
  animated = false
}: HeraLogoHexagonalProps) {
  const { width, height, fontSize } = sizeMap[size]

  const gradientId = `heraHexGrad-${Math.random().toString(36).substr(2, 9)}`

  const colorSchemes = {
    default: ['#0F172A', '#1E40AF', '#0EA5E9', '#10B981'],
    light: ['#475569', '#3B82F6', '#06B6D4', '#34D399'],
    dark: ['#000000', '#1E3A8A', '#0C4A6E', '#047857'],
    mono: ['#000000', '#333333', '#666666', '#999999']
  }

  const colors = colorSchemes[variant]

  // Hexagon path generator
  const createHexagon = (cx: number, cy: number, radius: number) => {
    const points = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      points.push(`${x},${y}`)
    }
    return `M ${points.join(' L ')} Z`
  }

  const iconSize = height * 0.6
  const baseX = width * 0.75
  const baseY = height * 0.3
  const hexRadius = iconSize * 0.08

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

      {/* Hexagonal Growth Pattern */}
      <g transform={`translate(${baseX}, ${baseY})`}>
        {/* Micro - Single hexagon */}
        <path
          d={createHexagon(0, iconSize * 0.6, hexRadius * 0.6)}
          fill={colors[0]}
          opacity="0.9"
          className={animated ? 'animate-pulse' : ''}
        />

        {/* Small - 2 connected hexagons */}
        <g className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.3s' }}>
          <path
            d={createHexagon(iconSize * 0.25, iconSize * 0.5, hexRadius * 0.7)}
            fill={colors[1]}
            opacity="0.8"
          />
          <path
            d={createHexagon(iconSize * 0.35, iconSize * 0.65, hexRadius * 0.7)}
            fill={colors[1]}
            opacity="0.7"
          />
        </g>

        {/* Medium - Honeycomb cluster (7 hexagons) */}
        <g className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.6s' }}>
          {/* Center hexagon */}
          <path
            d={createHexagon(iconSize * 0.6, iconSize * 0.5, hexRadius * 0.5)}
            fill={colors[2]}
            opacity="0.7"
          />
          {/* Surrounding hexagons */}
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (Math.PI / 3) * i
            const distance = hexRadius * 0.9
            const x = iconSize * 0.6 + distance * Math.cos(angle)
            const y = iconSize * 0.5 + distance * Math.sin(angle)

            return (
              <path
                key={i}
                d={createHexagon(x, y, hexRadius * 0.4)}
                fill={colors[2]}
                opacity={0.6 - i * 0.05}
              />
            )
          })}
        </g>

        {/* Enterprise - Large organized grid */}
        <g className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.9s' }}>
          {Array.from({ length: 19 }, (_, i) => {
            // Hexagonal grid pattern
            const row = Math.floor(i / 5)
            const col = i % 5
            const offsetX = row % 2 === 1 ? hexRadius * 0.4 : 0
            const x = iconSize * 0.85 + col * hexRadius * 0.7 + offsetX
            const y = iconSize * 0.2 + row * hexRadius * 0.6

            if (x > iconSize * 1.4) return null // Don't exceed bounds

            return (
              <path
                key={i}
                d={createHexagon(x, y, hexRadius * 0.25)}
                fill={colors[3]}
                opacity={0.5 - row * 0.08}
              />
            )
          })}
        </g>
      </g>

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

export default HeraLogoHexagonal
