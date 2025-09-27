'use client'

/**
 * WaveSection Component
 *
 * A wrapper component that adds wave backgrounds to sections
 * Perfect for hero sections, feature blocks, or any content that needs visual separation
 */

import WaveBackground from './WaveBackground'

interface WaveSectionProps {
  children: React.ReactNode
  className?: string
  wavePosition?: 'top' | 'bottom' | 'both'
  waveHeight?: number
  waveOpacity?: string
  contentClassName?: string
}

export default function WaveSection({
  children,
  className = '',
  wavePosition = 'top',
  waveHeight = 400,
  waveOpacity = 'opacity-50',
  contentClassName = ''
}: WaveSectionProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Top wave */}
      {(wavePosition === 'top' || wavePosition === 'both') && (
        <WaveBackground
          height={waveHeight}
          position="top"
          className={waveOpacity}
        />
      )}

      {/* Bottom wave (flipped) */}
      {(wavePosition === 'bottom' || wavePosition === 'both') && (
        <div className="absolute inset-x-0 bottom-0 rotate-180">
          <WaveBackground
            height={waveHeight}
            position="bottom"
            className={waveOpacity}
          />
        </div>
      )}

      {/* Content */}
      <div className={`relative ${contentClassName}`}>
        {children}
      </div>
    </div>
  )
}

/**
 * WaveHero Component
 *
 * Pre-configured wave section for hero areas
 */
export function WaveHero({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <WaveSection
      className={`min-h-screen ${className}`}
      wavePosition="top"
      waveHeight={600}
      waveOpacity="opacity-60"
      contentClassName="relative z-10 flex flex-col items-center justify-center min-h-screen px-4"
    >
      {children}
    </WaveSection>
  )
}

/**
 * WaveFeatures Component
 *
 * Pre-configured wave section for feature blocks
 */
export function WaveFeatures({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <WaveSection
      className={`py-24 ${className}`}
      wavePosition="both"
      waveHeight={300}
      waveOpacity="opacity-40"
      contentClassName="relative z-10"
    >
      {children}
    </WaveSection>
  )
}