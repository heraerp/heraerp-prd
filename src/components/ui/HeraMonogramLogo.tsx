import React from 'react'

interface HeraMonogramLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'gradient' | 'solid' | 'outline'
}

const sizeMap = {
  sm: { width: 80, height: 32, fontSize: 24 },
  md: { width: 100, height: 40, fontSize: 30 },
  lg: { width: 120, height: 48, fontSize: 36 },
  xl: { width: 160, height: 64, fontSize: 48 }
}

export function HeraMonogramLogo({ 
  className = '', 
  size = 'lg',
  variant = 'gradient'
}: HeraMonogramLogoProps) {
  const { width, height, fontSize } = sizeMap[size]
  
  const gradientId = `heraMonogram-${Math.random().toString(36).substr(2, 9)}`
  
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
        {/* Premium gradient */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#6366f1' }} />
          <stop offset="50%" style={{ stopColor: '#8b5cf6' }} />
          <stop offset="100%" style={{ stopColor: '#6366f1' }} />
        </linearGradient>
      </defs>
      
      {/* HERA lettermark */}
      <text
        x="50%"
        y="50%"
        fontFamily="'Inter', -apple-system, sans-serif"
        fontSize={fontSize}
        fontWeight="900"
        fill={variant === 'gradient' ? `url(#${gradientId})` : variant === 'outline' ? 'none' : '#6366f1'}
        stroke={variant === 'outline' ? '#6366f1' : 'none'}
        strokeWidth={variant === 'outline' ? '1.5' : '0'}
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing="-0.02em"
      >
        HERA
      </text>
    </svg>
  )
}

// Stylized version with custom letterforms
export function HeraStylizedMonogram({ 
  className = '', 
  size = 'lg',
  variant = 'gradient'
}: HeraMonogramLogoProps) {
  const { width, height, fontSize } = sizeMap[size]
  
  const gradientId = `heraStylized-${Math.random().toString(36).substr(2, 9)}`
  const spacing = fontSize * 0.6
  
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
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#7c3aed' }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4' }} />
        </linearGradient>
      </defs>
      
      <g transform={`translate(${width/2}, ${height/2})`}>
        {/* H - with distinctive crossbar */}
        <g transform={`translate(${-spacing * 1.5}, 0)`}>
          <path
            d={`
              M ${-fontSize * 0.2} ${-fontSize * 0.4}
              L ${-fontSize * 0.2} ${fontSize * 0.4}
              M ${fontSize * 0.2} ${-fontSize * 0.4}
              L ${fontSize * 0.2} ${fontSize * 0.4}
              M ${-fontSize * 0.2} 0
              L ${fontSize * 0.2} 0
            `}
            stroke={variant === 'gradient' ? `url(#${gradientId})` : '#7c3aed'}
            strokeWidth={fontSize * 0.12}
            strokeLinecap="square"
            fill="none"
          />
        </g>
        
        {/* E - modern interpretation */}
        <g transform={`translate(${-spacing * 0.5}, 0)`}>
          <path
            d={`
              M ${-fontSize * 0.15} ${-fontSize * 0.4}
              L ${fontSize * 0.15} ${-fontSize * 0.4}
              M ${-fontSize * 0.15} ${-fontSize * 0.4}
              L ${-fontSize * 0.15} ${fontSize * 0.4}
              M ${-fontSize * 0.15} 0
              L ${fontSize * 0.1} 0
              M ${-fontSize * 0.15} ${fontSize * 0.4}
              L ${fontSize * 0.15} ${fontSize * 0.4}
            `}
            stroke={variant === 'gradient' ? `url(#${gradientId})` : '#7c3aed'}
            strokeWidth={fontSize * 0.12}
            strokeLinecap="square"
            fill="none"
          />
        </g>
        
        {/* R - with distinctive leg */}
        <g transform={`translate(${spacing * 0.5}, 0)`}>
          <path
            d={`
              M ${-fontSize * 0.15} ${fontSize * 0.4}
              L ${-fontSize * 0.15} ${-fontSize * 0.4}
              L ${fontSize * 0.1} ${-fontSize * 0.4}
              Q ${fontSize * 0.2} ${-fontSize * 0.3} ${fontSize * 0.2} ${-fontSize * 0.15}
              Q ${fontSize * 0.2} 0 ${fontSize * 0.1} ${fontSize * 0.05}
              L ${-fontSize * 0.15} ${fontSize * 0.05}
              L ${fontSize * 0.2} ${fontSize * 0.4}
            `}
            stroke={variant === 'gradient' ? `url(#${gradientId})` : '#7c3aed'}
            strokeWidth={fontSize * 0.12}
            strokeLinecap="square"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
        
        {/* A - distinctive peak */}
        <g transform={`translate(${spacing * 1.5}, 0)`}>
          <path
            d={`
              M ${-fontSize * 0.2} ${fontSize * 0.4}
              L 0 ${-fontSize * 0.4}
              L ${fontSize * 0.2} ${fontSize * 0.4}
              M ${-fontSize * 0.1} ${fontSize * 0.1}
              L ${fontSize * 0.1} ${fontSize * 0.1}
            `}
            stroke={variant === 'gradient' ? `url(#${gradientId})` : '#7c3aed'}
            strokeWidth={fontSize * 0.12}
            strokeLinecap="square"
            strokeLinejoin="miter"
            fill="none"
          />
        </g>
      </g>
    </svg>
  )
}

