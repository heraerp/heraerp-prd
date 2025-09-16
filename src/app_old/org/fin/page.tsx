// Force dynamic rendering
export const dynamic = 'force-dynamic'

import FINDashboard from '@/components/fin/FINDashboard'

export const metadata = {
  title: 'Financial Management | HERA',
  description: 'Complete financial management with real-time reporting and AI insights'
}

export default function FINPage() {
  return <FINDashboard />
}
