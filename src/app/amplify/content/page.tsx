'use client'

import { EntityPage } from '@/components/entity/EntityPage'
import { AMPLIFY_CONTENT_PRESET } from '@hera/playbooks/presets/amplify'
import { useHERAAuth } from '@/components/auth'
import { FileText } from 'lucide-react'

export default function AmplifyContentPage() {
  const { user } = useHERAAuth()

  return (
    <EntityPage
      preset={AMPLIFY_CONTENT_PRESET}
      userRole={user?.role ?? 'staff'}
      title="Content Library"
      subtitle="Ingest → Optimize → Publish → Amplify"
      icon={FileText}
      filtersDefault={{
        include_dynamic: true,
        include_relationships: true,
        limit: 50
      }}
    />
  )
}
