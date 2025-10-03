'use client'

import { EntityPage } from '@/components/entity/EntityPage'
import { AMPLIFY_REPORT_PRESET } from '@hera/playbooks/presets/amplify'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { FileBarChart } from 'lucide-react'

export default function AmplifyReportsPage() {
  const { user } = useMultiOrgAuth()

  return (
    <EntityPage
      preset={AMPLIFY_REPORT_PRESET}
      userRole={user?.role ?? 'staff'}
      title="Reports"
      subtitle="White-label campaign performance reports"
      icon={FileBarChart}
      filtersDefault={{
        include_dynamic: true,
        include_relationships: true,
        limit: 50
      }}
    />
  )
}
