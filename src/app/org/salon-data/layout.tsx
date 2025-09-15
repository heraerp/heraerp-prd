import { ReactNode } from 'react'

export default function OrgSalonDataLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// Force dynamic rendering to ensure subdomain is read correctly
export const dynamic = 'force-dynamic'
