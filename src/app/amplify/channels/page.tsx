'use client'

import { EntityPage } from '@/components/entity/EntityPage'
import { AMPLIFY_CHANNEL_PRESET } from '@hera/playbooks/presets/amplify'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Share2 } from 'lucide-react'

export default function AmplifyChannelsPage() {
  const { user } = useMultiOrgAuth()
  
  return (
    <EntityPage
      preset={AMPLIFY_CHANNEL_PRESET}
      userRole={user?.role ?? 'staff'}
      title="Channels"
      subtitle="Configure publishing and social media channels"
      icon={Share2}
      filtersDefault={{ 
        include_dynamic: true, 
        include_relationships: true, 
        limit: 50 
      }}
    />
  )
}