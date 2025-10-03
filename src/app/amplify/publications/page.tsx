'use client'

import { EntityPage } from '@/components/entity/EntityPage'
import { AMPLIFY_PUBLICATION_PRESET } from '@hera/playbooks/presets/amplify'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Newspaper } from 'lucide-react'

export default function AmplifyPublicationsPage() {
  const { user } = useMultiOrgAuth()
  
  return (
    <EntityPage
      preset={AMPLIFY_PUBLICATION_PRESET}
      userRole={user?.role ?? 'staff'}
      title="Publications"
      subtitle="Published content across Medium, WordPress, and Substack"
      icon={Newspaper}
      filtersDefault={{ 
        include_dynamic: true, 
        include_relationships: true, 
        limit: 50 
      }}
    />
  )
}