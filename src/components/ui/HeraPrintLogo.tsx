import React from 'react'

interface HeraPrintLogoProps {
  className?: string
  size?: 'business-card' | 'letterhead' | 'poster' | 'billboard'
  variant?: 'mono' | 'color' | 'reversed'
  format?: 'horizontal' | 'vertical' | 'stacked'
}

const sizeMap = {
  'business-card': { width: 120, height: 32, fontSize: 24, scale: 0.6 },
  'letterhead': { width: 180, height: 48, fontSize: 36, scale: 0.8 },
  'poster': { width: 240, height: 64, fontSize: 48, scale: 1.0 },
  'billboard': { width: 360, height: 96, fontSize: 72, scale: 1.5 }
}

export function HeraPrintLogo({ 
  className = '', 
  size = 'letterhead',
  variant = 'color',
  format = 'horizontal'
}: HeraPrintLogoProps) {
  const { width, height, fontSize, scale } = sizeMap[size]
  
  const gradientId = `heraPrintGradient-${Math.random().toString(36).substr(2, 9)}`
  
  // Print-safe colors (CMYK-friendly)
  const colorSchemes = {
    mono: {
      primary: '#000000',
      secondary: '#4A4A4A',
      tertiary: '#808080'
    },
    color: {
      primary: '#1E293B', // Rich navy - prints well
      secondary: '#3B82F6', // Professional blue
      tertiary: '#10B981'   // Success green
    },
    reversed: {
      primary: '#FFFFFF',
      secondary: '#E2E8F0',
      tertiary: '#CBD5E1'
    }
  }
  
  const colors = colorSchemes[variant]
  
  if (format === 'stacked') {
    return (
      <svg 
        width={width * 0.8} 
        height={height * 1.6} 
        viewBox={`0 0 ${width * 0.8} ${height * 1.6}`} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* HERA Text - Centered */}
        <text 
          x={(width * 0.8) / 2} 
          y={height * 0.4} 
          fontFamily="Inter, Arial, sans-serif" 
          fontSize={fontSize * 0.9} 
          fontWeight="800" 
          fill={colors.primary}
          textAnchor="middle"
          letterSpacing="-0.02em"
        >
          HERA
        </text>
        
        {/* Scale bars - Centered below */}
        <g transform={`translate(${(width * 0.8) / 2 - (5 * 8 * scale) / 2}, ${height * 0.6})`}>
          {[1, 2, 3, 4, 5].map((level, i) => (
            <rect
              key={i}
              x={i * 8 * scale}
              y={20 * scale - level * 3 * scale}
              width={4 * scale}
              height={level * 3 * scale}
              fill={i < 2 ? colors.primary : i < 4 ? colors.secondary : colors.tertiary}
              rx={1 * scale}
            />
          ))}
        </g>
        
        {/* Tagline - Centered below */}
        <text 
          x={(width * 0.8) / 2} 
          y={height * 1.2} 
          fontFamily="Inter, Arial, sans-serif" 
          fontSize={fontSize * 0.2} 
          fontWeight="500" 
          fill={colors.secondary}
          textAnchor="middle"
          letterSpacing="0.1em"
        >
          UNIVERSAL ERP PLATFORM
        </text>
      </svg>
    )
  }
  
  if (format === 'vertical') {
    return (
      <svg 
        width={width * 0.7} 
        height={height * 1.4} 
        viewBox={`0 0 ${width * 0.7} ${height * 1.4}`} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* HERA Text */}
        <text 
          x="0" 
          y={height * 0.4} 
          fontFamily="Inter, Arial, sans-serif" 
          fontSize={fontSize * 0.8} 
          fontWeight="800" 
          fill={colors.primary}
          letterSpacing="-0.02em"
        >
          HERA
        </text>
        
        {/* Scale visualization - Below text */}
        <g transform={`translate(0, ${height * 0.6})`}>
          {[1, 2, 3, 4, 5].map((level, i) => (
            <rect
              key={i}
              x={i * 6 * scale}
              y={15 * scale - level * 2.5 * scale}
              width={3 * scale}
              height={level * 2.5 * scale}
              fill={i < 2 ? colors.primary : i < 4 ? colors.secondary : colors.tertiary}
              rx={0.5 * scale}
            />
          ))}
        </g>
        
        {/* Baseline */}
        <line 
          x1="0" 
          y1={height * 1.15} 
          x2={width * 0.4} 
          y2={height * 1.15} 
          stroke={colors.secondary} 
          strokeWidth="0.5"
        />
      </svg>
    )
  }
  
  // Default horizontal format
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
        {variant === 'color' && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="50%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.tertiary} />
          </linearGradient>
        )}
      </defs>
      
      {/* HERA Text - Perfectly aligned */}
      <text 
        x="0" 
        y={height * 0.65} 
        fontFamily="Inter, Arial, Helvetica, sans-serif" 
        fontSize={fontSize} 
        fontWeight="800" 
        fill={variant === 'color' ? `url(#${gradientId})` : colors.primary}
        letterSpacing="-0.03em"
        dominantBaseline="middle"
      >
        HERA
      </text>
      
      {/* Scale visualization - Aligned to text baseline */}
      <g transform={`translate(${width * 0.65}, ${height * 0.25})`}>
        {[1, 2, 3, 4, 5].map((level, i) => {
          const barHeight = level * 4 * scale
          const barWidth = 3 * scale
          const x = i * 6 * scale
          const y = height * 0.4 - barHeight
          
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={
                variant === 'mono' ? colors.primary :
                i < 2 ? colors.primary : 
                i < 4 ? colors.secondary : colors.tertiary
              }
              rx={barWidth / 6}
            />
          )
        })}
      </g>
      
      {/* Print registration marks for alignment (only visible in print preview) */}
      <g className="print-only" opacity="0.3">
        <circle cx="2" cy="2" r="1" fill={colors.primary} />
        <circle cx={width - 2} cy="2" r="1" fill={colors.primary} />
        <circle cx="2" cy={height - 2} r="1" fill={colors.primary} />
        <circle cx={width - 2} cy={height - 2} r="1" fill={colors.primary} />
      </g>
      
      {/* Baseline for perfect alignment */}
      <line 
        x1="0" 
        y1={height * 0.85} 
        x2={width * 0.6} 
        y2={height * 0.85} 
        stroke={colors.secondary} 
        strokeWidth="0.5" 
        opacity="0.4"
      />
    </svg>
  )
}

export default HeraPrintLogo