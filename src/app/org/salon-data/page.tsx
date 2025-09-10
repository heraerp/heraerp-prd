'use client'

import dynamic from 'next/dynamic'

// Import the salon-data page dynamically to avoid SSR issues with headers
const SalonDataPage = dynamic(() => import('@/app/salon-data/page'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 animate-pulse shadow-lg" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-4 font-medium">Loading your salon...</p>
      </div>
    </div>
  )
})

export default function OrgSalonDataPage() {
  // The MultiOrgAuthProvider will handle getting the organization from the subdomain
  // We just need to render the salon-data page component
  return <SalonDataPage />
}