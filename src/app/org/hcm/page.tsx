// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { HCMDashboard } from '@/components/hcm/HCMDashboard'

export default function HCMPage() {
  return <HCMDashboard />
}

export const metadata = {
  title: 'Human Capital Management | HERA ERP',
  description: 'Complete HR operations on 6 universal tables - 95% cost savings vs Workday',
}