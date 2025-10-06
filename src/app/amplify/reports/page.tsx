'use client'

import { EntityPage } from '@/components/entity/EntityPage'
import { AMPLIFY_REPORT_PRESET } from '@hera/playbooks/presets/amplify'
import { useHERAAuth } from '@/components/auth'
import { FileBarChart } from 'lucide-react'

export default function AmplifyReportsPage() {
  const { user } = useHERAAuth()

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