// Minimalist geometric version
export function HeraGeometricMonogram({ 
  className = '', 
  size = 'lg',
  variant = 'gradient'
}: HeraMonogramLogoProps) {
  const { width, height, fontSize } = sizeMap[size]
  
  const gradientId = `heraGeometric-${Math.random().toString(36).substr(2, 9)}`
  
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
          <stop offset="0%" style={{ stopColor: '#5046e5' }} />
          <stop offset="100%" style={{ stopColor: '#a855f7' }} />
        </linearGradient>
      </defs>
      
      {/* HERA in custom geometric letterforms */}
      <text
        x="50%"
        y="50%"
        fontFamily="'Montserrat', sans-serif"
        fontSize={fontSize}
        fontWeight="800"
        fill={variant === 'gradient' ? `url(#${gradientId})` : '#5046e5'}
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing="0.1em"
        style={{ textTransform: 'uppercase' }}
      >
        HERA
      </text>
      
      {/* Accent line */}
      <rect
        x={width * 0.1}
        y={height * 0.8}
        width={width * 0.8}
        height="2"
        fill={variant === 'gradient' ? `url(#${gradientId})` : '#5046e5'}
        opacity="0.3"
      />
    </svg>
  )
}

// Stacked version for square formats
export function HeraStackedMonogram({ 
  className = '', 
  size = 'lg',
  variant = 'gradient'
}: HeraMonogramLogoProps) {
  const { width, height, fontSize } = sizeMap[size]
  const squareSize = Math.max(width, height)
  
  const gradientId = `heraStacked-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <svg 
      width={squareSize} 
      height={squareSize} 
      viewBox={`0 0 ${squareSize} ${squareSize}`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#7c3aed' }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4' }} />
        </linearGradient>
      </defs>
      
      {/* Stacked letters */}
      <g transform={`translate(${squareSize/2}, ${squareSize/2})`}>
        {['H', 'E', 'R', 'A'].map((letter, index) => (
          <text
            key={letter}
            x="0"
            y={(index - 1.5) * (fontSize * 0.8)}
            fontFamily="'Inter', sans-serif"
            fontSize={fontSize * 0.8}
            fontWeight="900"
            fill={variant === 'gradient' ? `url(#${gradientId})` : '#7c3aed'}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {letter}
          </text>
        ))}
      </g>
      
      {/* Border frame */}
      <rect
        x="2"
        y="2"
        width={squareSize - 4}
        height={squareSize - 4}
        fill="none"
        stroke={variant === 'gradient' ? `url(#${gradientId})` : '#7c3aed'}
        strokeWidth="2"
        opacity="0.2"
        rx="4"
      />
    </svg>
  )
}

export default HeraMonogramLogo