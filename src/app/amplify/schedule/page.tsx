'use client'

import { EntityPage } from '@/components/entity/EntityPage'
import { AMPLIFY_SOCIAL_POST_PRESET } from '@hera/playbooks/presets/amplify'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Calendar } from 'lucide-react'

export default function AmplifySchedulePage() {
  const { user } = useMultiOrgAuth()

  return (
    <EntityPage
      preset={AMPLIFY_SOCIAL_POST_PRESET}
      userRole={user?.role ?? 'staff'}
      title="Social Schedule"
      subtitle="Multi-platform social media scheduling"
      icon={Calendar}
      filtersDefault={{
        include_dynamic: true,
        include_relationships: true,
        limit: 50
      }}
    />
  )
}
