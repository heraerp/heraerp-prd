// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { P2PDashboard } from '@/src/components/p2p/P2PDashboard'

export default function P2PPage() {
  return <P2PDashboard />
}

export const metadata = {
  title: 'Procure-to-Pay | HERA ERP',
  description: 'Complete P2P cycle management on 6 universal tables'
}
