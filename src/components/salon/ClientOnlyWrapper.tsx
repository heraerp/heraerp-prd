'use client'

import React, { useEffect, useState } from 'react'

export function ClientOnlyWrapper({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return <>{children}</>
}
