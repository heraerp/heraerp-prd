'use client'

import React from 'react'

export default function PosLayout({ children }: { children: React.ReactNode }) {
  // POS pages manage their own auth/guards; avoid parent AppLayout AuthenticatedOnly redirect.
  return <>{children}</>
}

