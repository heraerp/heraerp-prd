'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
/**
 * HERA Salon Daily Cash Close Page
 * Smart Code: HERA.SALON.FINANCE.DAILY.CLOSE.PAGE.v1
 * 
 * Daily cash close operations for salon
 */

import React from 'react'
import DailyCashClose from '@/components/pos/DailyCashClose'

export default function SalonDailyCashClosePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-gray-900 p-6">
      <DailyCashClose />
    </div>
  )
}