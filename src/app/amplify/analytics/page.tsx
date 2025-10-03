'use client'

import { EntityPage } from '@/components/entity/EntityPage'
import { AMPLIFY_ANALYTIC_EVENT_PRESET } from '@hera/playbooks/presets/amplify'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { BarChart3 } from 'lucide-react'

export default function AmplifyAnalyticsPage() {
  const { user } = useMultiOrgAuth()

  return (
    <EntityPage
      preset={AMPLIFY_ANALYTIC_EVENT_PRESET}
      userRole={user?.role ?? 'staff'}
      title="Analytics"
      subtitle="Performance metrics from all channels"
      icon={BarChart3}
      filtersDefault={{
        include_dynamic: true,
        include_relationships: true,
        limit: 100
      }}
    />
  )
}
