/**
 * Setup Layout
 * Provides HERA Auth V3 for the entire setup flow
 * Smart Code: HERA.SETUP.LAYOUT.AUTH.v1
 */

'use client'

import React from 'react'

import { ReactNode } from 'react'
import { HERAAuthProviderV3 } from '@/components/auth/HERAAuthProviderV3'

interface SetupLayoutProps {
  children: ReactNode
}

export default function SetupLayout({ children }: SetupLayoutProps) {
  return (
    <HERAAuthProviderV3>
      {children}
    </HERAAuthProviderV3>
  )
}