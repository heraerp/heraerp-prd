import React from 'react'

interface HeraTypographicLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'mono' | 'reversed' | 'dark'
  concept?:
    | 'weight-progression'
    | 'size-cascade'
    | 'mixed-weights'
    | 'stacked-growth'
    | 'letter-evolution'
  animated?: boolean
}

const sizeMap = {
  sm: { width: 100, height: 32, baseFontSize: 16 },
  md: { width: 140, height: 44, baseFontSize: 24 },
  lg: { width: 180, height: 56, baseFontSize: 32 },
  xl: { width: 220, height: 68, baseFontSize: 40 }
}

export function HeraTypographicLogo({
  className = '',
  size = 'md',
  variant = 'default',
  concept = 'weight-progression',
  animated = false
}: HeraTypographicLogoProps) {
  const { width, height, baseFontSize } = sizeMap[size]

  const colors = {
    default: {
      primary: '#0F172A',
      secondary: '#1E40AF',
      tertiary: '#0EA5E9',
      quaternary: '#10B981'
    },
    dark: {
      primary: '#FFFFFF',
      secondary: '#60A5FA',
      tertiary: '#22D3EE',
      quaternary: '#34D399'
    },
    mono: {
      primary: '#000000',
      secondary: '#000000',
      tertiary: '#000000',
      quaternary: '#000000'
    },
    reversed: {
      primary: '#FFFFFF',
      secondary: '#E2E8F0',
      tertiary: '#CBD5E1',
      quaternary: '#94A3B8'
    }
  }

  const scheme = colors[variant]

  const renderConcept = () => {
    switch (concept) {
      case 'weight-progression':
        // Each letter gets progressively bolder - micro to enterprise
        return (
          <g>
            {/* Complementary tagline with consistent weight */}
            <text
              x="0"
              y={height * 0.95}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize={baseFontSize * 0.28}
              fontWeight="500"
              fill={scheme.secondary}
              opacity="0.75"
              letterSpacing="0.02em"
            >
              One System. Any Business.
            </text>

            {/* HERA letters with 0.80 fontsize spacing units */}
            <text
              fontFamily="Inter, -apple-system, sans-serif"
              fontSize={baseFontSize}
              fill={scheme.primary}
              y={height * 0.65}
            >
              {/* H aligns with "O" of "One" */}
              <tspan x="0" fontWeight="200" fill={scheme.primary}>
                H
              </tspan>
              {/* E with 0.80 fontsize spacing */}
              <tspan x={baseFontSize * 0.8} fontWeight="400" fill={scheme.secondary}>
                E
              </tspan>
              {/* R with 0.80 fontsize spacing */}
              <tspan x={baseFontSize * 1.6} fontWeight="600" fill={scheme.tertiary}>
                R
              </tspan>
              {/* A with 0.80 fontsize spacing */}
              <tspan x={baseFontSize * 2.4} fontWeight="900" fill={scheme.quaternary}>
                A
              </tspan>
            </text>
          </g>
        )

      case 'size-cascade':
        // Letters grow in size - visual scaling
        return (
          <g>
            <text
              y={height * 0.7}
              fontFamily="Inter, -apple-system, sans-serif"
              fontWeight="700"
              fill={scheme.primary}
              dominantBaseline="alphabetic"
            >
              <tspan x="0" fontSize={baseFontSize * 0.7} fill={scheme.primary}>
                H
              </tspan>
              <tspan x={baseFontSize * 0.55} fontSize={baseFontSize * 0.85} fill={scheme.secondary}>
                E
              </tspan>
              <tspan x={baseFontSize * 1.3} fontSize={baseFontSize * 1.0} fill={scheme.tertiary}>
                R
              </tspan>
              <tspan x={baseFontSize * 2.2} fontSize={baseFontSize * 1.15} fill={scheme.quaternary}>
                A
              </tspan>
            </text>
          </g>
        )

      case 'mixed-weights':
        // Sophisticated mix of weights and sizes
        return (
          <g>
            {/* Main HERA text with mixed weights */}
            <text
              y={height * 0.65}
              fontFamily="Inter, -apple-system, sans-serif"
              fontSize={baseFontSize}
              dominantBaseline="alphabetic"
            >
              <tspan x="0" fontWeight="300" fontSize={baseFontSize * 0.9} fill={scheme.primary}>
                H
              </tspan>
              <tspan
                x={baseFontSize * 0.7}
                fontWeight="500"
                fontSize={baseFontSize}
                fill={scheme.secondary}
              >
                E
              </tspan>
              <tspan
                x={baseFontSize * 1.5}
                fontWeight="700"
                fontSize={baseFontSize * 1.05}
                fill={scheme.tertiary}
              >
                R
              </tspan>
              <tspan
                x={baseFontSize * 2.4}
                fontWeight="900"
                fontSize={baseFontSize * 1.1}
                fill={scheme.quaternary}
              >
                A
              </tspan>
            </text>

            {/* Small to large indicator below */}
            <g opacity="0.3">
              <rect
                x="0"
                y={height * 0.75}
                width={baseFontSize * 0.15}
                height="1"
                fill={scheme.primary}
              />
              <rect
                x={baseFontSize * 0.7}
                y={height * 0.75}
                width={baseFontSize * 0.3}
                height="1.5"
                fill={scheme.secondary}
              />
              <rect
                x={baseFontSize * 1.5}
                y={height * 0.75}
                width={baseFontSize * 0.45}
                height="2"
                fill={scheme.tertiary}
              />
              <rect
                x={baseFontSize * 2.4}
                y={height * 0.75}
                width={baseFontSize * 0.6}
                height="2.5"
                fill={scheme.quaternary}
              />
            </g>
          </g>
        )

      case 'stacked-growth':
        // Vertical stacking with size progression
        return (
          <g>
            <text
              x="0"
              fontFamily="Inter, -apple-system, sans-serif"
              fontWeight="800"
              letterSpacing="-0.04em"
            >
              <tspan
                x="0"
                y={height * 0.3}
                fontSize={baseFontSize * 0.5}
                fill={scheme.primary}
                opacity="0.4"
              >
                HERA
              </tspan>
              <tspan
                x="0"
                y={height * 0.5}
                fontSize={baseFontSize * 0.7}
                fill={scheme.secondary}
                opacity="0.6"
              >
                HERA
              </tspan>
              <tspan
                x="0"
                y={height * 0.75}
                fontSize={baseFontSize * 0.9}
                fill={scheme.tertiary}
                opacity="0.8"
              >
                HERA
              </tspan>
              <tspan
                x="0"
                y={height * 1.05}
                fontSize={baseFontSize * 1.1}
                fill={scheme.quaternary}
                opacity="1"
              >
                HERA
              </tspan>
            </text>
          </g>
        )

      case 'letter-evolution':
        // Each letter represents a business stage
        return (
          <g>
            <text
              y={height * 0.65}
              fontFamily="Inter, -apple-system, sans-serif"
              fontSize={baseFontSize}
              fill={scheme.primary}
              dominantBaseline="alphabetic"
            >
              {/* H - Home/Micro */}
              <tspan x="0" fontWeight="400" fontSize={baseFontSize * 0.9}>
                H
                <animate
                  attributeName="font-weight"
                  values="400;500;400"
                  dur="4s"
                  repeatCount={animated ? 'indefinite' : '0'}
                />
              </tspan>

              {/* E - Expanding/Small */}
              <tspan
                x={baseFontSize * 0.8}
                fontWeight="500"
                fontSize={baseFontSize * 0.95}
                fill={scheme.secondary}
              >
                E
                <animate
                  attributeName="font-weight"
                  values="500;600;500"
                  dur="4s"
                  begin="0.5s"
                  repeatCount={animated ? 'indefinite' : '0'}
                />
              </tspan>

              {/* R - Rising/Medium */}
              <tspan
                x={baseFontSize * 1.6}
                fontWeight="700"
                fontSize={baseFontSize}
                fill={scheme.tertiary}
              >
                R
                <animate
                  attributeName="font-weight"
                  values="700;800;700"
                  dur="4s"
                  begin="1s"
                  repeatCount={animated ? 'indefinite' : '0'}
                />
              </tspan>

              {/* A - Apex/Enterprise */}
              <tspan
                x={baseFontSize * 2.5}
                fontWeight="900"
                fontSize={baseFontSize * 1.05}
                fill={scheme.quaternary}
              >
                A
                <animate
                  attributeName="font-weight"
                  values="900;900;900"
                  dur="4s"
                  begin="1.5s"
                  repeatCount={animated ? 'indefinite' : '0'}
                />
              </tspan>
            </text>

            {/* Letter meanings */}
            <g
              opacity="0.5"
              fontSize={baseFontSize * 0.15}
              fontFamily="Inter"
              fill={scheme.secondary}
            >
              <text x="0" y={height * 0.85}>
                Home
              </text>
              <text x={baseFontSize * 0.8} y={height * 0.85}>
                Expand
              </text>
              <text x={baseFontSize * 1.6} y={height * 0.85}>
                Rise
              </text>
              <text x={baseFontSize * 2.5} y={height * 0.85}>
                Apex
              </text>
            </g>
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
      {renderConcept()}
    </svg>
  )
}

export default HeraTypographicLogo
