'use client'

import React, { useEffect } from 'react'

export function MouseGlow() {
  useEffect(() => {
    const root = document.documentElement
    const reduce =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const onMove = (e: PointerEvent) => {
      if (reduce) return
      root.style.setProperty('--mx', e.clientX + 'px')
      root.style.setProperty('--my', e.clientY + 'px')
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at var(--mx, 50vw) var(--my, 50vh), rgba(227,199,95,0.18) 0%, transparent 32%)`
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(1200px_1200px_at_20%_10%,#20242B_0%,transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_1000px_at_80%_20%,#171A1F_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0D0E10_0%,#0E1014_30%,#0C0D10_100%)]" />
    </div>
  )
}
