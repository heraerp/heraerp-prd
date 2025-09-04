import React from 'react'

interface HeraTextLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm: { width: 120, height: 40, fontSize: 32 },
  md: { width: 160, height: 54, fontSize: 42 },
  lg: { width: 200, height: 68, fontSize: 54 },
  xl: { width: 240, height: 80, fontSize: 64 }
}

export function HeraTextLogo({ 
  className = '', 
  size = 'lg'
}: HeraTextLogoProps) {
  const { width, height, fontSize } = sizeMap[size]
  
  const gradientId = `heraTextGradient-${Math.random().toString(36).substr(2, 9)}`
  const patternId = `heraPattern-${Math.random().toString(36).substr(2, 9)}`
  
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
        {/* Main gradient matching Canva colors */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#7c3aed' }} />
          <stop offset="25%" style={{ stopColor: '#8b5cf6' }} />
          <stop offset="50%" style={{ stopColor: '#c084fc' }} />
          <stop offset="75%" style={{ stopColor: '#7dd3fc' }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4' }} />
        </linearGradient>
        
        {/* Subtle pattern for texture */}
        <pattern id={patternId} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill="#8b5cf6" opacity="0.3" />
          <circle cx="3" cy="3" r="0.5" fill="#7dd3fc" opacity="0.3" />
        </pattern>
        
        {/* Glow effect */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Shadow */}
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.2"/>
        </filter>
      </defs>
      
      {/* Background accent shape */}
      <rect 
        x={width * 0.02} 
        y={height * 0.1}
        width={width * 0.96} 
        height={height * 0.8}
        rx="8"
        fill={`url(#${patternId})`}
        opacity="0.1"
      />
      
      {/* Individual letters with unique styling */}
      <g filter="url(#shadow)">
        {/* H */}
        <text
          x={width * 0.08}
          y={height * 0.75}
          fontFamily="Arial, sans-serif"
          fontSize={fontSize}
          fontWeight="800"
          fill={`url(#${gradientId})`}
          letterSpacing="-0.02em"
        >
          H
        </text>
        
        {/* E - slightly rotated */}
        <text
          x={width * 0.28}
          y={height * 0.75}
          fontFamily="Arial, sans-serif"
          fontSize={fontSize}
          fontWeight="800"
          fill={`url(#${gradientId})`}
          letterSpacing="-0.02em"
          transform={`rotate(-2 ${width * 0.35} ${height * 0.5})`}
        >
          E
        </text>
        
        {/* R - slightly elevated */}
        <text
          x={width * 0.48}
          y={height * 0.72}
          fontFamily="Arial, sans-serif"
          fontSize={fontSize}
          fontWeight="800"
          fill={`url(#${gradientId})`}
          letterSpacing="-0.02em"
        >
          R
        </text>
        
        {/* A - slightly rotated opposite */}
        <text
          x={width * 0.68}
          y={height * 0.75}
          fontFamily="Arial, sans-serif"
          fontSize={fontSize}
          fontWeight="800"
          fill={`url(#${gradientId})`}
          letterSpacing="-0.02em"
          transform={`rotate(2 ${width * 0.75} ${height * 0.5})`}
        >
          A
        </text>
      </g>
      
      {/* Decorative elements */}
      <circle
        cx={width * 0.92}
        cy={height * 0.2}
        r="3"
        fill="#8b5cf6"
        opacity="0.6"
      />
      <circle
        cx={width * 0.05}
        cy={height * 0.8}
        r="2"
        fill="#7dd3fc"
        opacity="0.6"
      />
      
      {/* Underline accent */}
      <rect
        x={width * 0.08}
        y={height * 0.85}
        width={width * 0.84}
        height="2"
        fill={`url(#${gradientId})`}
        opacity="0.4"
        rx="1"
      />
    </svg>
  )
}

export default HeraTextLogo