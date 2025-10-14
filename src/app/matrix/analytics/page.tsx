'use client'

import React from 'react'
import Link from 'next/link'

export default function AnalyticsIndex() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Analytics</h2>
      <div className="flex gap-3">
        <Link className="underline" href="/matrix/finance/pl">Profit & Loss</Link>
        <Link className="underline" href="/matrix/analytics/tb">Trial Balance</Link>
        <Link className="underline" href="/matrix/analytics/bs">Balance Sheet</Link>
      </div>
    </div>
  )
}

