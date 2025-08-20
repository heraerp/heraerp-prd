'use client'

import { UniversalAuthenticatedLayout } from './UniversalAuthenticatedLayout'
import { ComponentType } from 'react'

interface WithUniversalAuthOptions {
  requiredRole?: string | string[]
  redirectTo?: string
  onboardingPath?: string
  loadingComponent?: React.ReactNode
  appName?: string
  appIcon?: React.ReactNode
  backgroundColor?: string
}

export function withUniversalAuth<P extends object>(
  Component: ComponentType<P>,
  options: WithUniversalAuthOptions = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <UniversalAuthenticatedLayout {...options}>
        <Component {...props} />
      </UniversalAuthenticatedLayout>
    )
  }
}