import { Metadata } from 'next'
import { DevelopmentSidebar } from '@/components/development/DevelopmentSidebar'

export const metadata: Metadata = {
  title: 'HERA Development Matrix | Internal Dashboard',
  description: 'Complete development status and build orchestration for HERA ERP platform',
  robots: {
    index: false,
    follow: false
  }
}

export default function DevelopmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DevelopmentSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
