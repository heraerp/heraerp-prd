import React from 'react'

interface HeraPremiumLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'animated' | 'static'
}

const sizeMap = {
  sm: { width: 120, height: 40, fontSize: 28, iconSize: 24 },
  md: { width: 160, height: 54, fontSize: 36, iconSize: 32 },
  lg: { width: 200, height: 64, fontSize: 42, iconSize: 38 },
  xl: { width: 240, height: 80, fontSize: 48, iconSize: 44 }
}

export function HeraPremiumLogo({ 
  className = '', 
  size = 'lg',
  variant = 'animated'
}: HeraPremiumLogoProps) {
  const { width, height, fontSize, iconSize } = sizeMap[size]
  
  const gradientId = `heraPremiumGradient-${Math.random().toString(36).substr(2, 9)}`
  const glowId = `heraPremiumGlow-${Math.random().toString(36).substr(2, 9)}`
  const patternId = `heraPremiumPattern-${Math.random().toString(36).substr(2, 9)}`
  const maskId = `heraPremiumMask-${Math.random().toString(36).substr(2, 9)}`
  
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
        {/* Premium gradient with metallic feel */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#6366f1' }}>
            {variant === 'animated' && (
              <animate 
                attributeName="stop-color" 
                values="#6366f1;#8b5cf6;#a855f7;#6366f1" 
                dur="8s" 
                repeatCount="indefinite" 
              />
            )}
          </stop>
          <stop offset="50%" style={{ stopColor: '#8b5cf6' }}>
            {variant === 'animated' && (
              <animate 
                attributeName="stop-color" 
                values="#8b5cf6;#a855f7;#6366f1;#8b5cf6" 
                dur="8s" 
                repeatCount="indefinite" 
              />
            )}
          </stop>
          <stop offset="100%" style={{ stopColor: '#a855f7' }}>
            {variant === 'animated' && (
              <animate 
                attributeName="stop-color" 
                values="#a855f7;#6366f1;#8b5cf6;#a855f7" 
                dur="8s" 
                repeatCount="indefinite" 
              />
            )}
          </stop>
        </linearGradient>
        
        {/* Metallic shine effect */}
        <linearGradient id={`${gradientId}-shine`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
          <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.4 }}>
            {variant === 'animated' && (
              <animate 
                attributeName="offset" 
                values="0;1;0" 
                dur="6s" 
                repeatCount="indefinite" 
              />
            )}
          </stop>
          <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
        </linearGradient>
        
        {/* Premium glow filter */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur">
            {variant === 'animated' && (
              <animate 
                attributeName="stdDeviation" 
                values="2;3;2" 
                dur="4s" 
                repeatCount="indefinite" 
              />
            )}
          </feGaussianBlur>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Sophisticated shadow */}
        <filter id="premiumShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="4" result="offsetblur"/>
          <feFlood floodColor="#000000" floodOpacity="0.15"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Subtle pattern for depth */}
        <pattern id={patternId} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.5" fill="#8b5cf6" opacity="0.1" />
        </pattern>
        
        {/* Mask for icon cutout */}
        <mask id={maskId}>
          <rect x="0" y="0" width={width} height={height} fill="white" />
          <rect x="10" y="10" width={iconSize} height={iconSize} fill="black" />
        </mask>
      </defs>
      
      {/* Premium background with subtle gradient */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx={height * 0.2}
        fill="white"
        fillOpacity="0.98"
        filter="url(#premiumShadow)"
      />
      
      {/* Subtle pattern overlay */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx={height * 0.2}
        fill={`url(#${patternId})`}
        opacity="0.3"
      />
      
      {/* Premium border */}
      <rect
        x="1"
        y="1"
        width={width - 2}
        height={height - 2}
        rx={height * 0.2}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        opacity="0.4"
      />
      
      {/* Icon background */}
      <rect
        x="10"
        y={(height - iconSize) / 2}
        width={iconSize}
        height={iconSize}
        rx={iconSize * 0.2}
        fill={`url(#${gradientId})`}
        filter={`url(#${glowId})`}
      />
      
      {/* Abstract H icon */}
      <g transform={`translate(10, ${(height - iconSize) / 2})`}>
        <path
          d={`
            M ${iconSize * 0.25} ${iconSize * 0.2}
            L ${iconSize * 0.25} ${iconSize * 0.8}
            M ${iconSize * 0.75} ${iconSize * 0.2}
            L ${iconSize * 0.75} ${iconSize * 0.8}
            M ${iconSize * 0.25} ${iconSize * 0.5}
            L ${iconSize * 0.75} ${iconSize * 0.5}
          `}
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Decorative dot */}
        <circle
          cx={iconSize * 0.85}
          cy={iconSize * 0.15}
          r="2"
          fill="white"
          opacity="0.8"
        />
      </g>
      
      {/* Main text with premium typography */}
      <text
        x={iconSize + 25}
        y="50%"
        fontFamily="'Montserrat', 'Inter', -apple-system, sans-serif"
        fontSize={fontSize}
        fontWeight="700"
        fill={`url(#${gradientId})`}
        dominantBaseline="middle"
        letterSpacing="-0.02em"
      >
        HERA
      </text>
      
      {/* Metallic shine overlay on text */}
      <text
        x={iconSize + 25}
        y="50%"
        fontFamily="'Montserrat', 'Inter', -apple-system, sans-serif"
        fontSize={fontSize}
        fontWeight="700"
        fill={`url(#${gradientId}-shine)`}
        dominantBaseline="middle"
        letterSpacing="-0.02em"
        opacity="0.6"
      >
        HERA
      </text>
      
      {/* Tagline for larger sizes */}
      {(size === 'lg' || size === 'xl') && (
        <text
          x={iconSize + 25}
          y="70%"
          fontFamily="'Inter', -apple-system, sans-serif"
          fontSize={fontSize * 0.3}
          fontWeight="400"
          fill="#64748b"
          letterSpacing="0.05em"
        >
          ENTERPRISE PLATFORM
        </text>
      )}
      
      {/* Premium accent line */}
      <rect
        x={iconSize + 25}
        y={height * 0.8}
        width={width - iconSize - 35}
        height="1.5"
        fill={`url(#${gradientId})`}
        opacity="0.3"
        rx="1"
      />
    </svg>
  )
}

export default HeraPremiumLogo