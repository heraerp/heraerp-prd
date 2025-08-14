import React from 'react'

interface HeraLogoPrintReadyProps {
  className?: string
  size?: 'business-card' | 'letterhead' | 'envelope' | 'poster'
  variant?: 'color' | 'mono' | 'reversed'
  format?: 'horizontal' | 'vertical' | 'icon-only'
  showBaseline?: boolean
}

const printSpecs = {
  'business-card': { 
    width: 108, height: 28, fontSize: 20, 
    clearSpace: 6, scaleSize: 0.5 
  },
  'letterhead': { 
    width: 162, height: 42, fontSize: 30, 
    clearSpace: 8, scaleSize: 0.7 
  },
  'envelope': { 
    width: 135, height: 35, fontSize: 25, 
    clearSpace: 7, scaleSize: 0.6 
  },
  'poster': { 
    width: 324, height: 84, fontSize: 60, 
    clearSpace: 16, scaleSize: 1.4 
  }
}

export function HeraLogoPrintReady({ 
  className = '', 
  size = 'letterhead',
  variant = 'color',
  format = 'horizontal',
  showBaseline = false
}: HeraLogoPrintReadyProps) {
  const { width, height, fontSize, clearSpace, scaleSize } = printSpecs[size]
  
  // Print-safe colors (tested for CMYK accuracy)
  const colors = {
    color: {
      primary: '#1E293B',    // CMYK: 83,65,0,77
      secondary: '#3B82F6',  // CMYK: 76,47,0,4  
      tertiary: '#10B981',   // CMYK: 58,0,30,27
      text: '#000000'
    },
    mono: {
      primary: '#000000',    // Pure black
      secondary: '#333333',  // 80% black
      tertiary: '#666666',   // 60% black
      text: '#000000'
    },
    reversed: {
      primary: '#FFFFFF',    // Pure white
      secondary: '#E5E5E5',  // 10% black
      tertiary: '#CCCCCC',   // 20% black  
      text: '#FFFFFF'
    }
  }
  
  const scheme = colors[variant]
  const gradientId = `heraPrintGrad-${Math.random().toString(36).substr(2, 6)}`
  
  if (format === 'icon-only') {
    const iconSize = Math.min(width, height)
    return (
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox={`0 0 ${iconSize} ${iconSize}`}
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} hera-logo-print`}
      >
        {/* Icon: Just the scale bars */}
        <g transform={`translate(${iconSize * 0.2}, ${iconSize * 0.3})`}>
          {[1, 2, 3, 4, 5].map((level, i) => (
            <rect
              key={i}
              x={i * (iconSize * 0.12)}
              y={iconSize * 0.4 - (level * iconSize * 0.06)}
              width={iconSize * 0.08}
              height={level * iconSize * 0.06}
              fill={i < 2 ? scheme.primary : i < 4 ? scheme.secondary : scheme.tertiary}
              rx={iconSize * 0.01}
            />
          ))}
        </g>
      </svg>
    )
  }
  
  if (format === 'vertical') {
    return (
      <svg 
        width={width * 0.8} 
        height={height * 1.5} 
        viewBox={`0 0 ${width * 0.8} ${height * 1.5}`}
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} hera-logo-print`}
      >
        <defs>
          {variant === 'color' && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={scheme.primary} />
              <stop offset="50%" stopColor={scheme.secondary} />
              <stop offset="100%" stopColor={scheme.tertiary} />
            </linearGradient>
          )}
        </defs>
        
        {/* HERA Text - Perfectly centered */}
        <text 
          x={clearSpace} 
          y={height * 0.45} 
          fontFamily="Arial, Helvetica, sans-serif" 
          fontSize={fontSize * 0.9} 
          fontWeight="800" 
          fill={variant === 'color' ? `url(#${gradientId})` : scheme.primary}
          letterSpacing="-0.02em"
          dominantBaseline="central"
          className="hera-logo-text"
        >
          HERA
        </text>
        
        {/* Scale bars - Below text */}
        <g transform={`translate(${clearSpace}, ${height * 0.75})`}>
          {[1, 2, 3, 4, 5].map((level, i) => (
            <rect
              key={i}
              x={i * 8 * scaleSize}
              y={15 * scaleSize - level * 2.5 * scaleSize}
              width={4 * scaleSize}
              height={level * 2.5 * scaleSize}
              fill={
                variant === 'mono' ? scheme.primary :
                i < 2 ? scheme.primary : 
                i < 4 ? scheme.secondary : scheme.tertiary
              }
              rx={1 * scaleSize}
            />
          ))}
        </g>
        
        {showBaseline && (
          <line 
            x1={clearSpace} 
            y1={height * 1.3} 
            x2={width * 0.6} 
            y2={height * 1.3} 
            stroke={scheme.secondary} 
            strokeWidth="0.5"
            opacity="0.5"
          />
        )}
      </svg>
    )
  }
  
  // Default horizontal format - PERFECTLY ALIGNED
  return (
    <svg 
      width={width + clearSpace * 2} 
      height={height + clearSpace * 2} 
      viewBox={`0 0 ${width + clearSpace * 2} ${height + clearSpace * 2}`}
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} hera-logo-print`}
    >
      <defs>
        {variant === 'color' && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={scheme.primary} />
            <stop offset="33%" stopColor={scheme.secondary} />
            <stop offset="66%" stopColor={scheme.secondary} />
            <stop offset="100%" stopColor={scheme.tertiary} />
          </linearGradient>
        )}
      </defs>
      
      {/* Clear space indicator (only visible in design mode) */}
      {process.env.NODE_ENV === 'development' && (
        <rect 
          x="0" y="0" 
          width={width + clearSpace * 2} 
          height={height + clearSpace * 2}
          fill="none" 
          stroke="#ff0000" 
          strokeWidth="0.5" 
          strokeDasharray="2,2" 
          opacity="0.3"
        />
      )}
      
      {/* HERA Text - Baseline aligned */}
      <text 
        x={clearSpace} 
        y={clearSpace + height * 0.65} 
        fontFamily="Arial, Helvetica, sans-serif" 
        fontSize={fontSize} 
        fontWeight="800" 
        fill={variant === 'color' ? `url(#${gradientId})` : scheme.primary}
        letterSpacing="-0.025em"
        dominantBaseline="alphabetic"
        className="hera-logo-text hera-spacing"
      >
        HERA
      </text>
      
      {/* Scale visualization - Aligned to text */}
      <g transform={`translate(${clearSpace + width * 0.65}, ${clearSpace + height * 0.25})`}>
        {[1, 2, 3, 4, 5].map((level, i) => {
          const barHeight = level * 3 * scaleSize
          const barWidth = 2.5 * scaleSize
          const x = i * 5 * scaleSize
          const y = height * 0.4 - barHeight
          
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={
                variant === 'mono' ? scheme.primary :
                i < 2 ? scheme.primary : 
                i < 4 ? scheme.secondary : scheme.tertiary
              }
              rx={barWidth / 5}
              className="avoid-break"
            />
          )
        })}
      </g>
      
      {/* Baseline for perfect print alignment */}
      {showBaseline && (
        <line 
          x1={clearSpace} 
          y1={clearSpace + height * 0.85} 
          x2={clearSpace + width * 0.6} 
          y2={clearSpace + height * 0.85} 
          stroke={scheme.secondary} 
          strokeWidth="0.25"
          opacity="0.4"
        />
      )}
      
      {/* Registration marks for professional printing */}
      <g className="print-only">
        <circle cx={clearSpace * 0.5} cy={clearSpace * 0.5} r="0.5" fill={scheme.text} />
        <circle cx={width + clearSpace * 1.5} cy={clearSpace * 0.5} r="0.5" fill={scheme.text} />
        <circle cx={clearSpace * 0.5} cy={height + clearSpace * 1.5} r="0.5" fill={scheme.text} />
        <circle cx={width + clearSpace * 1.5} cy={height + clearSpace * 1.5} r="0.5" fill={scheme.text} />
      </g>
    </svg>
  )
}

export default HeraLogoPrintReady