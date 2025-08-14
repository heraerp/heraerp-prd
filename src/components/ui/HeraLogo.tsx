import React from 'react'

interface HeraLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'light' | 'dark'
}

const sizeMap = {
  sm: { width: 80, height: 24, fontSize: 18 },
  md: { width: 120, height: 36, fontSize: 27 },
  lg: { width: 160, height: 48, fontSize: 36 },
  xl: { width: 200, height: 60, fontSize: 45 }
}

export function HeraLogo({ 
  className = '', 
  size = 'md', 
  variant = 'default' 
}: HeraLogoProps) {
  const { width, height, fontSize } = sizeMap[size]
  
  const gradientId = `heraGradient-${Math.random().toString(36).substr(2, 9)}`
  const glowId = `glow-${Math.random().toString(36).substr(2, 9)}`
  
  const gradientStops = {
    default: ['#1E293B', '#3B82F6', '#0EA5E9'],
    light: ['#64748B', '#60A5FA', '#38BDF8'],
    dark: ['#0F172A', '#1E40AF', '#0369A1']
  }
  
  const stops = gradientStops[variant]
  
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
          <stop offset="0%" style={{ stopColor: stops[0] }} />
          <stop offset="50%" style={{ stopColor: stops[1] }} />
          <stop offset="100%" style={{ stopColor: stops[2] }} />
        </linearGradient>
        
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* HERA Text */}
      <text 
        x="0" 
        y={height * 0.67} 
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" 
        fontSize={fontSize} 
        fontWeight="700" 
        fill={`url(#${gradientId})`}
        filter={`url(#${glowId})`}
        letterSpacing="-0.02em"
      >
        HERA
      </text>
      
      {/* Modern geometric accent */}
      <g transform={`translate(${width * 0.84}, ${height * 0.17})`}>
        <rect 
          width={width * 0.019} 
          height={height * 0.67} 
          fill={`url(#${gradientId})`} 
          rx={width * 0.009} 
          opacity="0.8"
        />
        <rect 
          x={width * 0.038} 
          y={height * 0.17} 
          width={width * 0.019} 
          height={height * 0.5} 
          fill={`url(#${gradientId})`} 
          rx={width * 0.009} 
          opacity="0.6"
        />
        <rect 
          x={width * 0.075} 
          y={height * 0.33} 
          width={width * 0.019} 
          height={height * 0.33} 
          fill={`url(#${gradientId})`} 
          rx={width * 0.009} 
          opacity="0.4"
        />
      </g>
    </svg>
  )
}

export default HeraLogo