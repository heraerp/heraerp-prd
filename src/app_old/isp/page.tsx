// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { redirect } from 'next/navigation'

export default function ISPPage() {
  redirect('/isp/dashboard')
}
