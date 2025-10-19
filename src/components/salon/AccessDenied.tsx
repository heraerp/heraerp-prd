/**
 * HERA DNA: Salon Access Denied Component
 * Themed access denied message using LUXE design system
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'

interface AccessDeniedProps {
  title?: string
  message?: string
  showReturnButton?: boolean
  returnPath?: string
  returnLabel?: string
}

export default function AccessDenied({
  title = 'Access Restricted',
  message = 'You do not have permission to access this page. Please contact your manager for access.',
  showReturnButton = true,
  returnPath = '/salon/dashboard',
  returnLabel = 'Return to Dashboard'
}: AccessDeniedProps) {
  const router = useRouter()

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: LUXE_COLORS.charcoal }}
    >
      <Card
        className="max-w-md w-full border-0"
        style={{ backgroundColor: LUXE_COLORS.charcoalLight }}
      >
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: LUXE_COLORS.ruby }} />
          <h3 className="text-xl mb-2" style={{ color: LUXE_COLORS.gold }}>
            {title}
          </h3>
          <p style={{ color: LUXE_COLORS.bronze }}>
            {message}
          </p>
          {showReturnButton && (
            <Button
              onClick={() => router.push(returnPath)}
              className="w-full mt-6"
              style={{
                backgroundColor: LUXE_COLORS.gold,
                color: LUXE_COLORS.charcoal
              }}
            >
              {returnLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
