'use client'

import { EntityPage } from '@/components/entity/EntityPage'
import { AMPLIFY_CAMPAIGN_PRESET } from '@hera/playbooks/presets/amplify'
import { useHERAAuth } from '@/components/auth'
import { Megaphone } from 'lucide-react'

export default function AmplifyCampaignsPage() {
  const { user } = useHERAAuth()

  return (
    <EntityPage
      preset={AMPLIFY_CAMPAIGN_PRESET}
      userRole={user?.role ?? 'staff'}
      title="Amplify Campaigns"
      subtitle="AI-powered marketing campaigns that drive engagement"
      icon={Megaphone}
      filtersDefault={{
        include_dynamic: true,
        include_relationships: true,
        limit: 50
      }}
    />
  )
}
